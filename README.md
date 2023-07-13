# ViaECR GitHub Action
Builds and publishes a Dockerfile to ECR with a standardised image tag. The standardised tag name
is `YYYYmmdd-HHMM-${short_SHA}`, e.g. `20210609-0609-abc123`.

## Build
`npm install && npm run build && npm run package`, or just `npm run all` if you're lazy. There's
a Github Action that will verify that you've built the action.
