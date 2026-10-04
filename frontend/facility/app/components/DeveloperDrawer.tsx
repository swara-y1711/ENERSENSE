'use client';

import React from 'react';
import { BuildingOption } from '../data/facilityData';

interface DeveloperDrawerProps {
  activeBuilding: BuildingOption | null;
  source: string | null;
  mode: string | null;
  backendUnavailable: boolean;
}

export default function DeveloperDrawer({
  activeBuilding,
  source,
  mode,
  backendUnavailable,
}: DeveloperDrawerProps) {
  return (
    <div className="p-3 bg-surface-container-low rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono text-outline">
      <div className="flex items-center gap-2 truncate">
        <span className="material-symbols-outlined text-[16px] shrink-0">
          {backendUnavailable ? 'cloud_off' : 'terminal'}
        </span>
        <span className="truncate">
          {backendUnavailable ? 'Backend unavailable' : 'Replay API: '}
          <code className="text-on-surface font-semibold">
            {activeBuilding?.name ?? 'Not available'}
          </code>
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
        <span className="text-on-surface font-semibold">
          Source: {source ?? 'Not available'} · Mode: {mode ?? 'Not available'}
        </span>
      </div>
    </div>
  );
}
