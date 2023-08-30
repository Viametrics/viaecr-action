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

## Usage
Use in combination with checkout, configure aws credentials and login to ECR actions.
See example workflow below.

| Name               | Description                                                          | Required? | Default      |
|--------------------|----------------------------------------------------------------------|-----------|--------------|
| `targets`          | List of targets, see section below.                                  | yes       | n/a          |
| `build-args`       | JSON object used as keys and values to pass as build args to Docker. | no        | n/a          |
| `disable-buildkit` | If set to true/yes, set DOCKER_BUILDKIT=0 (otherwise 1)              | no        | 'false'      |
| `tag-prefix`       | Adds a prefix for the tags, e.g. 'MANUAL'.                           | no        | ''           |
| `dockerfile`       | Path to the Dockerfile to build.                                     | no        | 'Dockerfile' |

### Targets
The `targets` key can either be a single target or a list of targets.

A target is a JSON object which has to have a `repo` and may optionally have a `target`.:
```ts
interface TargetInput {
  target?: string;
  repo: string;
}
```
The repository is which ECR repository the image will be pushed to, and the target (if specified) is passed as
`docker build --target ${targetInput.target}`. This allows you to produce multiple images in a single run, which
in turn allows Docker to reuse early build stages for multiple images.

#### Examples
Single target input with no `--target`:
`targets: '{ "repo": "repository1" }'`
`targets: '[{ "repo": "repository1" }]'`

Single target input with `--target myTarget`:
`targets: '{ "repo": "repository1", "target": "myTarget" }'`
`targets: '[{ "repo": "repository1", "target": "myTarget" }]'`

Multiple targets:
```yaml
targets: |
  [
    { "repo": "repository1", "target": "target1" },
    { "repo": "repository2", "target": "target2" }
  ]
```

### Build args
A JSON object used as keys and values to pass as build args to Docker. For example if you pass the string
`{"banana": "yellow", "coconut": "brown"}` as the value of `build-args`, the action will run with the following
additional arguments: `--build-arg banana=yellow --build-arg coconut=brown`.

### Example
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
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.SECRET_KEY }}
          aws-region: eu-west-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
        with:
          mask-password: 'true'

      - name: Run the ViaECR action
        uses: Viametrics/viaecr-action@v1
        with:
          dockerfile: multistage.Dockerfile
          disable-buildkit: 'false' # default value
          tagPrefix: "MANUAL-"
          # First target will build --target 'myTarget', and push to 'repository1'
          # Second target will build without any --target, and push to 'repository2'
          targets: |
            [
              { "repo": "repository1", "target": "myTarget" },
              { "repo": "repository2" }
            ]
          build-args: |
            {
              "coconut": "${{ secrets.COCONUT }}",
              "banana": "${{ secrets.BANANA }}",
            }
```

## Development
`npm install && npm run build && npm run package`, or just `npm run all` if you're lazy. There's
a GitHub Action that will verify that you've built the action.
