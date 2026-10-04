'use client';

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BreadcrumbBar from './components/BreadcrumbBar';
import KpiRibbon from './components/KpiRibbon';
import DemandProfileChart from './components/DemandProfileChart';
import SubmeterBreakdown from './components/SubmeterBreakdown';
import WhatIfSimulator from './components/WhatIfSimulator';
import ImpactVerification from './components/ImpactVerification';
import DeveloperDrawer from './components/DeveloperDrawer';
import SubmeterDrawerModal from './components/SubmeterDrawerModal';
import OccupantModal from './components/OccupantModal';
import DispatchConfirmationModal from './components/DispatchConfirmationModal';
import ToastContainer, { ToastMessage } from './components/ToastContainer';

import {
  BUILDINGS,
  BuildingOption,
  INITIAL_KPI,
  KpiMetrics,
  AUDIT_LOGS,
  AuditLogItem,
} from './data/facilityData';

import {
  getReplayCurrent,
  getReplaySample,
  getForecastCurrent,
  getPeakCurrent,
  getPeakExpected,
  getFlexibilityCurrent,
  getRecommendationsCurrent,
  getImpactCurrent,
  getWeatherCurrent,
  ReplayRecord,
  PeakResult,
  ExpectedPeakResult,
  FlexibilityResult,
  RecommendationBundle,
  CurrentImpactResult,
  WeatherResponse,
} from './lib/api';

export default function FacilityManagerDashboard() {
  // Reactive State
  const [activeBuilding, setActiveBuilding] = useState<BuildingOption>(BUILDINGS[0]);
  const [activePage, setActivePage] = useState<string>('Overview');
  const [activeRole, setActiveRole] = useState<'FM' | 'Occupant'>('FM');
  const [timeframe, setTimeframe] = useState<string>('live');

  // Backend Integration State
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(true);
  const [currentTimestamp, setCurrentTimestamp] = useState<string>('2016-10-03T11:15:00+05:30');
  const [telemetrySeries, setTelemetrySeries] = useState<ReplayRecord[]>([]);
  const [peakResult, setPeakResult] = useState<PeakResult | null>(null);
  const [expectedPeak, setExpectedPeak] = useState<ExpectedPeakResult | null>(null);
  const [flexResult, setFlexResult] = useState<FlexibilityResult | null>(null);
  const [recsBundle, setRecsBundle] = useState<RecommendationBundle | null>(null);
  const [impactCurrent, setImpactCurrent] = useState<CurrentImpactResult | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);

  const [kpi, setKpi] = useState<KpiMetrics>(INITIAL_KPI);
  const [activeKw, setActiveKw] = useState<number>(71.6);
  const [baselineKw, setBaselineKw] = useState<number>(56.3);

  // Simulator state
  const [reductionTarget, setReductionTarget] = useState<number>(15);
  const [duration, setDuration] = useState<number>(2);
  const [subsystems, setSubsystems] = useState({
    hvac: true,
    ev: true,
    storage: true,
  });

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(AUDIT_LOGS);

  // Modals state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [submeterDrawerOpen, setSubmeterDrawerOpen] = useState(false);
  const [occupantModalOpen, setOccupantModalOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (msg: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, msg, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch real backend data on mount
  useEffect(() => {
    let isMounted = true;

    async function loadBackendData() {
      try {
        const [
          replayRes,
          forecastRes,
          peakRes,
          flexRes,
          expectedRes,
          recsRes,
          sampleRes,
          impactRes,
          weatherRes,
        ] = await Promise.all([
          getReplayCurrent().catch(() => null),
          getForecastCurrent().catch(() => null),
          getPeakCurrent().catch(() => null),
          getFlexibilityCurrent().catch(() => null),
          getPeakExpected().catch(() => null),
          getRecommendationsCurrent().catch(() => null),
          getReplaySample(24).catch(() => []),
          getImpactCurrent().catch(() => null),
          getWeatherCurrent().catch(() => null),
        ]);

        if (!isMounted) return;

        if (replayRes) {
          setIsBackendOnline(true);
          setActiveKw(replayRes.demand_kw);
          setCurrentTimestamp(replayRes.timestamp);
        } else {
          setIsBackendOnline(false);
        }

        if (peakRes) setPeakResult(peakRes);
        if (expectedRes) setExpectedPeak(expectedRes);
        if (flexRes) {
          setFlexResult(flexRes);
          setBaselineKw(flexRes.historical_reference_demand_kw);
          setReductionTarget(Math.min(20, Math.round(flexRes.potential_flexible_kw)));
        }
        if (recsRes) setRecsBundle(recsRes);
        if (sampleRes && sampleRes.length > 0) setTelemetrySeries(sampleRes);
        if (impactRes) setImpactCurrent(impactRes);
        if (weatherRes) setWeatherData(weatherRes);
      } catch (err) {
        if (!isMounted) return;
        setIsBackendOnline(false);
        console.warn('Backend unavailable, using historical demo fallback.');
      }
    }

    loadBackendData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Timeframe selector handler
  const handleSelectTimeframe = (tfId: string, label: string) => {
    setTimeframe(tfId);
    showToast(`Timeframe updated to ${label}`);
  };

  // Simulator reset
  const handleResetSimulator = () => {
    setReductionTarget(flexResult ? Math.min(20, Math.round(flexResult.potential_flexible_kw)) : 15);
    setDuration(2);
    setSubsystems({ hvac: true, ev: true, storage: true });
    showToast('Simulator restored to baseline parameters.');
  };

  // Confirm Dispatch handler
  const handleConfirmDispatch = () => {
    setDispatchModalOpen(false);
    showToast(
      `Scenario committed: -${reductionTarget} kW potential shift staged. (Simulation advisory only)`,
      'success'
    );

    const newLog: AuditLogItem = {
      id: `#DR-${Math.floor(Math.random() * 100) + 883}`,
      window: `Historical Replay: ${expectedPeak ? `${expectedPeak.window_start.slice(11, 16)} - ${expectedPeak.window_end.slice(11, 16)}` : '11:15 - 13:00'}`,
      committedKw: reductionTarget,
      deliveredKw: Math.min(reductionTarget, flexResult?.potential_flexible_kw ?? reductionTarget),
      compliancePct: 'Verified',
      status: 'Verified',
      icon: 'schedule',
      statusNote: 'Simulated Shift',
      toastNote: `Event #DR-883: -${reductionTarget}kW simulated flexibility reduction.`,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const peakWindowLabel = expectedPeak
    ? `${expectedPeak.window_start.slice(11, 16)} - ${expectedPeak.window_end.slice(11, 16)}`
    : '11:15 - 13:00';

  const currentRecommendation = recsBundle?.recommendations?.[0] || null;

  return (
    <div className="bg-surface font-sans text-on-surface antialiased overflow-x-hidden min-h-screen flex flex-col">
      {/* Header */}
      <Header
        activeBuilding={activeBuilding}
        onSelectBuilding={setActiveBuilding}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        onOpenOccupantModal={() => {
          setOccupantModalOpen(true);
        }}
        showToast={showToast}
        activeRole={activeRole}
        onSelectRole={setActiveRole}
        peakStatus={peakResult?.peak_status || 'predicted_peak'}
        peakWindow={peakWindowLabel}
        isBackendOnline={isBackendOnline}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        showToast={showToast}
      />

      {/* Main Content Wrapper */}
      <main className="w-full lg:pl-60 pt-16 min-h-screen p-3 sm:p-5 md:p-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-5 md:space-y-6">
          {/* Breadcrumbs & Controls */}
          <BreadcrumbBar
            activeBuilding={activeBuilding}
            timeframe={timeframe}
            onSelectTimeframe={handleSelectTimeframe}
            showToast={showToast}
            currentTimestamp={currentTimestamp}
            mode="historical_backtest"
          />

          {/* KPI Ribbon (Fluid 1 -> 2 -> 4 cols) */}
          <KpiRibbon
            kpi={kpi}
            activeKw={activeKw}
            baselineKw={baselineKw}
            predictedDemandKw={peakResult?.predicted_demand_kw ?? activeKw}
            peakStatus={peakResult?.peak_status || 'predicted_peak'}
            potentialFlexibleKw={flexResult?.potential_flexible_kw ?? 15.4}
            peakWindow={peakWindowLabel}
          />

          {/* Main Row: Demand Profile Chart & Submeter Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
            <DemandProfileChart
              reductionTarget={reductionTarget}
              telemetry={telemetrySeries}
              baselineDemandKw={baselineKw}
            />
            <SubmeterBreakdown
              onOpenDrawer={() => setSubmeterDrawerOpen(true)}
              showToast={showToast}
              activeKw={activeKw}
            />
          </div>

          {/* Grid Event "What-If" Simulator */}
          <WhatIfSimulator
            reductionTarget={reductionTarget}
            onTargetChange={setReductionTarget}
            duration={duration}
            onDurationChange={setDuration}
            subsystems={subsystems}
            onSubsystemChange={setSubsystems}
            onReset={handleResetSimulator}
            onOpenDispatchModal={() => setDispatchModalOpen(true)}
            showToast={showToast}
            basePeakKw={peakResult?.predicted_demand_kw ?? activeKw}
            availableFlexKw={flexResult?.potential_flexible_kw ?? 15.4}
            startTimestamp={expectedPeak?.window_start}
            endTimestamp={expectedPeak?.window_end}
          />

          {/* Impact Verification & Immutable Audit Logs */}
          <ImpactVerification
            logs={auditLogs}
            showToast={showToast}
            impactKwh={impactCurrent?.estimated_energy_impact_kwh}
            baselineDiffKw={impactCurrent?.baseline_difference_kw}
            actualDemandKw={activeKw}
          />

          {/* Developer Debug Bar */}
          <DeveloperDrawer activeBuilding={activeBuilding} />
        </div>
      </main>

      {/* Slide-Over Drawer: All 32 Submeters */}
      <SubmeterDrawerModal
        isOpen={submeterDrawerOpen}
        onClose={() => setSubmeterDrawerOpen(false)}
        activeBuilding={activeBuilding}
      />

      {/* Occupant View Preview Modal */}
      <OccupantModal
        isOpen={occupantModalOpen}
        onClose={() => {
          setOccupantModalOpen(false);
        }}
        showToast={showToast}
        recommendation={currentRecommendation}
        weather={weatherData}
        expectedWindow={peakWindowLabel}
      />

      {/* Dispatch Staging Confirmation Dialog */}
      <DispatchConfirmationModal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        reductionTarget={reductionTarget}
        duration={duration}
        onConfirmDispatch={handleConfirmDispatch}
      />

      {/* Reactive Toast Notification Shelf */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
