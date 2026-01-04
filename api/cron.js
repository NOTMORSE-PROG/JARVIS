const config = require('../config.json');
const monitor = require('../lib/monitor');

module.exports = async (req, res) => {
  // Vercel Cron jobs usually run every minute or so.
  // We'll check for events in the last 60 seconds + a small buffer (e.g., 70s)
  // to ensure we don't miss anything due to slight delays.
  const lookback = 70; 

  try {
    await monitor.run(config, lookback);
    res.status(200).send('Cron job executed successfully.');
  } catch (error) {
    console.error('Cron job failed:', error);
    res.status(500).send('Cron job failed.');
  }
};
