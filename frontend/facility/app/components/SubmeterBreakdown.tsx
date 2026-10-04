'use client';

import React from 'react';

interface SubmeterBreakdownProps {
  onOpenDrawer: () => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
  activeKw: number | null;
}

export default function SubmeterBreakdown({
  onOpenDrawer,
  showToast,
  activeKw,
}: SubmeterBreakdownProps) {
  return (
    <div className="lg:col-span-4 bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-xs border border-surface-container-high flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-on-surface">
              Submeter Breakdown
            </h3>
            <p className="text-xs text-outline">Subsystem-level load is not provided by the replay API</p>
          </div>
          <span className="px-2 py-0.5 bg-surface-container-high rounded text-xs font-mono font-bold">
            {typeof activeKw === 'number' ? `${activeKw.toFixed(2)} kW Total` : 'Not available'}
          </span>
        </div>

        <div className="min-h-48 flex items-center justify-center p-4 bg-surface-container-low rounded-xl text-center">
          <div>
            <span className="material-symbols-outlined text-outline text-[28px]">
              electric_meter
            </span>
            <p className="text-xs text-outline mt-2">
              Awaiting subsystem telemetry from an available backend endpoint.
            </p>
          </div>
        </div>
      </div>

      {/* Button to open drawer */}
      <button
        className="w-full mt-4 py-2.5 bg-surface-container-high hover:bg-surface-container text-on-surface font-semibold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors min-h-[44px] cursor-pointer"
        onClick={() => {
          showToast('Submeter detail is not available from the replay API.');
          onOpenDrawer();
        }}
      >
        <span>View Submeter Availability</span>
        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
      </button>
    </div>
  );
}
