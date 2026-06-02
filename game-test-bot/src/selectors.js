'use strict';

/**
 * DOM selectors for Quiz Stack 2026 frontend.
 *
 * Based on quiz-fe/src/apps/player/ source code.
 * Update here if the UI changes — never hard-code in business logic.
 */
module.exports = {
  // ── Join Room: Step 1 ──────────────────────────────────────────────
  // input[placeholder="Ví dụ: XYZ123"] — auto-focused, uppercase
  roomCodeInput: 'input[placeholder="Ví dụ: XYZ123"]',

  // "Tiếp tục" button — advances from step 1 to step 2
  step1NextButton: 'button:has-text("Tiếp tục")',

  // ── Join Room: Step 2 ──────────────────────────────────────────────
  // input[placeholder="Nhập tên đội..."] — maxLength 50
  teamNameInput: 'input[placeholder="Nhập tên đội..."]',

  // "Vào phòng" button — submits join request
  joinButton: 'button:has-text("Vào phòng")',

  // Loading state text (join in progress)
  joinButtonLoading: 'button:has-text("Đang vào phòng")',

  // ── Game Screen ────────────────────────────────────────────────────
  // Question text — large h2 heading
  questionText: 'h2',

  // Submit button — "Chốt kèo" (enabled = fresh question, disabled = already submitted)
  submitButton: 'button:has-text("Chốt kèo")',

  // Submit in progress
  submitButtonLoading: 'button:has-text("Đang gửi")',

  // ── Answer Buttons ─────────────────────────────────────────────────
  // Answer buttons each contain a <span> with exactly one letter: A, B, C, or D.
  // Resolved dynamically in playerBot.js using Playwright's .filter() chain.
  // ANSWER_LABEL_PATTERN: /^[A-D]$/
};
