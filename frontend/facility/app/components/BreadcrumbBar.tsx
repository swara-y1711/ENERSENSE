'use client';

import React from 'react';
import { BuildingOption } from '../data/facilityData';
import { ReplayContext } from '../lib/api';

interface BreadcrumbBarProps {
  activeBuilding: BuildingOption | null;
  replay: ReplayContext | null;
  backendUnavailable: boolean;
  timeframe: string;
  onSelectTimeframe: (tf: string, label: string) => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export default function BreadcrumbBar({
  activeBuilding,
  replay,
  backendUnavailable,
  timeframe,
  onSelectTimeframe,
  showToast,
}: BreadcrumbBarProps) {
  const timeframes = [
    { id: 'live', label: 'Replay (15m)' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7d', label: '7D Avg' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-surface-container-lowest/60 p-3 rounded-xl border border-surface-container-high/60 sm:bg-transparent sm:p-0 sm:border-0">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-outline font-medium">
        <span className="font-bold text-on-surface truncate">
          {backendUnavailable ? 'Backend unavailable' : activeBuilding?.name ?? 'Awaiting backend data'}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-semibold shrink-0">
          Source: {replay?.source ?? 'Not available'}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-outline font-mono text-[10px] font-semibold shrink-0">
          Mode: {replay?.mode === 'historical_replay' ? 'Historical Replay' : replay?.mode ?? 'Not available'}
        </span>
        {replay?.weather && (
          <span className="shrink-0">
            Weather: {replay.weather.temperature_c ?? 'Not available'}°C · RH{' '}
            {replay.weather.relative_humidity_percent ?? 'Not available'}%
          </span>
        )}
        {replay?.tariff && (
          <span className="shrink-0">
            Tariff: {replay.tariff.period ?? 'Not available'}
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
                onClick={() => {
                  onSelectTimeframe(tf.id, tf.label);
                  if (tf.id !== 'live') {
                    showToast('Only the active historical replay interval is available from the backend.');
                  }
                }}
              >
                {tf.label}
              </button>
            );
          })}
        </div>

        <button
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-surface-container-lowest border border-surface-container-high hover:bg-surface-container-low rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          onClick={() => showToast('Replay audit export is not available from the backend.')}
        >
          <span className="material-symbols-outlined text-[16px] text-outline">
            download
          </span>
          <span className="hidden xs:inline">Export Audit</span>
        </button>

        <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 bg-surface-container-lowest rounded-lg border border-surface-container-high text-xs font-mono text-outline">
          <span className={`h-2 w-2 rounded-full ${backendUnavailable ? 'bg-error' : 'bg-primary animate-pulse'}`}></span>
          <span className="text-[11px]">{backendUnavailable ? 'Offline' : 'Replay active'}</span>
        </div>
      </div>
    </div>
  );
}
