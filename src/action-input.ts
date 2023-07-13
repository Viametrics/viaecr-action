import * as core from '@actions/core'

export interface ActionInput {
  awsAccessKeyId: string
  awsSecretAccessKey: string
  awsRegion: string
  repository: string
  dockerfile: string
  buildArgs: string
  tagPrefix: string
}

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

function parseBuildArgs(): string {
  try {
    const raw = core.getInput('buildArgs')
    if (!raw) return ''

    return Object.entries(JSON.parse(raw))
      .map(([ key, value ]) => `--build-arg ${key}=${value}`)
      .join(' ')
  } catch (e) {
    if (e instanceof Error) {
      core.error(`Failed to parse buildArgs: ${e.message}`)
    } else {
      core.error('Failed to parse buildArgs')
    }

    return ''
  }
}

export const actionInput: ActionInput = {
  awsAccessKeyId: getEnv('AWS_ACCESS_KEY_ID'),
  awsSecretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY'),
  awsRegion: getEnv('AWS_REGION'),
  repository: core.getInput('repository'),
  dockerfile: core.getInput('dockerfile'),
  tagPrefix: core.getInput('tagPrefix'),
  buildArgs: parseBuildArgs(),
}

export const awsCredentials = {
  accessKeyId: core.getInput('awsAccessKeyId'),
  secretAccessKey: core.getInput('awsSecretAccessKey'),
}
