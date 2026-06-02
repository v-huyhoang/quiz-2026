'use strict';

const fs = require('fs');
const path = require('path');
const minimist = require('minimist');

function loadConfig() {
  const configPath = path.resolve(__dirname, '../config/config.json');
  let fileConfig = {};

  try {
    fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    console.warn('[config] config.json not found, using defaults');
  }

  const argv = minimist(process.argv.slice(2));

  const merged = {
    baseUrl: 'http://localhost:5173',
    roomId: 'ABC123',
    teamCount: 20,
    browser: 'chromium',
    headless: false,
    submitDelayMinMs: 300,
    submitDelayMaxMs: 2000,
    randomAnswer: true,
    screenshotOnError: true,
    ...fileConfig,
  };

  // CLI args override config file
  if (argv.baseUrl) merged.baseUrl = argv.baseUrl;
  if (argv.roomId) merged.roomId = argv.roomId;
  if (argv.teamCount) merged.teamCount = parseInt(argv.teamCount, 10);
  if (argv.browser) merged.browser = argv.browser;
  if (argv.headless !== undefined) merged.headless = String(argv.headless) === 'true';
  if (argv.submitDelayMinMs) merged.submitDelayMinMs = parseInt(argv.submitDelayMinMs, 10);
  if (argv.submitDelayMaxMs) merged.submitDelayMaxMs = parseInt(argv.submitDelayMaxMs, 10);
  if (argv.randomAnswer !== undefined) merged.randomAnswer = String(argv.randomAnswer) !== 'false';

  return merged;
}

module.exports = loadConfig();
