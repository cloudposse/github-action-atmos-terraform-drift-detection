const {NewSkipped} = require("../results/new-skipped");

class Skip {
    constructor(issue, state, maxNumberOpenedIssues) {
        this.issue = issue;
        this.state = state;
        this.maxNumberOpenedIssues = maxNumberOpenedIssues;
    }

    async run(octokit, context) {
        const repository = context.repo;
        return new NewSkipped(context, repository, this.maxNumberOpenedIssues, this.state);
    }

    isVisible() {
        return true
    }
}


module.exports = {
    Skip
}