import { Subscription } from '../types/subscription';
import { parseISODate } from './dates';
import { downloadFile } from './export';
import { formatMoney } from './currency';

function formatICSDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  return `${y}${m}${d}T090000Z`;
}

/**
 * Generates an RFC 5545 iCalendar string for a list of subscription renewal events.
 */
export function generateICSContent(subscriptions: Subscription[]): string {
  const now = new Date();
  const stamp = formatICSDate(now);

  const events = subscriptions.map((sub) => {
    const renewalDate = parseISODate(sub.nextRenewalDate);
    const startStr = formatICSDate(renewalDate);
    const endStr = formatICSDate(new Date(renewalDate.getTime() + 60 * 60 * 1000));
    const title = `${sub.name} Renewal (${formatMoney(sub.price, sub.currency)})`;
    const desc = `SubTrack Reminder: Your ${sub.name} subscription (${sub.billingCycle}) will renew on ${sub.nextRenewalDate}. Price: ${formatMoney(sub.price, sub.currency)}.${sub.cancellationUrl ? '\\nCancellation URL: ' + sub.cancellationUrl : ''}`;

    return [
      'BEGIN:VEVENT',
      `UID:subtrack-${sub.id}-${sub.nextRenewalDate}@subtrack.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'DESCRIPTION:Reminder: Subscription renewing tomorrow',
      'ACTION:DISPLAY',
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SubTrack//Subscription Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Downloads a calendar file (.ics) for a single subscription or all active subscriptions.
 */
export function downloadCalendarEvent(sub: Subscription): void {
  const ics = generateICSContent([sub]);
  const filename = `${sub.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-renewal.ics`;
  downloadFile(ics, filename, 'text/calendar;charset=utf-8');
}

export function downloadAllCalendarEvents(subscriptions: Subscription[]): void {
  const activeSubs = subscriptions.filter((s) => s.status === 'active' || s.status === 'trial');
  const ics = generateICSContent(activeSubs);
  downloadFile(ics, 'subtrack-renewals.ics', 'text/calendar;charset=utf-8');
}
