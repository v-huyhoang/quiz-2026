'use strict';

const GameBot  = require('./gameBot');
const config   = require('./config');
const logger   = require('./logger');
const reporter = require('./report');

async function main() {
  const bot = new GameBot(config);

  // Graceful Ctrl+C — still write the report before exiting
  process.on('SIGINT', async () => {
    logger.info('\nInterrupted — generating report before exit...');
    try {
      const stats = bot.players.map(p => p.getStats());
      const { report, filename } = reporter.generate(config, stats);
      reporter.printSummary(report);
      logger.info(`Partial report → ${filename}`);
    } catch { /* ignore */ }
    await bot._cleanup().catch(() => {});
    process.exit(0);
  });

  process.on('unhandledRejection', reason => {
    logger.error('BOT', `Unhandled rejection: ${reason}`);
  });

  await bot.run();
}

main().catch(err => {
  console.error('\nFatal error:', err.message || err);
  process.exit(1);
});
