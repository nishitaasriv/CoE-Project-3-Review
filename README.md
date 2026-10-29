# SubTrack

A subscription reminder and cancellation assistant that helps individuals track recurring expenses, manage free-trial expiry deadlines, monitor multi-currency spending, and cancel unwanted services with confidence.

---

## 1. Problem Statement

People frequently sign up for digital services or free trials (streaming, productivity suites, gym memberships, cloud storage) and forget their renewal or trial-expiry dates. This leads to unwanted recurring bank debits, credit card auto-charges, and difficult-to-navigate cancellation retention funnels. 

SubTrack solves this by providing:
- Explicit proactive reminders before trials and recurring billing dates arrive.
- Provider-specific, step-by-step cancellation workflows with retention-trick warnings.
- India-friendly recurring mandate tips (revoking UPI AutoPay on Google Pay, PhonePe, Paytm).
- Multi-currency spending intelligence with INR default and base currency normalization.
- 100% private, client-side data isolation with PBKDF2 cryptography.

---

## 2. Key Features

### Core Tracking & Smart Reminders
- **Dashboard Overview**: Active subscription count, monthly run rate, yearly projection, money saved counter, and upcoming renewals for the next 30 days.
- **Auto-Roll Renewals**: Never leaves active subscriptions as "Expired". Dates automatically roll forward by weekly, monthly, quarterly, or yearly cycles.
- **Trial Guard**: Dedicated alerts for free trials (e.g. "Trial ends today", "Trial ends in 2d") with rapid cancellation actions.
- **Calendar Integration (.ics)**: 1-click download of RFC 5545 `.ics` files for individual subscriptions or all upcoming renewals.
- **In-App Installable PWA**: Compliant Progressive Web App with service worker caching, install button, and iOS Safari home-screen guidance.

### Cancellation Assistant & Proof Vault
- **Step-by-step Cancellation Checklist**: Step-by-step interactive instructions for major services (Netflix, Spotify, Amazon Prime, Disney+ Hotstar, Cult.fit) with retention traps alerts.
- **Direct Official Cancellation Links**: One-click links straight to the provider's official account management page.
- **Proof of Cancellation Vault**: Store cancellation reference codes, chat notes, and screenshots locally to defend against erroneous post-cancellation charges.
- **India UPI AutoPay Guidance**: Reminders to revoke recurring mandates in UPI apps after cancelling subscriptions.

### Multi-Currency & Financial Insights
- **10 Core Currencies**: INR (₹, default & mandatory), USD ($), EUR (€), GBP (£), JPY (¥), AUD (A$), CAD (C$), SGD (S$), AED (د.إ), CNY (¥).
- **Extensible Architecture**: Adding an 11th currency requires adding only a single object in `src/data/currencies.ts`.
- **Live & Offline Exchange Rates**: Editable conversion rates table with 1-click "Refresh rates" from open exchange APIs.
- **Duplicate & Overlap Detector**: Detects when you have multiple competing subscriptions in the same category (e.g. Netflix + Prime Video or Spotify + YouTube Music).
- **What-If Savings Simulator**: Toggle checkboxes to simulate potential annual savings from cancelling selected subscriptions.
- **90-Day Cash-Flow Timeline**: Visual heatmap of upcoming renewals highlighting high-spend days and peak renewal dates.
- **Subscription Health Score (0–100)**: Calculated using cost-per-use, frequency of check-ins, and price creep.
- **Price Creep Detector**: Tracks price increase history since signup and displays total annual creep.
- **Privacy Mode**: One-tap toggle to blur all monetary figures for screen privacy.

### Smart Import & AI Integration (Gemini 3.8 Flash)
- **Smart Import**: Paste a bank SMS, email receipt, or statement line (or upload a screenshot) to auto-extract provider name, price, currency, cycle, and date.
- **Cancellation Guide Generator**: Generates customized steps, retention warnings, and proof advice for any custom provider.
- **Full Offline Fallback**: If offline or if the Gemini API key is not supplied, SubTrack falls back seamlessly to local regex heuristics and curated guides.

### Local PBKDF2 Authentication & Session Isolation
- **Mode A (Default Local Mode)**: Accounts stored safely in localStorage with PBKDF2 password hashing (random salt, SHA-256, 100,000 iterations). Zero plain-text storage.
- **User Data Isolation**: Subscriptions stored under user-specific storage keys (`subtrack_data_<userId>`). Multiple users on the same computer cannot access each other's data.
- **Guest Mode & Migration**: Explore instantly as a guest, and migrate guest data to an account at any time.
- **Brute-Force Protection**: 5 failed login attempts trigger an automatic 30-second cooldown with a visible countdown timer.

---

## 3. Tech Stack

- **Framework**: React 19 + TypeScript, Vite 8, Tailwind CSS v4
- **Routing**: React Router DOM (`/login`, `/register`, `/forgot-password`, `/dashboard`, `/subscriptions`, `/add`, `/cancellation`, `/insights`, `/settings`, `/profile`)
- **Visuals & Charts**: Recharts (strictly styled in SubTrack's Navy / Blue / Purple / Pink palette), Lucide React
- **Backend / API**: Express 4 server for server-side `@google/genai` calls (`gemini-3.8-flash`) and static production serving
- **PWA**: `vite-plugin-pwa` with auto-update service worker and Web App Manifest
- **Testing**: Node.js test runner (`node:test`) + `tsx`

---

## 4. Design & Color Palette (Section 10 Strict Compliance)

SubTrack strictly employs **four hue families** with no forbidden colors (no green, red, amber, orange, or teal):
1. **60% Dark Navy**: `#070B1F` (deepest), `#0B1130` (main background), `#111A40` (cards), `#18234F` (raised surfaces/inputs), `#26336B` (borders/dividers).
2. **25% Blue**: `#2563EB` (primary buttons), `#3B82F6` (active states, links, main chart series), `#60A5FA` (hover accents).
3. **10% Purple**: `#7C3AED` to `#3B82F6` (brand gradients, feature cards, secondary chart series).
4. **5% Pink**: `#EC4899` / `#F472B6` (urgent alerts: due today, trial ends today, over budget, peak heatmap days, and notification dots).

---

## 5. Project Structure

```
├── public/                     # Favicon, SVG icon, PWA PNG icons, manifest
├── src/
│   ├── components/
│   │   ├── auth/              # PasswordInput, PasswordStrength, ProtectedRoute
│   │   ├── currency/          # CurrencySelect, MoneyText
│   │   ├── dashboard/         # StatCard, SpendChart, CategoryBars, ReminderRail, CashFlowTimeline, HealthScoreCard, BudgetAlertCard
│   │   ├── layout/            # AppShell, Sidebar, MobileNav, PageHeader
│   │   ├── subscriptions/     # SubscriptionCard, SubscriptionForm, SmartImportModal, ProofVaultModal, AlternativesModal
│   │   └── ui/                # Button, Modal, Toast, Badge, EmptyState, CommandPalette, OnboardingModal, PWAInstallButton
│   ├── data/
│   │   ├── cancellation-guides.ts # Curated provider cancellation steps & tips
│   │   ├── categories.ts      # Subscription categories and metadata
│   │   ├── currencies.ts      # 10 core currencies registry (INR default)
│   │   ├── demo-data.ts       # Relative sample subscriptions (Netflix, Spotify, Canva trial, Prime)
│   │   └── providers.ts       # Typed provider registry (Music, Entertainment, Shopping, Fitness)
│   ├── hooks/
│   │   ├── useAuth.tsx        # Auth provider context, session management, auto-lock
│   │   ├── useNotifications.ts# Ambient browser notifications
│   │   ├── useOnlineStatus.ts # Network status listener
│   │   ├── usePWAInstall.ts   # PWA prompt and iOS Safari guide
│   │   ├── useSettings.ts     # User settings, base currency, live exchange rates
│   │   └── useSubscriptions.ts# Subscriptions CRUD, auto-roll, sample loader
│   ├── lib/
│   │   ├── auth/              # PBKDF2 passwordHash, session storage, localAuth, authService
│   │   ├── currency.ts        # Intl.NumberFormat formatter, conversion engine, ISO symbol migration
│   │   ├── dates.ts           # Hydration-safe dates and auto-roll renewal forward engine
│   │   ├── export.ts          # JSON/CSV export, JSON import, statement CSV parser
│   │   ├── gemini.ts          # Gemini API proxy client with heuristic fallback
│   │   ├── ics.ts             # RFC 5545 iCalendar generation and download
│   │   ├── reminders.ts       # Reminder calculation adhering to Section 10 color tokens
│   │   ├── storage.ts         # Versioned, isolated localStorage manager
│   │   └── subscriptions.ts   # Monthly/yearly cost math, health score, price creep, overlaps
│   ├── pages/                 # Login, Register, ForgotPassword, Dashboard, Subscriptions, AddEdit, Cancellation, Insights, Settings, Profile
│   ├── styles/                # Theme tokens (theme.css) and global index.css
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   └── unit.test.ts           # Comprehensive unit tests for math, conversions, roll-forward, and crypto
├── server.ts                  # Express full-stack entry point for Gemini API proxy and Vite middlewares
├── metadata.json
└── package.json
```

---

## 6. How to Add a New Currency

Adding an 11th currency requires editing **only one file**: `src/data/currencies.ts`. Add a new entry to the `CURRENCY_REGISTRY` array:

```typescript
{
  code: 'NZD',
  name: 'New Zealand Dollar',
  symbol: 'NZ$',
  region: 'New Zealand',
  flag: '🇳🇿',
  locale: 'en-NZ',
  decimalPlaces: 2,
  enabled: true,
}
```

No other component or calculations need to be updated; `CurrencySelect`, `MoneyText`, and the exchange rate tables automatically incorporate it.

---

## 7. How Exchange Rates & Data Migration Work

1. **Storage Format**: Subscriptions always store the standard ISO 4217 code (e.g. `'INR'`, `'USD'`), never ambiguous symbols (`₹`, `$`). Legacy data using symbols is migrated automatically on load via `migrateCurrencySymbolToISO`.
2. **Exchange Rates**: All exchange rates in SubTrack are stored relative to `1 USD`.
   - Conversion from Currency A to Currency B: `(Amount / Rate_A) * Rate_B`.
   - Missing Rates: If an exchange rate for a currency is missing or zero, SubTrack flags it with a warning and excludes it from base totals instead of silently counting it as 1:1.
3. **Changing Base Currency**: Changing your base currency in Settings recalculates dashboard totals, charts, budget caps, and savings simulations instantly without modifying original subscription price records.

---

## 8. Setup and Run Steps

### Development
```bash
# Install dependencies
npm install

# Run the dev server (Express + Vite on port 3000)
npm run dev
```

### Production Build
```bash
# Build Vite client assets
npm run build

# Start production server
npm run start
```

### Run Unit Tests
```bash
npm run test
```

---

## 9. Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# GEMINI_API_KEY: Optional. Used for Smart Import and custom AI cancellation guides.
GEMINI_API_KEY="your_gemini_api_key"

# PORT: Default is 3000
PORT=3000
```

*Note: The app is completely functional without `GEMINI_API_KEY`. When omitted, smart import utilizes local regex parsing, and the cancellation assistant uses pre-curated provider guides.*

---

## 10. Limitations & Future Roadmap

### Current Limitations
- **Local Browser Storage**: Data is kept inside your browser's `localStorage`. Clearing browser site data removes local records unless backed up via JSON export.
- **Manual Merchant Cancellation**: SubTrack cannot log into merchants or click cancel on external sites on your behalf.

### Future Roadmap
- Optional end-to-end encrypted cloud synchronization across multiple devices.
- Automated email reminder digests sent prior to renewals.
- Native mobile application wrappers via Capacitor / React Native.
- Expanded world currency database (150+ ISO currencies).
