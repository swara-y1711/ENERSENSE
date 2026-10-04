'use client';

import React, { useState } from 'react';
import { PeakDemandChallenge } from '../../data/occupantData';

interface PeakDemandBannerProps {
  challenge: PeakDemandChallenge;
  onScheduleEV: () => void;
  onSnooze: () => void;
}

export default function PeakDemandBanner({
  challenge,
  onScheduleEV,
  onSnooze,
}: PeakDemandBannerProps) {
  const [scheduled, setScheduled] = useState(false);
  const [snoozed, setSnoozed] = useState(false);

  const handleEvClick = () => {
    setScheduled(true);
    onScheduleEV();
  };

  const handleSnoozeClick = () => {
    setSnoozed(true);
    onSnooze();
  };

  return (
    <section className="py-1 mb-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-tertiary-container via-tertiary to-on-surface text-on-tertiary shadow-lg p-4 sm:p-6 lg:p-7 flex flex-col gap-4 border border-tertiary-fixed-dim/20">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-surface-container-lowest/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-bold shadow-sm">
            <span className="material-symbols-outlined text-[16px] animate-pulse">
              crisis_alert
            </span>
            Peak Demand Window Ahead
          </div>
          <span className="font-label-md text-label-md text-tertiary-fixed-dim bg-on-surface/40 px-3 py-0.5 rounded-full backdrop-blur-md">
            {challenge.timeWindow}
          </span>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
          <div className="lg:col-span-2 flex flex-col gap-1.5">
            <h3 className="font-headline-sm text-headline-sm md:text-headline-md font-bold text-on-tertiary leading-tight">
              {challenge.title}
            </h3>
            <p className="font-body-md text-body-sm sm:text-body-md text-on-tertiary/90">
              The campus grid projects elevated demand during peak hours. Consider shifting non-essential flexible loads outside peak hours to relieve grid stress.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-surface-container-lowest/15 backdrop-blur-md border border-white/10">
            <div>
              <span className="font-label-sm text-label-sm text-tertiary-fixed block">
                Potential Shift
              </span>
              <span className="font-headline-sm text-headline-sm font-bold text-on-tertiary">
                {challenge.rebateText}
              </span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm text-tertiary-fixed block">
                Grid Stress Mitigation
              </span>
              <span className="font-headline-sm text-headline-sm font-bold text-primary-fixed-dim">
                {challenge.gridRelief}
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <button
            className={`min-h-[44px] flex-1 py-2.5 px-4 rounded-xl font-headline-sm text-body-md font-semibold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
              scheduled
                ? 'bg-surface-container-high text-primary font-bold'
                : 'bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim active:scale-95'
            }`}
            onClick={handleEvClick}
          >
            <span className="material-symbols-outlined text-[19px]">
              {scheduled ? 'check_circle' : 'bolt'}
            </span>
            <span>
              {scheduled
                ? '✓ Noted · Shift Scheduled Outside Peak'
                : challenge.evActionLabel}
            </span>
          </button>

          <button
            disabled={snoozed}
            className={`min-h-[44px] sm:w-auto py-2.5 px-4 rounded-xl bg-surface-container-lowest/20 hover:bg-surface-container-lowest/30 text-on-tertiary font-body-sm font-medium transition-all text-center cursor-pointer ${
              snoozed ? 'opacity-50 pointer-events-none' : ''
            }`}
            onClick={handleSnoozeClick}
          >
            {snoozed ? 'Snoozed for 1 hr' : 'Snooze (1h)'}
          </button>
        </div>
      </div>
    </section>
  );
}
