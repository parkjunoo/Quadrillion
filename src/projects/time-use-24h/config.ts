export type TimeUseCategoryId =
  | 'sleep'
  | 'work'
  | 'tv'
  | 'screen'
  | 'commute'
  | 'exercise'
  | 'household'
  | 'eating'
  | 'care'
  | 'social'
  | 'other';

export type TimeUseCategory = {
  id: TimeUseCategoryId;
  label: string;
  shortLabel: string;
  color: string;
};

export type TimeUseSnapshot = {
  values: Record<TimeUseCategoryId, number>;
  year: number;
};

export type TimeUseCallout = {
  categoryId: TimeUseCategoryId;
  detail: string;
  title: string;
  year: number;
};

export type TimeUse24hVideoConfig = {
  callouts: TimeUseCallout[];
  categories: TimeUseCategory[];
  durationInSeconds: number;
  endHoldSeconds: number;
  fps: number;
  source: string;
  startHoldSeconds: number;
  subtitle: string;
  title: string;
  titleHook: string;
};

export const timeUseSnapshots: TimeUseSnapshot[] = [
  {
    year: 2003,
    values: {
      sleep: 8.57,
      work: 3.8,
      tv: 2.6,
      screen: 0.35,
      commute: 0.48,
      exercise: 0.27,
      household: 1.84,
      eating: 1.2,
      care: 0.55,
      social: 0.78,
      other: 3.56,
    },
  },
  {
    year: 2007,
    values: {
      sleep: 8.63,
      work: 3.75,
      tv: 2.75,
      screen: 0.39,
      commute: 0.5,
      exercise: 0.29,
      household: 1.82,
      eating: 1.18,
      care: 0.58,
      social: 0.75,
      other: 3.36,
    },
  },
  {
    year: 2011,
    values: {
      sleep: 8.72,
      work: 3.45,
      tv: 2.8,
      screen: 0.43,
      commute: 0.46,
      exercise: 0.29,
      household: 1.8,
      eating: 1.18,
      care: 0.62,
      social: 0.66,
      other: 3.59,
    },
  },
  {
    year: 2015,
    values: {
      sleep: 8.78,
      work: 3.55,
      tv: 2.73,
      screen: 0.49,
      commute: 0.47,
      exercise: 0.3,
      household: 1.78,
      eating: 1.17,
      care: 0.62,
      social: 0.72,
      other: 3.39,
    },
  },
  {
    year: 2019,
    values: {
      sleep: 8.84,
      work: 3.61,
      tv: 2.74,
      screen: 0.55,
      commute: 0.5,
      exercise: 0.31,
      household: 1.82,
      eating: 1.18,
      care: 0.6,
      social: 0.68,
      other: 3.17,
    },
  },
  {
    year: 2021,
    values: {
      sleep: 9.06,
      work: 3.27,
      tv: 2.87,
      screen: 0.6,
      commute: 0.36,
      exercise: 0.33,
      household: 2.02,
      eating: 1.21,
      care: 0.58,
      social: 0.48,
      other: 3.22,
    },
  },
  {
    year: 2024,
    values: {
      sleep: 9.04,
      work: 3.55,
      tv: 2.6,
      screen: 0.57,
      commute: 0.44,
      exercise: 0.31,
      household: 2.01,
      eating: 1.24,
      care: 0.58,
      social: 0.59,
      other: 3.07,
    },
  },
];

export const timeUse24hVideoConfig: TimeUse24hVideoConfig = {
  callouts: [
    {
      categoryId: 'screen',
      detail: 'Leisure computer and games time keeps rising inside the day.',
      title: 'Screens claim more minutes',
      year: 2007,
    },
    {
      categoryId: 'tv',
      detail: 'TV remains the largest leisure block, even as attention fragments.',
      title: 'TV still dominates leisure',
      year: 2011,
    },
    {
      categoryId: 'commute',
      detail: 'Remote work compresses travel time during the pandemic shock.',
      title: 'The commute shrinks',
      year: 2021,
    },
    {
      categoryId: 'sleep',
      detail: 'ATUS sleep includes naps and sleeplessness, and the category rises.',
      title: 'Sleep takes the biggest slot',
      year: 2024,
    },
  ],
  categories: [
    { id: 'sleep', label: 'Sleep', shortLabel: 'SLEEP', color: '#6EA8FF' },
    { id: 'work', label: 'Work', shortLabel: 'WORK', color: '#F2D35E' },
    { id: 'tv', label: 'TV', shortLabel: 'TV', color: '#FF7A59' },
    { id: 'screen', label: 'Games + computer', shortLabel: 'SCREEN', color: '#7CFFB2' },
    { id: 'commute', label: 'Travel/commute', shortLabel: 'COMMUTE', color: '#B68CFF' },
    { id: 'exercise', label: 'Exercise', shortLabel: 'MOVE', color: '#39D5FF' },
    { id: 'household', label: 'Household', shortLabel: 'HOME', color: '#F78CFF' },
    { id: 'eating', label: 'Eating', shortLabel: 'FOOD', color: '#FFB45F' },
    { id: 'care', label: 'Care', shortLabel: 'CARE', color: '#4CE0C5' },
    { id: 'social', label: 'Socializing', shortLabel: 'SOCIAL', color: '#FFFFFF' },
    { id: 'other', label: 'Other', shortLabel: 'OTHER', color: '#748092' },
  ],
  durationInSeconds: 34,
  endHoldSeconds: 2,
  fps: 60,
  source:
    'Source: BLS American Time Use Survey, persons 15+, all days. Selected annual estimates; screen = games + leisure computer use.',
  startHoldSeconds: 1,
  subtitle: 'Average U.S. day, 2003-2024 - every frame still adds to 24 hours',
  title: 'Where 24 Hours Go',
  titleHook: 'Sleep, work, TV, screens: the same day gets rearranged.',
};
