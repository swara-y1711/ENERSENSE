'use client';

import React, { useState } from 'react';
import {
  FlexibilityCurrent,
  ImpactCurrent,
  ImpactSimulation,
  ReplayRecord,
  simulateImpact,
} from '../lib/api';

interface WhatIfSimulatorProps {
  replay: ReplayRecord | null;
  flexibility: FlexibilityCurrent | null;
  impact: ImpactCurrent | null;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

function formatMetric(value: number | null | undefined, unit: string): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${unit}`
    : 'Not available';
}

interface CompletedSimulation {
  result: ImpactSimulation;
  replayTimestamp: string;
  requestedReductionKw: number;
  durationHours: number;
}

export default function WhatIfSimulator({
  replay,
  flexibility,
  impact,
  showToast,
}: WhatIfSimulatorProps) {
  const [reductionTarget, setReductionTarget] = useState(0.6);
  const [duration, setDuration] = useState(1);
  const [simulation, setSimulation] = useState<CompletedSimulation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const flexibleDemandKw =
    typeof flexibility?.potential_flexible_kw === 'number' &&
    Number.isFinite(flexibility.potential_flexible_kw) &&
    flexibility.potential_flexible_kw >= 0
      ? flexibility.potential_flexible_kw
      : null;
  const isFlexibilityAvailable = flexibleDemandKw !== null;
  const maximumReduction = flexibleDemandKw ?? 0;
  const requestedReductionKw = Math.min(
    Math.max(0, reductionTarget),
    maximumReduction,
  );
  const isAchievable =
    isFlexibilityAvailable && requestedReductionKw <= flexibleDemandKw;
  const isCurrentSimulation =
    simulation !== null &&
    simulation.replayTimestamp === replay?.timestamp &&
    simulation.requestedReductionKw === requestedReductionKw &&
    simulation.durationHours === duration;
  const simulationActualDemandKw = isCurrentSimulation
    ? simulation.result.average_actual_demand_kw
    : null;
  const actualDemandKw =
    typeof simulationActualDemandKw === 'number' &&
    Number.isFinite(simulationActualDemandKw)
      ? simulationActualDemandKw
      : replay?.demand_kw ?? impact?.actual_demand_kw;
  const appliedReductionKw = isFlexibilityAvailable
    ? Math.min(requestedReductionKw, flexibleDemandKw)
    : null;
  const scenarioDemandKw =
    typeof actualDemandKw === 'number' &&
    typeof appliedReductionKw === 'number' &&
    Number.isFinite(actualDemandKw)
      ? Math.max(0, actualDemandKw - appliedReductionKw)
      : null;
  const estimatedEnergyReductionKwh =
    typeof appliedReductionKw === 'number' && Number.isFinite(duration)
      ? appliedReductionKw * duration
      : null;
  const canSimulate = isFlexibilityAvailable && flexibleDemandKw > 0;

  const runSimulation = async () => {
    if (!replay || !isFlexibilityAvailable || !canSimulate) {
      showToast(
        isFlexibilityAvailable
          ? 'No positive flexible demand is currently estimated.'
          : 'Flexibility estimate unavailable.',
      );
      return;
    }

    const appliedRequestKw = Math.min(
      Math.max(0, reductionTarget),
      flexibleDemandKw,
    );
    const submittedReplayTimestamp = replay.timestamp;
    const submittedDurationHours = duration;
    setIsCalculating(true);
    try {
      const result = await simulateImpact(
        submittedReplayTimestamp,
        submittedDurationHours,
        appliedRequestKw,
      );
      setSimulation({
        result,
        replayTimestamp: submittedReplayTimestamp,
        requestedReductionKw: appliedRequestKw,
        durationHours: submittedDurationHours,
      });
      showToast('Advisory impact simulation updated.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Impact simulation unavailable: ${message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-2xl shadow-sm border border-surface-container-high">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold shrink-0">
            <span className="material-symbols-outlined text-[24px]">science</span>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-on-surface">
              Grid Event “What-If” Simulator
            </h2>
            <p className="text-xs text-outline">
              Advisory simulation using the backend historical flexibility model; no equipment control.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] sm:text-xs font-mono font-bold uppercase shrink-0">
            {isFlexibilityAvailable ? 'Model data available' : 'Flexibility estimate unavailable'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
        <div className="lg:col-span-7 bg-surface-container-low p-4 sm:p-5 rounded-xl space-y-5">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                <span>Requested Reduction Target</span>
                <span
                  className="material-symbols-outlined text-[15px] text-outline cursor-help"
                  title="A scenario input; not a measured or controllable load."
                >
                  help_outline
                </span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={maximumReduction}
                  step={0.01}
                  value={requestedReductionKw}
                  disabled={!isFlexibilityAvailable}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value)) {
                      setReductionTarget(Math.max(0, Math.min(maximumReduction, value)));
                      setSimulation(null);
                    }
                  }}
                  className="w-20 h-8 text-center font-mono font-bold text-xs bg-surface-container-lowest rounded-lg border border-surface-container-high outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
                <span className="text-xs font-mono text-outline">kW</span>
              </div>
            </div>

            <div className="py-2">
              <input
                type="range"
                min={0}
                max={maximumReduction}
                step={0.01}
                value={requestedReductionKw}
                disabled={!isFlexibilityAvailable}
                onChange={(event) => {
                  setReductionTarget(Number(event.target.value));
                  setSimulation(null);
                }}
                className="w-full accent-primary h-2 bg-surface-container-high rounded cursor-pointer touch-pan-x disabled:opacity-50"
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-outline mt-1 font-medium flex-wrap gap-1">
              <span>Requested reduction</span>
              <span>
                Estimated Flexible Demand:{' '}
                {isFlexibilityAvailable
                  ? formatMetric(flexibleDemandKw, 'kW')
                  : 'Flexibility estimate unavailable'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface block mb-1.5">
              Simulation Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((hours) => (
                <button
                  key={hours}
                  className={`min-h-[44px] py-2 rounded-lg text-xs transition-colors flex items-center justify-center cursor-pointer ${
                    duration === hours
                      ? 'font-bold bg-primary text-on-primary shadow-xs'
                      : 'font-medium bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-surface-container-high'
                  }`}
                  onClick={() => {
                    setDuration(hours);
                    setSimulation(null);
                  }}
                >
                  {hours} Hour{hours > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-surface-container-lowest rounded-lg border border-surface-container-high text-xs text-outline">
            {flexibility?.notice ?? 'Flexibility estimate unavailable.'}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <button
              disabled={isCalculating || !replay || !canSimulate}
              onClick={() => void runSimulation()}
              className="min-h-[44px] px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>{isCalculating ? 'SIMULATING...' : 'RUN ADVISORY SIMULATION'}</span>
            </button>
            <span className="text-[11px] font-mono text-outline text-center sm:text-right">
              Source: backend impact model
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 bg-surface-container p-4 sm:p-5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface">
                Projected Curtailment Impact
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-surface-container-high text-outline">
                {simulation ? 'Simulated' : impact?.mode ?? 'Not available'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3">
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high">
                <span className="text-[10px] font-mono uppercase text-outline">
                  {isCurrentSimulation
                    ? 'Actual Demand · Simulation Interval'
                    : 'Actual Demand'}
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-primary mt-0.5">
                  {formatMetric(actualDemandKw, 'kW')}
                </div>
                {isCurrentSimulation && (
                  <span className="text-[10px] text-outline">
                    {simulation.result.start_timestamp} – {simulation.result.end_timestamp}
                  </span>
                )}
              </div>
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high">
                <span className="text-[10px] font-mono uppercase text-outline">
                  Scenario Demand
                </span>
                <div className="text-base sm:text-xl font-bold font-mono text-on-surface mt-0.5 truncate">
                  {formatMetric(scenarioDemandKw, 'kW')}
                </div>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high">
                <span className="text-[10px] font-mono uppercase text-outline">
                  Estimated Flexible Demand
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-on-surface mt-0.5">
                  {isFlexibilityAvailable
                    ? formatMetric(flexibleDemandKw, 'kW')
                    : 'Flexibility estimate unavailable'}
                </div>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high">
                <span className="text-[10px] font-mono uppercase text-outline">
                  Applied Reduction
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-on-surface mt-0.5">
                  {formatMetric(appliedReductionKw, 'kW')}
                </div>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high">
                <span className="text-[10px] font-mono uppercase text-outline">
                  Estimated Energy Reduction
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-primary mt-0.5">
                  {formatMetric(estimatedEnergyReductionKwh, 'kWh')}
                </div>
              </div>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded-xl border border-surface-container-high flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-on-surface">
                Scenario Achievability
              </span>
              <span className={`text-xs font-bold font-mono text-right ${isAchievable ? 'text-primary' : 'text-error'}`}>
                {!isFlexibilityAvailable
                  ? 'Flexibility estimate unavailable'
                  : isAchievable
                    ? 'Within estimated flexibility'
                    : 'Exceeds estimated flexibility'}
              </span>
            </div>
            <p className="text-[10px] text-outline">
              {simulation?.result.notice ??
                impact?.notice ??
                'This is a what-if scenario and does not claim automatic equipment control.'}
            </p>
          </div>

          <button
            className="w-full min-h-[44px] mt-4 py-3 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            onClick={() => void runSimulation()}
            disabled={isCalculating || !replay || !canSimulate}
          >
            <span className="material-symbols-outlined text-[18px]">science</span>
            <span>Run Advisory Simulation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
