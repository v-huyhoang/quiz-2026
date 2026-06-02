const { loadConfig } = require('./config');
const { runGameBot } = require('./gameBot');
const logger = require('./logger');

async function main() {
  let config;

  try {
    config = loadConfig();
  } catch (err) {
    console.error(`[BOT] Failed to load config: ${err.message}`);
    process.exit(1);
  }

  try {
    await runGameBot(config);
  } catch (err) {
    logger.info(`Fatal error: ${err.message}`);
    console.error(err);
  } finally {
    logger.flush();
    process.exit(0);
  }
}

main();
