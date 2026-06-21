import type { CSSProperties } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
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
import { worldCupSquadValueVideoConfig } from './config';
import {
  buildWorldCupSquadValueData,
  getWorldCupSquadFrameState,
  type WorldCupSquadFrameCountry,
  type WorldCupSquadFrameState,
  type WorldCupSquadSnapshot,
} from './squadValues';

const squadData = buildWorldCupSquadValueData(worldCupSquadValueVideoConfig.snapshots);
const fontStack = dataVideoFontStack;
const channelHandle = '@whoa-data';
const templateTopOffset = SHORTS_PLATFORM_TOP_CLEARANCE;
const frameInset = {
  left: 76,
  right: 76,
};
const frameLayout = createDataVideoFrameGeometry({
  chartHeight: 965,
  chartTop: 552 + templateTopOffset,
  footerTop: 1606,
  frameInset,
  headerTop: 158 + templateTopOffset,
  timelineRailTop: 342 + templateTopOffset,
});
const chart = frameLayout.chart;
const plot = {
  bottom: 128,
  left: 86,
  right: 206,
  top: 88,
};
const plotWidth = chart.width - plot.left - plot.right;
const plotHeight = chart.height - plot.top - plot.bottom;
const plotRight = plot.left + plotWidth;
const plotBottom = plot.top + plotHeight;
const timelineYears = squadData.snapshots.map((snapshot) => snapshot.year);
const rawMaxValue = Math.max(
  1,
  ...squadData.snapshots.flatMap((snapshot) => snapshot.countries.map((country) => country.totalValue)),
);
const valueAxisMax = Math.ceil(rawMaxValue / 200) * 200;
const valueTicks = Array.from({ length: 5 }, (_, index) => (valueAxisMax / 4) * index);

export const WorldCupSquadValuesVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(worldCupSquadValueVideoConfig.startHoldSeconds * fps);
  const endHoldFrames = Math.round(worldCupSquadValueVideoConfig.endHoldSeconds * fps);
  const motionFrames = Math.max(1, durationInFrames - startHoldFrames - endHoldFrames);
  const raceFrame = clamp(frame - startHoldFrames, 0, motionFrames - 1);
  const state = getWorldCupSquadFrameState({
    data: squadData,
    durationInFrames: motionFrames,
    frame: raceFrame,
    playerTopN: 0,
    topN: worldCupSquadValueVideoConfig.topN,
  });

  return (
    <DataVideoFrameLayout style={styles.stage}>
      <DataVideoBackground chart={chart} />
      <DataVideoHeader
        accentColor="#F5E829"
        geometry={frameLayout}
        intro={1}
        subtitle={worldCupSquadValueVideoConfig.subtitle}
        title={worldCupSquadValueVideoConfig.title}
        titleHook={worldCupSquadValueVideoConfig.titleHook}
      />
      <DataVideoTimelineRail
        accentColor="#F5E829"
        currentLabel={state.periodLabel}
        geometry={frameLayout}
        intro={1}
        maxLabel={squadData.maxYear}
        minLabel={squadData.minYear}
        progress={state.yearProgress}
      />
      <DataVideoChartTopBar chart={chart} intro={1}>
        <TournamentStrip state={state} />
        <DataVideoChannelTag>{channelHandle}</DataVideoChannelTag>
      </DataVideoChartTopBar>
      <DataVideoChartFrame chart={chart} intro={1} style={styles.chartFrame}>
        <LineChart state={state} />
      </DataVideoChartFrame>
      <Footer />
    </DataVideoFrameLayout>
  );
};

const TournamentStrip = ({ state }: { state: WorldCupSquadFrameState }) => {
  const leader = state.rows[0];

  return (
    <div style={styles.tournamentStrip}>
      <div style={styles.tournamentItem}>
        <span style={styles.tournamentLabel}>WORLD CUP</span>
        <span style={styles.tournamentValue}>{state.periodLabel}</span>
      </div>
      <div style={styles.tournamentDivider} />
      <div style={styles.tournamentItem}>
        <span style={styles.tournamentLabel}>LEADER</span>
        <span style={styles.tournamentValue}>{leader ? `${leader.name} ${formatSquadValue(leader.value)}` : '-'}</span>
      </div>
    </div>
  );
};

type ChartPoint = {
  index: number;
  isCurrent?: boolean;
  value: number;
  x: number;
  y: number;
  year: number;
};

type LineSeries = {
  country: WorldCupSquadFrameCountry;
  currentPoint: ChartPoint;
  path: string;
  points: ChartPoint[];
};

const LineChart = ({ state }: { state: WorldCupSquadFrameState }) => {
  const series = buildLineSeries(state);
  const endpointLabels = layoutEndpointLabels(series);
  const currentX = round1(plot.left + state.yearProgress * plotWidth);

  return (
    <svg height={chart.height} style={styles.lineSvg} viewBox={`0 0 ${chart.width} ${chart.height}`} width={chart.width}>
      <defs>
        <linearGradient id="lineBackdrop" x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#07131F" />
          <stop offset="58%" stopColor="#020409" />
          <stop offset="100%" stopColor="#010205" />
        </linearGradient>
        <radialGradient cx="52%" cy="22%" id="lineGlow" r="76%">
          <stop offset="0%" stopColor="rgba(245,232,41,0.12)" />
          <stop offset="44%" stopColor="rgba(56,189,248,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter height="170%" id="lineShadow" width="170%" x="-35%" y="-35%">
          <feDropShadow dx={0} dy={10} floodColor="#000000" floodOpacity={0.58} stdDeviation={7} />
        </filter>
        <filter height="170%" id="pointGlow" width="170%" x="-35%" y="-35%">
          <feDropShadow dx={0} dy={0} floodColor="#FFFFFF" floodOpacity={0.38} stdDeviation={3} />
          <feDropShadow dx={0} dy={8} floodColor="#000000" floodOpacity={0.5} stdDeviation={5} />
        </filter>
      </defs>
      <rect fill="url(#lineBackdrop)" height={chart.height} width={chart.width} x={0} y={0} />
      <rect fill="url(#lineGlow)" height={chart.height} width={chart.width} x={0} y={0} />
      <AxisGrid />
      <line
        opacity={0.78}
        stroke="#F5E829"
        strokeDasharray="10 12"
        strokeWidth={3}
        x1={currentX}
        x2={currentX}
        y1={plot.top - 22}
        y2={plotBottom + 22}
      />
      <CurrentMarkerLabel currentX={currentX} state={state} />
      <g filter="url(#lineShadow)">
        {series.map((line) => (
          <path
            d={line.path}
            fill="none"
            key={`${line.country.id}-underlay`}
            opacity={0.65}
            stroke="#000000"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={line.country.displayRank <= 3 ? 16 : 12}
          />
        ))}
      </g>
      {series.map((line) => (
        <path
          d={line.path}
          fill="none"
          key={line.country.id}
          opacity={line.country.displayRank <= 5 ? 1 : 0.84}
          stroke={line.country.color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={line.country.displayRank <= 3 ? 8 : 5}
        />
      ))}
      {series.map((line) => (
        <g key={`${line.country.id}-points`}>
          {line.points
            .filter((point) => point.index % 1 === 0)
            .map((point) => (
              <circle
                cx={point.x}
                cy={point.y}
                fill="#020409"
                key={`${line.country.id}-${point.year}`}
                r={line.country.displayRank <= 3 ? 6 : 4}
                stroke={line.country.color}
                strokeWidth={3}
              />
            ))}
          <circle
            cx={line.currentPoint.x}
            cy={line.currentPoint.y}
            fill={line.country.color}
            filter="url(#pointGlow)"
            r={line.country.displayRank <= 3 ? 13 : 10}
            stroke="#FFFFFF"
            strokeWidth={4}
          />
        </g>
      ))}
      {endpointLabels.map((label) => (
        <EndpointLabel
          key={`${label.series.country.id}-label`}
          labelY={label.labelY}
          series={label.series}
        />
      ))}
    </svg>
  );
};

const AxisGrid = () => (
  <g>
    <rect
      fill="rgba(255,255,255,0.025)"
      height={plotHeight}
      stroke="rgba(255,255,255,0.16)"
      strokeWidth={1}
      width={plotWidth}
      x={plot.left}
      y={plot.top}
    />
    {valueTicks.map((tick) => {
      const y = yForValue(tick);

      return (
        <g key={`tick-${tick}`}>
          <line
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
            x1={plot.left}
            x2={plotRight}
            y1={y}
            y2={y}
          />
          <text
            fill="rgba(255,255,255,0.76)"
            fontFamily={fontStack}
            fontSize={22}
            fontWeight={850}
            textAnchor="end"
            x={plot.left - 18}
            y={y + 8}
          >
            {formatAxisValue(tick)}
          </text>
        </g>
      );
    })}
    {timelineYears.map((year, index) => {
      const x = xForIndex(index);

      return (
        <g key={year}>
          <line
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
            x1={x}
            x2={x}
            y1={plot.top}
            y2={plotBottom}
          />
          <text
            fill="#FFFFFF"
            fontFamily={fontStack}
            fontSize={24}
            fontWeight={950}
            textAnchor="middle"
            x={x}
            y={plotBottom + 52}
          >
            {year}
          </text>
        </g>
      );
    })}
      <text
        fill="rgba(245,232,41,0.9)"
        fontFamily={fontStack}
        fontSize={24}
        fontWeight={950}
        x={plot.left}
        y={plot.top - 36}
      >
        Total value
      </text>
  </g>
);

const CurrentMarkerLabel = ({
  currentX,
  state,
}: {
  currentX: number;
  state: WorldCupSquadFrameState;
}) => {
  const labelWidth = 176;
  const x = clamp(currentX - labelWidth / 2, plot.left, plotRight - labelWidth);

  return (
    <g>
      <rect
        fill="#F5E829"
        height={38}
        rx={5}
        width={labelWidth}
        x={x}
        y={plot.top - 72}
      />
      <text
        fill="#020409"
        fontFamily={fontStack}
        fontSize={21}
        fontWeight={950}
        textAnchor="middle"
        x={x + labelWidth / 2}
        y={plot.top - 47}
      >
        {state.periodLabel}
      </text>
    </g>
  );
};

type EndpointLabelLayout = {
  labelY: number;
  series: LineSeries;
};

const EndpointLabel = ({
  labelY,
  series,
}: EndpointLabelLayout) => {
  const country = series.country;
  const currentPoint = series.currentPoint;
  const labelX = plotRight + 18;

  return (
    <g>
      <rect
        fill="rgba(2,4,9,0.9)"
        height={48}
        rx={6}
        stroke={country.color}
        strokeOpacity={country.displayRank <= 3 ? 0.95 : 0.6}
        strokeWidth={2}
        width={180}
        x={labelX}
        y={labelY - 24}
      />
      <text
        fill="#FFFFFF"
        fontFamily={fontStack}
        fontSize={19}
        fontWeight={950}
        x={labelX + 12}
        y={labelY - 3}
      >
        #{country.displayRank} {country.name}
      </text>
      <text
        fill={country.color}
        fontFamily={fontStack}
        fontSize={17}
        fontWeight={950}
        x={labelX + 12}
        y={labelY + 17}
      >
        {formatSquadValue(country.value)}
      </text>
    </g>
  );
};

const buildLineSeries = (state: WorldCupSquadFrameState): LineSeries[] => {
  const rows = state.rows.slice(0, worldCupSquadValueVideoConfig.topN);
  const scaledIndex = state.yearProgress * Math.max(1, squadData.snapshots.length - 1);
  const completeIndex = Math.min(squadData.snapshots.length - 1, Math.floor(scaledIndex + 0.0001));
  const currentYear = interpolateYear(state.yearProgress);

  return rows
    .map((country) => {
      const points: ChartPoint[] = [];

      for (let index = 0; index <= completeIndex; index += 1) {
        const snapshot = squadData.snapshots[index];
        const value = valueForCountry(snapshot, country.id);

        if (value > 0.001) {
          points.push(pointForIndex(index, snapshot.year, value));
        }
      }

      const currentPoint = pointForProgress(state.yearProgress, currentYear, country.value, scaledIndex, true);
      const duplicatesExistingPoint = points.some((point) => Math.abs(point.index - scaledIndex) < 0.001);

      if (country.value > 0.001 && !duplicatesExistingPoint) {
        points.push(currentPoint);
      }

      const sortedPoints = points.sort((pointA, pointB) => pointA.index - pointB.index);
      const path = buildPath(sortedPoints);

      return {
        country,
        currentPoint,
        path,
        points: sortedPoints,
      };
    })
    .filter((series) => series.points.length > 0);
};

const layoutEndpointLabels = (series: LineSeries[]): EndpointLabelLayout[] => {
  const labels = series
    .map((line) => ({
      labelY: line.currentPoint.y,
      series: line,
    }))
    .sort((labelA, labelB) => labelA.labelY - labelB.labelY);
  const minGap = 54;
  const minY = plot.top + 28;
  const maxY = plotBottom - 28;

  for (let index = 0; index < labels.length; index += 1) {
    labels[index].labelY = clamp(labels[index].labelY, minY, maxY);

    if (index > 0) {
      labels[index].labelY = Math.max(labels[index].labelY, labels[index - 1].labelY + minGap);
    }
  }

  const overflow = labels.length > 0 ? labels[labels.length - 1].labelY - maxY : 0;

  if (overflow > 0) {
    for (const label of labels) {
      label.labelY -= overflow;
    }
  }

  for (let index = labels.length - 2; index >= 0; index -= 1) {
    labels[index].labelY = Math.min(labels[index].labelY, labels[index + 1].labelY - minGap);
  }

  for (const label of labels) {
    label.labelY = round1(clamp(label.labelY, minY, maxY));
  }

  return labels;
};

const pointForIndex = (index: number, year: number, value: number): ChartPoint => ({
  index,
  value,
  x: xForIndex(index),
  y: yForValue(value),
  year,
});

const pointForProgress = (
  progress: number,
  year: number,
  value: number,
  index: number,
  isCurrent: boolean,
): ChartPoint => ({
  index,
  isCurrent,
  value,
  x: round1(plot.left + progress * plotWidth),
  y: yForValue(value),
  year,
});

const buildPath = (points: ChartPoint[]) => {
  let previousPoint: ChartPoint | undefined;

  return points
    .map((point) => {
      const command = previousPoint && point.index - previousPoint.index <= 1.001 ? 'L' : 'M';
      previousPoint = point;

      return `${command} ${round1(point.x)} ${round1(point.y)}`;
    })
    .join(' ');
};

const valueForCountry = (snapshot: WorldCupSquadSnapshot | undefined, countryId: string) =>
  snapshot?.countries.find((country) => country.id === countryId)?.totalValue ?? 0;

const xForIndex = (index: number) =>
  round1(plot.left + (index / Math.max(1, squadData.snapshots.length - 1)) * plotWidth);

const yForValue = (value: number) =>
  round1(plot.top + (1 - clamp(value / valueAxisMax, 0, 1)) * plotHeight);

const interpolateYear = (progress: number) => {
  const firstYear = squadData.minYear;
  const lastYear = squadData.maxYear;

  return Math.round(firstYear + (lastYear - firstYear) * progress);
};

const Footer = () => (
  <DataVideoFooter geometry={frameLayout}>
    <DataVideoFooterSource>{worldCupSquadValueVideoConfig.source}</DataVideoFooterSource>
    <DataVideoFooterNote>
      Line = country total value from available player market values. Replace with verified squad totals before public upload.
    </DataVideoFooterNote>
  </DataVideoFooter>
);

const formatAxisValue = (value: number) => {
  if (value === 0) {
    return '0';
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}B`;
  }

  return `${Math.round(value)}M`;
};

const formatSquadValue = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}B`;
  }

  return `${Math.round(value)}M`;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const styles = {
  stage: {
    backgroundColor: '#020409',
  },
  chartFrame: {
    background:
      'linear-gradient(180deg, rgba(2,4,9,0.98), rgba(7,18,28,0.98)), radial-gradient(circle at 50% 28%, rgba(245,232,41,0.11), rgba(0,0,0,0) 58%)',
  },
  tournamentStrip: {
    alignItems: 'center',
    background: 'rgba(2,8,14,0.82)',
    border: '1px solid rgba(255,255,255,0.22)',
    boxShadow: '0 14px 34px rgba(0,0,0,0.34)',
    display: 'flex',
    gap: 14,
    minHeight: 44,
    padding: '8px 14px',
  },
  tournamentItem: {
    alignItems: 'baseline',
    display: 'flex',
    gap: 8,
  },
  tournamentLabel: {
    color: 'rgba(245,232,41,0.8)',
    fontSize: 15,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
  },
  tournamentValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1,
  },
  tournamentDivider: {
    alignSelf: 'stretch',
    background: 'rgba(255,255,255,0.24)',
    width: 1,
  },
  lineSvg: {
    display: 'block',
    height: chart.height,
    width: chart.width,
  },
} satisfies Record<string, CSSProperties>;
