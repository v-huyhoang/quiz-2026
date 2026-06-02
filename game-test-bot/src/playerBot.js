const path = require('path');
const fs   = require('fs');
const { WebSocketListener } = require('./websocketListener');
const logger   = require('./logger');
const selectors = require('./selectors');
const { sleep, randomDelay } = require('./utils');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

class PlayerBot {
  constructor(teamName, config) {
    this.teamName = config.teamNamePrefix
      ? `${config.teamNamePrefix} ${teamName}`
      : teamName;
    this.config = config;
    this.stats = {
      teamName: this.teamName,
      joined: false,
      questionsAnswered: 0,
      successfulSubmissions: 0,
      failedSubmissions: 0,
      gameFinished: false,
      startedAt: null,
      finishedAt: null,
      error: null,
    };
    this._gameFinished = false;
  }

  async run(browser) {
    this.stats.startedAt = Date.now();
    this.context = await browser.newContext();
    this.page    = await this.context.newPage();
    this.ws      = new WebSocketListener(this.page);

    // Mark game finished on event so any pending waitFor can be short-circuited
    this.ws.on('game.finished', () => { this._gameFinished = true; });

    try {
      await this._join();
      await this._waitForGameStart();
      await this._playGame();
    } catch (err) {
      logger.error(this.teamName, err.message);
      this.stats.error = err.message;
      if (this.config.screenshotOnError) {
        await this._screenshot('error');
      }
    } finally {
      this.stats.finishedAt = Date.now();
      try { await this.context.close(); } catch {}
    }

    return this.stats;
  }

  // ── Join flow ───────────────────────────────────────────────────────────────

  async _join() {
    await this.page.goto(`${this.config.baseUrl}/join`);

    // Step 1 — Enter room code
    await this.page.locator(selectors.roomCodeInput).waitFor({ timeout: 15000 });
    await this.page.locator(selectors.roomCodeInput).fill(this.config.roomCode);
    await this.page.locator(selectors.formSubmit).click();

    // Step 2 — Enter team name (wait for input to appear after step 1 transitions)
    await this.page.locator(selectors.teamNameInput).waitFor({ timeout: 10000 });
    await this.page.locator(selectors.teamNameInput).fill(this.teamName);
    await this.page.locator(selectors.formSubmit).click();

    // Wait for navigation to /player/waiting or /player/game
    await this.page.waitForURL(/\/player\//, { timeout: 15000 });

    this.stats.joined = true;
    logger.log(this.teamName, 'Joined Room');
  }

  // ── Wait for game.started ───────────────────────────────────────────────────

  async _waitForGameStart() {
    logger.log(this.teamName, 'Waiting for game to start...');

    // If already navigated to /player/game (game already started), skip wait
    if (this.page.url().includes('/player/game')) {
      logger.log(this.teamName, 'Game already active');
      return;
    }

    await this.ws.waitFor('game.started', 3_600_000); // max 1 hour
    logger.log(this.teamName, 'Game Started');

    // FE will navigate automatically; wait for it
    await this.page.waitForURL(/\/player\/game/, { timeout: 10000 }).catch(() => {});
  }

  // ── Game loop ───────────────────────────────────────────────────────────────

  async _playGame() {
    let roundNumber = 0;

    while (!this._gameFinished) {
      // Wait for next question OR game to finish
      const result = await Promise.race([
        this.ws.waitFor('question.started', this.config.questionTimeoutMs)
          .then(data => ({ type: 'question', data })),
        this.ws.waitFor('game.finished', this.config.questionTimeoutMs)
          .then(data => ({ type: 'finished', data })),
      ]);

      if (result.type === 'finished' || this._gameFinished) {
        break;
      }

      const qData = result.data;

      // Log new round detection
      if (qData.round_number && qData.round_number !== roundNumber) {
        roundNumber = qData.round_number;
        logger.log(this.teamName, `Round ${roundNumber} Active`);
      }

      await this._handleQuestion(qData);
    }

    logger.log(this.teamName, 'Game Finished');
    await this._screenshot('finished');
    this.stats.gameFinished = true;
  }

  // ── Handle single question ──────────────────────────────────────────────────

  async _handleQuestion(qData) {
    const qNum = qData.order_number ?? '?';
    this.stats.questionsAnswered++;
    logger.log(this.teamName, `Question #${qNum} opened`);

    // Random human-like delay before answering
    const delay = randomDelay(this.config.submitDelayMinMs, this.config.submitDelayMaxMs);
    await sleep(delay);

    // Try to submit
    try {
      const label = await this._selectAndSubmit();
      logger.log(this.teamName, `Question #${qNum} Selected: ${label} Submitted`);
      this.stats.successfulSubmissions++;
    } catch (err) {
      const msg = err.message || '';
      // 409 / "already submitted" is not a real failure — FE catches it gracefully
      if (msg.includes('409') || msg.includes('already') || msg.includes('Đã nộp')) {
        logger.log(this.teamName, `Question #${qNum} Already submitted (skip)`);
        this.stats.successfulSubmissions++;
      } else {
        logger.error(this.teamName, `Q#${qNum} submit failed: ${msg}`);
        this.stats.failedSubmissions++;
        if (this.config.screenshotOnError) await this._screenshot(`q${qNum}-error`);
      }
    }

    // Wait for question to close, or round/game to end
    await this._waitForQuestionEnd(qNum);
  }

  async _selectAndSubmit() {
    // Wait for answer buttons that are not disabled — ensures new question is fully rendered.
    // Using :not([disabled]) guards against the previous question's "already submitted" state
    // where buttons are disabled, which could cause stale references if grabbed too early.
    const enabledButton = this.page.locator(`${selectors.answerButtons}:not([disabled])`);
    await enabledButton.first().waitFor({ state: 'visible', timeout: 10000 });

    const count = await this.page.locator(selectors.answerButtons).count();
    if (count === 0) throw new Error('No answer buttons found');

    const idx = this.config.randomAnswer
      ? Math.floor(Math.random() * count)
      : 0;

    // Read label BEFORE clicking (text changes to selected style after click)
    let label = String.fromCharCode(65 + idx);
    try {
      const text = await this.page.locator(selectors.answerButtons).nth(idx)
        .locator(selectors.answerLabel).textContent({ timeout: 2000 });
      if (text?.trim()) label = text.trim();
    } catch {}

    // Use nth() locator (re-evaluated at click time) instead of a stored reference.
    // Stored references from .all() go stale when React re-renders answer buttons
    // with new keys for a different question.
    await this.page.locator(selectors.answerButtons).nth(idx).click();

    // Click submit with retry — the submit button sits inside AnimatePresence mode="wait",
    // so it may briefly detach from the DOM while the "Đã nộp" exit animation plays
    // before the new submit button mounts.
    await this._clickSubmitWithRetry();

    return label;
  }

  async _clickSubmitWithRetry(maxRetries = 4, retryDelayMs = 400) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.page.locator(selectors.submitButton).waitFor({ state: 'visible', timeout: 5000 });
        await this.page.locator(selectors.submitButton).click({ timeout: 3000 });
        return;
      } catch (err) {
        if (attempt === maxRetries) throw err;
        await sleep(retryDelayMs);
      }
    }
  }

  async _waitForQuestionEnd(qNum) {
    const result = await Promise.race([
      this.ws.waitFor('question.closed', this.config.questionTimeoutMs)
        .then(() => 'closed'),
      this.ws.waitFor('round.finished', this.config.questionTimeoutMs)
        .then(d => {
          logger.log(this.teamName, `Round ${d.round_number} Finished`);
          return 'round_finished';
        }),
      this.ws.waitFor('game.finished', this.config.questionTimeoutMs)
        .then(() => {
          this._gameFinished = true;
          return 'game_finished';
        }),
    ]).catch(() => {
      logger.log(this.teamName, `Q#${qNum} — timeout waiting for question end`);
      return 'timeout';
    });

    if (result === 'closed') {
      logger.log(this.teamName, `Question #${qNum} Closed`);
    }
  }

  // ── Utilities ───────────────────────────────────────────────────────────────

  async _screenshot(suffix) {
    try {
      if (!fs.existsSync(SCREENSHOTS_DIR)) {
        fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
      }
      const name = `${this.teamName.replace(/\s+/g, '-').toLowerCase()}-${suffix}.png`;
      await this.page.screenshot({
        path: path.join(SCREENSHOTS_DIR, name),
        fullPage: true,
      });
    } catch {}
  }
}

module.exports = { PlayerBot };
