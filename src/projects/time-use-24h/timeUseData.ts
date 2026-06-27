import {
  timeUse24hVideoConfig,
  timeUseSnapshots,
  type TimeUseCategory,
  type TimeUseCategoryId,
  type TimeUseSnapshot,
} from './config';

export type TimeUseFrameRow = {
  category: TimeUseCategory;
  changeFromStart: number;
  hours: number;
  rank: number;
  share: number;
};

export type TimeUseFrameState = {
  calloutYear: number;
  rows: TimeUseFrameRow[];
  segmentProgress: number;
  year: number;
  yearProgress: number;
};

export const firstTimeUseSnapshot = timeUseSnapshots[0];
export const lastTimeUseSnapshot = timeUseSnapshots[timeUseSnapshots.length - 1];

const categoriesById = new Map(
  timeUse24hVideoConfig.categories.map((category) => [category.id, category]),
);

export const getTimeUseFrameState = ({
  durationInFrames,
  frame,
}: {
  durationInFrames: number;
  frame: number;
}): TimeUseFrameState => {
  const progress = durationInFrames <= 1 ? 1 : clamp(frame / (durationInFrames - 1), 0, 1);
  const scaled = progress * (timeUseSnapshots.length - 1);
  const leftIndex = Math.min(Math.floor(scaled), timeUseSnapshots.length - 2);
  const rightIndex = leftIndex + 1;
  const rawSegmentProgress = scaled - leftIndex;
  const segmentProgress = smoothstep(rawSegmentProgress);
  const left = timeUseSnapshots[leftIndex];
  const right = timeUseSnapshots[rightIndex];
  const year = interpolateNumber(left.year, right.year, segmentProgress);
  const values = interpolateSnapshot(left, right, segmentProgress);
  const rows = timeUse24hVideoConfig.categories
    .map((category) => ({
      category,
      changeFromStart: values[category.id] - firstTimeUseSnapshot.values[category.id],
      hours: values[category.id],
      rank: 0,
      share: values[category.id] / 24,
    }))
    .sort((a, b) => b.hours - a.hours)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  return {
    calloutYear: nearestSnapshotForYear(year).year,
    rows,
    segmentProgress: rawSegmentProgress,
    year,
    yearProgress: progress,
  };
};

export const formatHours = (hours: number) => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (wholeHours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${wholeHours}h`;
  }

  return `${wholeHours}h ${minutes}m`;
};

export const formatSignedMinutes = (hours: number) => {
  const minutes = Math.round(hours * 60);

  if (minutes === 0) {
    return '0m';
  }

  return `${minutes > 0 ? '+' : ''}${minutes}m`;
};

export const getCategory = (id: TimeUseCategoryId) => {
  const category = categoriesById.get(id);

  if (!category) {
    throw new Error(`Unknown time-use category: ${id}`);
  }

  return category;
};

function interpolateSnapshot(
  left: TimeUseSnapshot,
  right: TimeUseSnapshot,
  progress: number,
): Record<TimeUseCategoryId, number> {
  const values = {} as Record<TimeUseCategoryId, number>;

  for (const category of timeUse24hVideoConfig.categories) {
    values[category.id] = interpolateNumber(
      left.values[category.id],
      right.values[category.id],
      progress,
    );
  }

  return values;
}

function nearestSnapshotForYear(year: number) {
  return timeUseSnapshots.reduce((best, snapshot) => {
    return Math.abs(snapshot.year - year) < Math.abs(best.year - year) ? snapshot : best;
  }, timeUseSnapshots[0]);
}

function interpolateNumber(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function smoothstep(value: number) {
  const clamped = clamp(value, 0, 1);

  return clamped * clamped * (3 - 2 * clamped);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
