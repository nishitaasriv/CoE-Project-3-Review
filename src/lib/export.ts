import { Subscription } from '../types/subscription';
import { AppStoredData } from './storage';

/**
 * Downloads a string as a file in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports subscriptions to a JSON file.
 */
export function exportToJSON(subscriptions: Subscription[], filename = 'subtrack-export.json'): void {
  const exportPayload: AppStoredData = {
    version: 2,
    subscriptions,
    lastModified: new Date().toISOString(),
  };
  const content = JSON.stringify(exportPayload, null, 2);
  downloadFile(content, filename, 'application/json');
}

/**
 * Exports subscriptions to CSV format.
 */
export function exportToCSV(subscriptions: Subscription[], filename = 'subtrack-export.csv'): void {
  const headers = [
    'Name',
    'Category',
    'Price',
    'Currency',
    'Billing Cycle',
    'Next Renewal',
    'Status',
    'Is Trial',
    'Trial End Date',
    'Split Count',
    'Cancellation URL',
    'Notes',
  ];

  const rows = subscriptions.map((s) => [
    `"${(s.name || '').replace(/"/g, '""')}"`,
    `"${s.category}"`,
    s.price,
    s.currency,
    s.billingCycle,
    s.nextRenewalDate,
    s.status,
    s.isFreeTrial ? 'Yes' : 'No',
    s.trialEndDate || '',
    s.splitCount || 1,
    `"${(s.cancellationUrl || '').replace(/"/g, '""')}"`,
    `"${(s.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * Validates and imports subscriptions from parsed JSON content.
 */
export function parseImportJSON(jsonString: string): Subscription[] {
  const parsed = JSON.parse(jsonString);
  let list: unknown[] = [];

  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (parsed && Array.isArray(parsed.subscriptions)) {
    list = parsed.subscriptions;
  } else {
    throw new Error('Invalid JSON format: Expected subscriptions array.');
  }

  // Validate items
  return list.map((item, idx) => {
    const s = item as Partial<Subscription>;
    if (!s.name || typeof s.price !== 'number') {
      throw new Error(`Item at position ${idx + 1} is missing required name or price.`);
    }
    return {
      id: s.id || `imported-${Date.now()}-${idx}`,
      name: s.name,
      category: s.category || 'Other',
      price: s.price,
      currency: s.currency || 'INR',
      billingCycle: s.billingCycle || 'Monthly',
      startDate: s.startDate || new Date().toISOString().split('T')[0],
      nextRenewalDate: s.nextRenewalDate || new Date().toISOString().split('T')[0],
      status: s.status || (s.isFreeTrial ? 'trial' : 'active'),
      isFreeTrial: Boolean(s.isFreeTrial),
      trialEndDate: s.trialEndDate,
      cancellationUrl: s.cancellationUrl,
      notes: s.notes,
      reminderDaysBefore: s.reminderDaysBefore || 7,
      splitCount: s.splitCount || 1,
      priceHistory: Array.isArray(s.priceHistory) ? s.priceHistory : [],
      createdAt: s.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Subscription;
  });
}

export interface BankStatementCandidate {
  rawDescription: string;
  detectedName: string;
  detectedPrice: number;
  detectedCurrency: string;
  detectedDate: string;
}

/**
 * Parses bank statement CSV rows to detect recurring looking charges.
 */
export function parseBankStatementCSV(csvContent: string): BankStatementCandidate[] {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const candidates: BankStatementCandidate[] = [];

  const commonKeywords = [
    'netflix', 'spotify', 'hotstar', 'prime', 'amazon', 'youtube', 'cult',
    'gym', 'membership', 'sub', 'subscription', 'apple.com', 'google play',
    'chatgpt', 'github', 'adobe', 'canva', 'patreon', 'linkedin', 'zepto',
    'blinkit', 'swiggy one', 'zomato gold', 'jiocinema', 'sony'
  ];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const hasKeyword = commonKeywords.some((kw) => lower.includes(kw));

    // Try to extract numbers (possible price)
    const priceMatch = line.match(/(?:(?:rs\.?|inr|\$|€|£)\s*)?([0-9]+(?:\.[0-9]{1,2})?)/i);
    const dateMatch = line.match(/\b(202[0-9][-/.][0-1]?[0-9][-/.][0-3]?[0-9]|[0-3]?[0-9][-/.][0-1]?[0-9][-/.](?:20)?2[0-9])\b/);

    if (hasKeyword && priceMatch) {
      const matchedKw = commonKeywords.find((kw) => lower.includes(kw)) || 'Subscription';
      const cleanName = matchedKw.charAt(0).toUpperCase() + matchedKw.slice(1);
      const parsedPrice = parseFloat(priceMatch[1]);

      if (parsedPrice > 10) {
        candidates.push({
          rawDescription: line.slice(0, 80),
          detectedName: cleanName,
          detectedPrice: parsedPrice,
          detectedCurrency: lower.includes('$') ? 'USD' : 'INR',
          detectedDate: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
        });
      }
    }
  }

  return candidates;
}
