import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  LayoutDashboard,
  CreditCard,
  Ban,
  TrendingUp,
  Settings as SettingsIcon,
  Download,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface CommandPaletteProps {
  onOpenSmartImport?: () => void;
  onDownloadCalendar?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  onOpenSmartImport,
  onDownloadCalendar,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      category: 'Navigation',
      icon: <LayoutDashboard className="w-4 h-4 text-[#3B82F6]" />,
      run: () => navigate('/dashboard'),
    },
    {
      id: 'subscriptions',
      label: 'View My Subscriptions',
      category: 'Navigation',
      icon: <CreditCard className="w-4 h-4 text-[#3B82F6]" />,
      run: () => navigate('/subscriptions'),
    },
    {
      id: 'add',
      label: 'Add New Subscription',
      category: 'Actions',
      icon: <PlusCircle className="w-4 h-4 text-[#8B5CF6]" />,
      run: () => navigate('/add'),
    },
    {
      id: 'cancellation',
      label: 'Cancellation Assistant',
      category: 'Navigation',
      icon: <Ban className="w-4 h-4 text-[#F472B6]" />,
      run: () => navigate('/cancellation'),
    },
    {
      id: 'insights',
      label: 'Spending Insights & Overlaps',
      category: 'Navigation',
      icon: <TrendingUp className="w-4 h-4 text-[#3B82F6]" />,
      run: () => navigate('/insights'),
    },
    {
      id: 'settings',
      label: 'Open Settings',
      category: 'Navigation',
      icon: <SettingsIcon className="w-4 h-4 text-[#8B5CF6]" />,
      run: () => navigate('/settings'),
    },
    {
      id: 'smart-import',
      label: 'Smart Import (Paste Receipt or SMS)',
      category: 'Smart Features',
      icon: <Sparkles className="w-4 h-4 text-[#8B5CF6]" />,
      run: () => {
        if (onOpenSmartImport) onOpenSmartImport();
        else navigate('/add?tab=smart');
      },
    },
    {
      id: 'download-ics',
      label: 'Export Renewals to Calendar (.ics)',
      category: 'Actions',
      icon: <Calendar className="w-4 h-4 text-[#3B82F6]" />,
      run: () => {
        if (onDownloadCalendar) onDownloadCalendar();
      },
    },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-[#070B1F]/80 backdrop-blur-sm animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-[#111A40] border border-[#26336B] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#26336B] bg-[#18234F]/40">
          <Search className="w-5 h-5 text-[#60A5FA]" />
          <input
            type="text"
            placeholder="Type a command or search page (ESC to close)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none text-[#F4F6FF] placeholder-[#9AA6D6] text-sm focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-xs text-[#9AA6D6] bg-[#18234F] border border-[#26336B] rounded-md font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#9AA6D6]">
              No matching commands or pages found.
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.run();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left hover:bg-[#18234F] text-[#F4F6FF] group transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#18234F] group-hover:bg-[#202E66] border border-[#26336B]">
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className="text-xs text-[#9AA6D6] bg-[#18234F] px-2 py-0.5 rounded-md border border-[#26336B]/60">
                  {item.category}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-[#0B1130] border-t border-[#26336B] flex items-center justify-between text-xs text-[#9AA6D6]">
          <span>Tip: Press Ctrl+K (or ⌘K) anywhere to trigger</span>
          <span>Navigation</span>
        </div>
      </div>
    </div>
  );
};
