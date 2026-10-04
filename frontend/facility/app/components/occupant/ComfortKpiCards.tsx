'use client';

import React, { useState } from 'react';
import { ComfortMetrics, OccupantProfile } from '../../data/occupantData';

interface ComfortKpiCardsProps {
  profile: OccupantProfile;
  metrics: ComfortMetrics;
  onNudgeTemp: (delta: number) => void;
  onRequestBoost: () => void;
}

export default function ComfortKpiCards({
  profile,
  metrics,
  onNudgeTemp,
  onRequestBoost,
}: ComfortKpiCardsProps) {
  const [nudgeTrayOpen, setNudgeTrayOpen] = useState(false);
  const [boosting, setBoosting] = useState(false);

  const handleBoostClick = () => {
    setBoosting(true);
    onRequestBoost();
    setTimeout(() => setBoosting(false), 15000);
  };

  return (
    <section className="py-1 mb-5" id="comfort">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Comfort Maintained */}
        <div className="p-4 sm:p-5 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high/50 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary-fixed-dim/30 flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-[22px]">
                  verified
                </span>
              </div>
              <div>
                <span className="font-headline-sm text-body-lg font-semibold text-on-surface block leading-tight">
                  Comfort Maintained
                </span>
                <span className="font-body-sm text-body-sm text-primary font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  {profile.pmvStatus}
                </span>
              </div>
            </div>

            <button
              className="h-8 px-2.5 rounded-lg bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary font-label-sm text-label-sm font-semibold transition-all flex items-center gap-1 cursor-pointer"
              onClick={() => setNudgeTrayOpen(!nudgeTrayOpen)}
            >
              <span className="material-symbols-outlined text-[15px]">tune</span>
              Nudge
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-surface-container-high/50 flex items-baseline justify-between">
            <span className="font-body-sm text-on-surface-variant">
              Target Pod Setpoint
            </span>
            <span className="font-metric-display text-metric-display text-on-surface">
              {profile.targetSetpoint.toFixed(1)}
              <span className="font-body-sm font-normal text-on-surface-variant">
                °C
              </span>
            </span>
          </div>

          {/* Quick Nudge Tray */}
          {nudgeTrayOpen && (
            <div className="pt-3 mt-3 border-t border-surface-container-high/60 flex flex-col gap-2 animate-fade-in">
              <div className="flex items-center justify-between bg-surface-container-low p-2 rounded-lg">
                <span className="font-body-sm text-on-surface font-medium">
                  Quick Pod Nudge:
                </span>
                <div className="flex items-center gap-1">
                  <button
                    className="w-7 h-7 rounded-md bg-surface-container-lowest text-on-surface flex items-center justify-center font-label-md hover:bg-surface-container shadow-sm active:scale-95 transition-transform cursor-pointer"
                    onClick={() => onNudgeTemp(-1)}
                  >
                    -1°
                  </button>
                  <button
                    className="px-2 h-7 rounded-md bg-primary text-on-primary flex items-center justify-center font-label-sm active:scale-95 shadow-sm transition-transform cursor-pointer"
                    onClick={() => onNudgeTemp(0)}
                  >
                    Eco
                  </button>
                  <button
                    className="w-7 h-7 rounded-md bg-surface-container-lowest text-on-surface flex items-center justify-center font-label-md hover:bg-surface-container shadow-sm active:scale-95 transition-transform cursor-pointer"
                    onClick={() => onNudgeTemp(1)}
                  >
                    +1°
                  </button>
                </div>
              </div>

              <button
                className={`w-full py-1.5 px-2 rounded-lg font-body-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  boosting
                    ? 'bg-primary text-on-primary'
                    : 'bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-container'
                }`}
                onClick={handleBoostClick}
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    boosting ? 'animate-spin' : ''
                  }`}
                >
                  {boosting ? 'sync' : 'air'}
                </span>
                <span>
                  {boosting
                    ? 'Airflow Boosting (15m remaining)...'
                    : 'Request 15-Min Airflow Boost'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Card 2: Energy Efficiency */}
        <div className="p-4 sm:p-5 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high/50 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-secondary">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-secondary-fixed/50 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[22px]">
                  bolt
                </span>
              </div>
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
                Energy Efficiency
              </span>
            </div>
            <span className="font-label-sm text-label-sm font-semibold uppercase px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">
              {metrics.kwhAvgComparison}
            </span>
          </div>

          <div className="mt-3">
            <span className="font-metric-display text-metric-display text-on-surface">
              {metrics.dailyKwh.toFixed(1)}{' '}
              <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                kWh/day
              </span>
            </span>
            <p className="font-body-sm text-body-sm text-primary font-medium mt-0.5 truncate">
              {metrics.kwhStatusNote}
            </p>
          </div>

          <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.kwhProgressPct}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Carbon Impact */}
        <div className="p-4 sm:p-5 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container-high/50 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-primary">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary-fixed/40 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[22px]">eco</span>
              </div>
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-semibold">
                Carbon Impact
              </span>
            </div>
            <span className="font-label-sm text-label-sm font-semibold uppercase px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed">
              {metrics.carbonRank}
            </span>
          </div>

          <div className="mt-3">
            <span className="font-metric-display text-metric-display text-on-surface">
              {metrics.co2eKg.toFixed(1)}{' '}
              <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                kg CO₂e
              </span>
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
              {metrics.carbonBadge}
            </p>
          </div>

          <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.carbonProgressPct}%` }}
            ></div>
          </div>
        </div>
      </div>
    </section>
  );
}
