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
```

## 🚀 Deployment (GitHub Actions)

Jarvis uses GitHub Actions to run checks every 10 minutes.

### Setup Secrets

For the bot to work, you need to add your secrets to the GitHub Repository:

1.  Go to your repository on GitHub.
2.  Click **Settings** > **Secrets and variables** > **Actions**.
3.  Click **New repository secret**.
4.  Add the following secrets:
    -   `GH_TOKEN`: Your GitHub Personal Access Token (or use the default `GITHUB_TOKEN` if only accessing this repo).
    -   `SLACK_WEBHOOK_URL`: Your Slack Webhook URL.

The bot will automatically start running on the schedule defined in `.github/workflows/cron.yml`.

**Note:** You will need to create a Personal Access Token (PAT) with `repo` scope and add it as `JARVIS_ACCESS_TOKEN` to your repository secrets.

