'use client';

import React from 'react';
import { KpiMetrics } from '../data/facilityData';

interface KpiRibbonProps {
  kpi: KpiMetrics;
  activeKw: number;
}

export default function KpiRibbon({ kpi, activeKw }: KpiRibbonProps) {
  const capPct = Math.min(100, Math.round((activeKw / kpi.transformerCapKw) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Today's Cumulative */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <span className="text-xs font-mono uppercase text-outline">
            Today&apos;s Cumulative
          </span>
          <span className="text-xs font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
            {kpi.cumDelta}
          </span>
        </div>
        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-on-surface">
            {kpi.cumulativeKwh.toLocaleString('en-US')}
          </span>
          <span className="text-xs font-mono text-outline ml-1">kWh</span>
        </div>
        <div className="text-[11px] text-outline flex justify-between gap-1">
          <span className="truncate">
            Baseline: {kpi.baselineKwh.toLocaleString('en-US')} kWh
          </span>
          <span className="text-primary font-medium shrink-0">
            {kpi.underMaxPct} under max
          </span>
        </div>
      </div>

      {/* 2. Active Load */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <span className="text-xs font-mono uppercase text-outline">
            Active Telemetry Load
          </span>
          <span className="text-xs font-medium text-secondary px-1.5 py-0.5 rounded bg-surface-container-high">
            Normal Load
          </span>
        </div>
        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-on-surface">
            {activeKw}
          </span>
          <span className="text-xs font-mono text-outline ml-1">kW</span>
        </div>
        <div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-secondary transition-all duration-500"
              style={{ width: `${capPct}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-outline flex justify-between gap-1">
            <span className="truncate">{capPct}% Transformer Cap</span>
            <span className="shrink-0">{kpi.transformerCapKw} kW Max</span>
          </div>
        </div>
      </div>

      {/* 3. Predicted Peak */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <span className="text-xs font-mono uppercase text-outline">
            Predicted Unmitigated Peak
          </span>
          <span className="text-xs font-bold text-tertiary px-1.5 py-0.5 rounded bg-tertiary-fixed">
            Grid Alert
          </span>
        </div>
        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-tertiary">
            {kpi.predPeakKw}
          </span>
          <span className="text-xs font-mono text-outline ml-1">kW</span>
        </div>
        <div className="text-[11px] text-outline flex justify-between gap-1">
          <span className="font-bold text-tertiary truncate">
            Window: {kpi.peakWindow}
          </span>
          <span className="text-error font-medium shrink-0">
            +{kpi.peakDeltaKw} kW delta
          </span>
        </div>
      </div>

      {/* 4. Flexible Capacity */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <span className="text-xs font-mono uppercase text-outline">
            Flexible Shed Capacity
          </span>
          <span className="text-xs font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
            Ready to Shed
          </span>
        </div>
        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-primary">
            {kpi.flexibleShedCapKw}
          </span>
          <span className="text-xs font-mono text-outline ml-1">kW</span>
        </div>
        <div className="text-[11px] text-outline flex justify-between gap-1">
          <span className="truncate">Thermal + EV priority</span>
          <span className="text-primary font-bold shrink-0">
            {kpi.flexPct} load flex
          </span>
        </div>
      </div>
    </div>
  );
}
