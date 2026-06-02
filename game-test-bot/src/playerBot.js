'use strict';

const path = require('path');
const SELECTORS = require('./selectors');
const logger    = require('./logger');
const { randomInt, ensureDir } = require('./utils');

// Answer labels matching ANSWER_LABELS in quiz-fe/src/libs/utils.ts
const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

class PlayerBot {
  constructor({ browser, teamName, config }) {
    this.browser  = browser;
    this.teamName = teamName;
    this.config   = config;

    this.context = null;
    this.page    = null;

    // Stats
    this.questionsAnswered    = 0;
    this.successfulSubmissions = 0;
    this.errors               = 0;

    this._screenshotsDir = path.resolve(__dirname, '../screenshots');
    ensureDir(this._screenshotsDir);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────

  async init() {
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    this.page = await this.context.newPage();

    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('WebSocket') && !text.includes('ERR_')) {
          logger.warn(this.teamName, `[browser] ${text.slice(0, 120)}`);
        }
      }
    });

    this.page.on('crash', () => logger.error(this.teamName, 'Page crashed!'));
  }

  async cleanup() {
    if (this.context) {
      await this.context.close().catch(() => {});
    }
  }

  // ── Join Flow ────────────────────────────────────────────────────────

  async joinRoom() {
    const { baseUrl, roomId } = this.config;
    const url = `${baseUrl}/join?room=${roomId}`;

    logger.log(this.teamName, `Navigating → ${url}`);

    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    const teamNameVisible = await this.page
      .waitForSelector(SELECTORS.teamNameInput, { timeout: 8_000 })
      .then(() => true)
      .catch(() => false);

    if (!teamNameVisible) {
      logger.log(this.teamName, 'Step 1 visible, filling room code...');

      const roomInput = await this.page.$(SELECTORS.roomCodeInput);
      if (!roomInput) throw new Error('Cannot find room code input on join page');

      await this.page.fill(SELECTORS.roomCodeInput, roomId);
      await this.page.waitForTimeout(200);

      await this.page.click(SELECTORS.step1NextButton);
      await this.page.waitForSelector(SELECTORS.teamNameInput, { timeout: 8_000 });
    }

    await this.page.fill(SELECTORS.teamNameInput, this.teamName);
    await this.page.waitForTimeout(150);

    await this.page.click(SELECTORS.joinButton);

    try {
      await this.page.waitForURL('**/player/waiting', { timeout: 20_000 });
    } catch {
      const errText = await this.page
        .locator('[class*="text-red"], [class*="error"]')
        .first()
        .textContent()
        .catch(() => '');

      throw new Error(
        errText
          ? `Join failed: ${errText.trim()}`
          : 'Navigation to /player/waiting timed out'
      );
    }

    logger.success(this.teamName, 'Joined room ✓ — waiting for game...');
  }

  // ── Waiting Room ────────────────────────────────────────────────────

  async waitForGameStart() {
    await this.page.waitForURL('**/player/game', { timeout: 0 });
    logger.success(this.teamName, 'Game started — entering game!');
  }

  // ── Game Loop ────────────────────────────────────────────────────────

  async playGame() {
    logger.log(this.teamName, 'In game — waiting for first round to start...');

    while (true) {
      // Poll until fresh question available OR game finishes
      const answerButtons = await this._waitForFreshQuestion();

      if (!answerButtons) {
        // null means game finished detected
        break;
      }

      this.questionsAnswered++;
      const qNum = this.questionsAnswered;

      const qText = await this.page
        .locator(SELECTORS.questionText)
        .first()
        .textContent()
        .catch(() => '?');
      logger.log(this.teamName, `Q#${qNum}: ${qText.trim().slice(0, 70)}`);

      // Human-like delay before answering
      const delay = randomInt(this.config.submitDelayMinMs, this.config.submitDelayMaxMs);
      logger.log(this.teamName, `Q#${qNum}: thinking ${delay}ms...`);
      await this.page.waitForTimeout(delay);

      // Re-check: question still open? (might have closed while we were thinking)
      const freshButtons = await this._getEnabledAnswerButtons();
      if (!freshButtons || freshButtons.length === 0) {
        logger.warn(this.teamName, `Q#${qNum}: question closed before we could answer`);
        continue;
      }

      const idx   = this.config.randomAnswer ? randomInt(0, freshButtons.length - 1) : 0;
      const label = ANSWER_LABELS[idx] ?? String(idx + 1);

      // Step 1: click answer button to select it
      try {
        await freshButtons[idx].click({ timeout: 3_000 });
        logger.log(this.teamName, `Q#${qNum}: selected ${label}`);
      } catch (e) {
        logger.warn(this.teamName, `Q#${qNum}: click answer failed — ${e.message}`);
        if (this.config.screenshotOnError) await this._screenshot(`q${qNum}-click-err`);
        continue;
      }

      // Step 2: wait for "Chốt kèo" to become enabled (React updates selectedId), then submit
      try {
        await this._submitAnswer(qNum);
        this.successfulSubmissions++;
        logger.success(this.teamName, `Q#${qNum}: submitted (${label}) ✓`);
      } catch (e) {
        if (e.message.includes('409') || /already.submit/i.test(e.message) || e.message === 'duplicate') {
          logger.warn(this.teamName, `Q#${qNum}: duplicate submit — ignored`);
        } else {
          this.errors++;
          logger.error(this.teamName, `Q#${qNum}: submit error — ${e.message}`);
          if (this.config.screenshotOnError) await this._screenshot(`q${qNum}-submit-err`);
        }
      }
    }

    await this._onFinish();
  }

  // ── Internal Helpers ─────────────────────────────────────────────────

  /**
   * Poll until a fresh question is ready or the game ends.
   * Returns enabled answer button locators, or null when game is finished.
   *
   * A "fresh" question = answer buttons present AND not disabled.
   * After submitting, answer buttons become disabled (alreadySubmitted=true in React).
   * After question closes, answer buttons disappear (ClosedScreen renders).
   */
  async _waitForFreshQuestion() {
    let lastState = '';

    while (true) {
      // Game finished → clean exit
      if (await this._isGameFinished()) {
        logger.success(this.teamName, 'Game finished!');
        return null;
      }

      // Fresh question = at least one enabled answer button (A–D) in the DOM
      const buttons = await this._getEnabledAnswerButtons();
      if (buttons && buttons.length > 0) {
        if (lastState !== 'question') {
          logger.log(this.teamName, 'Question started — ready to answer.');
          lastState = 'question';
        }
        return buttons;
      }

      // Determine waiting state for logging
      const state = await this._detectWaitState();
      if (state !== lastState) {
        if (state === 'waiting-round')   logger.log(this.teamName, 'Waiting for round to start...');
        if (state === 'question-closed') logger.log(this.teamName, 'Question closed — waiting for next question...');
        if (state === 'submitted')       logger.log(this.teamName, 'Answer submitted — waiting for question to close...');
        lastState = state;
      }

      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Detect which waiting state we're in (for logging only).
   *
   * States:
   *   waiting-round   — WaitingForRound screen ("Sắp bắt đầu")
   *   question-closed — ClosedScreen ("Đáp án" badge)
   *   submitted       — answer buttons present but all disabled (already submitted this question)
   *   loading         — transitioning / initial load
   */
  async _detectWaitState() {
    // WaitingForRound screen
    const waitCount = await this.page.locator('text=Sắp bắt đầu').count().catch(() => 0);
    if (waitCount > 0) return 'waiting-round';

    // ClosedScreen — "Đáp án" badge
    const closedCount = await this.page.locator('text=Đáp án').count().catch(() => 0);
    if (closedCount > 0) return 'question-closed';

    // Answer buttons present but disabled → we already submitted this question
    const allButtons = await this._getAnswerButtons();
    if (allButtons && allButtons.length > 0) {
      const isDisabled = await allButtons[0].isDisabled().catch(() => false);
      if (isDisabled) return 'submitted';
    }

    return 'loading';
  }

  /** True when the game-finished screen ("Trận đấu kết thúc!") is rendered. */
  async _isGameFinished() {
    const count = await this.page
      .locator('h2')
      .filter({ hasText: 'Trận đấu kết thúc!' })
      .count()
      .catch(() => 0);
    return count > 0;
  }

  /**
   * Returns ALL answer buttons (A–D) in the DOM (enabled or disabled).
   */
  async _getAnswerButtons() {
    return this.page
      .locator('button')
      .filter({ has: this.page.locator('span').filter({ hasText: /^[A-D]$/ }) })
      .all()
      .catch(() => []);
  }

  /**
   * Returns only the ENABLED (not disabled) answer buttons.
   * Disabled buttons mean the question has already been submitted.
   */
  async _getEnabledAnswerButtons() {
    const all = await this._getAnswerButtons();
    if (!all || all.length === 0) return [];

    const enabled = [];
    for (const btn of all) {
      const disabled = await btn.isDisabled().catch(() => true);
      if (!disabled) enabled.push(btn);
    }
    return enabled;
  }

  /**
   * Wait for "Chốt kèo" to become enabled (selectedId was set by clicking answer),
   * then click it to submit.
   *
   * "Chốt kèo" starts as disabled={!selectedId || submitting}, so it becomes
   * clickable only after the user selects an answer.
   */
  async _submitAnswer(qNum) {
    // Wait for submit button to become enabled (React re-renders after answer selection)
    const submitLocator = this.page.locator('button').filter({ hasText: 'Chốt kèo' }).first();

    const becameEnabled = await this.page.waitForFunction(
      () => {
        const btns = [...document.querySelectorAll('button')];
        const btn = btns.find(b => b.textContent.trim() === 'Chốt kèo');
        return btn && !btn.disabled;
      },
      { timeout: 3_000, polling: 100 }
    ).then(() => true).catch(() => false);

    if (!becameEnabled) {
      // Could be question already closed or already submitted
      const isVisible  = await submitLocator.isVisible().catch(() => false);
      const isDisabled = await submitLocator.isDisabled().catch(() => true);

      if (!isVisible)  throw new Error('Submit button not visible');
      if (isDisabled)  throw new Error('duplicate');
    }

    await submitLocator.click({ timeout: 5_000 });

    // Wait for button to enter loading/disabled state (confirms React processed the click)
    await this.page.waitForFunction(
      () => {
        const btns = [...document.querySelectorAll('button')];
        const btn  = btns.find(b => b.textContent.includes('Chốt kèo') || b.textContent.includes('Đang gửi'));
        if (!btn) return true; // button disappeared = submitted & moved to next state
        return btn.disabled || btn.textContent.includes('Đang gửi');
      },
      { timeout: 10_000, polling: 200 }
    ).catch(() => {});
  }

  async _screenshot(tag) {
    try {
      const name = `${this.teamName.replace(/\s+/g, '-')}-${tag}.png`;
      const filepath = path.join(this._screenshotsDir, name);
      await this.page.screenshot({ path: filepath, fullPage: true });
      logger.log(this.teamName, `Screenshot → ${name}`);
    } catch {
      // Non-critical
    }
  }

  async _onFinish() {
    logger.success(
      this.teamName,
      `Finished. Questions: ${this.questionsAnswered} | Submitted: ${this.successfulSubmissions} | Errors: ${this.errors}`
    );
    await this._screenshot('finished');
  }

  // ── Stats ─────────────────────────────────────────────────────────────

  getStats() {
    return {
      teamName:              this.teamName,
      questionsAnswered:     this.questionsAnswered,
      successfulSubmissions: this.successfulSubmissions,
      errors:                this.errors,
    };
  }
}

module.exports = PlayerBot;
