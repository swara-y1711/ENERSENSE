'use client';

import React from 'react';
import Link from 'next/link';

interface OccupantMobileNavProps {
  activeRole: 'Occupant' | 'FM';
  onToggleRole: (role: 'Occupant' | 'FM') => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export default function OccupantMobileNav({
  activeRole,
  onToggleRole,
  activeTab,
  onSelectTab,
}: OccupantMobileNavProps) {
  const tabs = [
    { id: 'comfort', label: 'Comfort', icon: 'thermostat' },
    { id: 'shift', label: 'Shift & Save', icon: 'bolt' },
    { id: 'impact', label: 'Impact', icon: 'eco' },
    { id: 'grid', label: 'Grid', icon: 'grid_view' },
  ];

  return (
    <>
      {/* Mobile Floating Role Switcher Banner */}
      <div className="md:hidden fixed bottom-20 left-4 right-4 z-40 flex items-center justify-between p-1.5 rounded-full bg-surface-container-highest/95 backdrop-blur-xl shadow-xl border border-surface-container-high/70">
        <div className="flex items-center gap-1.5 pl-3">
          <span className="material-symbols-outlined text-primary text-[18px]">
            published_with_changes
          </span>
          <span className="font-label-sm text-label-sm font-semibold text-on-surface">
            Mode
          </span>
        </div>

        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-full">
          <button
            className={`px-3 py-1 rounded-full text-label-sm font-label-sm flex items-center gap-1 cursor-pointer transition-all ${
              activeRole === 'Occupant'
                ? 'font-semibold bg-surface-container-lowest text-primary shadow-sm'
                : 'font-medium text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => onToggleRole('Occupant')}
          >
            <span className="material-symbols-outlined text-[14px]">person</span>
            <span>Occupant</span>
          </button>

          <Link
            href="/"
            className={`px-3 py-1 rounded-full text-label-sm font-label-sm flex items-center gap-1 cursor-pointer transition-all ${
              activeRole === 'FM'
                ? 'font-semibold bg-surface-container-lowest text-secondary shadow-sm'
                : 'font-medium text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">domain</span>
            <span>FM View</span>
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl border-t border-surface-container-high/60 shadow-[0_-2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] transition-colors ${
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {tab.icon}
                </span>
                <span className="font-label-sm text-label-sm mt-0.5">
                  {tab.label}
                </span>
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
