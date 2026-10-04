'use client';

import React, { useState } from 'react';
import { BUILDINGS, BuildingOption, NOTIFICATIONS, NotificationItem } from '../data/facilityData';

interface HeaderProps {
  activeBuilding: BuildingOption;
  onSelectBuilding: (bldg: BuildingOption) => void;
  onOpenMobileSidebar: () => void;
  onOpenOccupantModal: () => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
  activeRole: 'FM' | 'Occupant';
  onSelectRole: (role: 'FM' | 'Occupant') => void;
}

export default function Header({
  activeBuilding,
  onSelectBuilding,
  onOpenMobileSidebar,
  onOpenOccupantModal,
  showToast,
  activeRole,
  onSelectRole,
}: HeaderProps) {
  const [bldgMenuOpen, setBldgMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(NOTIFICATIONS);

  const handleClearNotifications = () => {
    setNotifications([]);
    setNotifMenuOpen(false);
    showToast('All notifications marked as read.', 'success');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-surface-container-high px-3 sm:px-6 flex items-center justify-between gap-2">
      {/* Left Logo & Hamburger & Building Selector */}
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
        {/* Hamburger Menu Button (Mobile & Tablet) */}
        <button
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center shrink-0 cursor-pointer"
          onClick={onOpenMobileSidebar}
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer shrink-0"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-8 h-8 rounded-lg bg-on-surface flex items-center justify-center text-primary font-bold text-base sm:text-lg">
            ⚡
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-on-surface">
            ENER<span className="text-primary">SENSE</span>
          </span>
        </div>

        <div className="hidden md:block h-5 w-px bg-surface-container-high"></div>

        {/* Building Selector */}
        <div className="relative min-w-0">
          <button
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-surface-container-low hover:bg-surface-container rounded-lg text-xs sm:text-sm font-medium transition-colors max-w-[140px] sm:max-w-[240px] md:max-w-xs truncate cursor-pointer"
            onClick={() => setBldgMenuOpen(!bldgMenuOpen)}
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-primary shrink-0">
              apartment
            </span>
            <span className="truncate">{activeBuilding.shortName}</span>
            <span className="material-symbols-outlined text-[16px] text-outline shrink-0">
              {bldgMenuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {bldgMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-64 sm:w-72 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container-high p-2 z-50">
              {BUILDINGS.map((bldg) => {
                const isActive = bldg.id === activeBuilding.id;
                return (
                  <button
                    key={bldg.id}
                    className={`w-full text-left p-2 rounded-lg text-xs sm:text-sm flex justify-between items-center transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-surface-container text-on-surface font-medium'
                    }`}
                    onClick={() => {
                      onSelectBuilding(bldg);
                      setBldgMenuOpen(false);
                      showToast(`Switched active facility to ${bldg.name}`);
                    }}
                  >
                    <span className="truncate">{bldg.shortName}</span>
                    <span className="font-mono text-xs shrink-0 ml-2">
                      {bldg.currentKw} kW
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Grid Stress Banner */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-tertiary-fixed/40 rounded-lg text-xs font-semibold text-tertiary">
          <span className="h-2 w-2 rounded-full bg-tertiary animate-ping"></span>
          <span>GRID STRESS: MODERATE • PEAK WINDOW IN 2H</span>
        </div>

        {/* Role Switcher */}
        <div className="flex bg-surface-container-high p-0.5 sm:p-1 rounded-lg">
          <button
            className={`px-2 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs transition-colors cursor-pointer ${
              activeRole === 'FM'
                ? 'font-semibold bg-primary text-on-primary shadow-xs'
                : 'font-medium text-outline hover:text-on-surface'
            }`}
            onClick={() => {
              onSelectRole('FM');
              showToast('Switched to Facility Manager view');
            }}
          >
            FM
          </button>
          <button
            className={`px-2 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              activeRole === 'Occupant'
                ? 'font-semibold bg-primary text-on-primary shadow-xs'
                : 'font-medium text-outline hover:text-on-surface'
            }`}
            onClick={() => {
              onSelectRole('Occupant');
              onOpenOccupantModal();
            }}
          >
            <span>Occupant</span>
            <span className="hidden sm:inline">View</span>
          </button>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            aria-label="Notifications"
            className="p-1.5 sm:p-2 rounded-lg hover:bg-surface-container-low text-outline hover:text-on-surface relative cursor-pointer"
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
          >
            <span className="material-symbols-outlined text-[20px]">
              notifications
            </span>
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-error"></span>
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-container-high p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
                <span className="text-xs uppercase font-bold text-on-surface">
                  Grid Alerts ({notifications.length})
                </span>
                {notifications.length > 0 && (
                  <button
                    className="text-xs text-primary font-medium hover:underline cursor-pointer"
                    onClick={handleClearNotifications}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="mt-2 space-y-2 text-xs">
                {notifications.length === 0 ? (
                  <div className="p-2 text-outline text-center">No unread notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-2 rounded-lg border-l-2 ${
                        notif.type === 'alert'
                          ? 'bg-tertiary-fixed/30 border-tertiary'
                          : 'bg-primary/10 border-primary'
                      }`}
                    >
                      <span
                        className={`font-bold block ${
                          notif.type === 'alert' ? 'text-tertiary' : 'text-primary'
                        }`}
                      >
                        {notif.title}
                      </span>
                      <span className="text-on-surface-variant">
                        {notif.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
            MV
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold leading-tight">Marcus Vance</div>
            <div className="text-[10px] text-outline">Lead Facility Eng.</div>
          </div>
        </div>
      </div>
    </header>
  );
}
