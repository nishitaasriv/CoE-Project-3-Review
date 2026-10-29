import React, { useState, useMemo } from 'react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useSettings } from '../hooks/useSettings';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { formatMoney, convertCurrency } from '../lib/currency';
import { getMonthlyEquivalentCost, getYearlyEquivalentCost, detectCategoryOverlaps } from '../lib/subscriptions';
import { parseBankStatementCSV, BankStatementCandidate } from '../lib/export';
import { Subscription } from '../types/subscription';
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Calculator,
  Search,
  Upload,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

export const Insights: React.FC = () => {
  const { subscriptions, editSubscription, addSubscription } = useSubscriptions();
  const { settings } = useSettings();
  const { showToast } = useToast();

  // What-if simulated cancellation IDs
  const [simulatedCancelIds, setSimulatedCancelIds] = useState<Record<string, boolean>>({});

  // Forgotten charge finder state
  const [statementText, setStatementText] = useState('');
  const [candidates, setCandidates] = useState<BankStatementCandidate[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Active subscriptions
  const activeSubs = useMemo(() => {
    return subscriptions.filter((s) => s.status === 'active' || s.status === 'trial');
  }, [subscriptions]);

  // Overlap detector
  const categoryOverlaps = useMemo(() => {
    return detectCategoryOverlaps(subscriptions);
  }, [subscriptions]);

  // Top 3 most expensive subscriptions
  const top3Expensive = useMemo(() => {
    return [...activeSubs]
      .map((s) => {
        const monthly = getMonthlyEquivalentCost(s.price, s.billingCycle, s.splitCount);
        const converted = convertCurrency(monthly, s.currency, settings.baseCurrency, settings.exchangeRates);
        return {
          sub: s,
          monthlyBase: converted.isMissingRate ? 0 : converted.amount,
        };
      })
      .sort((a, b) => b.monthlyBase - a.monthlyBase)
      .slice(0, 3);
  }, [activeSubs, settings.baseCurrency, settings.exchangeRates]);

  // What-if simulated savings calculation
  const simulatedSavings = useMemo(() => {
    let monthlySaved = 0;
    let count = 0;

    for (const sub of activeSubs) {
      if (simulatedCancelIds[sub.id]) {
        count++;
        const monthly = getMonthlyEquivalentCost(sub.price, sub.billingCycle, sub.splitCount);
        const converted = convertCurrency(monthly, sub.currency, settings.baseCurrency, settings.exchangeRates);
        if (!converted.isMissingRate) {
          monthlySaved += converted.amount;
        }
      }
    }

    return {
      count,
      monthlySaved,
      yearlySaved: monthlySaved * 12,
    };
  }, [activeSubs, simulatedCancelIds, settings.baseCurrency, settings.exchangeRates]);

  const toggleSimulate = (id: string) => {
    setSimulatedCancelIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Usage check-in update handler
  const handleUsageUpdate = (
    subId: string,
    freq: 'daily' | 'several_times_week' | 'few_times_month' | 'rarely' | 'never'
  ) => {
    const uses = {
      daily: 30,
      several_times_week: 12,
      few_times_month: 3,
      rarely: 1,
      never: 0,
    }[freq];

    editSubscription(subId, {
      usageCheckIn: {
        frequency: freq,
        estimatedUsesPerMonth: uses,
        lastCheckedDate: new Date().toISOString().split('T')[0],
      },
    });
    showToast('Usage check-in saved!', 'success');
  };

  // Statement scanning handler
  const handleScanStatement = () => {
    if (!statementText.trim()) return;
    setIsScanning(true);
    try {
      const found = parseBankStatementCSV(statementText);
      setCandidates(found);
      if (found.length === 0) {
        showToast('No potential recurring charges detected in snippet.', 'info');
      } else {
        showToast(`Detected ${found.length} possible subscription charges!`, 'success');
      }
    } catch {
      showToast('Error parsing statement text.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddCandidate = (cand: BankStatementCandidate) => {
    addSubscription({
      name: cand.detectedName,
      category: 'Other',
      price: cand.detectedPrice,
      currency: cand.detectedCurrency,
      billingCycle: 'Monthly',
      startDate: cand.detectedDate,
      nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      isFreeTrial: false,
      reminderDaysBefore: 2,
      splitCount: 1,
      priceHistory: [
        {
          id: 'ph_' + Date.now(),
          date: cand.detectedDate,
          price: cand.detectedPrice,
          currency: cand.detectedCurrency,
          reason: 'Added via Forgotten Charge Finder',
        },
      ],
      notes: `Imported from statement line: "${cand.rawDescription}"`,
    });
    setCandidates((prev) => prev.filter((c) => c !== cand));
    showToast(`Added ${cand.detectedName} to SubTrack!`, 'success');
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Spending Insights & Optimization"
        description="Detect category overlaps, simulate cancellation savings, calculate cost-per-use, and find forgotten charges."
      />

      {/* Top 3 Most Expensive Subscriptions */}
      <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-[#F4F6FF] font-display mb-3">
          Top 3 Most Expensive Subscriptions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {top3Expensive.map(({ sub, monthlyBase }, idx) => (
            <div
              key={sub.id}
              className="p-4 rounded-xl bg-[#18234F] border border-[#26336B] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-[#2563EB]/20 text-[#60A5FA] font-bold text-xs flex items-center justify-center border border-[#3B82F6]/30">
                  #{idx + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#F4F6FF] truncate">{sub.name}</p>
                  <p className="text-xs text-[#9AA6D6]">{sub.category}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-[#F4F6FF]">
                  {formatMoney(monthlyBase, settings.baseCurrency)}
                </span>
                <span className="block text-[10px] text-[#9AA6D6]">/ month</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overlap & Duplicate Detector */}
      <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#8B5CF6]" />
          <h3 className="text-sm font-semibold text-[#F4F6FF] font-display">
            Duplicate & Overlap Detector
          </h3>
        </div>

        {categoryOverlaps.length === 0 ? (
          <p className="text-xs text-[#9AA6D6]">
            No overlapping services detected. You don't have multiple subscriptions competing in the
            same category!
          </p>
        ) : (
          <div className="space-y-3">
            {categoryOverlaps.map((overlap) => (
              <div
                key={overlap.category}
                className="p-4 rounded-xl bg-[#18234F] border border-[#7C3AED]/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-semibold text-[#F4F6FF]">
                    {overlap.count} overlapping subscriptions in{' '}
                    <strong className="text-[#60A5FA]">{overlap.category}</strong>
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {overlap.subscriptions.map((s) => (
                      <span
                        key={s.id}
                        className="text-xs px-2.5 py-1 rounded-lg bg-[#111A40] text-[#F4F6FF] border border-[#26336B]"
                      >
                        {s.name} ({s.currency} {s.price})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-[#A78BFA] bg-[#111A40] p-2.5 rounded-xl border border-[#26336B] shrink-0 max-w-xs">
                  Recommendation: Review if you actively consume both services or if one can be
                  paused/cancelled.
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* What-If Savings Simulator */}
      <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#26336B]/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#3B82F6]" />
              <h3 className="text-sm font-semibold text-[#F4F6FF] font-display">
                "What-If" Cancellation Savings Simulator
              </h3>
            </div>
            <p className="text-xs text-[#9AA6D6] mt-0.5">
              Select subscriptions to test how much money you would save every year.
            </p>
          </div>

          {simulatedSavings.count > 0 && (
            <div className="p-2.5 rounded-xl bg-[#2563EB]/15 border border-[#3B82F6]/40 text-right">
              <span className="text-xs text-[#9AA6D6]">Simulated Annual Savings: </span>
              <span className="text-base font-bold text-[#60A5FA]">
                {formatMoney(simulatedSavings.yearlySaved, settings.baseCurrency)} / yr
              </span>
            </div>
          )}
        </div>

        <div className="divide-y divide-[#26336B]/60">
          {activeSubs.map((sub) => {
            const isSimulated = Boolean(simulatedCancelIds[sub.id]);
            const yearly = getYearlyEquivalentCost(sub.price, sub.billingCycle, sub.splitCount);

            return (
              <div
                key={sub.id}
                onClick={() => toggleSimulate(sub.id)}
                className={`py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer select-none first:pt-0 last:pb-0 ${
                  isSimulated ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSimulated}
                    onChange={() => {}} // handled by row click
                    className="w-4 h-4 rounded border-[#26336B] bg-[#18234F] text-[#EC4899] cursor-pointer"
                  />
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        isSimulated ? 'line-through text-[#9AA6D6]' : 'text-[#F4F6FF]'
                      }`}
                    >
                      {sub.name}
                    </p>
                    <p className="text-xs text-[#9AA6D6]">
                      {sub.currency} {sub.price} / {sub.billingCycle}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-[#60A5FA]">
                    Save ~{formatMoney(yearly, sub.currency)}/yr
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* "Was It Worth It?" Monthly Check-In */}
      <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-5 shadow-lg space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#F4F6FF] font-display">
            "Was It Worth It?" Usage Check-In & Cost-Per-Use
          </h3>
          <p className="text-xs text-[#9AA6D6] mt-0.5">
            Log your approximate monthly usage frequency to uncover subscriptions with poor cost
            efficiency.
          </p>
        </div>

        <div className="divide-y divide-[#26336B]/60">
          {activeSubs.map((sub) => {
            const monthlyCost = getMonthlyEquivalentCost(sub.price, sub.billingCycle, sub.splitCount);
            const uses = sub.usageCheckIn?.estimatedUsesPerMonth ?? 10;
            const costPerUse = uses > 0 ? (monthlyCost / uses).toFixed(1) : '∞';
            const freq = sub.usageCheckIn?.frequency || 'several_times_week';

            return (
              <div
                key={sub.id}
                className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-semibold text-[#F4F6FF]">{sub.name}</p>
                  <p className="text-xs text-[#9AA6D6]">
                    Estimated Cost per Use:{' '}
                    <strong className="text-[#60A5FA]">
                      {sub.currency} {costPerUse}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={freq}
                    onChange={(e) => handleUsageUpdate(sub.id, e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] focus:outline-none focus:border-[#3B82F6] cursor-pointer"
                  >
                    <option value="daily" className="bg-[#111A40]">Daily (~30x/mo)</option>
                    <option value="several_times_week" className="bg-[#111A40]">Weekly (~12x/mo)</option>
                    <option value="few_times_month" className="bg-[#111A40]">Few times (~3x/mo)</option>
                    <option value="rarely" className="bg-[#111A40]">Rarely (1x/mo)</option>
                    <option value="never" className="bg-[#111A40]">Unused (0x/mo)</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forgotten-Charge Finder (Bank Statement CSV scanner) */}
      <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-5 shadow-lg space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#F4F6FF] font-display">
            Forgotten-Charge Finder (Bank Statement Scanner)
          </h3>
          <p className="text-xs text-[#9AA6D6] mt-0.5">
            Paste lines from your credit card or bank statement CSV to detect hidden recurring charges.
          </p>
        </div>

        <textarea
          rows={3}
          placeholder="Paste CSV statement text (e.g. '28-10-2026, NETFLIX MUMBAI, 649.00, DEBIT')..."
          value={statementText}
          onChange={(e) => setStatementText(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] font-mono focus:outline-none focus:border-[#3B82F6]"
        />

        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            isLoading={isScanning}
            leftIcon={<Search className="w-4 h-4" />}
            onClick={handleScanStatement}
          >
            Scan for Recurring Charges
          </Button>
        </div>

        {/* Found candidates */}
        {candidates.length > 0 && (
          <div className="pt-3 border-t border-[#26336B]/60 space-y-2">
            <h4 className="text-xs font-semibold text-[#60A5FA]">
              Detected Recurring Charges:
            </h4>
            <div className="space-y-2">
              {candidates.map((cand, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#18234F] border border-[#26336B] flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-[#F4F6FF]">{cand.detectedName}</p>
                    <p className="text-[11px] text-[#9AA6D6]">
                      {cand.detectedCurrency} {cand.detectedPrice} • Date: {cand.detectedDate}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddCandidate(cand)}
                  >
                    Add to SubTrack
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
