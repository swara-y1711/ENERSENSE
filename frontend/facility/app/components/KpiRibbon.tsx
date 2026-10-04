'use client';

import React from 'react';
import { KpiMetrics } from '../data/facilityData';

interface KpiRibbonProps {
  kpi: KpiMetrics;
  activeKw: number;
  baselineKw?: number;
  predictedDemandKw?: number;
  peakStatus?: string;
  potentialFlexibleKw?: number;
  peakWindow?: string;
}

export default function KpiRibbon({
  kpi,
  activeKw,
  baselineKw,
  predictedDemandKw,
  peakStatus = 'below_peak',
  potentialFlexibleKw,
  peakWindow = '11:15 - 13:00',
}: KpiRibbonProps) {
  const displayActiveKw = Number(activeKw.toFixed(1));
  const displayBaselineKw = baselineKw !== undefined ? Number(baselineKw.toFixed(1)) : 56.3;
  const displayPredKw = predictedDemandKw !== undefined ? Number(predictedDemandKw.toFixed(1)) : Number(kpi.predPeakKw.toFixed(1));
  const displayFlexKw = potentialFlexibleKw !== undefined ? Number(potentialFlexibleKw.toFixed(1)) : Number(kpi.flexibleShedCapKw.toFixed(1));
  const capPct = Math.min(100, Math.round((displayActiveKw / (kpi.transformerCapKw || 100)) * 100));

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
            {displayBaselineKw}
          </span>
          <span className="text-xs font-mono text-outline ml-1">kW Ref</span>
        </div>
        <div className="text-[11px] text-outline flex justify-between gap-1">
          <span className="truncate">
            Slot Median Baseline (Stage 4)
          </span>
          <span className="text-primary font-medium shrink-0">
            Historical
          </span>
        </div>
      </div>

      {/* 2. Active Load */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <span className="text-xs font-mono uppercase text-outline">
            Actual Replay Demand
          </span>
          <span className="text-xs font-medium text-secondary px-1.5 py-0.5 rounded bg-surface-container-high">
            I-BLEND 15m
          </span>
        </div>
        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-on-surface">
            {displayActiveKw}
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
            <span className="truncate">Academic Building</span>
            <span className="shrink-0 text-primary font-mono font-medium">Replay Stream</span>
          </div>
        </div>
      </div>

      {/* 3. Predicted Peak */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <span className="text-xs font-mono uppercase text-outline">
            Predicted Demand (XGBoost)
          </span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
            peakStatus === 'predicted_peak'
              ? 'bg-error-container text-error'
              : peakStatus === 'near_peak'
              ? 'bg-tertiary-fixed text-tertiary'
              : 'bg-primary/10 text-primary'
          }`}>
            {peakStatus === 'predicted_peak' ? 'Peak Alert' : peakStatus === 'near_peak' ? 'Near Peak' : 'Below Peak'}
          </span>
        </div>
        <div className="my-2">
          <span className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
            peakStatus === 'predicted_peak' ? 'text-error' : peakStatus === 'near_peak' ? 'text-tertiary' : 'text-primary'
          }`}>
            {displayPredKw}
          </span>
          <span className="text-xs font-mono text-outline ml-1">kW</span>
        </div>
        <div className="text-[11px] text-outline flex justify-between gap-1">
          <span className="font-semibold text-on-surface-variant truncate">
            Window: {peakWindow}
          </span>
          <span className="font-mono text-[10px] text-outline shrink-0">
            Stage 3 Forecast
          </span>
        </div>
      </div>

      {/* 4. Flexible Capacity */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <span className="text-xs font-mono uppercase text-outline">
            Potential Flexible Demand
          </span>
          <span className="text-xs font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
            Advisory Shift
          </span>
        </div>
        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-primary">
            {displayFlexKw}
          </span>
          <span className="text-xs font-mono text-outline ml-1">kW</span>
        </div>
        <div className="text-[11px] text-outline flex justify-between gap-1">
          <span className="truncate">Historical Slot Median Diff</span>
          <span className="text-primary font-bold shrink-0">
            Stage 4 Flex
          </span>
        </div>
      </div>
    </div>
  );
}
