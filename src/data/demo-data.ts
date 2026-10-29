import { Subscription } from '../types/subscription';

export function getDemoSubscriptions(): Subscription[] {
  const today = new Date();

  function formatRelativeDate(daysFromToday: number): string {
    const d = new Date(today);
    d.setDate(d.getDate() + daysFromToday);
    return d.toISOString().split('T')[0];
  }

  return [
    {
      id: 'demo-netflix',
      name: 'Netflix Premium (Demo)',
      category: 'Entertainment',
      price: 649,
      currency: 'INR',
      billingCycle: 'Monthly',
      startDate: formatRelativeDate(-60),
      nextRenewalDate: formatRelativeDate(3), // Renews in 3 days
      status: 'active',
      isFreeTrial: false,
      cancellationUrl: 'https://netflix.com/cancelplan',
      notes: 'Family 4K plan. Auto-debited on credit card.',
      reminderDaysBefore: 3,
      splitCount: 2, // Split with roommate
      priceHistory: [
        {
          id: 'ph-1',
          date: formatRelativeDate(-180),
          price: 649,
          currency: 'INR',
          reason: 'Initial plan signup',
        },
      ],
      usageCheckIn: {
        lastCheckedDate: formatRelativeDate(-5),
        frequency: 'daily',
        estimatedUsesPerMonth: 25,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-spotify',
      name: 'Spotify Individual (Demo)',
      category: 'Music',
      price: 119,
      currency: 'INR',
      billingCycle: 'Monthly',
      startDate: formatRelativeDate(-90),
      nextRenewalDate: formatRelativeDate(12),
      status: 'active',
      isFreeTrial: false,
      cancellationUrl: 'https://www.spotify.com/account/subscription/',
      notes: 'UPI AutoPay mandate on Google Pay.',
      reminderDaysBefore: 2,
      splitCount: 1,
      priceHistory: [
        {
          id: 'ph-2',
          date: formatRelativeDate(-90),
          price: 119,
          currency: 'INR',
          reason: 'Monthly auto-renew',
        },
      ],
      usageCheckIn: {
        lastCheckedDate: formatRelativeDate(-2),
        frequency: 'daily',
        estimatedUsesPerMonth: 30,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-canva-trial',
      name: 'Canva Pro Trial (Demo)',
      category: 'Productivity',
      price: 499,
      currency: 'INR',
      billingCycle: 'Monthly',
      startDate: formatRelativeDate(-28),
      nextRenewalDate: formatRelativeDate(2), // Trial ends in 2 days!
      status: 'trial',
      isFreeTrial: true,
      trialEndDate: formatRelativeDate(2),
      cancellationUrl: 'https://canva.com/settings/billing-and-teams',
      notes: 'Testing 30-day free trial for graphic design work. Cancel if not actively used.',
      reminderDaysBefore: 2,
      splitCount: 1,
      priceHistory: [
        {
          id: 'ph-3',
          date: formatRelativeDate(-28),
          price: 499,
          currency: 'INR',
          reason: 'Free trial registered',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'demo-amazon-prime',
      name: 'Amazon Prime Annual (Demo)',
      category: 'Shopping',
      price: 1499,
      currency: 'INR',
      billingCycle: 'Yearly',
      startDate: formatRelativeDate(-300),
      nextRenewalDate: formatRelativeDate(65),
      status: 'active',
      isFreeTrial: false,
      cancellationUrl: 'https://www.amazon.in/gp/subs/primeclub/account/homepage.html',
      notes: 'Includes free delivery, Prime Video and Music.',
      reminderDaysBefore: 7,
      splitCount: 1,
      priceHistory: [
        {
          id: 'ph-4',
          date: formatRelativeDate(-300),
          price: 1499,
          currency: 'INR',
          reason: 'Annual renewal',
        },
      ],
      usageCheckIn: {
        lastCheckedDate: formatRelativeDate(-10),
        frequency: 'several_times_week',
        estimatedUsesPerMonth: 8,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}
