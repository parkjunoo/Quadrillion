import { aiModelBenchmarkVideoConfig } from './config';

export type AiModelOrganization =
  | 'Alibaba'
  | 'Anthropic'
  | 'DeepSeek'
  | 'Google'
  | 'Kimi'
  | 'Meta'
  | 'Mistral'
  | 'OpenAI'
  | 'xAI';

export type AiModelEntry = {
  benchmark: string;
  color: string;
  id: string;
  mark: string;
  model: string;
  organization: AiModelOrganization;
  releaseDate: string;
  releaseMonthIndex: number;
  score: number;
  slug: string;
};

export type AiModelSnapshot = {
  maxValue: number;
  month: number;
  monthIndex: number;
  ranks: Map<string, number>;
  values: Map<string, number>;
  year: number;
};

export type AiModelBenchmarkRaceData = {
  entries: AiModelEntry[];
  maxMonthIndex: number;
  maxValue: number;
  minMonthIndex: number;
  snapshots: AiModelSnapshot[];
};

export type AiModelFrameRow = AiModelEntry & {
  animatedRank: number;
  displayRank: number;
  entryProgress: number;
  liveRank: number;
  opacity: number;
  previousValue: number;
  targetValue: number;
  value: number;
};

export type AiModelFrameState = {
  maxValue: number;
  month: number;
  monthIndex: number;
  monthProgress: number;
  rows: AiModelFrameRow[];
  segmentProgress: number;
  transitionPulse: number;
  year: number;
};

type CsvModelRow = {
  benchmark: string;
  model: string;
  organization: string;
  releaseDate: string;
  score: number;
  slug: string;
};

const ORGANIZATION_STYLE: Record<AiModelOrganization, { color: string; mark: string }> = {
  Alibaba: { color: '#FF6A00', mark: 'Q' },
  Anthropic: { color: '#D7A27E', mark: 'A' },
  DeepSeek: { color: '#4D6BFE', mark: 'DS' },
  Google: { color: '#4285F4', mark: 'G' },
  Kimi: { color: '#7C3AED', mark: 'K' },
  Meta: { color: '#0866FF', mark: 'ME' },
  Mistral: { color: '#FA520F', mark: 'M' },
  OpenAI: { color: '#10A37F', mark: 'OA' },
  xAI: { color: '#111827', mark: 'x' },
};

const FALLBACK_STYLE = { color: '#F5E829', mark: '?' };

export const buildAiModelBenchmarkRaceData = (
  csv = aiModelBenchmarkVideoConfig.csv,
): AiModelBenchmarkRaceData => {
  const rows = parseModelCsv(csv);
  const entries = rows.map((row) => {
    const organization = normalizeOrganization(row.organization);
    const style = organization ? ORGANIZATION_STYLE[organization] : FALLBACK_STYLE;

    return {
      benchmark: row.benchmark,
      color: style.color,
      id: row.slug || `${row.organization}:${row.model}`.toLowerCase(),
      mark: style.mark,
      model: row.model,
      organization: organization ?? 'OpenAI',
      releaseDate: row.releaseDate,
      releaseMonthIndex: monthIndexFromDate(row.releaseDate),
      score: row.score,
      slug: row.slug,
    };
  }).sort((a, b) =>
    a.releaseMonthIndex - b.releaseMonthIndex ||
    b.score - a.score ||
    a.model.localeCompare(b.model)
  );
  const firstReleaseMonth = entries[0]?.releaseMonthIndex ?? monthIndexFromDate('2022-11-01');
  const lastReleaseMonth = entries.at(-1)?.releaseMonthIndex ?? firstReleaseMonth;
  const minMonthIndex = firstReleaseMonth;
  const maxMonthIndex = lastReleaseMonth + 1;
  const snapshotMonths = [
    minMonthIndex,
    ...Array.from(new Set(entries.map((entry) => entry.releaseMonthIndex))),
    maxMonthIndex,
  ];
  const snapshots = snapshotMonths.map((monthIndex) => buildSnapshot(monthIndex, entries));
  const maxValue = Math.ceil(Math.max(1, ...entries.map((entry) => entry.score)) / 5) * 5;

  return {
    entries,
    maxMonthIndex,
    maxValue,
    minMonthIndex,
    snapshots,
  };
};

export const getAiModelBenchmarkFrameState = ({
  data,
  durationInFrames,
  frame,
  topN,
}: {
  data: AiModelBenchmarkRaceData;
  durationInFrames: number;
  frame: number;
  topN: number;
}): AiModelFrameState => {
  const progress = clamp(frame / Math.max(1, durationInFrames - 1), 0, 1);
  const monthIndex = data.minMonthIndex + progress * (data.maxMonthIndex - data.minMonthIndex);
  const rows = data.entries.map((entry) => {
    const entryProgress = revealProgressFor(entry, monthIndex);
    const hasStarted = entryHasStartedAtMonthIndex(entry, monthIndex);
    const value = valueForEntryAtMonthIndex(entry, monthIndex);

    return {
      ...entry,
      animatedRank: topN,
      displayRank: topN,
      entryProgress,
      liveRank: topN,
      opacity: hasStarted ? entryPresenceProgressFor(entry, monthIndex) : 0,
      previousValue: value,
      targetValue: value,
      value,
    };
  });
  const activeRows = rows.filter((row) => entryHasStartedAtMonthIndex(row, monthIndex));
  const byValue = [...activeRows].sort(compareRowsByValue);

  for (let index = 0; index < byValue.length; index += 1) {
    byValue[index].liveRank = index + 1;
  }

  for (const row of activeRows) {
    row.animatedRank = smoothAnimatedRank(row, activeRows, monthIndex);
  }

  const forcedEntryRow = activeRows
    .filter((row) => row.liveRank > topN && row.entryProgress < 1)
    .sort((a, b) =>
      getBuildUpStartMonthIndex(b) - getBuildUpStartMonthIndex(a) ||
      a.liveRank - b.liveRank ||
      b.value - a.value ||
      a.model.localeCompare(b.model)
    )[0];
  const candidateRows = activeRows
    .filter((row) => row.liveRank <= topN || row.animatedRank <= topN + RANK_ENTRY_BUFFER)
    .sort((a, b) =>
      Math.min(a.animatedRank, a.liveRank) - Math.min(b.animatedRank, b.liveRank) ||
      a.liveRank - b.liveRank ||
      a.model.localeCompare(b.model)
    );
  const primaryRows = candidateRows
    .filter((row) => row.id !== forcedEntryRow?.id)
    .slice(0, forcedEntryRow ? topN - 1 : topN);
  const visibleRows = forcedEntryRow
    ? [
        ...primaryRows,
        {
          ...forcedEntryRow,
          animatedRank: clamp(
            forcedEntryRow.animatedRank,
            topN,
            topN + ENTRY_LANE_VISIBLE_OFFSET,
          ),
        },
      ]
    : primaryRows;

  resolveAnimatedRankCollisions(visibleRows, topN);

  const displayRows = visibleRows
    .sort((a, b) =>
      a.animatedRank - b.animatedRank ||
      a.liveRank - b.liveRank ||
      a.model.localeCompare(b.model)
    )
    .map((row, index) => {
      const displayRank = index + 1;

      return {
        ...row,
        displayRank,
      };
    });
  const displayMonthIndex = Math.round(clamp(monthIndex, data.minMonthIndex, data.maxMonthIndex));
  const currentLeaderValue = Math.max(0, ...activeRows.map((row) => row.value));
  const frameMaxValue = Math.max(
    AXIS_MIN_VISIBLE_SCORE,
    currentLeaderValue * AXIS_LEADER_HEADROOM,
  );

  return {
    maxValue: frameMaxValue,
    month: monthFromIndex(displayMonthIndex),
    monthIndex: displayMonthIndex,
    monthProgress: clamp(
      (monthIndex - data.minMonthIndex) / Math.max(1, data.maxMonthIndex - data.minMonthIndex),
      0,
      1,
    ),
    rows: displayRows,
    segmentProgress: progress,
    transitionPulse: Math.sin(progress * Math.PI * data.entries.length),
    year: yearFromMonthIndex(displayMonthIndex),
  };
};

export const formatMonthLabel = (year: number, month: number) =>
  `${year}.${String(month).padStart(2, '0')}`;

const buildSnapshot = (
  monthIndex: number,
  entries: AiModelEntry[],
): AiModelSnapshot => {
  const values = new Map<string, number>();

  for (const entry of entries) {
    values.set(entry.id, valueForEntryAtMonthIndex(entry, monthIndex));
  }

  const ranked = entries
    .filter((entry) => (values.get(entry.id) ?? 0) > 0)
    .sort((a, b) =>
      (values.get(b.id) ?? 0) - (values.get(a.id) ?? 0) ||
      a.releaseMonthIndex - b.releaseMonthIndex ||
      a.model.localeCompare(b.model)
    );
  const ranks = new Map<string, number>();

  for (const entry of entries) {
    ranks.set(entry.id, entries.length + 1);
  }

  for (let index = 0; index < ranked.length; index += 1) {
    ranks.set(ranked[index].id, index + 1);
  }

  return {
    maxValue: Math.max(1, ...ranked.map((entry) => values.get(entry.id) ?? 0)),
    month: monthFromIndex(monthIndex),
    monthIndex,
    ranks,
    values,
    year: yearFromMonthIndex(monthIndex),
  };
};

const revealProgressFor = (
  entry: AiModelEntry,
  monthIndex: number,
) => {
  const revealStartMonthIndex = getBuildUpStartMonthIndex(entry);

  return clamp(
    (monthIndex - revealStartMonthIndex) / ENTRY_BUILD_UP_MONTHS,
    0,
    1,
  );
};

const valueForEntryAtMonthIndex = (entry: AiModelEntry, monthIndex: number) =>
  entry.score * smootherStep(revealProgressFor(entry, monthIndex));

const entryHasStartedAtMonthIndex = (entry: AiModelEntry, monthIndex: number) =>
  monthIndex >= getEntryStageStartMonthIndex(entry);

const entryPresenceProgressFor = (
  entry: AiModelEntry,
  monthIndex: number,
) =>
  smootherStep(
    clamp(
      (monthIndex - getEntryStageStartMonthIndex(entry)) / ENTRY_FADE_IN_MONTHS,
      0,
      1,
    ),
  );

const smoothAnimatedRank = (
  row: AiModelFrameRow,
  rows: AiModelFrameRow[],
  monthIndex: number,
) => {
  let rank = 1;
  const rowValue = valueForEntryAtMonthIndex(row, monthIndex);

  for (const other of rows) {
    if (other.id === row.id) {
      continue;
    }

    const otherValue = valueForEntryAtMonthIndex(other, monthIndex);
    const difference = otherValue - rowValue;

    if (Math.abs(difference) < VALUE_TIE_EPSILON) {
      rank += compareRowsAtValues(other, row, otherValue, rowValue) < 0 ? 1 : 0;
      continue;
    }

    const smoothingRange = Math.max(
      VALUE_RANK_SMOOTHING_FLOOR,
      Math.max(row.score, other.score) * VALUE_RANK_SMOOTHING_RATIO,
    );
    rank += smootherStep(clamp(0.5 + difference / smoothingRange, 0, 1));
  }

  return clamp(rank, 1, rows.length);
};

const parseModelCsv = (csv: string): CsvModelRow[] => {
  const [headerLine, ...rowLines] = csv.trim().split(/\r?\n/);
  const headers = splitCsvLine(headerLine ?? '');
  const headerIndex = new Map(headers.map((header, index) => [header, index]));

  return rowLines.map((line) => {
    const columns = splitCsvLine(line);
    const valueFor = (header: string) => columns[headerIndex.get(header) ?? -1] ?? '';

    return {
      benchmark: valueFor('benchmark'),
      model: valueFor('model'),
      organization: valueFor('organization'),
      releaseDate: valueFor('release_date'),
      score: Number(valueFor('score_percent')),
      slug: valueFor('slug'),
    };
  }).filter((row) =>
    row.releaseDate.length > 0 &&
    row.model.length > 0 &&
    Number.isFinite(row.score)
  );
};

const splitCsvLine = (line: string) => {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      quoted = !quoted;
      continue;
    }

    if (character === ',' && !quoted) {
      values.push(value);
      value = '';
      continue;
    }

    value += character;
  }

  values.push(value);
  return values;
};

const normalizeOrganization = (organization: string): AiModelOrganization | null => {
  if (organization in ORGANIZATION_STYLE) {
    return organization as AiModelOrganization;
  }

  return null;
};

const monthIndexFromDate = (date: string) => {
  const [year = '0', month = '1'] = date.split('-');

  return Number(year) * 12 + Number(month) - 1;
};

const yearFromMonthIndex = (monthIndex: number) => Math.floor(monthIndex / 12);

const monthFromIndex = (monthIndex: number) => ((monthIndex % 12) + 12) % 12 + 1;

const getBuildUpStartMonthIndex = (entry: AiModelEntry) =>
  entry.releaseMonthIndex;

const getEntryStageStartMonthIndex = (entry: AiModelEntry) =>
  entry.releaseMonthIndex;

const compareRowsByValue = (a: AiModelFrameRow, b: AiModelFrameRow) =>
  compareRowsAtValues(a, b, a.value, b.value);

const compareRowsAtValues = (
  rowA: AiModelEntry,
  rowB: AiModelEntry,
  valueA: number,
  valueB: number,
) =>
  valueB - valueA ||
  rowA.releaseMonthIndex - rowB.releaseMonthIndex ||
  rowA.model.localeCompare(rowB.model);

const resolveAnimatedRankCollisions = (
  rows: AiModelFrameRow[],
  topN: number,
) => {
  if (rows.length === 0) {
    return;
  }

  const sortedRows = [...rows].sort((a, b) =>
    a.animatedRank - b.animatedRank ||
    a.liveRank - b.liveRank ||
    a.model.localeCompare(b.model)
  );
  const maxVisibleRank = topN + RANK_ENTRY_BUFFER;
  const adjustedRanks = sortedRows.map((row) => clamp(row.animatedRank, 1, maxVisibleRank));

  for (let index = 1; index < adjustedRanks.length; index += 1) {
    adjustedRanks[index] = Math.max(
      adjustedRanks[index],
      adjustedRanks[index - 1] + MIN_ANIMATED_RANK_GAP,
    );
  }

  adjustedRanks[adjustedRanks.length - 1] = Math.min(
    adjustedRanks[adjustedRanks.length - 1] ?? maxVisibleRank,
    maxVisibleRank,
  );

  for (let index = adjustedRanks.length - 2; index >= 0; index -= 1) {
    adjustedRanks[index] = Math.min(
      adjustedRanks[index],
      adjustedRanks[index + 1] - MIN_ANIMATED_RANK_GAP,
    );
  }

  if ((adjustedRanks[0] ?? 1) < 1) {
    const offset = 1 - adjustedRanks[0];

    for (let index = 0; index < adjustedRanks.length; index += 1) {
      adjustedRanks[index] += offset;
    }
  }

  for (let index = 0; index < sortedRows.length; index += 1) {
    sortedRows[index].animatedRank = clamp(adjustedRanks[index], 1, maxVisibleRank);
  }
};

const RANK_ENTRY_BUFFER = 0.85;
const MIN_ANIMATED_RANK_GAP = 0.86;
const ENTRY_LANE_VISIBLE_OFFSET = 0;
const ENTRY_BUILD_UP_MONTHS = 1.05;
const ENTRY_FADE_IN_MONTHS = 0.35;
const AXIS_LEADER_HEADROOM = 1.08;
const AXIS_MIN_VISIBLE_SCORE = 55;
const VALUE_RANK_SMOOTHING_FLOOR = 1.25;
const VALUE_RANK_SMOOTHING_RATIO = 0.025;
const VALUE_TIE_EPSILON = 0.0001;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const smootherStep = (value: number) => {
  const t = clamp(value, 0, 1);

  return t * t * t * (t * (t * 6 - 15) + 10);
};
