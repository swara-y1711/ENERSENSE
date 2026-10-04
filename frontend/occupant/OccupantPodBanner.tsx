'use client';

import React from 'react';
import { OccupantProfile } from '../../data/occupantData';

interface OccupantPodBannerProps {
  profile: OccupantProfile;
}

export default function OccupantPodBanner({ profile }: OccupantPodBannerProps) {
  return (
    <section className="py-2.5 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low/60 rounded-xl p-3 sm:px-4 mb-4 border border-surface-container-high/60">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[20px]">desk</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-body-md text-body-md font-semibold text-on-surface">
              Workstation {profile.podId}
            </span>
            <span className="px-2 py-[1px] rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
              {profile.zone}
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {profile.floor} • Active auto-tune active • PMV +{profile.pmvScore}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/30 text-on-primary-fixed-variant font-label-sm text-label-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
          <span>Live Optimization Active</span>
        </div>
      </div>
    </section>
  );
}
