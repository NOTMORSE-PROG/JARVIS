require('dotenv').config();
const config = require('../config.json');
const monitor = require('../lib/monitor');

const github = require('../lib/github');

// Validate Environment Variables
if (!process.env.GITHUB_TOKEN) {
  console.error('❌ Error: GITHUB_TOKEN is missing. Please add it to Repository Secrets.');
  process.exit(1);
}
if (!process.env.SLACK_WEBHOOK_URL) {
  console.error('❌ Error: SLACK_WEBHOOK_URL is missing. Please add it to Repository Secrets.');
  process.exit(1);
}

/**
 * Transform native GitHub webhook events into the format expected by handlePayload
 */
function transformGitHubEvent(eventName, payload) {
  switch (eventName) {
    case 'push':
      return {
        event_type: 'push',
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        branch: payload.ref.replace('refs/heads/', ''),
        message: payload.head_commit?.message?.split('\n')[0] || 'No commit message',
        sender: payload.sender.login,
        url: payload.head_commit?.url || payload.repository.html_url
      };

    case 'pull_request':
      const isMerged = payload.pull_request.merged === true;
      return {
        event_type: 'pull_request',
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        action: payload.action, // opened, closed, reopened, synchronize
        merged: isMerged,
        title: payload.pull_request.title,
        url: payload.pull_request.html_url,
        sender: payload.sender.login,
        branch: payload.pull_request.head.ref
      };

    case 'create':
      // Only handle branch creation (not tags)
      if (payload.ref_type === 'branch') {
        return {
          event_type: 'create',
          owner: payload.repository.owner.login,
          repo: payload.repository.name,
          branch: payload.ref,
          sender: payload.sender.login
        };
      }
      return null;

    case 'delete':
      // Handle branch deletion
      if (payload.ref_type === 'branch') {
        return {
          event_type: 'delete',
          owner: payload.repository.owner.login,
          repo: payload.repository.name,
          branch: payload.ref,
          sender: payload.sender.login
        };
      }
      return null;

    default:
      console.log(`Unhandled event type: ${eventName}`);
      return null;
  }
}

async function main() {
  // Check for native GitHub events (push, pull_request, create, delete)
  if (process.env.GITHUB_EVENT_NAME && process.env.GITHUB_EVENT_PATH) {
    const fs = require('fs');
    try {
      const eventPayload = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
      const transformedPayload = transformGitHubEvent(process.env.GITHUB_EVENT_NAME, eventPayload);

      if (transformedPayload) {
        await monitor.handlePayload(transformedPayload);
        console.log(`${process.env.GITHUB_EVENT_NAME} event processed successfully.`);
        process.exit(0);
      }
    } catch (error) {
      console.error('Error processing GitHub event:', error);
      process.exit(1);
    }
  }

  // Check for direct event payload (from repository_dispatch)
  if (process.env.EVENT_PAYLOAD) {
    try {
      const payload = JSON.parse(process.env.EVENT_PAYLOAD);
      if (payload) {
        await monitor.handlePayload(payload);
        console.log('Payload processed successfully.');
        process.exit(0);
      }
    } catch (error) {
      console.error('Error processing payload:', error);
      process.exit(1);
    }
  }

  console.log('Starting scheduled check...');

  // Default lookback: 10 minutes (if no previous run found)
  let since = new Date(Date.now() - 10 * 60 * 1000);

  try {
    // Attempt to find the last successful run of this workflow to avoid gaps
    if (process.env.GITHUB_REPOSITORY) {
      const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
      const runs = await github.getWorkflowRuns(owner, repo);
      
      // Find the last completed success run
      // We skip the first one if it's the current running job (which is likely in_progress)
      const lastSuccess = runs.find(r => r.status === 'completed' && r.conclusion === 'success');
      
      if (lastSuccess) {
        since = new Date(lastSuccess.updated_at);
        console.log(`Found last successful run at: ${since.toISOString()}`);
      } else {
        console.log('No previous successful run found. Using default lookback.');
      }
    }
  } catch (error) {
    console.warn('Failed to fetch last run time, using default lookback:', error.message);
  }

  try {
    await monitor.run(config, since);
    console.log('Check completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
}

main();
