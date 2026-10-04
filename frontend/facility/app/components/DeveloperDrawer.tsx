'use client';

import React from 'react';
import { BuildingOption } from '../data/facilityData';

interface DeveloperDrawerProps {
  activeBuilding: BuildingOption;
}

export default function DeveloperDrawer({ activeBuilding }: DeveloperDrawerProps) {
  return (
    <div className="p-3 bg-surface-container-low rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono text-outline">
      <div className="flex items-center gap-2 truncate">
        <span className="material-symbols-outlined text-[16px] shrink-0">
          terminal
        </span>
        <span className="truncate">
          API:{' '}
          <code className="text-on-surface font-semibold">
            /api/v1/facility/telemetry?building={encodeURIComponent(activeBuilding.name)}
          </code>
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
        <span>
          WS:{' '}
          <code className="text-on-surface font-semibold">
            wss://telemetry.enersense.io/v1/streams
          </code>
        </span>
      </div>
    </div>
  );
}
