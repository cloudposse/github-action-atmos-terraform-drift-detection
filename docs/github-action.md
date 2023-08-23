<!-- markdownlint-disable -->

## Inputs

| Name | Description | Default | Required |
|------|-------------|---------|----------|
| component | The name of the component to plan. | N/A | false |
| component-path | The path to the base component. Atmos defines this value as component\_path. | N/A | false |
| debug | Enable action debug mode. Default: false | false | false |
| issue-description | Issue description | N/A | false |
| issue-labels | Comma separated list of labels to add to the drift issues. Default: drift | drift | false |
| issue-number | Issue number | N/A | false |
| issue-title | Issue title | N/A | false |
| max-issues | Number of open drift detection issues. Default: 10 | 10 | false |
| mode | Drift detection mode. One of ['triage','create-gh-issue','update-gh-issue'] | N/A | true |
| stack | The stack name for the given component. | N/A | false |
| token | Used to pull node distributions for Atmos from Cloud Posse's GitHub repository. Since there's a default, this is typically not supplied by the user. When running this action on github.com, the default value is sufficient. When running on GHES, you can pass a personal access token for github.com if you are experiencing rate limiting. | ${{ github.server\_url == 'https://github.com' && github.token \|\| '' }} | false |


## Outputs

| Name | Description |
|------|-------------|
| components-with-issues | A matrix for components that have issues |
| components-without-issues | A matrix for components that do not have issues |
<!-- markdownlint-restore -->
