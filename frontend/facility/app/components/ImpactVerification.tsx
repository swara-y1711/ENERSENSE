'use client';

import React from 'react';
import { AuditLogItem } from '../data/facilityData';

interface ImpactVerificationProps {
  logs: AuditLogItem[];
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export default function ImpactVerification({
  logs,
  showToast,
}: ImpactVerificationProps) {
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
              Verification &amp; Governance
            </h3>
          </div>
          <p className="text-xs text-outline">
            Backtested 30-day verified curtailment telemetry audited against BESCOM utility metering.
          </p>

          <div className="space-y-2 pt-2">
            <div
              className="p-2.5 bg-surface-container-low rounded-lg flex justify-between text-xs cursor-pointer hover:bg-surface-container transition-colors"
              onClick={() => showToast('Total curtailment sessions: 28 events recorded.')}
            >
              <span className="text-outline">Total Load Shifted</span>
              <span className="font-mono font-bold">18.4 MWh</span>
            </div>

            <div
              className="p-2.5 bg-surface-container-low rounded-lg flex justify-between text-xs cursor-pointer hover:bg-surface-container transition-colors"
              onClick={() => showToast('Tariff savings credited in billing cycle #9928.')}
            >
              <span className="text-outline">Verified Tariff Savings</span>
              <span className="font-mono font-bold text-primary">₹1,84,200</span>
            </div>

            <div
              className="p-2.5 bg-surface-container-low rounded-lg flex justify-between text-xs cursor-pointer hover:bg-surface-container transition-colors"
              onClick={() => showToast('ASHRAE Standard 55 thermal comfort compliance upheld.')}
            >
              <span className="text-outline">Occupant Comfort SLA</span>
              <span className="font-mono font-bold text-secondary">
                99.4% Compliant
              </span>
            </div>

            <div
              className="p-2.5 bg-surface-container-low rounded-lg flex justify-between text-xs cursor-pointer hover:bg-surface-container transition-colors"
              onClick={() => showToast('Mean latency from ISO openADR dispatch signal to relay actuation.')}
            >
              <span className="text-outline">Mean Response Time</span>
              <span className="font-mono font-bold">4m 12s</span>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0">
            workspace_premium
          </span>
          <div>
            <span className="text-xs font-bold text-on-surface block">
              Utility Grid Interconnect SLA
            </span>
            <span className="text-[10px] text-outline">
              Demand response settlement grade: A+
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
                Recent Dispatch Verification Logs
              </h3>
              <p className="text-xs text-outline">
                Cryptographically hashed settlement events sent to ISO dispatch
              </p>
            </div>
            <span className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-mono text-outline uppercase font-semibold shrink-0">
              Immutable Trail
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
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-surface-container-low transition-colors cursor-pointer"
                    onClick={() => showToast(log.toastNote)}
                  >
                    <td className="py-2.5 px-3 font-bold text-on-surface">
                      {log.id}
                    </td>
                    <td className="py-2.5 px-3 text-outline">{log.window}</td>
                    <td className="py-2.5 px-3">
                      {log.committedKw.toFixed(1)} kW
                    </td>
                    <td className="py-2.5 px-3 font-bold text-primary">
                      {typeof log.deliveredKw === 'number'
                        ? `${log.deliveredKw.toFixed(1)} kW`
                        : log.deliveredKw}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                        {log.compliancePct}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-primary flex items-center gap-1 font-sans text-xs">
                      <span className="material-symbols-outlined text-[14px]">
                        {log.icon}
                      </span>
                      {log.statusNote}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-surface-container-high text-xs text-outline">
          <span>Showing recent historical dispatch audits</span>
          <button
            className="text-primary font-bold hover:underline text-left sm:text-right cursor-pointer"
            onClick={() => showToast('Compiling comprehensive ISO verification PDF...', 'success')}
          >
            Download Verification PDF
          </button>
        </div>
      </div>
    </div>
  );
}
