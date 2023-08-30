import * as core from "@actions/core";
import { context } from "@actions/github";
import { checkIfEcrImageExists, getEcrRegistry } from "./aws-utils";
import { format } from "date-fns";
import { Docker } from "docker-cli-js";
import { actionInput } from "./action-input";

async function run(): Promise<void> {
  const registry: string = await getEcrRegistry();
  const dockerfile: string = actionInput.dockerfile;

  const repository: string = actionInput.repository;
  const imageTag: string = createImageTag();
  await checkIfEcrImageExists(repository, imageTag);

  // Build and push image
  const regRepoImg = `${registry}/${repository}:${imageTag}`;
  const dockerBuild = `build ${actionInput.buildArgs} -t ${regRepoImg} -f ./${dockerfile} .`;

  // Enable or disable buildkit
  core.exportVariable(
    "DOCKER_BUILDKIT",
    actionInput.disableBuildkit ? "0" : "1",
  );

  const docker = new Docker();
  await docker.command(dockerBuild);
  await docker.command(`push ${regRepoImg}`);
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
