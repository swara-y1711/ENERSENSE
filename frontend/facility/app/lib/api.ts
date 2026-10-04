/**
 * api.ts
 * ------
 * Centralized API client for the ENERSENSE FastAPI backend.
 * Uses NEXT_PUBLIC_API_URL or falls back to http://localhost:8000.
 */

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

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

export interface ReplayRecord {
  timestamp: string;
  building_name: string;
  demand_kw: number;
  source: string;
  mode: string;
  replay: boolean;
}

export interface WeatherObservation {
  temperature_c: number;
  relative_humidity_percent: number;
  rainfall_mm: number;
  source: string;
}

export interface WeatherResponse {
  timestamp: string;
  location: string;
  source: string;
  weather: WeatherObservation;
}

export interface TariffPeriodResult {
  timestamp: string;
  period: 'off_peak' | 'normal' | 'peak';
  adjustment_percent: number;
  base_energy_rate: number | null;
  applicable_rate: number | null;
}

export interface ForecastResult {
  timestamp: string;
  predicted_demand_kw: number;
  historical_reference_demand_kw: number;
  model_name: string;
  mode: string;
}

export interface PeakResult {
  timestamp: string;
  predicted_demand_kw: number;
  peak_status: 'below_peak' | 'near_peak' | 'predicted_peak';
  peak_threshold_kw: number;
  near_peak_threshold_kw: number;
  percentile_90_kw: number;
  percentile_95_kw: number;
}

export interface ExpectedPeakResult {
  window_start: string;
  window_end: string;
  is_peak_expected: boolean;
  predicted_peak_timestamp: string;
  predicted_peak_demand_kw: number;
  intervals_analyzed: number;
}

export interface FlexibilityResult {
  timestamp: string;
  predicted_demand_kw: number;
  historical_reference_demand_kw: number;
  potential_flexible_kw: number;
  flexibility_method: string;
  mode: string;
  notice: string;
}

export interface RecommendationItem {
  recommendation_id: string;
  priority: 'high' | 'medium' | 'low' | 'none';
  audience: 'occupant' | 'facility_manager' | 'both';
  action: string;
  reason: string;
  expected_window?: string;
  peak_status: string;
  predicted_demand_kw: number;
  potential_flexible_kw: number;
  tariff_period: string;
  season: string;
  weather_context?: {
    temperature_c?: number;
    relative_humidity_percent?: number;
    rainfall_mm?: number;
    label?: string;
    source?: string;
    season?: string;
  };
  evidence: string;
  method: string;
  mode: string;
}

export interface RecommendationBundle {
  timestamp: string;
  peak_status: string;
  predicted_demand_kw: number;
  potential_flexible_kw: number;
  historical_reference_demand_kw: number;
  tariff_period: string;
  is_weekend: boolean;
  season: string;
  weather_context?: Record<string, any>;
  upcoming_peak_expected: boolean;
  upcoming_peak_timestamp?: string | null;
  expected_window?: string | null;
  overall_priority: string;
  recommendations: RecommendationItem[];
  mode: string;
  notice: string;
}

export interface CurrentImpactResult {
  timestamp: string;
  actual_demand_kw: number;
  baseline_demand_kw: number;
  predicted_demand_kw: number;
  scenario_demand_kw: number;
  potential_reduction_kw: number;
  potential_flexible_kw: number;
  requested_reduction_kw: number;
  applied_simulated_reduction_kw: number;
  baseline_difference_kw: number;
  scenario_difference_from_actual_kw: number;
  interval_duration_hours: number;
  estimated_energy_impact_kwh: number;
  baseline_method: string;
  method: string;
  mode: string;
  notice: string;
}

export interface ImpactSimulationInterval {
  timestamp: string;
  actual_demand_kw: number;
  baseline_demand_kw: number;
  predicted_demand_kw: number;
  potential_flexible_kw: number;
  requested_reduction_kw: number;
  applied_simulated_reduction_kw: number;
  scenario_demand_kw: number;
  interval_energy_impact_kwh: number;
  is_fully_achievable: boolean;
}

export interface ImpactSimulationResponse {
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
  interval_duration_hours: number;
  mode: string;
  notice: string;
  intervals: ImpactSimulationInterval[];
}

/**
 * Low-level JSON fetcher with timeout and error handling.
 */
async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errText || res.statusText}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn(`[ENERSENSE API] Failed request to ${url}:`, err.message || err);
    throw err;
  }
}

// ----------------- API Methods -----------------

export async function getReplayStatus(): Promise<ReplayStatus> {
  return fetchApi<ReplayStatus>('/api/replay/status');
}

export async function getReplayCurrent(timestamp?: string): Promise<ReplayRecord> {
  const query = timestamp ? `?timestamp=${encodeURIComponent(timestamp)}` : '';
  return fetchApi<ReplayRecord>(`/api/replay/current${query}`);
}

export async function getReplaySample(limit: number = 24): Promise<ReplayRecord[]> {
  return fetchApi<ReplayRecord[]>(`/api/replay/sample?limit=${limit}`);
}

export async function getWeatherCurrent(timestamp?: string): Promise<WeatherResponse> {
  const query = timestamp ? `?timestamp=${encodeURIComponent(timestamp)}` : '';
  return fetchApi<WeatherResponse>(`/api/weather/current${query}`);
}

export async function getTariffCurrent(timestamp?: string): Promise<TariffPeriodResult> {
  const query = timestamp ? `?timestamp=${encodeURIComponent(timestamp)}` : '';
  return fetchApi<TariffPeriodResult>(`/api/tariff/current${query}`);
}

export async function getForecastCurrent(timestamp?: string): Promise<ForecastResult> {
  const query = timestamp ? `?timestamp=${encodeURIComponent(timestamp)}` : '';
  return fetchApi<ForecastResult>(`/api/forecast/current${query}`);
}

export async function getPeakCurrent(timestamp?: string): Promise<PeakResult> {
  const query = timestamp ? `?timestamp=${encodeURIComponent(timestamp)}` : '';
  return fetchApi<PeakResult>(`/api/peak/current${query}`);
}

export async function getPeakExpected(startTimestamp?: string, windowHours: number = 2.0): Promise<ExpectedPeakResult> {
  const params = new URLSearchParams();
  if (startTimestamp) params.append('start_timestamp', startTimestamp);
  params.append('window_hours', windowHours.toString());
  return fetchApi<ExpectedPeakResult>(`/api/peak/expected?${params.toString()}`);
}

export async function getFlexibilityCurrent(timestamp?: string): Promise<FlexibilityResult> {
  const query = timestamp ? `?timestamp=${encodeURIComponent(timestamp)}` : '';
  return fetchApi<FlexibilityResult>(`/api/flexibility/current${query}`);
}

export async function getRecommendationsCurrent(timestamp?: string): Promise<RecommendationBundle> {
  const query = timestamp ? `?timestamp=${encodeURIComponent(timestamp)}` : '';
  return fetchApi<RecommendationBundle>(`/api/recommendations/current${query}`);
}

export async function getRecommendationsExpected(startTimestamp?: string, windowHours: number = 2.0): Promise<RecommendationBundle> {
  const params = new URLSearchParams();
  if (startTimestamp) params.append('start_timestamp', startTimestamp);
  params.append('window_hours', windowHours.toString());
  return fetchApi<RecommendationBundle>(`/api/recommendations/expected?${params.toString()}`);
}

export async function getImpactCurrent(timestamp?: string, requestedReductionKw: number = 0): Promise<CurrentImpactResult> {
  const params = new URLSearchParams();
  if (timestamp) params.append('timestamp', timestamp);
  if (requestedReductionKw > 0) params.append('requested_reduction_kw', requestedReductionKw.toString());
  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchApi<CurrentImpactResult>(`/api/impact/current${query}`);
}

export async function simulateImpact(
  startTimestamp: string,
  endTimestamp: string,
  requestedReductionKw: number
): Promise<ImpactSimulationResponse> {
  return fetchApi<ImpactSimulationResponse>('/api/impact/simulate', {
    method: 'POST',
    body: JSON.stringify({
      start_timestamp: startTimestamp,
      end_timestamp: endTimestamp,
      requested_reduction_kw: requestedReductionKw,
    }),
  });
}
