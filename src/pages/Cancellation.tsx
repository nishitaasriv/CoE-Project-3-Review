import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useSettings } from '../hooks/useSettings';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { MoneyText } from '../components/currency/MoneyText';
import { formatDate } from '../lib/dates';
import { fetchCancellationGuide } from '../lib/gemini';
import { CancellationGuide, GENERIC_CANCELLATION_CHECKLIST } from '../data/cancellation-guides';
import {
  Ban,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckSquare,
  Square,
  HelpCircle,
} from 'lucide-react';

export const CancellationAssistant: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { subscriptions, markAsCancelled } = useSubscriptions();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const subIdFromUrl = searchParams.get('subId');

  // Select subscription
  const [selectedSubId, setSelectedSubId] = useState<string>(
    subIdFromUrl || (subscriptions.length > 0 ? subscriptions[0].id : '')
  );

  const selectedSub = subscriptions.find((s) => s.id === selectedSubId);

  // Checkbox checklist state
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  // AI & curated guide state
  const [guide, setGuide] = useState<CancellationGuide | null>(null);
  const [isLoadingGuide, setIsLoadingGuide] = useState(false);

  // Sync subId from URL
  useEffect(() => {
    if (subIdFromUrl && subscriptions.some((s) => s.id === subIdFromUrl)) {
      setSelectedSubId(subIdFromUrl);
    }
  }, [subIdFromUrl, subscriptions]);

  // Load guide when selectedSub changes
  useEffect(() => {
    if (!selectedSub) return;
    setCheckedSteps({});
    setIsLoadingGuide(true);

    fetchCancellationGuide(selectedSub.name, selectedSub.cancellationUrl)
      .then((res) => {
        setGuide(res);
      })
      .catch(() => {
        // Handled internally in fetchCancellationGuide
      })
      .finally(() => {
        setIsLoadingGuide(false);
      });
  }, [selectedSub]);

  const toggleStep = (stepId: string) => {
    setCheckedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleMarkCancelled = () => {
    if (!selectedSub) return;
    markAsCancelled(selectedSub.id, {
      note: 'Cancelled using SubTrack Cancellation Assistant checklist.',
    });
    showToast(`Marked ${selectedSub.name} as cancelled!`, 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Cancellation Assistant"
        description="Follow provider-specific cancellation workflows, avoid retention traps, and cancel with complete confidence."
      />

      {/* Mandatory Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-[#18234F] border border-[#26336B] text-xs text-[#9AA6D6] flex items-start gap-3 shadow-md">
        <Info className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[#F4F6FF]">
            No Automatic Cancellation Notice
          </p>
          <p className="leading-relaxed">
            SubTrack never accesses your bank or private merchant logins. Cancellations must be
            completed manually on the provider's official portal. SubTrack equips you with direct
            links, step-by-step guidance, and proof archiving.
          </p>
        </div>
      </div>

      {/* Select Subscription Dropdown */}
      <div className="p-5 rounded-2xl bg-[#111A40] border border-[#26336B] shadow-lg">
        <label className="block text-xs font-semibold text-[#60A5FA] uppercase tracking-wider mb-2">
          Select Subscription to Cancel
        </label>
        <select
          value={selectedSubId}
          onChange={(e) => setSelectedSubId(e.target.value)}
          className="w-full sm:w-80 px-3.5 py-2.5 rounded-xl bg-[#18234F] border border-[#26336B] text-sm text-[#F4F6FF] focus:outline-none focus:border-[#3B82F6] cursor-pointer"
        >
          {subscriptions.length === 0 && (
            <option value="">No subscriptions available</option>
          )}
          {subscriptions.map((s) => (
            <option key={s.id} value={s.id} className="bg-[#111A40]">
              {s.name} ({s.currency} {s.price} / {s.billingCycle})
            </option>
          ))}
        </select>
      </div>

      {selectedSub && (
        <>
          {/* Billing Snapshot Card */}
          <div className="p-6 rounded-2xl bg-[#111A40] border border-[#26336B] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-display text-[#F4F6FF]">
                  {selectedSub.name}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#18234F] text-[#60A5FA] border border-[#26336B]">
                  {selectedSub.category}
                </span>
              </div>
              <p className="text-xs text-[#9AA6D6]">
                Billing Plan:{' '}
                <strong className="text-[#F4F6FF]">
                  {selectedSub.currency} {selectedSub.price} / {selectedSub.billingCycle}
                </strong>
                {selectedSub.currency !== settings.baseCurrency && (
                  <span className="text-[#60A5FA] ml-1">
                    <MoneyText
                      amount={selectedSub.price}
                      currency={selectedSub.currency}
                      showConverted={true}
                      baseCurrency={settings.baseCurrency}
                      rates={settings.exchangeRates}
                    />
                  </span>
                )}
              </p>
              <p className="text-xs text-[#9AA6D6]">
                Next Renewal:{' '}
                <strong className="text-[#F4F6FF]">
                  {formatDate(selectedSub.nextRenewalDate)}
                </strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {selectedSub.cancellationUrl ? (
                <a
                  href={selectedSub.cancellationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition"
                >
                  <span>Open Cancellation Website</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <div className="text-xs text-[#F472B6] p-2 rounded-xl bg-[#18234F] border border-[#EC4899]/30">
                  No direct cancellation URL recorded. Visit merchant account settings.
                </div>
              )}

              {selectedSub.status !== 'cancelled' && (
                <Button variant="secondary" size="md" onClick={handleMarkCancelled}>
                  Mark as Cancelled
                </Button>
              )}
            </div>
          </div>

          {/* India Tip: UPI AutoPay Revoke Callout */}
          <div className="p-4 rounded-2xl bg-[#18234F] border border-[#3B82F6]/40 flex items-start gap-3 shadow-md">
            <ShieldAlert className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-[#F4F6FF]">
                India UPI AutoPay & Recurring Mandate Reminder
              </p>
              <p className="text-[#9AA6D6] leading-relaxed">
                Cancelling on the merchant portal may not automatically stop your bank's recurring
                mandate. After cancelling above, open Google Pay, PhonePe, or Paytm &gt; Profile &gt;
                Autopay / Mandates &gt; Select <strong className="text-white">{selectedSub.name}</strong> &gt; tap "Revoke / Pause Mandate".
              </p>
            </div>
          </div>

          {/* Gemini AI / Curated Cancellation Guide */}
          <div className="p-6 rounded-2xl bg-[#111A40] border border-[#26336B] shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#26336B]/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                  <h3 className="text-base font-bold text-[#F4F6FF] font-display">
                    Step-by-Step Cancellation Guidance
                  </h3>
                </div>
                <p className="text-xs text-[#9AA6D6] mt-0.5">
                  Guidance may change over time — always confirm options on the provider's official portal.
                </p>
              </div>

              {isLoadingGuide && (
                <span className="text-xs text-[#A78BFA] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-ping" />
                  Generating steps...
                </span>
              )}
            </div>

            {/* Checklist Steps */}
            <div className="space-y-3">
              {(guide?.steps || GENERIC_CANCELLATION_CHECKLIST.map((c) => `${c.title}: ${c.desc}`)).map(
                (stepText, idx) => {
                  const stepId = `step-${idx}`;
                  const isChecked = checkedSteps[stepId];

                  return (
                    <div
                      key={stepId}
                      onClick={() => toggleStep(stepId)}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors cursor-pointer select-none ${
                        isChecked
                          ? 'bg-[#18234F]/40 border-[#26336B] opacity-75'
                          : 'bg-[#18234F] border-[#26336B] hover:border-[#3B82F6]/50'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-[#3B82F6] focus:outline-none shrink-0"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#3B82F6]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#9AA6D6]" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <span className={`text-xs leading-relaxed ${isChecked ? 'line-through text-[#9AA6D6]' : 'text-[#F4F6FF]'}`}>
                          {stepText}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Retention Tricks & Proof Advice Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#26336B]/60">
              <div className="p-4 rounded-xl bg-[#18234F] border border-[#26336B] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#F472B6]">
                  <AlertTriangle className="w-4 h-4 text-[#EC4899]" />
                  <span>Watch Out for Retention Traps</span>
                </div>
                <ul className="text-xs text-[#9AA6D6] space-y-1.5 list-disc list-inside">
                  {(guide?.retentionTricks || [
                    'Discounts offered right before confirmation.',
                    'Options to pause rather than permanently cancel.',
                    'Hidden small "Continue Cancellation" buttons.',
                  ]).map((trick, i) => (
                    <li key={i}>{trick}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#18234F] border border-[#26336B] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#60A5FA]">
                  <CheckCircle2 className="w-4 h-4 text-[#3B82F6]" />
                  <span>What to Save as Proof</span>
                </div>
                <p className="text-xs text-[#9AA6D6] leading-relaxed">
                  {guide?.proofTip ||
                    'Take a screenshot of the final cancellation confirmation screen and save the email confirmation to your Proof Vault.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
