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
    this._authToken = null;
    this._gameId    = null;
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
      await this._leaveGame();
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

    // Read auth token + gameId from Zustand persist store in localStorage
    const auth = await this.page.evaluate(() => {
      try {
        const raw = localStorage.getItem('quiz-auth');
        if (!raw) return null;
        const { state } = JSON.parse(raw);
        return { token: state?.token ?? null, gameId: state?.gameId ?? null };
      } catch { return null; }
    });
    this._authToken = auth?.token ?? null;
    this._gameId    = auth?.gameId ?? null;

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
    // Wait for answer grid to be visible
    await this.page.locator(selectors.answerGrid).waitFor({ timeout: 10000 });

    const buttons = await this.page.locator(selectors.answerButtons).all();
    if (buttons.length === 0) throw new Error('No answer buttons found');

    // Pick a random (or first) answer
    const idx = this.config.randomAnswer
      ? Math.floor(Math.random() * buttons.length)
      : 0;
    const chosen = buttons[idx];

    // Get label text (A/B/C/D) for logging
    let label = String.fromCharCode(65 + idx); // fallback: A/B/C/D by index
    try {
      const labelEl = chosen.locator(selectors.answerLabel).first();
      const text = await labelEl.textContent({ timeout: 2000 });
      if (text?.trim()) label = text.trim();
    } catch {}

    await chosen.click();

    // Click submit button
    await this.page.locator(selectors.submitButton).waitFor({ timeout: 5000 });
    await this.page.locator(selectors.submitButton).click();

    return label;
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

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  async _leaveGame() {
    if (!this._authToken || !this._gameId || !this.config.apiBaseUrl) return;
    try {
      const res = await fetch(`${this.config.apiBaseUrl}/games/${this._gameId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this._authToken}`,
          'Accept': 'application/json',
        },
      });
      if (res.ok) {
        logger.log(this.teamName, 'Left game (cleanup)');
      }
    } catch (err) {
      logger.warn?.(this.teamName, `Leave failed: ${err.message}`);
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
