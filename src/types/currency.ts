export type CurrencyCode =
  | 'INR'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'AUD'
  | 'CAD'
  | 'SGD'
  | 'AED'
  | 'CNY'
  | string;

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  region: string;
  flag: string;
  locale: string;
  decimalPlaces: number;
  enabled: boolean;
  isPopular?: boolean;
}

export interface ExchangeRateMap {
  [currencyCode: string]: number; // Rate relative to 1 USD
}
