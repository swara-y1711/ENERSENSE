'use client';

import React, { useState } from 'react';
import DemandProfileChart from './DemandProfileChart';
import ImpactVerification from './ImpactVerification';
import WhatIfSimulator from './WhatIfSimulator';
import {
  ExpectedPeak,
  FlexibilityCurrent,
  ForecastCurrent,
  GridEventSimulation,
  ImpactCurrent,
  PeakCurrent,
  Recommendation,
  RecommendationsCurrent,
  ReplayContext,
  ReplayRecord,
  ReplayStatus,
  simulateFlexibility,
  TariffConfig,
  TariffCurrent,
} from '../lib/api';

interface FacilityViewsProps {
  section: string;
  replay: ReplayContext | null;
  records: ReplayRecord[];
  replayStatus: ReplayStatus | null;
  forecast: ForecastCurrent | null;
  peak: PeakCurrent | null;
  expectedPeak: ExpectedPeak | null;
  flexibility: FlexibilityCurrent | null;
  recommendations: RecommendationsCurrent | null;
  expectedRecommendations: RecommendationsCurrent | null;
  impact: ImpactCurrent | null;
  tariff: TariffCurrent | null;
  tariffConfig: TariffConfig | null;
  backendUnavailable: boolean;
  onReturnToOverview: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'alert') => void;
}

function metric(value: number | null | undefined, unit = ''): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Not available';
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ''}`;
}

function dateTime(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

function DashboardSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-on-surface">{title}</h1>
        <p className="text-xs text-outline mt-1">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function InfoCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high">
      <div className="text-[10px] font-mono uppercase text-outline">{label}</div>
      <div className="mt-1 text-base sm:text-lg font-bold text-on-surface break-words">
        {value}
      </div>
      {detail && <div className="mt-1 text-[11px] text-outline break-words">{detail}</div>}
    </div>
  );
}

function DataPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-xl border border-surface-container-high shadow-xs">
      {children}
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 py-2 border-b border-surface-container-high last:border-0 text-xs">
      <span className="text-outline">{label}</span>
      <span className="font-medium text-on-surface text-left sm:text-right break-words sm:max-w-[65%]">
        {value ?? 'Not available'}
      </span>
    </div>
  );
}

function recommendationAudience(recommendation: Recommendation): string {
  return recommendation.audience.toLowerCase().replace(/[- ]/g, '_');
}

function RecommendationList({
  title,
  recommendations,
  emptyText,
}: {
  title: string;
  recommendations: Recommendation[];
  emptyText: string;
}) {
  return (
    <DataPanel>
      <h2 className="text-sm font-bold text-on-surface mb-3">{title}</h2>
      {recommendations.length === 0 ? (
        <p className="text-xs text-outline">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {recommendations.map((recommendation) => (
            <article
              key={recommendation.recommendation_id}
              className="p-3 bg-surface-container-low rounded-xl border border-surface-container-high"
            >
              <div className="flex flex-wrap justify-between gap-2 text-[10px] font-mono uppercase text-primary">
                <span>{recommendation.priority || 'Priority unavailable'}</span>
                <span>{recommendation.audience}</span>
              </div>
              <h3 className="mt-1 text-sm font-bold text-on-surface">
                {recommendation.action}
              </h3>
              <p className="mt-1 text-xs text-outline">{recommendation.reason}</p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Field label="Expected window" value={recommendation.expected_window} />
                <Field label="Peak status" value={recommendation.peak_status} />
                <Field
                  label="Predicted demand"
                  value={metric(recommendation.predicted_demand_kw, 'kW')}
                />
                <Field
                  label="Estimated flexibility"
                  value={metric(recommendation.potential_flexible_kw, 'kW')}
                />
                <Field label="Tariff period" value={recommendation.tariff_period} />
              </div>
            </article>
          ))}
        </div>
      )}
    </DataPanel>
  );
}

export default function FacilityViews({
  section,
  replay,
  records,
  replayStatus,
  forecast,
  peak,
  expectedPeak,
  flexibility,
  recommendations,
  expectedRecommendations,
  impact,
  tariff,
  tariffConfig,
  backendUnavailable,
  onReturnToOverview,
  showToast,
}: FacilityViewsProps) {
  const [flexibilitySimulation, setFlexibilitySimulation] =
    useState<GridEventSimulation | null>(null);
  const [flexibilitySimulationError, setFlexibilitySimulationError] =
    useState<string | null>(null);
  const [isSimulatingFlexibility, setIsSimulatingFlexibility] = useState(false);

  const currentRecommendations = recommendations?.recommendations ?? [];
  const expectedRecommendationItems =
    expectedRecommendations?.recommendations ?? [];
  const facilityManagerRecommendations = [
    ...currentRecommendations,
    ...expectedRecommendationItems,
  ].filter((item) => ['facility_manager', 'both', 'facility_manager_and_occupant'].includes(
    recommendationAudience(item),
  ));
  const occupantRecommendations = [
    ...currentRecommendations,
    ...expectedRecommendationItems,
  ].filter((item) => ['occupant', 'both', 'facility_manager_and_occupant'].includes(
    recommendationAudience(item),
  ));
  const allRecommendations = [...currentRecommendations, ...expectedRecommendationItems];
  const weather = replay?.weather ?? recommendations?.weather_context ?? null;
  const relevantHvacRecommendations = allRecommendations.filter((item) =>
    `${item.action} ${item.reason}`.toLowerCase().match(/hvac|cool|cooling|temperature|thermal/),
  );

  const runFlexibilitySimulation = async () => {
    const flexibleKw = flexibility?.potential_flexible_kw;
    if (!replay || typeof flexibleKw !== 'number' || !Number.isFinite(flexibleKw)) {
      setFlexibilitySimulationError('Flexibility estimate unavailable.');
      return;
    }
    if (flexibleKw <= 0) {
      setFlexibilitySimulationError('No positive flexible demand is currently estimated.');
      return;
    }
    setIsSimulatingFlexibility(true);
    setFlexibilitySimulationError(null);
    try {
      const result = await simulateFlexibility(replay.timestamp, 1, flexibleKw);
      setFlexibilitySimulation(result);
    } catch (error) {
      setFlexibilitySimulationError(
        error instanceof Error ? error.message : 'Flexibility simulation unavailable.',
      );
    } finally {
      setIsSimulatingFlexibility(false);
    }
  };

  if (section === 'Live Telemetry') {
    return (
      <DashboardSection
        title="Live Telemetry"
        subtitle="I-BLEND Historical Replay — historical data replay, not live physical smart-meter telemetry."
      >
        {backendUnavailable && (
          <DataPanel><p className="text-xs text-error">Backend unavailable. Retaining any previously loaded replay data.</p></DataPanel>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InfoCard label="Current demand" value={metric(replay?.demand_kw, 'kW')} />
          <InfoCard label="Timestamp" value={dateTime(replay?.timestamp)} />
          <InfoCard label="Building" value={replay?.building_name ?? 'Not available'} />
          <InfoCard label="Source / mode" value={`${replay?.source ?? 'Not available'} · ${replay?.mode === 'historical_replay' ? 'Historical Replay' : replay?.mode ?? 'Not available'}`} />
          <InfoCard label="Temperature" value={metric(weather?.temperature_c, '°C')} />
          <InfoCard label="Humidity" value={metric(weather?.relative_humidity_percent, '%')} />
          <InfoCard label="Rainfall" value={metric(weather?.rainfall_mm, 'mm')} />
          <InfoCard label="Tariff period" value={replay?.tariff?.period ?? tariff?.period ?? 'Not available'} />
          <InfoCard label="Replay position" value={replayStatus ? `${replayStatus.current_position + 1} / ${replayStatus.total_records}` : 'Not available'} />
          <InfoCard label="Replay interval" value={replayStatus?.interval ?? 'Not available'} />
        </div>
        <DemandProfileChart records={records} />
        <DataPanel>
          <h2 className="text-sm font-bold text-on-surface mb-3">Recent Replay Records</h2>
          {records.length === 0 ? (
            <p className="text-xs text-outline">Awaiting replay records.</p>
          ) : (
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-surface-container-low text-outline font-mono uppercase">
                  <tr><th className="p-2">Timestamp</th><th className="p-2">Building</th><th className="p-2">Demand</th><th className="p-2">Source</th></tr>
                </thead>
                <tbody>
                  {[...records].reverse().slice(0, 20).map((record) => (
                    <tr key={record.timestamp} className="border-t border-surface-container-high">
                      <td className="p-2 font-mono">{record.timestamp}</td>
                      <td className="p-2">{record.building_name}</td>
                      <td className="p-2 font-mono">{metric(record.demand_kw, 'kW')}</td>
                      <td className="p-2">{record.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataPanel>
      </DashboardSection>
    );
  }

  if (section === 'Demand Response') {
    return (
      <DashboardSection title="Demand Response" subtitle="Peak detection, estimated flexibility, recommendations, and advisory scenario analysis. No equipment is controlled.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InfoCard label="Current demand" value={metric(replay?.demand_kw, 'kW')} />
          <InfoCard label="Forecast demand" value={metric(forecast?.predicted_demand_kw, 'kW')} detail={forecast?.timestamp} />
          <InfoCard label="Peak status" value={peak?.peak_status ?? 'Not available'} detail={`Threshold: ${metric(peak?.peak_threshold_kw, 'kW')}`} />
          <InfoCard label="Estimated flexible demand" value={metric(flexibility?.potential_flexible_kw, 'kW')} detail={flexibility?.notice} />
        </div>
        <RecommendationList title="Current and Expected Recommendations" recommendations={allRecommendations} emptyText="No current or expected recommendation is available for this replay point." />
        <WhatIfSimulator
          replay={replay}
          flexibility={flexibility}
          impact={impact}
          showToast={showToast}
        />
        <DataPanel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-on-surface">Backend Flexibility Simulation</h2>
              <p className="text-xs text-outline mt-1">Advisory grid-event simulation based on the current estimated flexible demand.</p>
            </div>
            <button
              className="min-h-[40px] px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold disabled:opacity-50"
              disabled={isSimulatingFlexibility || typeof flexibility?.potential_flexible_kw !== 'number' || flexibility.potential_flexible_kw <= 0 || !replay}
              onClick={() => void runFlexibilitySimulation()}
            >
              {isSimulatingFlexibility ? 'Simulating…' : 'Evaluate Estimated Flexibility'}
            </button>
          </div>
          {flexibilitySimulationError && <p role="status" className="mt-2 text-xs text-error">{flexibilitySimulationError}</p>}
          {flexibilitySimulation && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <InfoCard label="Backend estimated flexibility" value={metric(flexibilitySimulation.average_potential_flexible_kw, 'kW')} />
              <InfoCard label="Simulated average demand" value={metric(flexibilitySimulation.average_simulated_demand_kw, 'kW')} />
              <InfoCard label="Achievability" value={flexibilitySimulation.is_fully_achievable ? 'Achievable' : `${flexibilitySimulation.achievable_intervals_count} / ${flexibilitySimulation.total_intervals} intervals`} detail={flexibilitySimulation.notice} />
            </div>
          )}
        </DataPanel>
      </DashboardSection>
    );
  }

  if (section === 'Human Presence' || section === 'Occupant View') {
    return (
      <DashboardSection title={section === 'Occupant View' ? 'ENERSENSE Occupant Advisory' : 'Human-Aware Energy Intelligence'} subtitle="Recommendations use the replay's backend context; no occupant presence or comfort sensors are available.">
        <DataPanel>
          <h2 className="text-sm font-bold text-on-surface mb-2">Current replay context</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <Field label="Peak status" value={recommendations?.peak_status} />
            <Field label="Predicted demand" value={metric(recommendations?.predicted_demand_kw, 'kW')} />
            <Field label="Estimated flexible demand" value={metric(recommendations?.potential_flexible_kw, 'kW')} />
            <Field label="Tariff period" value={recommendations?.tariff_period} />
            <Field label="Temperature" value={metric(weather?.temperature_c, '°C')} />
            <Field label="Humidity" value={metric(weather?.relative_humidity_percent, '%')} />
            <Field label="Rainfall" value={metric(weather?.rainfall_mm, 'mm')} />
            <Field label="Weather source" value={weather?.source} />
          </div>
        </DataPanel>
        <RecommendationList
          title="Occupant Recommendations"
          recommendations={occupantRecommendations}
          emptyText="No occupant-specific recommendation is available for this replay point."
        />
        <RecommendationList
          title="Facility Manager Recommendations"
          recommendations={facilityManagerRecommendations}
          emptyText="No facility-manager recommendation is available for this replay point."
        />
        {section === 'Occupant View' && (
          <button className="min-h-[44px] px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold" onClick={onReturnToOverview}>
            Return to Facility Manager View
          </button>
        )}
      </DashboardSection>
    );
  }

  if (section === 'HVAC Control') {
    return (
      <DashboardSection title="HVAC Energy Intelligence" subtitle="Advisory demand intelligence only; HVAC-specific telemetry and equipment controls are not available.">
        <DataPanel>
          <p className="text-xs text-outline">
            HVAC-specific telemetry/control is not available from the I-BLEND replay. ENERSENSE can still estimate demand and provide advisory recommendations.
          </p>
        </DataPanel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InfoCard label="Current building demand" value={metric(replay?.demand_kw, 'kW')} />
          <InfoCard label="Forecast demand" value={metric(forecast?.predicted_demand_kw, 'kW')} />
          <InfoCard label="Temperature" value={metric(weather?.temperature_c, '°C')} detail={weather?.source} />
          <InfoCard label="Estimated flexible demand" value={metric(flexibility?.potential_flexible_kw, 'kW')} />
        </div>
        <RecommendationList title="Cooling / HVAC-Related Recommendations" recommendations={relevantHvacRecommendations} emptyText="No recommendation specifically relating to cooling or HVAC is available." />
      </DashboardSection>
    );
  }

  if (section === 'ESG & Carbon') {
    return (
      <DashboardSection title="Energy Impact & Carbon" subtitle="Historical replay context and backend what-if impact estimates; energy impact is not equivalent to verified savings.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InfoCard label="Current demand" value={metric(replay?.demand_kw, 'kW')} />
          <InfoCard label="Estimated reduction" value={metric(impact?.potential_reduction_kw, 'kW')} />
          <InfoCard label="Estimated energy impact" value={metric(impact?.estimated_energy_impact_kwh, 'kWh')} />
          <InfoCard label="Scenario demand" value={metric(impact?.scenario_demand_kw, 'kW')} />
        </div>
        <DataPanel>
          <h2 className="text-sm font-bold text-on-surface">Carbon impact</h2>
          <p className="text-xs text-outline mt-2">
            Carbon calculation unavailable — no verified emissions factor is configured.
          </p>
          <p className="text-xs text-outline mt-3">
            Energy impact is reported by the backend using {impact?.method ?? 'an unavailable method'}.
            {impact?.notice ? ` ${impact.notice}` : ''}
          </p>
        </DataPanel>
        <WhatIfSimulator
          replay={replay}
          flexibility={flexibility}
          impact={impact}
          showToast={showToast}
        />
        <ImpactVerification impact={impact} showToast={showToast} />
      </DashboardSection>
    );
  }

  if (section === 'Alerts & Faults') {
    const peakAlert = peak?.peak_status === 'predicted_peak'
      ? 'Predicted peak demand detected'
      : peak?.peak_status === 'near_peak'
        ? 'Demand approaching historical peak threshold'
        : peak?.peak_status === 'below_peak'
          ? 'No peak alert currently active'
          : 'Peak status unavailable';
    const expectedPeakAlert = expectedPeak === null
      ? 'Expected peak status unavailable'
      : expectedPeak.is_peak_expected
        ? 'Peak demand expected in the forecast window'
        : 'No peak expected in the forecast window';

    return (
      <DashboardSection title="Alerts & Faults" subtitle="Alerts are derived from current and expected backend peak/recommendation states.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard label="Current peak state" value={peakAlert} detail={peak?.peak_status} />
          <InfoCard label="Expected peak state" value={expectedPeakAlert} detail={expectedPeak?.window_start && expectedPeak.window_end ? `${dateTime(expectedPeak.window_start)} – ${dateTime(expectedPeak.window_end)}` : undefined} />
        </div>
        <DataPanel>
          <h2 className="text-sm font-bold text-on-surface mb-2">Peak threshold context</h2>
          <Field label="Predicted demand" value={metric(peak?.predicted_demand_kw, 'kW')} />
          <Field label="Peak threshold" value={metric(peak?.peak_threshold_kw ?? expectedPeak?.peak_threshold_kw, 'kW')} />
          <Field label="Near-peak threshold" value={metric(peak?.near_peak_threshold_kw ?? expectedPeak?.near_peak_threshold_kw, 'kW')} />
          <Field label="Expected peak timestamp" value={dateTime(expectedPeak?.predicted_peak_timestamp)} />
        </DataPanel>
        <RecommendationList title="Current and Expected Recommendations" recommendations={allRecommendations} emptyText="No current or expected recommendations are available." />
        <DataPanel><p className="text-xs text-outline">Equipment fault telemetry is not available from the current I-BLEND replay.</p></DataPanel>
      </DashboardSection>
    );
  }

  if (section === 'Facility Config') {
    const rate = tariff?.applicable_rate;
    const configuredPeakWindows = tariffConfig?.peak_windows ?? [];
    const configuredOffPeakWindows = tariffConfig?.offpeak_windows ?? [];
    return (
      <DashboardSection title="Facility Configuration" subtitle="Building, replay, and tariff context reported by backend endpoints. Unverified tariff fields are identified explicitly.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InfoCard label="Building" value={replay?.building_name ?? replayStatus?.building ?? 'Not available'} />
          <InfoCard label="Data source" value={replay?.source ?? replayStatus?.source ?? 'Not available'} />
          <InfoCard label="Operating mode" value={replay?.mode === 'historical_replay' ? 'Historical Replay' : replay?.mode ?? 'Not available'} />
          <InfoCard label="Replay interval" value={replayStatus?.interval ?? 'Not available'} />
          <InfoCard label="Replay period" value={replayStatus?.replay_period ?? 'Not available'} />
          <InfoCard label="Replay position" value={replayStatus ? `${replayStatus.current_position + 1} / ${replayStatus.total_records}` : 'Not available'} />
          <InfoCard label="Tariff period" value={tariff?.period ?? replay?.tariff?.period ?? 'Not available'} />
          <InfoCard label="Tariff verification" value={tariff?.is_verified ? 'Verified' : 'Not verified'} />
        </div>
        <DataPanel>
          <h2 className="text-sm font-bold text-on-surface mb-2">Utility and tariff configuration</h2>
          <Field label="Utility" value={tariff?.utility ?? tariffConfig?.utility ?? 'Not available'} />
          <Field label="Consumer category" value={tariff?.consumer_category ?? tariffConfig?.consumer_category ?? 'Not available'} />
          <Field label="Applicable rate" value={tariff?.is_verified && typeof rate === 'number' ? `${rate} ${tariff.currency ?? ''}` : 'Not verified'} />
          <Field label="Base energy rate" value={tariff?.is_verified && tariff.base_energy_rate !== null ? `${tariff.base_energy_rate} ${tariff.currency ?? ''}` : 'Not verified'} />
          <Field label="Peak adjustment" value={tariffConfig?.is_verified && tariffConfig.peak_adjustment !== null ? `${tariffConfig.peak_adjustment}%` : 'Not verified'} />
          <Field label="Peak windows" value={configuredPeakWindows.length ? configuredPeakWindows.map((window) => `${window.name ?? 'Peak'} ${window.start}–${window.end}`).join(', ') : 'Not available'} />
          <Field label="Off-peak windows" value={configuredOffPeakWindows.length ? configuredOffPeakWindows.map((window) => `${window.name ?? 'Off-peak'} ${window.start}–${window.end}`).join(', ') : 'Not available'} />
          <Field label="Effective dates" value={tariff?.effective_from && tariff?.effective_to ? `${tariff.effective_from} – ${tariff.effective_to}` : 'Not available'} />
          <Field label="Configuration source" value={tariffConfig?.source ?? tariff?.source ?? 'Not available'} />
          <p className="text-xs text-outline mt-3">{tariffConfig?.note ?? tariff?.note ?? 'Tariff notes are not available.'}</p>
        </DataPanel>
      </DashboardSection>
    );
  }

  return null;
}
