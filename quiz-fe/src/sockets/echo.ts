import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// @ts-ignore
window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: 'pusher',
  key: 'your-pusher-key',
  wsHost: 'localhost',
  wsPort: 6001,
  forceTLS: false,
  disableStats: true,
});

export default echo;
