import {
  DescribeImagesCommand,
  DescribeRepositoriesCommand,
  DescribeRepositoriesCommandOutput,
  ECRClient,
  ImageNotFoundException,
} from '@aws-sdk/client-ecr'
import {actionInput} from './action-input'

export const awsCredentials = {
  accessKeyId: actionInput.awsAccessKeyId,
  secretAccessKey: actionInput.awsSecretAccessKey,
}

export const ecrConfig = {
  credentials: awsCredentials,
  region: actionInput.awsRegion,
}

export const ecrClient = new ECRClient(ecrConfig)

export async function getEcrRegistry(): Promise<string> {
  const response: DescribeRepositoriesCommandOutput = await ecrClient.send(
    new DescribeRepositoriesCommand({}),
  )

  const repositoryUri: string | undefined =
    response?.repositories?.[0]?.repositoryUri?.split('/')[0]

  if (repositoryUri) {
    return repositoryUri
  } else {
    throw new Error('No repositories found')
  }
}

export async function checkIfEcrImageExists(
  repository: string,
  imageTag: string,
): Promise<void> {
  try {
    const request = new DescribeImagesCommand({
      repositoryName: repository,
      imageIds: [{imageTag}],
    })

    await ecrClient.send(request)
  } catch (e) {
    if (e instanceof ImageNotFoundException) return
  }

  throw new Error(`Image with tag ${imageTag} already exists`)
}
