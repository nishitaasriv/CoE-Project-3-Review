import { CURRENCY_REGISTRY, getCurrency } from '../data/currencies';
import { ExchangeRateMap } from '../types/currency';

/**
 * Maps legacy currency symbols to standard ISO 4217 currency codes.
 */
export function migrateCurrencySymbolToISO(symbolOrCode: string): string {
  if (!symbolOrCode) return 'INR';
  const trimmed = symbolOrCode.trim();

  switch (trimmed) {
    case '₹':
    case 'Rs':
    case 'INR':
      return 'INR';
    case '$':
    case 'USD':
      return 'USD';
    case '€':
    case 'EUR':
      return 'EUR';
    case '£':
    case 'GBP':
      return 'GBP';
    case '¥':
    case 'JPY':
      return 'JPY';
    case 'A$':
    case 'AUD':
      return 'AUD';
    case 'C$':
    case 'CAD':
      return 'CAD';
    case 'S$':
    case 'SGD':
      return 'SGD';
    case 'د.إ':
    case 'AED':
      return 'AED';
    case 'CNY':
      return 'CNY';
    default:
      // Check if it matches any registered code
      const found = CURRENCY_REGISTRY.find(
        (c) => c.code.toLowerCase() === trimmed.toLowerCase() || c.symbol === trimmed
      );
      return found ? found.code : trimmed.toUpperCase();
  }
}

/**
 * Formats a monetary amount using the currency's official locale and decimal rules.
 * Never hardcodes symbols.
 */
export function formatMoney(amount: number, currencyCode: string = 'INR'): string {
  const isoCode = migrateCurrencySymbolToISO(currencyCode);
  const info = getCurrency(isoCode);
  const locale = info ? info.locale : 'en-IN';
  const decimals = info !== undefined ? info.decimalPlaces : 2;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: isoCode,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    // Fallback if browser Intl doesn't recognize the currency code
    const symbol = info ? info.symbol : isoCode;
    return `${symbol} ${amount.toFixed(decimals)}`;
  }
}

/**
 * Converts an amount from fromCurrency to toCurrency using the exchange rate map.
 * All rates in rates map are relative to 1 USD (e.g. USD=1.0, INR=83.50, EUR=0.92).
 * Returns null if either rate is missing so caller can exclude from total and show warning.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRateMap
): { amount: number; isMissingRate: boolean } {
  const from = migrateCurrencySymbolToISO(fromCurrency);
  const to = migrateCurrencySymbolToISO(toCurrency);

  if (from === to) {
    return { amount, isMissingRate: false };
  }

  const rateFrom = rates[from];
  const rateTo = rates[to];

  if (!rateFrom || !rateTo || rateFrom <= 0 || rateTo <= 0) {
    return { amount: 0, isMissingRate: true };
  }

  // Convert from currency -> USD, then USD -> target currency
  // Since rate is X per 1 USD: USD_amount = amount / rateFrom; Target_amount = USD_amount * rateTo;
  const amountInUSD = amount / rateFrom;
  const targetAmount = amountInUSD * rateTo;

  return { amount: targetAmount, isMissingRate: false };
}
