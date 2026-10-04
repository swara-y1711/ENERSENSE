'use client';

import React, { useState } from 'react';
import { OccupantProfile } from '../../data/occupantData';

interface MicroClimateCardProps {
  profile: OccupantProfile;
  currentTemp: number;
  onSetPodMode: (mode: 'eco' | 'balanced' | 'cool') => void;
  onVoteComfort: (feeling: string) => void;
}

export default function MicroClimateCard({
  profile,
  currentTemp,
  onSetPodMode,
  onVoteComfort,
}: MicroClimateCardProps) {
  const [activeMode, setActiveMode] = useState<'eco' | 'balanced' | 'cool'>('balanced');
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);
  const [modelUpdated, setModelUpdated] = useState(false);

  const handleModeChange = (mode: 'eco' | 'balanced' | 'cool') => {
    setActiveMode(mode);
    onSetPodMode(mode);
  };

  const handleFeedbackChange = (feeling: string) => {
    setActiveFeedback(feeling);
    setModelUpdated(true);
    onVoteComfort(feeling);
  };

  return (
    <section className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/60 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-fixed/30 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">hvac</span>
          </div>
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface">
              Workstation {profile.podId} Micro-Climate
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Target setpoint and comfort preference
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="font-metric-display text-metric-display text-primary block leading-none">
            {currentTemp.toFixed(1)}°C
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Telemetry Replay
          </span>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex flex-col sm:flex-row p-1.5 rounded-xl bg-surface-container-low gap-1.5">
        <button
          className={`min-h-[44px] flex-1 py-2 px-3 rounded-lg font-headline-sm text-body-sm flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeMode === 'eco'
              ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
              : 'text-on-surface-variant font-medium hover:bg-surface-container'
          }`}
          onClick={() => handleModeChange('eco')}
        >
          <span>+0.5°C Eco</span>
          <span className="font-label-sm text-label-sm opacity-80">-6% Energy</span>
        </button>

        <button
          className={`min-h-[44px] flex-1 py-2 px-3 rounded-lg font-headline-sm text-body-sm flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeMode === 'balanced'
              ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
              : 'text-on-surface-variant font-medium hover:bg-surface-container'
          }`}
          onClick={() => handleModeChange('balanced')}
        >
          <span>24°C Balanced</span>
          <span className="font-label-sm text-label-sm text-primary">Optimal Comfort</span>
        </button>

        <button
          className={`min-h-[44px] flex-1 py-2 px-3 rounded-lg font-headline-sm text-body-sm flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeMode === 'cool'
              ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
              : 'text-on-surface-variant font-medium hover:bg-surface-container'
          }`}
          onClick={() => handleModeChange('cool')}
        >
          <span>-0.5°C Fresh</span>
          <span className="font-label-sm text-label-sm opacity-80">+4% Energy</span>
        </button>
      </div>

      {/* Feedback Section */}
      <div className="p-3.5 rounded-xl bg-surface-container/70 border border-surface-container-high/40 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="font-body-sm text-body-sm font-medium text-on-surface">
            How does your pod feel right now?
          </span>
          {modelUpdated && (
            <span className="font-label-sm text-label-sm text-primary font-semibold animate-fade-in">
              AI Model Updated!
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Too Cold', emoji: '❄️' },
            { label: 'Just Right', emoji: '👍' },
            { label: 'Too Warm', emoji: '☀️' },
          ].map((item) => {
            const isSelected = activeFeedback === item.label;
            return (
              <button
                key={item.label}
                className={`min-h-[44px] py-2 px-2 rounded-lg font-body-sm font-medium flex items-center justify-center gap-1.5 transition-all border border-surface-container-high/40 active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-on-primary font-semibold shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
                }`}
                onClick={() => handleFeedbackChange(item.label)}
              >
                <span>{item.emoji} {item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
