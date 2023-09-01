<!-- markdownlint-disable -->

## Inputs

| Name | Description | Default | Required |
|------|-------------|---------|----------|
| assignee-teams | Comma-separated list of teams to assign issues to. You have to pass github token with `read:org` scope. This is used only when issue is getting created. |  | false |
| assignee-users | Comma-separated list of users to assign issues to. This is used only when issue is getting created. |  | false |
| debug | Enable action debug mode. Default: false | false | false |
| issue-labels | Comma separated list of labels to add to the drift issues. Default: drift | drift | false |
| max-opened-issues | Number of open drift detection issues. Use `-1` to open unlimited number of issues. Default: 10 | 10 | false |
| token | Used to pull node distributions for Atmos from Cloud Posse's GitHub repository. Since there's a default, this is typically not supplied by the user. When running this action on github.com, the default value is sufficient. When running on GHES, you can pass a personal access token for github.com if you are experiencing rate limiting. | ${{ github.server\_url == 'https://github.com' && github.token \|\| '' }} | false |


<!-- markdownlint-restore -->
