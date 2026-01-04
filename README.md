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

## 🚀 Deploy to Vercel

Jarvis is ready for Vercel!

1.  **Install Vercel CLI** (optional, or use the web dashboard):
    ```bash
    npm i -g vercel
    ```

2.  **Deploy**:
    Run the following command in the `jarvis` directory:
    ```bash
    vercel
    ```
    - Follow the prompts.
    - When asked "Want to modify these settings?", say **No**.

3.  **Environment Variables**:
    - Go to your Vercel Project Dashboard > **Settings** > **Environment Variables**.
    - Add `GITHUB_TOKEN` and `SLACK_WEBHOOK_URL` (copy them from your local `.env`).

4.  **Cron Jobs**:
    - Vercel will automatically detect `vercel.json` and set up the Cron Job to run every minute.
    - You can check the "Cron Jobs" tab in your Vercel deployment to verify.

