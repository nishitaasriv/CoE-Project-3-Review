import React, { useState } from 'react';
import { formatMoney, convertCurrency } from '../../lib/currency';
import { ExchangeRateMap } from '../../types/currency';
import { useSettings } from '../../hooks/useSettings';

interface MoneyTextProps {
  amount: number;
  currency?: string;
  showConverted?: boolean;
  baseCurrency?: string;
  rates?: ExchangeRateMap;
  className?: string;
  convertedClassName?: string;
}

export const MoneyText: React.FC<MoneyTextProps> = ({
  amount,
  currency = 'INR',
  showConverted = false,
  baseCurrency,
  rates,
  className = '',
  convertedClassName = 'text-xs text-[#9AA6D6] font-normal ml-1.5',
}) => {
  const { settings } = useSettings();
  const [unblurred, setUnblurred] = useState(false);

  const isHidden = settings.privacyModeHideAmounts && !unblurred;
  const formatted = formatMoney(amount, currency);

  // Conversion logic if requested
  let convertedText = '';
  if (showConverted && baseCurrency && rates && currency !== baseCurrency) {
    const res = convertCurrency(amount, currency, baseCurrency, rates);
    if (!res.isMissingRate) {
      convertedText = `(≈ ${formatMoney(res.amount, baseCurrency)})`;
    }
  }

  return (
    <span
      onClick={() => isHidden && setUnblurred(true)}
      title={isHidden ? 'Click to reveal amount' : undefined}
      className={`inline-flex items-baseline select-none transition-all ${
        isHidden ? 'blur-sm cursor-pointer select-none bg-[#18234F]/50 px-1 rounded' : ''
      } ${className}`}
    >
      <span className="font-semibold">{formatted}</span>
      {convertedText && <span className={convertedClassName}>{convertedText}</span>}
    </span>
  );
};
