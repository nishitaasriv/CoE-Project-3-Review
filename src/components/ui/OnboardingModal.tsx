import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Bell, ShieldCheck, Ban, ArrowRight, Check } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onFinish: () => void;
  onLoadDemoData?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onFinish,
  onLoadDemoData,
}) => {
  const [step, setStep] = useState(1);

  const steps = [
    {
      step: 1,
      title: 'Timely Reminders & Trial Guard',
      desc: 'Never get charged by an accidental auto-renewal again. SubTrack calculates exact renewal dates, trial expirations, and notifies you days ahead.',
      icon: <Bell className="w-8 h-8 text-[#3B82F6]" />,
      pill: 'Never Forget',
    },
    {
      step: 2,
      title: 'Step-by-Step Cancellation Assistant',
      desc: 'Cancel with absolute confidence. Access direct cancellation links, navigate past retention tricks, and document proof with reference codes and screenshots.',
      icon: <Ban className="w-8 h-8 text-[#8B5CF6]" />,
      pill: 'Effortless Cancel',
    },
    {
      step: 3,
      title: 'Private, Local & Multi-Currency',
      desc: 'All your subscription data is stored securely right in this browser. View spending in your local base currency (₹ INR default) with automatic conversions.',
      icon: <ShieldCheck className="w-8 h-8 text-[#3B82F6]" />,
      pill: '100% Private',
    },
  ];

  const current = steps[step - 1];

  return (
    <Modal isOpen={isOpen} onClose={onFinish} title="" maxWidth="md">
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#2563EB]/15 text-[#60A5FA] border border-[#3B82F6]/30 mb-4">
          <span>Step {step} of 3</span>
          <span>•</span>
          <span>{current.pill}</span>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-[#18234F] border border-[#26336B] flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
          {current.icon}
        </div>

        <h3 className="text-xl font-bold text-[#F4F6FF] font-display mb-2">{current.title}</h3>
        <p className="text-sm text-[#9AA6D6] leading-relaxed mb-6">{current.desc}</p>

        {/* Step indicator dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-7 bg-gradient-to-r from-[#7C3AED] to-[#3B82F6]'
                  : 'w-2 bg-[#26336B]'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#26336B]/60">
          <Button variant="ghost" size="sm" onClick={onFinish}>
            Skip Walkthrough
          </Button>

          {step < 3 ? (
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setStep((s) => s + 1)}
            >
              Next Step
            </Button>
          ) : (
            <div className="flex gap-2">
              {onLoadDemoData && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onLoadDemoData();
                    onFinish();
                  }}
                >
                  Load Demo Data
                </Button>
              )}
              <Button
                variant="brand"
                size="sm"
                rightIcon={<Check className="w-4 h-4" />}
                onClick={onFinish}
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
