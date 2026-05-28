import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(window as any).Pusher = Pusher;

let echo: Echo<'reverb'> | null = null;
let playerEcho: Echo<'reverb'> | null = null;

function buildEcho(token?: string): Echo<'reverb'> {
  const scheme   = import.meta.env.VITE_REVERB_SCHEME ?? 'http';
  const port     = Number(import.meta.env.VITE_REVERB_PORT ?? (scheme === 'https' ? 443 : 80));
  const forceTLS = scheme === 'https';

  const config: ConstructorParameters<typeof Echo>[0] = {
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: port,
    wssPort: port,
    forceTLS,
    enabledTransports: ['ws', 'wss'],
  };

  if (token) {
    (config as any).authEndpoint = `${import.meta.env.VITE_API_BASE_URL}/broadcasting/auth`;
    (config as any).auth = { headers: { Authorization: `Bearer ${token}` } };
  }

  return new Echo(config);
}

/** Unauthenticated Echo — for stage / admin / public channels */
export function getEcho(): Echo<'reverb'> {
  if (!echo) echo = buildEcho();
  return echo;
}

/** Authenticated Echo — for players joining presence channels */
export function getPlayerEcho(token: string): Echo<'reverb'> {
  if (!playerEcho) playerEcho = buildEcho(token);
  return playerEcho;
}

export function resetPlayerEcho(): void {
  playerEcho?.disconnect();
  playerEcho = null;
}
