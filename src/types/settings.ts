import { ExchangeRateMap } from './currency';

export interface AppSettings {
  baseCurrency: string; // Default 'INR'
  exchangeRates: ExchangeRateMap; // rate relative to 1 USD
  lastRatesUpdate: string;
  defaultReminderDays: number; // e.g. 7
  monthlyBudget: number; // in base currency
  browserNotificationsEnabled: boolean;
  themeIntensity: 'standard' | 'vibrant' | 'minimal';
  autoLockMinutes: number; // 0 for off, or 5, 15, 30
  pinLockEnabled: boolean;
  appPin?: string;
  privacyModeHideAmounts: boolean;
  gamificationEnabled: boolean;
  trialGuardAutoPlan: boolean;
  onboardingCompleted: boolean;
}
