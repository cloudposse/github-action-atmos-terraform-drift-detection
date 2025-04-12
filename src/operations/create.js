const core = require("@actions/core");
const {NewCreated} = require("../results/new-created");
const {readFileSync} = require("fs");
const {getFileName} = require("../utils");
const {wrapWithRetry} = require("../utils/retry");

class Create {
    constructor(state, users, labels) {
        this.state = state;
        this.users = users;
        this.labels = labels;
    }

    async run(octokit, context) {
        const repository = context.repo;

        const orgName = repository.owner;
        const repo = repository.repo;
        const runId = context.runId;

        const slug = this.state.slug;
        const issueTitle = this.state.error ? `Failure Detected in \`${slug}\`` : `Drift Detected in \`${slug}\``;
        const file_name = getFileName(slug);
        const issueDescription = readFileSync(`issue-description-${file_name}.md`, 'utf8');

        const body = [
            issueDescription,
            "# Related",
            `* [:building_construction: Action Workflow Logs](/${orgName}/${repo}/actions/runs/${runId})`
        ]

        if (context.payload.pull_request != null) {
            body.push(`* #${context.payload.pull_request.number}`);
        }

        const label = this.state.error ? "error" : "drift"
        let issueNumber;

        try {
            const newIssue = await wrapWithRetry(() =>
                octokit.rest.issues.create({
                    ...repository,
                    title: issueTitle,
                    body: body.join("\n"),
                    labels: [label].concat(this.labels)
                })
            );

            issueNumber = newIssue.data.number;

            core.info(`Created new issue with number ${issueNumber} for ${slug}`);
        } catch (error) {
            core.error(`Failed to create issue for ${slug}:\n\t${error.message}`);
            throw error;
        }

        if (this.users.length > 0) {
            try {
                await wrapWithRetry(() =>
                    octokit.rest.issues.addAssignees({
                        ...repository,
                        issue_number: issueNumber,
                        assignees: this.users
                    })
                );
            } catch (error) {
                core.error(`Failed to associate user to an issue. Error ${error.message}`);
            }
        }

        return new NewCreated(context, repository, issueNumber, this.state);
    }

    isVisible() {
        return true
    }
}


module.exports = {
    Create
}