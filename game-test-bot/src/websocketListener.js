const EventEmitter = require('events');

/**
 * Intercepts WebSocket frames on a Playwright page and emits game events.
 *
 * Reverb uses the Pusher protocol. Each frame is JSON:
 *   { "event": "question.started", "channel": "game.3", "data": "{...}" }
 *
 * Events emitted match broadcastAs() return values:
 *   game.started, question.started, question.closed,
 *   round.finished, game.finished, team.joined
 */
class WebSocketListener extends EventEmitter {
  constructor(page) {
    super();
    this.setMaxListeners(200);
    this._page = page;
    this._setup();
  }

  _setup() {
    this._page.on('websocket', ws => {
      ws.on('framereceived', ({ payload }) => this._onFrame(payload));
    });
  }

  _onFrame(payload) {
    try {
      const msg = JSON.parse(payload);

      // Skip internal Pusher protocol messages
      if (!msg.event || msg.event.startsWith('pusher:')) return;

      const eventName = msg.event; // e.g. "question.started"
      let data = {};
      if (msg.data) {
        data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
      }

      this.emit(eventName, data);
    } catch {
      // Ignore malformed frames
    }
  }

  /**
   * Returns a Promise that resolves with the event data when eventName fires.
   * Rejects after timeoutMs with a Timeout error.
   */
  waitFor(eventName, timeoutMs = 120000) {
    return new Promise((resolve, reject) => {
      let timer;

      const handler = (data) => {
        clearTimeout(timer);
        resolve(data);
      };

      timer = setTimeout(() => {
        this.removeListener(eventName, handler);
        reject(new Error(`Timeout (${timeoutMs}ms) waiting for: ${eventName}`));
      }, timeoutMs);

      this.once(eventName, handler);
    });
  }
}

module.exports = { WebSocketListener };
