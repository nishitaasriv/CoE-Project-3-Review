import { useCallback, useEffect, useState } from 'react';
import { Subscription } from '../types/subscription';
import { getSubscriptionReminder } from '../lib/reminders';
import { formatMoney } from '../lib/currency';

export function useNotifications(subscriptions: Subscription[], enabled: boolean) {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'default';
  });

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return false;
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      return res === 'granted';
    } catch {
      return false;
    }
  }, []);

  // Check reminders on load / when enabled
  useEffect(() => {
    if (!enabled || permission !== 'granted' || typeof Notification === 'undefined') return;

    const urgentItems = subscriptions.filter((s) => {
      if (s.status !== 'active' && s.status !== 'trial') return false;
      const r = getSubscriptionReminder(s);
      return r.isUrgent || (r.daysRemaining <= s.reminderDaysBefore && r.daysRemaining >= 0);
    });

    if (urgentItems.length > 0) {
      // Send summary notification if not already sent today
      const todayKey = 'subtrack_notified_' + new Date().toISOString().split('T')[0];
      if (!sessionStorage.getItem(todayKey)) {
        sessionStorage.setItem(todayKey, 'true');
        const first = urgentItems[0];
        const reminder = getSubscriptionReminder(first);

        new Notification('SubTrack: Upcoming Renewal Alert', {
          body: `${first.name} (${formatMoney(first.price, first.currency)}): ${reminder.label}.`,
          icon: '/pwa-192x192.png',
        });
      }
    }
  }, [subscriptions, enabled, permission]);

  return {
    permission,
    isSupported: typeof Notification !== 'undefined',
    requestPermission,
  };
}
