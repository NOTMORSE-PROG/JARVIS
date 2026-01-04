# Jarvis Bot 🤖

A dynamic bot to monitor GitHub repositories and notify Slack about:
- New Pull Requests
- Build Statuses (Success/Failure)
- Deployments

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configuration**:
    - Copy `.env.example` to `.env`:
      ```bash
      cp .env.example .env
      ```
    - Edit `.env` and add your:
        - `GITHUB_TOKEN`: A GitHub Personal Access Token.
        - `SLACK_WEBHOOK_URL`: Your Slack Incoming Webhook URL.

### 🔑 How to get the Tokens

#### 1. GitHub Token (`GITHUB_TOKEN`)
1.  Go to **GitHub Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**.
2.  Click **Generate new token (classic)**.
3.  Give it a name (e.g., "Jarvis Bot").
4.  **Select Scopes**: Check `repo` (Full control of private repositories).
5.  Click **Generate token**.
6.  **Copy the token** immediately (starts with `ghp_...`).

#### 2. Slack Webhook URL (`SLACK_WEBHOOK_URL`)
1.  Go to [Slack API: Incoming Webhooks](https://api.slack.com/messaging/webhooks).
2.  Click **Create your Slack app**.
3.  Select **From scratch**, name it "Jarvis", and pick your workspace.
4.  In the sidebar, click **Incoming Webhooks**.
5.  Toggle **Activate Incoming Webhooks** to `On`.
6.  Click **Add New Webhook to Workspace**.
7.  Select the channel where you want notifications (e.g., `#general` or `#builds`).
8.  Click **Allow**.
9.  **Copy the Webhook URL** (starts with `https://hooks.slack.com/...`).

3.  **Repositories**:
    - Edit `config.json` to add/remove repositories to watch.
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

## Running

```bash
npm start
# Jarvis Bot 🤖

A dynamic bot to monitor GitHub repositories and notify Slack about:
- New Pull Requests
- Build Statuses (Success/Failure)
- Deployments

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configuration**:
    - Copy `.env.example` to `.env`:
      ```bash
      cp .env.example .env
      ```
    - Edit `.env` and add your:
        - `GITHUB_TOKEN`: A GitHub Personal Access Token.
        - `SLACK_WEBHOOK_URL`: Your Slack Incoming Webhook URL.

### 🔑 How to get the Tokens

#### 1. GitHub Token (`GITHUB_TOKEN`)
1.  Go to **GitHub Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**.
2.  Click **Generate new token (classic)**.
3.  Give it a name (e.g., "Jarvis Bot").
4.  **Select Scopes**: Check `repo` (Full control of private repositories).
5.  Click **Generate token**.
6.  **Copy the token** immediately (starts with `ghp_...`).

#### 2. Slack Webhook URL (`SLACK_WEBHOOK_URL`)
1.  Go to [Slack API: Incoming Webhooks](https://api.slack.com/messaging/webhooks).
2.  Click **Create your Slack app**.
3.  Select **From scratch**, name it "Jarvis", and pick your workspace.
4.  In the sidebar, click **Incoming Webhooks**.
5.  Toggle **Activate Incoming Webhooks** to `On`.
6.  Click **Add New Webhook to Workspace`.
7.  Select the channel where you want notifications (e.g., `#general` or `#builds`).
8.  Click **Allow**.
9.  **Copy the Webhook URL** (starts with `https://hooks.slack.com/...`).

3.  **Repositories**:
    - Edit `config.json` to add/remove repositories to watch.
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

## Running

```bash
npm start
```

## 🚀 Deployment (GitHub Actions)

Jarvis uses GitHub Actions to run checks every 10 minutes.

## ⚡ Instant Notifications Setup (For Any Repository)

To make Jarvis monitor a new repository (e.g., `SafeTransit`, `AnotherApp`), follow these 3 steps:

### Step 1: Create the Secret
1.  Go to your repository on GitHub.
2.  **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.
3.  Name: `JARVIS_ACCESS_TOKEN`
4.  Value: (Your Personal Access Token with `repo` scope)

### Step 2: Add Instant Push & PR Notifications
Create a new file in your repo at `.github/workflows/notify.yml` and paste this:

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

### Step 3: Add Build Success Notifications
To get notified when your **Build/APK** is ready, add this step to the **very end** of your existing build workflow (e.g., `build.yml`):

```yaml
      - name: Trigger Jarvis
        if: always() # Run even if build fails
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
