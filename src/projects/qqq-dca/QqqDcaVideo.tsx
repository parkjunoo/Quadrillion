import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  createPriceNewsFrameGeometry,
  PriceNewsChartShell,
  PriceNewsVideoFrame,
} from '../../shared/priceNewsVideoFrame';
import { SHORTS_PLATFORM_TOP_CLEARANCE, VIDEO_HEIGHT, VIDEO_WIDTH } from '../../shared/video';
import { qqqDcaBuyableMilestones, qqqDcaVideoConfig } from './config';
import { qqqDcaData, type QqqDcaPoint } from './qqqDcaData';

type EChartsGraphicElement = Record<string, unknown>;

type EndpointLabel = {
  amountValue: string;
  color: string;
  detail: string;
  id: string;
  label: string;
  percentValue: string;
  reveal: number;
  valueColor: string;
  x: number;
  y: number;
};

type TimeWindow = {
  end: number;
  start: number;
};

type ChartPoint = [number, number];

type AverageCostLabel = {
  color: string;
  id: string;
  labelY: number;
  lineY: number;
  opacity: number;
  text: string;
};

type PlotBounds = {
  height: number;
  left: number;
  top: number;
  width: number;
};

const fontStack =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const channelName = 'WHOA-DATA';
const frameInset = {
  left: 76,
  right: 76,
};
const frameLayout = createPriceNewsFrameGeometry({
  chartHeight: 1120,
  chartTop: 472 + SHORTS_PLATFORM_TOP_CLEARANCE,
  dateReadoutTop: 352 + SHORTS_PLATFORM_TOP_CLEARANCE,
  frameInset,
  headerTop: 112 + SHORTS_PLATFORM_TOP_CLEARANCE,
  newsFeedBottom: 188,
});
const chart = {
  height: frameLayout.chart.height,
  width: frameLayout.chart.width,
};
const sharedPlot = {
  left: 32,
  width: frameLayout.chart.width - 152,
};
const returnPlot: PlotBounds = {
  height: 400,
  left: sharedPlot.left,
  top: 282,
  width: sharedPlot.width,
};
const pricePlot: PlotBounds = {
  height: 220,
  left: sharedPlot.left,
  top: 776,
  width: sharedPlot.width,
};
const plotRight = sharedPlot.left + sharedPlot.width;
const returnPlotBottom = returnPlot.top + returnPlot.height;
const pricePlotBottom = pricePlot.top + pricePlot.height;
const rightAxisLabelX = chart.width - 18;
const endpointLabel = {
  gap: 104,
  height: 92,
  width: 340,
};
const tenYearRevealIndexWindow = 120;
const tenYearStartAccentIndexWindow = 70;
const latestIntroSeconds = 2;
const finalHoldSeconds = 2;
const theme = {
  background: '#F6F8FB',
  border: 'rgba(21,22,24,0.1)',
  chartBackground: '#FFFFFF',
  ink: '#151618',
  muted: 'rgba(21,22,24,0.62)',
  panel: '#FFFFFF',
} as const;
const colors = {
  invested: '#8A8F98',
  price: '#235BDB',
  tenYear: '#C58A19',
  twentyYear: '#7C3AED',
} as const;
const startTime = qqqDcaData.points[0]?.time ?? 0;
const endTime = qqqDcaData.finalPoint.time;
const oneYearMs = 365.25 * 24 * 60 * 60 * 1000;
const verticalAnchorRatio = 2 / 3;
const qqqPriceWindowScale = 1;
const minimumReturnAxisMin = -60;
const minimumReturnAxisMax = 50;
const minimumPriceAxisMax = 200;
const returnPercent = (value: number, invested: number) => {
  if (invested <= 0) {
    return 0;
  }

  return ((value - invested) / invested) * 100;
};
const dynamicReturnAxisMaxByIndex = qqqDcaData.points.reduce<number[]>((axisMaxValues, point) => {
  const previousAxisMax = axisMaxValues[axisMaxValues.length - 1] ?? minimumReturnAxisMax;
  const twentyYearReturn = returnPercent(point.twentyYearValue, point.twentyYearInvested);
  const tenYearReturn =
    point.tenYearValue === null || point.tenYearInvested === null
      ? Number.NEGATIVE_INFINITY
      : returnPercent(point.tenYearValue, point.tenYearInvested);
  const currentMax = Math.max(0, twentyYearReturn, tenYearReturn);
  const targetAxisMax = Math.max(previousAxisMax, currentMax / verticalAnchorRatio);

  axisMaxValues.push(targetAxisMax);

  return axisMaxValues;
}, []);
const finalReturnAxisMax =
  dynamicReturnAxisMaxByIndex[dynamicReturnAxisMaxByIndex.length - 1] ?? minimumReturnAxisMax;
const dynamicPriceAxisMaxByIndex = qqqDcaData.points.reduce<number[]>((axisMaxValues, point) => {
  const previousAxisMax = axisMaxValues[axisMaxValues.length - 1] ?? minimumPriceAxisMax;
  const currentMax = Math.max(point.close, point.tenYearAverageCost ?? 0, point.twentyYearAverageCost);
  const targetAxisMax = Math.max(previousAxisMax, (currentMax / verticalAnchorRatio) * qqqPriceWindowScale);

  axisMaxValues.push(targetAxisMax);

  return axisMaxValues;
}, []);
const finalPriceAxisMax = dynamicPriceAxisMaxByIndex[dynamicPriceAxisMaxByIndex.length - 1] ?? minimumPriceAxisMax;

export const QqqDcaVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const introFrames = Math.round(latestIntroSeconds * fps);
  const finalHoldFrames = Math.round(finalHoldSeconds * fps);
  const chartFrame = Math.max(0, frame - introFrames);
  const motionFrames = Math.max(1, durationInFrames - introFrames - finalHoldFrames);
  const timelineProgress = interpolate(chartFrame, [0, motionFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const currentIndex = Math.round(timelineProgress * (qqqDcaData.points.length - 1));
  const point = qqqDcaData.points[currentIndex] ?? qqqDcaData.finalPoint;
  const sceneIntro = frame >= introFrames ? 1 : 0;

  return (
    <PriceNewsVideoFrame theme={theme}>
      <QqqHeader intro={sceneIntro} />
      <PrincipalReadout intro={sceneIntro} point={point} />
      <QqqDateReadout>{formatDisplayDate(point.date)}</QqqDateReadout>
      <PriceNewsChartShell geometry={frameLayout} theme={theme}>
        <BuyableMilestones intro={sceneIntro} point={point} />
        <DcaLineChart currentIndex={currentIndex} />
        <ChartLegend />
      </PriceNewsChartShell>
      <Footer />
      <QqqModernIntro fps={fps} frame={frame} />
    </PriceNewsVideoFrame>
  );
};

const qqqIntroHeader = {
  left: frameLayout.frameInset.left,
  right: frameLayout.frameInset.right,
  top: frameLayout.headerTop + 70,
};
const qqqIntroTitle = qqqDcaVideoConfig.title;
const qqqIntroTag = '@whoa-data';
const qqqIntroTitleFontSize = 54;
const signColors = {
  negative: '#D64545',
  positive: '#087F5B',
  zero: theme.ink,
} as const;

const QqqHeader = ({ intro }: { intro: number }) => (
  <div style={{ ...styles.qqqHeader, opacity: intro }}>
    <div style={styles.qqqHeaderTitle}>{qqqDcaVideoConfig.title}</div>
    <div style={styles.qqqHeaderSubtitle}>{qqqDcaVideoConfig.subtitle}</div>
  </div>
);

const QqqDateReadout = ({ children }: { children: string }) => (
  <div style={styles.qqqDateReadout}>
    <div style={styles.qqqDateLabel}>CURRENT DAY</div>
    <div style={styles.qqqCurrentDate}>{children}</div>
  </div>
);

const FlowArrowIcon = () => (
  <svg aria-hidden="true" height={24} style={styles.principalArrow} viewBox="0 0 44 24" width={44}>
    <path
      d="M4 12H34"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={5}
    />
    <path
      d="M24 4L36 12L24 20"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={5}
    />
  </svg>
);

const PrincipalReadout = ({ intro, point }: { intro: number; point: QqqDcaPoint }) => (
  <div style={{ ...styles.principalReadout, opacity: intro }}>
    <PrincipalReadoutRow
      color={colors.twentyYear}
      invested={point.twentyYearInvested}
      label="20Y"
      pnl={point.twentyYearPnl}
      value={point.twentyYearValue}
    />
    <PrincipalReadoutRow
      color={colors.tenYear}
      invested={point.tenYearInvested ?? 0}
      label="10Y"
      pnl={point.tenYearPnl ?? 0}
      value={point.tenYearValue ?? 0}
    />
  </div>
);

const PrincipalReadoutRow = ({
  color,
  invested,
  label,
  pnl,
  value,
}: {
  color: string;
  invested: number;
  label: string;
  pnl: number;
  value: number;
}) => (
  <div style={styles.principalRow}>
    <span style={{ ...styles.principalLabel, color }}>{label}</span>
    <span style={styles.principalAmount}>{formatCurrencyFull(invested)}</span>
    <FlowArrowIcon />
    <span style={{ ...styles.principalTotal, color: getSignedToneColor(pnl) }}>
      {formatCurrencyFull(value)}
    </span>
  </div>
);

const BuyableMilestones = ({ intro, point }: { intro: number; point: QqqDcaPoint }) => {
  const profit = Math.max(0, point.twentyYearPnl);
  const unlockedCount = qqqDcaBuyableMilestones.filter((item) => profit >= item.price).length;

  return (
    <div style={{ ...styles.buyableStrip, opacity: intro }}>
      <div style={styles.buyableHeader}>
        <div style={styles.buyableTitleGroup}>
          <span style={styles.buyableTitle}>20Y PROFIT BUYS</span>
          <span style={styles.buyableProfit}>{formatCurrencyFull(profit)} profit</span>
        </div>
        <div style={styles.buyableUnlocked}>{unlockedCount}/{qqqDcaBuyableMilestones.length} unlocked</div>
      </div>
      <div style={styles.buyableGrid}>
        {qqqDcaBuyableMilestones.map((item) => {
          const isUnlocked = profit >= item.price;
          const unlockProgress = getMilestoneUnlockProgress(profit, item.price);

          return (
            <div
              key={item.id}
              style={{
                ...styles.buyableCard,
                borderColor: isUnlocked ? colorWithOpacity(item.accent, 0.72) : 'rgba(21,22,24,0.1)',
                boxShadow: isUnlocked
                  ? `0 10px 24px ${colorWithOpacity(item.accent, 0.16)}`
                  : '0 8px 18px rgba(21,22,24,0.06)',
                opacity: isUnlocked ? 1 : 0.62,
                transform: `translateY(${-5 * unlockProgress}px) scale(${0.98 + unlockProgress * 0.02})`,
              }}
            >
              <Img
                src={staticFile(item.image)}
                style={{
                  ...styles.buyableImage,
                  filter: isUnlocked ? 'none' : 'grayscale(1) contrast(0.82)',
                  opacity: isUnlocked ? 1 : 0.46,
                }}
              />
              <div
                style={{
                  ...styles.buyablePriceBadge,
                  background: isUnlocked ? colorWithOpacity(item.accent, 0.94) : 'rgba(21,22,24,0.55)',
                }}
              >
                {formatCurrencyWhole(item.price)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const QqqModernIntro = ({ fps, frame }: { fps: number; frame: number }) => {
  const durationFrames = Math.round(latestIntroSeconds * fps);

  if (frame >= durationFrames) {
    return null;
  }

  const holdFrames = Math.round(0.72 * fps);
  const moveProgress = easeOutCubic(
    interpolate(frame, [holdFrames, durationFrames - 1], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const templateReveal = interpolate(moveProgress, [0.12, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const templateExit = interpolate(moveProgress, [0.7, 0.96], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const backdropOpacity = interpolate(moveProgress, [0.08, 0.94], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleWidth = estimateIntroTitleWidth(qqqIntroTitle, qqqIntroTitleFontSize);
  const titleHeight = estimateIntroTitleHeight(qqqIntroTitle, qqqIntroTitleFontSize);
  const titleSafeWidth = VIDEO_WIDTH - qqqIntroHeader.left - qqqIntroHeader.right;
  const startScale = Math.min(1.08, titleSafeWidth / titleWidth);
  const startX = (VIDEO_WIDTH - titleWidth * startScale) / 2 - qqqIntroHeader.left;
  const startY = VIDEO_HEIGHT * 0.47 - (titleHeight * startScale) / 2 - qqqIntroHeader.top;
  const titleX = interpolate(moveProgress, [0, 1], [startX, 0]);
  const titleY = interpolate(moveProgress, [0, 1], [startY, 0]);
  const titleScale = interpolate(moveProgress, [0, 1], [startScale, 1]);
  const tagWidth = estimateIntroTagWidth(qqqIntroTag);
  const tagStartX = clamp(
    qqqIntroHeader.left + startX + titleWidth * startScale - tagWidth * 1.08,
    qqqIntroHeader.left,
    VIDEO_WIDTH - qqqIntroHeader.right - tagWidth,
  );
  const tagStartY = qqqIntroHeader.top + startY + titleHeight * startScale + 66;
  const tagFinalX = Math.min(
    VIDEO_WIDTH - qqqIntroHeader.right - tagWidth,
    qqqIntroHeader.left + titleWidth + 20,
  );
  const tagFinalY = qqqIntroHeader.top + 9;
  const tagX = interpolate(moveProgress, [0, 1], [tagStartX, tagFinalX]);
  const tagY = interpolate(moveProgress, [0, 1], [tagStartY, tagFinalY]);
  const tagScale = interpolate(moveProgress, [0, 1], [1.08, 1]);

  return (
    <AbsoluteFill style={styles.qqqIntroStage}>
      <div style={{ ...styles.qqqIntroBackdrop, opacity: backdropOpacity }}>
        <div style={styles.qqqIntroGrid} />
        <div style={styles.qqqIntroGlow} />
      </div>
      <div style={{ ...styles.qqqIntroTemplate, opacity: templateReveal * templateExit * backdropOpacity }}>
        <div style={styles.qqqIntroYear}>2026</div>
        <svg height={320} style={styles.qqqIntroChartGhost} viewBox="0 0 880 320" width={880}>
          <line x1={0} x2={880} y1={258} y2={258} stroke="rgba(21,22,24,0.18)" strokeWidth={5} />
          <polyline
            fill="none"
            points="0,270 80,264 160,252 240,230 320,205 400,184 480,172 560,120 640,156 720,88 800,62 880,34"
            stroke={colors.twentyYear}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={10}
          />
          <polyline
            fill="none"
            points="0,248 90,246 180,238 270,225 360,208 450,190 540,176 630,150 720,98 810,72 880,44"
            stroke={colorWithOpacity(colors.price, 0.72)}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={6}
          />
          <text fill="rgba(21,22,24,0.5)" fontFamily={fontStack} fontSize={24} fontWeight={850} x={0} y={308}>
            2006
          </text>
          <text
            fill="rgba(21,22,24,0.5)"
            fontFamily={fontStack}
            fontSize={24}
            fontWeight={850}
            textAnchor="end"
            x={880}
            y={308}
          >
            2026
          </text>
        </svg>
      </div>
      <div
        style={{
          ...styles.qqqIntroTitleGroup,
          transform: `translate(${titleX}px, ${titleY}px) scale(${titleScale})`,
          width: titleWidth,
        }}
      >
        <div style={styles.qqqIntroTitle}>{qqqIntroTitle}</div>
        <div style={styles.qqqIntroSubtitle}>{qqqDcaVideoConfig.subtitle}</div>
      </div>
      <div
        style={{
          ...styles.qqqIntroNameTag,
          opacity: interpolate(moveProgress, [0.68, 0.92], [1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          transform: `translate(${tagX}px, ${tagY}px) scale(${tagScale})`,
        }}
      >
        {qqqIntroTag}
      </div>
      <div
        style={{
          ...styles.qqqIntroDetails,
          opacity: interpolate(moveProgress, [0.18, 0.42, 0.72, 0.92], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        $10 every trading day
      </div>
    </AbsoluteFill>
  );
};

const DcaLineChart = ({
  currentIndex,
}: {
  currentIndex: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const option = useMemo(() => buildEChartsOption(currentIndex), [currentIndex]);
  const labels = useMemo(() => buildEndpointLabels(currentIndex), [currentIndex]);

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
    <div style={styles.chartLayer}>
      <div ref={containerRef} style={styles.echartsCanvas} />
      <EndpointLabels labels={labels} />
    </div>
  );
};

const ChartLegend = () => (
  <div style={styles.legend}>
    <LegendItem color={colors.twentyYear} label="20Y return" />
    <LegendItem color={colors.tenYear} label="10Y return" />
    <LegendItem color={colors.price} label="QQQ price" />
  </div>
);

const LegendItem = ({ color, dashed = false, label }: { color: string; dashed?: boolean; label: string }) => (
  <div style={styles.legendItem}>
    <div
      style={{
        ...styles.legendSwatch,
        backgroundColor: dashed ? 'transparent' : color,
        borderTop: dashed ? `3px dashed ${color}` : undefined,
      }}
    />
    <span>{label}</span>
  </div>
);

const EndpointLabels = ({ labels }: { labels: EndpointLabel[] }) => (
  <div style={styles.endpointLayer}>
    {labels.map((label) => (
      <div
        key={label.id}
        style={{
          ...styles.endpointLabel,
          borderColor: colorWithOpacity(label.color, 0.34),
          left: xForEndpointLabel(label.x),
          opacity: label.reveal,
          top: label.y - endpointLabel.height / 2,
          transform: `translateY(${(1 - label.reveal) * 14}px) scale(${0.94 + label.reveal * 0.06})`,
        }}
      >
        <div style={{ ...styles.endpointName, color: label.color }}>{label.label}</div>
        <div style={styles.endpointValue}>
          <span style={{ color: label.valueColor }}>{label.amountValue}</span>
          <span style={{ color: label.valueColor }}>{label.percentValue}</span>
        </div>
        <div style={styles.endpointDetail}>{label.detail}</div>
      </div>
    ))}
  </div>
);

const Footer = () => (
  <div style={styles.footer}>
    <div style={styles.footerChannel}>{channelName}</div>
    <div style={styles.footerSource}>{qqqDcaVideoConfig.source}</div>
  </div>
);

const buildEChartsOption = (currentIndex: number): EChartsOption => {
  const currentPoint = qqqDcaData.points[currentIndex] ?? qqqDcaData.finalPoint;
  const returnAxisMax = getReturnAxisMax(currentIndex);
  const priceAxisMax = getPriceAxisMax(currentIndex);
  const tenYearReveal = getTenYearRevealProgress(currentIndex);
  const timeWindow = buildTimeWindow();
  const visiblePoints = getVisiblePoints(currentIndex, timeWindow);
  const tenYearVisiblePoints = visiblePoints.filter((point) => point.tenYearValue !== null);
  const twentyYearReturnPoints = visiblePoints.map((point) =>
    toReturnChartPoint(point, point.twentyYearValue, point.twentyYearInvested, timeWindow, returnAxisMax),
  );
  const twentyYearReturnBaselinePoints = visiblePoints.map((point) =>
    toReturnBaselineChartPoint(point, timeWindow, returnAxisMax),
  );
  const tenYearReturnPoints = tenYearVisiblePoints.map((point) =>
    toReturnChartPoint(point, point.tenYearValue ?? 0, point.tenYearInvested ?? 0, timeWindow, returnAxisMax),
  );
  const tenYearReturnBaselinePoints = tenYearVisiblePoints.map((point) =>
    toReturnBaselineChartPoint(point, timeWindow, returnAxisMax),
  );
  const pricePoints = visiblePoints.map((point) => toPriceChartPoint(point, timeWindow, priceAxisMax));
  const elements: EChartsGraphicElement[] = [
    ...buildGridElements(currentPoint, timeWindow, returnAxisMax, priceAxisMax, tenYearReveal, currentIndex),
    buildProfitAreaElement(
      'return-area-twenty-year',
      twentyYearReturnPoints,
      twentyYearReturnBaselinePoints,
      colors.twentyYear,
      18,
    ),
    buildProfitAreaElement(
      'return-area-ten-year',
      tenYearReturnPoints,
      tenYearReturnBaselinePoints,
      colors.tenYear,
      19,
      tenYearReveal,
    ),
    buildLineElement('return-twenty-year', twentyYearReturnPoints, colors.twentyYear, 5.8, 28),
    buildLineElement('return-ten-year', tenYearReturnPoints, colors.tenYear, 5.8, 30, { opacity: tenYearReveal }),
    buildLineElement('line-price', pricePoints, colors.price, 4.2, 32, { opacity: 0.72 }),
    ...buildAverageCostElements(currentPoint, priceAxisMax, tenYearReveal),
    ...buildMarkers(currentPoint, timeWindow, returnAxisMax, priceAxisMax, tenYearReveal),
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

const getVisiblePoints = (currentIndex: number, timeWindow: TimeWindow) =>
  qqqDcaData.points
    .slice(0, currentIndex + 1)
    .filter((point) => point.time >= timeWindow.start && point.time <= timeWindow.end);

const toReturnChartPoint = (
  point: QqqDcaPoint,
  value: number,
  invested: number,
  timeWindow: TimeWindow,
  returnAxisMax: number,
): ChartPoint => [
  xForTime(point.time, timeWindow),
  yForReturnPercent(returnPercent(value, invested), returnAxisMax),
];

const toReturnBaselineChartPoint = (
  point: QqqDcaPoint,
  timeWindow: TimeWindow,
  returnAxisMax: number,
): ChartPoint => [xForTime(point.time, timeWindow), yForReturnPercent(0, returnAxisMax)];

const toPriceChartPoint = (
  point: QqqDcaPoint,
  timeWindow: TimeWindow,
  priceAxisMax: number,
): ChartPoint => [xForTime(point.time, timeWindow), yForQqqPrice(point.close, priceAxisMax)];

const buildGridElements = (
  currentPoint: QqqDcaPoint,
  timeWindow: TimeWindow,
  returnAxisMax: number,
  priceAxisMax: number,
  tenYearReveal: number,
  currentIndex: number,
): EChartsGraphicElement[] => {
  const returnTicks = buildReturnTicks(returnAxisMax);
  const priceTicks = buildPriceTicks(priceAxisMax);
  const yearTicks = buildYearTicks(timeWindow);
  const currentX = xForTime(currentPoint.time, timeWindow);
  const tenYearStartTime = parseDateToUtcTime(qqqDcaVideoConfig.tenYearStartDate);
  const showTenYearMarker =
    currentPoint.date >= qqqDcaVideoConfig.tenYearStartDate &&
    tenYearStartTime >= timeWindow.start &&
    tenYearStartTime <= timeWindow.end;
  const tenYearX = xForTime(tenYearStartTime, timeWindow);
  const tenYearAccent = getTenYearStartAccentProgress(currentIndex);
  const tenYearBadgeX = clamp(tenYearX + 20, returnPlot.left + 12, plotRight - 268);

  return [
    {
      type: 'rect',
      id: 'return-plot-bg',
      silent: true,
      shape: {
        height: returnPlot.height,
        r: 6,
        width: returnPlot.width,
        x: returnPlot.left,
        y: returnPlot.top,
      },
      style: {
        fill: '#FBFCFE',
        stroke: 'rgba(21,22,24,0.08)',
        lineWidth: 1,
      },
    },
    {
      type: 'rect',
      id: 'price-plot-bg',
      silent: true,
      shape: {
        height: pricePlot.height,
        r: 6,
        width: pricePlot.width,
        x: pricePlot.left,
        y: pricePlot.top,
      },
      style: {
        fill: '#FBFCFE',
        stroke: 'rgba(21,22,24,0.08)',
        lineWidth: 1,
      },
    },
    ...returnTicks.map((tick) => {
      const y = yForReturnPercent(tick, returnAxisMax);

      return {
        type: 'group',
        id: `return-tick-${tick}`,
        silent: true,
        children: [
          {
            type: 'line',
            id: `return-grid-${tick}`,
            shape: { x1: returnPlot.left, x2: plotRight, y1: y, y2: y },
            style: {
              lineDash: tick === 0 ? undefined : [7, 10],
              lineWidth: tick === 0 ? 2 : 1.2,
              opacity: tick === 0 ? 0.5 : 0.2,
              stroke: tick === 0 ? 'rgba(21,22,24,0.52)' : 'rgba(21,22,24,0.35)',
            },
          },
          {
            type: 'text',
            id: `return-label-${tick}`,
            x: rightAxisLabelX,
            y,
            style: {
              fill: 'rgba(21,22,24,0.58)',
              fontFamily: fontStack,
              fontSize: 24,
              fontWeight: 900,
              text: formatAxisPercent(tick),
              textAlign: 'right',
              textVerticalAlign: 'middle',
            },
          },
        ],
      };
    }),
    ...priceTicks.map((tick) => {
      const y = yForQqqPrice(tick, priceAxisMax);

      return {
        type: 'group',
        id: `price-tick-${tick}`,
        silent: true,
        children: [
          {
            type: 'line',
            id: `price-grid-${tick}`,
            shape: { x1: pricePlot.left, x2: plotRight, y1: y, y2: y },
            style: {
              lineDash: tick === 0 ? undefined : [7, 10],
              lineWidth: tick === 0 ? 2 : 1.1,
              opacity: tick === 0 ? 0.42 : 0.18,
              stroke: 'rgba(21,22,24,0.34)',
            },
          },
          {
            type: 'text',
            id: `price-label-${tick}`,
            x: rightAxisLabelX,
            y,
            style: {
              fill: colorWithOpacity(colors.price, 0.66),
              fontFamily: fontStack,
              fontSize: 23,
              fontWeight: 900,
              text: formatCurrencyWhole(tick),
              textAlign: 'right',
              textVerticalAlign: 'middle',
            },
          },
        ],
      };
    }),
    ...yearTicks.map((year) => {
      const x = xForTime(Date.UTC(year, 0, 1), timeWindow);
      const isFirstYear = year === yearTicks[0];
      const isLastYear = year === yearTicks[yearTicks.length - 1];
      const isLastYearNearEdge = isLastYear && x > plotRight - 36;
      const labelX = isFirstYear ? pricePlot.left + 2 : isLastYearNearEdge ? plotRight - 2 : x;
      const labelAlign = isFirstYear ? 'left' : isLastYearNearEdge ? 'right' : 'center';

      return {
        type: 'group',
        id: `year-tick-${year}`,
        silent: true,
        children: [
          {
            type: 'line',
            id: `year-grid-${year}`,
            shape: { x1: x, x2: x, y1: returnPlot.top, y2: pricePlotBottom },
            style: {
              lineWidth: 1,
              opacity: 0.14,
              stroke: 'rgba(21,22,24,0.32)',
            },
          },
          {
            type: 'text',
            id: `year-label-${year}`,
            x: labelX,
            y: pricePlotBottom + 40,
            style: {
              fill: 'rgba(21,22,24,0.54)',
              fontFamily: fontStack,
              fontSize: 26,
              fontWeight: 900,
              text: String(year),
              textAlign: labelAlign,
              textVerticalAlign: 'middle',
            },
          },
        ],
      };
    }),
    ...(showTenYearMarker
      ? [
          ...(tenYearAccent > 0
            ? [
                {
                  type: 'circle',
                  id: 'ten-year-start-pulse',
                  silent: true,
                  shape: {
                    cx: tenYearX,
                    cy: returnPlot.top + 58,
                    r: 28 + (1 - tenYearAccent) * 34,
                  },
                  style: {
                    fill: colorWithOpacity(colors.tenYear, 0.06),
                    lineWidth: 5,
                    opacity: tenYearAccent,
                    stroke: colorWithOpacity(colors.tenYear, 0.58),
                  },
                  z: 20,
                },
                {
                  type: 'rect',
                  id: 'ten-year-start-badge-bg',
                  silent: true,
                  shape: {
                    height: 60,
                    r: 5,
                    width: 248,
                    x: tenYearBadgeX,
                    y: returnPlot.top + 56,
                  },
                  style: {
                    fill: colors.tenYear,
                    opacity: tenYearAccent,
                    shadowBlur: 18,
                    shadowColor: colorWithOpacity(colors.tenYear, 0.22),
                  },
                  z: 21,
                },
                {
                  type: 'text',
                  id: 'ten-year-start-badge-text',
                  silent: true,
                  x: tenYearBadgeX + 20,
                  y: returnPlot.top + 86,
                  style: {
                    fill: '#FFFFFF',
                    fontFamily: fontStack,
                    fontSize: 22,
                    fontWeight: 950,
                    opacity: tenYearAccent,
                    text: '10Y BUY START',
                    textAlign: 'left',
                    textVerticalAlign: 'middle',
                  },
                  z: 22,
                },
              ]
            : []),
          {
            type: 'line',
            id: 'ten-year-start-line',
            silent: true,
            shape: { x1: tenYearX, x2: tenYearX, y1: returnPlot.top, y2: pricePlotBottom },
            style: {
              lineDash: [9, 9],
              lineWidth: 2.2,
              opacity: 0.46 * tenYearReveal,
              stroke: colors.tenYear,
            },
            z: 12,
          },
          {
            type: 'text',
            id: 'ten-year-start-label',
            silent: true,
            x: tenYearX + 12,
            y: returnPlot.top + 24,
            style: {
              fill: colors.tenYear,
              fontFamily: fontStack,
              fontSize: 25,
              fontWeight: 950,
              opacity: tenYearReveal,
              text: '10Y START',
              textAlign: 'left',
              textVerticalAlign: 'middle',
            },
            z: 13,
          },
        ]
      : []),
    {
      type: 'line',
      id: 'current-date-line',
      silent: true,
      shape: { x1: currentX, x2: currentX, y1: returnPlot.top, y2: pricePlotBottom },
      style: {
        lineWidth: 2,
        opacity: 0.4,
        stroke: 'rgba(21,22,24,0.48)',
      },
      z: 14,
    },
    {
      type: 'text',
      id: 'current-date-label',
      silent: true,
      x: clamp(currentX, sharedPlot.left + 80, plotRight - 82),
      y: pricePlotBottom + 76,
      style: {
        fill: '#151618',
        fontFamily: fontStack,
        fontSize: 28,
        fontWeight: 950,
        text: formatDisplayDate(currentPoint.date),
        textAlign: 'center',
        textVerticalAlign: 'middle',
      },
      z: 16,
    },
    {
      type: 'text',
      id: 'return-axis-title',
      silent: true,
      x: returnPlot.left,
      y: returnPlot.top - 28,
      style: {
        fill: 'rgba(21,22,24,0.62)',
        fontFamily: fontStack,
        fontSize: 23,
        fontWeight: 950,
        text: 'RETURN %',
        textAlign: 'left',
      },
    },
    {
      type: 'text',
      id: 'right-axis-title',
      silent: true,
      x: pricePlot.left,
      y: pricePlot.top - 28,
      style: {
        fill: colorWithOpacity(colors.price, 0.78),
        fontFamily: fontStack,
        fontSize: 23,
        fontWeight: 950,
        text: 'QQQ PRICE / AVG COST',
        textAlign: 'left',
      },
    },
  ];
};

const buildLineElement = (
  id: string,
  points: ChartPoint[],
  color: string,
  lineWidth: number,
  z: number,
  options: { lineDash?: number[]; opacity?: number } = {},
): EChartsGraphicElement => ({
  type: 'polyline',
  id,
  silent: true,
  shape: {
    points,
    smooth: 0.12,
  },
  style: {
    fill: null,
    lineCap: 'round',
    lineJoin: 'round',
    lineWidth,
    lineDash: options.lineDash,
    opacity: points.length > 1 ? options.opacity ?? 1 : 0,
    stroke: color,
  },
  z,
});

const buildProfitAreaElement = (
  id: string,
  valuePoints: ChartPoint[],
  investedPoints: ChartPoint[],
  color: string,
  z: number,
  opacity = 1,
): EChartsGraphicElement => ({
  type: 'polygon',
  id,
  silent: true,
  shape: {
    points:
      valuePoints.length > 1 && investedPoints.length > 1
        ? [...valuePoints, ...[...investedPoints].reverse()]
        : [],
  },
  style: {
    fill: colorWithOpacity(color, 0.14),
    opacity: valuePoints.length > 1 ? opacity : 0,
    stroke: null,
  },
  z,
});

const buildAverageCostElements = (
  point: QqqDcaPoint,
  priceAxisMax: number,
  tenYearReveal: number,
): EChartsGraphicElement[] => {
  const twentyYearAverageCostY = yForQqqPrice(point.twentyYearAverageCost, priceAxisMax);
  const tenYearAverageCostY =
    point.tenYearAverageCost === null ? null : yForQqqPrice(point.tenYearAverageCost, priceAxisMax);
  const labels = positionAverageCostLabels([
    {
      color: colors.twentyYear,
      id: 'avg-cost-twenty-year',
      labelY: twentyYearAverageCostY,
      lineY: twentyYearAverageCostY,
      opacity: 1,
      text: `20Y AVG ${formatCurrencyFull(point.twentyYearAverageCost)}`,
    },
    ...(tenYearAverageCostY === null || point.tenYearAverageCost === null
      ? []
      : [
          {
            color: colors.tenYear,
            id: 'avg-cost-ten-year',
            labelY: tenYearAverageCostY,
            lineY: tenYearAverageCostY,
            opacity: tenYearReveal,
            text: `10Y AVG ${formatCurrencyFull(point.tenYearAverageCost)}`,
          },
        ]),
  ]);

  return labels.flatMap((label) => [
    {
      type: 'line',
      id: `${label.id}-line`,
      silent: true,
      shape: { x1: pricePlot.left, x2: rightAxisLabelX, y1: label.lineY, y2: label.lineY },
      style: {
        lineDash: [8, 8],
        lineWidth: 2.4,
        opacity: 0.72 * label.opacity,
        stroke: label.color,
      },
      z: 24,
    },
    {
      type: 'text',
      id: `${label.id}-label`,
      silent: true,
      x: rightAxisLabelX,
      y: label.labelY,
      style: {
        backgroundColor: label.color,
        borderRadius: 3,
        fill: '#FFFFFF',
        fontFamily: fontStack,
        fontSize: 20,
        fontWeight: 950,
        opacity: label.opacity,
        padding: [6, 9],
        text: label.text,
        textAlign: 'right',
        textVerticalAlign: 'middle',
      },
      z: 25,
    },
  ]);
};

const positionAverageCostLabels = (labels: AverageCostLabel[]) => {
  const sortedLabels = [...labels].sort((a, b) => a.labelY - b.labelY);
  const minY = pricePlot.top + 18;
  const maxY = pricePlotBottom - 18;
  const minGap = 30;

  for (let index = 0; index < sortedLabels.length; index += 1) {
    const previous = sortedLabels[index - 1];
    const label = sortedLabels[index];

    if (!label) {
      continue;
    }

    label.labelY = clamp(label.labelY, minY, maxY);

    if (previous && label.labelY - previous.labelY < minGap) {
      label.labelY = previous.labelY + minGap;
    }
  }

  for (let index = sortedLabels.length - 2; index >= 0; index -= 1) {
    const next = sortedLabels[index + 1];
    const label = sortedLabels[index];

    if (!label || !next) {
      continue;
    }

    if (next.labelY > maxY) {
      next.labelY = maxY;
    }

    if (next.labelY - label.labelY < minGap) {
      label.labelY = next.labelY - minGap;
    }
  }

  return sortedLabels.map((label) => ({
    ...label,
    labelY: clamp(label.labelY, minY, maxY),
  }));
};

const buildMarkers = (
  point: QqqDcaPoint,
  timeWindow: TimeWindow,
  returnAxisMax: number,
  priceAxisMax: number,
  tenYearReveal: number,
): EChartsGraphicElement[] => {
  const markers: EChartsGraphicElement[] = [
    buildMarker(
      'marker-price',
      xForTime(point.time, timeWindow),
      yForQqqPrice(point.close, priceAxisMax),
      colors.price,
      38,
      { opacity: 0.72, radius: 6 },
    ),
    buildMarker(
      'marker-return-twenty-year',
      xForTime(point.time, timeWindow),
      yForReturnPercent(returnPercent(point.twentyYearValue, point.twentyYearInvested), returnAxisMax),
      colors.twentyYear,
      40,
    ),
  ];

  if (point.tenYearValue !== null) {
    markers.push(
      buildMarker(
        'marker-return-ten-year',
        xForTime(point.time, timeWindow),
        yForReturnPercent(returnPercent(point.tenYearValue, point.tenYearInvested ?? 0), returnAxisMax),
        colors.tenYear,
        42,
        { opacity: tenYearReveal, radius: 4 + tenYearReveal * 4 },
      ),
    );
  }

  return markers;
};

const buildMarker = (
  id: string,
  cx: number,
  cy: number,
  color: string,
  z: number,
  options: { opacity?: number; radius?: number } = {},
): EChartsGraphicElement => ({
  type: 'circle',
  id,
  silent: true,
  shape: { cx, cy, r: options.radius ?? 8 },
  style: {
    fill: '#FFFFFF',
    lineWidth: 4,
    opacity: options.opacity ?? 1,
    shadowBlur: 12,
    shadowColor: colorWithOpacity(color, 0.28),
    stroke: color,
  },
  z,
});

const buildEndpointLabels = (currentIndex: number): EndpointLabel[] => {
  const point = qqqDcaData.points[currentIndex] ?? qqqDcaData.finalPoint;
  const returnAxisMax = getReturnAxisMax(currentIndex);
  const timeWindow = buildTimeWindow();
  const twentyYearReturn = returnPercent(point.twentyYearValue, point.twentyYearInvested);
  const labels: EndpointLabel[] = [
    {
      amountValue: formatSignedCurrencyFull(point.twentyYearPnl),
      color: colors.twentyYear,
      id: 'twenty-year',
      label: '20Y RETURN',
      percentValue: `(${formatSignedPercent(twentyYearReturn)})`,
      reveal: 1,
      valueColor: getSignedToneColor(point.twentyYearPnl),
      detail: `Value ${formatCurrencyFull(point.twentyYearValue)}`,
      x: xForTime(point.time, timeWindow),
      y: yForReturnPercent(twentyYearReturn, returnAxisMax),
    },
  ];

  if (point.tenYearValue !== null) {
    const tenYearReturn = returnPercent(point.tenYearValue, point.tenYearInvested ?? 0);

    labels.push({
      amountValue: formatSignedCurrencyFull(point.tenYearPnl ?? 0),
      color: colors.tenYear,
      id: 'ten-year',
      label: '10Y RETURN',
      percentValue: `(${formatSignedPercent(tenYearReturn)})`,
      reveal: getTenYearRevealProgress(currentIndex),
      valueColor: getSignedToneColor(point.tenYearPnl ?? 0),
      detail: `Value ${formatCurrencyFull(point.tenYearValue)}`,
      x: xForTime(point.time, timeWindow),
      y: yForReturnPercent(tenYearReturn, returnAxisMax),
    });
  }

  return positionEndpointLabels(labels);
};

const positionEndpointLabels = (labels: EndpointLabel[]) => {
  const sortedLabels = [...labels].sort((a, b) => a.y - b.y);
  const minY = returnPlot.top + endpointLabel.height / 2 + 8;
  const maxY = returnPlotBottom - endpointLabel.height / 2 - 8;

  for (let index = 0; index < sortedLabels.length; index += 1) {
    const previous = sortedLabels[index - 1];
    const label = sortedLabels[index];

    if (!label) {
      continue;
    }

    label.y = clamp(label.y, minY, maxY);

    if (previous && label.y - previous.y < endpointLabel.gap) {
      label.y = previous.y + endpointLabel.gap;
    }
  }

  for (let index = sortedLabels.length - 2; index >= 0; index -= 1) {
    const next = sortedLabels[index + 1];
    const label = sortedLabels[index];

    if (!label || !next) {
      continue;
    }

    if (next.y > maxY) {
      next.y = maxY;
    }

    if (next.y - label.y < endpointLabel.gap) {
      label.y = next.y - endpointLabel.gap;
    }
  }

  return sortedLabels.map((label) => ({
    ...label,
    y: clamp(label.y, minY, maxY),
  }));
};

const getReturnAxisMax = (currentIndex: number) => dynamicReturnAxisMaxByIndex[currentIndex] ?? finalReturnAxisMax;
const getPriceAxisMax = (currentIndex: number) => dynamicPriceAxisMaxByIndex[currentIndex] ?? finalPriceAxisMax;

const getTenYearRevealProgress = (currentIndex: number) => {
  const progress = (currentIndex - qqqDcaData.tenYearStartIndex) / tenYearRevealIndexWindow;

  return easeOutCubic(clamp(progress, 0, 1));
};

const getTenYearStartAccentProgress = (currentIndex: number) => {
  const progress = (currentIndex - qqqDcaData.tenYearStartIndex) / tenYearStartAccentIndexWindow;

  return easeOutCubic(1 - clamp(progress, 0, 1));
};

const getMilestoneUnlockProgress = (profit: number, price: number) => {
  if (profit < price) {
    return 0;
  }

  return easeOutCubic(clamp((profit - price) / Math.max(1, price * 0.28), 0, 1));
};

const buildReturnTicks = (returnAxisMax: number) => {
  const step = (returnAxisMax - minimumReturnAxisMin) / 5;

  return Array.from({ length: 6 }, (_, index) => Math.round(minimumReturnAxisMin + step * index));
};

const buildPriceTicks = (priceAxisMax: number) => {
  const step = priceAxisMax / 4;

  return Array.from({ length: 5 }, (_, index) => Math.round(step * index));
};

const buildYearTicks = (timeWindow: TimeWindow) => {
  const startYear = new Date(timeWindow.start).getUTCFullYear();
  const endYear = new Date(timeWindow.end).getUTCFullYear();
  const yearStep = (timeWindow.end - timeWindow.start) / oneYearMs > 8 ? 4 : 1;

  return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index).filter((year) => {
    if (yearStep > 1 && year % yearStep !== 2) {
      return false;
    }

    const tickTime = Date.UTC(year, 0, 1);

    return tickTime >= timeWindow.start - oneYearMs / 2 && tickTime <= timeWindow.end;
  });
};

const buildTimeWindow = (): TimeWindow => ({ end: endTime, start: startTime });

const xForTime = (time: number, timeWindow: TimeWindow) => {
  const progress = (time - timeWindow.start) / Math.max(1, timeWindow.end - timeWindow.start);

  return sharedPlot.left + clamp(progress, 0, 1) * sharedPlot.width;
};

const yForReturnPercent = (value: number, returnAxisMax: number) => {
  const progress = (value - minimumReturnAxisMin) / Math.max(1, returnAxisMax - minimumReturnAxisMin);

  return returnPlot.top + (1 - clamp(progress, 0, 1)) * returnPlot.height;
};

const yForQqqPrice = (value: number, priceAxisMax: number) => {
  const progress = value / priceAxisMax;

  return pricePlot.top + (1 - clamp(progress, 0, 1)) * pricePlot.height;
};

const xForEndpointLabel = (x: number) => {
  const leftSideX = x - endpointLabel.width - 24;

  if (leftSideX >= 12) {
    return leftSideX;
  }

  return clamp(x + 16, 12, chart.width - endpointLabel.width - 12);
};

const parseDateToUtcTime = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);

  return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1);
};

const formatAxisPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString('en-US')}%`;

const formatCurrencyFull = (value: number) => {
  if (value >= 1000) {
    return `$${Math.round(value).toLocaleString('en-US')}`;
  }

  if (Number.isInteger(value)) {
    return `$${value.toLocaleString('en-US')}`;
  }

  return `$${value.toFixed(2)}`;
};

const formatSignedCurrencyFull = (value: number) => {
  const roundedValue = Math.round(value);

  if (roundedValue === 0) {
    return '$0';
  }

  const sign = roundedValue >= 0 ? '+' : '-';
  const absoluteValue = Math.abs(roundedValue);

  return `${sign}$${absoluteValue.toLocaleString('en-US')}`;
};

const formatSignedPercent = (value: number) => {
  const sign = value >= 0 ? '+' : '-';
  const absoluteValue = Math.abs(value);

  return `${sign}${absoluteValue.toFixed(1)}%`;
};

const getSignedToneColor = (value: number) => {
  if (value > 0) {
    return signColors.positive;
  }

  if (value < 0) {
    return signColors.negative;
  }

  return signColors.zero;
};

const formatCurrencyWhole = (value: number) => {
  if (value === 0) {
    return '$0';
  }

  return `$${Math.round(value).toLocaleString('en-US')}`;
};

const formatDisplayDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const twoDigitMonth = String(month ?? 1).padStart(2, '0');
  const twoDigitDay = String(day ?? 1).padStart(2, '0');

  return `${year}.${twoDigitMonth}.${twoDigitDay}`;
};

const colorWithOpacity = (hexColor: string, opacity: number) => {
  const red = Number.parseInt(hexColor.slice(1, 3), 16);
  const green = Number.parseInt(hexColor.slice(3, 5), 16);
  const blue = Number.parseInt(hexColor.slice(5, 7), 16);

  return `rgba(${red},${green},${blue},${opacity})`;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const easeOutCubic = (value: number) => {
  const clamped = clamp(value, 0, 1);

  return 1 - Math.pow(1 - clamped, 3);
};

const estimateIntroTitleWidth = (title: string, fontSize: number) =>
  Math.max(...title.split('\n').map((line) => estimateIntroTitleLineWidth(line, fontSize)));

const estimateIntroTitleLineWidth = (line: string, fontSize: number) =>
  [...line].reduce((width, character) => {
    if (character === ' ') {
      return width + fontSize * 0.32;
    }

    if (/[\u3131-\uD79D]/.test(character)) {
      return width + fontSize * 0.9;
    }

    if (/[0-9]/.test(character)) {
      return width + fontSize * 0.58;
    }

    if (/[?.,:;!$]/.test(character)) {
      return width + fontSize * 0.42;
    }

    return width + fontSize * 0.62;
  }, 0);

const estimateIntroTitleHeight = (title: string, fontSize: number) => title.split('\n').length * fontSize * 0.96;

const estimateIntroTagWidth = (nameTag: string) => nameTag.length * 16 + 42;

const styles = {
  qqqIntroStage: {
    color: '#151618',
    fontFamily: fontStack,
    overflow: 'hidden',
    zIndex: 30,
  },
  qqqIntroBackdrop: {
    backgroundColor: '#F6F8FB',
    backgroundImage: 'linear-gradient(180deg, #F6F8FB 0%, rgba(241,243,247,0.92) 58%, #F6F8FB 100%)',
    inset: 0,
    position: 'absolute',
  },
  qqqIntroGrid: {
    backgroundImage:
      'linear-gradient(90deg, rgba(21,22,24,0.045) 1px, transparent 1px), linear-gradient(180deg, rgba(21,22,24,0.035) 1px, transparent 1px)',
    backgroundSize: '92px 92px',
    inset: 0,
    opacity: 0.2,
    position: 'absolute',
  },
  qqqIntroGlow: {
    background:
      'radial-gradient(ellipse at 50% 47%, rgba(35,91,219,0.08) 0%, rgba(8,127,91,0.05) 34%, rgba(246,248,251,0) 78%)',
    inset: 0,
    position: 'absolute',
  },
  qqqHeader: {
    left: qqqIntroHeader.left,
    position: 'absolute',
    top: qqqIntroHeader.top,
    width: 920,
    zIndex: 5,
  },
  qqqHeaderTitle: {
    color: '#151618',
    fontSize: qqqIntroTitleFontSize,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 0.96,
    whiteSpace: 'pre-line',
  },
  qqqHeaderSubtitle: {
    color: 'rgba(21,22,24,0.62)',
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: 0,
    lineHeight: 1,
    marginTop: 12,
    whiteSpace: 'nowrap',
  },
  qqqDateReadout: {
    position: 'absolute',
    right: frameInset.right,
    textAlign: 'right',
    top: frameLayout.dateReadoutTop + 4,
    width: 420,
    zIndex: 6,
  },
  qqqDateLabel: {
    color: theme.muted,
    fontSize: 22,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
  },
  qqqCurrentDate: {
    color: theme.ink,
    fontSize: 56,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 0.96,
    marginTop: 8,
  },
  principalReadout: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    left: frameInset.left,
    position: 'absolute',
    top: frameLayout.dateReadoutTop,
    width: 590,
    zIndex: 6,
  },
  principalRow: {
    alignItems: 'baseline',
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-start',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  principalLabel: {
    flex: '0 0 64px',
    fontSize: 36,
    fontWeight: 950,
    letterSpacing: 0,
  },
  principalAmount: {
    color: 'rgba(21,22,24,0.7)',
    flex: '0 0 auto',
    fontSize: 36,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 900,
    letterSpacing: 0,
  },
  principalArrow: {
    alignSelf: 'center',
    color: 'rgba(21,22,24,0.42)',
    flex: '0 0 auto',
    height: 30,
    margin: '0 2px',
    width: 54,
  },
  principalTotal: {
    color: '#151618',
    flex: '0 0 auto',
    fontSize: 40,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    letterSpacing: 0,
  },
  buyableStrip: {
    background: 'rgba(255,255,255,0.82)',
    border: '1px solid rgba(21,22,24,0.08)',
    boxShadow: '0 12px 24px rgba(21,22,24,0.07)',
    boxSizing: 'border-box',
    height: 150,
    left: 32,
    padding: '10px 12px 11px',
    position: 'absolute',
    right: 32,
    top: 18,
    zIndex: 11,
  },
  buyableHeader: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  buyableTitleGroup: {
    alignItems: 'baseline',
    display: 'flex',
    gap: 12,
    minWidth: 0,
  },
  buyableTitle: {
    color: '#151618',
    fontSize: 20,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
  },
  buyableProfit: {
    color: colorWithOpacity(colors.twentyYear, 0.86),
    fontSize: 19,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
  },
  buyableUnlocked: {
    color: 'rgba(21,22,24,0.58)',
    fontSize: 17,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1,
  },
  buyableGrid: {
    display: 'grid',
    gap: 10,
    gridTemplateColumns: 'repeat(6, 1fr)',
  },
  buyableCard: {
    alignItems: 'center',
    background: 'rgba(255,255,255,0.94)',
    border: '2px solid',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    height: 106,
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'hidden',
    padding: 0,
    position: 'relative',
    transformOrigin: '50% 100%',
  },
  buyableImage: {
    display: 'block',
    height: '100%',
    objectFit: 'cover',
    transform: 'scale(1.06)',
    width: '100%',
  },
  buyablePriceBadge: {
    borderRadius: 3,
    bottom: 6,
    boxShadow: '0 7px 16px rgba(21,22,24,0.18)',
    color: '#FFFFFF',
    fontSize: 18,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    left: 7,
    letterSpacing: 0,
    lineHeight: 1,
    padding: '6px 8px',
    position: 'absolute',
    right: 7,
    textAlign: 'center',
  },
  qqqIntroTemplate: {
    left: 100,
    position: 'absolute',
    top: 320 + SHORTS_PLATFORM_TOP_CLEARANCE,
    width: 880,
    zIndex: 2,
  },
  qqqIntroYear: {
    color: 'rgba(21,22,24,0.42)',
    fontSize: 62,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
    marginBottom: 16,
  },
  qqqIntroChartGhost: {
    display: 'block',
    filter: 'drop-shadow(0 18px 34px rgba(21,22,24,0.12))',
    opacity: 0.84,
  },
  qqqIntroTitleGroup: {
    left: qqqIntroHeader.left,
    position: 'absolute',
    top: qqqIntroHeader.top,
    transformOrigin: '0 0',
    zIndex: 5,
  },
  qqqIntroTitle: {
    color: '#151618',
    fontSize: qqqIntroTitleFontSize,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 0.96,
    whiteSpace: 'pre-line',
  },
  qqqIntroSubtitle: {
    color: 'rgba(21,22,24,0.62)',
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: 0,
    lineHeight: 1,
    marginTop: 12,
    whiteSpace: 'nowrap',
  },
  qqqIntroNameTag: {
    background: 'rgba(255,255,255,0.74)',
    border: '1px solid rgba(21,22,24,0.14)',
    borderRadius: 999,
    boxShadow: '0 14px 34px rgba(21,22,24,0.1)',
    color: 'rgba(21,22,24,0.66)',
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1,
    padding: '8px 13px',
    position: 'absolute',
    transformOrigin: '0 0',
    zIndex: 4,
  },
  qqqIntroDetails: {
    color: 'rgba(21,22,24,0.66)',
    fontSize: 23,
    fontWeight: 800,
    left: qqqIntroHeader.left,
    letterSpacing: 0,
    lineHeight: 1.22,
    position: 'absolute',
    right: qqqIntroHeader.right,
    top: qqqIntroHeader.top + 116,
    zIndex: 4,
  },
  chartLayer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  echartsCanvas: {
    height: chart.height,
    inset: 0,
    position: 'absolute',
    width: chart.width,
  },
  endpointLayer: {
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 6,
  },
  endpointLabel: {
    alignItems: 'flex-start',
    background: 'rgba(255,255,255,0.94)',
    border: '2px solid',
    boxShadow: '0 12px 26px rgba(21,22,24,0.1)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    height: endpointLabel.height,
    justifyContent: 'center',
    padding: '7px 18px',
    position: 'absolute',
    transformOrigin: '0 50%',
    width: endpointLabel.width,
  },
  endpointName: {
    fontSize: 19,
    fontWeight: 950,
    lineHeight: 1,
  },
  endpointValue: {
    alignItems: 'center',
    display: 'flex',
    fontSize: 26,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    gap: 8,
    lineHeight: 1,
    marginTop: 8,
    whiteSpace: 'nowrap',
  },
  endpointDetail: {
    color: 'rgba(21,22,24,0.58)',
    fontSize: 17,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 900,
    lineHeight: 1,
    marginTop: 7,
  },
  legend: {
    alignItems: 'center',
    display: 'flex',
    gap: 18,
    left: 32,
    position: 'absolute',
    top: 186,
    zIndex: 8,
  },
  legendItem: {
    alignItems: 'center',
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid rgba(21,22,24,0.08)',
    boxShadow: '0 8px 18px rgba(21,22,24,0.08)',
    color: 'rgba(21,22,24,0.72)',
    display: 'flex',
    fontSize: 24,
    fontWeight: 950,
    gap: 10,
    height: 46,
    padding: '0 14px',
  },
  legendSwatch: {
    height: 14,
    width: 30,
  },
  footer: {
    alignItems: 'flex-end',
    display: 'flex',
    gap: 22,
    justifyContent: 'space-between',
    left: frameInset.left,
    position: 'absolute',
    right: frameInset.right,
    top: frameLayout.chart.top + frameLayout.chart.height + 18,
    zIndex: 8,
  },
  footerChannel: {
    background: '#151618',
    color: '#FFFFFF',
    flex: '0 0 auto',
    fontSize: 23,
    fontWeight: 950,
    lineHeight: 1,
    padding: '13px 16px',
  },
  footerSource: {
    color: 'rgba(21,22,24,0.58)',
    flex: '1 1 auto',
    fontSize: 21,
    fontWeight: 800,
    lineHeight: 1.24,
    textAlign: 'right',
  },
} satisfies Record<string, CSSProperties>;
