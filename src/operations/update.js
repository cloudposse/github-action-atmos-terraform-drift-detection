const core = require("@actions/core");
const {readFileSync} = require("fs");
const {Exists} = require("../results/exists");

class Update {
    constructor(issue, state, labels) {
        this.issue = issue;
        this.state = state;
        this.labels = labels;
    }

    async run(octokit, context) {
        const repository = context.repo;

        const slug = this.state.slug;
        const file_name = slug.replace("/", "_")
        const issueTitle = this.state.error ? `Failure Detected in \`${slug}\`` : `Drift Detected in \`${slug}\``;
        const issueDescription = readFileSync(`issue-description-${file_name}.md`, 'utf8');
        const issueNumber = this.issue.number;
        const label = this.state.error ? "error" : "drift"

        octokit.rest.issues.update({
            ...repository,
            issue_number: issueNumber,
            title: issueTitle,
            body: issueDescription,
            labels: [label].concat(this.labels)
        });

        core.info(`Updated issue: ${issueNumber}`);

        return new Exists(context.runId, repository, issueNumber, this.state)
    }

    summary() {
        const file_name = this.state.slug.replace("/", "_")
        const file = `step-summary-${file_name}.md`;
        return readFileSync(file, 'utf-8');
    }

    shortSummary() {
        const component = this.state.metadata.component;
        const stack = this.state.metadata.stack;
        return this.state.error ?
          `## Plan Failed for \`${component}\` in \`${stack}\`` :
          `## Changes Found for \`${component}\` in \`${stack}\``;
    }
}


module.exports = {
    Update
}