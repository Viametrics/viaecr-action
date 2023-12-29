import * as core from '@actions/core'
import { context } from '@actions/github'
import { getEcrRegistry } from './aws-utils'
import { Docker } from 'docker-cli-js'
import { actionInput, TargetInput } from './action-input'
import { buildDocker, DockerBuild, publishDocker } from './docker-utils'
import { execSync } from 'node:child_process'

async function run(): Promise<void> {
  const registry: string = await getEcrRegistry();
  const imageTag: string = await createImageTag();

  const docker = new Docker();
  const builds: DockerBuild[] = actionInput.targets
    .map((targetInput: TargetInput) => ({ imageTag, ...targetInput }));

  // Build all images before publishing, to reduce likelihood of partial success
  for (const build of builds) {
    await buildDocker(docker, registry, imageTag, build);
  }

  // If any of the images fail to publish, the run will be marked as failed,
  // but the remaining images will still be uploaded.
  // This will allow the action to recover from a previous failure by uploading
  // the remaining images, even in cases where image tags are immutable (which
  // will make images that have succeeded in previous runs to fail).
  let hasErrors: boolean = false;
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

async function createImageTag(): Promise<string> {
  const shortSha: string = context.sha.substring(0, 7);
  const timestamp: string = getTimeStamp();
  return `${actionInput.tagPrefix}${timestamp}-${shortSha}`;
}

function getTimeStamp(): string {
  const commitDateISO = execSync('git show -s --format=%ci HEAD').toString().trim();
  return execSync(`date -u -d "${commitDateISO}" +'%Y%m%d-%H%M'`).toString().trim();
}

try {
  run();
} catch (error) {
  if (error instanceof Error) {
    core.setFailed(error.message);
  }
}
