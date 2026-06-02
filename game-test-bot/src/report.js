'use strict';

const fs = require('fs');
const path = require('path');
const { formatDuration, ensureDir } = require('./utils');

const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
};

class Reporter {
  constructor() {
    this._startTime = Date.now();
    this._reportsDir = path.resolve(__dirname, '../reports');
    ensureDir(this._reportsDir);
  }

  generate(config, playerStats) {
    const durationMs = Date.now() - this._startTime;

    const totalSubmissions    = playerStats.reduce((s, p) => s + p.successfulSubmissions, 0);
    const failedSubmissions   = playerStats.reduce((s, p) => s + p.errors, 0);
    const totalAnswered       = playerStats.reduce((s, p) => s + p.questionsAnswered, 0);
    const successfulPlayers   = playerStats.filter(p => p.errors === 0).length;

    const report = {
      generatedAt:          new Date().toISOString(),
      roomId:               config.roomId,
      totalTeams:           config.teamCount,
      questionsAnswered:    totalAnswered,
      successfulSubmissions: totalSubmissions,
      failedSubmissions,
      successfulPlayers,
      duration:             formatDuration(durationMs),
      durationMs,
      teams:                playerStats,
      config: {
        baseUrl:         config.baseUrl,
        browser:         config.browser,
        headless:        config.headless,
        submitDelayRange: `${config.submitDelayMinMs}–${config.submitDelayMaxMs}ms`,
        randomAnswer:    config.randomAnswer,
      },
    };

    const timestampedPath = path.join(this._reportsDir, `result-${Date.now()}.json`);
    const latestPath      = path.join(this._reportsDir, 'result.json');

    fs.writeFileSync(timestampedPath, JSON.stringify(report, null, 2));
    fs.writeFileSync(latestPath,      JSON.stringify(report, null, 2));

    return { report, filename: latestPath };
  }

  printSummary(report) {
    const line = '═'.repeat(52);
    console.log(`\n${C.cyan}${C.bold}╔${line}╗${C.reset}`);
    console.log(`${C.cyan}${C.bold}║           QUIZ BOT — TEST REPORT             ║${C.reset}`);
    console.log(`${C.cyan}${C.bold}╚${line}╝${C.reset}`);

    const pad = (label, value) =>
      console.log(`  ${C.yellow}${label.padEnd(24)}${C.reset}${value}`);

    pad('Room ID:',               report.roomId);
    pad('Total Teams:',           String(report.totalTeams));
    pad('Questions Answered:',    String(report.questionsAnswered));
    pad('Successful Submissions:',`${C.green}${report.successfulSubmissions}${C.reset}`);
    pad('Failed Submissions:',    report.failedSubmissions > 0
      ? `${C.red}${report.failedSubmissions}${C.reset}`
      : '0');
    pad('Successful Players:',    `${report.successfulPlayers}/${report.totalTeams}`);
    pad('Duration:',              report.duration);

    console.log(`\n  ${C.bold}Per-Team Results:${C.reset}`);
    for (const t of report.teams) {
      const icon = t.errors > 0 ? `${C.red}✗${C.reset}` : `${C.green}✓${C.reset}`;
      console.log(
        `  ${icon} ${t.teamName.padEnd(16)} Submitted: ${String(t.successfulSubmissions).padStart(3)}  ` +
        `Errors: ${t.errors > 0 ? C.red : ''}${t.errors}${C.reset}`
      );
    }
    console.log('');
  }
}

module.exports = new Reporter();
