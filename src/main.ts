import * as core from "@actions/core";
import { context } from "@actions/github";
import { getEcrRegistry } from "./aws-utils";
import { format } from "date-fns";
import { Docker } from "docker-cli-js";
import { actionInput } from "./action-input";
import {buildDocker, DockerBuild, publishDocker} from './docker-utils'

async function run(): Promise<void> {
  const registry: string = await getEcrRegistry();
  const imageTag: string = createImageTag();

  const docker: Docker = new Docker();
  const builds: DockerBuild[] = actionInput.targets.map((targetInput) => {
    return {
      imageTag: imageTag,
      ...targetInput
    };
  });

  // Build all images before publishing, to reduce likelihood of partial success
  for (const build of builds) {
    await buildDocker(docker, registry, imageTag, build);
  }

  // If any of the images fail to publish, the run will be marked as failed,
  // but the remaining images will still be uploaded.
  // This will allow the action to recover from a previous failure by uploading
  // the remaining images, even in cases where image tags are immutable (which
  // will make images that have succeeded in previous runs to fail).
  let hasErrors = false;
  for (const build of builds) {
    try {
      await publishDocker(docker, registry, build);
    } catch (e: any) {
      core.error(e.message);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    core.setFailed("Failed to publish Docker image");
  }
}

function createImageTag(): string {
  const shortSha: string = context.sha.substring(0, 7);
  const timestamp: string = format(new Date(), "yyyyMMdd-HHmm");
  return `${actionInput.tagPrefix}${timestamp}-${shortSha}`;
}

try {
  run();
} catch (error) {
  if (error instanceof Error) {
    core.setFailed(error.message);
  }
}
