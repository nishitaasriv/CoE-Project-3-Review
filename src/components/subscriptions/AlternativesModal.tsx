import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Subscription } from '../../types/subscription';
import { Sparkles, DollarSign, Users, Award, ExternalLink } from 'lucide-react';

interface AlternativesModalProps {
  subscription: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AlternativesModal: React.FC<AlternativesModalProps> = ({
  subscription,
  isOpen,
  onClose,
}) => {
  if (!subscription) return null;

  const category = subscription.category;

  const tips: { title: string; desc: string; icon: React.ReactNode }[] = [
    {
      title: 'Annual Billing Discount',
      desc: 'Most platforms offer 15% to 25% discount when switching from monthly to annual pre-paid cycles.',
      icon: <DollarSign className="w-4 h-4 text-[#3B82F6]" />,
    },
    {
      title: 'Family or Duo Tier',
      desc: 'Splitting an account with friends or family members typically cuts per-person expense by 50% or more.',
      icon: <Users className="w-4 h-4 text-[#8B5CF6]" />,
    },
    {
      title: 'Student or Bundle Perks',
      desc: 'Look for institutional student pricing or multi-service bundles (e.g. telecom plans bundling streaming).',
      icon: <Award className="w-4 h-4 text-[#60A5FA]" />,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Savings Tips & Alternatives"
      description={`Cost reduction strategies for ${subscription.name}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-[#2563EB]/10 border border-[#3B82F6]/30 text-xs text-[#60A5FA] flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-[#3B82F6]" />
          <span>Suggestions to review on the provider's official pricing page.</span>
        </div>

        <div className="space-y-2.5">
          {tips.map((tip, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#18234F] border border-[#26336B] flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-[#111A40] border border-[#26336B] shrink-0">
                {tip.icon}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#F4F6FF]">{tip.title}</h4>
                <p className="text-xs text-[#9AA6D6] mt-0.5 leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {subscription.cancellationUrl && (
          <div className="pt-2">
            <a
              href={subscription.cancellationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#18234F] border border-[#26336B] text-xs font-medium text-[#60A5FA] hover:text-[#93C5FD]"
            >
              <span>Check plans on provider site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Dismiss
          </Button>
        </div>
      </div>
    </Modal>
  );
};
