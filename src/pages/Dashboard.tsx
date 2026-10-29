import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { SpendChart } from '../components/dashboard/SpendChart';
import { CategoryBars } from '../components/dashboard/CategoryBars';
import { ReminderRail } from '../components/dashboard/ReminderRail';
import { CashFlowTimeline } from '../components/dashboard/CashFlowTimeline';
import { HealthScoreCard } from '../components/dashboard/HealthScoreCard';
import { BudgetAlertCard } from '../components/dashboard/BudgetAlertCard';
import { OnboardingModal } from '../components/ui/OnboardingModal';
import { SmartImportModal } from '../components/subscriptions/SmartImportModal';
import { Button } from '../components/ui/Button';
import {
  calculateTotals,
  calculatePriceCreep,
  calculateMoneySaved,
  calculateSubscriptionHealthScore,
} from '../../src/lib/subscriptions';
import { convertCurrency, formatMoney } from '../lib/currency';
import { downloadAllCalendarEvents } from '../lib/ics';
import {
  CreditCard,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscriptions, loadSampleData, addSubscription } = useSubscriptions();
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();

  const [showSmartImport, setShowSmartImport] = useState(false);

  // Compute overall financial totals
  const totals = useMemo(() => {
    return calculateTotals(subscriptions, settings.baseCurrency, settings.exchangeRates);
  }, [subscriptions, settings.baseCurrency, settings.exchangeRates]);

  // Compute price creep (how much prices increased since signup)
  const priceCreep = useMemo(() => {
    return calculatePriceCreep(subscriptions, settings.baseCurrency, settings.exchangeRates);
  }, [subscriptions, settings.baseCurrency, settings.exchangeRates]);

  // Compute money saved from cancellations
  const moneySaved = useMemo(() => {
    return calculateMoneySaved(subscriptions, settings.baseCurrency, settings.exchangeRates);
  }, [subscriptions, settings.baseCurrency, settings.exchangeRates]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    const activeSubs = subscriptions.filter((s) => s.status === 'active' || s.status === 'trial');

    for (const sub of activeSubs) {
      const converted = convertCurrency(
        sub.price / sub.splitCount,
        sub.currency,
        settings.baseCurrency,
        settings.exchangeRates
      );
      const amount = converted.isMissingRate ? 0 : converted.amount;
      const cat = sub.category || 'Other';

      if (!map[cat]) map[cat] = { amount: 0, count: 0 };
      map[cat].amount += amount;
      map[cat].count += 1;
    }

    const total = totals.monthlyTotal || 1;
    return Object.entries(map)
      .map(([category, info]) => ({
        category,
        amount: info.amount,
        count: info.count,
        percentage: (info.amount / total) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [subscriptions, totals.monthlyTotal, settings.baseCurrency, settings.exchangeRates]);

  // Recharts Monthly spend data (Simulated trend over past 6 months based on active subscriptions)
  const monthlySpendData = useMemo(() => {
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const current = totals.monthlyTotal;
    return [
      { month: months[0], amount: Math.max(0, current * 0.88) },
      { month: months[1], amount: Math.max(0, current * 0.92) },
      { month: months[2], amount: Math.max(0, current * 0.95) },
      { month: months[3], amount: Math.max(0, current * 0.94) },
      { month: months[4], amount: Math.max(0, current * 0.98) },
      { month: months[5], amount: current },
    ];
  }, [totals.monthlyTotal]);

  const categoryDonutData = useMemo(() => {
    return categoryBreakdown.map((c) => ({
      name: c.category,
      value: c.amount,
    }));
  }, [categoryBreakdown]);

  // Overall Health Score
  const overallHealth = useMemo(() => {
    const activeSubs = subscriptions.filter((s) => s.status === 'active' || s.status === 'trial');
    if (activeSubs.length === 0) {
      return { score: 100, tips: ['Add subscriptions to begin monitoring health scores.'] };
    }

    let sum = 0;
    const tips: string[] = [];

    for (const sub of activeSubs) {
      const res = calculateSubscriptionHealthScore(sub);
      sum += res.score;
      if (res.grade === 'low' && tips.length < 3) {
        tips.push(`Review ${sub.name}: Low usage or prime candidate for cancellation.`);
      }
    }

    if (priceCreep.hikedSubsCount > 0 && tips.length < 3) {
      tips.push(`${priceCreep.hikedSubsCount} service(s) increased price since initial registration.`);
    }

    if (tips.length === 0) {
      tips.push('Excellent! All subscriptions are actively utilized and within budget limits.');
    }

    return {
      score: Math.round(sum / activeSubs.length),
      tips,
    };
  }, [subscriptions, priceCreep]);

  const handleFinishOnboarding = () => {
    updateSettings({ onboardingCompleted: true });
  };

  return (
    <div className="space-y-6">
      {/* Missing exchange rates warning */}
      {totals.missingRateCount > 0 && (
        <div className="p-4 rounded-2xl bg-[#18234F] border border-[#EC4899]/60 text-xs text-[#F472B6] flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#EC4899] shrink-0" />
            <span>
              Missing exchange rate for {totals.missingCurrencies.join(', ')}. These subscriptions
              are excluded from base currency totals.
            </span>
          </div>
          <NavLink
            to="/settings"
            className="text-xs font-semibold text-white underline hover:no-underline shrink-0 ml-3"
          >
            Update in Settings →
          </NavLink>
        </div>
      )}

      {/* Page Header with Quick Actions */}
      <PageHeader
        title="Dashboard"
        description="Comprehensive overview of your recurring commitments, trial alerts, and monthly budget."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Calendar className="w-4 h-4" />}
              onClick={() => {
                downloadAllCalendarEvents(subscriptions);
                showToast('Exported upcoming renewals to calendar (.ics)', 'info');
              }}
            >
              Export Calendar
            </Button>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4 text-[#8B5CF6]" />}
              onClick={() => setShowSmartImport(true)}
            >
              Smart Import
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => navigate('/add')}
            >
              Add Subscription
            </Button>
          </>
        }
      />

      {/* Price Creep Banner (if applicable) */}
      {priceCreep.totalCreepPerYear > 0 && (
        <div className="p-4 rounded-2xl bg-[#111A40] border border-[#7C3AED]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#18234F] text-[#8B5CF6] border border-[#26336B]">
              <TrendingUp className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F4F6FF]">
                Price Creep Alert:{' '}
                <span className="text-[#60A5FA]">
                  +{formatMoney(priceCreep.totalCreepPerYear, settings.baseCurrency)} / year
                </span>
              </p>
              <p className="text-xs text-[#9AA6D6]">
                Your subscriptions cost more per year than when you originally added them across{' '}
                {priceCreep.hikedSubsCount} plan(s).
              </p>
            </div>
          </div>
          <NavLink to="/insights">
            <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
              View Insights
            </Button>
          </NavLink>
        </div>
      )}

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Subscriptions"
          value={totals.activeCount + totals.trialCount}
          subtitle={`${totals.activeCount} active • ${totals.trialCount} on free trial`}
          icon={<CreditCard className="w-5 h-5" />}
        />

        <StatCard
          title="Monthly Total"
          value={formatMoney(totals.monthlyTotal, settings.baseCurrency)}
          subtitle={`Converted to base (${settings.baseCurrency})`}
          icon={<TrendingDown className="w-5 h-5" />}
        />

        <StatCard
          title="Yearly Projection"
          value={formatMoney(totals.yearlyTotal, settings.baseCurrency)}
          subtitle="Projected annual run rate"
          icon={<Layers className="w-5 h-5" />}
        />

        <StatCard
          title="Money Saved"
          value={formatMoney(moneySaved, settings.baseCurrency)}
          subtitle="From cancelled subscriptions"
          icon={<ShieldCheck className="w-5 h-5 text-[#3B82F6]" />}
          badge={
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#60A5FA] bg-[#18234F] px-2 py-0.5 rounded-full border border-[#26336B]">
              <TrendingUp className="w-3 h-3 text-[#3B82F6]" />
              <span>Saved</span>
            </span>
          }
        />
      </div>

      {/* Second Row: Monthly Budget & Subscription Health Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BudgetAlertCard
          currentMonthly={totals.monthlyTotal}
          monthlyBudget={settings.monthlyBudget}
          baseCurrency={settings.baseCurrency}
        />

        <HealthScoreCard score={overallHealth.score} tips={overallHealth.tips} />
      </div>

      {/* Third Row: Upcoming Renewal Rail & Category Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <ReminderRail subscriptions={subscriptions} />
        </div>

        <div className="lg:col-span-5">
          <CategoryBars
            categories={categoryBreakdown}
            baseCurrency={settings.baseCurrency}
          />
        </div>
      </div>

      {/* Fourth Row: Spend Charts (Bar Trend & Category Donut) */}
      <SpendChart
        monthlyData={monthlySpendData}
        categoryData={categoryDonutData}
        baseCurrency={settings.baseCurrency}
      />

      {/* Fifth Row: 90-Day Cash Flow Timeline Heatmap */}
      <CashFlowTimeline subscriptions={subscriptions} />

      {/* Empty State Banner if no subscriptions */}
      {subscriptions.length === 0 && (
        <div className="p-8 rounded-3xl bg-[#111A40] border border-[#26336B] text-center my-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#18234F] border border-[#26336B] flex items-center justify-center text-[#60A5FA] mx-auto mb-4">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-[#F4F6FF] font-display">
            Welcome to SubTrack!
          </h3>
          <p className="text-xs text-[#9AA6D6] max-w-md mx-auto mt-1 mb-6">
            Get started by adding your recurring payments or load our realistic sample demo data
            (Netflix, Spotify, Canva Pro Trial, and Amazon Prime).
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={() => {
                loadSampleData();
                showToast('Sample subscriptions loaded!', 'success');
              }}
            >
              Load Sample Subscriptions
            </Button>

            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => navigate('/add')}
            >
              Add My First Subscription
            </Button>
          </div>
        </div>
      )}

      {/* First-run Onboarding Walkthrough */}
      <OnboardingModal
        isOpen={!settings.onboardingCompleted}
        onFinish={handleFinishOnboarding}
        onLoadDemoData={() => {
          loadSampleData();
          showToast('Sample subscriptions loaded!', 'success');
        }}
      />

      {/* Smart Import Modal */}
      <SmartImportModal
        isOpen={showSmartImport}
        onClose={() => setShowSmartImport(false)}
        onSave={(data) => {
          addSubscription({
            name: data.name,
            category: data.category,
            price: data.price,
            currency: data.currency,
            billingCycle: data.billingCycle,
            startDate: new Date().toISOString().split('T')[0],
            nextRenewalDate:
              data.nextRenewalDate ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: data.isFreeTrial ? 'trial' : 'active',
            isFreeTrial: Boolean(data.isFreeTrial),
            reminderDaysBefore: data.billingCycle === 'Yearly' ? 7 : 2,
            splitCount: 1,
            priceHistory: [
              {
                id: 'ph_' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                price: data.price,
                currency: data.currency,
                reason: 'Imported via Smart Import',
              },
            ],
            notes: data.notes,
          });
          showToast(`Added ${data.name} via Smart Import!`, 'success');
        }}
      />
    </div>
  );
};
