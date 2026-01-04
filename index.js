require('dotenv').config();
const schedule = require('node-schedule');
const config = require('./config.json');
const monitor = require('./lib/monitor');

console.log('Starting Jarvis Bot...');
console.log(`Monitoring ${config.repositories.length} repositories...`);

// Run immediately on start (look back 1 hour for initial check, or just 60s)
monitor.run(config, 60);

// Schedule to run every minute (or as configured)
const job = schedule.scheduleJob(`*/${config.checkInterval / 60} * * * *`, function(){
  console.log('Running scheduled check...');
  monitor.run(config, config.checkInterval);
});
