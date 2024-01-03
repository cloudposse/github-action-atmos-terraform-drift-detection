class Recovered {
    constructor(runId, repository, newIssueNumber, state) {
        this.runId = runId;
        this.repository = repository;
        this.newIssueNumber = newIssueNumber;
        this.state = state;
    }

    render() {
        const slug = this.state.slug;
        const orgName = this.repository.owner;
        const repo = this.repository.repo;
        const runId = this.runId;
        const issueNumber = this.newIssueNumber;
        const component = `[${slug}](https://github.com/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug})`;
        const state = `![recovered](https://shields.io/badge/RECOVERED-brightgreen?style=for-the-badge "Recovered")`;

        const comments = this.state.error ?
            `Failure recovered. Closed issue [#${issueNumber}](https://github.com/${orgName}/${repo}/issues/${issueNumber})` :
            `Drift recovered. Closed issue [#${issueNumber}](https://github.com/${orgName}/${repo}/issues/${issueNumber})`;

        return [component, state, comments].join(" | ");
    }

}


module.exports = {
    Recovered
}