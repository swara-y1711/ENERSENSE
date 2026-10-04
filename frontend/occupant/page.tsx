'use client';

import React, { useState } from 'react';
import OccupantHeader from '../components/occupant/OccupantHeader';
import OccupantPodBanner from '../components/occupant/OccupantPodBanner';
import ComfortKpiCards from '../components/occupant/ComfortKpiCards';
import PeakDemandBanner from '../components/occupant/PeakDemandBanner';
import MicroClimateCard from '../components/occupant/MicroClimateCard';
import ShiftChallenges from '../components/occupant/ShiftChallenges';
import FloorEcoGridCard from '../components/occupant/FloorEcoGridCard';
import PodEnergyChart from '../components/occupant/PodEnergyChart';
import BuildingGridCard from '../components/occupant/BuildingGridCard';
import FmViewSection from '../components/occupant/FmViewSection';
import OccupantMobileNav from '../components/occupant/OccupantMobileNav';
import ToastContainer, { ToastMessage } from '../components/ToastContainer';

import {
  INITIAL_OCCUPANT_PROFILE,
  INITIAL_COMFORT_METRICS,
  INITIAL_PEAK_CHALLENGE,
  OccupantProfile,
  ComfortMetrics,
  PeakDemandChallenge,
} from '../data/occupantData';

export default function OccupantDashboard() {
  const [profile] = useState<OccupantProfile>(INITIAL_OCCUPANT_PROFILE);
  const [metrics] = useState<ComfortMetrics>(INITIAL_COMFORT_METRICS);
  const [challenge] = useState<PeakDemandChallenge>(INITIAL_PEAK_CHALLENGE);

  const [activeRole, setActiveRole] = useState<'Occupant' | 'FM'>('Occupant');
  const [activeTab, setActiveTab] = useState<string>('comfort');
  const [currentTemp, setCurrentTemp] = useState<number>(24.0);

  // Toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (msg: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, msg, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers
  const handleNudgeTemp = (delta: number) => {
    const next = currentTemp + delta * 0.5;
    setCurrentTemp(next);
    showToast(
      `Comfort Shift Scheduled: Pod 4B setpoint adjusted to ${next.toFixed(1)}°C.`,
      'success'
    );
  };

  const handleRequestBoost = () => {
    showToast('Airflow Boost Active: Diffuser stepped up 25% for 15 minutes.', 'success');
  };

  const handleScheduleEV = () => {
    showToast(
      'EV Charging Scheduled: Stall B-12 set to initiate charging at 9:15 PM off-peak.',
      'success'
    );
  };

  const handleSnooze = () => {
    showToast('Recommendation Snoozed: We will gently check in again at 5:00 PM.');
  };

  const handleSetPodMode = (mode: 'eco' | 'balanced' | 'cool') => {
    if (mode === 'eco') {
      setCurrentTemp(24.5);
      showToast('Eco Mode Selected: +0.5°C drift saves 6% cooling power.', 'success');
    } else if (mode === 'cool') {
      setCurrentTemp(23.5);
      showToast('Fresh Mode Selected: Target set to 23.5°C with enhanced ventilation flow.', 'info');
    } else {
      setCurrentTemp(24.0);
      showToast('Balanced Comfort: Reset to baseline 24.0°C.', 'info');
    }
  };

  const handleVoteComfort = (feeling: string) => {
    showToast(`Comfort Model Updated: Noted feeling "${feeling}". AI pod thermostat adapted.`, 'success');
  };

  const handleCompleteChallenge = (id: string, title: string) => {
    if (id === 'departure') {
      showToast('Pod Powered Down: External monitors turned off. ₹8.50 credited!', 'success');
    } else {
      showToast('Zone 4A Desk Assigned: Seat 4A-12 booked. +30 EcoCredits added!', 'success');
    }
  };

  const handleRedeemVoucher = () => {
    showToast('Eco Voucher Generated: ₹120 Cafe discount code sent to campus pass code #ECO-882.', 'success');
  };

  return (
    <div className="bg-surface font-sans text-on-surface antialiased flex flex-col min-h-screen">
      {/* Occupant Header */}
      <OccupantHeader
        profile={profile}
        activeRole={activeRole}
        onToggleRole={setActiveRole}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full pt-28 md:pt-32 bg-surface">
        {activeRole === 'Occupant' ? (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 md:pb-16">
            {/* Workstation Pod Banner */}
            <OccupantPodBanner profile={profile} />

            {/* Comfort KPI Cards */}
            <ComfortKpiCards
              profile={{ ...profile, currentTemp }}
              metrics={metrics}
              onNudgeTemp={handleNudgeTemp}
              onRequestBoost={handleRequestBoost}
            />

            {/* Peak Demand Action Banner */}
            <PeakDemandBanner
              challenge={challenge}
              onScheduleEV={handleScheduleEV}
              onSnooze={handleSnooze}
            />

            {/* Main 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (7 Cols on desktop, 12 on mobile) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <MicroClimateCard
                  profile={profile}
                  currentTemp={currentTemp}
                  onSetPodMode={handleSetPodMode}
                  onVoteComfort={handleVoteComfort}
                />

                <ShiftChallenges onCompleteChallenge={handleCompleteChallenge} />
              </div>

              {/* Right Column (5 Cols on desktop, 12 on mobile) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <FloorEcoGridCard onRedeemVoucher={handleRedeemVoucher} />

                <PodEnergyChart />

                <BuildingGridCard />
              </div>
            </div>
          </div>
        ) : (
          <FmViewSection
            showToast={showToast}
            onSwitchBack={() => setActiveRole('Occupant')}
          />
        )}
      </main>

      {/* Mobile Navigation & Floating Banner */}
      <OccupantMobileNav
        activeRole={activeRole}
        onToggleRole={setActiveRole}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Toast Shelf */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
