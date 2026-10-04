'use client';

import React from 'react';

interface SidebarProps {
  activePage: string;
  onSelectPage: (page: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  showToast: (msg: string, type?: 'info' | 'success') => void;
}

export default function Sidebar({
  activePage,
  onSelectPage,
  mobileOpen,
  onCloseMobile,
  showToast,
}: SidebarProps) {
  const operationsNav = [
    { name: 'Overview', icon: 'grid_view' },
    { name: 'Live Telemetry', icon: 'electric_meter' },
    { name: 'Demand Response', icon: 'bolt' },
    { name: 'Human Presence', icon: 'groups' },
    { name: 'HVAC Control', icon: 'thermostat' },
  ];

  const governanceNav = [
    { name: 'ESG & Carbon', icon: 'eco' },
    { name: 'Alerts & Faults', icon: 'warning' },
    { name: 'Facility Config', icon: 'settings' },
  ];

  const handleNavClick = (pageName: string) => {
    onSelectPage(pageName);
    showToast(`Navigated to ${pageName} section`);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 w-64 sm:w-60 bg-surface-container-lowest border-r border-surface-container-high p-4 flex flex-col justify-between z-40 transition-transform duration-300 ease-in-out overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Mobile Header Close Button */}
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-surface-container-high">
            <span className="text-xs font-bold text-on-surface">Navigation</span>
            <button
              aria-label="Close menu"
              className="p-1 rounded-md text-outline hover:text-on-surface cursor-pointer"
              onClick={onCloseMobile}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Operations Section */}
          <div>
            <span className="text-[11px] font-mono uppercase text-outline px-3 tracking-wider">
              Operations
            </span>
            <nav className="mt-2 space-y-1">
              {operationsNav.map((item) => {
                const isActive = activePage === item.name;
                return (
                  <button
                    key={item.name}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'font-semibold bg-primary text-on-primary shadow-xs'
                        : 'font-medium text-outline hover:bg-surface-container-low hover:text-on-surface'
                    }`}
                    onClick={() => handleNavClick(item.name)}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {item.icon}
                    </span>
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Governance Section */}
          <div>
            <span className="text-[11px] font-mono uppercase text-outline px-3 tracking-wider">
              Governance
            </span>
            <nav className="mt-2 space-y-1">
              {governanceNav.map((item) => {
                const isActive = activePage === item.name;
                return (
                  <button
                    key={item.name}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'font-semibold bg-primary text-on-primary shadow-xs'
                        : 'font-medium text-outline hover:bg-surface-container-low hover:text-on-surface'
                    }`}
                    onClick={() => handleNavClick(item.name)}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {item.icon}
                    </span>
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Subsystem Health Badge */}
        <div className="mt-6 pt-4 border-t border-surface-container-high/60">
          <div
            className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors"
            onClick={() =>
              showToast('Modbus & BACnet gateway health: 142/142 telemetry circuits verified.', 'success')
            }
          >
            <div>
              <div className="text-[10px] font-mono uppercase text-outline">
                Subsystem Health
              </div>
              <div className="text-xs font-bold text-primary">99.82% Optimal</div>
            </div>
            <span className="material-symbols-outlined text-primary text-[20px]">
              verified
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
