import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BillingCycle, Category, Subscription } from '../../types/subscription';
import { PROVIDER_REGISTRY, Provider } from '../../data/providers';
import { CATEGORIES } from '../../data/categories';
import { CurrencySelect } from '../currency/CurrencySelect';
import { Button } from '../ui/Button';
import { useSettings } from '../../hooks/useSettings';
import {
  Search,
  ExternalLink,
  Mic,
  MicOff,
  AlertCircle,
  ShieldCheck,
  Users,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface SubscriptionFormProps {
  initialValues?: Partial<Subscription>;
  onSubmit: (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => void;
  isEditing?: boolean;
}

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  initialValues,
  onSubmit,
  isEditing = false,
}) => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  // Provider picker search
  const [providerSearch, setProviderSearch] = useState('');
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('custom');

  // Form Fields
  const [name, setName] = useState(initialValues?.name || '');
  const [category, setCategory] = useState<Category>(initialValues?.category || 'Entertainment');
  const [price, setPrice] = useState<string>(initialValues?.price ? String(initialValues.price) : '');
  const [currency, setCurrency] = useState<string>(initialValues?.currency || settings.baseCurrency || 'INR');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialValues?.billingCycle || 'Monthly');
  const [startDate, setStartDate] = useState(
    initialValues?.startDate || new Date().toISOString().split('T')[0]
  );
  const [nextRenewalDate, setNextRenewalDate] = useState(
    initialValues?.nextRenewalDate ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isFreeTrial, setIsFreeTrial] = useState(initialValues?.isFreeTrial || false);
  const [trialEndDate, setTrialEndDate] = useState(
    initialValues?.trialEndDate ||
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [cancellationUrl, setCancellationUrl] = useState(initialValues?.cancellationUrl || '');
  const [notes, setNotes] = useState(initialValues?.notes || '');
  const [reminderDaysBefore, setReminderDaysBefore] = useState(
    initialValues?.reminderDaysBefore || (billingCycle === 'Yearly' ? 7 : 2)
  );
  const [splitCount, setSplitCount] = useState<number>(initialValues?.splitCount || 1);
  const [isSeasonal, setIsSeasonal] = useState(initialValues?.isSeasonal || false);
  const [resubscribeDate, setResubscribeDate] = useState(initialValues?.resubscribeDate || '');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Update default reminder timing when billing cycle changes
  useEffect(() => {
    if (!initialValues?.reminderDaysBefore) {
      setReminderDaysBefore(billingCycle === 'Yearly' ? 7 : 2);
    }
  }, [billingCycle, initialValues]);

  // Provider filtering
  const filteredProviders = PROVIDER_REGISTRY.filter((p) => {
    const q = providerSearch.toLowerCase().trim();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const popularInIndiaProviders = filteredProviders.filter((p) => p.popularInIndia);
  const otherProviders = filteredProviders.filter((p) => !p.popularInIndia);

  const handleSelectProvider = (p: Provider | 'custom') => {
    if (p === 'custom') {
      setSelectedProviderId('custom');
      setShowProviderDropdown(false);
      return;
    }

    setSelectedProviderId(p.id);
    setName(p.name);
    setCategory(p.category);
    if (p.commonCycles && p.commonCycles.length > 0) {
      setBillingCycle(p.commonCycles[0]);
    }
    if (p.cancellationUrl) {
      setCancellationUrl(p.cancellationUrl);
    } else {
      setCancellationUrl('');
    }
    setShowProviderDropdown(false);
    setProviderSearch('');
  };

  // Voice dictation using browser Web Speech API
  const handleVoiceQuickAdd = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice('Voice recognition is not supported in this browser. Please type details.');
      setTimeout(() => setVoiceNotice(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNotice('Listening... Say e.g. "Add Netflix, 649 rupees, monthly"');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceNotice(`Heard: "${transcript}"`);
        setIsListening(false);

        // Simple extraction from transcript
        const lower = transcript.toLowerCase();
        // Provider match
        for (const p of PROVIDER_REGISTRY) {
          if (lower.includes(p.name.toLowerCase())) {
            setName(p.name);
            setCategory(p.category);
            if (p.cancellationUrl) setCancellationUrl(p.cancellationUrl);
            break;
          }
        }
        // Price match
        const numMatch = transcript.match(/\b([0-9]+)\b/);
        if (numMatch) {
          setPrice(numMatch[1]);
        }
        // Cycle match
        if (lower.includes('annual') || lower.includes('year')) setBillingCycle('Yearly');
        else if (lower.includes('week')) setBillingCycle('Weekly');
        else if (lower.includes('month')) setBillingCycle('Monthly');
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceNotice('Voice input was not captured. Please try speaking again.');
        setTimeout(() => setVoiceNotice(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceNotice('Voice recognition could not be initialized.');
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = 'Subscription name is required.';
    const numPrice = parseFloat(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      errs.price = 'Price must be a positive number greater than 0.';
    }

    if (!startDate) errs.startDate = 'Start date is required.';
    if (!nextRenewalDate) errs.nextRenewalDate = 'Renewal date is required.';

    if (startDate && nextRenewalDate && nextRenewalDate < startDate) {
      errs.nextRenewalDate = 'Renewal date cannot be before the start date.';
    }

    if (isFreeTrial) {
      if (!trialEndDate) errs.trialEndDate = 'Trial end date is required.';
      if (startDate && trialEndDate && trialEndDate < startDate) {
        errs.trialEndDate = 'Trial end date cannot be before the start date.';
      }
    }

    if (cancellationUrl.trim()) {
      if (!cancellationUrl.startsWith('https://')) {
        errs.cancellationUrl = 'Cancellation URL must start with https://';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const numPrice = parseFloat(price);
    const existingHistory = initialValues?.priceHistory || [];

    // Construct priceHistory entry
    const priceHistory =
      existingHistory.length > 0
        ? existingHistory
        : [
            {
              id: 'ph_init',
              date: startDate,
              price: numPrice,
              currency,
              reason: 'Initial plan record',
            },
          ];

    onSubmit({
      name: name.trim(),
      category,
      price: numPrice,
      currency,
      billingCycle,
      startDate,
      nextRenewalDate,
      status: isFreeTrial ? 'trial' : 'active',
      isFreeTrial,
      trialEndDate: isFreeTrial ? trialEndDate : undefined,
      cancellationUrl: cancellationUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      reminderDaysBefore,
      splitCount: Math.max(1, splitCount),
      isSeasonal,
      resubscribeDate: isSeasonal ? resubscribeDate : undefined,
      priceHistory,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Voice Quick-Add Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#111A40] border border-[#26336B]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#18234F] text-[#3B82F6] border border-[#26336B]">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#F4F6FF]">Voice Quick-Add</p>
            <p className="text-[11px] text-[#9AA6D6]">
              {voiceNotice || 'Speak your subscription details to auto-fill.'}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant={isListening ? 'destructive' : 'secondary'}
          size="sm"
          leftIcon={isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          onClick={handleVoiceQuickAdd}
        >
          {isListening ? 'Listening...' : 'Tap to Speak'}
        </Button>
      </div>

      {/* Provider Selector Picker */}
      <div className="relative">
        <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
          Choose a Popular Service or Custom Provider
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProviderDropdown(!showProviderDropdown)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#18234F] border border-[#26336B] hover:border-[#3B82F6]/50 text-sm text-[#F4F6FF] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#7C3AED] to-[#3B82F6] flex items-center justify-center text-xs font-bold text-white">
                {name ? name.charAt(0).toUpperCase() : 'S'}
              </div>
              <span className="font-medium text-[#F4F6FF]">
                {selectedProviderId === 'custom'
                  ? 'Custom / Other Service'
                  : name || 'Choose a provider...'}
              </span>
            </div>
            <span className="text-xs text-[#60A5FA]">Change Provider ▼</span>
          </button>
        </div>

        {/* Dropdown with groups */}
        {showProviderDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#111A40] border border-[#26336B] rounded-2xl shadow-2xl z-40 overflow-hidden animate-fade-in">
            <div className="p-2 border-b border-[#26336B] bg-[#18234F]/40">
              <div className="relative">
                <Search className="w-4 h-4 text-[#60A5FA] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search provider (Netflix, Spotify, Cult.fit, Prime)..."
                  value={providerSearch}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#18234F] border border-[#26336B] rounded-xl text-[#F4F6FF] placeholder-[#9AA6D6] focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto p-1.5 divide-y divide-[#26336B]/40">
              {/* Custom option */}
              <div className="pb-1">
                <button
                  type="button"
                  onClick={() => handleSelectProvider('custom')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-[#60A5FA] hover:bg-[#18234F] font-semibold cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Custom / Other (Not listed)</span>
                </button>
              </div>

              {/* Popular in India */}
              {popularInIndiaProviders.length > 0 && (
                <div className="py-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-[#60A5FA] uppercase tracking-wider">
                    Popular in India
                  </div>
                  {popularInIndiaProviders.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProvider(p)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-[#18234F] text-[#F4F6FF] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-[#18234F] border border-[#26336B] flex items-center justify-center text-xs font-bold text-[#60A5FA]">
                          {p.avatarLetter}
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                      <span className="text-[11px] text-[#9AA6D6]">{p.category}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Other Providers */}
              {otherProviders.length > 0 && (
                <div className="pt-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-[#9AA6D6] uppercase tracking-wider">
                    Global Services
                  </div>
                  {otherProviders.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProvider(p)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-[#18234F] text-[#F4F6FF] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-[#18234F] border border-[#26336B] flex items-center justify-center text-xs font-bold text-[#9AA6D6]">
                          {p.avatarLetter}
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                      <span className="text-[11px] text-[#9AA6D6]">{p.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Form Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
            Subscription Name <span className="text-[#EC4899]">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Netflix Premium, Spotify Family"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border text-sm text-[#F4F6FF] placeholder-[#9AA6D6] focus:outline-none transition-colors ${
              errors.name
                ? 'border-[#EC4899] text-[#F472B6]'
                : 'border-[#26336B] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30'
            }`}
          />
          {errors.name && (
            <p className="text-xs text-[#F472B6] mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
            Category <span className="text-[#EC4899]">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border border-[#26336B] text-sm text-[#F4F6FF] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30 cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-[#111A40] text-[#F4F6FF]">
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price & Currency */}
        <div>
          <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
            Plan Price <span className="text-[#EC4899]">*</span>
          </label>
          <div className="flex gap-2">
            <div className="w-36 shrink-0">
              <CurrencySelect value={currency} onChange={(code) => setCurrency(code)} />
            </div>
            <div className="flex-1">
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="e.g. 649"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border text-sm text-[#F4F6FF] placeholder-[#9AA6D6] focus:outline-none font-mono transition-colors ${
                  errors.price
                    ? 'border-[#EC4899] text-[#F472B6]'
                    : 'border-[#26336B] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30'
                }`}
              />
            </div>
          </div>
          {errors.price && (
            <p className="text-xs text-[#F472B6] mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.price}</span>
            </p>
          )}
        </div>

        {/* Billing Cycle */}
        <div>
          <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">Billing Cycle</label>
          <select
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border border-[#26336B] text-sm text-[#F4F6FF] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30 cursor-pointer"
          >
            <option value="Weekly" className="bg-[#111A40]">Weekly</option>
            <option value="Monthly" className="bg-[#111A40]">Monthly</option>
            <option value="Quarterly" className="bg-[#111A40]">Quarterly</option>
            <option value="Yearly" className="bg-[#111A40]">Yearly</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
            Start / Signup Date <span className="text-[#EC4899]">*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: '' }));
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border border-[#26336B] text-sm text-[#F4F6FF] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30 font-mono"
          />
        </div>

        {/* Next Renewal Date */}
        <div>
          <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
            Next Renewal Date <span className="text-[#EC4899]">*</span>
          </label>
          <input
            type="date"
            value={nextRenewalDate}
            onChange={(e) => {
              setNextRenewalDate(e.target.value);
              if (errors.nextRenewalDate) setErrors((prev) => ({ ...prev, nextRenewalDate: '' }));
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border text-sm text-[#F4F6FF] focus:outline-none font-mono transition-colors ${
              errors.nextRenewalDate
                ? 'border-[#EC4899] text-[#F472B6]'
                : 'border-[#26336B] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30'
            }`}
          />
          {errors.nextRenewalDate && (
            <p className="text-xs text-[#F472B6] mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.nextRenewalDate}</span>
            </p>
          )}
        </div>
      </div>

      {/* Free Trial Toggle & Trial Guard */}
      <div className="p-4 rounded-2xl bg-[#111A40] border border-[#26336B] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isFreeTrial"
              checked={isFreeTrial}
              onChange={(e) => setIsFreeTrial(e.target.checked)}
              className="w-4 h-4 rounded border-[#26336B] bg-[#18234F] text-[#3B82F6] focus:ring-[#3B82F6] focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="isFreeTrial" className="text-sm font-semibold text-[#F4F6FF] cursor-pointer">
              This is a Free Trial
            </label>
          </div>
          {isFreeTrial && (
            <span className="text-xs text-[#F472B6] font-medium bg-[#EC4899]/15 px-2.5 py-1 rounded-full border border-[#EC4899]/40">
              Trial Guard Enabled
            </span>
          )}
        </div>

        {isFreeTrial && (
          <div className="pt-2 border-t border-[#26336B]/60 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
                Trial End / Expiration Date <span className="text-[#EC4899]">*</span>
              </label>
              <input
                type="date"
                value={trialEndDate}
                onChange={(e) => setTrialEndDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border text-sm text-[#F4F6FF] font-mono focus:outline-none ${
                  errors.trialEndDate ? 'border-[#EC4899]' : 'border-[#26336B] focus:border-[#3B82F6]'
                }`}
              />
              {errors.trialEndDate && (
                <p className="text-xs text-[#F472B6] mt-1">{errors.trialEndDate}</p>
              )}
            </div>
            <div className="flex items-center text-xs text-[#9AA6D6] bg-[#18234F]/50 p-3 rounded-xl border border-[#26336B]">
              <ShieldCheck className="w-5 h-5 text-[#3B82F6] shrink-0 mr-2" />
              <span>
                Trial Guard will automatically alert you 2 days before, 1 day before, and the morning the trial ends.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Settings Accordion: Reminder days, Family Split, Seasonal */}
      <div className="p-4 rounded-2xl bg-[#111A40] border border-[#26336B] space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#60A5FA]">
          Smart Reminder & Cost Sharing
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Reminder Timing */}
          <div>
            <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
              Reminder Timing
            </label>
            <select
              value={reminderDaysBefore}
              onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value={1} className="bg-[#111A40]">1 day before renewal</option>
              <option value={2} className="bg-[#111A40]">2 days before renewal</option>
              <option value={3} className="bg-[#111A40]">3 days before renewal</option>
              <option value={7} className="bg-[#111A40]">7 days before (Default for Yearly)</option>
              <option value={14} className="bg-[#111A40]">14 days before renewal</option>
            </select>
          </div>

          {/* Family / Shared plan split */}
          <div>
            <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
              Split Cost (People sharing)
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-[#9AA6D6] absolute left-3 top-2.5" />
              <input
                type="number"
                min="1"
                max="20"
                value={splitCount}
                onChange={(e) => setSplitCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] font-mono focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
            {splitCount > 1 && price && (
              <p className="text-[11px] text-[#60A5FA] mt-1">
                Your share: {(parseFloat(price) / splitCount).toFixed(2)} {currency}
              </p>
            )}
          </div>

          {/* Seasonal Mode Toggle */}
          <div>
            <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
              Seasonal Subscription?
            </label>
            <div className="flex items-center gap-2 pt-1.5">
              <input
                type="checkbox"
                id="isSeasonal"
                checked={isSeasonal}
                onChange={(e) => setIsSeasonal(e.target.checked)}
                className="w-4 h-4 rounded border-[#26336B] bg-[#18234F] text-[#3B82F6] cursor-pointer"
              />
              <label htmlFor="isSeasonal" className="text-xs text-[#F4F6FF] cursor-pointer">
                Pause/Cancel between seasons
              </label>
            </div>
          </div>
        </div>

        {isSeasonal && (
          <div className="pt-2 border-t border-[#26336B]/60">
            <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
              Remind me to resubscribe on date
            </label>
            <input
              type="date"
              value={resubscribeDate}
              onChange={(e) => setResubscribeDate(e.target.value)}
              className="w-full md:w-64 px-3.5 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] font-mono focus:outline-none focus:border-[#3B82F6]"
            />
          </div>
        )}
      </div>

      {/* Cancellation URL & Notes */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-[#9AA6D6]">
              Direct Cancellation Page URL (Optional)
            </label>
            <span className="text-[11px] text-[#9AA6D6]">
              Verify on the provider's official site
            </span>
          </div>
          <div className="relative">
            <input
              type="url"
              placeholder="https://provider.com/account/cancel"
              value={cancellationUrl}
              onChange={(e) => {
                setCancellationUrl(e.target.value);
                if (errors.cancellationUrl) setErrors((prev) => ({ ...prev, cancellationUrl: '' }));
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border text-sm text-[#F4F6FF] placeholder-[#9AA6D6] focus:outline-none font-mono text-xs ${
                errors.cancellationUrl
                  ? 'border-[#EC4899] text-[#F472B6]'
                  : 'border-[#26336B] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30'
              }`}
            />
          </div>
          {errors.cancellationUrl && (
            <p className="text-xs text-[#F472B6] mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.cancellationUrl}</span>
            </p>
          )}
          {!cancellationUrl && selectedProviderId !== 'custom' && (
            <p className="text-[11px] text-[#9AA6D6] mt-1.5 flex items-center gap-1">
              <span>Notice: Add the official cancellation page for this service.</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">
            Notes / Payment Method / UPI Mandate
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Billed on HDFC credit card. Revoke mandate if cancelling."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-sm text-[#F4F6FF] placeholder-[#9AA6D6] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#26336B]">
        <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" size="md">
          {isEditing ? 'Save Changes' : 'Add to SubTrack'}
        </Button>
      </div>
    </form>
  );
};
