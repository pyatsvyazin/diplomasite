import { useEffect } from 'react';
import { getEcho } from '../lib/echo';
import {
  notifyAdminBadgeRefresh,
  notifyAdminMeetingUpdated,
  notifyAdminRequestUpdated,
} from '../lib/adminEvents';

const POLL_MS = 5000;

/**
 * WebSocket (канал staff) + fallback-polling для админ-панели.
 */
export function useAdminRealtime({ enabled, onPoll }) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const echo = getEcho();
    let channel = null;

    if (echo) {
      channel = echo.private('staff');
      channel.listen('.request.updated', (payload) => {
        if (payload?.request) {
          notifyAdminRequestUpdated(payload.request);
        } else {
          notifyAdminBadgeRefresh();
        }
      });
      channel.listen('.meeting.updated', (payload) => {
        if (payload) {
          notifyAdminMeetingUpdated(payload);
        }
      });
    }

    const poll = () => {
      if (document.visibilityState !== 'visible') return;
      onPoll?.();
    };

    poll();
    const intervalId = setInterval(poll, POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
      if (channel) {
        channel.stopListening('.request.updated');
        channel.stopListening('.meeting.updated');
        echo?.leave('staff');
      }
    };
  }, [enabled, onPoll]);
}
