'use client';

import React from 'react';
import { CompletedImpactSimulation, ImpactCurrent } from '../lib/api';

interface ImpactVerificationProps {
  impact: ImpactCurrent | null;
  simulation: CompletedImpactSimulation | null;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export default function ImpactVerification({
  impact,
  simulation,
  showToast,
}: ImpactVerificationProps) {
  const formatValue = (value: number | null | undefined, unit: string) =>
    typeof value === 'number' && Number.isFinite(value)
      ? `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`
      : 'Not available';
  const simulationValue = (value: number, unit: string) =>
    formatValue(value, unit);
  const impactMatchesSimulation =
    !simulation ||
    (impact?.timestamp &&
      new Date(impact.timestamp).getTime() ===
        new Date(simulation.replayTimestamp).getTime());
  const asOfTimestamp = simulation?.replayTimestamp ?? impact?.timestamp;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
      <div className="lg:col-span-4 bg-surface-container-lowest p-4 sm:p-5 rounded-xl border border-surface-container-high shadow-xs flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              verified
            </span>
            <h3 className="text-sm font-bold text-on-surface">
              Replay Impact Context
            </h3>
          </div>
          <p className="text-xs text-outline">
            I-BLEND Historical Replay context and advisory simulation results. No live telemetry, physical dispatch, or measured savings are represented.
          </p>

          <div className="space-y-2 pt-2">
            <MetricRow
              label="Potential Reduction"
              value={simulation
                ? formatValue(simulation.flexibleDemandKw, 'kW')
                : formatValue(impact?.potential_flexible_kw, 'kW')}
            />
            <MetricRow
              label="Actual Demand · Simulation"
              value={simulation ? simulationValue(simulation.actualDemandKw, 'kW') : '— Run simulation'}
            />
            <MetricRow
              label="Applied Reduction"
              value={simulation ? simulationValue(simulation.appliedReductionKw, 'kW') : '— Run simulation'}
            />
            <MetricRow
              label="Scenario Demand"
              value={simulation ? simulationValue(simulation.scenarioDemandKw, 'kW') : '— Run simulation'}
            />
            <MetricRow
              label="Estimated Energy Reduction"
              value={simulation
                ? simulationValue(simulation.result.total_simulated_reduction_kwh, 'kWh')
                : '— Run simulation'}
              emphasize
            />
            <MetricRow
              label="Historical Baseline Demand"
              value={simulation
                ? formatValue(simulation.result.average_baseline_demand_kw, 'kW')
                : formatValue(impact?.baseline_demand_kw, 'kW')}
            />
            <MetricRow
              label="Impact Method"
              value={simulation?.result.mode ?? (impactMatchesSimulation
                ? impact?.method ?? 'Not available'
                : 'Not available')}
            />
          </div>
        </div>

        <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0">
            workspace_premium
          </span>
          <div>
            <span className="text-xs font-bold text-on-surface block">
              Historical Replay Source
            </span>
            <span className="text-[10px] text-outline">
              I-BLEND Historical Replay · {asOfTimestamp ?? 'Not available'}
            </span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 bg-surface-container-lowest p-4 sm:p-5 rounded-xl border border-surface-container-high shadow-xs flex flex-col justify-between overflow-hidden">
        <div>
          <div className="flex items-center justify-between mb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                What-If Simulation Result
              </h3>
              <p className="text-xs text-outline">
                {simulation
                  ? `Simulation based on I-BLEND Historical Replay at ${simulation.replayTimestamp}.`
                  : 'Run a simulation to view its calculated result. No verification endpoint is provided by the backend.'}
              </p>
            </div>
            <span className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-mono text-outline uppercase font-semibold shrink-0">
              {simulation ? 'SIMULATED' : 'No simulation'}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar -mx-2 sm:mx-0 px-2 sm:px-0">
            <table className="w-full text-left text-xs min-w-[560px]">
              <thead>
                <tr className="bg-surface-container-low text-outline font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3 rounded-l">Record</th>
                  <th className="py-2.5 px-3">Window</th>
                  <th className="py-2.5 px-3">Requested</th>
                  <th className="py-2.5 px-3">Applied</th>
                  <th className="py-2.5 px-3 rounded-r">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high font-mono">
                {simulation ? (
                  <tr>
                    <td className="py-2.5 px-3">What-if simulation</td>
                    <td className="py-2.5 px-3">
                      {simulation.result.start_timestamp} – {simulation.result.end_timestamp}
                    </td>
                    <td className="py-2.5 px-3">
                      {formatValue(simulation.requestedReductionKw, 'kW')}
                    </td>
                    <td className="py-2.5 px-3">
                      {formatValue(simulation.appliedReductionKw, 'kW')}
                    </td>
                    <td className="py-2.5 px-3">SIMULATED</td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 px-3 text-center text-outline">
                      No simulation run has been recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-surface-container-high text-xs text-outline">
          <span>Source: I-BLEND Historical Replay · backend impact model</span>
          <button
            className="text-primary font-bold hover:underline text-left sm:text-right"
            onClick={() => showToast('Simulation export is not available from the backend.')}
          >
            Export unavailable
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="p-2.5 bg-surface-container-low rounded-lg flex justify-between text-xs gap-3">
      <span className="text-outline">{label}</span>
      <span className={`font-mono font-bold text-right ${emphasize ? 'text-primary' : ''}`}>
        {value}
      </span>
    </div>
  );
}
