const fs = require('fs');
const path = require('path');

const LOG_DIR  = path.join(__dirname, '..', 'reports');
const LOG_FILE = path.join(LOG_DIR, 'session.log');

// Ensure reports dir exists
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function timestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `[${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}]`;
}

function write(line) {
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch {}
}

function log(teamName, message) {
  write(`${timestamp()} [${teamName}] ${message}`);
}

function error(teamName, message) {
  const line = `${timestamp()} [${teamName}] ERROR: ${message}`;
  console.error(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch {}
}

function info(message) {
  write(`${timestamp()} [BOT] ${message}`);
}

function flush() {
  // All writes are synchronous — nothing to flush
}

module.exports = { log, error, info, flush };
