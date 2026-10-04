export interface OccupantProfile {
  name: string;
  podId: string;
  zone: string;
  floor: string;
  campus: string;
  targetSetpoint: number;
  currentTemp: number;
  pmvScore: number;
  pmvStatus: string;
}

export interface ComfortMetrics {
  dailyKwh: number;
  kwhAvgComparison: string;
  kwhStatusNote: string;
  kwhProgressPct: number;
  co2eKg: number;
  carbonRank: string;
  carbonBadge: string;
  carbonProgressPct: number;
}

export interface PeakDemandChallenge {
  title: string;
  timeWindow: string;
  rebateText: string;
  gridRelief: string;
  evActionLabel: string;
}

export interface ShiftChallengeItem {
  id: string;
  title: string;
  description: string;
  rewardText: string;
  impactText: string;
  actionLabel: string;
  completedLabel: string;
  icon: string;
  iconBgClass: string;
}

export interface PodHourlyPoint {
  time: string;
  podKw: number;
  campusAvgKw: number;
  temp: number;
}

export const INITIAL_OCCUPANT_PROFILE: OccupantProfile = {
  name: 'Marcus Vance',
  podId: 'Pod 4B',
  zone: 'Zone B-North',
  floor: 'Floor 4',
  campus: 'Olympus Tech Park · B-4',
  targetSetpoint: 23.8,
  currentTemp: 24.0,
  pmvScore: 0.05,
  pmvStatus: 'Optimal PMV 0.05',
};

export const INITIAL_COMFORT_METRICS: ComfortMetrics = {
  dailyKwh: 1.8,
  kwhAvgComparison: '-14% vs avg',
  kwhStatusNote: 'Within campus tier-1 target',
  kwhProgressPct: 72,
  co2eKg: 9.8,
  carbonRank: 'Top 5%',
  carbonBadge: '⚡ Eco Champion · Floor 4',
  carbonProgressPct: 88,
};

export const INITIAL_PEAK_CHALLENGE: PeakDemandChallenge = {
  title: 'Peak demand expected 6-9 PM. Shift EV charging past 9 PM.',
  timeWindow: '6:00 PM – 9:00 PM',
  rebateText: '₹18.00 rebate',
  gridRelief: 'High Relief',
  evActionLabel: 'Shift EV Charging to 9:15 PM (Save ₹18)',
};

export const SHIFT_CHALLENGES: ShiftChallengeItem[] = [
  {
    id: 'departure',
    title: 'Desk Departure Deep Sleep',
    description: 'Power down external dual monitors & USB dock when departing Pod 4B.',
    rewardText: '+₹8.50 rebate',
    impactText: '0.8 kg CO₂',
    actionLabel: 'Power Down Pod',
    completedLabel: 'Pod In Sleep Mode',
    icon: 'power_off',
    iconBgClass: 'bg-secondary-fixed/50 text-secondary',
  },
  {
    id: 'collab',
    title: 'Afternoon Sunlit Workspace',
    description: 'Shift 3:00 PM focus session to Zone 4A Atrium (naturally cooled by building thermal mass).',
    rewardText: '+30 EcoCredits',
    impactText: 'Social Zone',
    actionLabel: 'Opt In Zone 4A',
    completedLabel: 'Space Reserved',
    icon: 'diversity_3',
    iconBgClass: 'bg-tertiary-fixed/50 text-tertiary',
  },
];

export const POD_HOURLY_TELEMETRY: PodHourlyPoint[] = [
  { time: '08:00', podKw: 0.4, campusAvgKw: 0.6, temp: 23.5 },
  { time: '10:00', podKw: 1.2, campusAvgKw: 1.5, temp: 23.8 },
  { time: '12:00', podKw: 1.8, campusAvgKw: 2.1, temp: 24.0 },
  { time: '14:00', podKw: 1.6, campusAvgKw: 2.0, temp: 24.1 },
  { time: '16:00', podKw: 1.4, campusAvgKw: 1.8, temp: 24.0 },
  { time: '18:00', podKw: 0.8, campusAvgKw: 1.4, temp: 23.9 },
  { time: '20:00', podKw: 0.3, campusAvgKw: 0.5, temp: 23.6 },
];
