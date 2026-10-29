import { CurrencyInfo, ExchangeRateMap } from '../types/currency';

/**
 * Currency Registry for SubTrack.
 * To add an 11th currency in the future, simply add one object to this array.
 * INR is mandatory, default, and cannot be removed or disabled.
 */
export const CURRENCY_REGISTRY: CurrencyInfo[] = [
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    region: 'India',
    flag: '🇮🇳',
    locale: 'en-IN',
    decimalPlaces: 2,
    enabled: true,
    isPopular: true,
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    region: 'United States',
    flag: '🇺🇸',
    locale: 'en-US',
    decimalPlaces: 2,
    enabled: true,
    isPopular: true,
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    region: 'Eurozone',
    flag: '🇪🇺',
    locale: 'de-DE',
    decimalPlaces: 2,
    enabled: true,
    isPopular: true,
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    region: 'United Kingdom',
    flag: '🇬🇧',
    locale: 'en-GB',
    decimalPlaces: 2,
    enabled: true,
    isPopular: true,
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    region: 'Japan',
    flag: '🇯🇵',
    locale: 'ja-JP',
    decimalPlaces: 0,
    enabled: true,
    isPopular: true,
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    region: 'Australia',
    flag: '🇦🇺',
    locale: 'en-AU',
    decimalPlaces: 2,
    enabled: true,
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    region: 'Canada',
    flag: '🇨🇦',
    locale: 'en-CA',
    decimalPlaces: 2,
    enabled: true,
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    region: 'Singapore',
    flag: '🇸🇬',
    locale: 'en-SG',
    decimalPlaces: 2,
    enabled: true,
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    region: 'United Arab Emirates',
    flag: '🇦🇪',
    locale: 'ar-AE',
    decimalPlaces: 2,
    enabled: true,
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    region: 'China',
    flag: '🇨🇳',
    locale: 'zh-CN',
    decimalPlaces: 2,
    enabled: true,
  },
];

/**
 * Baseline exchange rates relative to 1 USD.
 * Realistic fallback values editable by the user in Settings.
 */
export const DEFAULT_EXCHANGE_RATES: ExchangeRateMap = {
  USD: 1.0,
  INR: 83.5, // 1 USD = ~83.50 INR
  EUR: 0.92,
  GBP: 0.79,
  JPY: 155.0,
  AUD: 1.52,
  CAD: 1.38,
  SGD: 1.35,
  AED: 3.67,
  CNY: 7.25,
};

export const DEFAULT_BASE_CURRENCY = 'INR';

export function getCurrency(code: string): CurrencyInfo | undefined {
  const normalized = (code || '').toUpperCase().trim();
  return CURRENCY_REGISTRY.find((c) => c.code === normalized);
}
