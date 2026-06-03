import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getApiUrl, getApiHeaders } from './api';

let echoSingleton = null;

/**
 * Echo + Pusher-протокол (локально — Soketi). Без NEXT_PUBLIC_PUSHER_APP_KEY возвращает null.
 */
export function getEcho() {
  if (typeof window === 'undefined') return null;
  const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  if (!key) return null;

  if (!echoSingleton) {
    window.Pusher = Pusher;
    const scheme = process.env.NEXT_PUBLIC_PUSHER_SCHEME || 'http';
    const forceTLS = scheme === 'https';
    const host = process.env.NEXT_PUBLIC_PUSHER_HOST || '127.0.0.1';
    const port = parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT || '6001', 10);

    echoSingleton = new Echo({
      broadcaster: 'pusher',
      key,
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'mt1',
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS,
      encrypted: forceTLS,
      disableStats: true,
      enabledTransports: forceTLS ? ['ws', 'wss'] : ['ws'],
      authEndpoint: getApiUrl('/broadcasting/auth'),
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          fetch(getApiUrl('/broadcasting/auth'), {
            method: 'POST',
            headers: getApiHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          })
            .then((res) => {
              if (!res.ok) {
                return res.text().then((t) => {
                  throw new Error(t || res.statusText);
                });
              }
              return res.json();
            })
            .then((data) => callback(false, data))
            .catch((err) => callback(true, err));
        },
      }),
    });
  }

  return echoSingleton;
}

export function disconnectEcho() {
  if (echoSingleton && typeof echoSingleton.disconnect === 'function') {
    echoSingleton.disconnect();
  }
  echoSingleton = null;
}
