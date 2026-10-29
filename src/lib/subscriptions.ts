import { BillingCycle, Subscription } from '../types/subscription';
import { convertCurrency } from './currency';
import { ExchangeRateMap } from '../types/currency';
import { rollForwardRenewalDate } from './dates';

/**
 * Calculates the monthly cost for a subscription, accounting for split count.
 */
export function getMonthlyEquivalentCost(price: number, cycle: BillingCycle, splitCount = 1): number {
  const sharePrice = price / Math.max(1, splitCount);

  switch (cycle) {
    case 'Weekly':
      return (sharePrice * 52) / 12;
    case 'Monthly':
      return sharePrice;
    case 'Quarterly':
      return sharePrice / 3;
    case 'Yearly':
      return sharePrice / 12;
    default:
      return sharePrice;
  }
}

/**
 * Calculates yearly equivalent cost for a subscription.
 */
export function getYearlyEquivalentCost(price: number, cycle: BillingCycle, splitCount = 1): number {
  return getMonthlyEquivalentCost(price, cycle, splitCount) * 12;
}

/**
 * Computes total monthly spending in the base currency, skipping subscriptions with missing exchange rates.
 */
export function calculateTotals(
  subscriptions: Subscription[],
  baseCurrency: string,
  rates: ExchangeRateMap
): {
  monthlyTotal: number;
  yearlyTotal: number;
  missingRateCount: number;
  missingCurrencies: string[];
  activeCount: number;
  trialCount: number;
  pausedCount: number;
  cancelledCount: number;
} {
  let monthlyTotal = 0;
  let missingRateCount = 0;
  const missingCurrenciesSet = new Set<string>();

  let activeCount = 0;
  let trialCount = 0;
  let pausedCount = 0;
  let cancelledCount = 0;

  for (const sub of subscriptions) {
    if (sub.status === 'active') activeCount++;
    else if (sub.status === 'trial') trialCount++;
    else if (sub.status === 'paused') pausedCount++;
    else if (sub.status === 'cancelled') cancelledCount++;

    // Only active and trial subscriptions contribute to ongoing budget/totals
    if (sub.status !== 'active' && sub.status !== 'trial') continue;

    const myMonthlyCost = getMonthlyEquivalentCost(sub.price, sub.billingCycle, sub.splitCount);
    const converted = convertCurrency(myMonthlyCost, sub.currency, baseCurrency, rates);

    if (converted.isMissingRate) {
      missingRateCount++;
      missingCurrenciesSet.add(sub.currency);
    } else {
      monthlyTotal += converted.amount;
    }
  }

  return {
    monthlyTotal,
    yearlyTotal: monthlyTotal * 12,
    missingRateCount,
    missingCurrencies: Array.from(missingCurrenciesSet),
    activeCount,
    trialCount,
    pausedCount,
    cancelledCount,
  };
}

/**
 * Auto-rolls past renewal dates for active subscriptions.
 */
export function autoRollSubscriptions(subs: Subscription[]): {
  updatedSubscriptions: Subscription[];
  hasChanges: boolean;
} {
  let hasChanges = false;
  const updatedSubscriptions = subs.map((sub) => {
    if (sub.status !== 'active') return sub;
    const rolled = rollForwardRenewalDate(sub.nextRenewalDate, sub.billingCycle);
    if (rolled !== sub.nextRenewalDate) {
      hasChanges = true;
      return {
        ...sub,
        nextRenewalDate: rolled,
        updatedAt: new Date().toISOString(),
      };
    }
    return sub;
  });

  return { updatedSubscriptions, hasChanges };
}

/**
 * Calculates price creep: how much more (or less) subscriptions cost compared to their initial price.
 */
export function calculatePriceCreep(
  subs: Subscription[],
  baseCurrency: string,
  rates: ExchangeRateMap
): { totalCreepPerYear: number; hikedSubsCount: number } {
  let totalCreepPerYear = 0;
  let hikedSubsCount = 0;

  for (const sub of subs) {
    if (sub.status !== 'active') continue;
    if (sub.priceHistory && sub.priceHistory.length > 1) {
      const initialEntry = sub.priceHistory[0];
      const initialMonthly = getMonthlyEquivalentCost(initialEntry.price, sub.billingCycle, sub.splitCount);
      const currentMonthly = getMonthlyEquivalentCost(sub.price, sub.billingCycle, sub.splitCount);

      if (currentMonthly > initialMonthly) {
        const diff = (currentMonthly - initialMonthly) * 12;
        const converted = convertCurrency(diff, sub.currency, baseCurrency, rates);
        if (!converted.isMissingRate) {
          totalCreepPerYear += converted.amount;
          hikedSubsCount++;
        }
      }
    }
  }

  return { totalCreepPerYear, hikedSubsCount };
}

/**
 * Detects duplicate / overlapping subscriptions within the same category.
 */
export function detectCategoryOverlaps(subs: Subscription[]): {
  category: string;
  count: number;
  subscriptions: Subscription[];
}[] {
  const activeSubs = subs.filter((s) => s.status === 'active' || s.status === 'trial');
  const group: Record<string, Subscription[]> = {};

  for (const sub of activeSubs) {
    if (!group[sub.category]) group[sub.category] = [];
    group[sub.category].push(sub);
  }

  return Object.entries(group)
    .filter(([_, list]) => list.length >= 2)
    .map(([category, list]) => ({
      category,
      count: list.length,
      subscriptions: list,
    }));
}

/**
 * Calculates health score (0 to 100) for a single subscription.
 */
export function calculateSubscriptionHealthScore(sub: Subscription): {
  score: number;
  factors: string[];
  grade: 'high' | 'medium' | 'low';
} {
  let score = 85; // Baseline healthy
  const factors: string[] = [];

  // Check usage check-in
  if (sub.usageCheckIn) {
    switch (sub.usageCheckIn.frequency) {
      case 'daily':
        score += 15;
        factors.push('Frequently used (daily)');
        break;
      case 'several_times_week':
        score += 5;
        factors.push('Regular weekly usage');
        break;
      case 'few_times_month':
        score -= 10;
        factors.push('Infrequent usage (few times a month)');
        break;
      case 'rarely':
        score -= 25;
        factors.push('Rarely used - high cost per use');
        break;
      case 'never':
        score -= 40;
        factors.push('Unused subscription - prime cancellation candidate');
        break;
    }
  } else {
    factors.push('No usage check-in recorded yet');
  }

  // Price creep penalty
  if (sub.priceHistory && sub.priceHistory.length > 1) {
    const firstPrice = sub.priceHistory[0].price;
    if (sub.price > firstPrice) {
      score -= 10;
      factors.push('Price has increased since you first added it');
    }
  }

  // Free trial urgency
  if (sub.isFreeTrial) {
    score -= 5;
    factors.push('Active trial - keep an eye on expiry');
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const grade = finalScore >= 75 ? 'high' : finalScore >= 50 ? 'medium' : 'low';

  return { score: finalScore, factors, grade };
}

/**
 * Calculates money saved so far by cancelled subscriptions.
 */
export function calculateMoneySaved(
  subs: Subscription[],
  baseCurrency: string,
  rates: ExchangeRateMap
): number {
  let totalSaved = 0;
  for (const sub of subs) {
    if (sub.status === 'cancelled') {
      const yearly = getYearlyEquivalentCost(sub.price, sub.billingCycle, sub.splitCount);
      const converted = convertCurrency(yearly, sub.currency, baseCurrency, rates);
      if (!converted.isMissingRate) {
        totalSaved += converted.amount;
      }
    }
  }
  return totalSaved;
}
