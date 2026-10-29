import { Subscription, BillingCycle } from '../types/subscription';
import { ExchangeRateMap } from '../types/currency';
import { convertCurrency, formatMoney } from './currency';
import { parseISODate, toISODateString } from './dates';

export interface CashFlowChargeItem {
  subscriptionId: string;
  name: string;
  amountInBase: number;
  originalAmount: number;
  originalCurrency: string;
  isTrialConversion?: boolean;
}

export interface CashFlowCell {
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Mon, 1=Tue, ..., 6=Sun
  weekIndex: number; // 0 to 12
  isBeforeToday: boolean;
  isAfterWindow: boolean;
  isToday: boolean;
  charges: CashFlowChargeItem[];
  totalAmount: number; // in base currency
  isPeak: boolean;
  isHigh: boolean;
  hasCharges: boolean;
}

export interface CashFlowWeek {
  weekIndex: number;
  startDateStr: string;
  totalAmount: number;
  isHeaviest: boolean;
  marker?: 'Today' | '+30 Days' | '+60 Days' | '+90 Days';
  monthLabel?: string;
}

export interface CashFlowMonthTotal {
  monthName: string;
  totalAmount: number;
}

export interface CashFlowResult {
  cells: CashFlowCell[]; // 91 cells (13 weeks x 7 days)
  weeks: CashFlowWeek[]; // 13 weeks
  monthlyTotals: CashFlowMonthTotal[];
  totalForecast: number; // sum of all daily charges
  totalChargesCount: number;
  averagePerWeek: number;
  heaviestWeek: {
    weekIndex: number;
    startDateStr: string;
    endDateStr: string;
    totalAmount: number;
  } | null;
  peakDay: {
    dateStr: string;
    totalAmount: number;
  } | null;
  thresholdHigh: number;
  missingRatesCurrencies: string[];
  hasChargesInWindow: boolean;
}

/**
 * Calculates 75th percentile of non-zero daily totals.
 * Requires at least 2 non-zero charge days.
 */
export function calculate75thPercentile(amounts: number[]): number {
  if (amounts.length < 2) return Infinity; // No high threshold if < 2 days
  const sorted = [...amounts].sort((a, b) => a - b);
  // Nearest-rank or standard percentile
  const index = (75 / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Helper to advance date by billing cycle
 */
function advanceDateByCycle(date: Date, cycle: BillingCycle): Date {
  const next = new Date(date);
  switch (cycle) {
    case 'Weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'Monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'Quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'Yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

/**
 * Pure function to build the 90-day cash-flow timeline grid and financial projections.
 */
export function buildCashFlow(
  subscriptions: Subscription[],
  rates: ExchangeRateMap,
  baseCurrency: string,
  startDateInput?: Date | string,
  daysCount = 90
): CashFlowResult {
  const baseDate = startDateInput
    ? typeof startDateInput === 'string'
      ? parseISODate(startDateInput)
      : new Date(startDateInput)
    : new Date();

  // Normalize today to local midnight
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0);
  const todayStr = toISODateString(today);

  // Determine Monday of today's week (0=Mon, 1=Tue, ..., 6=Sun)
  // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  const jsDay = today.getDay();
  const dayOffsetFromMonday = (jsDay + 6) % 7; // Monday = 0, Sunday = 6

  const startMonday = new Date(today);
  startMonday.setDate(today.getDate() - dayOffsetFromMonday);

  // End of 90-day window
  const windowEndDate = new Date(today);
  windowEndDate.setDate(today.getDate() + daysCount - 1);
  const windowEndStr = toISODateString(windowEndDate);

  // Map of dateStr -> list of charges
  const dailyChargesMap: Record<string, CashFlowChargeItem[]> = {};
  const missingRatesSet = new Set<string>();

  // Exclude Paused and Cancelled subscriptions (case-insensitive)
  const eligibleSubs = subscriptions.filter((s) => {
    const st = (s.status || '').toLowerCase();
    return st !== 'paused' && st !== 'cancelled';
  });

  for (const sub of eligibleSubs) {
    // If rate is missing for sub currency
    const testConv = convertCurrency(1, sub.currency, baseCurrency, rates);
    if (testConv.isMissingRate) {
      missingRatesSet.add(sub.currency);
      continue;
    }

    const sharePrice = sub.price / Math.max(1, sub.splitCount || 1);
    const convertedAmount = convertCurrency(sharePrice, sub.currency, baseCurrency, rates).amount;

    // Check trial conversion date
    // Include trial-end dates as charge days only when the trial converts to a paid plan
    if (sub.isFreeTrial && sub.trialEndDate && sub.trialConvert !== false) {
      const trialEnd = parseISODate(sub.trialEndDate);
      trialEnd.setHours(0, 0, 0, 0);
      const trialEndStr = toISODateString(trialEnd);

      if (trialEndStr >= todayStr && trialEndStr <= windowEndStr) {
        if (!dailyChargesMap[trialEndStr]) dailyChargesMap[trialEndStr] = [];
        dailyChargesMap[trialEndStr].push({
          subscriptionId: sub.id,
          name: sub.name,
          amountInBase: convertedAmount,
          originalAmount: sharePrice,
          originalCurrency: sub.currency,
          isTrialConversion: true,
        });
      }
    }

    // Skip recurring projections for non-converting free trials
    if (sub.isFreeTrial && sub.trialConvert === false) {
      continue;
    }

    // Project renewal dates
    const initialRenewal = parseISODate(sub.nextRenewalDate);
    initialRenewal.setHours(0, 0, 0, 0);

    let curDate = new Date(initialRenewal);
    let iterations = 0;
    const maxIterations = 200;

    // If initial renewal is before today, advance until today or future
    while (curDate < today && iterations < maxIterations) {
      iterations++;
      curDate = advanceDateByCycle(curDate, sub.billingCycle);
    }

    // Now record every renewal falling inside [today, windowEndDate]
    iterations = 0;
    while (curDate <= windowEndDate && iterations < maxIterations) {
      iterations++;
      const dateStr = toISODateString(curDate);

      // Do not duplicate if already added as trial conversion on exact date
      const alreadyHasTrial = dailyChargesMap[dateStr]?.some(
        (c) => c.subscriptionId === sub.id && c.isTrialConversion
      );

      if (!alreadyHasTrial) {
        if (!dailyChargesMap[dateStr]) dailyChargesMap[dateStr] = [];
        dailyChargesMap[dateStr].push({
          subscriptionId: sub.id,
          name: sub.name,
          amountInBase: convertedAmount,
          originalAmount: sharePrice,
          originalCurrency: sub.currency,
          isTrialConversion: false,
        });
      }

      curDate = advanceDateByCycle(curDate, sub.billingCycle);
    }
  }

  // Find all daily totals within the 90-day window
  const nonZeroTotalsInWindow: { dateStr: string; total: number }[] = [];

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = toISODateString(d);
    const charges = dailyChargesMap[dateStr] || [];
    const sum = charges.reduce((acc, c) => acc + c.amountInBase, 0);
    if (sum > 0) {
      nonZeroTotalsInWindow.push({ dateStr, total: sum });
    }
  }

  // Calculate 75th percentile threshold
  const nonZeroAmounts = nonZeroTotalsInWindow.map((d) => d.total);
  const thresholdHigh = calculate75thPercentile(nonZeroAmounts);

  // Peak day: largest total; if tie, earliest date
  let peakDateStr = '';
  let peakMaxAmount = 0;

  for (const item of nonZeroTotalsInWindow) {
    if (item.total > peakMaxAmount) {
      peakMaxAmount = item.total;
      peakDateStr = item.dateStr;
    }
  }

  // Build the 91 grid cells: 13 weeks x 7 days
  const cells: CashFlowCell[] = [];
  const weeks: CashFlowWeek[] = [];
  const monthTotalsMap: Record<string, number> = {};

  let totalForecast = 0;
  let totalChargesCount = 0;

  let currentMonday = new Date(startMonday);
  let heaviestWeekIdx = -1;
  let heaviestWeekAmount = 0;

  let lastMonthName = '';

  for (let w = 0; w < 13; w++) {
    let weekTotal = 0;
    const weekStartStr = toISODateString(currentMonday);

    // Marker determination (+30, +60, +90, Today)
    let marker: 'Today' | '+30 Days' | '+60 Days' | '+90 Days' | undefined = undefined;
    if (w === 0) marker = 'Today';
    else if (w === 4) marker = '+30 Days';
    else if (w === 8) marker = '+60 Days';
    else if (w === 12) marker = '+90 Days';

    // Month label for week if month changed
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
    const currentMonthLabel = monthFormatter.format(currentMonday);
    let monthLabel: string | undefined = undefined;
    if (currentMonthLabel !== lastMonthName) {
      monthLabel = currentMonthLabel;
      lastMonthName = currentMonthLabel;
    }

    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(currentMonday);
      cellDate.setDate(currentMonday.getDate() + d);
      const cellDateStr = toISODateString(cellDate);

      const isBeforeToday = cellDateStr < todayStr;
      const isAfterWindow = cellDateStr > windowEndStr;
      const isToday = cellDateStr === todayStr;

      let charges: CashFlowChargeItem[] = [];
      let totalAmount = 0;

      if (!isBeforeToday && !isAfterWindow) {
        charges = dailyChargesMap[cellDateStr] || [];
        totalAmount = charges.reduce((acc, c) => acc + c.amountInBase, 0);
        weekTotal += totalAmount;
        totalForecast += totalAmount;
        totalChargesCount += charges.length;

        // Record for monthly total
        const mKey = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(cellDate);
        monthTotalsMap[mKey] = (monthTotalsMap[mKey] || 0) + totalAmount;
      }

      const isPeak = totalAmount > 0 && cellDateStr === peakDateStr;
      const isHigh = !isPeak && totalAmount > thresholdHigh && nonZeroAmounts.length >= 2;

      cells.push({
        dateStr: cellDateStr,
        dayOfWeek: d, // 0=Mon ... 6=Sun
        weekIndex: w,
        isBeforeToday,
        isAfterWindow,
        isToday,
        charges,
        totalAmount,
        isPeak,
        isHigh,
        hasCharges: charges.length > 0,
      });
    }

    if (weekTotal > heaviestWeekAmount) {
      heaviestWeekAmount = weekTotal;
      heaviestWeekIdx = w;
    }

    weeks.push({
      weekIndex: w,
      startDateStr: weekStartStr,
      totalAmount: weekTotal,
      isHeaviest: false, // will mark after loop
      marker,
      monthLabel,
    });

    // Advance to next Monday
    currentMonday.setDate(currentMonday.getDate() + 7);
  }

  // Mark heaviest week
  if (heaviestWeekIdx !== -1 && heaviestWeekAmount > 0) {
    weeks[heaviestWeekIdx].isHeaviest = true;
  }

  // Heaviest week date range
  let heaviestWeekInfo = null;
  if (heaviestWeekIdx !== -1 && heaviestWeekAmount > 0) {
    const hw = weeks[heaviestWeekIdx];
    const hwEnd = new Date(parseISODate(hw.startDateStr));
    hwEnd.setDate(hwEnd.getDate() + 6);
    heaviestWeekInfo = {
      weekIndex: hw.weekIndex,
      startDateStr: hw.startDateStr,
      endDateStr: toISODateString(hwEnd),
      totalAmount: hw.totalAmount,
    };
  }

  // Monthly totals array
  const monthlyTotals: CashFlowMonthTotal[] = Object.entries(monthTotalsMap).map(
    ([monthName, totalAmount]) => ({
      monthName,
      totalAmount,
    })
  );

  return {
    cells,
    weeks,
    monthlyTotals,
    totalForecast,
    totalChargesCount,
    averagePerWeek: totalForecast / 13,
    heaviestWeek: heaviestWeekInfo,
    peakDay: peakMaxAmount > 0 ? { dateStr: peakDateStr, totalAmount: peakMaxAmount } : null,
    thresholdHigh,
    missingRatesCurrencies: Array.from(missingRatesSet),
    hasChargesInWindow: totalChargesCount > 0,
  };
}
