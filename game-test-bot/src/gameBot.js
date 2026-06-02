'use strict';

const { chromium } = require('playwright');
const PlayerBot    = require('./playerBot');
const logger       = require('./logger');
const reporter     = require('./report');

// Join players in batches to avoid hammering the server
const JOIN_BATCH_SIZE  = 5;
const JOIN_BATCH_DELAY = 600; // ms between batches

class GameBot {
  constructor(config) {
    this.config  = config;
    this.browser = null;
    this.players = [];
  }

  // ── Public API ───────────────────────────────────────────────────────

  async run() {
    try {
      await this._launch();
      await this._joinAll();
      await this._waitAndPlay();
    } finally {
      await this._report();
      await this._cleanup();
    }
  }

  // ── Private Steps ────────────────────────────────────────────────────

  async _launch() {
    const { browser: browserName, headless, teamCount, roomId, baseUrl } = this.config;

    logger.info('');
    logger.info('╔══════════════════════════════════════════╗');
    logger.info('║       QUIZ STACK 2026 — TEST BOT         ║');
    logger.info('╚══════════════════════════════════════════╝');
    logger.info('');
    logger.info(`Base URL : ${baseUrl}`);
    logger.info(`Room ID  : ${roomId}`);
    logger.info(`Teams    : ${teamCount}`);
    logger.info(`Browser  : ${browserName}  headless=${headless}`);
    logger.info('');

    const launchOptions = {
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    if (browserName === 'chrome')  launchOptions.channel = 'chrome';
    if (browserName === 'edge')    launchOptions.channel = 'msedge';

    try {
      this.browser = await chromium.launch(launchOptions);
    } catch {
      // Installed Chrome/Edge not found — fall back to Playwright's bundled Chromium
      logger.info(`Channel "${browserName}" unavailable, falling back to bundled Chromium`);
      delete launchOptions.channel;
      this.browser = await chromium.launch(launchOptions);
    }

    // Create player instances (no browser context yet)
    for (let i = 1; i <= teamCount; i++) {
      this.players.push(new PlayerBot({
        browser:  this.browser,
        teamName: `Team ${i}`,
        config:   this.config,
      }));
    }

    // Init all contexts in parallel (each gets isolated localStorage/cookies)
    logger.info(`Creating ${teamCount} isolated browser contexts...`);
    await Promise.all(this.players.map(p => p.init()));
    logger.info(`All ${teamCount} contexts ready.\n`);
  }

  async _joinAll() {
    logger.info(`Joining room "${this.config.roomId}" with ${this.players.length} teams...`);
    logger.info('');

    const results = [];

    for (let i = 0; i < this.players.length; i += JOIN_BATCH_SIZE) {
      const batch = this.players.slice(i, i + JOIN_BATCH_SIZE);

      const batchResults = await Promise.allSettled(batch.map(p => p.joinRoom()));
      results.push(...batchResults);

      const batchEnd = Math.min(i + JOIN_BATCH_SIZE, this.players.length);
      logger.info(`  Batch ${Math.floor(i / JOIN_BATCH_SIZE) + 1}: players ${i + 1}–${batchEnd} done`);

      // Small gap between batches to avoid server overload
      if (batchEnd < this.players.length) {
        await new Promise(r => setTimeout(r, JOIN_BATCH_DELAY));
      }
    }

    // Count outcomes
    const joined = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // Remove failed players
    const failedIndices = results
      .map((r, i) => (r.status === 'rejected' ? i : -1))
      .filter(i => i >= 0)
      .reverse();

    for (const idx of failedIndices) {
      const p = this.players[idx];
      const reason = results[idx].reason?.message ?? 'unknown';
      logger.error(p.teamName, `Join failed (${reason}) — removing from game`);
      await p.cleanup().catch(() => {});
      this.players.splice(idx, 1);
    }

    logger.info('');
    logger.info(`Join results: ${joined} succeeded, ${failed} failed`);
    logger.info(`Active players: ${this.players.length}`);
    logger.info('');

    if (this.players.length === 0) {
      throw new Error('No players joined successfully. Aborting.');
    }
  }

  async _waitAndPlay() {
    logger.info('All players waiting for admin to start the game...');
    logger.info('(Admin: open game-control and click "Bắt đầu game")');
    logger.info('');

    // All wait for game start simultaneously (driven by WebSocket → URL change)
    await Promise.all(this.players.map(p => p.waitForGameStart()));

    logger.info('');
    logger.info('Game started! Players will wait for admin to start each round.');
    logger.info('(Admin: click "Bắt đầu vòng chơi" → questions will appear automatically)');
    logger.info('');

    // All play independently — allSettled so one crash doesn't kill others
    await Promise.allSettled(this.players.map(p => p.playGame()));

    logger.info('');
    logger.info('All players finished.');
  }

  async _report() {
    const stats = this.players.map(p => p.getStats());
    const { report, filename } = reporter.generate(this.config, stats);
    reporter.printSummary(report);
    logger.info(`Report → ${filename}`);
    logger.info(`Latest → reports/result.json`);
  }

  async _cleanup() {
    logger.info('Cleaning up browser contexts...');
    await Promise.all(this.players.map(p => p.cleanup()));
    if (this.browser) await this.browser.close().catch(() => {});
    logger.info('Done.\n');
    process.exit(0);
  }
}

module.exports = GameBot;
