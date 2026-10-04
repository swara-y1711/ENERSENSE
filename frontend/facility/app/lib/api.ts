const API_BASE_URL = 'http://127.0.0.1:8000';

export interface ReplayRecord {
  timestamp: string;
  building_name: string;
  demand_kw: number;
  source: string;
  mode: string;
  replay: boolean;
}

export interface ReplayContext extends ReplayRecord {
  weather?: {
    temperature_c: number | null;
    relative_humidity_percent: number | null;
    rainfall_mm: number | null;
    source: string;
  } | null;
  tariff?: {
    period: string | null;
    adjustment_percent: number | null;
    base_energy_rate: number | null;
    applicable_rate: number | null;
  } | null;
}

export interface WeatherCurrent {
  timestamp: string;
  weather: {
    temperature_c: number | null;
    relative_humidity_percent: number | null;
    rainfall_mm: number | null;
    source: string;
  } | null;
  source: string;
  mode: string;
}

export interface ReplayStatus {
  source: string;
  building: string;
  replay_period: string;
  start_timestamp: string;
  end_timestamp: string;
  total_records: number;
  interval: string;
  current_position: number;
}

export interface ForecastCurrent {
  timestamp: string;
  actual_demand_kw: number | null;
  predicted_demand_kw: number | null;
  error_kw: number | null;
  error_percent: number | null;
  model: string | null;
  mode: string;
}

export interface PeakCurrent {
  timestamp: string;
  predicted_demand_kw: number | null;
  actual_demand_kw: number | null;
  peak_threshold_kw: number | null;
  near_peak_threshold_kw: number | null;
  is_predicted_peak: boolean;
  peak_status: string;
  mode: string;
}

export interface ExpectedPeak {
  window_start: string;
  window_end: string;
  predicted_peak_demand_kw: number | null;
  predicted_peak_timestamp: string | null;
  peak_threshold_kw: number | null;
  near_peak_threshold_kw: number | null;
  is_peak_expected: boolean;
  window_intervals_count: number;
  mode: string;
  intervals: Array<{
    timestamp: string;
    predicted_demand_kw: number | null;
    actual_demand_kw: number | null;
    peak_status: string;
  }>;
}

export interface FlexibilityCurrent {
  timestamp: string;
  predicted_demand_kw: number | null;
  historical_reference_demand_kw: number | null;
  potential_flexible_kw: number | null;
  flexibility_method: string;
  mode: string;
  notice: string;
}

export interface Recommendation {
  recommendation_id: string;
  priority: string;
  audience: string;
  action: string;
  reason: string;
  expected_window: string | null;
  peak_status: string;
  predicted_demand_kw: number | null;
  potential_flexible_kw: number | null;
  tariff_period: string | null;
  season: string | null;
  evidence: string;
  method: string;
  mode: string;
}

export interface RecommendationsCurrent {
  timestamp: string;
  peak_status: string;
  predicted_demand_kw: number | null;
  potential_flexible_kw: number | null;
  tariff_period: string | null;
  overall_priority: string;
  recommendations: Recommendation[];
  mode: string;
  notice: string;
  weather_context?: {
    temperature_c: number | null;
    relative_humidity_percent: number | null;
    rainfall_mm: number | null;
    label?: string | null;
    source?: string | null;
  } | null;
  expected_window?: string | null;
}

export type RecommendationsExpected = RecommendationsCurrent;

export interface ImpactCurrent {
  timestamp: string;
  actual_demand_kw: number | null;
  baseline_demand_kw: number | null;
  predicted_demand_kw: number | null;
  scenario_demand_kw: number | null;
  potential_reduction_kw: number | null;
  potential_flexible_kw: number | null;
  requested_reduction_kw: number | null;
  applied_simulated_reduction_kw: number | null;
  baseline_difference_kw: number | null;
  scenario_difference_from_actual_kw: number | null;
  interval_duration_hours: number | null;
  estimated_energy_impact_kwh: number | null;
  baseline_method: string;
  method: string;
  mode: string;
  notice: string;
}

export interface ImpactSimulation {
  start_timestamp: string;
  end_timestamp: string;
  requested_reduction_kw: number;
  interval_count: number;
  total_intervals: number;
  fully_achievable_intervals: number;
  achievable_percentage: number;
  average_actual_demand_kw: number;
  average_baseline_demand_kw: number;
  average_scenario_demand_kw: number;
  average_simulated_reduction_kw: number;
  maximum_simulated_reduction_kw: number;
  total_simulated_reduction_kwh: number;
  interval_duration_hours?: number | null;
  mode?: string | null;
  notice?: string | null;
}

export interface GridEventSimulation {
  start_time: string;
  end_time: string;
  requested_reduction_kw: number;
  total_intervals: number;
  achievable_intervals_count: number;
  is_fully_achievable: boolean;
  average_potential_flexible_kw: number;
  max_potential_flexible_kw: number;
  average_simulated_demand_kw: number;
  mode: string;
  notice: string;
  intervals: Array<Record<string, unknown>>;
}

export interface TariffCurrent {
  timestamp: string;
  period: string | null;
  is_peak: boolean;
  adjustment_percent: number | null;
  base_energy_rate: number | null;
  applicable_rate: number | null;
  demand_charge: number | null;
  currency: string | null;
  utility: string | null;
  consumer_category: string | null;
  effective_from: string | null;
  effective_to: string | null;
  source: string | null;
  is_verified: boolean;
  note: string | null;
}

export interface TariffConfig {
  building_name: string;
  utility: string | null;
  consumer_category: string | null;
  peak_windows: Array<{ start: string; end: string; name?: string | null }>;
  offpeak_windows: Array<{ start: string; end: string; name?: string | null }>;
  peak_start: string | null;
  peak_end: string | null;
  offpeak_start: string | null;
  offpeak_end: string | null;
  peak_adjustment: number | null;
  offpeak_rebate: number | null;
  base_energy_rate: number | null;
  demand_charge: number | null;
  currency: string | null;
  effective_from: string | null;
  effective_to: string | null;
  source: string | null;
  is_verified: boolean;
  note: string | null;
  peak_rate: number | null;
  offpeak_rate: number | null;
  normal_rate: number | null;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`POST ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function addHoursPreservingOffset(timestamp: string, hours: number): string {
  const offsetMatch = /([+-])(\d{2}):?(\d{2})$/.exec(timestamp);
  const offsetSuffix = timestamp.endsWith('Z')
    ? 'Z'
    : offsetMatch
      ? `${offsetMatch[1]}${offsetMatch[2]}:${offsetMatch[3]}`
      : 'Z';
  const offsetMinutes = offsetMatch
    ? (offsetMatch[1] === '+' ? 1 : -1) *
      (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3]))
    : 0;
  const date = new Date(
    new Date(timestamp).getTime() +
      hours * 60 * 60 * 1000 +
      offsetMinutes * 60 * 1000,
  );
  const pad = (value: number) => String(value).padStart(2, '0');
  const datePart = [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
  ].join('-');
  const timePart = [
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
  ].join(':');
  return `${datePart}T${timePart}${offsetSuffix}`;
}

export function getReplayCurrent(): Promise<ReplayRecord> {
  return getJson('/api/replay/current');
}

export function getReplayContext(): Promise<ReplayContext> {
  return getJson('/api/replay/current-context');
}

export function getWeatherCurrent(): Promise<WeatherCurrent> {
  return getJson('/api/weather/current');
}

export function getReplaySample(): Promise<ReplayRecord[]> {
  return getJson('/api/replay/sample');
}

export function getReplayStatus(): Promise<ReplayStatus> {
  return getJson('/api/replay/status');
}

export function getReplayNext(): Promise<ReplayRecord> {
  return getJson('/api/replay/next');
}

export function getForecastCurrent(): Promise<ForecastCurrent> {
  return getJson('/api/forecast/current');
}

export function getPeakCurrent(): Promise<PeakCurrent> {
  return getJson('/api/peak/current');
}

export function getPeakExpected(): Promise<ExpectedPeak> {
  return getJson('/api/peak/expected');
}

export function getFlexibilityCurrent(): Promise<FlexibilityCurrent> {
  return getJson('/api/flexibility/current');
}

export function getRecommendationsCurrent(): Promise<RecommendationsCurrent> {
  return getJson('/api/recommendations/current');
}

export function getRecommendationsExpected(): Promise<RecommendationsExpected> {
  return getJson('/api/recommendations/expected');
}

export function getImpactCurrent(): Promise<ImpactCurrent> {
  return getJson('/api/impact/current');
}

export function getTariffCurrent(): Promise<TariffCurrent> {
  return getJson('/api/tariff/current');
}

export function getTariffConfig(): Promise<TariffConfig> {
  return getJson('/api/tariff/config');
}

export function simulateFlexibility(
  startTime: string,
  durationHours: number,
  requestedReductionKw: number,
): Promise<GridEventSimulation> {
  const endTime = addHoursPreservingOffset(startTime, durationHours);
  return postJson('/api/flexibility/simulate', {
    start_time: startTime,
    end_time: endTime,
    requested_reduction_kw: requestedReductionKw,
  });
}

export function simulateImpact(
  startTimestamp: string,
  durationHours: number,
  requestedReductionKw: number,
): Promise<ImpactSimulation> {
  const endTimestamp = addHoursPreservingOffset(startTimestamp, durationHours);

  return postJson('/api/impact/simulate', {
    start_timestamp: startTimestamp,
    end_timestamp: endTimestamp,
    requested_reduction_kw: requestedReductionKw,
  });
}
