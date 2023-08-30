import {Docker} from 'docker-cli-js'
import {actionInput} from './action-input'
import {checkIfEcrImageExists} from './aws-utils'
import * as core from '@actions/core'

export interface DockerBuild {
  target?: string;
  imageTag: string;
}

export async function buildDocker(
  docker: Docker,
  registry: string,
  build: DockerBuild,
) {
  setBuildKitEnv();
  const { imageTag } = build;
  const { repository, buildArgs, dockerfile } = actionInput;

  await checkIfEcrImageExists(repository, build.imageTag);
  const regRepoImg = `${registry}/${repository}:${imageTag}`;
  const dockerBuild = `build ${buildArgs} -t ${regRepoImg} -f ./${dockerfile} .`;
  await docker.command(dockerBuild);
}

export async function publishDocker(
  docker: Docker,
  registry: string,
  build: DockerBuild,
) {
  const { imageTag } = build;
  const { repository } = actionInput;
  const regRepoImg = `${registry}/${repository}:${imageTag}`;
  await docker.command(`push ${regRepoImg}`);
}

function setBuildKitEnv() {
  core.exportVariable(
    "DOCKER_BUILDKIT",
    actionInput.disableBuildkit ? "0" : "1",
  );
}
