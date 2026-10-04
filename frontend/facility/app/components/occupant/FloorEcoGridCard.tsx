'use client';

import React, { useState } from 'react';

interface FloorEcoGridCardProps {
  onRedeemVoucher: () => void;
}

export default function FloorEcoGridCard({ onRedeemVoucher }: FloorEcoGridCardProps) {
  const [redeemed, setRedeemed] = useState(false);

  const handleRedeemClick = () => {
    setRedeemed(true);
    onRedeemVoucher();
  };

  return (
    <section
      className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/60 flex flex-col gap-4"
      id="impact"
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-headline-sm text-headline-sm text-on-surface">
            Olympus Block B Eco Grid
          </h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Collective floor effort today
          </p>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold shadow-sm">
          <span className="material-symbols-outlined text-[15px]">
            military_tech
          </span>
          <span>Rank #2 Floor</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between font-label-sm text-label-sm">
          <span className="text-on-surface-variant">
            Floor 4 Daily Goal: 180 kWh Saved
          </span>
          <span className="text-primary font-bold">78% Reached</span>
        </div>
        <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden flex">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: '78%' }}
          ></div>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[22px]">
              local_cafe
            </span>
          </div>
          <div>
            <span className="font-body-md text-body-md font-semibold text-on-surface block leading-tight">
              240 EcoCredits
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Redeem at Campus Cafe
            </span>
          </div>
        </div>

        <button
          disabled={redeemed}
          className={`min-h-[44px] px-3.5 py-1.5 rounded-lg font-label-sm font-semibold transition-all cursor-pointer ${
            redeemed
              ? 'bg-surface-container-high text-primary pointer-events-none'
              : 'bg-tertiary text-on-tertiary hover:bg-tertiary-container'
          }`}
          onClick={handleRedeemClick}
        >
          {redeemed ? 'Redeemed ✓' : 'Redeem'}
        </button>
      </div>

      <div className="pt-2 border-t border-surface-container-high/40 flex items-center justify-between text-xs text-on-surface-variant">
        <span>🏆 Floor 4 Leaderboard</span>
        <span className="font-semibold text-primary">Pod 4B: #3 in Zone</span>
      </div>
    </section>
  );
}
