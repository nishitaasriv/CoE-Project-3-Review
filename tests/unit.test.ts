import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  getMonthlyEquivalentCost,
  getYearlyEquivalentCost,
  autoRollSubscriptions,
  calculateTotals,
} from '../src/lib/subscriptions';
import {
  formatMoney,
  convertCurrency,
  migrateCurrencySymbolToISO,
} from '../src/lib/currency';
import { rollForwardRenewalDate } from '../src/lib/dates';
import {
  hashPassword,
  verifyPassword,
  constantTimeEquals,
} from '../src/lib/auth/passwordHash';
import {
  buildCashFlow,
  calculate75thPercentile,
} from '../src/lib/cashflow';
import { Subscription } from '../src/types/subscription';

// Polyfill localStorage and sessionStorage for Node.js test environment if absent
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as any;
}

if (typeof globalThis.sessionStorage === 'undefined') {
  const sessionStore = new Map<string, string>();
  globalThis.sessionStorage = {
    getItem: (key: string) => sessionStore.get(key) ?? null,
    setItem: (key: string, value: string) => sessionStore.set(key, String(value)),
    removeItem: (key: string) => sessionStore.delete(key),
    clear: () => sessionStore.clear(),
    key: (index: number) => Array.from(sessionStore.keys())[index] ?? null,
    get length() {
      return sessionStore.size;
    },
  } as any;
}

// Helper to create valid mock subscriptions for testing
function createMockSub(
  partial: Partial<Subscription> & {
    id: string;
    name: string;
    price: number;
    currency: string;
    billingCycle: Subscription['billingCycle'];
    nextRenewalDate: string;
  }
): Subscription {
  return {
    category: 'Software',
    status: 'active',
    isFreeTrial: false,
    reminderDaysBefore: 3,
    splitCount: 1,
    priceHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: '2026-01-01',
    ...partial,
  };
}

// Import auth after localStorage polyfill
import {
  registerLocal,
  loginLocal,
  resetPasswordLocal,
  getCooldownRemainingSeconds,
} from '../src/lib/auth/localAuth';

describe('SubTrack Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // =========================================================================
  // 1. Core Cost Calculations
  // =========================================================================
  it('calculates monthly and yearly costs accurately for all billing cycles', () => {
    assert.strictEqual(getMonthlyEquivalentCost(649, 'Monthly', 1), 649);
    assert.strictEqual(getYearlyEquivalentCost(649, 'Monthly', 1), 7788);

    assert.strictEqual(getMonthlyEquivalentCost(1200, 'Yearly', 1), 100);
    assert.strictEqual(getYearlyEquivalentCost(1200, 'Yearly', 1), 1200);

    const weeklyMonthly = getMonthlyEquivalentCost(70, 'Weekly', 1);
    assert.strictEqual(Math.round(weeklyMonthly), 303);

    assert.strictEqual(getMonthlyEquivalentCost(649, 'Monthly', 2), 324.5);
  });

  // =========================================================================
  // 2. Renewal Roll-Forward
  // =========================================================================
  it('rolls forward past renewal dates until they are in the future', () => {
    const pastDate = '2023-01-15';
    const rolled = rollForwardRenewalDate(pastDate, 'Monthly');
    const rolledDate = new Date(rolled);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    assert.ok(rolledDate.getTime() >= today.getTime(), 'Rolled date must be >= today');
  });

  // =========================================================================
  // 3. Currency Formatting (INR, USD, JPY)
  // =========================================================================
  it('formats currencies according to their own locale rules without hardcoded symbols', () => {
    const inrFormatted = formatMoney(1499, 'INR');
    assert.ok(inrFormatted.includes('₹') || inrFormatted.includes('INR'), 'Must format INR');

    const usdFormatted = formatMoney(19.99, 'USD');
    assert.ok(usdFormatted.includes('$'), 'Must format USD with $');

    const jpyFormatted = formatMoney(1500, 'JPY');
    assert.ok(
      jpyFormatted.includes('¥') || jpyFormatted.includes('￥') || jpyFormatted.includes('JPY'),
      'Must format JPY currency'
    );
    assert.ok(!jpyFormatted.includes('.00'), 'JPY should have zero decimals');
    assert.ok(jpyFormatted.includes('1,500') || jpyFormatted.includes('1500'), 'Must contain 1,500');
  });

  // =========================================================================
  // 4. Old-Symbol-To-ISO Migration
  // =========================================================================
  it('migrates legacy currency symbols to standard ISO 4217 codes', () => {
    assert.strictEqual(migrateCurrencySymbolToISO('₹'), 'INR');
    assert.strictEqual(migrateCurrencySymbolToISO('$'), 'USD');
    assert.strictEqual(migrateCurrencySymbolToISO('€'), 'EUR');
    assert.strictEqual(migrateCurrencySymbolToISO('£'), 'GBP');
    assert.strictEqual(migrateCurrencySymbolToISO('¥'), 'JPY');
    assert.strictEqual(migrateCurrencySymbolToISO('INR'), 'INR');
    assert.strictEqual(migrateCurrencySymbolToISO(''), 'INR');
  });

  // =========================================================================
  // 5. Currency Conversion with Missing Rates
  // =========================================================================
  it('handles missing exchange rates gracefully and excludes them from totals', () => {
    const rates = { USD: 1.0, INR: 83.5 };

    const valid = convertCurrency(10, 'USD', 'INR', rates);
    assert.strictEqual(valid.isMissingRate, false);
    assert.strictEqual(Math.round(valid.amount), 835);

    const missing = convertCurrency(10, 'EUR', 'INR', rates);
    assert.strictEqual(missing.isMissingRate, true);
    assert.strictEqual(missing.amount, 0);
  });

  // =========================================================================
  // 6. 90-Day Cash-Flow Timeline & Heatmap Calculations
  // =========================================================================
  it('builds exactly 91 cells (13 weeks x 7 days) and repeats weekly charges 12-13 times', () => {
    const startDate = '2026-11-01'; // Sunday
    const weeklySub = createMockSub({
      id: 'sub_weekly',
      name: 'Gym Pass',
      category: 'Fitness',
      price: 50,
      currency: 'USD',
      billingCycle: 'Weekly',
      nextRenewalDate: '2026-11-02', // Monday
      status: 'active',
      startDate: '2026-10-01',
    });

    const rates = { USD: 1.0 };
    const res = buildCashFlow([weeklySub], rates, 'USD', startDate, 90);

    assert.strictEqual(res.cells.length, 91, 'Grid must have exactly 91 cells');
    assert.strictEqual(res.weeks.length, 13, 'Grid must have 13 weeks');

    // Count occurrences of charges in window
    let chargeCount = 0;
    for (const cell of res.cells) {
      if (!cell.isBeforeToday && !cell.isAfterWindow && cell.charges.length > 0) {
        chargeCount += cell.charges.length;
      }
    }

    assert.ok(chargeCount >= 12 && chargeCount <= 13, `Weekly charge should appear 12-13 times, got ${chargeCount}`);
  });

  it('rolls forward monthly subscriptions across month ends correctly', () => {
    const startDate = '2026-01-15';
    const subMonthly = createMockSub({
      id: 'sub_monthly',
      name: 'Cloud Storage',
      category: 'Productivity',
      price: 10,
      currency: 'USD',
      billingCycle: 'Monthly',
      nextRenewalDate: '2026-01-31',
      status: 'active',
      startDate: '2025-12-31',
    });

    const res = buildCashFlow([subMonthly], { USD: 1 }, 'USD', startDate, 90);

    // Jan 31 -> Feb 28 -> Mar 31 -> approx 3 charges in 90 days
    assert.strictEqual(res.totalChargesCount, 3);
  });

  it('excludes yearly subscriptions outside the 90-day window, includes inside', () => {
    const startDate = '2026-11-01';
    const subFarYearly = createMockSub({
      id: 'sub_far',
      name: 'Domain Renewal Far',
      category: 'Software',
      price: 120,
      currency: 'USD',
      billingCycle: 'Yearly',
      nextRenewalDate: '2027-08-01', // > 90 days
      status: 'active',
      startDate: '2026-08-01',
    });

    const subNearYearly = createMockSub({
      id: 'sub_near',
      name: 'Domain Renewal Near',
      category: 'Software',
      price: 60,
      currency: 'USD',
      billingCycle: 'Yearly',
      nextRenewalDate: '2026-11-20', // within 90 days
      status: 'active',
      startDate: '2025-11-20',
    });

    const res = buildCashFlow([subFarYearly, subNearYearly], { USD: 1 }, 'USD', startDate, 90);

    const chargedNames = res.cells.flatMap((c) => c.charges.map((ch) => ch.name));
    assert.ok(!chargedNames.includes('Domain Renewal Far'), 'Far yearly subscription must be excluded');
    assert.ok(chargedNames.includes('Domain Renewal Near'), 'Near yearly subscription must be included');
  });

  it('excludes Paused and Cancelled subscriptions, tags trial conversions', () => {
    const startDate = '2026-11-01';
    const pausedSub = createMockSub({
      id: 'sub_p',
      name: 'Paused News',
      category: 'Entertainment',
      price: 15,
      currency: 'USD',
      billingCycle: 'Monthly',
      nextRenewalDate: '2026-11-05',
      status: 'paused',
      startDate: '2026-10-01',
    });

    const cancelledSub = createMockSub({
      id: 'sub_c',
      name: 'Cancelled SaaS',
      category: 'Software',
      price: 25,
      currency: 'USD',
      billingCycle: 'Monthly',
      nextRenewalDate: '2026-11-05',
      status: 'cancelled',
      startDate: '2026-10-01',
    });

    const trialConvertingSub = createMockSub({
      id: 'sub_trial',
      name: 'Design Tool Trial',
      category: 'Productivity',
      price: 30,
      currency: 'USD',
      billingCycle: 'Monthly',
      isFreeTrial: true,
      trialEndDate: '2026-11-10',
      trialConvert: true, // Converts!
      nextRenewalDate: '2026-12-10',
      status: 'active',
      startDate: '2026-10-27',
    });

    const res = buildCashFlow([pausedSub, cancelledSub, trialConvertingSub], { USD: 1 }, 'USD', startDate, 90);
    const chargedNames = res.cells.flatMap((c) => c.charges.map((ch) => ch.name));

    assert.ok(!chargedNames.includes('Paused News'), 'Paused sub must be excluded');
    assert.ok(!chargedNames.includes('Cancelled SaaS'), 'Cancelled sub must be excluded');
    assert.ok(chargedNames.includes('Design Tool Trial'), 'Trial conversion must be included');

    const trialCharge = res.cells
      .flatMap((c) => c.charges)
      .find((ch) => ch.name === 'Design Tool Trial' && ch.isTrialConversion);
    assert.ok(trialCharge, 'Trial conversion charge must be tagged isTrialConversion=true');
  });

  it('strictly satisfies forecast sum equality: sum of daily totals === sum of weekly totals === forecast', () => {
    const startDate = '2026-11-01';
    const subs: Subscription[] = [
      createMockSub({
        id: 'sub_1',
        name: 'Weekly Sub',
        category: 'Entertainment',
        price: 12.5,
        currency: 'USD',
        billingCycle: 'Weekly',
        nextRenewalDate: '2026-11-03',
        status: 'active',
        startDate: '2026-10-01',
      }),
      createMockSub({
        id: 'sub_2',
        name: 'Monthly Sub',
        category: 'Productivity',
        price: 49.99,
        currency: 'USD',
        billingCycle: 'Monthly',
        nextRenewalDate: '2026-11-15',
        status: 'active',
        startDate: '2026-10-15',
      }),
    ];

    const res = buildCashFlow(subs, { USD: 1 }, 'USD', startDate, 90);

    const sumDaily = res.cells.reduce((acc, c) => acc + c.totalAmount, 0);
    const sumWeekly = res.weeks.reduce((acc, w) => acc + w.totalAmount, 0);

    assert.strictEqual(
      Number(sumDaily.toFixed(2)),
      Number(res.totalForecast.toFixed(2)),
      'Daily sum must match forecast'
    );
    assert.strictEqual(
      Number(sumWeekly.toFixed(2)),
      Number(res.totalForecast.toFixed(2)),
      'Weekly sum must match forecast'
    );
  });

  it('calculates 75th percentile threshold and peak day with earliest date tie-breaker', () => {
    const amounts = [10, 20, 30, 40, 50, 60, 70, 80];
    const p75 = calculate75thPercentile(amounts);
    assert.strictEqual(p75, 62.5);

    // Test peak tie-breaker
    const startDate = '2026-11-01';
    const subA = createMockSub({
      id: 'sub_a',
      name: 'Sub A',
      category: 'Software',
      price: 100,
      currency: 'USD',
      billingCycle: 'Monthly',
      nextRenewalDate: '2026-11-05',
      status: 'active',
      startDate: '2026-10-05',
    });
    const subB = createMockSub({
      id: 'sub_b',
      name: 'Sub B',
      category: 'Software',
      price: 100,
      currency: 'USD',
      billingCycle: 'Monthly',
      nextRenewalDate: '2026-11-20',
      status: 'active',
      startDate: '2026-10-20',
    });

    const res = buildCashFlow([subA, subB], { USD: 1 }, 'USD', startDate, 90);
    assert.strictEqual(res.peakDay?.dateStr, '2026-11-05', 'Peak tie-breaker must pick earliest date');
  });

  // =========================================================================
  // 7. Web Crypto PBKDF2 Password Hashing & Verification
  // =========================================================================
  it('hashes passwords with PBKDF2 Web Crypto with 100,000 iterations and base64 output', async () => {
    const pass = 'SecretP@ssw0rd! 2026';
    const result = await hashPassword(pass);

    assert.ok(result.hashBase64.length > 20, 'Hash must be base64 string');
    assert.ok(result.saltBase64.length > 10, 'Salt must be base64 string');
    assert.strictEqual(result.iterations, 100000);

    const { isValid } = await verifyPassword(pass, result.saltBase64, result.hashBase64, result.iterations);
    assert.strictEqual(isValid, true, 'Original password must verify successfully');

    const wrongResult = await verifyPassword('WrongPassword', result.saltBase64, result.hashBase64, result.iterations);
    assert.strictEqual(wrongResult.isValid, false, 'Wrong password must fail verification');
  });

  it('generates distinct salts and hashes for identical passwords', async () => {
    const pass = 'SamePasswordForBothAccounts';
    const hash1 = await hashPassword(pass);
    const hash2 = await hashPassword(pass);

    assert.notStrictEqual(hash1.saltBase64, hash2.saltBase64, 'Salts must be randomly generated and distinct');
    assert.notStrictEqual(hash1.hashBase64, hash2.hashBase64, 'Hashes must differ due to unique salts');
  });

  it('preserves passwords with spaces, special symbols, and emojis unaltered', async () => {
    const complexPass = '   My Pass w0rd #!$ @ %^&* ()_+ 😀 🔒   ';
    const { hashBase64, saltBase64 } = await hashPassword(complexPass);

    const verifyExact = await verifyPassword(complexPass, saltBase64, hashBase64);
    assert.strictEqual(verifyExact.isValid, true, 'Exact password with spaces & emojis must verify');

    // Trimmed version must NOT verify because password was not altered
    const verifyTrimmed = await verifyPassword(complexPass.trim(), saltBase64, hashBase64);
    assert.strictEqual(verifyTrimmed.isValid, false, 'Trimmed password must not match untrimmed original');
  });

  it('normalizes email addresses identically (trim and lowercase) for registration and login', async () => {
    await registerLocal('Alice Cooper', '  ALICE@example.com  ', 'ValidPass123!');

    // Sign in with lowercase and extra spaces
    const { user } = await loginLocal('alice@example.com', 'ValidPass123!', true);
    assert.strictEqual(user.email, 'alice@example.com');

    // Wrong password must throw generic error
    await assert.rejects(
      async () => {
        await loginLocal('alice@example.com', 'IncorrectPassword', true);
      },
      (err: any) => err.message === 'Incorrect email or password'
    );
  });

  it('enforces 5 failed attempts cooldown lock for 30 seconds', async () => {
    await registerLocal('Bob Smith', 'bob@example.com', 'BobPassword123!');

    for (let i = 0; i < 4; i++) {
      try {
        await loginLocal('bob@example.com', 'WrongPass', false);
      } catch {
        // expected failure
      }
    }

    assert.strictEqual(getCooldownRemainingSeconds(), 0, 'Should not be locked after 4 attempts');

    // 5th attempt locks
    await assert.rejects(
      async () => {
        await loginLocal('bob@example.com', 'WrongPass', false);
      },
      (err: any) => err.message.includes('Locked for 30 seconds')
    );

    assert.ok(getCooldownRemainingSeconds() > 0, 'Cooldown must be active after 5 failures');
  });

  it('allows password reset by verifying registered email and full name', async () => {
    await registerLocal('Charlie Davis', 'charlie@example.com', 'OldPassword123!');

    // Mismatched name fails
    await assert.rejects(
      async () => {
        await resetPasswordLocal('charlie@example.com', 'Wrong Name', 'NewPassword123!');
      },
      /No account matches/
    );

    // Correct name and email succeeds
    await resetPasswordLocal('charlie@example.com', 'Charlie Davis', 'NewPassword123!');

    // Login with new password succeeds
    const { user } = await loginLocal('charlie@example.com', 'NewPassword123!', true);
    assert.strictEqual(user.name, 'Charlie Davis');
  });

  it('constantTimeEquals provides secure string comparison', () => {
    assert.strictEqual(constantTimeEquals('hello', 'hello'), true);
    assert.strictEqual(constantTimeEquals('hello', 'world'), false);
    assert.strictEqual(constantTimeEquals('hello', 'hello!'), false);
  });
});
