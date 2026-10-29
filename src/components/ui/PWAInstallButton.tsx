import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from './Button';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running standalone, suppress button
  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Download className="w-4 h-4" />}
        onClick={install}
      >
        Install App
      </Button>
    );
  }

  if (isIOS) {
    return (
      <>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Smartphone className="w-4 h-4" />}
          onClick={() => setShowIOSGuide(true)}
        >
          Install on iOS
        </Button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#070B1F]/80 backdrop-blur-sm p-4"
            role="dialog"
          >
            <div className="w-full max-w-sm rounded-2xl bg-[#111A40] border border-[#26336B] p-6 shadow-2xl relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-[#9AA6D6] hover:text-[#F4F6FF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-[#18234F] border border-[#26336B] flex items-center justify-center text-[#60A5FA] mb-4">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-semibold text-[#F4F6FF] font-display">
                Install SubTrack on iOS
              </h3>
              <ol className="mt-3 text-sm text-[#9AA6D6] space-y-2 list-decimal list-inside">
                <li>
                  Tap the <strong className="text-[#F4F6FF]">Share</strong> button at the bottom of Safari.
                </li>
                <li>
                  Scroll down the menu and tap{' '}
                  <strong className="text-[#60A5FA]">Add to Home Screen</strong>.
                </li>
                <li>
                  Confirm by tapping <strong className="text-[#F4F6FF]">Add</strong>.
                </li>
              </ol>

              <Button
                variant="primary"
                size="md"
                className="mt-6 w-full"
                onClick={() => setShowIOSGuide(false)}
              >
                Got it
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
