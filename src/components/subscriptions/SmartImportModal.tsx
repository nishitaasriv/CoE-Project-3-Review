import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { smartImportSubscription, SmartImportResult } from '../../lib/gemini';
import { Sparkles, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { CurrencySelect } from '../currency/CurrencySelect';
import { CATEGORIES } from '../../data/categories';
import { BillingCycle, Category } from '../../types/subscription';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SmartImportResult) => void;
}

export const SmartImportModal: React.FC<SmartImportModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewedData, setReviewedData] = useState<SmartImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleSMS = `Dear Customer, INR 649.00 was spent on your HDFC Bank Card ending 8219 towards NETFLIX on 28-OCT-26. Next auto-debit on 28-NOV-26.`;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      const base64 = result.split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRunExtract = async () => {
    if (!pasteText.trim() && !imageBase64) {
      setErrorMsg('Please paste a receipt/SMS text or upload a screenshot.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const extracted = await smartImportSubscription(pasteText, imageBase64);
      setReviewedData(extracted);
    } catch (err: any) {
      setErrorMsg('Could not parse subscription details. Please review manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalSubmit = () => {
    if (reviewedData) {
      onSave(reviewedData);
      onClose();
      // Reset
      setPasteText('');
      setImageBase64(undefined);
      setImagePreview(null);
      setReviewedData(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Smart Import"
      description="Paste a bank SMS, email invoice, or statement snippet to auto-detect details."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {!reviewedData ? (
          <>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#9AA6D6]">
                  Paste SMS / Receipt Text
                </label>
                <button
                  type="button"
                  onClick={() => setPasteText(sampleSMS)}
                  className="text-xs text-[#60A5FA] hover:underline cursor-pointer"
                >
                  Load Sample SMS
                </button>
              </div>
              <textarea
                rows={4}
                placeholder="Paste message (e.g. 'Rs 119 debited for Spotify Premium on 25-Oct-2026...')"
                value={pasteText}
                onChange={(e) => {
                  setPasteText(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border border-[#26336B] text-sm text-[#F4F6FF] placeholder-[#9AA6D6] focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            {/* Optional Screenshot Upload */}
            <div className="border border-dashed border-[#26336B] rounded-xl p-4 text-center bg-[#18234F]/30">
              <input
                type="file"
                accept="image/*"
                id="receiptScreenshot"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="receiptScreenshot"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="w-6 h-6 text-[#60A5FA] mb-1.5" />
                <span className="text-xs font-semibold text-[#F4F6FF]">
                  {imagePreview ? 'Replace Screenshot' : 'Upload Screenshot (Optional)'}
                </span>
                <span className="text-[11px] text-[#9AA6D6] mt-0.5">
                  PNG, JPG or JPEG from banking app or email
                </span>
              </label>

              {imagePreview && (
                <div className="mt-3 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Receipt preview"
                    className="max-h-28 rounded-lg border border-[#26336B] mx-auto"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageBase64(undefined);
                    }}
                    className="absolute -top-2 -right-2 bg-[#EC4899] text-white rounded-full p-1 text-[10px] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {errorMsg && (
              <p className="text-xs text-[#F472B6] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="brand"
                isLoading={isProcessing}
                leftIcon={<Sparkles className="w-4 h-4" />}
                onClick={handleRunExtract}
              >
                Auto-Extract Details
              </Button>
            </div>
          </>
        ) : (
          /* Review Step */
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[#2563EB]/15 border border-[#3B82F6]/40 flex items-center gap-2 text-xs text-[#60A5FA]">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#3B82F6]" />
              <span>Details detected! Review before saving to your subscriptions.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#9AA6D6] mb-1">Service Name</label>
                <input
                  type="text"
                  value={reviewedData.name}
                  onChange={(e) =>
                    setReviewedData({ ...reviewedData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#9AA6D6] mb-1">Category</label>
                <select
                  value={reviewedData.category}
                  onChange={(e) =>
                    setReviewedData({
                      ...reviewedData,
                      category: e.target.value as Category,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#111A40]">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#9AA6D6] mb-1">Price</label>
                <input
                  type="number"
                  value={reviewedData.price}
                  onChange={(e) =>
                    setReviewedData({
                      ...reviewedData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-[#9AA6D6] mb-1">Currency</label>
                <CurrencySelect
                  value={reviewedData.currency}
                  onChange={(c) => setReviewedData({ ...reviewedData, currency: c })}
                />
              </div>

              <div>
                <label className="block text-xs text-[#9AA6D6] mb-1">Cycle</label>
                <select
                  value={reviewedData.billingCycle}
                  onChange={(e) =>
                    setReviewedData({
                      ...reviewedData,
                      billingCycle: e.target.value as BillingCycle,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF]"
                >
                  <option value="Weekly" className="bg-[#111A40]">Weekly</option>
                  <option value="Monthly" className="bg-[#111A40]">Monthly</option>
                  <option value="Quarterly" className="bg-[#111A40]">Quarterly</option>
                  <option value="Yearly" className="bg-[#111A40]">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#9AA6D6] mb-1">Renewal Date</label>
                <input
                  type="date"
                  value={
                    reviewedData.nextRenewalDate ||
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split('T')[0]
                  }
                  onChange={(e) =>
                    setReviewedData({
                      ...reviewedData,
                      nextRenewalDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-between gap-2 border-t border-[#26336B]/60">
              <Button variant="ghost" onClick={() => setReviewedData(null)}>
                Back to Edit Text
              </Button>
              <Button variant="primary" onClick={handleFinalSubmit}>
                Confirm & Add to Tracker
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
