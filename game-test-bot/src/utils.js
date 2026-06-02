/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Random integer between min and max (inclusive).
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random delay between min and max ms.
 */
function randomDelay(minMs, maxMs) {
  return randomInt(minMs, maxMs);
}

/**
 * Format elapsed milliseconds as "Xm Ys".
 */
function formatDuration(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return mins > 0 ? `${mins}m${secs}s` : `${secs}s`;
}

module.exports = { sleep, randomInt, randomDelay, formatDuration };
