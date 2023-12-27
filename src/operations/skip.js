const {None} = require("../results/none");
const {NewCreated} = require("../results/new-created");
const {NewSkipped} = require("../results/new-skipped");

class Skip {
    constructor(issue, state, maxNumberOpenedIssues) {
        this.issue = issue;
        this.state = state;
        this.maxNumberOpenedIssues = maxNumberOpenedIssues;
    }

    async run(octokit, context) {
        const repository = context.repo;
        return new NewSkipped(context.runId, repository, this.maxNumberOpenedIssues, this.state);
    }

    summary() {
        return "";
    }
}


module.exports = {
    Skip
}