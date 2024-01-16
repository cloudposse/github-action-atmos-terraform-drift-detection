class Exists {
    constructor(context, repository, newIssueNumber, state) {
        this.runId = context.runId;
        this.prMode = context.payload.pull_request != null
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
        const component = `[${slug}](/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug})`;

        let state = null;
        if (this.prMode) {
            state = this.state.error ?
              '![needs fix](https://shields.io/badge/NEEDS%20FiX-ff0000?style=for-the-badge "needs fix")' :
              '![needs apply](https://shields.io/badge/NEEDS%20APPLY-important?style=for-the-badge "needs apply")';
        } else {
            state = this.state.error ?
              '![failed](https://shields.io/badge/FAILED-ff0000?style=for-the-badge "Failed")' :
              '![drifted](https://shields.io/badge/DRIFTED-important?style=for-the-badge "Drifted")';
        }

        const comments = this.state.error ?
            `Failure detected. Issue already exists [#${issueNumber}](/${orgName}/${repo}/issues/${issueNumber})` :
            `Drift detected. Issue already exists [#${issueNumber}](/${orgName}/${repo}/issues/${issueNumber})`;

        return [component, state, comments].join(" | ");
    }

}


module.exports = {
    Exists
}