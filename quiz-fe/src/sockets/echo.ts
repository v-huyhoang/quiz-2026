import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// @ts-ignore
window.Pusher = Pusher;

const appKey = import.meta.env.VITE_REVERB_APP_KEY;

let echo: Echo | null = null;

if (appKey) {
  echo = new Echo({
    broadcaster: 'pusher',
    key: appKey,

    wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',

    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),

    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),

    forceTLS:
      (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',

    enabledTransports: ['ws', 'wss'],

    cluster: 'mt1',

    disableStats: true,
  });
} else {
  console.warn(
    'VITE_REVERB_APP_KEY is missing. Echo websocket disabled.'
  );
}

export default echo;