'use strict';

const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};

class Logger {
  constructor() {
    this._entries = [];
  }

  _ts() {
    return new Date().toLocaleTimeString('vi-VN', { hour12: false });
  }

  _write(color, tag, teamName, message) {
    const line = `[${this._ts()}] [${teamName}] ${message}`;
    console.log(`${color}${line}${C.reset}`);
    this._entries.push({
      time: new Date().toISOString(),
      team: teamName,
      level: tag,
      message,
    });
  }

  log(teamName, message)     { this._write(C.cyan,   'INFO',    teamName, message); }
  success(teamName, message) { this._write(C.green,  'SUCCESS', teamName, message); }
  warn(teamName, message)    { this._write(C.yellow, 'WARN',    teamName, message); }
  error(teamName, message)   { this._write(C.red,    'ERROR',   teamName, message); }

  info(message) {
    const line = `[${this._ts()}] [BOT] ${message}`;
    console.log(`${C.blue}${line}${C.reset}`);
    this._entries.push({ time: new Date().toISOString(), team: 'BOT', level: 'INFO', message });
  }

  getEntries() {
    return this._entries;
  }
}

module.exports = new Logger();
