import { BillingCycle, Category } from '../types/subscription';
import { CANCELLATION_GUIDES, CancellationGuide, GENERIC_CANCELLATION_CHECKLIST } from '../data/cancellation-guides';

export interface SmartImportResult {
  name: string;
  category: Category;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  nextRenewalDate?: string;
  isFreeTrial?: boolean;
  notes?: string;
}

/**
 * Fallback heuristic parser when Gemini API is unavailable or offline.
 */
export function heuristicExtract(text: string): SmartImportResult {
  const lower = text.toLowerCase();

  // Detect currency
  let currency = 'INR';
  if (text.includes('$') || lower.includes('usd')) currency = 'USD';
  else if (text.includes('€') || lower.includes('eur')) currency = 'EUR';
  else if (text.includes('£') || lower.includes('gbp')) currency = 'GBP';
  else if (text.includes('¥') || lower.includes('jpy')) currency = 'JPY';

  // Detect price: look for numbers with currency context or decimals
  let price = 199;
  const priceMatch = text.match(/(?:rs\.?|inr|\$|€|£|¥)\s*([0-9]+(?:[,.][0-9]{1,2})?)/i) ||
                     text.match(/([0-9]+(?:\.[0-9]{1,2})?)\s*(?:rs|inr|usd|debited|spent|paid)/i) ||
                     text.match(/\b([0-9]{2,5})\b/);
  if (priceMatch) {
    price = parseFloat(priceMatch[1].replace(/,/g, ''));
  }

  // Detect provider name and category
  let name = 'Recurring Service';
  let category: Category = 'Other';

  if (lower.includes('netflix')) {
    name = 'Netflix';
    category = 'Entertainment';
  } else if (lower.includes('spotify')) {
    name = 'Spotify';
    category = 'Music';
  } else if (lower.includes('hotstar')) {
    name = 'Disney+ Hotstar';
    category = 'Entertainment';
  } else if (lower.includes('prime') || lower.includes('amazon')) {
    name = 'Amazon Prime';
    category = 'Shopping';
  } else if (lower.includes('youtube')) {
    name = 'YouTube Premium';
    category = 'Music';
  } else if (lower.includes('cult') || lower.includes('gym')) {
    name = 'Cult.fit';
    category = 'Fitness';
  } else if (lower.includes('canva')) {
    name = 'Canva Pro';
    category = 'Productivity';
  } else if (lower.includes('chatgpt') || lower.includes('openai')) {
    name = 'ChatGPT Plus';
    category = 'Software';
  } else if (lower.includes('icloud') || lower.includes('apple')) {
    name = 'Apple iCloud+';
    category = 'Productivity';
  } else if (lower.includes('blinkit') || lower.includes('zepto')) {
    name = 'Quick Commerce Membership';
    category = 'Shopping';
  }

  // Detect cycle
  let cycle: BillingCycle = 'Monthly';
  if (lower.includes('year') || lower.includes('annual') || lower.includes('yr')) {
    cycle = 'Yearly';
  } else if (lower.includes('week')) {
    cycle = 'Weekly';
  } else if (lower.includes('quarter')) {
    cycle = 'Quarterly';
  }

  // Detect date if present
  let renewalDate: string | undefined = undefined;
  const dateMatch = text.match(/\b(202[0-9][-/.][0-1]?[0-9][-/.][0-3]?[0-9]|[0-3]?[0-9][-/.][0-1]?[0-9][-/.](?:20)?2[0-9])\b/);
  if (dateMatch) {
    // Attempt parsing
    try {
      const d = new Date(dateMatch[1]);
      if (!isNaN(d.getTime())) {
        renewalDate = d.toISOString().split('T')[0];
      }
    } catch {
      // ignore
    }
  }

  return {
    name,
    category,
    price,
    currency,
    billingCycle: cycle,
    nextRenewalDate: renewalDate,
    isFreeTrial: lower.includes('trial') || lower.includes('free trial'),
    notes: 'Extracted from: "' + text.slice(0, 100).trim() + '..."',
  };
}

/**
 * Calls server smart import route or falls back to heuristic parsing.
 */
export async function smartImportSubscription(
  rawText: string,
  imageBase64?: string
): Promise<SmartImportResult> {
  try {
    const res = await fetch('/api/gemini/smart-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText, image: imageBase64 }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        return json.data as SmartImportResult;
      }
    }
  } catch (err) {
    console.warn('Gemini server import unavailable, falling back to local heuristic:', err);
  }

  // Offline heuristic fallback
  return heuristicExtract(rawText);
}

/**
 * Generates or retrieves step-by-step cancellation instructions.
 */
export async function fetchCancellationGuide(
  providerName: string,
  cancellationUrl?: string
): Promise<CancellationGuide> {
  const normalizedKey = providerName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Try server Gemini API call
  try {
    const res = await fetch('/api/gemini/cancellation-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerName, cancellationUrl }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.guide) {
        return json.guide as CancellationGuide;
      }
    }
  } catch (err) {
    console.warn('Gemini server guide unavailable, using curated or generic fallback:', err);
  }

  // 2. Check pre-curated guides
  for (const [key, guide] of Object.entries(CANCELLATION_GUIDES)) {
    if (normalizedKey.includes(key) || key.includes(normalizedKey)) {
      return guide;
    }
  }

  // 3. Fallback generic guidance
  return {
    providerId: normalizedKey,
    providerName: providerName,
    directUrl: cancellationUrl,
    steps: GENERIC_CANCELLATION_CHECKLIST.map((c) => `${c.title}: ${c.desc}`),
    retentionTricks: [
      'Providers often offer a cheaper plan or a 1-month pause when you attempt to cancel.',
      'Look for the subtle "Continue to Cancel" link rather than the prominent "Keep My Plan" button.',
    ],
    proofTip: 'Take a full screenshot of the final cancellation confirmation screen and save the reference confirmation email.',
    upiAutoPayTip: 'If billed via UPI AutoPay or credit card mandate in India, remember to open your UPI app (GPay/PhonePe/Paytm) and revoke the mandate.',
  };
}
