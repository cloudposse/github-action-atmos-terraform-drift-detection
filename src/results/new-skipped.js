class NewSkipped {
    constructor(context, repository, maxNumberOpenedIssues, state) {
        this.runId = context.runId;
        this.prMode = context.payload.pull_request != null
        this.repository = repository;
        this.maxNumberOpenedIssues = maxNumberOpenedIssues;
        this.state = state;
    }

    render() {
        const slug = this.state.slug;
        const orgName = this.repository.owner;
        const repo = this.repository.repo;
        const runId = this.runId;
        const maxOpenedIssues = this.maxNumberOpenedIssues;
        const component = `[${slug}](/${orgName}/${repo}/actions/runs/${runId}#user-content-result-${slug})`;

        let state = null;
        if (this.prMode) {
            state = this.state.error ?
              '![NEEDS FiX](https://shields.io/badge/FAILED-ff0000?style=for-the-badge "Failed")' :
              '![NEEDS APPLY](https://shields.io/badge/DRIFTED-important?style=for-the-badge "Drifted")';
        } else {
            state = this.state.error ?
              '![failed](https://shields.io/badge/FAILED-ff0000?style=for-the-badge "Failed")' :
              '![drifted](https://shields.io/badge/DRIFTED-important?style=for-the-badge "Drifted")';
        }

        const comments = this.state.error ?
            `Failure detected. Issue was not created because maximum number of created issues ${maxOpenedIssues} reached` :
            `Drift detected. Issue was not created because maximum number of created issues ${maxOpenedIssues} reached`;

        return [component, state, comments].join(" | ");
    }

}


module.exports = {
    NewSkipped
}