require('dotenv').config();
const config = require('../config.json');
const monitor = require('../lib/monitor');

// Run check for the last 2 minutes (covering the 1 min interval + buffer)
const lookbackSeconds = 2 * 60;

console.log('Starting scheduled check...');
monitor.run(config, lookbackSeconds)
  .then(() => {
    console.log('Check completed successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Check failed:', err);
    process.exit(1);
  });
