import { Subscription } from '../types/subscription';
import { AppSettings } from '../types/settings';
import { DEFAULT_BASE_CURRENCY, DEFAULT_EXCHANGE_RATES } from '../data/currencies';
import { migrateCurrencySymbolToISO } from './currency';

const STORAGE_VERSION = 2;

export interface AppStoredData {
  version: number;
  subscriptions: Subscription[];
  lastModified: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  baseCurrency: DEFAULT_BASE_CURRENCY,
  exchangeRates: DEFAULT_EXCHANGE_RATES,
  lastRatesUpdate: new Date().toISOString(),
  defaultReminderDays: 7,
  monthlyBudget: 3500,
  browserNotificationsEnabled: false,
  themeIntensity: 'standard',
  autoLockMinutes: 0,
  pinLockEnabled: false,
  appPin: '',
  privacyModeHideAmounts: false,
  gamificationEnabled: true,
  trialGuardAutoPlan: true,
  onboardingCompleted: false,
};

function getSubStorageKey(userId?: string): string {
  if (!userId || userId === 'guest') {
    return 'subtrack_subscriptions';
  }
  return `subtrack_data_${userId}`;
}

function getSettingsStorageKey(userId?: string): string {
  if (!userId || userId === 'guest') {
    return 'subtrack_settings_guest';
  }
  return `subtrack_settings_${userId}`;
}

/**
 * Loads subscriptions safely from localStorage, migrating currency symbols and schema versions.
 */
export function loadSubscriptions(userId?: string): Subscription[] {
  try {
    const key = getSubStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    let items: Subscription[] = [];

    // Support both raw arrays and versioned objects
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && Array.isArray(parsed.subscriptions)) {
      items = parsed.subscriptions;
    }

    // Schema migration & currency ISO validation
    return items.map((sub) => ({
      ...sub,
      currency: migrateCurrencySymbolToISO(sub.currency || 'INR'),
      splitCount: sub.splitCount || 1,
      priceHistory: Array.isArray(sub.priceHistory) && sub.priceHistory.length > 0
        ? sub.priceHistory.map((ph) => ({
            ...ph,
            currency: migrateCurrencySymbolToISO(ph.currency || sub.currency || 'INR'),
          }))
        : [
            {
              id: 'init-' + sub.id,
              date: sub.startDate || new Date().toISOString().split('T')[0],
              price: sub.price,
              currency: migrateCurrencySymbolToISO(sub.currency || 'INR'),
              reason: 'Initial record',
            },
          ],
      reminderDaysBefore: sub.reminderDaysBefore || (sub.billingCycle === 'Yearly' ? 7 : 2),
      status: sub.status || (sub.isFreeTrial ? 'trial' : 'active'),
    }));
  } catch (err) {
    console.error('Error loading subscriptions from localStorage, returning empty array:', err);
    return [];
  }
}

/**
 * Saves subscriptions to localStorage with schema version.
 */
export function saveSubscriptions(subscriptions: Subscription[], userId?: string): void {
  try {
    const key = getSubStorageKey(userId);
    const data: AppStoredData = {
      version: STORAGE_VERSION,
      subscriptions,
      lastModified: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save subscriptions to localStorage:', err);
  }
}

/**
 * Loads user settings safely from localStorage.
 */
export function loadSettings(userId?: string): AppSettings {
  try {
    const key = getSettingsStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      exchangeRates: {
        ...DEFAULT_EXCHANGE_RATES,
        ...(parsed.exchangeRates || {}),
      },
    };
  } catch (err) {
    console.error('Failed to load settings, falling back to defaults:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Saves user settings safely to localStorage.
 */
export function saveSettings(settings: AppSettings, userId?: string): void {
  try {
    const key = getSettingsStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

/**
 * Migrates guest subscriptions to a new logged-in user account.
 */
export function migrateGuestDataToUser(userId: string): number {
  const guestSubs = loadSubscriptions('guest');
  if (guestSubs.length === 0) return 0;

  const userSubs = loadSubscriptions(userId);
  const combined = [...userSubs];

  for (const g of guestSubs) {
    if (!combined.some((s) => s.id === g.id)) {
      combined.push(g);
    }
  }

  saveSubscriptions(combined, userId);
  // Clear guest data
  localStorage.removeItem(getSubStorageKey('guest'));
  return guestSubs.length;
}

/**
 * Clears all data for a specific user.
 */
export function clearUserData(userId?: string): void {
  localStorage.removeItem(getSubStorageKey(userId));
  localStorage.removeItem(getSettingsStorageKey(userId));
}
