class Exists {
    constructor(context, repository, newIssueNumber, state) {
        this.runId = context.runId;
        this.repository = repository;
        this.newIssueNumber = newIssueNumber;
        this.state = state;
    }

    render(commentMode) {
        const slug = this.state.slug;
        const orgName = this.repository.owner;
        const repo = this.repository.repo;
        const runId = this.runId;
        const issueNumber = this.newIssueNumber;

        if (commentMode) {
            return `* #${issueNumber} (issue updated)`
        }

        const component = `[${slug}](/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug})`;

        const state = this.state.error ?
          '![failed](https://shields.io/badge/FAILED-ff0000?style=for-the-badge "Failed")' :
          '![drifted](https://shields.io/badge/DRIFTED-important?style=for-the-badge "Drifted")';

        const comments = this.state.error ?
            `Failure detected. Issue already exists [#${issueNumber}](/${orgName}/${repo}/issues/${issueNumber})` :
            `Drift detected. Issue already exists [#${issueNumber}](/${orgName}/${repo}/issues/${issueNumber})`;

        return [component, state, comments].join(" | ");
    }

}


module.exports = {
    Exists
}