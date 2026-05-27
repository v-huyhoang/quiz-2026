import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(window as any).Pusher = Pusher;

let echo: Echo<'reverb'> | null = null;

export function getEcho() {
  if (!echo) {
    const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'http';
    const port = Number(import.meta.env.VITE_REVERB_PORT ?? (scheme === 'https' ? 443 : 80));
    const forceTLS = scheme === 'https';

    echo = new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST,
      wsPort: port,
      wssPort: port,
      forceTLS,
      enabledTransports: ['ws', 'wss'],
    });
  }

  return echo;
}
