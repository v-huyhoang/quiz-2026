// All DOM selectors centralized here.
// Based on quiz-fe source — update if FE changes.

module.exports = {
  // ── JoinRoom (/join) ──────────────────────────────────────────────────────
  roomCodeInput:  'input[placeholder*="XYZ123"]',
  teamNameInput:  'input[placeholder*="Nhập tên đội"]',
  // Only one form is visible at a time, so button[type="submit"] is unambiguous
  formSubmit:     'button[type="submit"]',

  // ── PlayerGame (/player/game) ─────────────────────────────────────────────
  // Grid containing the 4 answer buttons
  answerGrid:     '[data-testid="answer-grid"]',
  // All answer buttons within the grid
  answerButtons:  '[data-testid="answer-button"]',
  // The label span (A / B / C / D) inside each answer button
  answerLabel:    '[data-testid="answer-label"]',
  // Submit button
  submitButton:   '[data-testid="submit-button"]',
  // Submitted state indicator
  submittedBadge: ':text("Đã nộp")',
};
