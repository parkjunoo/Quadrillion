import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { SHORTS_PLATFORM_TOP_CLEARANCE } from '../../shared/video';
import {
  SHORTS_INTRO_SECONDS,
  SHORTS_OUTRO_SECONDS,
  ShortsIntro,
  ShortsOutro,
} from '../../shared/shortsAnimations';
import { youtubeSubscriberVideoConfig } from './config';
import {
  buildSubscriberRaceData,
  getSubscriberFrameState,
  type SubscriberFrameState,
  type SubscriberLinePoint,
  type SubscriberLineRaceRow,
} from './subscriberLineRace';

const raceData = buildSubscriberRaceData(youtubeSubscriberVideoConfig.csv);
const fontStack =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const templateTopOffset = SHORTS_PLATFORM_TOP_CLEARANCE;
const channelHandle = '@whoa-data';
const introHoldSeconds = SHORTS_INTRO_SECONDS;
const finalSettleSeconds = SHORTS_OUTRO_SECONDS;
const chart = {
  left: 58,
  top: 535 + templateTopOffset,
  width: 965,
  height: 920,
  plotLeft: 106,
  plotTop: 34,
  plotWidth: 622,
  plotHeight: 760,
};
const lineLabel = {
  width: 286,
  height: 72,
  avatarSize: 46,
};
const yearRail = {
  left: 118,
  top: 332 + templateTopOffset,
  width: 842,
};
const visiblePastWindowMonths = 14;
const visibleFutureWindowMonths = 6;
const centeredAfterMonths = 12;
const introCopy = {
  accentColor: '#F5E829',
  channelHandle,
  kicker: youtubeSubscriberVideoConfig.valueColumnLabel,
  meta: `${raceData.minYear}-${raceData.maxYear}`,
  secondaryColor: '#00A7FF',
  subtitle: youtubeSubscriberVideoConfig.titleHook,
  title: youtubeSubscriberVideoConfig.title,
};
const outroCopy = {
  accentColor: '#F5E829',
  channelHandle,
  kicker: 'NEXT CREATOR DATA STORY',
  secondaryColor: '#00A7FF',
  subtitle: 'Follow for the next chart story',
  title: 'More crown races',
};

export const YoutubeSubscriberRaceVideo = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const introHoldFrames = Math.round(introHoldSeconds * fps);
  const finalSettleFrames = Math.round(finalSettleSeconds * fps);
  const motionFrames = Math.max(1, durationInFrames - introHoldFrames - finalSettleFrames);
  const raceFrame = clamp(frame - introHoldFrames, 0, motionFrames - 1);
  const intro = interpolate(frame, [0, introHoldFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const state = getSubscriberFrameState({
    data: raceData,
    frame: raceFrame,
    durationInFrames: motionFrames,
    topN: youtubeSubscriberVideoConfig.topN,
  });

  return (
    <AbsoluteFill style={styles.stage}>
      <Background />
      <Header intro={intro} />
      <YearRail currentYear={String(state.year)} intro={intro} progress={state.progress} />
      <ValueLegend intro={intro} />
      <LineRaceChart intro={intro} state={state} />
      <Footer />
      <ShortsIntro copy={introCopy} fps={fps} frame={frame} />
      <ShortsOutro copy={outroCopy} durationInFrames={durationInFrames} fps={fps} frame={frame} />
    </AbsoluteFill>
  );
};

const Header = ({ intro }: { intro: number }) => {
  const y = interpolate(intro, [0, 1], [-28, 0]);

  return (
    <div style={{ ...styles.header, opacity: intro, transform: `translateY(${y}px)` }}>
      <div style={styles.headerTop}>
        <div style={styles.title}>{youtubeSubscriberVideoConfig.title}</div>
      </div>
      <div style={styles.titleHook}>{youtubeSubscriberVideoConfig.titleHook}</div>
      <div style={styles.subtitle}>{youtubeSubscriberVideoConfig.subtitle}</div>
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
      <div style={styles.currentMonth}>{currentYear}</div>
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
          {raceData.minYear}
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
          {raceData.maxYear}
        </text>
      </svg>
    </div>
  );
};

const ValueLegend = ({ intro }: { intro: number }) => (
  <div style={{ ...styles.legend, opacity: intro }}>
    <span>{youtubeSubscriberVideoConfig.dateLabel}</span>
    <span>{youtubeSubscriberVideoConfig.valueColumnLabel}</span>
  </div>
);

const LineRaceChart = ({
  intro,
  state,
}: {
  intro: number;
  state: SubscriberFrameState;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const axisMax = getAxisMax(Math.max(state.maxValue * 1.2, 50_000_000));
  const timeWindow = useMemo(() => buildTimeWindow(state.monthIndex), [state.monthIndex]);
  const labelRows = useMemo(
    () => positionLineHeadLabels(state.rows, axisMax, timeWindow),
    [state.rows, axisMax, timeWindow],
  );
  const option = useMemo(
    () => buildEChartsLineRaceOption(state, axisMax, timeWindow, labelRows),
    [state, axisMax, timeWindow, labelRows],
  );

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    chartRef.current = echarts.init(containerRef.current, undefined, {
      height: chart.height,
      renderer: 'svg',
      width: chart.width,
    });

    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    chartRef.current?.setOption(option, {
      lazyUpdate: false,
      notMerge: true,
      silent: true,
    });
  }, [option]);

  return (
    <div style={{ ...styles.chart, opacity: intro }}>
      <div ref={containerRef} style={styles.echartsCanvas} />
      <LineLabelOverlay labelRows={labelRows} />
    </div>
  );
};

type EChartsGraphicElement = Record<string, unknown>;

const buildEChartsLineRaceOption = (
  state: SubscriberFrameState,
  axisMax: number,
  timeWindow: TimeWindow,
  labelRows: LabelRow[],
): EChartsOption => {
  const rowsByDrawOrder = [...state.rows].sort((a, b) => a.value - b.value);
  const elements: EChartsGraphicElement[] = [
    ...buildEChartsGridElements(axisMax, timeWindow),
    ...rowsByDrawOrder.map((row) => buildEChartsLineElement(row, axisMax, timeWindow)),
    ...rowsByDrawOrder.map((row) => buildEChartsMarkerElement(row, axisMax, timeWindow)),
  ];

  return {
    animation: false,
    animationDuration: 0,
    animationDurationUpdate: 0,
    backgroundColor: 'transparent',
    graphic: {
      elements,
    } as EChartsOption['graphic'],
  };
};

const buildEChartsGridElements = (
  axisMax: number,
  timeWindow: TimeWindow,
): EChartsGraphicElement[] => {
  const yTicks = axisTicks(axisMax);
  const xTicks = buildTimeTicks(timeWindow);
  const plotRight = chart.plotLeft + chart.plotWidth;
  const plotBottom = chart.plotTop + chart.plotHeight;

  return [
    {
      type: 'rect',
      id: 'plot-bg',
      silent: true,
      shape: {
        height: chart.plotHeight,
        r: 6,
        width: chart.plotWidth,
        x: chart.plotLeft,
        y: chart.plotTop,
      },
      style: {
        fill: 'rgba(255,255,255,0.075)',
        stroke: 'rgba(255,255,255,0.08)',
        lineWidth: 1,
      },
    },
    ...yTicks.map((tick) => {
      const y = yForValue(tick, axisMax);

      return {
        type: 'group',
        id: `y-tick-${tick}`,
        silent: true,
        children: [
          {
            type: 'line',
            id: `y-grid-${tick}`,
            shape: { x1: chart.plotLeft, x2: plotRight, y1: y, y2: y },
            style: {
              opacity: tick === 0 ? 0.18 : 0.16,
              stroke: 'rgba(255,255,255,0.18)',
              lineDash: tick === 0 ? undefined : [7, 10],
              lineWidth: 1.4,
            },
          },
          {
            type: 'text',
            id: `y-label-${tick}`,
            x: chart.plotLeft - 18,
            y,
            style: {
              fill: 'rgba(255,255,255,0.58)',
              fontFamily: fontStack,
              fontSize: 22,
              fontWeight: 850,
              text: formatAxisValue(tick),
              textAlign: 'right',
              textVerticalAlign: 'middle',
            },
          },
        ],
      };
    }),
    ...xTicks.map((tick) => {
      const x = xForMonthIndex(tick.monthIndex, timeWindow);

      return {
        type: 'group',
        id: `x-tick-${tick.monthIndex.toFixed(2)}`,
        silent: true,
        children: [
          {
            type: 'line',
            id: `x-grid-${tick.monthIndex.toFixed(2)}`,
            shape: { x1: x, x2: x, y1: chart.plotTop, y2: plotBottom },
            style: {
              opacity: 0.12,
              stroke: 'rgba(255,255,255,0.16)',
              lineWidth: 1.2,
            },
          },
          {
            type: 'text',
            id: `x-label-${tick.monthIndex.toFixed(2)}`,
            x,
            y: plotBottom + 38,
            style: {
              fill: 'rgba(255,255,255,0.5)',
              fontFamily: fontStack,
              fontSize: 22,
              fontWeight: 850,
              text: tick.label,
              textAlign: 'center',
              textVerticalAlign: 'middle',
            },
          },
        ],
      };
    }),
  ];
};

const buildEChartsLineElement = (
  row: SubscriberLineRaceRow,
  axisMax: number,
  timeWindow: TimeWindow,
): EChartsGraphicElement => {
  const points = clipPointsToWindow(row.linePoints, timeWindow)
    .map((point) => [
      xForMonthIndex(point.monthIndex, timeWindow),
      yForValue(point.value, axisMax),
    ]);

  return {
    type: 'polyline',
    id: `line-${row.id}`,
    silent: true,
    shape: {
      points,
      smooth: 0.18,
    },
    style: {
      fill: null,
      lineCap: 'round',
      lineJoin: 'round',
      lineWidth: 4.5,
      opacity: row.value > 0 ? row.opacity : 0.16,
      stroke: row.color,
    },
    z: 20 + row.liveRank,
  };
};

const buildEChartsMarkerElement = (
  row: SubscriberLineRaceRow,
  axisMax: number,
  timeWindow: TimeWindow,
): EChartsGraphicElement => {
  const currentPoint = row.linePoints.at(-1);
  const cx = currentPoint ? xForMonthIndex(currentPoint.monthIndex, timeWindow) : chart.plotLeft;
  const cy = currentPoint ? yForValue(currentPoint.value, axisMax) : chart.plotTop + chart.plotHeight;

  return {
    type: 'circle',
    id: `marker-${row.id}`,
    silent: true,
    shape: { cx, cy, r: 8 },
    style: {
      fill: '#020705',
      lineWidth: 4,
      opacity: row.value > 0 ? row.opacity : 0.16,
      stroke: row.color,
    },
    z: 80 + row.liveRank,
  };
};

type LabelRow = {
  row: SubscriberLineRaceRow;
  x: number;
  y: number;
};

const LineLabelOverlay = ({ labelRows }: { labelRows: LabelRow[] }) => (
  <div style={styles.labelOverlay}>
    {labelRows.map((labelRow) => {
      const { row } = labelRow;
      const meta = youtubeSubscriberVideoConfig.channelMeta[row.code];
      const currentPoint = row.linePoints.at(-1);
      const videoCount = estimateCurrentVideoCount({
        currentMonthIndex: currentPoint?.monthIndex ?? raceData.minMonthIndex,
        firstUploadMonth: meta?.firstUploadMonth,
        finalVideoCount: meta?.videoCount ?? 0,
      });
      const opacity = row.value > 0 ? 1 : 0.28;

      return (
        <div
          key={`label-${row.id}`}
          style={{
            ...styles.lineLabel,
            borderColor: row.color,
            boxShadow: `0 14px 26px rgba(0,0,0,0.3), inset 0 0 0 1px ${colorWithOpacity(row.color, 0.22)}`,
            left: labelRow.x,
            opacity,
            top: labelRow.y - (lineLabel.height / 2),
          }}
        >
          <div style={{ ...styles.avatarRing, backgroundColor: row.color }}>
            <Img
              src={staticFile(`projects/youtube-subscriber-race/avatars/${row.code.toLowerCase()}.jpg`)}
              style={styles.avatar}
            />
          </div>
          <div style={styles.labelCopy}>
            <div style={styles.labelTopLine}>
              <span style={styles.labelBracket}>[</span>
              <span style={styles.labelName}>{shortName(row.name)}</span>
              <span style={{ ...styles.labelSubscribers, color: row.color }}>
                {formatSubscribers(row.value)}
              </span>
              <span style={styles.labelBracket}>]</span>
            </div>
            <div style={styles.labelBottomLine}>
              <span style={styles.labelVideos}>
                {formatVideoCount(videoCount)} videos
              </span>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

const Footer = () => (
  <div style={styles.footer}>
    <div style={styles.source}>{youtubeSubscriberVideoConfig.source}</div>
    <div style={styles.note}>Subscriber counts are public rounded counts; year-end rows are reconstructed estimates where exact snapshots are unavailable.</div>
  </div>
);

const Background = () => (
  <AbsoluteFill style={styles.background}>
    <div style={styles.pitchLines} />
    <div style={styles.topShadow} />
    <div style={styles.chartGlow} />
  </AbsoluteFill>
);

const positionLineHeadLabels = (
  rows: SubscriberLineRaceRow[],
  axisMax: number,
  timeWindow: TimeWindow,
): LabelRow[] => {
  return rows.map((row) => {
    const point = row.linePoints.at(-1);
    const pointX = point ? xForMonthIndex(point.monthIndex, timeWindow) : chart.plotLeft;
    const pointY = point ? yForValue(point.value, axisMax) : chart.plotTop + chart.plotHeight;

    return {
      row,
      x: pointX + 22,
      y: pointY,
    };
  });
};

type TimeWindow = {
  startMonthIndex: number;
  endMonthIndex: number;
};

const buildTimeWindow = (currentMonthIndex: number): TimeWindow => {
  const totalWindowMonths = visiblePastWindowMonths + visibleFutureWindowMonths;
  const monthsSinceStart = Math.max(0, currentMonthIndex - raceData.minMonthIndex);
  const currentPointRatio = clamp(monthsSinceStart / centeredAfterMonths, 0, 0.5);
  const startMonthIndex = currentMonthIndex - (totalWindowMonths * currentPointRatio);

  return {
    startMonthIndex,
    endMonthIndex: startMonthIndex + totalWindowMonths,
  };
};

const clipPointsToWindow = (
  points: SubscriberLinePoint[],
  timeWindow: TimeWindow,
): SubscriberLinePoint[] => {
  const sortedPoints = [...points].sort((a, b) => a.monthIndex - b.monthIndex);
  const inWindow = sortedPoints.filter(
    (point) =>
      point.monthIndex >= timeWindow.startMonthIndex &&
      point.monthIndex <= timeWindow.endMonthIndex,
  );
  const startPoint = interpolatePointAtMonth(sortedPoints, timeWindow.startMonthIndex);

  if (startPoint) {
    const hasStartPoint = inWindow.some(
      (point) => Math.abs(point.monthIndex - startPoint.monthIndex) < 0.001,
    );

    if (!hasStartPoint) {
      inWindow.unshift(startPoint);
    }
  }

  return inWindow;
};

const interpolatePointAtMonth = (
  points: SubscriberLinePoint[],
  monthIndex: number,
): SubscriberLinePoint | null => {
  const firstPoint = points[0];
  const lastPoint = points.at(-1);

  if (!firstPoint || !lastPoint || monthIndex <= firstPoint.monthIndex || monthIndex >= lastPoint.monthIndex) {
    return null;
  }

  const nextIndex = points.findIndex((point) => point.monthIndex >= monthIndex);
  const nextPoint = points[nextIndex];
  const previousPoint = points[nextIndex - 1];

  if (!nextPoint || !previousPoint) {
    return null;
  }

  const progress = clamp(
    (monthIndex - previousPoint.monthIndex) /
      Math.max(1, nextPoint.monthIndex - previousPoint.monthIndex),
    0,
    1,
  );

  return {
    date: '',
    year: yearFromMonthIndex(monthIndex),
    month: monthFromIndex(monthIndex),
    monthIndex,
    value: lerp(previousPoint.value, nextPoint.value, progress),
  };
};

const axisTicks = (axisMax: number) => {
  const ticks = [];
  const step = axisMax <= 150_000_000 ? 50_000_000 : 100_000_000;

  for (let value = 0; value <= axisMax; value += step) {
    ticks.push(value);
  }

  return ticks;
};

const buildTimeTicks = (timeWindow: TimeWindow) => {
  const ticks = [];
  const tickCount = 5;

  for (let index = 0; index < tickCount; index += 1) {
    const progress = index / (tickCount - 1);
    const monthIndex = lerp(timeWindow.startMonthIndex, timeWindow.endMonthIndex, progress);

    ticks.push({
      monthIndex,
      label: formatMonthTick(monthIndex),
    });
  }

  return ticks;
};

const xForMonthIndex = (monthIndex: number, timeWindow: TimeWindow) => {
  const progress = (monthIndex - timeWindow.startMonthIndex) /
    Math.max(1, timeWindow.endMonthIndex - timeWindow.startMonthIndex);

  return chart.plotLeft + clamp(progress, 0, 1) * chart.plotWidth;
};

const yForValue = (value: number, axisMax: number) => {
  const progress = clamp(value / Math.max(1, axisMax), 0, 1);
  return chart.plotTop + ((1 - progress) * chart.plotHeight);
};

const yearFromMonthIndex = (monthIndex: number) => Math.floor(Math.round(monthIndex) / 12);

const monthFromIndex = (monthIndex: number) => (Math.round(monthIndex) % 12) + 1;

const formatMonthTick = (monthIndex: number) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const roundedMonthIndex = Math.round(monthIndex);
  const year = yearFromMonthIndex(roundedMonthIndex);
  const month = monthFromIndex(roundedMonthIndex);

  if (month === 1) {
    return String(year);
  }

  return `${monthNames[month - 1]} '${String(year).slice(2)}`;
};

const getAxisMax = (value: number) => Math.ceil(value / 50_000_000) * 50_000_000;

const formatAxisValue = (value: number) => value === 0 ? '0' : `${Math.round(value / 1_000_000)}M`;

const shortName = (name: string) => {
  const replacements = new Map([
    ['Alan\'s Universe', 'Alan'],
    ['KimPro KIMPRO', 'KIMPRO'],
    ['Dude Perfect', 'Dude Perf.'],
    ['Stokes Twins', 'Stokes'],
    ['Vlad and Niki', 'Vlad/Niki'],
    ['Mark Rober', 'Rober'],
  ]);

  return replacements.get(name) ?? name;
};

const formatSubscribers = (value: number) => {
  if (value >= 100_000_000) {
    return `${Math.round(value / 1_000_000)}M`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
  }

  if (value <= 0) {
    return '0';
  }

  return `${Math.round(value / 1_000)}K`;
};

const estimateCurrentVideoCount = ({
  currentMonthIndex,
  finalVideoCount,
  firstUploadMonth,
}: {
  currentMonthIndex: number;
  finalVideoCount: number;
  firstUploadMonth: string | undefined;
}) => {
  const firstUploadMonthIndex = monthIndexFromMonthText(firstUploadMonth) ?? raceData.minMonthIndex;
  const progress = clamp(
    (currentMonthIndex - firstUploadMonthIndex) /
      Math.max(1, raceData.maxMonthIndex - firstUploadMonthIndex),
    0,
    1,
  );
  const easedProgress = progress * progress * (3 - (2 * progress));

  return Math.round(finalVideoCount * easedProgress);
};

const monthIndexFromMonthText = (monthText: string | undefined) => {
  if (!monthText) {
    return null;
  }

  const [yearText, monthTextPart = '1'] = monthText.split('-');
  const year = Number(yearText);
  const month = Number(monthTextPart);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }

  return (year * 12) + month - 1;
};

const formatVideoCount = (value: number) => {
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace('.0', '')}K`;
  }

  return String(value);
};

const colorWithOpacity = (hexColor: string, opacity: number) => {
  const [red, green, blue] = hexToRgb(hexColor);

  return `rgba(${red},${green},${blue},${opacity})`;
};

const hexToRgb = (hex: string) => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

const lerp = (start: number, end: number, progress: number) => start + (end - start) * progress;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const styles = {
  stage: {
    backgroundColor: '#020302',
    color: '#FFFFFF',
    fontFamily: fontStack,
    overflow: 'hidden',
  },
  background: {
    backgroundColor: '#020705',
    backgroundImage:
      'radial-gradient(circle at 54% 58%, rgba(14,95,56,0.18) 0%, rgba(6,42,29,0.11) 31%, rgba(2,7,5,0) 64%), radial-gradient(circle at 14% 22%, rgba(0,116,72,0.08) 0%, rgba(0,116,72,0) 35%), radial-gradient(circle at 86% 18%, rgba(42,88,180,0.06) 0%, rgba(42,88,180,0) 34%), linear-gradient(180deg, #020705 0%, #03110C 52%, #010201 100%)',
  },
  pitchLines: {
    position: 'absolute',
    inset: 0,
    opacity: 0.34,
    backgroundImage:
      'repeating-linear-gradient(90deg, rgba(26,110,67,0.1) 0 92px, rgba(7,49,33,0.055) 92px 184px), linear-gradient(90deg, rgba(255,255,255,0.034) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.024) 1px, transparent 1px)',
    backgroundSize: '100% 100%, 124px 124px, 100% 152px',
  },
  topShadow: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.12) 34%, rgba(0,0,0,0.72) 100%)',
  },
  chartGlow: {
    position: 'absolute',
    left: 70,
    right: 70,
    top: chart.top - 95,
    height: chart.height + 260,
    background:
      'radial-gradient(ellipse at 54% 50%, rgba(62,180,105,0.08), rgba(7,28,20,0.22) 38%, rgba(0,0,0,0) 74%)',
  },
  header: {
    position: 'absolute',
    left: 112,
    right: 70,
    top: 166 + templateTopOffset,
    zIndex: 5,
  },
  headerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 22,
  },
  title: {
    color: '#F5E829',
    fontSize: 61,
    fontWeight: 950,
    lineHeight: 0.94,
    letterSpacing: 0,
    whiteSpace: 'nowrap',
  },
  titleHook: {
    marginTop: 9,
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 950,
    lineHeight: 1.05,
    letterSpacing: 0,
    textShadow: '0 5px 18px rgba(0,0,0,0.64)',
    whiteSpace: 'nowrap',
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.86)',
    fontSize: 23,
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
  currentMonth: {
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
  legend: {
    position: 'absolute',
    left: chart.left + chart.plotLeft,
    top: chart.top - 46,
    width: chart.width - chart.plotLeft - 58,
    zIndex: 6,
    display: 'flex',
    justifyContent: 'space-between',
    color: 'rgba(255,255,255,0.54)',
    fontSize: 22,
    fontWeight: 950,
    letterSpacing: 0,
  },
  chart: {
    position: 'absolute',
    left: chart.left,
    top: chart.top,
    width: chart.width,
    height: chart.height,
    zIndex: 6,
    overflow: 'hidden',
    transformOrigin: 'center top',
    willChange: 'transform, opacity',
  },
  echartsCanvas: {
    position: 'absolute',
    inset: 0,
    width: chart.width,
    height: chart.height,
    pointerEvents: 'none',
  },
  labelOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 8,
    pointerEvents: 'none',
  },
  lineLabel: {
    position: 'absolute',
    width: lineLabel.width,
    height: lineLabel.height,
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    padding: '8px 12px',
    border: '2px solid rgba(255,255,255,0.18)',
    borderRadius: 6,
    background: 'rgba(2,7,5,0.88)',
    overflow: 'hidden',
  },
  avatarRing: {
    flex: '0 0 auto',
    width: lineLabel.avatarSize,
    height: lineLabel.avatarSize,
    borderRadius: 6,
    padding: 3,
    boxShadow: '0 9px 15px rgba(0,0,0,0.28)',
  },
  avatar: {
    display: 'block',
    width: '100%',
    height: '100%',
    borderRadius: 4,
    objectFit: 'cover',
  },
  labelCopy: {
    minWidth: 0,
    flex: 1,
  },
  labelTopLine: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    minWidth: 0,
  },
  labelBracket: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1,
  },
  labelName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  labelBottomLine: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'flex-start',
    marginTop: 7,
  },
  labelSubscribers: {
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  labelVideos: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 14,
    fontWeight: 900,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  footer: {
    position: 'absolute',
    left: 112,
    right: 76,
    top: 1558,
    zIndex: 7,
  },
  source: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 1.28,
  },
  note: {
    marginTop: 9,
    color: 'rgba(245,232,41,0.78)',
    fontSize: 22,
    fontWeight: 850,
    lineHeight: 1.22,
  },
} satisfies Record<string, CSSProperties>;
