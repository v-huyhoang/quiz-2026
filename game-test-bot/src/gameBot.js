const { chromium } = require('playwright');
const { PlayerBot } = require('./playerBot');
const { generateReport } = require('./report');
const logger = require('./logger');

/**
 * Launches N player bots concurrently, each with isolated browser context.
 * Waits for all players to finish (game.finished event or error).
 * Generates a JSON report and exits.
 */
async function runGameBot(config) {
  const startedAt = Date.now();

  logger.info(`Starting game bot — ${config.teamCount} teams, room: ${config.roomCode}`);
  logger.info(`Base URL: ${config.baseUrl}`);

  // Launch a single browser (contexts provide isolation)
  const browser = await chromium.launch({
    headless: config.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // Build team names: "Team 1", "Team 2", ... "Team N"
  const teamNames = Array.from(
    { length: config.teamCount },
    (_, i) => `Team ${i + 1}`
  );

  logger.info(`Launching ${teamNames.length} player contexts...`);

  // Run all players concurrently — each gets its own browser context
  const allStats = await Promise.all(
    teamNames.map(name => {
      const bot = new PlayerBot(name, config);
      return bot.run(browser).catch(err => {
        // Catch top-level errors so one bot crash doesn't stop others
        logger.error(name, `Fatal: ${err.message}`);
        return {
          teamName: name,
          joined: false,
          questionsAnswered: 0,
          successfulSubmissions: 0,
          failedSubmissions: 0,
          gameFinished: false,
          error: err.message,
        };
      });
    })
  );

  logger.info('All players finished. Closing browser...');
  await browser.close();

  // Generate and save report
  const { report, reportPath } = generateReport(config, allStats, startedAt);

  logger.flush();

  console.log('\n══════════════════════════════════════════');
  console.log('  GAME BOT REPORT');
  console.log('══════════════════════════════════════════');
  console.log(`  Room:         ${report.roomCode}`);
  console.log(`  Teams:        ${report.joinedTeams}/${report.totalTeams} joined`);
  console.log(`  Completed:    ${report.completedTeams}/${report.totalTeams}`);
  console.log(`  Questions:    ${report.questionsAnswered} answered`);
  console.log(`  Submissions:  ${report.successfulSubmissions} ok / ${report.failedSubmissions} failed`);
  console.log(`  Duration:     ${report.duration}`);
  console.log(`  Report:       ${reportPath}`);
  if (report.errors?.length) {
    console.log(`  Errors (${report.errors.length}):`);
    report.errors.forEach(e => console.log(`    - ${e.team}: ${e.error}`));
  }
  console.log('══════════════════════════════════════════\n');

  return report;
}

module.exports = { runGameBot };
