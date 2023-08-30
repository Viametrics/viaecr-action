import {Docker} from 'docker-cli-js'
import {actionInput} from './action-input'
import {checkIfEcrImageExists} from './aws-utils'
import * as core from '@actions/core'

export interface DockerBuild {
  target?: string;
  repo: string;
  imageTag: string;
}

function fullImageTag(
  registry: string,
  build: DockerBuild,
  ) {
  const { repo, imageTag } = build;
  return `${registry}/${repo}:${imageTag}`;
}

export async function buildDocker(
  docker: Docker,
  registry: string,
  imageTag: string,
  build: DockerBuild,
) {
  setBuildKitEnv();
  const { repo, target } = build;
  const { buildArgs, dockerfile } = actionInput;
  await checkIfEcrImageExists(repo, imageTag);

  const dockerBuild = [
    `build ${buildArgs}`,
    `-t ${fullImageTag(registry, build)}`,
    target ? `--target ${target}` : '',
    `-f ./${dockerfile}`,
    '.'
  ].join(' ');
  await docker.command(dockerBuild);
}

export async function publishDocker(
  docker: Docker,
  registry: string,
  build: DockerBuild,
) {
  await docker.command(`push ${fullImageTag(registry, build)}`);
}

function setBuildKitEnv() {
  core.exportVariable(
    "DOCKER_BUILDKIT",
    actionInput.disableBuildkit ? "0" : "1",
  );

  if (actionInput.disableBuildkit) {
    core.exportVariable("BUILDKIT_PROGRESS", "plain");
  }
}
