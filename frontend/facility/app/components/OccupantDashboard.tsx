'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FlexibilityCurrent,
  ForecastCurrent,
  getFlexibilityCurrent,
  getForecastCurrent,
  getImpactCurrent,
  getPeakCurrent,
  getRecommendationsCurrent,
  getRecommendationsExpected,
  getReplayContext,
  getReplayNext,
  getReplaySample,
  getReplayStatus,
  getWeatherCurrent,
  ImpactCurrent,
  PeakCurrent,
  Recommendation,
  RecommendationsCurrent,
  ReplayContext,
  ReplayRecord,
  ReplayStatus,
  WeatherCurrent,
} from '../lib/api';
import { OccupantProfile } from '../data/facilityData';

type ResidentTab = 'Home' | 'Insights' | 'Recommendations' | 'Profile';

interface OccupantDashboardProps {
  profile: OccupantProfile;
  onSwitchRole: (role: 'manager' | 'occupant') => void;
  onLogout: () => void;
}

const POLL_INTERVAL_MS = 15_000;

function numberText(value: number | null | undefined, unit: string): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${unit}`
    : 'Not available';
}

function audienceKey(recommendation: Recommendation): string {
  return recommendation.audience.toLowerCase().replace(/[- ]/g, '_');
}

function isOccupantAudience(recommendation: Recommendation): boolean {
  const audience = audienceKey(recommendation);
  return audience.includes('occupant') || audience === 'both' || audience === 'all';
}

function isManagerAudience(recommendation: Recommendation): boolean {
  const audience = audienceKey(recommendation);
  return audience.includes('facility_manager') || audience === 'both' || audience === 'all';
}

function deduplicate(items: Recommendation[]): Recommendation[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.recommendation_id)) return false;
    seen.add(item.recommendation_id);
    return true;
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 bg-white border border-surface-container-high rounded-2xl p-4 sm:p-5 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  tone = 'primary',
}: {
  icon: string;
  label: string;
  value: string;
  detail?: string;
  tone?: 'primary' | 'secondary' | 'tertiary';
}) {
  const toneClass = tone === 'primary'
    ? 'bg-primary/10 text-primary'
    : tone === 'secondary'
      ? 'bg-secondary/10 text-secondary'
      : 'bg-tertiary-fixed text-tertiary';
  return (
    <div className="min-w-0 rounded-xl border border-surface-container-high bg-white p-3.5 sm:p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold text-outline">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${toneClass}`}>
          <span className="material-symbols-outlined text-[17px]">{icon}</span>
        </span>
        <span>{label}</span>
      </div>
      <div className="mt-3 text-lg sm:text-xl font-bold text-on-surface break-words">{value}</div>
      {detail && <p className="mt-1 text-[10px] leading-relaxed text-outline break-words">{detail}</p>}
    </div>
  );
}

function RecommendationCard({
  recommendation,
  label,
}: {
  recommendation: Recommendation;
  label: string;
}) {
  return (
    <article className="rounded-xl bg-surface-container-low border border-surface-container-high p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
          {label} · {recommendation.priority}
        </span>
        <span className="text-[10px] font-medium text-outline">{recommendation.audience}</span>
      </div>
      <h3 className="mt-3 text-base font-bold text-on-surface">{recommendation.action}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-outline">{recommendation.reason}</p>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-xs">
        <div className="py-1.5 border-t border-surface-container-high">
          <span className="text-outline">Suggested window</span>
          <p className="mt-0.5 font-semibold text-on-surface">
            {recommendation.expected_window ?? 'Not available'}
          </p>
        </div>
        <div className="py-1.5 border-t border-surface-container-high">
          <span className="text-outline">Peak context</span>
          <p className="mt-0.5 font-semibold text-on-surface">
            {recommendation.peak_status || 'Not available'}
          </p>
        </div>
        <div className="py-1.5 border-t border-surface-container-high">
          <span className="text-outline">Building forecast</span>
          <p className="mt-0.5 font-semibold text-on-surface">
            {numberText(recommendation.predicted_demand_kw, 'kW')}
          </p>
        </div>
        <div className="py-1.5 border-t border-surface-container-high">
          <span className="text-outline">Tariff period</span>
          <p className="mt-0.5 font-semibold text-on-surface">
            {recommendation.tariff_period ?? 'Not available'}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function OccupantDashboard({
  profile,
  onSwitchRole,
  onLogout,
}: OccupantDashboardProps) {
  const [activeTab, setActiveTab] = useState<ResidentTab>('Home');
  const [replay, setReplay] = useState<ReplayContext | null>(null);
  const [records, setRecords] = useState<ReplayRecord[]>([]);
  const [replayStatus, setReplayStatus] = useState<ReplayStatus | null>(null);
  const [forecast, setForecast] = useState<ForecastCurrent | null>(null);
  const [peak, setPeak] = useState<PeakCurrent | null>(null);
  const [flexibility, setFlexibility] = useState<FlexibilityCurrent | null>(null);
  const [currentBundle, setCurrentBundle] = useState<RecommendationsCurrent | null>(null);
  const [expectedBundle, setExpectedBundle] = useState<RecommendationsCurrent | null>(null);
  const [impact, setImpact] = useState<ImpactCurrent | null>(null);
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [replayError, setReplayError] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    const refresh = async (advance: boolean) => {
      if (advance) {
        try {
          await getReplayNext();
          if (isActive) setReplayError(null);
        } catch (error) {
          if (isActive) {
            setReplayError(error instanceof Error ? error.message : 'Replay update unavailable.');
          }
        }
      }

      const results = await Promise.allSettled([
        getReplayContext(),
        getForecastCurrent(),
        getPeakCurrent(),
        getFlexibilityCurrent(),
        getRecommendationsCurrent(),
        getRecommendationsExpected(),
        getImpactCurrent(),
        getWeatherCurrent(),
        getReplayStatus(),
        ...(advance ? [] : [getReplaySample()]),
      ]);
      if (!isActive) return;

      const context = results[0].status === 'fulfilled' ? results[0].value : null;
      setReplay(context);
      setBackendUnavailable(context === null);
      setForecast(results[1].status === 'fulfilled' ? results[1].value : null);
      setPeak(results[2].status === 'fulfilled' ? results[2].value : null);
      setFlexibility(results[3].status === 'fulfilled' ? results[3].value : null);
      setCurrentBundle(results[4].status === 'fulfilled' ? results[4].value : null);
      setExpectedBundle(results[5].status === 'fulfilled' ? results[5].value : null);
      setImpact(results[6].status === 'fulfilled' ? results[6].value : null);
      setWeather(results[7].status === 'fulfilled' ? results[7].value : null);
      setReplayStatus(results[8].status === 'fulfilled' ? results[8].value : null);

      if (!advance) {
        const sampleResult = results[9];
        if (sampleResult?.status === 'fulfilled') setRecords(sampleResult.value);
        else if (context) setRecords([context]);
      } else if (context) {
        setRecords((previous) => {
          const last = previous[previous.length - 1];
          if (!last || context.timestamp < last.timestamp) return [context];
          if (context.timestamp === last.timestamp) return previous;
          return [...previous.slice(-47), context];
        });
      }
    };

    void refresh(false);
    const interval = window.setInterval(() => void refresh(true), POLL_INTERVAL_MS);
    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, []);

  const allRecommendations = useMemo(
    () => deduplicate([
      ...(currentBundle?.recommendations ?? []),
      ...(expectedBundle?.recommendations ?? []),
    ]),
    [currentBundle, expectedBundle],
  );
  const occupantRecommendations = allRecommendations.filter(isOccupantAudience);
  const buildingRecommendations = allRecommendations.filter(isManagerAudience);
  const weatherContext = replay?.weather ?? weather?.weather ?? null;
  const replayModeLabel = replay?.mode === 'historical_replay'
    ? 'Historical Replay'
    : replay?.mode ?? 'Mode unavailable';
  const currentDemand = replay?.demand_kw ?? null;
  const peakMessage =
    peak?.peak_status === 'predicted_peak'
      ? 'ENERSENSE expects elevated demand.'
      : peak?.peak_status === 'near_peak'
        ? 'Building demand is approaching a historical peak.'
        : peak?.peak_status === 'below_peak'
          ? 'Demand is currently below the historical peak threshold.'
          : 'Peak status is not available right now.';
  const chartData = records.map((record) => ({
    ...record,
    time: new Date(record.timestamp).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  }));

  const navItems: Array<{ tab: ResidentTab; icon: string }> = [
    { tab: 'Home', icon: 'home' },
    { tab: 'Insights', icon: 'insights' },
    { tab: 'Recommendations', icon: 'lightbulb' },
    { tab: 'Profile', icon: 'person' },
  ];

  const selectTab = (tab: ResidentTab) => {
    setActiveTab(tab);
    setProfileMenuOpen(false);
  };

  const recommendationSection = (
    <div className="space-y-4">
      <Panel>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">auto_awesome</span>
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">ENERSENSE Recommendation</p>
            <h2 className="mt-1 text-lg font-bold text-on-surface">For your home</h2>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {occupantRecommendations.length > 0 ? (
            occupantRecommendations.map((recommendation) => (
              <RecommendationCard key={recommendation.recommendation_id} recommendation={recommendation} label="Occupant action" />
            ))
          ) : (
            <div className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface">
              Personalized recommendations will appear when occupant-level data is connected.
            </div>
          )}
        </div>
        {buildingRecommendations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-surface-container-high">
            <h3 className="text-xs font-bold text-on-surface mb-3">Building-level advisory</h3>
            <div className="space-y-3">
              {buildingRecommendations.map((recommendation) => (
                <RecommendationCard key={recommendation.recommendation_id} recommendation={recommendation} label="Building advisory" />
              ))}
            </div>
            <p className="mt-3 text-[10px] text-outline">
              This recommendation is intended for the facility manager.
            </p>
          </div>
        )}
      </Panel>
      <Panel>
        <h2 className="text-sm font-bold text-on-surface">What can I do?</h2>
        <p className="mt-1 text-xs text-outline">
          Actions below come from the ENERSENSE recommendation model. Advice is informational; no home device is controlled.
        </p>
        <div className="mt-3 space-y-2">
          {occupantRecommendations.length > 0 ? occupantRecommendations.map((item) => (
            <div key={`action-${item.recommendation_id}`} className="flex gap-3 rounded-xl bg-surface-container-low p-3">
              <span className="material-symbols-outlined text-primary text-[19px]">tips_and_updates</span>
              <div>
                <p className="text-xs font-bold text-on-surface">{item.action}</p>
                <p className="mt-1 text-[11px] text-outline">{item.expected_window ?? 'Suggested timing not available'}</p>
              </div>
            </div>
          )) : (
            <p className="rounded-xl bg-surface-container-low p-3 text-xs text-outline">
              No occupant-specific action is available for this replay point.
            </p>
          )}
        </div>
      </Panel>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface text-on-surface">
      <header className="sticky top-0 z-30 border-b border-surface-container-high bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-16 flex items-center justify-between gap-3">
          <Logo />
          <nav className="hidden md:flex items-center gap-1" aria-label="Occupant navigation">
            {navItems.map(({ tab, icon }) => (
              <button
                key={tab}
                type="button"
                aria-current={activeTab === tab ? 'page' : undefined}
                onClick={() => selectTab(tab)}
                className={`min-h-10 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-primary text-on-primary'
                    : 'text-outline hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">{icon}</span>
                {tab}
              </button>
            ))}
          </nav>
          <div className="relative flex items-center gap-2">
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold">
              Occupant / Owner
            </span>
            <button
              type="button"
              aria-label="Profile menu"
              aria-expanded={profileMenuOpen}
              onClick={() => setProfileMenuOpen((open) => !open)}
              className="w-10 h-10 rounded-full bg-primary text-white font-bold text-xs"
            >
              {profile.name.slice(0, 2).toUpperCase()}
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 z-40 w-56 rounded-xl border border-surface-container-high bg-white p-2 shadow-xl">
                <button type="button" className="w-full text-left rounded-lg px-3 py-2 text-xs hover:bg-surface-container-low" onClick={() => selectTab('Profile')}>
                  View profile
                </button>
                <button type="button" className="w-full text-left rounded-lg px-3 py-2 text-xs hover:bg-surface-container-low" onClick={() => onSwitchRole('manager')}>
                  Facility Manager view
                </button>
                <button type="button" className="w-full text-left rounded-lg px-3 py-2 text-xs text-error hover:bg-surface-container-low" onClick={onLogout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8 pb-24 md:pb-10">
        {backendUnavailable && (
          <div role="status" className="mb-4 rounded-xl border border-error/20 bg-white p-3 text-xs text-error">
            Backend unavailable — building energy context is temporarily unavailable. Previously loaded information will be refreshed when the backend responds.
          </div>
        )}
        {replayError && (
          <div role="status" className="mb-4 rounded-xl border border-tertiary/20 bg-white p-3 text-xs text-tertiary">
            Replay could not advance. Showing the last available historical context.
          </div>
        )}

        {activeTab === 'Home' && (
          <div className="space-y-5">
            <section className="rounded-2xl bg-on-surface px-5 py-6 sm:px-8 sm:py-8 text-white relative overflow-hidden">
              <div className="absolute -right-12 -top-16 w-56 h-56 rounded-full border-[30px] border-white/5" />
              <div className="relative">
                <span className="inline-flex px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                  Occupant / Owner
                </span>
                <h1 className="mt-4 text-2xl sm:text-3xl font-bold">
                  {getGreeting()}, {profile.name}
                </h1>
                <p className="mt-2 text-sm text-white/75 break-words">
                  {profile.flatNumber} · {profile.building}
                </p>
                <p className="mt-5 text-xs text-white/70">
                  Building energy intelligence for the place you call home.
                </p>
              </div>
            </section>

            <Panel>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Your Energy Home</span>
                  <h2 className="mt-1 text-lg font-bold text-on-surface">{profile.building}</h2>
                  <p className="text-xs text-outline">{profile.flatNumber}</p>
                </div>
                <div className="sm:max-w-sm rounded-xl bg-surface-container-low p-3 text-xs">
                  <p className="font-semibold text-on-surface">Personal meter data isn&apos;t connected yet.</p>
                  <p className="mt-1 text-outline">Using building-level energy intelligence from I-BLEND Historical Replay.</p>
                </div>
              </div>
            </Panel>

            <section>
              <div className="flex items-end justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-base font-bold">Energy Status</h2>
                  <p className="text-[11px] text-outline">
                    Building-level context · {replay?.source ?? 'Source unavailable'} · {replayModeLabel}
                  </p>
                </div>
                <span className="text-[10px] text-outline">{formatTimestamp(replay?.timestamp)}</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                <StatCard icon="electric_bolt" label="Building demand" value={numberText(currentDemand, 'kW')} detail={replay?.building_name ?? 'Not available'} />
                <StatCard icon="query_stats" label="Forecast demand" value={numberText(forecast?.predicted_demand_kw, 'kW')} detail="Building-level forecast" tone="secondary" />
                <StatCard icon="show_chart" label="Peak status" value={peak?.peak_status?.replaceAll('_', ' ') ?? 'Not available'} detail={numberText(peak?.peak_threshold_kw, 'kW') + ' historical threshold'} tone="tertiary" />
                <StatCard icon="schedule" label="Tariff period" value={replay?.tariff?.period ?? 'Not available'} detail="Building-level tariff context" />
              </div>
            </section>

            <Panel>
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined">notifications_active</span>
                </span>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">Peak Alert</h2>
                  <p className="mt-1 text-xs text-outline">{peakMessage}</p>
                  {expectedBundle?.expected_window && (
                    <p className="mt-2 text-[11px] text-on-surface">
                      Forecast window: {expectedBundle.expected_window}
                    </p>
                  )}
                </div>
              </div>
            </Panel>

            {recommendationSection}

            <Panel>
              <h2 className="text-sm font-bold text-on-surface">Today&apos;s Conditions</h2>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <StatCard icon="thermostat" label="Temperature" value={numberText(weatherContext?.temperature_c, '°C')} />
                <StatCard icon="humidity_percentage" label="Humidity" value={numberText(weatherContext?.relative_humidity_percent, '%')} tone="secondary" />
                <StatCard icon="rainy" label="Rainfall" value={numberText(weatherContext?.rainfall_mm, 'mm')} tone="tertiary" />
              </div>
              <p className="mt-3 text-[10px] text-outline">
                Weather context helps ENERSENSE understand building energy demand. It is not a personal room reading.
              </p>
            </Panel>
          </div>
        )}

        {activeTab === 'Insights' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold">Building insights</h1>
              <p className="mt-1 text-xs text-outline">Historical building demand and the context behind it — not personal flat usage.</p>
            </div>
            <Panel>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold">Building Energy Trend</h2>
                  <p className="mt-1 text-[11px] text-outline">
                    {replay?.source ?? 'I-BLEND'} Historical Demand · kW
                  </p>
                </div>
                <span className="text-[10px] text-outline">{replayStatus?.replay_period ?? 'Historical replay'}</span>
              </div>
              <div className="mt-4 h-64 sm:h-80 w-full min-w-0">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="residentDemand" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00855d" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#00855d" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#eaedff" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#6d7a72" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#6d7a72" width={45} />
                      <Tooltip
                        formatter={(value) => [`${Number(value).toFixed(2)} kW`, 'Building demand']}
                        labelFormatter={(label) => `${label} · historical replay`}
                      />
                      <Area type="monotone" dataKey="demand_kw" stroke="#00855d" strokeWidth={2.5} fill="url(#residentDemand)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center rounded-xl bg-surface-container-low text-xs text-outline">
                    Building replay trend is not available.
                  </div>
                )}
              </div>
              <p className="mt-2 text-[10px] text-outline">
                {records.length} historical records · Source: I-BLEND · Mode: Historical Replay
              </p>
            </Panel>
            <Panel>
              <h2 className="text-sm font-bold">Today&apos;s Conditions</h2>
              <p className="mt-1 text-[11px] text-outline">Weather context helps ENERSENSE understand building energy demand.</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <StatCard icon="thermostat" label="Temperature" value={numberText(weatherContext?.temperature_c, '°C')} />
                <StatCard icon="humidity_percentage" label="Humidity" value={numberText(weatherContext?.relative_humidity_percent, '%')} tone="secondary" />
                <StatCard icon="rainy" label="Rainfall" value={numberText(weatherContext?.rainfall_mm, 'mm')} tone="tertiary" />
              </div>
            </Panel>
            <Panel>
              <h2 className="text-sm font-bold">Why this matters</h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-surface-container-low p-3">
                  <span className="text-outline">Estimated flexible demand</span>
                  <p className="mt-1 font-bold text-on-surface">{numberText(flexibility?.potential_flexible_kw, 'kW')}</p>
                </div>
                <div className="rounded-xl bg-surface-container-low p-3">
                  <span className="text-outline">Backend impact estimate</span>
                  <p className="mt-1 font-bold text-on-surface">{numberText(impact?.estimated_energy_impact_kwh, 'kWh')}</p>
                </div>
                <div className="rounded-xl bg-surface-container-low p-3">
                  <span className="text-outline">Carbon impact</span>
                  <p className="mt-1 font-bold text-on-surface">Unavailable</p>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-outline">
                Carbon impact will be available when a verified emissions factor is configured. Flexible demand and impact are estimates, not measured personal savings.
              </p>
            </Panel>
          </div>
        )}

        {activeTab === 'Recommendations' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold">Recommendations</h1>
              <p className="mt-1 text-xs text-outline">Advice is based on real backend recommendation states. ENERSENSE does not control home devices.</p>
            </div>
            {recommendationSection}
            <Panel>
              <h2 className="text-sm font-bold text-on-surface">Building energy context</h2>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatCard icon="electric_bolt" label="Demand" value={numberText(currentDemand, 'kW')} />
                <StatCard icon="query_stats" label="Forecast" value={numberText(forecast?.predicted_demand_kw, 'kW')} tone="secondary" />
                <StatCard icon="show_chart" label="Peak status" value={peak?.peak_status?.replaceAll('_', ' ') ?? 'Not available'} tone="tertiary" />
                <StatCard icon="bolt" label="Flexibility estimate" value={numberText(flexibility?.potential_flexible_kw, 'kW')} />
              </div>
            </Panel>
          </div>
        )}

        {activeTab === 'Profile' && (
          <div className="max-w-2xl space-y-5">
            <div>
              <h1 className="text-xl font-bold">Your profile</h1>
              <p className="mt-1 text-xs text-outline">MVP Demo profile stored in this browser. Password is not saved.</p>
            </div>
            <Panel>
              <div className="flex items-center gap-3 pb-4 border-b border-surface-container-high">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  {profile.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold break-words">{profile.name}</h2>
                  <p className="text-xs text-outline">Occupant / Owner</p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs">
                {[
                  ['Email', profile.email],
                  ['Mobile', profile.phone],
                  ['Building', profile.building],
                  ['Flat / Apartment', profile.flatNumber],
                  ['Resident type', profile.residentType || 'Not specified'],
                  ['Preferred notification', profile.notificationPreference || 'No preference'],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col sm:flex-row sm:justify-between gap-1 py-2 border-b border-surface-container-high last:border-0">
                    <span className="text-outline">{label}</span>
                    <span className="font-semibold text-on-surface break-words">{value}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel>
              <h2 className="text-sm font-bold">Role access</h2>
              <p className="mt-1 text-xs text-outline">Switching roles requires a saved demo profile for that role.</p>
              <button type="button" onClick={() => onSwitchRole('manager')} className="mt-4 w-full sm:w-auto min-h-11 px-4 rounded-xl border border-surface-container-high text-xs font-bold hover:bg-surface-container-low">
                Continue as Facility Manager
              </button>
              <button type="button" onClick={onLogout} className="mt-3 sm:mt-0 sm:ml-2 w-full sm:w-auto min-h-11 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container">
                Log out
              </button>
            </Panel>
          </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-surface-container-high pb-[env(safe-area-inset-bottom)]" aria-label="Occupant navigation">
        <div className="grid grid-cols-4 max-w-lg mx-auto px-2 py-1">
          {navItems.map(({ tab, icon }) => (
            <button
              key={tab}
              type="button"
              aria-current={activeTab === tab ? 'page' : undefined}
              onClick={() => selectTab(tab)}
              className={`min-h-14 flex flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-semibold ${
                activeTab === tab ? 'text-primary' : 'text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              {tab}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-8 h-8 rounded-lg bg-on-surface flex items-center justify-center text-primary font-bold">⚡</div>
      <span className="text-lg font-bold tracking-tight text-on-surface">
        ENER<span className="text-primary">SENSE</span>
      </span>
    </div>
  );
}
