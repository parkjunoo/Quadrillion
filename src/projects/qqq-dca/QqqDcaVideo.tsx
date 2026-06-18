import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  createPriceNewsFrameGeometry,
  PriceNewsChartShell,
  PriceNewsDateReadout,
  PriceNewsHeader,
  PriceNewsVideoFrame,
} from '../../shared/priceNewsVideoFrame';
import { SHORTS_INTRO_SECONDS, ShortsIntro, type ShortsAnimationCopy } from '../../shared/shortsAnimations';
import { SHORTS_PLATFORM_TOP_CLEARANCE } from '../../shared/video';
import { qqqDcaVideoConfig } from './config';
import { qqqDcaData, type QqqDcaPoint } from './qqqDcaData';

type EChartsGraphicElement = Record<string, unknown>;

type EndpointLabel = {
  color: string;
  id: string;
  label: string;
  value: string;
  x: number;
  y: number;
};

type TimeWindow = {
  end: number;
  start: number;
};

type AverageCostLabel = {
  color: string;
  id: string;
  labelY: number;
  lineY: number;
  text: string;
};

const fontStack =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const channelName = 'WHOA-DATA';
const frameInset = {
  left: 76,
  right: 76,
};
const frameLayout = createPriceNewsFrameGeometry({
  chartHeight: 900,
  chartTop: 472 + SHORTS_PLATFORM_TOP_CLEARANCE,
  dateReadoutTop: 330 + SHORTS_PLATFORM_TOP_CLEARANCE,
  frameInset,
  headerTop: 112 + SHORTS_PLATFORM_TOP_CLEARANCE,
  newsFeedBottom: 188,
});
const chart = {
  height: frameLayout.chart.height,
  plotHeight: 680,
  plotLeft: 132,
  plotTop: 88,
  plotWidth: frameLayout.chart.width - 286,
  width: frameLayout.chart.width,
};
const plotRight = chart.plotLeft + chart.plotWidth;
const plotBottom = chart.plotTop + chart.plotHeight;
const rightAxisLabelX = chart.width - 18;
const endpointLabel = {
  gap: 66,
  height: 58,
  width: 178,
};
const summary = {
  gap: 16,
  left: frameInset.left,
  top: frameLayout.chart.top + frameLayout.chart.height + 34,
  width: frameLayout.chart.width,
};
const summaryCardWidth = (summary.width - summary.gap * 2) / 3;
const finalOverviewSeconds = 3;
const theme = {
  background: '#F6F8FB',
  border: 'rgba(21,22,24,0.1)',
  chartBackground: '#FFFFFF',
  ink: '#151618',
  muted: 'rgba(21,22,24,0.62)',
  panel: '#FFFFFF',
} as const;
const colors = {
  price: '#235BDB',
  tenYear: '#C58A19',
  twentyYear: '#087F5B',
} as const;
const startTime = qqqDcaData.points[0]?.time ?? 0;
const endTime = qqqDcaData.finalPoint.time;
const oneYearMs = 365.25 * 24 * 60 * 60 * 1000;
const fiveYearWindowMs = oneYearMs * 5;
const horizontalAnchorRatio = 2 / 3;
const verticalAnchorRatio = 2 / 3;
const minimumAmountAxisMax = 1000;
const minimumPriceAxisMax = 200;
const dynamicAmountAxisMaxByIndex = qqqDcaData.points.reduce<number[]>((axisMaxValues, point) => {
  const previousAxisMax = axisMaxValues[axisMaxValues.length - 1] ?? minimumAmountAxisMax;
  const currentMax = Math.max(point.tenYearValue ?? 0, point.twentyYearValue);
  const targetAxisMax = Math.max(previousAxisMax, currentMax / verticalAnchorRatio);

  axisMaxValues.push(targetAxisMax);

  return axisMaxValues;
}, []);
const finalAmountAxisMax = dynamicAmountAxisMaxByIndex[dynamicAmountAxisMaxByIndex.length - 1] ?? minimumAmountAxisMax;
const dynamicPriceAxisMaxByIndex = qqqDcaData.points.reduce<number[]>((axisMaxValues, point) => {
  const previousAxisMax = axisMaxValues[axisMaxValues.length - 1] ?? minimumPriceAxisMax;
  const currentMax = Math.max(point.close, point.tenYearAverageCost ?? 0, point.twentyYearAverageCost);
  const targetAxisMax = Math.max(previousAxisMax, currentMax / verticalAnchorRatio);

  axisMaxValues.push(targetAxisMax);

  return axisMaxValues;
}, []);
const finalPriceAxisMax = dynamicPriceAxisMaxByIndex[dynamicPriceAxisMaxByIndex.length - 1] ?? minimumPriceAxisMax;
const introCopy: ShortsAnimationCopy = {
  accentColor: colors.price,
  channelHandle: channelName,
  kicker: 'QQQ DCA',
  meta: '2006-2026 · every trading day',
  secondaryColor: colors.twentyYear,
  subtitle: '$10 buys compared across 20Y and 10Y windows',
  title: '$10 Every Trading Day',
};

export const QqqDcaVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const introFrames = Math.round(SHORTS_INTRO_SECONDS * fps);
  const finalOverviewFrames = Math.round(finalOverviewSeconds * fps);
  const chartFrame = Math.max(0, frame - introFrames);
  const motionFrames = Math.max(1, durationInFrames - introFrames - finalOverviewFrames);
  const showFullRange = chartFrame >= motionFrames;
  const timelineProgress = interpolate(chartFrame, [0, motionFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const currentIndex = Math.round(timelineProgress * (qqqDcaData.points.length - 1));
  const point = qqqDcaData.points[currentIndex] ?? qqqDcaData.finalPoint;
  const intro = spring({
    frame: chartFrame,
    fps,
    config: {
      damping: 24,
      mass: 0.8,
      stiffness: 118,
    },
  });

  return (
    <PriceNewsVideoFrame theme={theme}>
      <PriceNewsHeader
        badge="QQQ DCA"
        geometry={frameLayout}
        intro={intro}
        subtitle={qqqDcaVideoConfig.subtitle}
        theme={theme}
        title={qqqDcaVideoConfig.title}
      />
      <PriceNewsDateReadout geometry={frameLayout} label="CURRENT DAY" theme={theme}>
        {formatDisplayDate(point.date)}
      </PriceNewsDateReadout>
      <PriceNewsChartShell geometry={frameLayout} theme={theme}>
        <DcaLineChart currentIndex={currentIndex} intro={intro} showFullRange={showFullRange} />
        <ChartLegend intro={intro} />
      </PriceNewsChartShell>
      <SummaryCards intro={intro} point={point} />
      <Footer />
      <ShortsIntro copy={introCopy} fps={fps} frame={frame} />
    </PriceNewsVideoFrame>
  );
};

const DcaLineChart = ({
  currentIndex,
  intro,
  showFullRange,
}: {
  currentIndex: number;
  intro: number;
  showFullRange: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const option = useMemo(() => buildEChartsOption(currentIndex, showFullRange), [currentIndex, showFullRange]);
  const labels = useMemo(() => buildEndpointLabels(currentIndex, showFullRange), [currentIndex, showFullRange]);

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
    <div style={{ ...styles.chartLayer, opacity: intro }}>
      <div ref={containerRef} style={styles.echartsCanvas} />
      <EndpointLabels labels={labels} />
    </div>
  );
};

const ChartLegend = ({ intro }: { intro: number }) => (
  <div style={{ ...styles.legend, opacity: intro }}>
    <LegendItem color={colors.price} label="QQQ price" />
    <LegendItem color={colors.twentyYear} label="$10/day for 20Y" />
    <LegendItem color={colors.tenYear} label="$10/day for 10Y" />
  </div>
);

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div style={styles.legendItem}>
    <div style={{ ...styles.legendSwatch, backgroundColor: color }} />
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
          top: label.y - endpointLabel.height / 2,
        }}
      >
        <div style={{ ...styles.endpointName, color: label.color }}>{label.label}</div>
        <div style={styles.endpointValue}>{label.value}</div>
      </div>
    ))}
  </div>
);

const SummaryCards = ({ intro, point }: { intro: number; point: QqqDcaPoint }) => {
  const tenYearInvested = point.tenYearInvested ?? 0;
  const tenYearValue = point.tenYearValue ?? 0;

  return (
    <div style={{ ...styles.summaryGrid, opacity: intro }}>
      <SummaryCard
        accent={colors.twentyYear}
        label="20-year DCA"
        meta={`Invested ${formatCurrencyFull(point.twentyYearInvested)} · ${formatMultiple(
          point.twentyYearValue,
          point.twentyYearInvested,
        )}\nAvg cost ${formatCurrencyFull(point.twentyYearAverageCost)}`}
        value={formatCurrencyFull(point.twentyYearValue)}
      />
      <SummaryCard
        accent={colors.tenYear}
        label="10-year DCA"
        meta={
          point.tenYearValue === null
            ? 'Starts Jun 17, 2016'
            : `Invested ${formatCurrencyFull(tenYearInvested)} · ${formatMultiple(
                tenYearValue,
                tenYearInvested,
              )}\nAvg cost ${formatCurrencyFull(point.tenYearAverageCost ?? 0)}`
        }
        value={point.tenYearValue === null ? '$0' : formatCurrencyFull(point.tenYearValue)}
      />
      <SummaryCard
        accent={colors.price}
        label="QQQ close"
        meta={`Price line uses close · Value uses adjClose`}
        value={formatCurrencyFull(point.close)}
      />
    </div>
  );
};

const SummaryCard = ({
  accent,
  label,
  meta,
  value,
}: {
  accent: string;
  label: string;
  meta: string;
  value: string;
}) => (
  <div style={{ ...styles.summaryCard, borderTopColor: accent }}>
    <div style={{ ...styles.summaryLabel, color: accent }}>{label}</div>
    <div style={styles.summaryValue}>{value}</div>
    <div style={styles.summaryMeta}>{meta}</div>
  </div>
);

const Footer = () => (
  <div style={styles.footer}>
    <div style={styles.footerChannel}>{channelName}</div>
    <div style={styles.footerSource}>{qqqDcaVideoConfig.source}</div>
  </div>
);

const buildEChartsOption = (currentIndex: number, showFullRange: boolean): EChartsOption => {
  const currentPoint = qqqDcaData.points[currentIndex] ?? qqqDcaData.finalPoint;
  const amountAxisMax = getAmountAxisMax(currentIndex);
  const priceAxisMax = getPriceAxisMax(currentIndex);
  const timeWindow = buildTimeWindow(currentPoint.time, showFullRange);
  const visiblePoints = qqqDcaData.points
    .slice(0, currentIndex + 1)
    .filter((point) => point.time >= timeWindow.start && point.time <= timeWindow.end);
  const twentyYearPoints = visiblePoints.map((point) => [
    xForTime(point.time, timeWindow),
    yForPortfolioValue(point.twentyYearValue, amountAxisMax),
  ]);
  const tenYearPoints = visiblePoints
    .filter((point) => point.tenYearValue !== null)
    .map((point) => [
      xForTime(point.time, timeWindow),
      yForPortfolioValue(point.tenYearValue ?? 0, amountAxisMax),
  ]);
  const pricePoints = visiblePoints.map((point) => [
    xForTime(point.time, timeWindow),
    yForQqqPrice(point.close, priceAxisMax),
  ]);
  const elements: EChartsGraphicElement[] = [
    ...buildGridElements(currentPoint, timeWindow, amountAxisMax, priceAxisMax),
    buildLineElement('line-price', pricePoints, colors.price, 4.2, 22),
    ...buildAverageCostElements(currentPoint, priceAxisMax),
    buildLineElement('line-twenty-year', twentyYearPoints, colors.twentyYear, 5.2, 28),
    buildLineElement('line-ten-year', tenYearPoints, colors.tenYear, 5.2, 30),
    ...buildMarkers(currentPoint, timeWindow, amountAxisMax, priceAxisMax),
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

const buildGridElements = (
  currentPoint: QqqDcaPoint,
  timeWindow: TimeWindow,
  amountAxisMax: number,
  priceAxisMax: number,
): EChartsGraphicElement[] => {
  const portfolioTicks = buildPortfolioTicks(amountAxisMax);
  const priceTicks = buildPriceTicks(priceAxisMax);
  const yearTicks = buildYearTicks(timeWindow);
  const currentX = xForTime(currentPoint.time, timeWindow);
  const tenYearStartTime = parseDateToUtcTime(qqqDcaVideoConfig.tenYearStartDate);
  const showTenYearMarker =
    currentPoint.date >= qqqDcaVideoConfig.tenYearStartDate &&
    tenYearStartTime >= timeWindow.start &&
    tenYearStartTime <= timeWindow.end;
  const tenYearX = xForTime(tenYearStartTime, timeWindow);

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
        fill: '#FBFCFE',
        stroke: 'rgba(21,22,24,0.08)',
        lineWidth: 1,
      },
    },
    ...portfolioTicks.map((tick) => {
      const y = yForPortfolioValue(tick, amountAxisMax);

      return {
        type: 'group',
        id: `portfolio-tick-${tick}`,
        silent: true,
        children: [
          {
            type: 'line',
            id: `portfolio-grid-${tick}`,
            shape: { x1: chart.plotLeft, x2: plotRight, y1: y, y2: y },
            style: {
              lineDash: tick === 0 ? undefined : [7, 10],
              lineWidth: tick === 0 ? 2 : 1.2,
              opacity: tick === 0 ? 0.42 : 0.2,
              stroke: 'rgba(21,22,24,0.35)',
            },
          },
          {
            type: 'text',
            id: `portfolio-label-${tick}`,
            x: chart.plotLeft - 16,
            y,
            style: {
              fill: 'rgba(21,22,24,0.56)',
              fontFamily: fontStack,
              fontSize: 20,
              fontWeight: 900,
              text: formatAxisCurrency(tick),
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
        type: 'text',
        id: `price-label-${tick}`,
        silent: true,
        x: rightAxisLabelX,
        y,
        style: {
          fill: colorWithOpacity(colors.price, 0.66),
          fontFamily: fontStack,
          fontSize: 19,
          fontWeight: 900,
          text: formatCurrencyWhole(tick),
          textAlign: 'right',
          textVerticalAlign: 'middle',
        },
      };
    }),
    ...yearTicks.map((year) => {
      const x = xForTime(Date.UTC(year, 0, 1), timeWindow);

      return {
        type: 'group',
        id: `year-tick-${year}`,
        silent: true,
        children: [
          {
            type: 'line',
            id: `year-grid-${year}`,
            shape: { x1: x, x2: x, y1: chart.plotTop, y2: plotBottom },
            style: {
              lineWidth: 1,
              opacity: 0.14,
              stroke: 'rgba(21,22,24,0.32)',
            },
          },
          {
            type: 'text',
            id: `year-label-${year}`,
            x,
            y: plotBottom + 40,
            style: {
              fill: 'rgba(21,22,24,0.54)',
              fontFamily: fontStack,
              fontSize: 22,
              fontWeight: 900,
              text: String(year),
              textAlign: 'center',
              textVerticalAlign: 'middle',
            },
          },
        ],
      };
    }),
    ...(showTenYearMarker
      ? [
          {
            type: 'line',
            id: 'ten-year-start-line',
            silent: true,
            shape: { x1: tenYearX, x2: tenYearX, y1: chart.plotTop, y2: plotBottom },
            style: {
              lineDash: [9, 9],
              lineWidth: 2.2,
              opacity: 0.46,
              stroke: colors.tenYear,
            },
            z: 12,
          },
          {
            type: 'text',
            id: 'ten-year-start-label',
            silent: true,
            x: tenYearX + 12,
            y: chart.plotTop + 24,
            style: {
              fill: colors.tenYear,
              fontFamily: fontStack,
              fontSize: 22,
              fontWeight: 950,
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
      shape: { x1: currentX, x2: currentX, y1: chart.plotTop, y2: plotBottom },
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
      x: clamp(currentX, chart.plotLeft + 80, plotRight - 82),
      y: plotBottom + 76,
      style: {
        fill: '#151618',
        fontFamily: fontStack,
        fontSize: 24,
        fontWeight: 950,
        text: formatDisplayDate(currentPoint.date),
        textAlign: 'center',
        textVerticalAlign: 'middle',
      },
      z: 16,
    },
    {
      type: 'text',
      id: 'left-axis-title',
      silent: true,
      x: chart.plotLeft,
      y: chart.plotTop - 28,
      style: {
        fill: 'rgba(21,22,24,0.62)',
        fontFamily: fontStack,
        fontSize: 20,
        fontWeight: 950,
        text: 'PORTFOLIO VALUE',
        textAlign: 'left',
      },
    },
    {
      type: 'text',
      id: 'right-axis-title',
      silent: true,
      x: rightAxisLabelX,
      y: chart.plotTop - 28,
      style: {
        fill: colorWithOpacity(colors.price, 0.78),
        fontFamily: fontStack,
        fontSize: 20,
        fontWeight: 950,
        text: 'QQQ PRICE',
        textAlign: 'right',
      },
    },
  ];
};

const buildLineElement = (
  id: string,
  points: number[][],
  color: string,
  lineWidth: number,
  z: number,
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
    opacity: points.length > 1 ? 1 : 0,
    stroke: color,
  },
  z,
});

const buildAverageCostElements = (point: QqqDcaPoint, priceAxisMax: number): EChartsGraphicElement[] => {
  const twentyYearAverageCostY = yForQqqPrice(point.twentyYearAverageCost, priceAxisMax);
  const tenYearAverageCostY =
    point.tenYearAverageCost === null ? null : yForQqqPrice(point.tenYearAverageCost, priceAxisMax);
  const labels = positionAverageCostLabels([
    {
      color: colors.twentyYear,
      id: 'avg-cost-twenty-year',
      labelY: twentyYearAverageCostY,
      lineY: twentyYearAverageCostY,
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
            text: `10Y AVG ${formatCurrencyFull(point.tenYearAverageCost)}`,
          },
        ]),
  ]);

  return labels.flatMap((label) => [
    {
      type: 'line',
      id: `${label.id}-line`,
      silent: true,
      shape: { x1: chart.plotLeft, x2: rightAxisLabelX, y1: label.lineY, y2: label.lineY },
      style: {
        lineDash: [8, 8],
        lineWidth: 2.4,
        opacity: 0.72,
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
        fontSize: 17,
        fontWeight: 950,
        padding: [5, 7],
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
  const minY = chart.plotTop + 20;
  const maxY = plotBottom - 20;
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
  amountAxisMax: number,
  priceAxisMax: number,
): EChartsGraphicElement[] => {
  const markers: EChartsGraphicElement[] = [
    buildMarker(
      'marker-price',
      xForTime(point.time, timeWindow),
      yForQqqPrice(point.close, priceAxisMax),
      colors.price,
      36,
    ),
    buildMarker(
      'marker-twenty-year',
      xForTime(point.time, timeWindow),
      yForPortfolioValue(point.twentyYearValue, amountAxisMax),
      colors.twentyYear,
      38,
    ),
  ];

  if (point.tenYearValue !== null) {
    markers.push(
      buildMarker(
        'marker-ten-year',
        xForTime(point.time, timeWindow),
        yForPortfolioValue(point.tenYearValue, amountAxisMax),
        colors.tenYear,
        40,
      ),
    );
  }

  return markers;
};

const buildMarker = (id: string, cx: number, cy: number, color: string, z: number): EChartsGraphicElement => ({
  type: 'circle',
  id,
  silent: true,
  shape: { cx, cy, r: 8 },
  style: {
    fill: '#FFFFFF',
    lineWidth: 4,
    shadowBlur: 12,
    shadowColor: colorWithOpacity(color, 0.28),
    stroke: color,
  },
  z,
});

const buildEndpointLabels = (currentIndex: number, showFullRange: boolean): EndpointLabel[] => {
  const point = qqqDcaData.points[currentIndex] ?? qqqDcaData.finalPoint;
  const amountAxisMax = getAmountAxisMax(currentIndex);
  const priceAxisMax = getPriceAxisMax(currentIndex);
  const timeWindow = buildTimeWindow(point.time, showFullRange);
  const labels: EndpointLabel[] = [
    {
      color: colors.price,
      id: 'price',
      label: 'QQQ',
      value: formatCurrencyFull(point.close),
      x: xForTime(point.time, timeWindow),
      y: yForQqqPrice(point.close, priceAxisMax),
    },
    {
      color: colors.twentyYear,
      id: 'twenty-year',
      label: '20Y',
      value: formatCurrencyFull(point.twentyYearValue),
      x: xForTime(point.time, timeWindow),
      y: yForPortfolioValue(point.twentyYearValue, amountAxisMax),
    },
  ];

  if (point.tenYearValue !== null) {
    labels.push({
      color: colors.tenYear,
      id: 'ten-year',
      label: '10Y',
      value: formatCurrencyFull(point.tenYearValue),
      x: xForTime(point.time, timeWindow),
      y: yForPortfolioValue(point.tenYearValue, amountAxisMax),
    });
  }

  return positionEndpointLabels(labels);
};

const positionEndpointLabels = (labels: EndpointLabel[]) => {
  const sortedLabels = [...labels].sort((a, b) => a.y - b.y);
  const minY = chart.plotTop + endpointLabel.height / 2 + 8;
  const maxY = plotBottom - endpointLabel.height / 2 - 8;

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

const getAmountAxisMax = (currentIndex: number) => dynamicAmountAxisMaxByIndex[currentIndex] ?? finalAmountAxisMax;
const getPriceAxisMax = (currentIndex: number) => dynamicPriceAxisMaxByIndex[currentIndex] ?? finalPriceAxisMax;

const buildPortfolioTicks = (amountAxisMax: number) => {
  const step = amountAxisMax / 5;

  return Array.from({ length: 6 }, (_, index) => Math.round(step * index));
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

const buildTimeWindow = (currentTime: number, showFullRange: boolean): TimeWindow => {
  if (showFullRange) {
    return { end: endTime, start: startTime };
  }

  const anchorOffset = fiveYearWindowMs * horizontalAnchorRatio;
  const start = Math.max(startTime, currentTime - anchorOffset);
  const end = start + fiveYearWindowMs;

  return { end, start };
};

const xForTime = (time: number, timeWindow: TimeWindow) => {
  const progress = (time - timeWindow.start) / Math.max(1, timeWindow.end - timeWindow.start);

  return chart.plotLeft + clamp(progress, 0, 1) * chart.plotWidth;
};

const yForPortfolioValue = (value: number, amountAxisMax: number) => {
  const progress = value / amountAxisMax;

  return chart.plotTop + (1 - clamp(progress, 0, 1)) * chart.plotHeight;
};

const yForQqqPrice = (value: number, amountAxisMax: number) => {
  const progress = value / amountAxisMax;

  return chart.plotTop + (1 - clamp(progress, 0, 1)) * chart.plotHeight;
};

const xForEndpointLabel = (x: number) => {
  const rightSideX = x + 16;

  if (rightSideX + endpointLabel.width <= chart.width - 12) {
    return rightSideX;
  }

  return clamp(x - endpointLabel.width - 16, 12, chart.width - endpointLabel.width - 12);
};

const parseDateToUtcTime = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);

  return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1);
};

const formatAxisCurrency = (value: number) => {
  return formatCurrencyWhole(value);
};

const formatCurrencyFull = (value: number) => {
  if (value >= 1000) {
    return `$${Math.round(value).toLocaleString('en-US')}`;
  }

  if (Number.isInteger(value)) {
    return `$${value.toLocaleString('en-US')}`;
  }

  return `$${value.toFixed(2)}`;
};

const formatCurrencyWhole = (value: number) => {
  if (value === 0) {
    return '$0';
  }

  return `$${Math.round(value).toLocaleString('en-US')}`;
};

const formatDisplayDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const displayDate = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));

  return displayDate.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  });
};

const formatMultiple = (value: number, invested: number) => {
  if (invested <= 0) {
    return '0.00x';
  }

  return `${(value / invested).toFixed(2)}x`;
};

const colorWithOpacity = (hexColor: string, opacity: number) => {
  const red = Number.parseInt(hexColor.slice(1, 3), 16);
  const green = Number.parseInt(hexColor.slice(3, 5), 16);
  const blue = Number.parseInt(hexColor.slice(5, 7), 16);

  return `rgba(${red},${green},${blue},${opacity})`;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const styles = {
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
    alignItems: 'center',
    background: 'rgba(255,255,255,0.94)',
    border: '2px solid',
    boxShadow: '0 12px 26px rgba(21,22,24,0.1)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    height: endpointLabel.height,
    justifyContent: 'center',
    padding: '7px 10px',
    position: 'absolute',
    width: endpointLabel.width,
  },
  endpointName: {
    fontSize: 16,
    fontWeight: 950,
    lineHeight: 1,
  },
  endpointValue: {
    color: '#151618',
    fontSize: 22,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    lineHeight: 1,
    marginTop: 6,
  },
  legend: {
    alignItems: 'center',
    display: 'flex',
    gap: 16,
    left: 32,
    position: 'absolute',
    top: 18,
    zIndex: 8,
  },
  legendItem: {
    alignItems: 'center',
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid rgba(21,22,24,0.08)',
    boxShadow: '0 8px 18px rgba(21,22,24,0.08)',
    color: 'rgba(21,22,24,0.72)',
    display: 'flex',
    fontSize: 20,
    fontWeight: 950,
    gap: 8,
    height: 38,
    padding: '0 12px',
  },
  legendSwatch: {
    height: 12,
    width: 24,
  },
  summaryGrid: {
    display: 'grid',
    gap: summary.gap,
    gridTemplateColumns: `${summaryCardWidth}px ${summaryCardWidth}px ${summaryCardWidth}px`,
    left: summary.left,
    position: 'absolute',
    top: summary.top,
    width: summary.width,
    zIndex: 8,
  },
  summaryCard: {
    background: 'rgba(255,255,255,0.96)',
    borderTop: '8px solid',
    boxShadow: '0 20px 46px rgba(21,22,24,0.13)',
    boxSizing: 'border-box',
    height: 196,
    padding: '21px 20px 22px',
  },
  summaryLabel: {
    fontSize: 21,
    fontWeight: 950,
    lineHeight: 1,
  },
  summaryValue: {
    color: '#151618',
    fontSize: 39,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
    marginTop: 18,
    whiteSpace: 'nowrap',
  },
  summaryMeta: {
    color: 'rgba(21,22,24,0.62)',
    fontSize: 20,
    fontWeight: 850,
    lineHeight: 1.18,
    marginTop: 16,
    whiteSpace: 'pre-line',
  },
  footer: {
    alignItems: 'flex-end',
    bottom: 88,
    display: 'flex',
    gap: 22,
    justifyContent: 'space-between',
    left: frameInset.left,
    position: 'absolute',
    right: frameInset.right,
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
