<!-- markdownlint-disable -->

## Inputs

| Name | Description | Default | Required |
|------|-------------|---------|----------|
| atmos-config-path | The path to the atmos.yaml file | atmos.yaml | false |
| atmos-version | Atmos version to use for vendoring. Default 'latest' | latest | false |
| aws-region | AWS region for assuming identity. | us-east-1 | false |
| component | The name of the component to plan. | N/A | false |
| component-path | The path to the base component. Atmos defines this value as component\_path. | N/A | false |
| debug | Enable action debug mode. Default: false | false | false |
| issue-labels | Comma separated list of labels to add to the drift issues. Default: drift | drift | false |
| max-new-issues-to-create | Number of new issues to create at once. Default: 10 | 10 | false |
| mode | Drift detection mode. One of ['triage','create\_issue','update\_issue'] | N/A | true |
| stack | The stack name for the given component. | N/A | false |
| terraform-plan-role | The AWS role to be used to plan Terraform. | N/A | false |
| terraform-state-bucket | The S3 Bucket where the planfiles are stored. | N/A | false |
| terraform-state-role | The AWS role to be used to retrieve the planfile from AWS. | N/A | false |
| terraform-state-table | The DynamoDB table where planfile metadata is stored. | N/A | true |
| terraform-version | The version of Terraform CLI to install. Instead of full version string you can also specify constraint string starting with "<" (for example `<1.13.0`) to install the latest version satisfying the constraint. A value of `latest` will install the latest version of Terraform CLI. Defaults to `latest`. | latest | false |
| token | Used to pull node distributions for Atmos from Cloud Posse's GitHub repository. Since there's a default, this is typically not supplied by the user. When running this action on github.com, the default value is sufficient. When running on GHES, you can pass a personal access token for github.com if you are experiencing rate limiting. | ${{ github.server\_url == 'https://github.com' && github.token \|\| '' }} | false |


## Outputs

| Name | Description |
|------|-------------|
| components-with-issues | A matrix for components that have issues |
| components-without-issues | A matrix for components that do not have issues |
<!-- markdownlint-restore -->
