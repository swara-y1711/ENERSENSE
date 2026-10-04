'use client';

import React, { useState, useEffect } from 'react';
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
  PodHourlyPoint,
} from '../data/occupantData';

import {
  getReplayCurrent,
  getWeatherCurrent,
  getRecommendationsCurrent,
  getPeakExpected,
  getReplaySample,
  RecommendationBundle,
  ReplayRecord,
} from '../lib/api';

export default function OccupantDashboard() {
  const [profile, setProfile] = useState<OccupantProfile>(INITIAL_OCCUPANT_PROFILE);
  const [metrics, setMetrics] = useState<ComfortMetrics>(INITIAL_COMFORT_METRICS);
  const [challenge, setChallenge] = useState<PeakDemandChallenge>(INITIAL_PEAK_CHALLENGE);
  const [chartTelemetry, setChartTelemetry] = useState<PodHourlyPoint[] | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

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

  // Fetch real backend data
  useEffect(() => {
    let isMounted = true;

    async function loadBackendData() {
      try {
        setLoading(true);
        const [replayRes, weatherRes, recsRes, peakExpectedRes, samplesRes] = await Promise.allSettled([
          getReplayCurrent(),
          getWeatherCurrent(),
          getRecommendationsCurrent(),
          getPeakExpected(),
          getReplaySample(14),
        ]);

        if (!isMounted) return;

        let hasData = false;

        // 1. Process Replay Current
        if (replayRes.status === 'fulfilled' && replayRes.value) {
          hasData = true;
          const rep = replayRes.value;
          setProfile((prev) => ({
            ...prev,
            campus: `${rep.building_name || 'Academic Building'} (I-BLEND Replay)`,
          }));
          setMetrics((prev) => ({
            ...prev,
            kwhStatusNote: `Slot demand: ${rep.demand_kw.toFixed(1)} kW (${rep.timestamp ? new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Replay'})`,
            dailyKwh: Number((rep.demand_kw * 0.25).toFixed(1)),
          }));
        }

        // 1b. Process Open-Meteo historical weather (was fetched but unused)
        if (weatherRes.status === 'fulfilled' && weatherRes.value?.weather) {
          hasData = true;
          const tempC = weatherRes.value.weather.temperature_c;
          if (typeof tempC === 'number' && Number.isFinite(tempC)) {
            setCurrentTemp(tempC);
            setProfile((prev) => ({ ...prev, currentTemp: tempC }));
          }
        }

        // 2. Process Recommendations
        if (recsRes.status === 'fulfilled' && recsRes.value) {
          hasData = true;
          const bundle = recsRes.value;
          // Find occupant-oriented recommendation
          const occupantRec = bundle.recommendations.find(
            (r) => r.audience === 'occupant' || r.audience === 'both'
          ) || bundle.recommendations[0];

          if (occupantRec) {
            setChallenge({
              title: occupantRec.action,
              timeWindow: occupantRec.expected_window || bundle.expected_window || (bundle.is_weekend ? 'Weekend Off-Peak' : 'Peak Window Ahead'),
              rebateText: occupantRec.potential_flexible_kw > 0
                ? `${occupantRec.potential_flexible_kw.toFixed(1)} kW Flex`
                : 'Flexibility Available',
              gridRelief: occupantRec.priority === 'high' ? 'High Relief' : occupantRec.priority === 'medium' ? 'Moderate Relief' : 'Standard Relief',
              evActionLabel: occupantRec.action.length > 50
                ? `${occupantRec.action.substring(0, 48)}...`
                : occupantRec.action,
            });
          } else {
            // Avoid leaving static Stitch peak copy when backend reports no advisory
            setChallenge({
              title: 'No peak advisory at the current replay interval. Continue normal flexible-load awareness.',
              timeWindow: bundle.expected_window || (bundle.is_weekend ? 'Weekend / Off-Peak Context' : 'Current Replay Window'),
              rebateText: bundle.potential_flexible_kw > 0
                ? `${bundle.potential_flexible_kw.toFixed(1)} kW Flex`
                : 'Low Flex Estimate',
              gridRelief: 'Standard Relief',
              evActionLabel: 'Review Replay Energy Context',
            });
          }
        }

        // 3. Process Peak Expected
        if (peakExpectedRes.status === 'fulfilled' && peakExpectedRes.value) {
          hasData = true;
          const exp = peakExpectedRes.value;
          if (exp.is_peak_expected && exp.window_start && exp.window_end) {
            const startH = new Date(exp.window_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endH = new Date(exp.window_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setChallenge((prev) => ({
              ...prev,
              timeWindow: `${startH} – ${endH}`,
            }));
          } else if (!exp.is_peak_expected) {
            setChallenge((prev) => {
              // Replace only the static Stitch fallback window if it was never updated
              const isStaticFallback = prev.timeWindow === INITIAL_PEAK_CHALLENGE.timeWindow;
              return isStaticFallback
                ? { ...prev, timeWindow: 'No peak expected in next window' }
                : prev;
            });
          }
        }

        // 4. Process Samples for Chart
        if (samplesRes.status === 'fulfilled' && Array.isArray(samplesRes.value) && samplesRes.value.length > 0) {
          hasData = true;
          const points: PodHourlyPoint[] = samplesRes.value.map((s: ReplayRecord) => {
            const timeStr = s.timestamp ? s.timestamp.substring(11, 16) : '00:00';
            const kw = Number(s.demand_kw.toFixed(1));
            return {
              time: timeStr,
              podKw: kw,
              campusAvgKw: Number((kw * 0.92).toFixed(1)),
              temp: 24.0,
            };
          });
          setChartTelemetry(points);
        }

        setBackendConnected(hasData);
      } catch (err) {
        console.warn('[Occupant Dashboard] Backend unreachable, using fallback demo state:', err);
        setBackendConnected(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

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
      'Action Noted: Shift scheduled outside peak window.',
      'success'
    );
  };

  const handleSnooze = () => {
    showToast('Recommendation Snoozed: We will gently check in again later.');
  };

  const handleSetPodMode = (mode: 'eco' | 'balanced' | 'cool') => {
    if (mode === 'eco') {
      setCurrentTemp(24.5);
      showToast('Eco Mode Selected: +0.5°C drift reduces cooling demand.', 'success');
    } else if (mode === 'cool') {
      setCurrentTemp(23.5);
      showToast('Fresh Mode Selected: Target set to 23.5°C with enhanced ventilation flow.', 'info');
    } else {
      setCurrentTemp(24.0);
      showToast('Balanced Comfort: Reset to baseline 24.0°C.', 'info');
    }
  };

  const handleVoteComfort = (feeling: string) => {
    showToast(`Comfort Feedback Recorded: Noted "${feeling}". Advisory profile updated.`, 'success');
  };

  const handleCompleteChallenge = (id: string, title: string) => {
    if (id === 'departure') {
      showToast('Pod Powered Down: External monitors turned off. +20 EcoCredits added!', 'success');
    } else {
      showToast('Zone 4A Desk Assigned: Seat 4A-12 booked. +30 EcoCredits added!', 'success');
    }
  };

  const handleRedeemVoucher = () => {
    showToast('Eco Voucher Generated: 15% Campus Cafe voucher code sent to #ECO-882.', 'success');
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

                <PodEnergyChart telemetry={chartTelemetry} loading={loading} />

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
