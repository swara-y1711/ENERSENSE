'use client';

import React, { useSyncExternalStore } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ReplayRecord } from '../lib/api';

interface DemandProfileChartProps {
  records: ReplayRecord[];
}

interface ChartPoint extends ReplayRecord {
  time: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  label?: string;
}

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="bg-on-surface text-surface p-2.5 rounded-lg shadow-xl text-xs font-mono min-w-[160px]">
      <div className="font-bold border-b border-outline/30 pb-1 mb-1 text-[11px]">
        Time: {label} IST
      </div>
      <div className="flex justify-between text-primary-container gap-3">
        <span>I-BLEND demand:</span>
        <span className="font-bold text-primary-container">
          {point.demand_kw.toLocaleString('en-US', { maximumFractionDigits: 2 })} kW
        </span>
      </div>
      <div className="mt-1 text-[10px] text-outline-variant">{point.timestamp}</div>
    </div>
  );
}

export default function DemandProfileChart({ records }: DemandProfileChartProps) {
  const mounted = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );

  const chartData: ChartPoint[] = records.map((record) => ({
    ...record,
    time: formatTime(record.timestamp),
  }));

  return (
    <div className="lg:col-span-8 bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-xs border border-surface-container-high flex flex-col justify-between overflow-hidden">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-on-surface">
                I-BLEND Historical Demand
              </h2>
              <span className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-mono uppercase text-outline font-semibold">
                15m Replay Records
              </span>
            </div>
            <p className="text-xs text-outline mt-0.5">
              Historical replay demand; no baseline or forecast curve is available for this chart.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 pb-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-primary rounded-full"></span>
            <span className="font-bold text-[11px] sm:text-xs text-primary">
              I-BLEND Demand
            </span>
          </div>
          <span className="text-[11px] text-outline">
            Source: I-BLEND · Mode: Historical Replay
          </span>
        </div>

        <div className="w-full h-64 sm:h-72 my-2 relative">
          {mounted ? (
            chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00855d" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00855d" stopOpacity={0} />
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
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="demand_kw"
                    stroke="none"
                    fill="url(#areaGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="demand_kw"
                    stroke="#00855d"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: '#00855d', stroke: '#fff', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-surface-container-low rounded-xl flex items-center justify-center text-xs font-mono text-outline">
                {records.length === 0 ? 'Awaiting I-BLEND replay records' : 'Not available'}
              </div>
            )
          ) : (
            <div className="w-full h-full bg-surface-container-low rounded-xl animate-pulse flex items-center justify-center text-xs font-mono text-outline">
              Loading Replay Chart...
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 border-t border-surface-container-high text-xs text-outline">
        <span>Source: I-BLEND · Mode: Historical Replay</span>
        <span className="font-mono text-on-surface">
          Latest record: {chartData[chartData.length - 1]?.timestamp ?? 'Not available'}
        </span>
      </div>
    </div>
  );
}
