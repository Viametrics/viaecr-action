import * as core from "@actions/core";

export interface ActionInput {
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  dockerfile: string;
  buildArgs: string;
  disableBuildkit: boolean;
  tagPrefix: string;
  targets: TargetInput[];
}

export interface TargetInput {
  target?: string;
  repo: string;
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function parseBuildArgs(): string {
  try {
    const raw = core.getInput("build-args");
    if (!raw) return "";

    return Object.entries(JSON.parse(raw))
      .map(([key, value]) => `--build-arg ${key}=${value}`)
      .join(" ");
  } catch (e) {
    if (e instanceof Error) {
      core.error(`Failed to parse buildArgs: ${e.message}`);
    } else {
      core.error("Failed to parse buildArgs");
    }

    return "";
  }
}

function parseTargets(): TargetInput[] {
  const raw = core.getInput("targets");

  if (!raw) {
    core.setFailed("No targets specified");
    process.exit(1);
  }

  let targets: TargetInput[] = [];

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      targets = parsed; // Multiple targets
    } else if (typeof parsed === 'object') {
      targets = [parsed]; // Single target
    } else {
      core.setFailed("Invalid input format for targets");
      process.exit(1);
    }

    // Validation if needed, e.g., check if each object has a 'repository' field.
    for (const target of targets) {
      if (!target.repo) {
        core.setFailed("'repo' field is mandatory for all targets");
        process.exit(1);
      }
    }
  } catch (e) {
    core.setFailed("Failed to parse targets");
    process.exit(1);
  }

  return targets;
}

function getInputAsBoolean(name: string): boolean {
  let input = core.getInput(name).toLowerCase();
  return input === "true" || input === "1" || input === "yes" || input === "y";
}

export const actionInput: ActionInput = {
  awsAccessKeyId: getEnv("AWS_ACCESS_KEY_ID"),
  awsSecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY"),
  awsRegion: getEnv("AWS_REGION"),
  dockerfile: core.getInput("dockerfile"),
  tagPrefix: core.getInput("tag-prefix"),
  disableBuildkit: getInputAsBoolean("disable-buildkit"),
  buildArgs: parseBuildArgs(),
  targets: parseTargets(),
};
