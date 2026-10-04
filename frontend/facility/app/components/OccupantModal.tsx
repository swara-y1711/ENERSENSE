'use client';

import React, { useState } from 'react';

interface OccupantModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export default function OccupantModal({
  isOpen,
  onClose,
  showToast,
}: OccupantModalProps) {
  const [temp, setTemp] = useState(24.0);
  const [evShifted, setEvShifted] = useState(true);

  if (!isOpen) return null;

  const handleTempUp = () => {
    if (temp < 26.0) {
      const next = parseFloat((temp + 0.5).toFixed(1));
      setTemp(next);
      showToast(`Pod 4B thermostat adjusted to ${next.toFixed(1)}°C`);
    }
  };

  const handleTempDown = () => {
    if (temp > 21.0) {
      const next = parseFloat((temp - 0.5).toFixed(1));
      setTemp(next);
      showToast(`Pod 4B thermostat adjusted to ${next.toFixed(1)}°C`);
    }
  };

  const handleEvToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setEvShifted(checked);
    showToast(
      `Stall #14 EV charging: ${
        checked ? 'Shifted (Peak Shaving Armed)' : 'Active (Charging immediately)'
      }`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-surface-container-lowest rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-surface-container-high z-10 text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">
                smartphone
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-on-surface leading-tight">
                Occupant Eco-Portal Simulator
              </h3>
              <p className="text-[10px] text-outline font-mono">Pod 4B • Floor 3 Spine</p>
            </div>
          </div>
          <button
            aria-label="Close modal"
            className="p-1 text-outline hover:text-on-surface rounded-lg hover:bg-surface-container cursor-pointer"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-0.5 custom-scrollbar">
          {/* Peak Event Alert Pill */}
          <div className="p-2.5 rounded-xl bg-tertiary-fixed/30 border-l-2 border-tertiary flex items-start gap-2">
            <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5">
              energy_savings_leaf
            </span>
            <div>
              <span className="font-bold text-xs text-tertiary block">
                Shift &amp; Save Window (18:00 - 21:00)
              </span>
              <span className="text-[10px] text-on-surface-variant leading-tight block">
                Facility peak event active. Opt-in rewards: +150 GreenCredits.
              </span>
            </div>
          </div>

          {/* Micro-climate Controller */}
          <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container-high">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[16px]">
                  thermostat
                </span>{' '}
                Workstation Micro-Climate
              </span>
              <span className="text-xs font-mono font-bold text-primary">
                {temp.toFixed(1)}°C
              </span>
            </div>

            <div className="flex items-center gap-2 my-2">
              <button
                className="w-10 h-10 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface font-bold text-base flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all cursor-pointer"
                onClick={handleTempDown}
              >
                -
              </button>
              <div className="flex-1 text-center font-mono text-[11px] text-outline">
                Eco Target Range: 23.5°C - 25.0°C
              </div>
              <button
                className="w-10 h-10 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface font-bold text-base flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all cursor-pointer"
                onClick={handleTempUp}
              >
                +
              </button>
            </div>

            <div className="flex justify-between items-center text-[10px] text-outline pt-1 border-t border-surface-container-high">
              <span>
                Pod Air Quality: <strong className="text-primary">412 ppm CO₂</strong>
              </span>
              <span>
                Comfort: <strong className="text-secondary">Optimal</strong>
              </span>
            </div>
          </div>

          {/* EV Smart Shift Toggle */}
          <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container-high flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-secondary text-[20px]">
                ev_station
              </span>
              <div>
                <span className="text-xs font-bold text-on-surface block">
                  EV Stall #14 Shift
                </span>
                <span className="text-[10px] text-outline">Pause charge till 21:00</span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={evShifted}
                onChange={handleEvToggle}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-container-high after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Green Badge Card */}
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  military_tech
                </span>{' '}
                Tenant Green Badge
              </span>
              <span className="font-mono font-bold text-primary">
                Tier: Gold (940 pts)
              </span>
            </div>
            <p className="text-[10px] text-on-surface-variant">
              By accommodating +0.5°C drift during peak window, Block B prevents 92 kg carbon today.
            </p>
          </div>
        </div>

        {/* Switch Back Button */}
        <div className="pt-4 border-t border-surface-container-high mt-3">
          <button
            className="w-full min-h-[44px] py-2.5 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[16px]">
              dashboard
            </span>
            <span>Return to Facility Manager View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
