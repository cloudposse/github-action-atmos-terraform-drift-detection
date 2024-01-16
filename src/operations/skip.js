const {NewSkipped} = require("../results/new-skipped");
const {readFileSync} = require("fs");
const {getFileName} = require("../utils");

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

    summary() {
        const file_name = getFileName(this.state.slug);
        const file = `step-summary-${file_name}.md`;
        return readFileSync(file, 'utf-8');
    }

    shortSummary() {
        const component = this.state.metadata.component;
        const stack = this.state.metadata.stack;
        const title = this.state.error ?
          `## Plan Failed for \`${component}\` in \`${stack}\`` :
          `## Changes Found for \`${component}\` in \`${stack}\``;
        const body = `Summary is unavailable due to [GitHub size limitation](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#step-isolation-and-limits) on job summaries. Please check the GitHub Action run logs for more details.`
        return [title, body].join("\n");
    }
}


module.exports = {
    Skip
}