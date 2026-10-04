'use client';

import React, { useState } from 'react';
import { SHIFT_CHALLENGES } from '../../data/occupantData';

interface ShiftChallengesProps {
  onCompleteChallenge: (id: string, title: string) => void;
}

export default function ShiftChallenges({ onCompleteChallenge }: ShiftChallengesProps) {
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  const handleActionClick = (id: string, title: string) => {
    setCompletedMap((prev) => ({ ...prev, [id]: true }));
    onCompleteChallenge(id, title);
  };

  return (
    <section className="flex flex-col gap-3" id="shift">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary text-[20px]">
            electric_bolt
          </span>
          <h4 className="font-headline-sm text-headline-sm text-on-surface">
            Shift &amp; Save Challenges
          </h4>
        </div>
        <span className="font-label-sm text-label-sm text-tertiary-container bg-tertiary-fixed/40 px-2.5 py-0.5 rounded-full font-semibold">
          2 Actions Available
        </span>
      </div>

      {SHIFT_CHALLENGES.map((ch) => {
        const isCompleted = !!completedMap[ch.id];
        return (
          <div
            key={ch.id}
            className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/60 flex flex-col gap-3 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ch.iconBgClass}`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {ch.icon}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-body-md font-semibold text-on-surface">
                  {ch.title}
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {ch.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-container-high/40">
              <div className="flex items-center gap-2 text-primary font-label-md text-label-md font-semibold">
                <span>{ch.rewardText}</span>
                <span>•</span>
                <span>{ch.impactText}</span>
              </div>

              <button
                disabled={isCompleted}
                className={`min-h-[44px] px-4 py-2 rounded-lg font-body-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                  isCompleted
                    ? 'bg-surface-container-high text-primary pointer-events-none'
                    : 'bg-primary text-on-primary hover:bg-primary-container active:scale-95'
                }`}
                onClick={() => handleActionClick(ch.id, ch.title)}
              >
                {isCompleted && (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                )}
                <span>{isCompleted ? ch.completedLabel : ch.actionLabel}</span>
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
