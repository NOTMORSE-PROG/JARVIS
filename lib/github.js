const axios = require('axios');

const GITHUB_API_URL = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN;

const headers = {
  'Authorization': `token ${TOKEN}`,
  'Accept': 'application/vnd.github.v3+json'
};

async function getPullRequests(owner, repo) {
  try {
    const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/pulls?state=open`;
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching PRs for ${owner}/${repo}:`, error.message);
    return [];
  }
}

async function getWorkflowRuns(owner, repo, branch) {
  try {
    let url = `${GITHUB_API_URL}/repos/${owner}/${repo}/actions/runs?per_page=5`;
    if (branch && branch !== '*') {
      url += `&branch=${branch}`;
    }
    const response = await axios.get(url, { headers });
    return response.data.workflow_runs;
  } catch (error) {
    console.error(`Error fetching workflows for ${owner}/${repo} on ${branch || 'all branches'}:`, error.message);
    return [];
  }
}

module.exports = {
  getPullRequests,
  getWorkflowRuns
};
