'use client';

import React from 'react';
import {
  FlexibilityCurrent,
  ForecastCurrent,
  PeakCurrent,
  Recommendation,
  ReplayRecord,
} from '../lib/api';

interface KpiRibbonProps {
  replay: ReplayRecord | null;
  forecast: ForecastCurrent | null;
  peak: PeakCurrent | null;
  flexibility: FlexibilityCurrent | null;
  recommendations: Recommendation[];
}

function formatMetric(value: number | null | undefined): string {
  return typeof value === 'number'
    ? value.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : 'Awaiting model data';
}

export default function KpiRibbon({
  replay,
  forecast,
  peak,
  flexibility,
  recommendations,
}: KpiRibbonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Today's Cumulative */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <span className="text-xs font-mono uppercase text-outline">
            Today&apos;s Cumulative
          </span>
          <span className="text-xs font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
            Not available
          </span>
        </div>
        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-on-surface">
            Not available
          </span>
        </div>
        <div className="text-[11px] text-outline flex justify-between gap-1">
          <span className="truncate">
            Baseline: Not available
          </span>
          <span className="text-primary font-medium shrink-0">
            No cumulative energy endpoint
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
            {replay?.source ?? 'Backend unavailable'}
          </span>
        </div>
        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-on-surface">
            {formatMetric(replay?.demand_kw)}
          </span>
          {typeof replay?.demand_kw === 'number' && (
            <span className="text-xs font-mono text-outline ml-1">kW</span>
          )}
        </div>
        <div className="text-[11px] text-outline flex justify-between gap-1">
          <span className="truncate">
            {replay?.timestamp ?? 'Not available'}
          </span>
          <span className="shrink-0">I-BLEND</span>
        </div>
      </div>

      {/* 3. Forecast and Peak Status */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <span className="text-xs font-mono uppercase text-outline">
            Forecasted Demand
          </span>
          <span className="text-xs font-bold text-tertiary px-1.5 py-0.5 rounded bg-tertiary-fixed">
            {peak?.peak_status ?? 'Peak status unavailable'}
          </span>
        </div>
        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-tertiary">
            {formatMetric(forecast?.predicted_demand_kw ?? peak?.predicted_demand_kw)}
          </span>
          {(typeof forecast?.predicted_demand_kw === 'number' ||
            typeof peak?.predicted_demand_kw === 'number') && (
            <span className="text-xs font-mono text-outline ml-1">kW</span>
          )}
        </div>
        <div className="text-[11px] text-outline flex justify-between gap-1">
          <span className="font-bold text-tertiary truncate">
            Status: {peak?.peak_status ?? 'Awaiting model data'}
          </span>
          <span className="text-error font-medium shrink-0">
            {peak?.is_predicted_peak ? 'Predicted peak' : peak ? 'Below peak' : 'Not available'}
          </span>
        </div>
      </div>

      {/* 4. Flexible Demand and Recommendation */}
      <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <span className="text-xs font-mono uppercase text-outline">
            Potential Flexible Demand
          </span>
          <span className="text-xs font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
            Estimate only
          </span>
        </div>
        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-primary">
            {formatMetric(flexibility?.potential_flexible_kw)}
          </span>
          {typeof flexibility?.potential_flexible_kw === 'number' && (
            <span className="text-xs font-mono text-outline ml-1">kW</span>
          )}
        </div>
        <div className="text-[11px] text-outline flex justify-between gap-1">
          <span className="truncate">
            {recommendations[0]?.action ?? 'Awaiting model data'}
          </span>
          <span className="text-primary font-bold shrink-0">
            {recommendations[0]?.priority ?? 'Not available'}
          </span>
        </div>
      </div>
    </div>
  );
}
