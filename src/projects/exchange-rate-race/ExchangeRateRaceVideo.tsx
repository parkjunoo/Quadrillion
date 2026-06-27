import type { CSSProperties } from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { SHORTS_PLATFORM_TOP_CLEARANCE } from '../../shared/video';
import {
  createDataVideoFrameGeometry,
  DataVideoBackground,
  DataVideoChannelTag,
  DataVideoChartFrame,
  DataVideoChartTopBar,
  DataVideoFooter,
  DataVideoFooterNote,
  DataVideoFooterSource,
  dataVideoFontStack,
  DataVideoFrameLayout,
  DataVideoHeader,
  DataVideoTimelineRail,
} from '../../shared/dataVideoFrame';
import { exchangeRateRaceVideoConfig } from './config';
import {
  buildExchangeRateRaceData,
  getExchangeRateFrameState,
  type ExchangeRateFrameRow,
  type ExchangeRateFrameState,
  type ExchangeRateSnapshot,
} from './exchangeRateRace';

const raceData = buildExchangeRateRaceData(exchangeRateRaceVideoConfig.csv);
const channelHandle = '@whoa-data';
const accentColor = '#38BDF8';
const templateTopOffset = SHORTS_PLATFORM_TOP_CLEARANCE;
const frameLayout = createDataVideoFrameGeometry({
  chartHeight: 900,
  chartTop: 560 + templateTopOffset,
  footerTop: 1568,
  frameInset: {
    left: 76,
    right: 76,
  },
  headerTop: 160 + templateTopOffset,
  timelineRailTop: 326 + templateTopOffset,
});
const chart = frameLayout.chart;
const plot = {
  left: 82,
  top: 58,
  width: 620,
  height: 700,
};
const labelLeft = plot.left + plot.width + 28;

export const ExchangeRateRaceVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(exchangeRateRaceVideoConfig.startHoldSeconds * fps);
  const endHoldFrames = Math.round(exchangeRateRaceVideoConfig.endHoldSeconds * fps);
  const motionFrames = Math.max(1, durationInFrames - startHoldFrames - endHoldFrames);
  const raceFrame = clamp(frame - startHoldFrames, 0, motionFrames - 1);
  const intro = interpolate(frame, [0, startHoldFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const state = getExchangeRateFrameState({
    data: raceData,
    durationInFrames: motionFrames,
    frame: raceFrame,
    topN: exchangeRateRaceVideoConfig.topN,
  });

  return (
    <DataVideoFrameLayout>
      <DataVideoBackground chart={chart} />
      <DataVideoHeader
        accentColor={accentColor}
        geometry={frameLayout}
        intro={intro}
        subtitle={exchangeRateRaceVideoConfig.subtitle}
        title={exchangeRateRaceVideoConfig.title}
        titleHook={exchangeRateRaceVideoConfig.titleHook}
      />
      <DataVideoTimelineRail
        accentColor={accentColor}
        currentLabel={state.year}
        geometry={frameLayout}
        intro={intro}
        maxLabel={raceData.maxYear}
        minLabel={raceData.minYear}
        progress={state.yearProgress}
      />
      <Legend intro={intro} />
      <ExchangeRateLineRace intro={intro} state={state} />
      <Footer />
    </DataVideoFrameLayout>
  );
};

const Legend = ({ intro }: { intro: number }) => (
  <DataVideoChartTopBar chart={chart} intro={intro}>
    <div style={styles.legend}>
      <span>{exchangeRateRaceVideoConfig.dateLabel}</span>
      <strong>{exchangeRateRaceVideoConfig.valueColumnLabel}</strong>
    </div>
    <DataVideoChannelTag>{channelHandle}</DataVideoChannelTag>
  </DataVideoChartTopBar>
);

const ExchangeRateLineRace = ({
  intro,
  state,
}: {
  intro: number;
  state: ExchangeRateFrameState;
}) => {
  const axisMax = getAxisMax(state.maxValue);
  const tickValues = getLogTickValues(axisMax);
  const currentYearPosition = raceData.minYear +
    (raceData.maxYear - raceData.minYear) * state.yearProgress;
  const timeWindow = buildTimeWindow(currentYearPosition);
  const lineRows = state.rows.map((row) => ({
    row,
    points: buildLinePoints(row, currentYearPosition, timeWindow),
  }));
  const labelRows = positionLineLabels(state.rows, axisMax);
  const labelById = new Map(labelRows.map((label) => [label.row.id, label]));

  return (
    <DataVideoChartFrame chart={chart} intro={intro}>
      <svg
        height={chart.height}
        style={styles.lineSvg}
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        width={chart.width}
      >
        <rect
          fill="rgba(255,255,255,0.025)"
          height={plot.height}
          stroke="rgba(255,255,255,0.12)"
          width={plot.width}
          x={plot.left}
          y={plot.top}
        />
        {tickValues.map((tick) => {
          const y = yForValue(tick, axisMax);

          return (
            <g key={`y-tick-${tick}`}>
              <line
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
                x1={plot.left}
                x2={plot.left + plot.width}
                y1={y}
                y2={y}
              />
              <text
                fill="rgba(255,255,255,0.46)"
                fontFamily={dataVideoFontStack}
                fontSize={20}
                fontWeight={850}
                textAnchor="end"
                x={plot.left - 14}
                y={y + 7}
              >
                {formatCompact(tick)}
              </text>
            </g>
          );
        })}
        {getYearTicks(timeWindow).map((year) => {
          const x = xForYear(year, timeWindow);

          return (
            <g key={`x-tick-${year}`}>
              <line
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={1}
                x1={x}
                x2={x}
                y1={plot.top}
                y2={plot.top + plot.height}
              />
              <text
                fill="rgba(255,255,255,0.4)"
                fontFamily={dataVideoFontStack}
                fontSize={20}
                fontWeight={850}
                textAnchor="middle"
                x={x}
                y={plot.top + plot.height + 38}
              >
                {String(year)}
              </text>
            </g>
          );
        })}
        {lineRows.map(({ points, row }) => (
          <g key={`line-${row.id}`} opacity={row.opacity}>
            <path
              d={pathForPoints(points, axisMax, timeWindow)}
              fill="none"
              stroke={hexToRgba(row.color, 0.28)}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={13}
            />
            <path
              d={pathForPoints(points, axisMax, timeWindow)}
              fill="none"
              stroke={row.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={6}
            />
          </g>
        ))}
        {lineRows.map(({ row }) => {
          const x = xForYear(currentYearPosition, timeWindow);
          const y = yForValue(row.value, axisMax);
          const label = labelById.get(row.id);
          const labelY = (label?.y ?? y - 17) + 29;

          return (
            <g key={`head-${row.id}`} opacity={row.opacity}>
              <line
                stroke={hexToRgba(row.color, 0.5)}
                strokeDasharray="5 6"
                strokeWidth={2}
                x1={x + 14}
                x2={labelLeft - 8}
                y1={y}
                y2={labelY}
              />
              <circle
                cx={x}
                cy={y}
                fill="#020409"
                r={12}
                stroke={row.color}
                strokeWidth={5}
              />
              <text
                fill={row.color}
                fontFamily={dataVideoFontStack}
                fontSize={21}
                fontWeight={950}
                textAnchor="end"
                x={x - 16}
                y={y - 14}
              >
                #{row.displayRank}
              </text>
              <rect
                fill="rgba(2,7,12,0.82)"
                height={34}
                rx={0}
                stroke={hexToRgba(row.color, 0.46)}
                width={180}
                x={labelLeft}
                y={labelY - 17}
              />
              <text
                fill="#FFFFFF"
                fontFamily={`${dataVideoFontStack}, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`}
                fontSize={18}
                fontWeight={950}
                x={labelLeft + 9}
                y={labelY + 6}
              >
                {row.flag} {row.name}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={styles.chartNote}>1 USD = local currency units - log-scaled line chart</div>
    </DataVideoChartFrame>
  );
};

type LinePoint = {
  value: number;
  year: number;
};

type TimeWindow = {
  endYear: number;
  startYear: number;
};

type LabelRow = {
  row: ExchangeRateFrameRow;
  targetY: number;
  y: number;
};

const positionLineLabels = (
  rows: ExchangeRateFrameRow[],
  axisMax: number,
): LabelRow[] => {
  const minY = plot.top + 6;
  const maxY = plot.top + plot.height - 58;
  const minGap = 62;
  const labels = rows
    .map((row) => ({
      row,
      targetY: clamp(yForValue(row.value, axisMax) - 26, minY, maxY),
      y: 0,
    }))
    .sort((a, b) => a.targetY - b.targetY);

  labels.forEach((label, index) => {
    const previous = labels[index - 1];
    label.y = previous ? Math.max(label.targetY, previous.y + minGap) : label.targetY;
  });

  for (let index = labels.length - 1; index >= 0; index -= 1) {
    const label = labels[index];
    const next = labels[index + 1];
    const ceiling = next ? next.y - minGap : maxY;
    label.y = Math.min(label.y, ceiling);
  }

  labels.forEach((label) => {
    label.y = clamp(label.y, minY, maxY);
  });

  return labels;
};

const buildLinePoints = (
  row: ExchangeRateFrameRow,
  currentYearPosition: number,
  timeWindow: TimeWindow,
): LinePoint[] => {
  const historicalPoints = raceData.snapshots
    .filter((snapshot) =>
      snapshot.year <= currentYearPosition &&
      snapshot.year >= timeWindow.startYear - 1
    )
    .map((snapshot) => pointForSnapshot(row, snapshot))
    .filter((point): point is LinePoint => point !== null);
  const latestPoint = historicalPoints.at(-1);

  if (!latestPoint || Math.abs(latestPoint.year - currentYearPosition) > 0.001) {
    historicalPoints.push({
      value: row.value,
      year: currentYearPosition,
    });
  }

  return historicalPoints;
};

const pointForSnapshot = (
  row: ExchangeRateFrameRow,
  snapshot: ExchangeRateSnapshot,
): LinePoint | null => {
  const value = snapshot.values.get(row.id);

  if (!value) {
    return null;
  }

  return {
    value,
    year: snapshot.year,
  };
};

const pathForPoints = (
  points: LinePoint[],
  axisMax: number,
  timeWindow: TimeWindow,
) => {
  if (points.length === 0) {
    return '';
  }

  return points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L';

      return `${command} ${xForYear(point.year, timeWindow).toFixed(2)} ${yForValue(point.value, axisMax).toFixed(2)}`;
    })
    .join(' ');
};

const buildTimeWindow = (currentYearPosition: number): TimeWindow => {
  const visibleYears = 8;
  const currentYearAnchor = 0.72;
  const latestStartYear = raceData.maxYear - visibleYears;
  const startYear = clamp(
    currentYearPosition - visibleYears * currentYearAnchor,
    raceData.minYear,
    latestStartYear,
  );

  return {
    endYear: startYear + visibleYears,
    startYear,
  };
};

const xForYear = (year: number, timeWindow: TimeWindow) => {
  const progress = (year - timeWindow.startYear) /
    Math.max(1, timeWindow.endYear - timeWindow.startYear);

  return plot.left + clamp(progress, 0, 1) * plot.width;
};

const getYearTicks = (timeWindow: TimeWindow) => {
  const ticks: number[] = [];
  const firstTick = Math.ceil(timeWindow.startYear);
  const lastTick = Math.floor(timeWindow.endYear);

  for (let year = firstTick; year <= lastTick; year += 2) {
    if (year >= timeWindow.startYear && year <= timeWindow.endYear) {
      ticks.push(year);
    }
  }

  return [...new Set(ticks)];
};

const yForValue = (value: number, axisMax: number) => {
  const ratio = logScaleRatio(value, axisMax);

  return plot.top + (1 - ratio) * plot.height;
};

const Footer = () => (
  <DataVideoFooter geometry={frameLayout}>
    <DataVideoFooterSource>{exchangeRateRaceVideoConfig.source}</DataVideoFooterSource>
    <DataVideoFooterNote>
      This ranks nominal exchange-rate units, not purchasing power or currency strength.
    </DataVideoFooterNote>
  </DataVideoFooter>
);

const getAxisMax = (value: number) => {
  if (value <= 10) {
    return Math.ceil(value * 1.25);
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil((value * 1.12) / magnitude) * magnitude;
};

const getLogTickValues = (axisMax: number) => {
  const ticks = [1, 10, 100, 1000, 10000, 100000].filter((tick) => tick <= axisMax);
  const finalTick = ticks.at(-1);

  if (finalTick !== axisMax) {
    ticks.push(axisMax);
  }

  return ticks;
};

const logScaleRatio = (value: number, axisMax: number) => {
  const numerator = Math.log10(Math.max(0, value) + 1);
  const denominator = Math.log10(Math.max(1, axisMax) + 1);

  return clamp(numerator / denominator, 0, 1);
};

const formatRate = (value: number) => {
  if (value >= 1000) {
    return Math.round(value).toLocaleString('en-US');
  }

  if (value >= 100) {
    return value.toFixed(1);
  }

  if (value >= 10) {
    return value.toFixed(2);
  }

  return value.toFixed(3);
};

const formatDelta = (value: number) => {
  const abs = Math.abs(value);

  if (abs >= 1000) {
    return Math.round(value).toLocaleString('en-US');
  }

  if (abs >= 10) {
    return value.toFixed(1);
  }

  return value.toFixed(2);
};

const formatCompact = (value: number) => {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }

  return String(Math.round(value));
};

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const styles = {
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: 'rgba(255,255,255,0.68)',
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  lineSvg: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  chartNote: {
    position: 'absolute',
    left: 28,
    bottom: 34,
    color: 'rgba(255,255,255,0.42)',
    fontSize: 20,
    fontWeight: 850,
  },
} satisfies Record<string, CSSProperties>;
