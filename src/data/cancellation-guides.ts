export interface CancellationGuide {
  providerId: string;
  providerName: string;
  directUrl?: string;
  steps: string[];
  retentionTricks: string[];
  proofTip: string;
  upiAutoPayTip?: string;
}

export const CANCELLATION_GUIDES: Record<string, CancellationGuide> = {
  netflix: {
    providerId: 'netflix',
    providerName: 'Netflix',
    directUrl: 'https://netflix.com/cancelplan',
    steps: [
      'Navigate to netflix.com and sign in to the primary profile.',
      'Click your profile icon at the top right and select "Account".',
      'Under the "Membership & Billing" section, locate and click the "Cancel Membership" button.',
      'Review the cancellation terms (your access remains active until the end of your billing cycle).',
      'Click the blue "Finish Cancellation" button to confirm.',
      'Save the confirmation page or the confirmation email sent to your registered inbox.'
    ],
    retentionTricks: [
      'Netflix may suggest downgrading to a lower tier (e.g., Standard with ads or Basic).',
      'They will remind you that your viewing history and profiles will be saved for 10 months.'
    ],
    proofTip: 'Capture a screenshot of the "Your cancellation is confirmed" banner with the exact access end date, and save your confirmation email.',
    upiAutoPayTip: 'If you paid via UPI AutoPay (Paytm/GPay/PhonePe), also open your UPI app > Autopay / Mandates > select Netflix > tap "Revoke / Pause Mandate" to prevent automatic bank deductions.'
  },
  spotify: {
    providerId: 'spotify',
    providerName: 'Spotify',
    directUrl: 'https://www.spotify.com/account/subscription/',
    steps: [
      'Log in to spotify.com/account in your web browser (cannot cancel inside mobile apps).',
      'Under "Your plan", click "Change plan".',
      'Scroll down to the "Cancel Spotify" section and click "Cancel Premium".',
      'Click through the confirmation steps until you see the confirmation message.',
      'Keep note of your Premium expiry date (you keep music access until then).'
    ],
    retentionTricks: [
      'Spotify frequently offers a 1 to 3 month discounted extension or a cheaper Duo/Student plan before letting you leave.'
    ],
    proofTip: 'Spotify will show "You\'ve cancelled Premium" with your plan end date. Save the email confirmation as proof.',
    upiAutoPayTip: 'If registered via Indian UPI recurring mandate, check GPay/PhonePe AutoPay settings and revoke Spotify mandate.'
  },
  'amazon-prime': {
    providerId: 'amazon-prime',
    providerName: 'Amazon Prime',
    directUrl: 'https://www.amazon.in/gp/subs/primeclub/account/homepage.html',
    steps: [
      'Open Amazon and go to "Your Account".',
      'Select "Prime - Manage Membership" or "Manage My Membership".',
      'Click on "Manage Membership" dropdown in the top bar.',
      'Select "End Membership and benefits".',
      'Amazon will show 2 to 3 reminder pages showing benefits you will lose; click "Continue to Cancel" on each page.',
      'Click "End on [Date]" or "Cancel Now" to finalize.'
    ],
    retentionTricks: [
      'Multiple confirmation screens highlighting delivery savings and Prime Video shows.',
      'Prompts to switch to annual or quarterly billing instead of cancelling.'
    ],
    proofTip: 'Keep a screenshot of the confirmation page showing "Your Prime membership has been cancelled".',
    upiAutoPayTip: 'Check your bank or UPI app for recurring Amazon mandates and revoke if necessary.'
  },
  'disney-hotstar': {
    providerId: 'disney-hotstar',
    providerName: 'Disney+ Hotstar',
    directUrl: 'https://hotstar.com',
    steps: [
      'Open Hotstar web app and click on "My Space" or profile icon.',
      'Go to "Help & Settings" > "Subscription & Devices".',
      'Select your active subscription plan.',
      'Click "Cancel Subscription" and select a reason.',
      'Confirm cancellation when prompted.'
    ],
    retentionTricks: [
      'May offer discounts on upcoming cricket tournaments or special series.',
      'Reminds that active downloaded content will be removed.'
    ],
    proofTip: 'Screenshot the subscription status page showing "Cancelled" and the expiry date.',
    upiAutoPayTip: 'Crucial in India: Check your UPI app (Google Pay, PhonePe, Paytm, or BHIM) and cancel the Hotstar AutoPay mandate.'
  },
  'cult-fit': {
    providerId: 'cult-fit',
    providerName: 'Cult.fit',
    directUrl: 'https://cult.fit',
    steps: [
      'Open Cult.fit app or website and go to Profile > Manage Subscriptions.',
      'Select your active Cultpass (Elite / Pro / Live).',
      'Look for Pause Membership or Cancel Auto-Renewal.',
      'If billed via recurring mandate, disable auto-debit.',
      'Contact support chat if the direct cancel button is hidden.'
    ],
    retentionTricks: [
      'Offers free pause days (up to 30-90 days) so you do not cancel.',
      'Discounts on renewals or buddy passes.'
    ],
    proofTip: 'Keep email confirmation or support ticket ID confirming mandate cancellation.',
    upiAutoPayTip: 'Directly revoke Cult.fit / Curefit recurring mandate in PhonePe/GPay under AutoPay settings.'
  }
};

export const GENERIC_CANCELLATION_CHECKLIST = [
  { id: '1', title: 'Open Provider Website', desc: 'Go to the official account or billing page in your browser.' },
  { id: '2', title: 'Sign In to Account', desc: 'Log in with the email/phone linked to this subscription.' },
  { id: '3', title: 'Go to Account Settings', desc: 'Click your avatar/profile and open Settings or Account.' },
  { id: '4', title: 'Open Billing & Subscriptions', desc: 'Locate "Manage Subscription", "Plan", or "Billing".' },
  { id: '5', title: 'Click Cancel / End Plan', desc: 'Look for "Cancel Subscription", "End Membership", or "Turn off Auto-Renew".' },
  { id: '6', title: 'Decline Retention Offers', desc: 'Watch out for discount offers, pauses, or multi-step questions.' },
  { id: '7', title: 'Confirm Cancellation', desc: 'Click the final confirmation button until you see a success message.' },
  { id: '8', title: 'Save Proof & Revoke Mandate', desc: 'Screenshot confirmation, note reference #, and revoke UPI/Bank mandate if in India.' }
];
