'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { POD_HOURLY_TELEMETRY } from '../../data/occupantData';

interface PodEnergyChartProps {
  telemetry?: any[];
  loading?: boolean;
}

export default function PodEnergyChart({ telemetry, loading }: PodEnergyChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = telemetry && telemetry.length > 0 ? telemetry : POD_HOURLY_TELEMETRY;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-on-surface text-surface p-2.5 rounded-lg shadow-xl text-xs font-mono min-w-[140px]">
          <div className="font-bold border-b border-outline/30 pb-1 mb-1 text-[11px]">
            Slot: {label}
          </div>
          <div className="flex justify-between text-primary-container gap-2">
            <span>Demand:</span>
            <span className="font-bold">{data.podKw} kW</span>
          </div>
          <div className="flex justify-between text-outline-variant gap-2">
            <span>Baseline Ref:</span>
            <span className="font-bold">{data.campusAvgKw} kW</span>
          </div>
          {data.temp && (
            <div className="flex justify-between text-secondary mt-1 pt-1 border-t border-outline/30 gap-2">
              <span>Outdoor Temp:</span>
              <span className="font-bold">{data.temp}°C</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/60 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-headline-sm text-headline-sm text-on-surface">
            Replay Telemetry Trend
          </h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Historical demand vs. reference baseline
          </p>
        </div>
        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-xs font-bold">
          Historical Replay
        </span>
      </div>

      <div className="w-full h-44 sm:h-52 my-1">
        {mounted && !loading ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="podGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#006948" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#006948" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eaedff" vertical={false} />
              <XAxis dataKey="time" stroke="#6d7a72" fontSize={10} fontFamily="JetBrains Mono" />
              <YAxis stroke="#6d7a72" fontSize={10} fontFamily="JetBrains Mono" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="podKw" stroke="#006948" strokeWidth={2.5} fill="url(#podGrad)" />
              <Line type="monotone" dataKey="campusAvgKw" stroke="#006591" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-surface-container-low rounded-xl animate-pulse flex items-center justify-center text-xs font-mono text-outline">
            Loading Pod Trend...
          </div>
        )}
      </div>
    </div>
  );
}
