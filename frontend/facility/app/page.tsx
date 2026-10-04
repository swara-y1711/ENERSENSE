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

export default function FacilityManagerDashboard() {
  // Reactive State
  const [activeBuilding, setActiveBuilding] = useState<BuildingOption>(BUILDINGS[0]);
  const [activePage, setActivePage] = useState<string>('Overview');
  const [activeRole, setActiveRole] = useState<'FM' | 'Occupant'>('FM');
  const [timeframe, setTimeframe] = useState<string>('live');

  const [kpi, setKpi] = useState<KpiMetrics>(INITIAL_KPI);
  const [activeKw, setActiveKw] = useState<number>(343);

  // Simulator state
  const [reductionTarget, setReductionTarget] = useState<number>(45);
  const [duration, setDuration] = useState<number>(3);
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

  // Live Heartbeat Jitter Simulator
  useEffect(() => {
    const timer = setInterval(() => {
      const jitter = Math.floor(Math.random() * 5) - 2;
      setActiveKw((prev) => Math.max(300, Math.min(400, prev + jitter)));
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Timeframe selector handler
  const handleSelectTimeframe = (tfId: string, label: string) => {
    setTimeframe(tfId);
    if (tfId === 'live') {
      setKpi((prev) => ({ ...prev, cumulativeKwh: 4820, cumDelta: '+4.2%' }));
    } else if (tfId === 'yesterday') {
      setKpi((prev) => ({ ...prev, cumulativeKwh: 5210, cumDelta: '-1.5%' }));
    } else if (tfId === '7d') {
      setKpi((prev) => ({ ...prev, cumulativeKwh: 33650, cumDelta: '+0.8%' }));
    } else {
      setKpi((prev) => ({ ...prev, cumulativeKwh: 4940, cumDelta: '+2.0%' }));
    }
    showToast(`Dashboard updated for ${label} view`);
  };

  // Simulator reset
  const handleResetSimulator = () => {
    setReductionTarget(45);
    setDuration(3);
    setSubsystems({ hvac: true, ev: true, storage: true });
    showToast('Simulator restored to baseline parameters.');
  };

  // Confirm Dispatch handler
  const handleConfirmDispatch = () => {
    setDispatchModalOpen(false);
    showToast(
      `Automated curtailment armed (-${reductionTarget} kW). BACnet command queued.`,
      'success'
    );

    const newLog: AuditLogItem = {
      id: `#DR-${Math.floor(Math.random() * 100) + 883}`,
      window: `Today, 18:00 - ${18 + duration}:00`,
      committedKw: reductionTarget,
      deliveredKw: 'Pending',
      compliancePct: 'Armed',
      status: 'Armed',
      icon: 'schedule',
      statusNote: 'Pre-cooling',
      toastNote: `Event #DR-883: Armed -${reductionTarget}kW automated curtailment.`,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Synchronize available capacity for KPI flex
  const availableCap =
    (subsystems.hvac ? 45 : 0) +
    (subsystems.ev ? 25 : 0) +
    (subsystems.storage ? 15 : 0);

  const kpiUpdated: KpiMetrics = {
    ...kpi,
    flexibleShedCapKw: availableCap,
    flexPct: `${((availableCap / activeKw) * 100).toFixed(1)}%`,
  };

  return (
    <div className="bg-surface font-sans text-on-surface antialiased overflow-x-hidden min-h-screen flex flex-col">
      {/* Header */}
      <Header
        activeBuilding={activeBuilding}
        onSelectBuilding={setActiveBuilding}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        onOpenOccupantModal={() => {
          setActiveRole('Occupant');
          setOccupantModalOpen(true);
        }}
        showToast={showToast}
        activeRole={activeRole}
        onSelectRole={setActiveRole}
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
          />

          {/* KPI Ribbon (Fluid 1 -> 2 -> 4 cols) */}
          <KpiRibbon kpi={kpiUpdated} activeKw={activeKw} />

          {/* Main Row: Demand Profile Chart & Submeter Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
            <DemandProfileChart reductionTarget={reductionTarget} />
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
            basePeakKw={kpi.predPeakKw}
          />

          {/* Impact Verification & Immutable Audit Logs */}
          <ImpactVerification logs={auditLogs} showToast={showToast} />

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
          setActiveRole('FM');
        }}
        showToast={showToast}
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
