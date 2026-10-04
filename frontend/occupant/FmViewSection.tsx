'use client';

import React from 'react';

interface FmViewSectionProps {
  showToast: (msg: string, type?: 'info' | 'success') => void;
  onSwitchBack: () => void;
}

export default function FmViewSection({ showToast, onSwitchBack }: FmViewSectionProps) {
  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-28 md:pb-16">
      <section className="py-4 flex flex-col gap-4">
        {/* Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-surface-container-low border border-surface-container-high">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[24px]">domain</span>
            </div>
            <div>
              <span className="font-headline-sm text-headline-sm text-on-surface block font-bold">
                Facility Operations Control
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Campus Grid &amp; HVAC Manager · Block B
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm font-semibold">
              Live Control Active
            </span>
            <button
              className="min-h-[44px] px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm font-medium transition-all cursor-pointer"
              onClick={onSwitchBack}
            >
              Back to Occupant View
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-secondary">
              <span className="material-symbols-outlined text-[22px]">grid_view</span>
              <span className="font-label-sm font-semibold uppercase px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">
                Zone 4
              </span>
            </div>
            <div className="mt-3">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider block">
                Avg Floor Temp
              </span>
              <span className="font-metric-display text-metric-display text-on-surface">
                23.9°C
              </span>
              <p className="font-body-sm text-primary font-medium mt-0.5">
                98% Pod Comfort Satisfied
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-tertiary">
              <span className="material-symbols-outlined text-[22px]">electric_meter</span>
              <span className="font-label-sm font-semibold uppercase px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
                Peak Save
              </span>
            </div>
            <div className="mt-3">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider block">
                Demand Shed Capacity
              </span>
              <span className="font-metric-display text-metric-display text-on-surface">
                42 <span className="font-body-sm font-normal text-on-surface-variant">kW</span>
              </span>
              <p className="font-body-sm text-tertiary font-medium mt-0.5">
                DR Event armed for 6:00 PM
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-primary">
              <span className="material-symbols-outlined text-[22px]">air</span>
              <span className="font-label-sm font-semibold uppercase px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed">
                Air Quality
              </span>
            </div>
            <div className="mt-3">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider block">
                CO₂ Concentration
              </span>
              <span className="font-metric-display text-metric-display text-on-surface">
                540 <span className="font-body-sm font-normal text-on-surface-variant">ppm</span>
              </span>
              <p className="font-body-sm text-primary font-medium mt-0.5">
                Optimal Fresh Air Flow
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-secondary">
              <span className="material-symbols-outlined text-[22px]">solar_power</span>
              <span className="font-label-sm font-semibold uppercase px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">
                Solar Array
              </span>
            </div>
            <div className="mt-3">
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider block">
                Rooftop Generation
              </span>
              <span className="font-metric-display text-metric-display text-on-surface">
                118 <span className="font-body-sm font-normal text-on-surface-variant">kW</span>
              </span>
              <p className="font-body-sm text-secondary font-medium mt-0.5">
                Supplying 64% Campus Load
              </p>
            </div>
          </div>
        </div>

        {/* Automation Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-headline-sm text-body-lg font-semibold text-on-surface">
              Automated Grid Shedding Automation
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed-dim/30 text-primary font-label-sm font-semibold">
              Engaged
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Occupant pods shifted setpoint +0.5°C dynamically. 64 workstation monitors sleeping automatically upon desk departure.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="min-h-[44px] py-2 px-4 rounded-lg bg-secondary text-on-secondary font-label-sm font-semibold hover:bg-secondary-container transition-all flex items-center justify-center gap-2 cursor-pointer"
              onClick={() => showToast('VAV Recalibration Sent: Zone 4 diffusers adjusted to 24.0°C baseline.', 'info')}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>Recalibrate Floor VAVs</span>
            </button>
            <button
              className="min-h-[44px] py-2 px-4 rounded-lg bg-tertiary text-on-tertiary font-label-sm font-semibold hover:bg-tertiary-container transition-all flex items-center justify-center gap-2 cursor-pointer"
              onClick={() => showToast('Shed Event Dispatched: Peak-time reduction commands armed for Block B.', 'success')}
            >
              <span className="material-symbols-outlined text-[18px]">offline_bolt</span>
              <span>Simulate 6 PM Demand Shed</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
