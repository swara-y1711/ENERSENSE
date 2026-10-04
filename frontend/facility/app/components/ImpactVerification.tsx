'use client';

import React from 'react';
import { ImpactCurrent } from '../lib/api';

interface ImpactVerificationProps {
  impact: ImpactCurrent | null;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export default function ImpactVerification({
  impact,
  showToast,
}: ImpactVerificationProps) {
  const formatValue = (value: number | null | undefined, unit: string) =>
    typeof value === 'number'
      ? `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${unit}`
      : 'Not available';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
      {/* Verification Summary (4 Cols on desktop, 12 on mobile/tablet) */}
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
            Backend-reported historical replay and what-if impact metrics. Estimates are not measured savings or dispatched load.
          </p>

          <div className="space-y-2 pt-2">
            <div
              className="p-2.5 bg-surface-container-low rounded-lg flex justify-between text-xs"
            >
              <span className="text-outline">Potential Reduction</span>
              <span className="font-mono font-bold">{formatValue(impact?.potential_reduction_kw, 'kW')}</span>
            </div>

            <div
              className="p-2.5 bg-surface-container-low rounded-lg flex justify-between text-xs"
            >
              <span className="text-outline">Estimated Energy Impact</span>
              <span className="font-mono font-bold text-primary">{formatValue(impact?.estimated_energy_impact_kwh, 'kWh')}</span>
            </div>

            <div
              className="p-2.5 bg-surface-container-low rounded-lg flex justify-between text-xs"
            >
              <span className="text-outline">Historical Baseline Demand</span>
              <span className="font-mono font-bold text-secondary">{formatValue(impact?.baseline_demand_kw, 'kW')}</span>
            </div>

            <div
              className="p-2.5 bg-surface-container-low rounded-lg flex justify-between text-xs"
            >
              <span className="text-outline">Impact Method</span>
              <span className="font-mono font-bold">{impact?.method ?? 'Awaiting model data'}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0">
            workspace_premium
          </span>
          <div>
            <span className="text-xs font-bold text-on-surface block">
              Backend Notice
            </span>
            <span className="text-[10px] text-outline">
              {impact?.notice ?? 'Awaiting model data'}
            </span>
          </div>
        </div>
      </div>

      {/* Audit Table (8 Cols on desktop, 12 on mobile/tablet) */}
      <div className="lg:col-span-8 bg-surface-container-lowest p-4 sm:p-5 rounded-xl border border-surface-container-high shadow-xs flex flex-col justify-between overflow-hidden">
        <div>
          <div className="flex items-center justify-between mb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                Replay Verification Records
              </h3>
              <p className="text-xs text-outline">
                Dispatch and settlement logs are not provided by the replay API.
              </p>
            </div>
            <span className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-mono text-outline uppercase font-semibold shrink-0">
              No dispatch logs
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar -mx-2 sm:mx-0 px-2 sm:px-0">
            <table className="w-full text-left text-xs min-w-[560px]">
              <thead>
                <tr className="bg-surface-container-low text-outline font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3 rounded-l">Event ID</th>
                  <th className="py-2.5 px-3">Dispatch Window</th>
                  <th className="py-2.5 px-3">Committed</th>
                  <th className="py-2.5 px-3">Delivered</th>
                  <th className="py-2.5 px-3">Compliance</th>
                  <th className="py-2.5 px-3 rounded-r">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high font-mono">
                <tr>
                  <td colSpan={6} className="py-8 px-3 text-center text-outline">
                    No dispatch verification records are available.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-surface-container-high text-xs text-outline">
          <span>Source: I-BLEND historical replay</span>
          <button
            className="text-primary font-bold hover:underline text-left sm:text-right cursor-pointer"
            onClick={() => showToast('Audit export is not available from the replay API.')}
          >
            Audit export unavailable
          </button>
        </div>
      </div>
    </div>
  );
}
