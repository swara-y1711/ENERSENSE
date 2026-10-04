'use client';

import React from 'react';
import Link from 'next/link';
import { OccupantProfile } from '../../data/occupantData';

interface OccupantHeaderProps {
  profile: OccupantProfile;
  activeRole: 'Occupant' | 'FM';
  onToggleRole: (role: 'Occupant' | 'FM') => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export default function OccupantHeader({
  profile,
  activeRole,
  onToggleRole,
  activeTab,
  onSelectTab,
}: OccupantHeaderProps) {
  const desktopNav = [
    { id: 'comfort', label: 'My Comfort', icon: 'thermostat' },
    { id: 'shift', label: 'Shift & Save', icon: 'bolt' },
    { id: 'impact', label: 'My Impact', icon: 'eco' },
    { id: 'grid', label: 'Building Grid', icon: 'grid_view' },
  ];

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl border-b border-surface-container-high/60 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 md:py-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Location */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-on-surface flex items-center justify-center text-primary font-bold text-base">
              ⚡
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm md:text-headline-md text-on-surface tracking-tight leading-none font-bold">
                ENER<span className="text-primary">SENSE</span>
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[13px] text-primary">
                  near_me
                </span>
                {profile.campus}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 px-2 py-1 rounded-full bg-surface-container-low border border-surface-container-high/50">
            {desktopNav.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <a
                  key={tab.id}
                  href={`#${tab.id}`}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-md font-label-md transition-all ${
                    isActive
                      ? 'font-semibold bg-surface-container-lowest text-primary shadow-sm'
                      : 'font-medium text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right Controls: Role Switcher & User Avatar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              aria-label="Role Switcher"
              className="flex items-center p-0.5 sm:p-1 rounded-full bg-surface-container border border-surface-container-high"
              role="group"
            >
              <button
                className={`px-2.5 sm:px-3 py-1 rounded-full text-label-sm font-label-sm transition-all flex items-center gap-1 cursor-pointer ${
                  activeRole === 'Occupant'
                    ? 'font-semibold bg-surface-container-lowest text-primary shadow-sm'
                    : 'font-medium text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => onToggleRole('Occupant')}
              >
                <span className="material-symbols-outlined text-[14px]">person</span>
                <span className="hidden sm:inline">Occupant</span>
              </button>

              <Link
                href="/"
                className={`px-2.5 sm:px-3 py-1 rounded-full text-label-sm font-label-sm transition-all flex items-center gap-1 cursor-pointer ${
                  activeRole === 'FM'
                    ? 'font-semibold bg-surface-container-lowest text-secondary shadow-sm'
                    : 'font-medium text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">domain</span>
                <span className="hidden sm:inline">FM View</span>
              </Link>
            </div>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary flex items-center justify-center text-on-primary ring-2 ring-primary/20">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>

        {/* Subheader Ticker Bar */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-container-high/40">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-tertiary font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[14px] text-tertiary">
              history
            </span>
            <span>Historical Replay • October 2016</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-primary uppercase font-semibold">
                Replay Mode
              </span>
            </div>
            <span className="hidden sm:inline text-on-surface-variant/40">|</span>
            <span className="hidden sm:inline font-label-sm text-label-sm text-on-surface-variant">
              Advisory Intelligence Layer
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
