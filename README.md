# ViaECR GitHub Action

Builds and publishes a Dockerfile to ECR with a standardised image tag. The standardised tag name
is `YYYYmmdd-HHMM-${short_SHA}`, e.g. `20210609-0609-abc123`.

The workflow will require that:

- You've run `actions/checkout`
- You've configured AWS credentials (`aws-actions/configure-aws-credentials`)
- You're pushing to an ECR repository
- You've logged in to ECR (`aws-actions/amazon-ecr-login`) or you don't need to login
- You're fine with the build context being the root of the repository

The workflow will assume that:

- You don't want to prefix the tag with anything, but if you do, you can specify a `tagPrefix`
- You want to use `./Dockerfile`, but if not you can specify a `dockerfile`

## Build

`npm install && npm run build && npm run package`, or just `npm run all` if you're lazy. There's
a GitHub Action that will verify that you've built the action.

## Usage

Use in combination with checkout, configure aws credentials and login to ECR actions.

Example workflow:

```yaml
name: Build Server and Push to ECR

on:
  push:
    branches: ["main"]

jobs:
  publish-docker:
    runs-on: ubuntu-22.04

    steps:
      - name: Check out code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.SECRET_KEY }}
          aws-region: eu-west-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Run the ViaECR action
        uses: Viametrics/viaecr-action@v1
        with:
          repository: myrepository
          tagPrefix: "TEST-"
          buildArgs: |
            {
              "coconut": "${{ secrets.COCONUT }}",
              "banana": "${{ secrets.BANANA }}",
            }
```
