'use client';

import React from 'react';

interface DispatchConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reductionTarget: number;
  duration: number;
  onConfirmDispatch: () => void;
}

export default function DispatchConfirmationModal({
  isOpen,
  onClose,
  reductionTarget,
  duration,
  onConfirmDispatch,
}: DispatchConfirmationModalProps) {
  if (!isOpen) return null;

  const energyShifted = Math.round(reductionTarget * duration * 0.85);
  const netSavings = energyShifted * 110;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-surface-container-lowest rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-surface-container-high z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <span className="material-symbols-outlined text-[22px]">bolt</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-on-surface">
              Confirm Grid Dispatch Curtailment
            </h3>
            <p className="text-xs text-outline">
              Transmit automated command to BACnet/IP
            </p>
          </div>
        </div>

        <div className="p-3 bg-surface-container-low rounded-xl text-xs space-y-1.5 mb-4">
          <div className="flex justify-between">
            <span className="text-outline">Target Reduction:</span>
            <span className="font-bold text-primary font-mono">
              {reductionTarget} kW
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-outline">Peak Window:</span>
            <span className="font-bold">18:00 – 21:00 IST</span>
          </div>
          <div className="flex justify-between">
            <span className="text-outline">Projected Net Credit:</span>
            <span className="font-bold text-primary font-mono">
              ₹{netSavings.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:bg-surface-container cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary-container cursor-pointer"
            onClick={onConfirmDispatch}
          >
            Arm &amp; Dispatch
          </button>
        </div>
      </div>
    </div>
  );
}
