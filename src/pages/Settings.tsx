import React, { useState, useRef } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useNotifications } from '../hooks/useNotifications';
import { PageHeader } from '../components/layout/PageHeader';
import { CurrencySelect } from '../components/currency/CurrencySelect';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { exportToJSON, exportToCSV, parseImportJSON } from '../lib/export';
import { formatDate } from '../lib/dates';
import { CURRENCY_REGISTRY } from '../data/currencies';
import {
  Coins,
  RefreshCw,
  Bell,
  EyeOff,
  Lock,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  ShieldCheck,
  Smartphone,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    setBaseCurrency,
    refreshExchangeRates,
    isRefreshingRates,
    rateRefreshError,
  } = useSettings();

  const { subscriptions, clearAllData, loadSampleData, updateAllSubscriptions } = useSubscriptions();
  const { permission, requestPermission } = useNotifications(subscriptions, true);
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rate editing state
  const [rates, setRates] = useState<Record<string, number>>({ ...settings.exchangeRates });
  const [hasRateChanges, setHasRateChanges] = useState(false);

  // Clear modal
  const [showClearModal, setShowClearModal] = useState(false);

  const handleRateChange = (code: string, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setRates((prev) => ({ ...prev, [code]: num }));
      setHasRateChanges(true);
    }
  };

  const saveCustomRates = () => {
    updateSettings({ exchangeRates: rates, lastRatesUpdate: new Date().toISOString() });
    setHasRateChanges(false);
    showToast('Custom exchange rates saved!', 'success');
  };

  const handleFetchLiveRates = async () => {
    const success = await refreshExchangeRates();
    if (success) {
      showToast('Exchange rates updated from live API!', 'success');
      setRates({ ...settings.exchangeRates });
    } else {
      showToast('Could not reach live API. Kept saved offline rates.', 'error');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = parseImportJSON(text);
        updateAllSubscriptions(imported);
        showToast(`Successfully imported ${imported.length} subscriptions!`, 'success');
      } catch (err: any) {
        showToast(err?.message || 'Failed to parse JSON file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Settings & Data Management"
        description="Configure your base currency, live exchange rates, notification permissions, and backup your data."
      />

      {/* Demo Login Banner */}
      <div className="p-4 rounded-2xl bg-[#18234F] border border-[#3B82F6]/30 text-xs text-[#9AA6D6] flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-[#3B82F6] shrink-0" />
        <p>
          <strong className="text-[#F4F6FF]">Local Storage Guarantee:</strong> Demo login data,
          accounts, and subscriptions are stored only in this browser and are not shared with any
          external cloud database.
        </p>
      </div>

      {/* 1. Currency & Exchange Rates */}
      <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-6 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#26336B]/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#3B82F6]" />
              <h3 className="text-base font-bold text-[#F4F6FF] font-display">
                Multi-Currency & Exchange Rates
              </h3>
            </div>
            <p className="text-xs text-[#9AA6D6] mt-0.5">
              INR (₹) is mandatory and default. Totals are converted using these rates.
            </p>
          </div>

          <div className="w-48 shrink-0">
            <CurrencySelect
              value={settings.baseCurrency}
              onChange={(c) => {
                setBaseCurrency(c);
                showToast(`Base currency set to ${c}`, 'success');
              }}
              label="Base Currency"
            />
          </div>
        </div>

        {/* Live Rates controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-[#9AA6D6]">
              Last updated:{' '}
              <strong className="text-[#F4F6FF]">{formatDate(settings.lastRatesUpdate.split('T')[0])}</strong>
            </span>
            <span className="block text-[11px] text-[#9AA6D6] mt-0.5">
              Rates are estimates relative to 1 USD; your bank's rate may differ.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasRateChanges && (
              <Button variant="primary" size="sm" onClick={saveCustomRates}>
                Save Rates
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              isLoading={isRefreshingRates}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={handleFetchLiveRates}
            >
              Refresh Live Rates
            </Button>
          </div>
        </div>

        {rateRefreshError && (
          <p className="text-xs text-[#F472B6]">{rateRefreshError}</p>
        )}

        {/* Rates Table */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
          {CURRENCY_REGISTRY.map((curr) => {
            const currentVal = rates[curr.code] ?? settings.exchangeRates[curr.code] ?? 1;
            return (
              <div
                key={curr.code}
                className="p-3 rounded-xl bg-[#18234F] border border-[#26336B] space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#F4F6FF] flex items-center gap-1.5">
                    <span>{curr.flag}</span>
                    <span>{curr.code}</span>
                  </span>
                  <span className="text-[#9AA6D6] font-mono">({curr.symbol})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#9AA6D6]">$1 =</span>
                  <input
                    type="number"
                    step="any"
                    value={currentVal}
                    onChange={(e) => handleRateChange(curr.code, e.target.value)}
                    className="w-full px-2 py-1 rounded-lg bg-[#111A40] border border-[#26336B] text-xs text-[#F4F6FF] font-mono focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Monthly Budget Cap & Reminder Defaults */}
      <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-6 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-[#F4F6FF] font-display mb-1">
            Monthly Budget Cap
          </h3>
          <p className="text-xs text-[#9AA6D6] mb-3">
            Warn when active subscriptions exceed this monthly amount in {settings.baseCurrency}.
          </p>
          <div className="flex items-center gap-2 max-w-xs">
            <span className="text-xs font-semibold text-[#60A5FA]">{settings.baseCurrency}</span>
            <input
              type="number"
              min="0"
              step="100"
              value={settings.monthlyBudget}
              onChange={(e) => updateSettings({ monthlyBudget: Math.max(0, parseFloat(e.target.value) || 0) })}
              className="w-full px-3 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-sm text-[#F4F6FF] font-mono focus:outline-none focus:border-[#3B82F6]"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#F4F6FF] font-display mb-1">
            Default Reminder Days
          </h3>
          <p className="text-xs text-[#9AA6D6] mb-3">
            Pre-selected alert timing when creating a new subscription.
          </p>
          <select
            value={settings.defaultReminderDays}
            onChange={(e) => updateSettings({ defaultReminderDays: Number(e.target.value) })}
            className="w-full max-w-xs px-3.5 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] focus:outline-none focus:border-[#3B82F6]"
          >
            <option value={1} className="bg-[#111A40]">1 day before renewal</option>
            <option value={2} className="bg-[#111A40]">2 days before renewal</option>
            <option value={3} className="bg-[#111A40]">3 days before renewal</option>
            <option value={7} className="bg-[#111A40]">7 days before renewal</option>
            <option value={14} className="bg-[#111A40]">14 days before renewal</option>
          </select>
        </div>
      </div>

      {/* 3. Browser Notifications & Privacy Mode */}
      <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-6 shadow-lg space-y-4">
        <h3 className="text-base font-bold text-[#F4F6FF] font-display">
          Notifications & Privacy Controls
        </h3>

        <div className="divide-y divide-[#26336B]/60">
          {/* Notifications toggle */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#F4F6FF]">Browser Renewal Notifications</p>
              <p className="text-xs text-[#9AA6D6]">
                Receive ambient browser alerts when renewals or trials approach.
              </p>
            </div>
            <Button
              variant={settings.browserNotificationsEnabled ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<Bell className="w-3.5 h-3.5" />}
              onClick={async () => {
                if (!settings.browserNotificationsEnabled) {
                  const granted = await requestPermission();
                  if (granted) {
                    updateSettings({ browserNotificationsEnabled: true });
                    showToast('Notifications enabled!', 'success');
                  } else {
                    showToast('Permission was denied by browser.', 'error');
                  }
                } else {
                  updateSettings({ browserNotificationsEnabled: false });
                  showToast('Notifications disabled.', 'info');
                }
              }}
            >
              {settings.browserNotificationsEnabled ? 'Enabled' : 'Enable Alerts'}
            </Button>
          </div>

          {/* Privacy mode toggle */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#F4F6FF]">Privacy Mode (Blur Monetary Amounts)</p>
              <p className="text-xs text-[#9AA6D6]">
                Blurs all numbers across dashboard and subscription cards until clicked.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.privacyModeHideAmounts}
              onChange={(e) => updateSettings({ privacyModeHideAmounts: e.target.checked })}
              className="w-5 h-5 rounded border-[#26336B] bg-[#18234F] text-[#3B82F6] cursor-pointer"
            />
          </div>

          {/* Inactivity Auto-Lock */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#F4F6FF]">Inactivity Auto-Lock</p>
              <p className="text-xs text-[#9AA6D6]">
                Lock SubTrack with password/PIN after minutes of inactivity.
              </p>
            </div>
            <select
              value={settings.autoLockMinutes}
              onChange={(e) => updateSettings({ autoLockMinutes: Number(e.target.value) })}
              className="px-3 py-1.5 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value={0} className="bg-[#111A40]">Off (Never lock)</option>
              <option value={5} className="bg-[#111A40]">5 Minutes</option>
              <option value={15} className="bg-[#111A40]">15 Minutes</option>
              <option value={30} className="bg-[#111A40]">30 Minutes</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Data Export, Import & Reset */}
      <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-6 shadow-lg space-y-5">
        <h3 className="text-base font-bold text-[#F4F6FF] font-display">
          Backup, Export & Restore
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => {
              exportToJSON(subscriptions);
              showToast('Exported subscriptions to JSON backup', 'success');
            }}
          >
            Export JSON Backup
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => {
              exportToCSV(subscriptions);
              showToast('Exported subscriptions to CSV spreadsheet', 'success');
            }}
          >
            Export CSV
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Import JSON Backup
          </Button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportFile}
            className="hidden"
          />

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={() => {
              loadSampleData();
              showToast('Sample subscriptions reset!', 'success');
            }}
          >
            Reset to Demo Data
          </Button>

          <Button
            variant="destructive"
            size="sm"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={() => setShowClearModal(true)}
          >
            Delete All Data
          </Button>
        </div>
      </div>

      {/* 5. India UPI Mandate Advice Card */}
      <div className="rounded-2xl bg-[#18234F] border border-[#3B82F6]/40 p-5 shadow-lg flex items-start gap-3">
        <Smartphone className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-[#F4F6FF]">
            Important India Tip: Checking & Revoking UPI AutoPay
          </p>
          <p className="text-[#9AA6D6] leading-relaxed">
            In India, cancelling a service on the website does not always stop recurring auto-debits
            set up via UPI AutoPay or e-mandates. Always open Google Pay (Profile &gt; Autopay),
            PhonePe (Profile &gt; AutoPay Settings), or Paytm to verify and pause/cancel active
            mandates.
          </p>
        </div>
      </div>

      {/* 6. About SubTrack */}
      <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-6 shadow-lg space-y-2 text-xs text-[#9AA6D6]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F4F6FF] font-display text-sm">About SubTrack</span>
            <span className="px-2 py-0.5 rounded-full bg-[#18234F] text-[#60A5FA] font-mono text-[10px] border border-[#26336B]">
              v2.4.0 (Production Release)
            </span>
          </div>
          <span className="text-[11px] text-[#A78BFA]">100% Client-Side Privacy</span>
        </div>
        <p className="leading-relaxed">
          SubTrack is an independent subscription reminder and cancellation assistant designed to
          eliminate unwanted recurring charges. Data stays strictly within your browser localStorage
          with schema versioning and PBKDF2 cryptography.
        </p>
      </div>

      {/* Delete All Data Confirmation Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Delete All Subscription Data"
        description="Are you sure you want to permanently clear all tracked subscriptions?"
      >
        <div className="space-y-4 text-xs text-[#9AA6D6]">
          <p>
            This will wipe every subscription, price history, and reminder preference for this
            account. This cannot be undone unless you have a JSON backup.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#26336B]/60">
            <Button variant="ghost" size="sm" onClick={() => setShowClearModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                clearAllData();
                setShowClearModal(false);
                showToast('All subscription records cleared.', 'info');
              }}
            >
              Clear All Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
