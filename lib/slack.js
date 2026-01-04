const axios = require('axios');

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

async function sendNotification(message) {
  if (!WEBHOOK_URL) {
    console.log('Mock Slack Notification:', message);
    return;
  }

  try {
    await axios.post(WEBHOOK_URL, { text: message });
    console.log('Slack notification sent.');
  } catch (error) {
    console.error('Error sending Slack notification:', error.message);
  }
}

module.exports = {
  sendNotification
};
