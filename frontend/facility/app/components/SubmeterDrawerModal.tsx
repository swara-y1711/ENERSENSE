'use client';

import React, { useState } from 'react';
import { ALL_SUBMETERS, BuildingOption } from '../data/facilityData';

interface SubmeterDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBuilding: BuildingOption;
}

export default function SubmeterDrawerModal({
  isOpen,
  onClose,
  activeBuilding,
}: SubmeterDrawerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredMeters = ALL_SUBMETERS.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  All 32 Submeters Telemetry
                </h3>
                <p className="text-xs text-outline">
                  {activeBuilding.shortName} breaker topology
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

            {/* Search Input */}
            <div className="my-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search submeter by name or panel..."
                className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary border border-surface-container-high"
              />
            </div>

            {/* Meter List */}
            <div className="space-y-2">
              {filteredMeters.length === 0 ? (
                <div className="text-xs text-outline text-center py-6">
                  No submeters found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredMeters.map((m) => {
                  const isCritical = m.prio === 'Critical' || m.prio === 'Protected';
                  return (
                    <div
                      key={m.id}
                      className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between text-xs hover:bg-surface-container transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-surface-container-lowest font-mono font-bold text-outline flex items-center justify-center shrink-0">
                          {m.id}
                        </span>
                        <div className="truncate">
                          <div className="font-bold text-on-surface truncate">
                            {m.name}
                          </div>
                          <div className="text-[10px] text-outline">
                            {m.cat} • PF: {m.pf}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="font-mono font-bold text-on-surface">
                          {m.kw} kW
                        </div>
                        <span
                          className={`text-[10px] font-semibold ${
                            isCritical ? 'text-outline' : 'text-primary'
                          }`}
                        >
                          {m.prio}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-surface-container-high flex justify-between items-center text-xs">
            <span className="text-outline">Sync rate: 200ms</span>
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
