export type BillingCycle = 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export type SubscriptionStatus = 'active' | 'trial' | 'paused' | 'cancelled';

export type Category =
  | 'Entertainment'
  | 'Music'
  | 'Productivity'
  | 'Education'
  | 'Shopping'
  | 'Fitness'
  | 'Software'
  | 'Other';

export interface PriceHistoryEntry {
  id: string;
  date: string;
  price: number;
  currency: string;
  reason?: string;
}

export interface UsageCheckIn {
  lastUsedDate?: string;
  frequency: 'daily' | 'several_times_week' | 'few_times_month' | 'rarely' | 'never';
  estimatedUsesPerMonth: number;
  lastCheckedDate: string;
}

export interface ProofOfCancellation {
  cancelledAt: string;
  referenceNumber?: string;
  note?: string;
  imageDataUri?: string;
}

export interface Subscription {
  id: string;
  name: string;
  category: Category;
  price: number;
  currency: string; // ISO 4217, e.g. "INR"
  billingCycle: BillingCycle;
  startDate: string; // YYYY-MM-DD
  nextRenewalDate: string; // YYYY-MM-DD
  status: SubscriptionStatus;
  isFreeTrial: boolean;
  trialEndDate?: string; // YYYY-MM-DD
  trialConvert?: boolean; // whether trial converts to a paid plan
  cancellationUrl?: string;
  notes?: string;
  reminderDaysBefore: number; // e.g. 1, 2, 3, 7, 14
  splitCount: number; // default 1 (my share = price / splitCount)
  isSeasonal?: boolean;
  resubscribeDate?: string; // YYYY-MM-DD
  priceHistory: PriceHistoryEntry[];
  usageCheckIn?: UsageCheckIn;
  proofOfCancellation?: ProofOfCancellation;
  createdAt: string;
  updatedAt: string;
}

export type ReminderStatusType =
  | 'due_today'
  | 'trial_ends_today'
  | 'trial_ending'
  | 'trial_ended'
  | 'renewing_soon' // <= 7 days
  | 'active'
  | 'paused'
  | 'cancelled'
  | 'expired';

export interface ReminderInfo {
  type: ReminderStatusType;
  label: string;
  daysRemaining: number;
  isUrgent: boolean; // Pink accent
}
