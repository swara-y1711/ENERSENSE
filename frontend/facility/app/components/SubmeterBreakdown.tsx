'use client';

import React from 'react';
import { SUBMETER_SUMMARIES } from '../data/facilityData';

interface SubmeterBreakdownProps {
  onOpenDrawer: () => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
  activeKw: number;
}

export default function SubmeterBreakdown({
  onOpenDrawer,
  showToast,
  activeKw,
}: SubmeterBreakdownProps) {
  return (
    <div className="lg:col-span-4 bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-xs border border-surface-container-high flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-on-surface">
              Submeter Breakdown
            </h3>
            <p className="text-xs text-outline">Real-time load split by subsystem</p>
          </div>
          <span className="px-2 py-0.5 bg-surface-container-high rounded text-xs font-mono font-bold">
            {activeKw} kW Total
          </span>
        </div>

        {/* Submeter Cards */}
        <div className="space-y-3">
          {SUBMETER_SUMMARIES.map((meter) => (
            <div
              key={meter.id}
              className="p-3 bg-surface-container-low hover:bg-surface-container rounded-xl cursor-pointer transition-all border border-transparent hover:border-primary/30"
              onClick={() => showToast(meter.toastMsg)}
            >
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="font-bold flex items-center gap-1.5 text-on-surface">
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      meter.id === 'hvac'
                        ? 'text-primary'
                        : meter.id === 'ev'
                        ? 'text-secondary'
                        : meter.id === 'water'
                        ? 'text-outline'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {meter.icon}
                  </span>
                  {meter.name}
                </span>
                <span className="font-mono font-bold">
                  {meter.kw} kW ({meter.pct}%)
                </span>
              </div>

              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full ${meter.colorClass}`}
                  style={{ width: `${meter.pct}%` }}
                ></div>
              </div>

              <div className="text-[11px] text-outline flex justify-between">
                <span className={meter.badgeColorClass}>{meter.shedLabel}</span>
                <span>{meter.protocol}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Button to open drawer */}
      <button
        className="w-full mt-4 py-2.5 bg-surface-container-high hover:bg-surface-container text-on-surface font-semibold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors min-h-[44px] cursor-pointer"
        onClick={onOpenDrawer}
      >
        <span>View All 32 Submeters</span>
        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
      </button>
    </div>
  );
}
