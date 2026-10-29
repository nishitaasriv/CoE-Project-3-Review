import { BillingCycle } from '../types/subscription';

/**
 * Normalizes a date to YYYY-MM-DD
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD safely into a local Date object (ignoring timezone drift)
 */
export function parseISODate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return new Date(dateStr);
  return new Date(y, m - 1, d, 12, 0, 0); // Noon prevents DST shifts
}

/**
 * Calculates days remaining between today and target date.
 * Returns negative if target date is in the past.
 */
export function getDaysRemaining(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  const target = parseISODate(targetDateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats date into readable string, e.g. "04 Nov 2026" or "Nov 4, 2026"
 */
export function formatDate(dateStr: string, locale = 'en-IN'): string {
  if (!dateStr) return '—';
  try {
    const d = parseISODate(dateStr);
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Auto-rolls a renewal date forward by the billing cycle until it is strictly in the future.
 */
export function rollForwardRenewalDate(currentDateStr: string, cycle: BillingCycle): string {
  if (!currentDateStr) return toISODateString(new Date());

  const current = parseISODate(currentDateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  // If already in the future, keep it
  if (current.getTime() >= today.getTime()) {
    return currentDateStr;
  }

  const rolled = new Date(current);
  let iterations = 0;
  const maxIterations = 500; // safety brake

  while (rolled.getTime() < today.getTime() && iterations < maxIterations) {
    iterations++;
    switch (cycle) {
      case 'Weekly':
        rolled.setDate(rolled.getDate() + 7);
        break;
      case 'Monthly':
        rolled.setMonth(rolled.getMonth() + 1);
        break;
      case 'Quarterly':
        rolled.setMonth(rolled.getMonth() + 3);
        break;
      case 'Yearly':
        rolled.setFullYear(rolled.getFullYear() + 1);
        break;
      default:
        rolled.setMonth(rolled.getMonth() + 1);
    }
  }

  return toISODateString(rolled);
}
