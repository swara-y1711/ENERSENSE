'use client';

import React from 'react';
import { BuildingOption } from '../data/facilityData';

interface SubmeterDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBuilding: BuildingOption | null;
}

export default function SubmeterDrawerModal({
  isOpen,
  onClose,
  activeBuilding,
}: SubmeterDrawerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md sm:max-w-lg bg-surface-container-lowest shadow-2xl p-4 sm:p-6 flex flex-col justify-between overflow-y-auto z-10">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-surface-container-high">
              <div>
                <h3 className="text-base font-bold text-on-surface">
                  Submeter Availability
                </h3>
                <p className="text-xs text-outline">
                  {activeBuilding?.name ?? 'Awaiting backend data'}
                </p>
              </div>
              <button
                aria-label="Close drawer"
                className="p-2 rounded-lg hover:bg-surface-container text-outline cursor-pointer"
                onClick={onClose}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="my-4 min-h-48 flex items-center justify-center rounded-xl bg-surface-container-low p-5 text-center text-xs text-outline">
              Submeter readings and subsystem breakdowns are not available in this historical replay.
            </div>
          </div>

          <div className="pt-4 border-t border-surface-container-high flex justify-between items-center text-xs">
            <span className="text-outline">Source: I-BLEND historical replay</span>
            <button
              className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-lg text-xs min-h-[40px] cursor-pointer"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
