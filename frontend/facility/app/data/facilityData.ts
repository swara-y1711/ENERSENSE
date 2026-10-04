export interface BuildingOption {
  id: string;
  name: string;
  shortName: string;
  currentKw: number;
}

export interface KpiMetrics {
  cumulativeKwh: number;
  cumDelta: string;
  baselineKwh: number;
  underMaxPct: string;
  activeKw: number;
  transformerCapKw: number;
  transformerCapPct: number;
  predPeakKw: number;
  peakWindow: string;
  peakDeltaKw: number;
  flexibleShedCapKw: number;
  flexPct: string;
}

export interface ChartTelemetryPoint {
  time: string;
  timestamp: string;
  allBaseline: number;
  allGridwise: number;
  hvacBaseline: number;
  hvacGridwise: number;
  evBaseline: number;
  evGridwise: number;
  auxBaseline: number;
  auxGridwise: number;
  isPeakWindow?: boolean;
  isPreCooling?: boolean;
}

export interface SubmeterSummary {
  id: string;
  name: string;
  icon: string;
  kw: number;
  pct: number;
  colorClass: string;
  badgeColorClass: string;
  shedLabel: string;
  protocol: string;
  toastMsg: string;
}

export interface SubmeterItem {
  id: string;
  name: string;
  cat: string;
  kw: number;
  pf: string;
  prio: 'Auto Shed' | 'Pre-cool' | 'Throttle' | 'Delay' | 'Critical' | 'Protected';
}

export interface AuditLogItem {
  id: string;
  window: string;
  committedKw: number;
  deliveredKw: number | 'Pending';
  compliancePct: string;
  status: 'Verified' | 'Settled' | 'Armed' | 'In Progress';
  icon: string;
  statusNote: string;
  toastNote: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'info';
}

export const BUILDINGS: BuildingOption[] = [
  {
    id: 'BLR-OLY-B',
    name: 'Olympus Tower Tech Park - Block B',
    shortName: 'Block B (Spine)',
    currentKw: 342,
  },
  {
    id: 'BLR-OLY-A',
    name: 'Olympus Tower Tech Park - Block A',
    shortName: 'Block A (North)',
    currentKw: 412,
  },
  {
    id: 'BLR-OLY-C',
    name: 'Olympus Tower Tech Park - Block C',
    shortName: 'Block C (R&D)',
    currentKw: 288,
  },
];

export const INITIAL_KPI: KpiMetrics = {
  cumulativeKwh: 4820,
  cumDelta: '+4.2%',
  baselineKwh: 5100,
  underMaxPct: '-5.5%',
  activeKw: 343,
  transformerCapKw: 500,
  transformerCapPct: 68,
  predPeakKw: 468,
  peakWindow: '18:00 – 21:00',
  peakDeltaKw: 92,
  flexibleShedCapKw: 85,
  flexPct: '24.9%',
};

// 24-hour 15-minute telemetry series for Recharts
export const DEMAND_TELEMETRY: ChartTelemetryPoint[] = [
  { time: '00:00', timestamp: '00:00', allBaseline: 180, allGridwise: 180, hvacBaseline: 90, hvacGridwise: 90, evBaseline: 30, evGridwise: 30, auxBaseline: 60, auxGridwise: 60 },
  { time: '02:00', timestamp: '02:00', allBaseline: 175, allGridwise: 175, hvacBaseline: 85, hvacGridwise: 85, evBaseline: 30, evGridwise: 30, auxBaseline: 60, auxGridwise: 60 },
  { time: '04:00', timestamp: '04:00', allBaseline: 170, allGridwise: 170, hvacBaseline: 80, hvacGridwise: 80, evBaseline: 30, evGridwise: 30, auxBaseline: 60, auxGridwise: 60 },
  { time: '06:00', timestamp: '06:00', allBaseline: 210, allGridwise: 210, hvacBaseline: 105, hvacGridwise: 105, evBaseline: 45, evGridwise: 45, auxBaseline: 60, auxGridwise: 60 },
  { time: '08:00', timestamp: '08:00', allBaseline: 290, allGridwise: 290, hvacBaseline: 155, hvacGridwise: 155, evBaseline: 70, evGridwise: 70, auxBaseline: 65, auxGridwise: 65 },
  { time: '10:00', timestamp: '10:00', allBaseline: 330, allGridwise: 330, hvacBaseline: 175, hvacGridwise: 175, evBaseline: 85, evGridwise: 85, auxBaseline: 70, auxGridwise: 70 },
  { time: '12:00', timestamp: '12:00', allBaseline: 350, allGridwise: 350, hvacBaseline: 190, hvacGridwise: 190, evBaseline: 90, evGridwise: 90, auxBaseline: 70, auxGridwise: 70 },
  { time: '14:00', timestamp: '14:00', allBaseline: 365, allGridwise: 365, hvacBaseline: 200, hvacGridwise: 200, evBaseline: 95, evGridwise: 95, auxBaseline: 70, auxGridwise: 70 },
  { time: '16:00', timestamp: '16:00', allBaseline: 380, allGridwise: 410, hvacBaseline: 210, hvacGridwise: 235, evBaseline: 100, evGridwise: 105, auxBaseline: 70, auxGridwise: 70, isPreCooling: true },
  { time: '17:00', timestamp: '17:00', allBaseline: 410, allGridwise: 425, hvacBaseline: 230, hvacGridwise: 245, evBaseline: 110, evGridwise: 110, auxBaseline: 70, auxGridwise: 70, isPreCooling: true },
  { time: '18:00', timestamp: '18:00', allBaseline: 440, allGridwise: 395, hvacBaseline: 250, hvacGridwise: 215, evBaseline: 115, evGridwise: 105, auxBaseline: 75, auxGridwise: 75, isPeakWindow: true },
  { time: '19:15', timestamp: '19:15', allBaseline: 468, allGridwise: 423, hvacBaseline: 265, hvacGridwise: 220, evBaseline: 125, evGridwise: 100, auxBaseline: 78, auxGridwise: 70, isPeakWindow: true },
  { time: '20:00', timestamp: '20:00', allBaseline: 450, allGridwise: 405, hvacBaseline: 255, hvacGridwise: 215, evBaseline: 120, evGridwise: 95, auxBaseline: 75, auxGridwise: 75, isPeakWindow: true },
  { time: '21:00', timestamp: '21:00', allBaseline: 390, allGridwise: 380, hvacBaseline: 220, hvacGridwise: 210, evBaseline: 95, evGridwise: 95, auxBaseline: 75, auxGridwise: 75, isPeakWindow: true },
  { time: '22:00', timestamp: '22:00', allBaseline: 280, allGridwise: 280, hvacBaseline: 150, hvacGridwise: 150, evBaseline: 60, evGridwise: 60, auxBaseline: 70, auxGridwise: 70 },
  { time: '23:45', timestamp: '23:45', allBaseline: 200, allGridwise: 200, hvacBaseline: 100, hvacGridwise: 100, evBaseline: 40, evGridwise: 40, auxBaseline: 60, auxGridwise: 60 },
];

export const SUBMETER_SUMMARIES: SubmeterSummary[] = [
  {
    id: 'hvac',
    name: 'HVAC (Chillers & AHU)',
    icon: 'ac_unit',
    kw: 182,
    pct: 53,
    colorClass: 'bg-primary',
    badgeColorClass: 'text-primary font-medium',
    shedLabel: 'Auto Shed Ready (-45 kW)',
    protocol: 'BACnet MS/TP',
    toastMsg: 'HVAC telemetry: Chiller 1 (94kW), Chiller 2 (88kW) normal.',
  },
  {
    id: 'ev',
    name: 'EV Fleet Bay (12 Units)',
    icon: 'ev_station',
    kw: 64,
    pct: 19,
    colorClass: 'bg-secondary',
    badgeColorClass: 'text-secondary font-medium',
    shedLabel: 'Throttleable (-25 kW)',
    protocol: 'OCPP 2.0.1',
    toastMsg: 'EV Bay: 8 of 12 chargers active. OCPP throttling armed.',
  },
  {
    id: 'water',
    name: 'Water Pumps & STP',
    icon: 'water_damage',
    kw: 48,
    pct: 14,
    colorClass: 'bg-outline',
    badgeColorClass: 'text-on-surface-variant font-medium',
    shedLabel: 'Delayable (-15 kW)',
    protocol: 'Modbus TCP',
    toastMsg: 'Booster pumps: Hydro-pneumatic reservoir at 84% capacity.',
  },
  {
    id: 'lighting',
    name: 'Lighting & Elevators',
    icon: 'lightbulb',
    kw: 48,
    pct: 14,
    colorClass: 'bg-on-surface',
    badgeColorClass: 'text-outline font-medium',
    shedLabel: 'Critical (Protected)',
    protocol: 'DALI-2',
    toastMsg: 'Elevator & lighting: Protected non-sheddable circuits.',
  },
];

export const ALL_SUBMETERS: SubmeterItem[] = [
  { id: 'M-01', name: 'Chiller 1 - Primary Compressor', cat: 'HVAC', kw: 94, pf: '0.96', prio: 'Auto Shed' },
  { id: 'M-02', name: 'Chiller 2 - Secondary Compressor', cat: 'HVAC', kw: 88, pf: '0.95', prio: 'Auto Shed' },
  { id: 'M-03', name: 'AHU-4 North Wing Air Loop', cat: 'HVAC', kw: 36, pf: '0.94', prio: 'Pre-cool' },
  { id: 'M-04', name: 'EV Bay 1-6 Fast Chargers', cat: 'EV Fleet', kw: 38, pf: '0.98', prio: 'Throttle' },
  { id: 'M-05', name: 'EV Bay 7-12 Standard Charging', cat: 'EV Fleet', kw: 26, pf: '0.97', prio: 'Throttle' },
  { id: 'M-06', name: 'Booster Pumps & Hydro Reservoir', cat: 'Water', kw: 28, pf: '0.92', prio: 'Delay' },
  { id: 'M-07', name: 'Sewage Aeration Blowers', cat: 'Water', kw: 20, pf: '0.91', prio: 'Delay' },
  { id: 'M-08', name: 'Basement & Podium LED Matrix', cat: 'Lighting', kw: 18, pf: '0.99', prio: 'Critical' },
  { id: 'M-09', name: 'Elevator Bank 1-4 Regenerative', cat: 'Mobility', kw: 30, pf: '0.93', prio: 'Critical' },
  { id: 'M-10', name: 'Data Center UPS Line A', cat: 'IT Load', kw: 44, pf: '0.99', prio: 'Protected' },
];

export const AUDIT_LOGS: AuditLogItem[] = [
  {
    id: '#DR-882',
    window: 'Yesterday, 18:30 - 20:30',
    committedKw: 50.0,
    deliveredKw: 52.4,
    compliancePct: '104.8%',
    status: 'Verified',
    icon: 'check_circle',
    statusNote: 'Verified',
    toastNote: 'Event #DR-882: Shed 52.4kW via HVAC loop + EV throttling.',
  },
  {
    id: '#DR-881',
    window: '24 Oct, 18:00 - 21:00',
    committedKw: 70.0,
    deliveredKw: 69.1,
    compliancePct: '98.7%',
    status: 'Settled',
    icon: 'check_circle',
    statusNote: 'Settled',
    toastNote: 'Event #DR-881: Credited ₹22,800 to October utility statement.',
  },
  {
    id: '#DR-879',
    window: '21 Oct, 19:00 - 20:00',
    committedKw: 35.0,
    deliveredKw: 36.2,
    compliancePct: '103.4%',
    status: 'Settled',
    icon: 'check_circle',
    statusNote: 'Settled',
    toastNote: 'Event #DR-879: 1 Hour rapid sprint shed achieved.',
  },
];

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'BESCOM Tariff Window',
    message: '2.25x surcharge active from 18:00 to 21:00 IST.',
    type: 'alert',
  },
  {
    id: 'n2',
    title: 'AHU-4 Pre-Cooling Engaged',
    message: 'Cooling loop throttled -15% in anticipation.',
    type: 'info',
  },
];

export const CURRENT_USER = {
  name: 'Marcus Vance',
  role: 'Lead Facility Eng.',
  initials: 'MV',
};
