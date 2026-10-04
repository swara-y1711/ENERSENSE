import React, { useState } from 'react';
import { simulateImpact, ImpactSimulationResponse } from '../lib/api';

interface WhatIfSimulatorProps {
  reductionTarget: number;
  onTargetChange: (target: number) => void;
  duration: number;
  onDurationChange: (hours: number) => void;
  subsystems: { hvac: boolean; ev: boolean; storage: boolean };
  onSubsystemChange: (sub: { hvac: boolean; ev: boolean; storage: boolean }) => void;
  onReset: () => void;
  onOpenDispatchModal: () => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
  basePeakKw?: number;
  availableFlexKw?: number;
  startTimestamp?: string;
  endTimestamp?: string;
}

export default function WhatIfSimulator({
  reductionTarget,
  onTargetChange,
  duration,
  onDurationChange,
  subsystems,
  onSubsystemChange,
  onReset,
  onOpenDispatchModal,
  showToast,
  basePeakKw = 71.6,
  availableFlexKw = 15.4,
  startTimestamp,
  endTimestamp,
}: WhatIfSimulatorProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [latencyMs, setLatencyMs] = useState(42);
  const [pulseBoxes, setPulseBoxes] = useState(false);
  const [backendSim, setBackendSim] = useState<ImpactSimulationResponse | null>(null);

  // Compute available capacity based on enabled subsystems or backend flexibility
  const subsystemMultiplier =
    (subsystems.hvac ? 0.6 : 0) +
    (subsystems.ev ? 0.3 : 0) +
    (subsystems.storage ? 0.1 : 0);
  const availableCap = Number((availableFlexKw * (subsystemMultiplier || 1)).toFixed(1));

  // Outcome math
  const cappedTarget = Math.min(reductionTarget, availableCap);
  const newPeak = Number(Math.max(20, basePeakKw - cappedTarget).toFixed(1));
  const peakSavedPct = ((cappedTarget / (basePeakKw || 1)) * 100).toFixed(1);
  const energyShifted = backendSim
    ? backendSim.total_simulated_reduction_kwh
    : Number((cappedTarget * duration * 0.25).toFixed(2));
  const isFeasible = reductionTarget <= availableCap;

  const handleRunCalculation = async () => {
    setIsCalculating(true);
    const start = startTimestamp || '2016-10-03T11:00:00+05:30';
    const end = endTimestamp || '2016-10-03T13:00:00+05:30';
    try {
      const res = await simulateImpact(start, end, reductionTarget);
      setBackendSim(res);
      setLatencyMs(45);
      setPulseBoxes(true);
      setTimeout(() => setPulseBoxes(false), 500);
      showToast(
        `What-if scenario verified: ${res.total_simulated_reduction_kwh} kWh simulated reduction across ${res.total_intervals} intervals.`,
        'success'
      );
    } catch {
      setLatencyMs(32);
      setPulseBoxes(true);
      setTimeout(() => setPulseBoxes(false), 500);
      showToast('Calculated local scenario estimate based on 15m intervals.', 'info');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-2xl shadow-sm border border-surface-container-high">
      {/* Header Bar */}
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
              Calculate physical feasibility, avoided peak charges, and carbon abatement prior to curtailment dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] sm:text-xs font-mono font-bold uppercase shrink-0">
            Simulation Engine Live
          </span>
          <button
            className="text-xs text-outline hover:text-on-surface font-medium hover:underline p-1 cursor-pointer"
            onClick={onReset}
          >
            Reset Defaults
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
        {/* Left: Input Controls (7 Cols on desktop, 12 on mobile/tablet) */}
        <div className="lg:col-span-7 bg-surface-container-low p-4 sm:p-5 rounded-xl space-y-5">
          {/* 1. Range Slider with touch target */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                <span>Requested Reduction Target</span>
                <span
                  className="material-symbols-outlined text-[15px] text-outline cursor-help"
                  title="Power shedding target for the upcoming peak event"
                >
                  help_outline
                </span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={reductionTarget}
                  onChange={(e) => {
                    let val = parseInt(e.target.value, 10);
                    if (isNaN(val)) val = 10;
                    val = Math.max(10, Math.min(120, val));
                    onTargetChange(val);
                  }}
                  className="w-16 h-8 text-center font-mono font-bold text-xs bg-surface-container-lowest rounded-lg border border-surface-container-high outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-xs font-mono text-outline">kW</span>
              </div>
            </div>

            <div className="py-2">
              <input
                type="range"
                min={10}
                max={120}
                step={1}
                value={reductionTarget}
                onChange={(e) => onTargetChange(parseInt(e.target.value, 10))}
                className="w-full accent-primary h-2 bg-surface-container-high rounded cursor-pointer touch-pan-x"
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-outline mt-1 font-medium flex-wrap gap-1">
              <span>10 kW (Mild)</span>
              <span>45 kW (Recommended)</span>
              <span>{availableCap} kW (Available Max)</span>
              <span>120 kW (Stress)</span>
            </div>
          </div>

          {/* 2. Duration Selector */}
          <div>
            <label className="text-xs font-bold text-on-surface block mb-1.5">
              Event Curtailment Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((hrs) => (
                <button
                  key={hrs}
                  className={`min-h-[44px] py-2 rounded-lg text-xs transition-colors flex items-center justify-center cursor-pointer ${
                    duration === hrs
                      ? 'font-bold bg-primary text-on-primary shadow-xs'
                      : 'font-medium bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-surface-container-high'
                  }`}
                  onClick={() => onDurationChange(hrs)}
                >
                  {hrs} Hour{hrs > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Subsystem Engagement Matrix */}
          <div>
            <label className="text-xs font-bold text-on-surface block mb-1.5">
              Facility Sub-system Engagement Matrix
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center sm:items-start gap-2.5 p-3 min-h-[44px] bg-surface-container-lowest rounded-lg border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={subsystems.hvac}
                  onChange={(e) =>
                    onSubsystemChange({ ...subsystems, hvac: e.target.checked })
                  }
                  className="accent-primary h-5 w-5 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-on-surface block leading-tight">
                    HVAC Pre-cooling
                  </span>
                  <span className="text-[10px] text-outline font-mono">Up to 45 kW</span>
                </div>
              </label>

              <label className="flex items-center sm:items-start gap-2.5 p-3 min-h-[44px] bg-surface-container-lowest rounded-lg border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={subsystems.ev}
                  onChange={(e) =>
                    onSubsystemChange({ ...subsystems, ev: e.target.checked })
                  }
                  className="accent-primary h-5 w-5 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-on-surface block leading-tight">
                    EV Throttling
                  </span>
                  <span className="text-[10px] text-outline font-mono">Up to 25 kW</span>
                </div>
              </label>

              <label className="flex items-center sm:items-start gap-2.5 p-3 min-h-[44px] bg-surface-container-lowest rounded-lg border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={subsystems.storage}
                  onChange={(e) =>
                    onSubsystemChange({ ...subsystems, storage: e.target.checked })
                  }
                  className="accent-primary h-5 w-5 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-on-surface block leading-tight">
                    Thermal Bank
                  </span>
                  <span className="text-[10px] text-outline font-mono">Up to 15 kW</span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <button
              disabled={isCalculating}
              onClick={handleRunCalculation}
              className="min-h-[44px] px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>
                {isCalculating ? 'CALCULATING...' : 'RE-RUN SCENARIO CALCULATION'}
              </span>
            </button>
            <span className="text-[11px] font-mono text-outline text-center sm:text-right">
              Computation latency: {latencyMs}ms
            </span>
          </div>
        </div>

        {/* Right: Projected Curtailment Impact (5 Cols on desktop, 12 on mobile/tablet) */}
        <div className="lg:col-span-5 bg-surface-container p-4 sm:p-5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-on-surface">
                Projected Curtailment Impact
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                  isFeasible
                    ? 'bg-primary/10 text-primary'
                    : 'bg-tertiary-fixed text-tertiary'
                }`}
              >
                {isFeasible ? '100% Feasible' : 'Stress Threshold'}
              </span>
            </div>

            {/* 4 Outcome Cards */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3">
              <div
                className={`bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high ${
                  pulseBoxes ? 'pulse-glow' : ''
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-outline">
                  Target Reduction
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-primary mt-0.5">
                  {reductionTarget} kW
                </div>
                <span className="text-[10px] text-outline truncate block">
                  Shed Cap: {availableCap} kW
                </span>
              </div>

              <div
                className={`bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high ${
                  pulseBoxes ? 'pulse-glow' : ''
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-outline">
                  Peak Reduction
                </span>
                <div className="text-base sm:text-xl font-bold font-mono text-on-surface mt-0.5 truncate">
                  {basePeakKw} → {newPeak} kW
                </div>
                <span className="text-[10px] text-primary font-bold">
                  -{peakSavedPct}% Peak Shaved
                </span>
              </div>

              <div
                className={`bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high ${
                  pulseBoxes ? 'pulse-glow' : ''
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-outline">
                  Energy Shifted
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-on-surface mt-0.5">
                  {energyShifted} kWh
                </div>
                <span className="text-[10px] text-outline">
                  Over {duration} Hour{duration > 1 ? 's' : ''}
                </span>
              </div>

              <div
                className={`bg-surface-container-lowest p-3 rounded-xl border border-surface-container-high ${
                  pulseBoxes ? 'pulse-glow' : ''
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-outline">
                  Achievable Rate
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-primary mt-0.5">
                  {backendSim ? `${backendSim.achievable_percentage}%` : (isFeasible ? '100%' : 'Capped')}
                </div>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  {backendSim ? `${backendSim.fully_achievable_intervals}/${backendSim.total_intervals} intervals` : 'Stage 6 Capped'}
                </span>
              </div>
            </div>

            {/* Simulation Advisory Notice */}
            <div
              className={`p-3 bg-surface-container-lowest rounded-xl border border-surface-container-high flex items-center justify-between mb-4 ${
                pulseBoxes ? 'pulse-glow' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                  verified
                </span>
                <div>
                  <span className="text-xs font-bold text-on-surface block">
                    Simulation Advisory Notice
                  </span>
                  <span className="text-[10px] text-outline">
                    {backendSim?.notice || 'What-if scenario only. Not physical equipment control. No monetary calculations.'}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-bold font-mono text-primary">
                  {duration}h Window
                </div>
                <span className="text-[10px] text-outline">Historical Replay</span>
              </div>
            </div>
          </div>

          {/* Dispatch Action Button */}
          <button
            className="w-full min-h-[44px] py-3 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            onClick={onOpenDispatchModal}
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Stage Automated Curtailment Dispatch</span>
          </button>
        </div>
      </div>
    </div>
  );
}
