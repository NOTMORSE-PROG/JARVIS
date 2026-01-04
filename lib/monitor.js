const github = require('./github');
const slack = require('./slack');

/**
 * Run checks for the given configuration.
 * @param {Object} config - The configuration object.
 * @param {number} lookbackSeconds - How far back to check for events (in seconds).
 */
async function run(config, lookbackSeconds = 60) {
  const since = new Date(Date.now() - lookbackSeconds * 1000);
  console.log(`Checking for events since ${since.toISOString()}...`);

  for (const repoConfig of config.repositories) {
    await checkPullRequests(repoConfig, since);
    await checkPushes(repoConfig, since);
    await checkBuilds(repoConfig, since);
  }
}

async function checkPullRequests(repoConfig, since) {
  const prs = await github.getPullRequests(repoConfig.owner, repoConfig.repo);
  
  for (const pr of prs) {
    const createdAt = new Date(pr.created_at);
    // Check if PR was created within the lookback window
    if (createdAt > since) {
      const message = `🚨 *New Pull Request* in <${pr.html_url}|${repoConfig.repo}>\n*${pr.title}* by ${pr.user.login}`;
      await slack.sendNotification(message);
    }
  }
}

async function checkPushes(repoConfig, since) {
  const events = await github.getEvents(repoConfig.owner, repoConfig.repo);
  
  for (const event of events) {
    const createdAt = new Date(event.created_at);
    if (createdAt > since) {
      if (event.type === 'PushEvent') {
        const commits = event.payload.commits;
        const branch = event.payload.ref.replace('refs/heads/', '');
        if (commits && commits.length > 0) {
          const commitMessage = commits[0].message.split('\n')[0]; // First line only
          const message = `🔨 *New Push* to \`${branch}\` in <https://github.com/${repoConfig.owner}/${repoConfig.repo}|${repoConfig.repo}>\n*${commitMessage}* by ${event.actor.login}`;
          await slack.sendNotification(message);
        }
      } else if (event.type === 'CreateEvent' && event.payload.ref_type === 'branch') {
        const branch = event.payload.ref;
        const message = `🌱 *New Branch Created* \`${branch}\` in <https://github.com/${repoConfig.owner}/${repoConfig.repo}|${repoConfig.repo}>\nby ${event.actor.login}`;
        await slack.sendNotification(message);
      }
    }
  }
}

async function checkBuilds(repoConfig, since) {
  // If branches contains '*', check all branches
  if (repoConfig.branches.includes('*')) {
    const runs = await github.getWorkflowRuns(repoConfig.owner, repoConfig.repo, '*');
    await processRuns(runs, repoConfig, since);
  } else {
    // Otherwise check specific branches
    for (const branch of repoConfig.branches) {
      const runs = await github.getWorkflowRuns(repoConfig.owner, repoConfig.repo, branch);
      await processRuns(runs, repoConfig, since);
    }
  }
}

async function processRuns(runs, repoConfig, since) {
  if (!runs || runs.length === 0) return;

  // Since we might fetch multiple runs (per_page=5), we iterate them
  // But usually we only care about the very latest one per branch if we were stateful.
  // In stateless mode, we just check if any of them finished recently.
  
  for (const run of runs) {
    const updatedAt = new Date(run.updated_at);
    const status = run.conclusion || run.status;

    // Check if the run was updated (finished) within the lookback window
    // And ensure it is a completed state (conclusion is not null)
    if (updatedAt > since && run.conclusion) {
      const emoji = status === 'success' ? '✅' : '❌';
      const branch = run.head_branch;
      const message = `${emoji} *Build ${status}* on \`${branch}\`\n<${run.html_url}|View Workflow>`;
      await slack.sendNotification(message);
    }
  }
}

module.exports = {
  run
};
