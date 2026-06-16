import type { CSSProperties } from 'react';
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  buildChartRaceData,
  type ChartEntity,
  type ChartSnapshot,
} from './chartRace';
import { SHORTS_PLATFORM_TOP_CLEARANCE } from '../../shared/video';
import { chartVideoConfig, type ChartVideoEvent } from './config';

const countryColorOverrides: Record<string, string> = {
  ARG: '#6EC6FF',
  BEL: '#D65CFF',
  BRA: '#FFE45C',
  COL: '#00B4D8',
  ENG: '#F7F7F7',
  ESP: '#FF4B3E',
  FRA: '#4D7CFF',
  GER: '#B98CFF',
  IRL: '#00C2A8',
  ITA: '#31D07D',
  NED: '#FF8A3D',
  POR: '#34D399',
  SWE: '#FF74B8',
  URU: '#77C8FF',
};

const replacementColorPalette = [
  '#31D07D',
  '#4D7CFF',
  '#FF4B3E',
  '#6EC6FF',
  '#F7F7F7',
  '#34D399',
  '#FF8A3D',
  '#D65CFF',
  '#45E3AE',
  '#FF5D5D',
  '#45D9E3',
  '#B98CFF',
  '#77C8FF',
  '#FF74B8',
  '#52A7FF',
  '#45E36A',
  '#FF9D66',
  '#7B61FF',
  '#62F0D0',
  '#E37445',
  '#45A1E3',
  '#E34599',
  '#45E372',
  '#CB45E3',
  '#E38145',
  '#455AE3',
  '#45E36F',
  '#B145E3',
  '#45B1E3',
  '#E3A445',
  '#8745E3',
  '#B1E345',
  '#45C1E3',
  '#8145E3',
  '#E37F45',
  '#2F80ED',
  '#FFB84D',
  '#8FE345',
  '#E34584',
  '#45E367',
  '#4545E3',
  '#458FE3',
];
const chartData = buildChartRaceData(chartVideoConfig.csv);
const entityColorByCode = buildUniqueEntityColors(chartData.entities);
const displaySnapshotIntervalMonths = 12;
const finalDenseSnapshotMonths = 18;
const displaySnapshots = buildDisplaySnapshots(chartData.snapshots);
const fontStack =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const emojiFontStack = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const flagParticleAngles = [18, 66, 112, 158, 214, 262, 316];
const templateTopOffset = SHORTS_PLATFORM_TOP_CLEARANCE;
const plot = {
  left: 120,
  top: 505 + templateTopOffset,
  width: 760,
  height: 980,
};
const plotRight = plot.left + plot.width;
const plotBottom = plot.top + plot.height;
const lineFlow = {
  left: plot.left + 22,
  right: plotRight - 54,
};
const lineFlowWidth = lineFlow.right - lineFlow.left;
const flowWindowSpan = 10;
const flowWindowCurrentOffset = 7.2;
const flowWindowFuturePadding = 2.2;
const hiddenEntryY = plotBottom + 180;
const yearRail = {
  left: 122,
  top: 330 + templateTopOffset,
  width: 836,
};
const finalSnapshot = displaySnapshots[displaySnapshots.length - 1];
const rankedEntities = chartData.entities.filter(hasTopNAppearance).sort(
  (a, b) => finalRankFor(b) - finalRankFor(a),
);
const trophyPulseMonths = 2.4;
const introHoldSeconds = 1;
const finalApproachSeconds = 2.2;
const finalSettleSeconds = 2;
const toastHoldSeconds = 1.5;
const toastFadeInSeconds = 0.2;
const toastFadeOutSeconds = 0.3;
const channelHandle = '@whoa-data';

export const ShortsVideo = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const introHoldFrames = Math.round(introHoldSeconds * fps);
  const raceDurationInFrames = Math.max(1, durationInFrames - introHoldFrames);
  const raceFrame = clamp(frame - introHoldFrames, 0, raceDurationInFrames - 1);
  const intro = spring({
    frame,
    fps,
    config: {
      damping: 24,
      mass: 0.85,
      stiffness: 120,
    },
  });
  const releasePosition = releasePositionForFrame(raceFrame, raceDurationInFrames, fps);
  const currentMonthIndex = monthIndexForReleasePosition(releasePosition);
  const timelineProgress = progressForReleasePosition(releasePosition);
  const currentYear = formatTimelineMonth(currentMonthIndex);
  const activeEvent = getActiveEvent(raceFrame, raceDurationInFrames, fps);

  return (
    <AbsoluteFill style={styles.stage}>
      <Background />
      <Header intro={intro} />
      <YearRail currentYear={currentYear} intro={intro} progress={timelineProgress} />
      <WorldCupToast activeEvent={activeEvent} />
      <RankTimeline currentReleasePosition={releasePosition} intro={intro} />
      <Footer />
    </AbsoluteFill>
  );
};

const Header = ({ intro }: { intro: number }) => {
  const y = interpolate(intro, [0, 1], [-28, 0]);

  return (
    <div style={{ ...styles.header, opacity: intro, transform: `translateY(${y}px)` }}>
      <div style={styles.headerTop}>
        <div style={styles.title}>{chartVideoConfig.title}</div>
        <div style={styles.channelTag}>{channelHandle}</div>
      </div>
      <div style={styles.subtitle}>{chartVideoConfig.subtitle}</div>
    </div>
  );
};

const YearRail = ({
  currentYear,
  intro,
  progress,
}: {
  currentYear: string;
  intro: number;
  progress: number;
}) => {
  const fillWidth = clamp(progress, 0, 1) * yearRail.width;

  return (
    <div style={{ ...styles.yearRailBlock, opacity: intro }}>
      <div style={styles.currentYear}>{currentYear}</div>
      <svg height={58} style={styles.yearRailSvg} viewBox={`0 0 ${yearRail.width} 58`} width={yearRail.width}>
        <line
          stroke="rgba(255,255,255,0.2)"
          strokeLinecap="round"
          strokeWidth={6}
          x1={0}
          x2={yearRail.width}
          y1={19}
          y2={19}
        />
        <line
          stroke="#F5E829"
          strokeLinecap="round"
          strokeWidth={6}
          x1={0}
          x2={fillWidth}
          y1={19}
          y2={19}
        />
        <text fill="rgba(255,255,255,0.52)" fontFamily={fontStack} fontSize={24} fontWeight={850} x={0} y={51}>
          {chartData.minYear}
        </text>
        <text
          fill="rgba(255,255,255,0.52)"
          fontFamily={fontStack}
          fontSize={24}
          fontWeight={850}
          textAnchor="end"
          x={yearRail.width}
          y={51}
        >
          {chartData.maxYear}
        </text>
      </svg>
    </div>
  );
};

const RankTimeline = ({
  currentReleasePosition,
  intro,
}: {
  currentReleasePosition: number;
  intro: number;
}) => {
  const flowWindow = getFlowWindow(currentReleasePosition);
  const currentX = xForReleasePosition(currentReleasePosition, flowWindow);
  const revealWidth = clamp(currentX - plot.left, 0, plot.width);
  const currentRows = getCurrentRankLabels(currentReleasePosition, flowWindow);

  return (
    <svg
      height={1920}
      style={{ ...styles.rankChart, opacity: intro }}
      viewBox="0 0 1080 1920"
      width={1080}
    >
      <defs>
        <clipPath id="rank-plot-clip">
          <rect height={plot.height + 8} width={revealWidth + 4} x={plot.left - 2} y={plot.top - 4} />
        </clipPath>
        <linearGradient id="plot-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="64%" stopColor="rgba(62,190,116,0.1)" />
          <stop offset="100%" stopColor="rgba(62,190,116,0)" />
        </linearGradient>
      </defs>

      <rect fill="url(#plot-fade)" height={plot.height} width={plot.width} x={plot.left} y={plot.top} />
      <Grid currentX={currentX} flowWindow={flowWindow} />

      <g clipPath="url(#rank-plot-clip)">
        {rankedEntities.map((entity) => (
          <TeamLine entity={entity} flowWindow={flowWindow} key={entity.id} />
        ))}
      </g>

      <line
        opacity={revealWidth > 0 ? 1 : 0}
        stroke="rgba(245,232,41,0.7)"
        strokeDasharray="5 12"
        strokeLinecap="round"
        strokeWidth={2}
        x1={currentX}
        x2={currentX}
        y1={plot.top - 10}
        y2={plotBottom + 18}
      />

      {currentRows.map((row) => (
        <EndLabel
          currentReleasePosition={currentReleasePosition}
          flowWindow={flowWindow}
          key={row.entity.id}
          row={row}
        />
      ))}
    </svg>
  );
};

type FlowWindow = {
  start: number;
  end: number;
};

const Grid = ({ currentX, flowWindow }: { currentX: number; flowWindow: FlowWindow }) => (
  <g>
    <text
      fill="rgba(255,255,255,0.52)"
      fontFamily={fontStack}
      fontSize={25}
      fontWeight={900}
      textAnchor="start"
      x={plot.left - 30}
      y={plot.top - 26}
    >
      Rank
    </text>

    {Array.from({ length: chartVideoConfig.topN }, (_, index) => {
      const rank = index + 1;
      const y = yForRank(rank);

      return (
        <g key={rank}>
          <line
            stroke={rank === 1 ? 'rgba(245,232,41,0.22)' : 'rgba(255,255,255,0.085)'}
            strokeWidth={rank === 1 ? 2 : 1}
            x1={plot.left}
            x2={plotRight}
            y1={y}
            y2={y}
          />
          <text
            dominantBaseline="central"
            fill={rank === 1 ? '#F5E829' : 'rgba(255,255,255,0.52)'}
            fontFamily={fontStack}
            fontSize={31}
            fontVariant="tabular-nums"
            fontWeight={950}
            textAnchor="end"
            x={plot.left - 18}
            y={y}
          >
            {rank}
          </text>
        </g>
      );
    })}

    {getWindowTicks(flowWindow).map((tick) => {
      const x = tick.x;

      return (
        <g key={`${tick.label}-${Math.round(tick.x)}`}>
          <line
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1}
            x1={x}
            x2={x}
            y1={plot.top}
            y2={plotBottom}
          />
          <text
            fill={x <= currentX + 4 ? 'rgba(255,255,255,0.58)' : 'rgba(255,255,255,0.24)'}
            fontFamily={fontStack}
            fontSize={24}
            fontVariant="tabular-nums"
            fontWeight={850}
            textAnchor="middle"
            x={x}
            y={plotBottom + 45}
          >
            {tick.label}
          </text>
        </g>
      );
    })}
  </g>
);

const TeamLine = ({ entity, flowWindow }: { entity: ChartEntity; flowWindow: FlowWindow }) => {
  const path = buildRankPath(entity, flowWindow);
  const color = colorForEntity(entity);

  if (!path) {
    return null;
  }

  return (
    <g>
      <path
        d={path}
        fill="none"
        opacity={0.32}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={16}
      />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={6}
      />
    </g>
  );
};

type ActiveEvent = {
  event: ChartVideoEvent;
  opacity: number;
};

const WorldCupToast = ({ activeEvent }: { activeEvent: ActiveEvent | null }) => {
  if (!activeEvent) {
    return null;
  }

  const { event, opacity } = activeEvent;
  const eventColor = colorForCode(event.code, event.color);
  const translateY = (1 - opacity) * 18;

  return (
    <div
      style={{
        ...styles.worldCupToast,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div style={{ ...styles.toastAccent, background: eventColor }} />
      <div style={styles.toastFlagFrame}>
        <span style={styles.toastFlag}>{flagForCode(event.code)}</span>
      </div>
      <div style={styles.toastCup}>WC</div>
      <div style={styles.toastCopy}>
        <div style={{ ...styles.toastTitle, color: eventColor }}>{event.title}</div>
        <div style={styles.toastDetail}>{event.detail}</div>
      </div>
    </div>
  );
};

type EndLabelRow = {
  entity: ChartEntity;
  labelY: number;
  value: number;
  rank: number;
};

const EndLabel = ({
  currentReleasePosition,
  flowWindow,
  row,
}: {
  currentReleasePosition: number;
  flowWindow: FlowWindow;
  row: EndLabelRow;
}) => {
  const point = pointForEntityAtRelease(row.entity, currentReleasePosition, flowWindow);
  const color = colorForEntity(row.entity);
  const labelX = point.x + 52;
  const opacity = point.y > plotBottom ? clamp((plotBottom - point.y + 34) / 34, 0, 1) : 1;
  const currentMonthIndex = monthIndexForReleasePosition(currentReleasePosition);
  const worldCupWins = worldCupWinsForEntity(row.entity, currentMonthIndex);
  const trophyPulse = trophyPulseForEntity(row.entity, currentMonthIndex);
  const trophyScale = 1 + trophyPulse * 0.22;
  const trophyLift = -4 * trophyPulse;
  const trophyFill = interpolateColors(
    trophyPulse,
    [0, 1],
    ['rgba(255,255,255,0.78)', '#FFE45C'],
  );
  const trophyGlowOpacity = trophyPulse * 0.38;
  const metaText = `${Math.round(row.value).toLocaleString('en-US')} pts · #${Math.round(row.rank)} ·`;
  const trophyX = labelX + metaTextWidth(metaText);
  const trophyY = row.labelY + 24;

  if (opacity <= 0) {
    return null;
  }

  return (
    <g opacity={opacity}>
      <FlagMarker code={row.entity.code} color={color} pulse={trophyPulse} x={point.x} y={point.y} />
      <text
        dominantBaseline="central"
        fill={color}
        fontFamily={fontStack}
        fontSize={32}
        fontWeight={950}
        paintOrder="stroke"
        stroke="#030403"
        strokeLinejoin="round"
        strokeWidth={8}
        textAnchor="start"
        x={labelX}
        y={row.labelY - 15}
      >
        {row.entity.name}
      </text>
      <text
        dominantBaseline="central"
        fill="rgba(255,255,255,0.78)"
        fontFamily={fontStack}
        fontSize={22}
        fontVariant="tabular-nums"
        fontWeight={900}
        paintOrder="stroke"
        stroke="#030403"
        strokeLinejoin="round"
        strokeWidth={7}
        textAnchor="start"
        x={labelX}
        y={row.labelY + 24}
      >
        {metaText}
      </text>
      <g
        transform={`translate(${trophyX.toFixed(2)} ${trophyY.toFixed(2)}) scale(${trophyScale.toFixed(3)}) translate(${(-trophyX).toFixed(2)} ${(-trophyY).toFixed(2)})`}
      >
        <circle
          cx={trophyX + 17}
          cy={trophyY}
          fill="none"
          opacity={trophyGlowOpacity}
          r={14 + trophyPulse * 10}
          stroke="#FFE45C"
          strokeWidth={2}
        />
        <text
          dominantBaseline="central"
          fill={trophyFill}
          fontFamily={fontStack}
          fontSize={22}
          fontVariant="tabular-nums"
          fontWeight={950}
          paintOrder="stroke"
          stroke="#030403"
          strokeLinejoin="round"
          strokeWidth={7}
          textAnchor="start"
          x={trophyX}
          y={trophyY + trophyLift}
        >
          <tspan fontFamily={emojiFontStack}>🏆</tspan>
          <tspan>{` ${worldCupWins}`}</tspan>
        </text>
      </g>
    </g>
  );
};

const FlagMarker = ({
  code,
  color,
  pulse,
  x,
  y,
}: {
  code: string;
  color: string;
  pulse: number;
  x: number;
  y: number;
}) => {
  const particleProgress = 1 - pulse;
  const particleOpacity = Math.min(0.9, Math.sqrt(pulse) * 0.72);

  return (
    <g>
      {pulse > 0.02 && (
        <g opacity={particleOpacity}>
          <circle
            cx={x}
            cy={y}
            fill="none"
            opacity={pulse * 0.42}
            r={36 + particleProgress * 18}
            stroke="#FFE45C"
            strokeDasharray="3 8"
            strokeWidth={2}
          />
          {flagParticleAngles.map((angle, index) => {
            const radians = (angle * Math.PI) / 180;
            const distance = 39 + particleProgress * (26 + (index % 3) * 4);
            const particleX = x + Math.cos(radians) * distance;
            const particleY = y + Math.sin(radians) * distance;
            const radius = 2.4 + (index % 2) * 1.4 + pulse * 1.8;

            return (
              <circle
                cx={particleX}
                cy={particleY}
                fill={index % 2 === 0 ? '#FFE45C' : color}
                key={`${code}-${angle}`}
                r={radius}
              />
            );
          })}
        </g>
      )}
      <circle cx={x} cy={y} fill="#050807" r={34} stroke={color} strokeWidth={6} />
      <circle cx={x} cy={y} fill="rgba(255,255,255,0.08)" r={24} />
      <text
        dominantBaseline="central"
        fontFamily={emojiFontStack}
        fontSize={34}
        textAnchor="middle"
        x={x}
        y={y + 1}
      >
        {flagForCode(code)}
      </text>
    </g>
  );
};

const Footer = () => (
  <div style={styles.footer}>
    <div style={styles.source}>{chartVideoConfig.source}</div>
  </div>
);

const Background = () => (
  <AbsoluteFill style={styles.background}>
    <div style={styles.pitchLines} />
    <div style={styles.topShadow} />
    <div style={styles.chartGlow} />
  </AbsoluteFill>
);

function buildDisplaySnapshots(snapshots: ChartSnapshot[]) {
  if (snapshots.length <= 2) {
    return snapshots;
  }

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];

  if (!first || !last) {
    return snapshots;
  }

  const selectedByDate = new Map<string, ChartSnapshot>();
  const addClosestSnapshot = (targetMonthIndex: number) => {
    const closest = snapshots.reduce((best, snapshot) => {
      const bestDistance = Math.abs(best.monthIndex - targetMonthIndex);
      const snapshotDistance = Math.abs(snapshot.monthIndex - targetMonthIndex);

      return snapshotDistance < bestDistance ? snapshot : best;
    }, first);

    selectedByDate.set(closest.date, closest);
  };

  selectedByDate.set(first.date, first);

  for (
    let targetMonthIndex = first.monthIndex;
    targetMonthIndex <= last.monthIndex;
    targetMonthIndex += displaySnapshotIntervalMonths
  ) {
    addClosestSnapshot(targetMonthIndex);
  }

  for (const event of chartVideoConfig.events) {
    addClosestSnapshot(event.year * 12 + event.month - 1);
  }

  for (const snapshot of snapshots) {
    if (snapshot.monthIndex >= last.monthIndex - finalDenseSnapshotMonths) {
      selectedByDate.set(snapshot.date, snapshot);
    }
  }

  selectedByDate.set(last.date, last);

  return [...selectedByDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

const getCurrentRankLabels = (
  currentReleasePosition: number,
  flowWindow: FlowWindow,
): EndLabelRow[] => {
  const rows = chartData.entities.map((entity) => {
    const point = pointForEntityAtRelease(entity, currentReleasePosition, flowWindow);
    const value = valueForEntityAtRelease(entity, currentReleasePosition);
    const rank = rankForY(point.y);

    return {
      entity,
      value,
      rank,
      visibleY: point.y,
    };
  });

  const visibleRows = rows
    .filter((row) => row.value > 0.02 && row.visibleY <= plotBottom + 34)
    .sort((a, b) => a.visibleY - b.visibleY)
    .slice(0, chartVideoConfig.topN)
    .map((row) => ({
      entity: row.entity,
      labelY: clamp(row.visibleY, plot.top + 42, plotBottom - 42),
      rank: row.rank,
      value: row.value,
    }));

  return visibleRows;
};

const buildRankPath = (entity: ChartEntity, flowWindow: FlowWindow) => displaySnapshots
  .map((snapshot, index) => ({ snapshot, index }))
  .filter(({ index }) => index >= flowWindow.start - 1 && index <= flowWindow.end + 1)
  .map(({ snapshot, index }, pointIndex) => {
    const x = xForReleasePosition(index, flowWindow);
    const y = yForSnapshot(entity, snapshot);

    return `${pointIndex === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  })
  .join(' ');

const pointForEntityAtRelease = (
  entity: ChartEntity,
  releasePosition: number,
  flowWindow: FlowWindow,
) => {
  const snapshots = displaySnapshots;

  if (snapshots.length === 0) {
    return { x: lineFlow.left, y: hiddenEntryY };
  }

  const { current, next, progress, position } = getReleasePair(releasePosition);

  return {
    x: xForReleasePosition(position, flowWindow),
    y: lerp(yForSnapshot(entity, current), yForSnapshot(entity, next), progress),
  };
};

const valueForEntityAtRelease = (entity: ChartEntity, releasePosition: number) => {
  const snapshots = displaySnapshots;

  if (snapshots.length === 0) {
    return 0;
  }

  const { current, next, progress } = getReleasePair(releasePosition);

  return lerp(valueForSnapshot(entity, current), valueForSnapshot(entity, next), progress);
};

const monthIndexForReleasePosition = (releasePosition: number) => {
  if (displaySnapshots.length === 0) {
    return chartData.minMonthIndex;
  }

  const { current, next, progress } = getReleasePair(releasePosition);

  return lerp(current.monthIndex, next.monthIndex, progress);
};

const yForSnapshot = (entity: ChartEntity, snapshot: ChartSnapshot) => {
  const value = valueForSnapshot(entity, snapshot);
  const rank = snapshot.ranks.get(entity.id) ?? chartVideoConfig.topN + 1;

  if (value <= 0 || rank > chartVideoConfig.topN) {
    return hiddenEntryY;
  }

  return yForRank(rank);
};

const valueForSnapshot = (entity: ChartEntity, snapshot: ChartSnapshot) =>
  snapshot.values.get(entity.id) ?? 0;

const yForRank = (rank: number) => {
  const clampedRank = clamp(rank, 1, chartVideoConfig.topN);

  return plot.top + ((clampedRank - 0.5) / Math.max(1, chartVideoConfig.topN)) * plot.height;
};

const rankForY = (y: number) => {
  const progress = (y - plot.top) / Math.max(1, plot.height);

  return progress * Math.max(1, chartVideoConfig.topN) + 0.5;
};

const releasePositionForFrame = (frame: number, durationInFrames: number, fps: number) => {
  const motionEndFrame = getMotionEndFrame(durationInFrames, fps);
  const finalApproachFrames = Math.round(finalApproachSeconds * fps);
  const approachStartFrame = Math.max(0, motionEndFrame - finalApproachFrames);
  const linearProgress = clamp(frame / Math.max(1, motionEndFrame), 0, 1);
  const approachStartProgress = clamp(approachStartFrame / Math.max(1, motionEndFrame), 0, 1);
  const approachProgress = approachStartFrame >= motionEndFrame
    ? 1
    : clamp((frame - approachStartFrame) / Math.max(1, motionEndFrame - approachStartFrame), 0, 1);
  const progress = frame <= approachStartFrame
    ? linearProgress
    : lerp(approachStartProgress, 1, easeOutCubic(approachProgress));

  return progress * maxReleasePosition();
};

const getMotionEndFrame = (durationInFrames: number, fps: number) =>
  Math.max(1, durationInFrames - 1 - Math.round(finalSettleSeconds * fps));

const progressForReleasePosition = (releasePosition: number) => {
  const maxPosition = maxReleasePosition();

  return maxPosition === 0 ? 0 : clamp(releasePosition / maxPosition, 0, 1);
};

const getFlowWindow = (releasePosition: number): FlowWindow => {
  const maxPosition = maxReleasePosition();
  const span = Math.min(flowWindowSpan, Math.max(1, maxPosition + flowWindowFuturePadding));
  const maxStart = Math.max(0, maxPosition + flowWindowFuturePadding - span);
  const start = clamp(releasePosition - flowWindowCurrentOffset, 0, maxStart);

  return {
    start,
    end: start + span,
  };
};

const xForReleasePosition = (releasePosition: number, flowWindow: FlowWindow) => {
  const progress = (releasePosition - flowWindow.start) /
    Math.max(0.0001, flowWindow.end - flowWindow.start);

  return lineFlow.left + progress * lineFlowWidth;
};

const getWindowTicks = (flowWindow: FlowWindow) =>
  Array.from({ length: 5 }, (_, index) => {
    const progress = index / 4;
    const position = lerp(flowWindow.start, flowWindow.end, progress);
    const monthIndex = monthIndexForReleasePosition(position);
    const year = Math.floor(monthIndex / 12);

    return {
      x: xForReleasePosition(position, flowWindow),
      label: String(year),
    };
  });

const getReleasePair = (releasePosition: number) => {
  const position = clamp(releasePosition, 0, maxReleasePosition());
  const currentIndex = Math.min(displaySnapshots.length - 1, Math.floor(position));
  const nextIndex = Math.min(displaySnapshots.length - 1, currentIndex + 1);
  const current = displaySnapshots[currentIndex];
  const next = displaySnapshots[nextIndex] ?? current;
  const progress = nextIndex === currentIndex ? 0 : position - currentIndex;

  return { current, next, position, progress };
};

const maxReleasePosition = () => Math.max(0, displaySnapshots.length - 1);

function finalRankFor(entity: ChartEntity) {
  return finalSnapshot?.ranks.get(entity.id) ?? chartVideoConfig.topN + 1;
}

function hasTopNAppearance(entity: ChartEntity) {
  return displaySnapshots.some((snapshot) => {
    const value = snapshot.values.get(entity.id) ?? 0;
    const rank = snapshot.ranks.get(entity.id) ?? chartVideoConfig.topN + 1;

    return value > 0 && rank <= chartVideoConfig.topN;
  });
}

const getMonthIndex = (year: number, month: number) => year * 12 + month - 1;

const worldCupWinsForEntity = (entity: ChartEntity, currentMonthIndex: number) => {
  const eventWins = chartVideoConfig.events.filter((event) => event.code === entity.code);
  const baseWins = Math.max(0, entity.worldCupWins - eventWins.length);
  const roundedMonthIndex = Math.round(currentMonthIndex);
  const earnedWins = eventWins.filter((event) =>
    getMonthIndex(event.year, event.month) <= roundedMonthIndex
  ).length;

  return baseWins + earnedWins;
};

const trophyPulseForEntity = (entity: ChartEntity, currentMonthIndex: number) => {
  let pulse = 0;

  for (const event of chartVideoConfig.events) {
    if (event.code !== entity.code) {
      continue;
    }

    const activationMonth = getMonthIndex(event.year, event.month) - 0.5;
    const elapsed = currentMonthIndex - activationMonth;

    if (elapsed >= 0 && elapsed <= trophyPulseMonths) {
      pulse = Math.max(pulse, Math.pow(1 - elapsed / trophyPulseMonths, 1.5));
    }
  }

  return pulse;
};

const metaTextWidth = (text: string) => 34 + text.length * 9.1;

const formatTimelineMonth = (monthIndex: number) => {
  const roundedMonthIndex = Math.round(monthIndex);
  const year = Math.floor(roundedMonthIndex / 12);
  const month = (roundedMonthIndex % 12) + 1;

  if (chartVideoConfig.timelineValueFormat === 'year') {
    return String(year);
  }

  return `${year}.${String(month).padStart(2, '0')}`;
};

const getActiveEvent = (
  frame: number,
  durationInFrames: number,
  fps: number,
): ActiveEvent | null => {
  const fadeInFrames = Math.round(toastFadeInSeconds * fps);
  const holdFrames = Math.round(toastHoldSeconds * fps);
  const fadeOutFrames = Math.round(toastFadeOutSeconds * fps);
  const activeWindow = holdFrames + fadeOutFrames;
  let active: { event: ChartVideoEvent; elapsedFrames: number } | null = null;

  for (const event of chartVideoConfig.events) {
    const eventFrame = frameForEvent(event, durationInFrames, fps);
    const elapsedFrames = frame - eventFrame;

    if (elapsedFrames < -fadeInFrames || elapsedFrames > activeWindow) {
      continue;
    }

    if (!active || elapsedFrames > active.elapsedFrames) {
      active = { event, elapsedFrames };
    }
  }

  if (!active) {
    return null;
  }

  const opacity = active.elapsedFrames < 0
    ? clamp((active.elapsedFrames + fadeInFrames) / Math.max(1, fadeInFrames), 0, 1)
    : active.elapsedFrames <= holdFrames
      ? 1
      : clamp(1 - (active.elapsedFrames - holdFrames) / Math.max(1, fadeOutFrames), 0, 1);

  return {
    event: active.event,
    opacity,
  };
};

const frameForEvent = (event: ChartVideoEvent, durationInFrames: number, fps: number) => {
  const eventPosition = releasePositionForEvent(event);
  const progress = progressForReleasePosition(eventPosition);

  return Math.round(progress * getMotionEndFrame(durationInFrames, fps));
};

const releasePositionForEvent = (event: ChartVideoEvent) => {
  const eventMonthIndex = getMonthIndex(event.year, event.month) + 0.5;

  for (let index = 0; index < displaySnapshots.length - 1; index += 1) {
    const current = displaySnapshots[index];
    const next = displaySnapshots[index + 1];

    if (!current || !next) {
      continue;
    }

    if (eventMonthIndex < current.monthIndex || eventMonthIndex > next.monthIndex) {
      continue;
    }

    const segmentSpan = Math.max(1, next.monthIndex - current.monthIndex);
    const segmentProgress = (eventMonthIndex - current.monthIndex) / segmentSpan;

    return index + segmentProgress;
  }

  return maxReleasePosition();
};

const flagEmojiByCode: Record<string, string> = {
  ALG: '🇩🇿',
  ARG: '🇦🇷',
  AUS: '🇦🇺',
  AUT: '🇦🇹',
  BEL: '🇧🇪',
  BRA: '🇧🇷',
  BUL: '🇧🇬',
  CAN: '🇨🇦',
  CIV: '🇨🇮',
  CMR: '🇨🇲',
  COL: '🇨🇴',
  CRC: '🇨🇷',
  CRO: '🇭🇷',
  CZE: '🇨🇿',
  DEN: '🇩🇰',
  ECU: '🇪🇨',
  EGY: '🇪🇬',
  ENG: '🇬🇧',
  ESP: '🇪🇸',
  FIN: '🇫🇮',
  FRA: '🇫🇷',
  GER: '🇩🇪',
  GHA: '🇬🇭',
  GRE: '🇬🇷',
  HON: '🇭🇳',
  HUN: '🇭🇺',
  IRL: '🇮🇪',
  IRN: '🇮🇷',
  ITA: '🇮🇹',
  JPN: '🇯🇵',
  KOR: '🇰🇷',
  KSA: '🇸🇦',
  MAR: '🇲🇦',
  MEX: '🇲🇽',
  NED: '🇳🇱',
  NGA: '🇳🇬',
  NIR: '🇬🇧',
  NOR: '🇳🇴',
  PAN: '🇵🇦',
  PAR: '🇵🇾',
  POL: '🇵🇱',
  POR: '🇵🇹',
  ROU: '🇷🇴',
  RUS: '🇷🇺',
  SCO: '🇬🇧',
  SEN: '🇸🇳',
  SRB: '🇷🇸',
  SUI: '🇨🇭',
  SWE: '🇸🇪',
  TCH: '🇨🇿',
  TUN: '🇹🇳',
  TUR: '🇹🇷',
  UKR: '🇺🇦',
  URU: '🇺🇾',
  USA: '🇺🇸',
  WAL: '🇬🇧',
  YUG: '🇷🇸',
  ZAM: '🇿🇲',
};

const flagForCode = (code: string) => flagEmojiByCode[code] ?? '🏳️';

function buildUniqueEntityColors(entities: ChartEntity[]) {
  const usedColors = new Set<string>();
  const colorsByCode = new Map<string, string>();
  let replacementIndex = 0;

  for (const entity of entities) {
    const overrideColor = normalizeColor(countryColorOverrides[entity.code] ?? '');

    if (!overrideColor || usedColors.has(overrideColor)) {
      continue;
    }

    usedColors.add(overrideColor);
    colorsByCode.set(entity.code, overrideColor);
  }

  for (const entity of entities) {
    if (colorsByCode.has(entity.code)) {
      continue;
    }

    const preferredColor = normalizeColor(entity.color);
    const canUsePreferredColor = preferredColor &&
      !usedColors.has(preferredColor) &&
      (!isYellowFamilyColor(preferredColor) || entity.code === 'BRA');

    if (canUsePreferredColor) {
      usedColors.add(preferredColor);
      colorsByCode.set(entity.code, preferredColor);
      continue;
    }

    let replacementColor = normalizeColor(replacementColorPalette[replacementIndex] ?? '');

    while (
      replacementColor &&
      (usedColors.has(replacementColor) || isYellowFamilyColor(replacementColor))
    ) {
      replacementIndex += 1;
      replacementColor = normalizeColor(replacementColorPalette[replacementIndex] ?? '');
    }

    const fallbackColor = replacementColor || colorFromIndex(usedColors.size);
    usedColors.add(fallbackColor);
    colorsByCode.set(entity.code, fallbackColor);
    replacementIndex += 1;
  }

  return colorsByCode;
}

const colorForEntity = (entity: ChartEntity) =>
  entityColorByCode.get(entity.code) ?? entity.color;

const colorForCode = (code: string, fallback: string) =>
  entityColorByCode.get(code) ?? fallback;

function normalizeColor(color: string) {
  const trimmed = color.trim();

  return trimmed.startsWith('#') ? trimmed.toUpperCase() : trimmed;
}

function isYellowFamilyColor(color: string) {
  const hue = hueForColor(color);

  return hue !== null && hue >= 38 && hue <= 78;
}

function hueForColor(color: string) {
  if (!color.startsWith('#') || color.length !== 7) {
    return null;
  }

  const red = Number.parseInt(color.slice(1, 3), 16) / 255;
  const green = Number.parseInt(color.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(color.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  if (delta === 0) {
    return null;
  }

  if (max === red) {
    return (((green - blue) / delta) % 6 + 6) * 60 % 360;
  }

  if (max === green) {
    return ((blue - red) / delta + 2) * 60;
  }

  return ((red - green) / delta + 4) * 60;
}

function colorFromIndex(index: number) {
  let hue = (index * 137.508) % 360;

  if (hue >= 38 && hue <= 78) {
    hue = (hue + 58) % 360;
  }

  return `hsl(${hue.toFixed(1)}, 82%, 62%)`;
}

const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const easeOutCubic = (value: number) => 1 - Math.pow(1 - clamp(value, 0, 1), 3);

const styles = {
  stage: {
    backgroundColor: '#030403',
    color: '#FFFFFF',
    fontFamily: fontStack,
    overflow: 'hidden',
  },
  background: {
    backgroundColor: '#03100C',
    backgroundImage:
      'radial-gradient(circle at 54% 58%, rgba(23,139,82,0.34) 0%, rgba(11,69,47,0.2) 31%, rgba(3,16,12,0) 64%), radial-gradient(circle at 14% 22%, rgba(0,168,107,0.18) 0%, rgba(0,168,107,0) 35%), radial-gradient(circle at 86% 18%, rgba(64,130,255,0.13) 0%, rgba(64,130,255,0) 34%), linear-gradient(180deg, #04120E 0%, #071B14 52%, #020503 100%)',
  },
  pitchLines: {
    position: 'absolute',
    inset: 0,
    opacity: 0.46,
    backgroundImage:
      'repeating-linear-gradient(90deg, rgba(32,143,85,0.14) 0 92px, rgba(10,67,45,0.07) 92px 184px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.034) 1px, transparent 1px)',
    backgroundSize: '100% 100%, 124px 124px, 100% 152px',
  },
  topShadow: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0.42) 100%)',
  },
  chartGlow: {
    position: 'absolute',
    left: 82,
    right: 82,
    top: plot.top - 80,
    height: plot.height + 240,
    background:
      'radial-gradient(ellipse at 54% 50%, rgba(72,210,130,0.15), rgba(12,36,27,0.34) 38%, rgba(0,0,0,0) 74%)',
  },
  header: {
    position: 'absolute',
    left: 112,
    right: 72,
    top: 166 + templateTopOffset,
    zIndex: 5,
  },
  headerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 24,
  },
  channelTag: {
    flex: '0 0 auto',
    marginTop: 11,
    padding: '8px 13px',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 999,
    background: 'rgba(2,8,6,0.48)',
    color: 'rgba(255,255,255,0.78)',
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: 0,
    boxShadow: '0 14px 34px rgba(0,0,0,0.26)',
  },
  title: {
    color: '#F5E829',
    fontSize: 72,
    fontWeight: 950,
    lineHeight: 0.92,
    letterSpacing: 0,
    whiteSpace: 'nowrap',
  },
  subtitle: {
    marginTop: 13,
    color: 'rgba(255,255,255,0.86)',
    fontSize: 26,
    fontWeight: 800,
    lineHeight: 1.22,
  },
  yearRailBlock: {
    position: 'absolute',
    left: yearRail.left,
    top: yearRail.top,
    width: yearRail.width,
    zIndex: 9,
  },
  currentYear: {
    marginBottom: 10,
    color: '#FFFFFF',
    fontSize: 62,
    fontWeight: 950,
    lineHeight: 0.9,
    textAlign: 'right',
    fontStyle: 'italic',
    textShadow: '0 10px 26px rgba(0,0,0,0.38)',
  },
  yearRailSvg: {
    display: 'block',
  },
  rankChart: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 4,
    overflow: 'visible',
  },
  worldCupToast: {
    position: 'absolute',
    left: yearRail.left,
    top: yearRail.top - 24,
    width: 560,
    minHeight: 70,
    zIndex: 7,
    display: 'flex',
    alignItems: 'center',
    gap: 15,
    overflow: 'hidden',
    padding: '11px 18px 11px 16px',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    background: 'rgba(5,8,8,0.96)',
    boxShadow: '0 22px 54px rgba(0,0,0,0.36)',
    WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 78%, rgba(0,0,0,0.72) 88%, transparent 100%)',
    maskImage: 'linear-gradient(90deg, #000 0%, #000 78%, rgba(0,0,0,0.72) 88%, transparent 100%)',
  },
  toastAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  toastFlagFrame: {
    width: 66,
    height: 48,
    flex: '0 0 auto',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.24)',
    borderRadius: 5,
    background: 'rgba(255,255,255,0.08)',
  },
  toastFlag: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: emojiFontStack,
    fontSize: 37,
    lineHeight: 1,
  },
  toastCup: {
    flex: '0 0 auto',
    width: 48,
    height: 44,
    border: '2px solid rgba(245,232,41,0.9)',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#F5E829',
    fontSize: 19,
    fontWeight: 950,
    lineHeight: 1,
  },
  toastCopy: {
    minWidth: 0,
  },
  toastTitle: {
    fontSize: 28,
    fontWeight: 950,
    lineHeight: 1.05,
  },
  toastDetail: {
    marginTop: 5,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.18,
  },
  footer: {
    position: 'absolute',
    left: plot.left,
    right: 72,
    top: plotBottom + 82,
    zIndex: 6,
  },
  source: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 25,
    fontWeight: 800,
    lineHeight: 1.28,
  },
} satisfies Record<string, CSSProperties>;
