require('dotenv').config();
const config = require('../config.json');
const monitor = require('../lib/monitor');

const github = require('../lib/github');

async function main() {
  // Check for direct event payload (from repository_dispatch)
  if (process.env.EVENT_PAYLOAD) {
    try {
      const payload = JSON.parse(process.env.EVENT_PAYLOAD);
      await monitor.handlePayload(payload);
      console.log('Payload processed successfully.');
      process.exit(0);
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
