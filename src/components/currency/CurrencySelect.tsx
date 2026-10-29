import React, { useState, useRef, useEffect } from 'react';
import { CURRENCY_REGISTRY } from '../../data/currencies';
import { CurrencyInfo } from '../../types/currency';
import { ChevronDown, Search, Check } from 'lucide-react';

interface CurrencySelectProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCurrency =
    CURRENCY_REGISTRY.find((c) => c.code === (value || 'INR').toUpperCase()) ||
    CURRENCY_REGISTRY[0];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Organize currencies:
  // 1. Mandatory INR on top
  // 2. Popular group (USD, EUR, GBP, JPY)
  // 3. Rest alphabetically
  const filterText = search.toLowerCase().trim();
  const filtered = CURRENCY_REGISTRY.filter((c) => {
    if (!filterText) return true;
    return (
      c.code.toLowerCase().includes(filterText) ||
      c.name.toLowerCase().includes(filterText) ||
      c.region.toLowerCase().includes(filterText) ||
      c.symbol.toLowerCase().includes(filterText)
    );
  });

  const inrItem = filtered.find((c) => c.code === 'INR');
  const popularItems = filtered.filter((c) => c.code !== 'INR' && c.isPopular);
  const otherItems = filtered
    .filter((c) => c.code !== 'INR' && !c.isPopular)
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-medium text-[#9AA6D6] mb-1.5">{label}</label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#18234F] border border-[#26336B] hover:border-[#3B82F6]/50 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/30 text-sm text-[#F4F6FF] transition-all cursor-pointer disabled:opacity-50"
      >
        <div className="flex items-center gap-2.5 truncate">
          <span className="text-base">{selectedCurrency.flag}</span>
          <span className="font-semibold text-[#F4F6FF]">{selectedCurrency.code}</span>
          <span className="text-[#9AA6D6] font-mono">({selectedCurrency.symbol})</span>
          <span className="text-xs text-[#9AA6D6] truncate hidden sm:inline">
            — {selectedCurrency.name}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-[#9AA6D6] shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full min-w-[280px] z-50 bg-[#111A40] border border-[#26336B] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="p-2 border-b border-[#26336B] bg-[#18234F]/40">
            <div className="relative">
              <Search className="w-4 h-4 text-[#60A5FA] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by code, country, or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#18234F] border border-[#26336B] rounded-xl text-[#F4F6FF] placeholder-[#9AA6D6] focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1.5 divide-y divide-[#26336B]/40">
            {/* Mandatory default INR */}
            {inrItem && (
              <div className="pb-1.5">
                <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-[#60A5FA]">
                  Default & Mandatory
                </div>
                <CurrencyRow item={inrItem} isSelected={selectedCurrency.code === inrItem.code} onSelect={handleSelect} />
              </div>
            )}

            {/* Popular Currencies */}
            {popularItems.length > 0 && (
              <div className="py-1.5">
                <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-[#9AA6D6]">
                  Popular Currencies
                </div>
                {popularItems.map((item) => (
                  <CurrencyRow
                    key={item.code}
                    item={item}
                    isSelected={selectedCurrency.code === item.code}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}

            {/* Other Currencies */}
            {otherItems.length > 0 && (
              <div className="pt-1.5">
                <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-[#9AA6D6]">
                  Other Currencies
                </div>
                {otherItems.map((item) => (
                  <CurrencyRow
                    key={item.code}
                    item={item}
                    isSelected={selectedCurrency.code === item.code}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="p-4 text-center text-xs text-[#9AA6D6]">
                No matching currencies found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface CurrencyRowProps {
  item: CurrencyInfo;
  isSelected: boolean;
  onSelect: (code: string) => void;
}

const CurrencyRow: React.FC<CurrencyRowProps> = ({ item, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.code)}
      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
        isSelected ? 'bg-[#2563EB]/20 text-[#F4F6FF]' : 'hover:bg-[#18234F] text-[#F4F6FF]'
      }`}
    >
      <div className="flex items-center gap-2.5 truncate">
        <span className="text-sm">{item.flag}</span>
        <span className="font-semibold text-[#F4F6FF]">{item.code}</span>
        <span className="text-[#9AA6D6] font-mono">({item.symbol})</span>
        <span className="text-[#9AA6D6] truncate">{item.name}</span>
      </div>
      {isSelected && <Check className="w-4 h-4 text-[#3B82F6] shrink-0" />}
    </button>
  );
};
