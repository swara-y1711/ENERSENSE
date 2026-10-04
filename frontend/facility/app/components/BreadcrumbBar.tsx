'use client';

import React from 'react';
import { BuildingOption } from '../data/facilityData';

interface BreadcrumbBarProps {
  activeBuilding: BuildingOption;
  timeframe: string;
  onSelectTimeframe: (tf: string, label: string) => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
  currentTimestamp?: string;
  mode?: string;
}

export default function BreadcrumbBar({
  activeBuilding,
  timeframe,
  onSelectTimeframe,
  showToast,
  currentTimestamp,
  mode = 'historical_backtest',
}: BreadcrumbBarProps) {
  const timeframes = [
    { id: 'live', label: 'Replay (15m)' },
    { id: 'yesterday', label: 'Oct 02' },
    { id: '7d', label: 'Week 1' },
    { id: 'custom', label: 'Full Month' },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-surface-container-lowest/60 p-3 rounded-xl border border-surface-container-high/60 sm:bg-transparent sm:p-0 sm:border-0">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-outline font-medium">
        <span>Facilities</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span>I-BLEND Academic Building</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="font-bold text-on-surface truncate">
          {activeBuilding.name}
        </span>
        <span
          className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-semibold cursor-pointer shrink-0 hover:bg-primary/20 transition-colors"
          onClick={() =>
            showToast('Operating mode: Historical backtest & replay from I-BLEND dataset (October 2016).', 'info')
          }
        >
          HISTORICAL REPLAY • OCT 2016
        </span>
        {currentTimestamp && (
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-surface-container text-outline font-mono text-[10px]">
            {currentTimestamp.replace('T', ' ').slice(0, 16)}
          </span>
        )}
      </div>

      {/* Controls: Timeframe Pills & Action Buttons */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
        <div className="flex bg-surface-container-low p-1 rounded-lg shrink-0">
          {timeframes.map((tf) => {
            const isActive = timeframe === tf.id;
            return (
              <button
                key={tf.id}
                className={`px-2.5 sm:px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'font-semibold bg-primary text-on-primary shadow-xs'
                    : 'font-medium text-outline hover:text-on-surface'
                }`}
                onClick={() => onSelectTimeframe(tf.id, tf.label)}
              >
                {tf.label}
              </button>
            );
          })}
        </div>

        <button
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-surface-container-lowest border border-surface-container-high hover:bg-surface-container-low rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          onClick={() => showToast('Generating telemetry audit report (PDF & CSV)...', 'success')}
        >
          <span className="material-symbols-outlined text-[16px] text-outline">
            download
          </span>
          <span className="hidden xs:inline">Export Audit</span>
        </button>

        <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 bg-surface-container-lowest rounded-lg border border-surface-container-high text-xs font-mono text-outline">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          <span className="text-[11px]">200ms</span>
        </div>
      </div>
    </div>
  );
}
