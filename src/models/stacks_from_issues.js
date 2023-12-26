const getMetadataFromIssueBody = (body) => {
    const regex = /```json\s([\s\S]+?)\s```/;
    const matched = body.match(regex);

    if (matched && matched[1]) {
        return JSON.parse(matched[1]);
    } else {
        throw new Error("Invalid metadata in the issue description");
    }
}

class StackFromIssue {
    constructor(issue) {
        const metadata = getMetadataFromIssueBody(issue.body);
        this.metadata = metadata;
        this.error = issue.title.startsWith('Failure Detected in');
        this.slug = `${metadata.stack}-${metadata.component}`;
        this.number = issue.number;
    }
}


module.exports = {
    StackFromIssue
}