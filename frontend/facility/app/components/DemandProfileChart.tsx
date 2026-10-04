'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import { DEMAND_TELEMETRY, ChartTelemetryPoint } from '../data/facilityData';
import { ReplayRecord } from '../lib/api';

interface DemandProfileChartProps {
  reductionTarget: number;
  telemetry?: ReplayRecord[];
  baselineDemandKw?: number;
}

type CircuitFilter = 'all' | 'hvac' | 'ev' | 'aux';

export default function DemandProfileChart({
  reductionTarget,
  telemetry,
  baselineDemandKw,
}: DemandProfileChartProps) {
  const [circuitFilter, setCircuitFilter] = useState<CircuitFilter>('all');
  const [showBaseline, setShowBaseline] = useState<boolean>(true);
  const [showGridwise, setShowGridwise] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute dataset dynamically based on selected circuit filter and reductionTarget
  const chartData = (telemetry && telemetry.length > 0)
    ? telemetry.map((pt) => {
        const timeStr = pt.timestamp ? (pt.timestamp.split('T')[1]?.slice(0, 5) || pt.timestamp.slice(11, 16)) : '00:00';
        const actual = pt.demand_kw;
        const base = baselineDemandKw !== undefined ? baselineDemandKw : 56.3;
        const grid = Math.max(0, actual - reductionTarget);

        return {
          time: timeStr,
          timestamp: pt.timestamp,
          baselineVal: Number(base.toFixed(1)),
          gridwiseVal: Number(grid.toFixed(1)),
          actualVal: Number(actual.toFixed(1)),
          allBaseline: Number(base.toFixed(1)),
          allGridwise: Number(grid.toFixed(1)),
          hvacBaseline: Number((base * 0.52).toFixed(1)),
          hvacGridwise: Number((grid * 0.52).toFixed(1)),
          evBaseline: Number((base * 0.24).toFixed(1)),
          evGridwise: Number((grid * 0.24).toFixed(1)),
          auxBaseline: Number((base * 0.24).toFixed(1)),
          auxGridwise: Number((grid * 0.24).toFixed(1)),
          isPeakWindow: actual >= 64.5,
        };
      })
    : DEMAND_TELEMETRY.map((pt) => {
        let base = pt.allBaseline;
        let grid = pt.allGridwise;

        if (circuitFilter === 'hvac') {
          base = pt.hvacBaseline;
          grid = pt.hvacGridwise;
        } else if (circuitFilter === 'ev') {
          base = pt.evBaseline;
          grid = pt.evGridwise;
        } else if (circuitFilter === 'aux') {
          base = pt.auxBaseline;
          grid = pt.auxGridwise;
        }

        // Apply reduction target during peak window
        if (pt.isPeakWindow && circuitFilter === 'all') {
          grid = Math.max(260, base - reductionTarget);
        }

        return {
          ...pt,
          actualVal: base,
          baselineVal: base,
          gridwiseVal: grid,
          isPeakWindow: !!pt.isPeakWindow,
        };
      });

  const getCalloutText = () => {
    switch (circuitFilter) {
      case 'hvac':
        return `↓ -${Math.min(45, reductionTarget)} kW HVAC Potential Shift`;
      case 'ev':
        return `↓ -${Math.min(25, reductionTarget)} kW EV Charging Deferral`;
      case 'aux':
        return `↓ -8 kW Auxiliary Non-Essential Load`;
      default:
        return `↓ -${reductionTarget} kW Potential Peak Load Shift`;
    }
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: any = payload[0].payload;
      const base = data.baselineVal;
      const grid = data.gridwiseVal;
      const actual = data.actualVal ?? base;
      const diff = Math.max(0, actual - grid);
      const kwhImpact = (diff * 0.25).toFixed(2);

      return (
        <div className="bg-on-surface text-surface p-2.5 rounded-lg shadow-xl text-xs font-mono min-w-[170px]">
          <div className="font-bold border-b border-outline/30 pb-1 mb-1 text-[11px]">
            Time: {label} IST
          </div>
          <div className="flex justify-between text-outline-variant gap-3">
            <span>Baseline Ref:</span>
            <span className="font-bold text-white">{base} kW</span>
          </div>
          <div className="flex justify-between text-secondary gap-3">
            <span>Actual Demand:</span>
            <span className="font-bold text-secondary">{actual} kW</span>
          </div>
          <div className="flex justify-between text-primary-container gap-3">
            <span>Scenario:</span>
            <span className="font-bold text-primary-container">{grid} kW</span>
          </div>
          <div className="flex justify-between text-tertiary mt-1 pt-1 border-t border-outline/30 gap-3">
            <span>Simulated Impact:</span>
            <span className="font-bold">
              {diff > 0 ? `${diff.toFixed(1)} kW (${kwhImpact} kWh)` : 'Normal'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="lg:col-span-8 bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-xs border border-surface-container-high flex flex-col justify-between overflow-hidden">
      <div>
        {/* Header Title & Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-on-surface">
                Demand Profile: Baseline vs Gridwise Scenario
              </h2>
              <span className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-mono uppercase text-outline font-semibold">
                15m Telemetry
              </span>
            </div>
            <p className="text-xs text-outline mt-0.5">
              Automated peak shaving with proactive pre-cooling anticipation
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex bg-surface-container-low p-1 rounded-lg self-start sm:self-auto overflow-x-auto max-w-full custom-scrollbar">
            {[
              { id: 'all', label: 'All Circuits' },
              { id: 'hvac', label: 'HVAC' },
              { id: 'ev', label: 'EV Fleet' },
              { id: 'aux', label: 'Aux/Lights' },
            ].map((btn) => (
              <button
                key={btn.id}
                className={`shrink-0 px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                  circuitFilter === btn.id
                    ? 'font-semibold bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'font-medium text-outline hover:text-on-surface'
                }`}
                onClick={() => setCircuitFilter(btn.id as CircuitFilter)}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend & Peak Shaved Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              className="flex items-center gap-1.5 hover:opacity-75 transition-opacity cursor-pointer"
              onClick={() => setShowBaseline(!showBaseline)}
            >
              <span className="w-3 h-0.5 bg-outline border-b border-dashed border-outline"></span>
              <span
                className={`font-medium text-[11px] sm:text-xs ${
                  showBaseline ? 'text-outline' : 'text-outline/40'
                }`}
              >
                Unmitigated Baseline
              </span>
            </button>

            <button
              className="flex items-center gap-1.5 hover:opacity-75 transition-opacity cursor-pointer"
              onClick={() => setShowGridwise(!showGridwise)}
            >
              <span className="w-3 h-1 bg-primary rounded-full"></span>
              <span
                className={`font-bold text-[11px] sm:text-xs ${
                  showGridwise ? 'text-primary' : 'text-primary/40'
                }`}
              >
                Predicted Gridwise
              </span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-tertiary-fixed/80 rounded"></span>
              <span className="text-tertiary font-medium text-[11px] sm:text-xs">
                Peak Window (18-21h)
              </span>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold font-mono">
            {getCalloutText()}
          </div>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-64 sm:h-72 my-2 relative">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00855d" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00855d" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#eaedff" vertical={false} />

                <XAxis
                  dataKey="time"
                  stroke="#6d7a72"
                  fontSize={10}
                  tickLine={false}
                  fontFamily="JetBrains Mono"
                />

                <YAxis
                  stroke="#6d7a72"
                  fontSize={10}
                  tickLine={false}
                  fontFamily="JetBrains Mono"
                  domain={[0, 500]}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Pre-cooling Highlight Region (16:00 to 17:00) */}
                <ReferenceArea
                  x1="16:00"
                  x2="17:00"
                  fill="#dae2fd"
                  fillOpacity={0.3}
                  label={{
                    value: 'PRE-COOLING',
                    fill: '#006591',
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono',
                    position: 'top',
                  }}
                />

                {/* Peak Tariff Highlight Region (18:00 to 21:00) */}
                <ReferenceArea
                  x1="18:00"
                  x2="21:00"
                  fill="#ffddb8"
                  fillOpacity={0.4}
                  label={{
                    value: 'PEAK TARIFF',
                    fill: '#825100',
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono',
                    position: 'top',
                  }}
                />

                {/* Gridwise Area Fill */}
                {showGridwise && (
                  <Area
                    type="monotone"
                    dataKey="gridwiseVal"
                    stroke="none"
                    fill="url(#areaGrad)"
                  />
                )}

                {/* Unmitigated Baseline Line */}
                {showBaseline && (
                  <Line
                    type="monotone"
                    dataKey="baselineVal"
                    stroke="#6d7a72"
                    strokeWidth={2.5}
                    strokeDasharray="5 4"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}

                {/* Gridwise Scenario Line */}
                {showGridwise && (
                  <Line
                    type="monotone"
                    dataKey="gridwiseVal"
                    stroke="#00855d"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#00855d', stroke: '#fff', strokeWidth: 2 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full bg-surface-container-low rounded-xl animate-pulse flex items-center justify-center text-xs font-mono text-outline">
              Loading Telemetry Chart...
            </div>
          )}
        </div>
      </div>

      {/* Chart Footer Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 border-t border-surface-container-high text-xs text-outline">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"></span>
          Model: GradientBoost Ensemble v4.2 (SLA 98.4%)
        </span>
        <span className="font-mono text-on-surface">
          Next Inference: 18:15 IST (in 7m 24s)
        </span>
      </div>
    </div>
  );
}
