import { useCallback, useEffect, useState } from 'react';
import { AppSettings } from '../types/settings';
import { loadSettings, saveSettings } from '../lib/storage';
import { useAuth } from './useAuth';

export function useSettings() {
  const { user } = useAuth();
  const userId = user?.id;

  const [settings, setSettingsState] = useState<AppSettings>(() => loadSettings(userId));
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  const [rateRefreshError, setRateRefreshError] = useState<string | null>(null);

  // Reload when user switches
  useEffect(() => {
    setSettingsState(loadSettings(userId));
  }, [userId]);

  const updateSettings = useCallback(
    (updater: Partial<AppSettings> | ((prev: AppSettings) => Partial<AppSettings>)) => {
      setSettingsState((prev) => {
        const delta = typeof updater === 'function' ? updater(prev) : updater;
        const next = { ...prev, ...delta };
        saveSettings(next, userId);
        return next;
      });
    },
    [userId]
  );

  const setBaseCurrency = useCallback(
    (code: string) => {
      updateSettings({ baseCurrency: code });
    },
    [updateSettings]
  );

  const toggleHideAmounts = useCallback(() => {
    updateSettings((prev) => ({ privacyModeHideAmounts: !prev.privacyModeHideAmounts }));
  }, [updateSettings]);

  const refreshExchangeRates = useCallback(async () => {
    setIsRefreshingRates(true);
    setRateRefreshError(null);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      if (data && data.rates) {
        updateSettings((prev) => ({
          exchangeRates: {
            ...prev.exchangeRates,
            ...data.rates,
            USD: 1.0,
          },
          lastRatesUpdate: new Date().toISOString(),
        }));
        return true;
      }
      throw new Error('Invalid rate data received');
    } catch (err: any) {
      console.warn('Failed to fetch live rates, keeping saved rates:', err);
      setRateRefreshError(err?.message || 'Could not fetch live rates. Using saved offline rates.');
      return false;
    } finally {
      setIsRefreshingRates(false);
    }
  }, [updateSettings]);

  return {
    settings,
    updateSettings,
    setBaseCurrency,
    toggleHideAmounts,
    refreshExchangeRates,
    isRefreshingRates,
    rateRefreshError,
  };
}
