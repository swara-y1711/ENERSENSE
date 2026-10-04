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
  campus: 'Academic Building (I-BLEND Replay)',
  targetSetpoint: 23.8,
  currentTemp: 24.0,
  pmvScore: 0.05,
  pmvStatus: 'Optimal PMV 0.05',
};

export const INITIAL_COMFORT_METRICS: ComfortMetrics = {
  dailyKwh: 1.8,
  kwhAvgComparison: 'Replay Reference',
  kwhStatusNote: 'Within historical slot baseline',
  kwhProgressPct: 72,
  co2eKg: 9.8,
  carbonRank: 'Top 5%',
  carbonBadge: '⚡ Eco Champion · Floor 4',
  carbonProgressPct: 88,
};

export const INITIAL_PEAK_CHALLENGE: PeakDemandChallenge = {
  title: 'Peak demand window expected. Consider shifting flexible loads.',
  timeWindow: '6:00 PM – 9:00 PM',
  rebateText: 'Flexibility Available',
  gridRelief: 'High Relief',
  evActionLabel: 'Consider Shifting Flexible Loads Outside Peak',
};

export const SHIFT_CHALLENGES: ShiftChallengeItem[] = [
  {
    id: 'departure',
    title: 'Desk Departure Deep Sleep',
    description: 'Power down external dual monitors & USB dock when departing workstation.',
    rewardText: '+20 EcoCredits',
    impactText: '~0.2 kWh potential reduction',
    actionLabel: 'Power Down Pod',
    completedLabel: 'Pod In Sleep Mode',
    icon: 'power_off',
    iconBgClass: 'bg-secondary-fixed/50 text-secondary',
  },
  {
    id: 'collab',
    title: 'Afternoon Sunlit Workspace',
    description: 'Shift focus session to naturally cooled Atrium zone during peak hours.',
    rewardText: '+30 EcoCredits',
    impactText: 'Social Zone',
    actionLabel: 'Opt In Zone 4A',
    completedLabel: 'Space Reserved',
    icon: 'diversity_3',
    iconBgClass: 'bg-tertiary-fixed/50 text-tertiary',
  },
];

export const POD_HOURLY_TELEMETRY: PodHourlyPoint[] = [
  { time: '08:00', podKw: 24.2, campusAvgKw: 28.5, temp: 23.5 },
  { time: '10:00', podKw: 42.1, campusAvgKw: 45.0, temp: 25.8 },
  { time: '12:00', podKw: 58.4, campusAvgKw: 62.1, temp: 28.0 },
  { time: '14:00', podKw: 56.6, campusAvgKw: 60.0, temp: 28.5 },
  { time: '16:00', podKw: 51.4, campusAvgKw: 55.8, temp: 27.0 },
  { time: '18:00', podKw: 38.8, campusAvgKw: 41.4, temp: 25.2 },
  { time: '20:00', podKw: 28.3, campusAvgKw: 31.5, temp: 24.1 },
];
