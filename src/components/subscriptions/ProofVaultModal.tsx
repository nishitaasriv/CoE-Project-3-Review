import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Subscription } from '../../types/subscription';
import { ShieldCheck, Upload, FileCheck, Calendar } from 'lucide-react';
import { formatDate } from '../../lib/dates';

interface ProofVaultModalProps {
  subscription: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveProof: (
    id: string,
    proof: { referenceNumber?: string; note?: string; imageDataUri?: string }
  ) => void;
}

export const ProofVaultModal: React.FC<ProofVaultModalProps> = ({
  subscription,
  isOpen,
  onClose,
  onSaveProof,
}) => {
  if (!subscription) return null;

  const existing = subscription.proofOfCancellation;

  const [refNum, setRefNum] = useState(existing?.referenceNumber || '');
  const [note, setNote] = useState(existing?.note || '');
  const [imageUri, setImageUri] = useState<string | undefined>(existing?.imageDataUri);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageUri(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSaveProof(subscription.id, {
      referenceNumber: refNum.trim() || undefined,
      note: note.trim() || undefined,
      imageDataUri: imageUri,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Proof of Cancellation Vault"
      description={`Evidence & confirmation record for ${subscription.name}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#9AA6D6] space-y-1">
          <div className="flex items-center gap-1.5 text-[#60A5FA] font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
            <span>Dispute Protection</span>
          </div>
          <p>
            If the merchant erroneously bills you again, this confirmation code, screenshot, and
            timestamp serve as evidence for your bank's chargeback dispute.
          </p>
          {existing?.cancelledAt && (
            <p className="text-[11px] text-[#A78BFA] pt-1">
              Marked cancelled on: {formatDate(existing.cancelledAt.split('T')[0])}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9AA6D6] mb-1">
            Reference / Confirmation Number
          </label>
          <input
            type="text"
            placeholder="e.g. CANC-98214-X or Support Ticket ID"
            value={refNum}
            onChange={(e) => setRefNum(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] font-mono focus:outline-none focus:border-[#3B82F6]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9AA6D6] mb-1">
            Confirmation Notes & Chat Transcript
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Cancelled via live chat with agent Priya. Promised refund within 5 working days."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#F4F6FF] focus:outline-none focus:border-[#3B82F6]"
          />
        </div>

        {/* Screenshot Upload */}
        <div>
          <label className="block text-xs font-medium text-[#9AA6D6] mb-1">
            Attach Confirmation Screenshot
          </label>
          <div className="border border-dashed border-[#26336B] rounded-xl p-3 text-center bg-[#18234F]/30">
            <input
              type="file"
              accept="image/*"
              id="proofScreenshot"
              onChange={handleImage}
              className="hidden"
            />
            <label
              htmlFor="proofScreenshot"
              className="flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold text-[#60A5FA]"
            >
              <Upload className="w-4 h-4" />
              <span>{imageUri ? 'Replace Screenshot' : 'Upload Screenshot (PNG/JPG)'}</span>
            </label>

            {imageUri && (
              <div className="mt-2 relative inline-block">
                <img
                  src={imageUri}
                  alt="Proof screenshot"
                  className="max-h-36 rounded-lg border border-[#26336B] mx-auto"
                />
                <button
                  type="button"
                  onClick={() => setImageUri(undefined)}
                  className="absolute -top-2 -right-2 bg-[#EC4899] text-white rounded-full p-1 text-[10px] cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-[#26336B]/60">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save to Vault
          </Button>
        </div>
      </div>
    </Modal>
  );
};
