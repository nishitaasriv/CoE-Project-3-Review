import { ReminderInfo, Subscription } from '../types/subscription';
import { getDaysRemaining } from './dates';

/**
 * Computes reminder status for any subscription based on current date.
 * Strictly adheres to Section 10 color palette (Blue, Purple, Pink, Navy).
 */
export function getSubscriptionReminder(sub: Subscription): ReminderInfo {
  if (sub.status === 'cancelled') {
    return {
      type: 'cancelled',
      label: 'Cancelled',
      daysRemaining: 0,
      isUrgent: false,
    };
  }

  if (sub.status === 'paused') {
    return {
      type: 'paused',
      label: 'Paused',
      daysRemaining: 0,
      isUrgent: false,
    };
  }

  // Free trial logic
  if (sub.isFreeTrial && sub.trialEndDate) {
    const trialDays = getDaysRemaining(sub.trialEndDate);

    if (trialDays === 0) {
      return {
        type: 'trial_ends_today',
        label: 'Trial ends today',
        daysRemaining: 0,
        isUrgent: true, // Pink accent
      };
    } else if (trialDays < 0) {
      return {
        type: 'trial_ended',
        label: 'Trial ended',
        daysRemaining: trialDays,
        isUrgent: true, // Pink accent
      };
    } else if (trialDays <= 3) {
      return {
        type: 'trial_ending',
        label: `Trial ends in ${trialDays}d`,
        daysRemaining: trialDays,
        isUrgent: true, // Pink accent
      };
    } else {
      return {
        type: 'trial_ending',
        label: `Trial ends in ${trialDays}d`,
        daysRemaining: trialDays,
        isUrgent: false,
      };
    }
  }

  // Renewal logic
  const days = getDaysRemaining(sub.nextRenewalDate);

  if (days < 0) {
    return {
      type: 'expired',
      label: 'Past due',
      daysRemaining: days,
      isUrgent: true, // Pink outline
    };
  }

  if (days === 0) {
    return {
      type: 'due_today',
      label: 'Due today',
      daysRemaining: 0,
      isUrgent: true, // Pink accent
    };
  }

  if (days <= 7) {
    return {
      type: 'renewing_soon',
      label: days === 1 ? 'Renews tomorrow' : `Renews in ${days}d`,
      daysRemaining: days,
      isUrgent: days <= 3, // Urgent pink if <= 3d, otherwise purple
    };
  }

  return {
    type: 'active',
    label: 'Active',
    daysRemaining: days,
    isUrgent: false,
  };
}
