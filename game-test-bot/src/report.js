const fs   = require('fs');
const path = require('path');
const { formatDuration } = require('./utils');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');

function generateReport(config, allStats, startedAt) {
  const finishedAt = Date.now();
  const duration = formatDuration(finishedAt - startedAt);

  const joined    = allStats.filter(s => s.joined).length;
  const finished  = allStats.filter(s => s.gameFinished).length;
  const answered  = allStats.reduce((sum, s) => sum + s.questionsAnswered, 0);
  const submitted = allStats.reduce((sum, s) => sum + s.successfulSubmissions, 0);
  const failed    = allStats.reduce((sum, s) => sum + s.failedSubmissions, 0);
  const errors    = allStats.filter(s => s.error).map(s => ({
    team: s.teamName,
    error: s.error,
  }));

  const report = {
    roomCode: config.roomCode,
    totalTeams: config.teamCount,
    joinedTeams: joined,
    completedTeams: finished,
    questionsAnswered: answered,
    successfulSubmissions: submitted,
    failedSubmissions: failed,
    duration,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date(finishedAt).toISOString(),
    errors: errors.length > 0 ? errors : undefined,
    teams: allStats.map(s => ({
      teamName: s.teamName,
      joined: s.joined,
      questionsAnswered: s.questionsAnswered,
      successfulSubmissions: s.successfulSubmissions,
      failedSubmissions: s.failedSubmissions,
      gameFinished: s.gameFinished,
      error: s.error || undefined,
    })),
  };

  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const reportPath = path.join(REPORTS_DIR, 'result.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return { report, reportPath };
}

module.exports = { generateReport };
