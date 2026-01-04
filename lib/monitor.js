const github = require('./github');
const slack = require('./slack');

/**
 * Run checks for the given configuration.
 * @param {Object} config - The configuration object.
 * @param {number} lookbackSeconds - How far back to check for events (in seconds).
 */
async function run(config, sinceInput = 60) {
  let since;
  if (sinceInput instanceof Date) {
    since = sinceInput;
  } else {
    since = new Date(Date.now() - sinceInput * 1000);
  }
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
        } else {
          const message = `🔨 *New Push* to \`${branch}\` in <https://github.com/${repoConfig.owner}/${repoConfig.repo}|${repoConfig.repo}>\nby ${event.actor.login}`;
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
      const workflowName = run.name;
      
      // Filter by workflow name if configured
      if (repoConfig.workflows && !repoConfig.workflows.includes(workflowName)) {
        continue;
      }

      const message = `${emoji} *${workflowName}: ${status}* on \`${branch}\`\n<${run.html_url}|View Workflow>`;
      await slack.sendNotification(message);
    }
  }
}

async function handlePayload(payload) {
  console.log('Processing received payload:', JSON.stringify(payload, null, 2));

  // Flatten nested structure if present (to handle the 10-property limit fix)
  const data = {
    ...payload,
    ...(payload.repo_info || {}),
    ...(payload.details || {})
  };
  
  if (data.event_type === 'build_status') {
    const emoji = data.status === 'success' ? '✅' : '❌';
    const message = `${emoji} *${data.workflow}: ${data.status}* on \`${data.branch}\`\n<${data.url}|View Workflow>`;
    await slack.sendNotification(message);
  } else if (data.event_type === 'push') {
    const message = `🔨 *New Push* to \`${data.branch}\` in <https://github.com/${data.owner}/${data.repo}|${data.repo}>\n*${data.message}* by ${data.sender}`;
    await slack.sendNotification(message);
  } else if (data.event_type === 'create') {
    const message = `🌱 *New Branch Created* \`${data.branch}\` in <https://github.com/${data.owner}/${data.repo}|${data.repo}>\nby ${data.sender}`;
    await slack.sendNotification(message);
  } else if (data.event_type === 'pull_request') {
    const action = data.action; // opened, closed, merged
    const prTitle = data.title;
    const prUrl = data.url;
    const user = data.sender;

    let message = '';
    if (action === 'opened') {
      message = `🚨 *New Pull Request* in <https://github.com/${data.owner}/${data.repo}|${data.repo}>\n*${prTitle}* by ${user}\n<${prUrl}|View PR>`;
    } else if (action === 'closed' && data.merged) {
      message = `🟣 *Pull Request Merged* in <https://github.com/${data.owner}/${data.repo}|${data.repo}>\n*${prTitle}* by ${user}\n<${prUrl}|View PR>`;
    } else if (action === 'closed' && !data.merged) {
      message = `⚪ *Pull Request Closed* in <https://github.com/${data.owner}/${data.repo}|${data.repo}>\n*${prTitle}* by ${user}\n<${prUrl}|View PR>`;
    }

    if (message) {
      await slack.sendNotification(message);
    }
  } else if (data.event_type === 'delete') {
    const message = `🗑️ *Branch Deleted* \`${data.branch}\` in <https://github.com/${data.owner}/${data.repo}|${data.repo}>\nby ${data.sender}`;
    await slack.sendNotification(message);
  }
}

module.exports = {
  run,
  handlePayload
};
