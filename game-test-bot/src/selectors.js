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
  answerGrid:     '.grid.gap-4',
  // All answer buttons within the grid
  answerButtons:  '.grid.gap-4 button',
  // The label span (A / B / C / D) inside each answer button
  answerLabel:    'span.w-8',
  // Submit button
  submitButton:   'button:has-text("Chốt kèo")',
  // Submitted state indicator
  submittedBadge: ':text("Đã nộp")',
};
