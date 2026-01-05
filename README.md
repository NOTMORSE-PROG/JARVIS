# Jarvis Bot 🤖

A dynamic bot to monitor GitHub repositories and notify Slack about:
- New Pull Requests
- Push events and branch creation
- Build Statuses (Success/Failure)
- Deployments

## Features

- **Real-time Notifications**: Instant Slack alerts via GitHub webhooks
- **Scheduled Monitoring**: Periodic checks via GitHub Actions (every 10 minutes)
- **Multi-Repository Support**: Monitor multiple repos from a single instance
- **Flexible Configuration**: Easy setup with environment variables and config files

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- `GITHUB_TOKEN`: GitHub Personal Access Token
- `SLACK_WEBHOOK_URL`: Slack Incoming Webhook URL

### 3. Configure Repositories

Edit `config.json` to add/remove repositories to watch:

```json
{
  "repositories": [
    {
      "owner": "YourOrg",
      "repo": "YourRepo",
      "branches": ["main", "develop"]
    }
  ],
  "checkInterval": 60
}
```

## 🔑 Getting Your Tokens

### GitHub Token (`GITHUB_TOKEN`)

1. Go to **GitHub Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Give it a name (e.g., "Jarvis Bot")
4. **Select Scopes**: Check `repo` (Full control of private repositories)
5. Click **Generate token**
6. **Copy the token** immediately (starts with `ghp_...`)

### Slack Webhook URL (`SLACK_WEBHOOK_URL`)

1. Go to [Slack API: Incoming Webhooks](https://api.slack.com/messaging/webhooks)
2. Click **Create your Slack app**
3. Select **From scratch**, name it "Jarvis", and pick your workspace
4. In the sidebar, click **Incoming Webhooks**
5. Toggle **Activate Incoming Webhooks** to `On`
6. Click **Add New Webhook to Workspace**
7. Select the channel where you want notifications (e.g., `#general` or `#builds`)
8. Click **Allow**
9. **Copy the Webhook URL** (starts with `https://hooks.slack.com/...`)

## Running Locally

```bash
npm start
```

## 🚀 Deployment with GitHub Actions

Jarvis uses GitHub Actions to run scheduled checks every 10 minutes automatically.

## ⚡ Instant Notifications Setup

To enable real-time notifications for any repository you want to monitor, follow these steps:

### Step 1: Create the Secret

1. Go to the repository you want to monitor on GitHub
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `JARVIS_ACCESS_TOKEN`
5. Value: Your Personal Access Token with `repo` scope (same as your `GITHUB_TOKEN`)

### Step 2: Add Push & PR Notifications

Create a new file in your repository at `.github/workflows/notify.yml`:

```yaml
name: Notify Jarvis

on:
  push:
    branches:
      - '**'
  create:
  pull_request:
    types: [opened, closed]

jobs:
  notify:
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Trigger Jarvis
        uses: peter-evans/repository-dispatch@v2
        with:
          token: ${{ secrets.JARVIS_ACCESS_TOKEN }}
          repository: NOTMORSE-PROG/JARVIS
          event-type: ${{ github.event_name }}
          client-payload: |
            {
              "event_type": "${{ github.event_name }}",
              "repo_info": {
                "repo": "${{ github.event.repository.name }}",
                "owner": "${{ github.repository_owner }}",
                "branch": "${{ github.ref_name }}",
                "sender": "${{ github.actor }}"
              },
              "details": {
                "message": ${{ toJSON(github.event.head_commit.message) }},
                "action": "${{ github.event.action }}",
                "title": ${{ toJSON(github.event.pull_request.title) }},
                "url": "${{ github.event.pull_request.html_url }}",
                "merged": ${{ github.event.pull_request.merged || false }}
              }
            }
```

### Step 3: Add Build Status Notifications

To get notified when your builds complete, add this step to the **very end** of your existing build workflow (e.g., `build.yml`):

```yaml
      - name: Notify Jarvis on Build Complete
        if: always()
        uses: peter-evans/repository-dispatch@v2
        with:
          token: ${{ secrets.JARVIS_ACCESS_TOKEN }}
          repository: NOTMORSE-PROG/JARVIS
          event-type: build_status
          client-payload: |
            {
              "event_type": "build_status",
              "repo_info": {
                "repo": "${{ github.event.repository.name }}",
                "owner": "${{ github.repository_owner }}",
                "branch": "${{ github.ref_name }}",
                "sender": "${{ github.actor }}"
              },
              "details": {
                "workflow": "${{ github.workflow }}",
                "status": "${{ job.status }}",
                "url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
              }
            }
```

## How It Works

Jarvis operates in two modes:

1. **Webhook Mode** (Instant): Repositories send events via `repository_dispatch` for immediate notifications
2. **Polling Mode** (Scheduled): GitHub Actions run every 10 minutes to check for updates

This hybrid approach ensures you get instant notifications when webhooks are configured, with a backup polling mechanism for comprehensive coverage.

## License

MIT
