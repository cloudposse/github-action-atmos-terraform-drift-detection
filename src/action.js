const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
const {DefaultArtifactClient} = require('@actions/artifact')
const {StackFromIssue, getMetadataFromIssueBody} = require("./models/stacks_from_issues");
const {Skip} = require("./operations/skip");
const {Update} = require("./operations/update");
const {Close} = require("./operations/close");
const {Remove} = require("./operations/remove");
const {Create} = require("./operations/create");
const {Nothing} = require("./operations/nothing");
const {StackFromArchive} = require("./models/stacks_from_archive");
const {readFileSync} = require("fs");
const {Minimatch} = require('minimatch');

const downloadArtifacts = async (artifactPattern) => {
  try {
    const artifactClient = new DefaultArtifactClient();

    // List all artifacts
    const listArtifactResponse = await artifactClient.listArtifacts({
      latest: true
    });

    // Filter artifacts by provided artifact name
    const matcher = new Minimatch(artifactPattern);
    const artifacts = listArtifactResponse.artifacts.filter(artifact =>
      matcher.match(artifact.name)
    );

    if (artifacts.length === 0) {
      throw new Error(`No artifacts found matching pattern '${artifactPattern}'`);
    }

    // Downloading all matching artifacts
    console.log("Attempting to download artifact(s)");
    const downloadDirectory = '.';
    const downloadPromises = await artifacts.map(artifact =>
      artifactClient.downloadArtifact(artifact.id, {
        path: downloadDirectory
      })
    );

    console.info(`Artifacts matching ${artifactPattern} downloaded to ${downloadDirectory}`);
    return downloadDirectory;
  } catch (error) {
    console.error(`Error downloading artifacts: ${error.message}`);
    throw error;
  }
};

const mapOpenGitHubIssuesToComponents = async (octokit, context, labels) => {
  const repository = context.repo;

  const listIssues = async (per_page, page, result) => {
    const response = await octokit.rest.issues.listForRepo({
      ...repository,
      state: 'open',
      labels: labels,
      per_page,
      page
    });

    if (response.data.length === 0) {
      return result
    }

    const driftDetectionIssues = response.data.filter(
      issue => issue.title.startsWith('Drift Detected in') || issue.title.startsWith('Failure Detected in')
    ).filter(
      issue => getMetadataFromIssueBody(issue.body) !== null
    );

    const result_partition = driftDetectionIssues.map(issue => {
      return new StackFromIssue(issue);
    })

    return await listIssues(per_page, page + 1, result.concat(result_partition))
  }

  let per_page = 100; // Max allowed value per page
  let result = await listIssues(per_page, 1, [])
  return new Map(result.map(
    (stackFromIssue) => {
      return [stackFromIssue.slug, stackFromIssue]
    }
  ))
}

const mapArtifactToComponents = (path) => {
  const files = fs.readdirSync(path);
  const metadataFiles = files.filter(file => file.endsWith('metadata.json'));
  const result = metadataFiles.map(
    (file) => {
      const metadata = JSON.parse(fs.readFileSync(file, 'utf8'));

      const stackFromArchive = new StackFromArchive(metadata);
      return [stackFromArchive.slug, stackFromArchive]
    }
  )
  return new Map(result)
}

const getOperationsList = (stacksFromIssues, stacksFromArtifact, users, labels, maxOpenedIssues, processAll) => {

  const stacks = processAll ?
    [...stacksFromIssues.keys(), ...stacksFromArtifact.keys()] :
    [...stacksFromArtifact.keys()]
  const slugs = [...new Set(stacks)]  // get unique set

  const operations = slugs.map((slug) => {
    const issue = stacksFromIssues.get(slug)
    const state = stacksFromArtifact.get(slug)
    if (issue && state) {
      if (state.error || state.drifted) {
        const commitSHA = issue.metadata.commitSHA;
        const currentSHA = "${{ github.sha }}";

        return currentSHA === commitSHA ? new Skip(issue, state) : new Update(issue, state, labels)
      }
      return new Close(issue, state)

    } else if (issue) {
      return new Remove(issue)
    } else if (state && (state.error || state.drifted)) {
      return new Create(state, users, labels)
    }

    return new Nothing()
  })

  const openedIssuesCounts = operations.filter((operation) => {
    return operation instanceof Update
  }).length

  const numberOfMaximumPotentialIssuesThatCanBeCreated = Math.max(0, maxOpenedIssues - openedIssuesCounts);
  // If maxOpenedIssues is negative then it will not limit the number of issues to create
  let numOfIssuesToCreate = Math.min(numberOfMaximumPotentialIssuesThatCanBeCreated, maxOpenedIssues);

  return operations.map((operation) => {
    if (operation instanceof Create) {
      if (numOfIssuesToCreate > 0) {
        numOfIssuesToCreate -= 1
      } else if (numOfIssuesToCreate === 0) {
        return new Skip(operation.issue, operation.state, maxOpenedIssues);
      }
    }

    return operation
  })
}

const convertTeamsToUsers = async (octokit, orgName, teams) => {
  let users = [];

  if (teams.length === 0) {
    console.log("No users to assign issue with. Skipping ...");
  } else {
    try {
      let usersFromTeams = [];

      for (let i = 0; i < teams.length; i++) {
        const response = await octokit.rest.teams.listMembersInOrg({
          org: orgName,
          team_slug: teams[i]
        });

        const usersForCurrentTeam = response.data.map(user => user.login);
        usersFromTeams = usersFromTeams.concat(usersForCurrentTeam);
      }

      users = users.concat(usersFromTeams);
      users = [...new Set(users)]; // get unique set
    } catch (error) {
      core.error(`Failed to associate user to an issue. Error ${error.message}`);
      users = [];
    }
  }

  return users;
}

const driftDetectionTable = (results) => {

  const table = [
    `| Component | State | Comments |`,
    `|-----------|-------|----------|`
  ]

  const tableContent = results.map((result) => {
    return result.render()
  }).filter((result) => {
    return result !== ""
  })

  if (tableContent.length > 2) {
    return ['# Drift Detection Summary', table.concat(tableContent).join("\n")]
  }

  return []
}

const postSummaries = async (table, components) => {
  // GitHub limits summary per step to 1MB
  // https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#step-isolation-and-limits
  const maximumLength = Math.pow(2, 20);
  let totalLength = 0;
  let currentLength = 0;

  totalLength += table.join("\n").length
  let summary = core.summary.addRaw(table.join("\n"), true)

  const componentsWithSummary = components.map((component) => {
    const fullSummary = component.summary()
    const shortSummary = component.shortSummary()

    totalLength += fullSummary.length

    return {
      totalLength: totalLength,
      fullSummary: fullSummary,
      shortSummary: shortSummary
    }
  }).filter((item) => {
    return item.fullSummary !== ""
  }).reverse().map((item) => {
    if (item.totalLength + currentLength <= maximumLength) {
      return item.fullSummary
    }
    currentLength += item.shortSummary.length
    return item.shortSummary
  }).reverse()


  componentsWithSummary.forEach((item) => {
    summary.addRaw(item, true)
  })

  await summary.write();
}

const postComment = async (octokit, context, table) => {
  const commentId = "github-action-atmos-terraform-drift-detection-comment"
  // Suffix comment with hidden value to check for updating later.
  const commentIdSuffix = `<!-- purpose="github-action-atmos-terraform-drift-detection-comment" value="${commentId}" -->`;

  const existingCommentId = await octokit.rest.issues.listComments({
    ...context.repo,
    issue_number: context.payload.pull_request.number,
  }).then( result => {
    return result.data.filter(item => {
      return item.body.includes(commentIdSuffix)
    }).map(item => { return item.id }).pop()
  })

  const commentBody = table.join("\n") + `\n\n\n` + commentIdSuffix;
  // If comment already exists, get the comment ID.
  if (existingCommentId) {
    console.log("Update comment")
    await octokit.rest.issues.updateComment({
      ...context.repo,
      comment_id: existingCommentId,
      body: commentBody
    })
  } else {
    console.log("Create comment")
    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: context.payload.pull_request.number,
      body: commentBody
    });
  }
}

/**
 * @param {Object} octokit
 * @param {Object} context
 * @param {Object} parameters
 */
const runAction = async (octokit, context, parameters) => {
  const {
    maxOpenedIssues = 0,
    assigneeUsers = [],
    assigneeTeams = [],
    labels = [],
    processAll = false,
  } = parameters;

  const stacksFromArtifact = await downloadArtifacts("metadata").then(
    (path) => {
      return mapArtifactToComponents(path)
    }
  )

  const stacksFromIssues = await mapOpenGitHubIssuesToComponents(octokit, context, labels);

  const usersFromTeams = await convertTeamsToUsers(octokit, context.repo.owner, assigneeTeams);
  let users = assigneeUsers.concat(usersFromTeams);
  users = [...new Set(users)]; // get unique set

  const operations = getOperationsList(stacksFromIssues, stacksFromArtifact, users, labels, maxOpenedIssues, processAll)
    .filter(item => item.isVisible())

  const assets_path = path.resolve(__dirname + '/../assets')

  if (context.payload.pull_request != null) {
    const fileName = operations.length > 0 ? `${assets_path}/comment.md` : `${assets_path}/comment-no-changes.md`
    const title = [readFileSync(fileName, 'utf-8')]
    await postComment(octokit, context, title)
  }

  const results = await Promise.all(operations.map(item => { return item.run(octokit, context) }))

  const summaryTable =  operations.length > 0 ? driftDetectionTable(results) : [readFileSync(`${assets_path}/summary-no-changes.md`, 'utf-8')]
  await postSummaries(summaryTable, results);
}

module.exports = {
  runAction
}
