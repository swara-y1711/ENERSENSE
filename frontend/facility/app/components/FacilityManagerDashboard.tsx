'use client';

import React, { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BreadcrumbBar from './BreadcrumbBar';
import KpiRibbon from './KpiRibbon';
import DemandProfileChart from './DemandProfileChart';
import SubmeterBreakdown from './SubmeterBreakdown';
import WhatIfSimulator from './WhatIfSimulator';
import ImpactVerification from './ImpactVerification';
import DeveloperDrawer from './DeveloperDrawer';
import SubmeterDrawerModal from './SubmeterDrawerModal';
import FacilityViews from './FacilityViews';
import ToastContainer, { ToastMessage } from './ToastContainer';

import {
  FlexibilityCurrent,
  ForecastCurrent,
  ExpectedPeak,
  getFlexibilityCurrent,
  getForecastCurrent,
  getImpactCurrent,
  getPeakCurrent,
  getPeakExpected,
  getRecommendationsCurrent,
  getRecommendationsExpected,
  getReplayContext,
  getReplayCurrent,
  getReplayNext,
  getReplaySample,
  getReplayStatus,
  getTariffConfig,
  getTariffCurrent,
  ImpactCurrent,
  PeakCurrent,
  Recommendation,
  RecommendationsCurrent,
  ReplayContext,
  ReplayRecord,
  ReplayStatus,
  TariffConfig,
  TariffCurrent,
} from '../lib/api';
import { BuildingOption } from '../data/facilityData';

const REPLAY_POLL_INTERVAL_MS = 15_000;

interface FacilityManagerDashboardProps {
  managerName: string;
  onSwitchRole: (role: 'manager' | 'occupant') => void;
  onLogout: () => void;
}

export default function FacilityManagerDashboard({
  managerName,
  onSwitchRole,
  onLogout,
}: FacilityManagerDashboardProps) {
  const [replay, setReplay] = useState<ReplayContext | null>(null);
  const [records, setRecords] = useState<ReplayRecord[]>([]);
  const [replayStatus, setReplayStatus] = useState<ReplayStatus | null>(null);
  const [forecast, setForecast] = useState<ForecastCurrent | null>(null);
  const [peak, setPeak] = useState<PeakCurrent | null>(null);
  const [expectedPeak, setExpectedPeak] = useState<ExpectedPeak | null>(null);
  const [flexibility, setFlexibility] = useState<FlexibilityCurrent | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationBundle, setRecommendationBundle] =
    useState<RecommendationsCurrent | null>(null);
  const [expectedRecommendationBundle, setExpectedRecommendationBundle] =
    useState<RecommendationsCurrent | null>(null);
  const [impact, setImpact] = useState<ImpactCurrent | null>(null);
  const [tariff, setTariff] = useState<TariffCurrent | null>(null);
  const [tariffConfig, setTariffConfig] = useState<TariffConfig | null>(null);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [replayAdvanceError, setReplayAdvanceError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState('Overview');
  const [activeRole, setActiveRole] = useState<'FM' | 'Occupant'>('FM');
  const [timeframe, setTimeframe] = useState('live');

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [submeterDrawerOpen, setSubmeterDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (msg: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((previous) => [...previous, { id, msg, type }]);
    setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const removeToast = (id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    let isActive = true;

    const refreshDashboard = async (advanceReplay: boolean) => {
      if (advanceReplay) {
        try {
          await getReplayNext();
          if (isActive) setReplayAdvanceError(null);
        } catch (error) {
          if (isActive) {
            setReplayAdvanceError(
              error instanceof Error ? error.message : 'Unknown replay error',
            );
          }
        }
      }

      const results = await Promise.allSettled([
        getReplayCurrent(),
        getReplayContext(),
        getForecastCurrent(),
        getPeakCurrent(),
        getFlexibilityCurrent(),
        getRecommendationsCurrent(),
        getImpactCurrent(),
        getReplayStatus(),
        getPeakExpected(),
        getRecommendationsExpected(),
        getTariffCurrent(),
        getTariffConfig(),
      ]);
      const sampleResults = advanceReplay
        ? []
        : await Promise.allSettled([getReplaySample()]);

      if (!isActive) return;

      const currentResult = results[0];
      const contextResult = results[1];
      const current =
        contextResult.status === 'fulfilled'
          ? contextResult.value
          : currentResult.status === 'fulfilled'
            ? currentResult.value
            : null;

      setBackendUnavailable(current === null);
      setReplay(current);
      setForecast(results[2].status === 'fulfilled' ? results[2].value : null);
      setPeak(results[3].status === 'fulfilled' ? results[3].value : null);
      setFlexibility(results[4].status === 'fulfilled' ? results[4].value : null);
      const currentRecommendations =
        results[5].status === 'fulfilled' ? results[5].value : null;
      setRecommendationBundle(currentRecommendations);
      setRecommendations(currentRecommendations?.recommendations ?? []);
      setImpact(results[6].status === 'fulfilled' ? results[6].value : null);
      setExpectedPeak(results[8].status === 'fulfilled' ? results[8].value : null);
      setExpectedRecommendationBundle(
        results[9].status === 'fulfilled' ? results[9].value : null,
      );
      setTariff(results[10].status === 'fulfilled' ? results[10].value : null);
      setTariffConfig(results[11].status === 'fulfilled' ? results[11].value : null);

      const sampleResult = sampleResults[0];
      if (sampleResult?.status === 'fulfilled') {
        setRecords(sampleResult.value);
      } else if (current) {
        setRecords((previous) => (previous.length > 0 ? previous : [current]));
      }

      const statusResult = results[7];
      if (statusResult?.status === 'fulfilled') {
        setReplayStatus(statusResult.value);
      }

      if (advanceReplay && current) {
        setRecords((previous) => {
          const lastRecord = previous[previous.length - 1];
          if (!lastRecord) return [current];
          if (current.timestamp < lastRecord.timestamp) return [current];
          if (current.timestamp === lastRecord.timestamp) return previous;
          return [...previous, current];
        });
      }
    };

    void refreshDashboard(false);
    const interval = window.setInterval(
      () => void refreshDashboard(true),
      REPLAY_POLL_INTERVAL_MS,
    );

    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, []);

  const activeBuilding: BuildingOption | null = replay
    ? {
        id: replay.building_name,
        name: replay.building_name,
        shortName: replay.building_name,
      }
    : null;

  const handleSelectTimeframe = (timeframeId: string, label: string) => {
    setTimeframe(timeframeId);
    if (timeframeId !== 'live') {
      showToast('Historical replay provides the active interval only; this timeframe is not available.');
      return;
    }
    showToast(`Dashboard updated for ${label} view`);
  };

  const handleSelectPage = (section: string) => {
    setActivePage(section);
    setActiveRole(section === 'Occupant View' ? 'Occupant' : 'FM');
  };

  const returnToOverview = () => {
    setActiveRole('FM');
    setActivePage('Overview');
  };

  return (
    <div className="bg-surface font-sans text-on-surface antialiased overflow-x-hidden min-h-screen flex flex-col">
      <Header
        activeBuilding={activeBuilding}
        source={replay?.source ?? null}
        mode={replay?.mode === 'historical_replay' ? 'Historical Replay' : replay?.mode ?? null}
        recommendations={recommendations}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        onSwitchRole={onSwitchRole}
        onLogout={onLogout}
        operatorName={managerName}
        showToast={showToast}
        activeRole={activeRole}
      />

      <Sidebar
        activePage={activePage}
        onSelectPage={handleSelectPage}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        showToast={showToast}
      />

      <main className="w-full lg:pl-60 pt-16 min-h-screen p-3 sm:p-5 md:p-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-5 md:space-y-6">
          <BreadcrumbBar
            activeBuilding={activeBuilding}
            replay={replay}
            backendUnavailable={backendUnavailable}
            timeframe={timeframe}
            onSelectTimeframe={handleSelectTimeframe}
            showToast={showToast}
          />

          {activePage === 'Overview' && replayStatus && (
            <div className="text-[11px] text-outline font-mono">
              Replay position: {replayStatus.current_position + 1} / {replayStatus.total_records}
              {' · '}Interval: {replayStatus.interval}
            </div>
          )}
          {activePage === 'Overview' && replayAdvanceError && (
            <div role="status" className="text-xs text-error">
              Replay update unavailable; displaying the last successful data.
            </div>
          )}

          {activePage === 'Overview' ? (
            <>
              <KpiRibbon
                replay={replay}
                forecast={forecast}
                peak={peak}
                flexibility={flexibility}
                recommendations={recommendations}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
                <DemandProfileChart records={records} />
                <SubmeterBreakdown
                  onOpenDrawer={() => setSubmeterDrawerOpen(true)}
                  showToast={showToast}
                  activeKw={replay?.demand_kw ?? null}
                />
              </div>

              <WhatIfSimulator
                replay={replay}
                flexibility={flexibility}
                impact={impact}
                showToast={showToast}
              />

              <ImpactVerification impact={impact} showToast={showToast} />

              <DeveloperDrawer
                activeBuilding={activeBuilding}
                source={replay?.source ?? null}
                mode={replay?.mode === 'historical_replay' ? 'Historical Replay' : replay?.mode ?? null}
                backendUnavailable={backendUnavailable}
              />
            </>
          ) : (
            <FacilityViews
              section={activePage}
              replay={replay}
              records={records}
              replayStatus={replayStatus}
              forecast={forecast}
              peak={peak}
              expectedPeak={expectedPeak}
              flexibility={flexibility}
              recommendations={recommendationBundle}
              expectedRecommendations={expectedRecommendationBundle}
              impact={impact}
              tariff={tariff}
              tariffConfig={tariffConfig}
              backendUnavailable={backendUnavailable}
              onReturnToOverview={returnToOverview}
              showToast={showToast}
            />
          )}
        </div>
      </main>

      <SubmeterDrawerModal
        isOpen={submeterDrawerOpen}
        onClose={() => setSubmeterDrawerOpen(false)}
        activeBuilding={activeBuilding}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
