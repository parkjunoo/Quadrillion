import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  createDefaultDataShortsFrameGeometry,
  dataVideoFontStack,
} from '../../shared/dataVideoFrame';
import {
  buildMobileGameRaceData,
  getMobileGameFrameState,
  type MobileGameFrameState,
  type MobileGameRaceRow,
} from './mobileGameRankRace';
import { mobileGameTop10VideoConfig } from './config';

const raceData = buildMobileGameRaceData(mobileGameTop10VideoConfig.csv);
const fontStack = dataVideoFontStack;
const channelHandle = '@whoa-data';
const accentColor = '#F5E829';
const topN = mobileGameTop10VideoConfig.topN;
const frameLayout = createDefaultDataShortsFrameGeometry({
  chartHeight: 970,
  chartLeft: 76,
  chartWidth: 928,
});
const chart = frameLayout.chart;
const footerInset = frameLayout.footerInset ?? frameLayout.frameInset;
const yearRail = frameLayout.timelineRail;
const chartContentTop = 42;
const chartBottomPadding = 34;
const row = {
  height: 74,
};
const rowTravelHeight = chart.height - row.height - chartContentTop - chartBottomPadding;
const rowStep = rowTravelHeight / Math.max(1, topN - 1);
const rowGap = Math.max(0, rowStep - row.height);
const rankColumnWidth = 46;
const barLeft = 66;
const barMaxWidth = 620;
const valueLeft = 720;
const valueWidth = 178;
const barHeight = 66;
const minimumBarWidth = 18;
const barVisualScaleExponent = 0.56;
const badgeLeft = barLeft + 4;
const badgeSize = 70;
const rowTextLeft = barLeft + 96;

export const MobileGameTop10RaceVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(mobileGameTop10VideoConfig.startHoldSeconds * fps);
  const endHoldFrames = Math.round(mobileGameTop10VideoConfig.endHoldSeconds * fps);
  const raceDurationInFrames = Math.max(1, durationInFrames - startHoldFrames - endHoldFrames);
  const raceFrame = clamp(frame - startHoldFrames, 0, raceDurationInFrames - 1);
  const state = getMobileGameFrameState({
    data: raceData,
    durationInFrames: raceDurationInFrames,
    frame: raceFrame,
    topN,
  });
  const progress = (state.monthIndex - raceData.minMonthIndex) /
    Math.max(1, raceData.maxMonthIndex - raceData.minMonthIndex);

  return (
    <AbsoluteFill style={styles.stage}>
      <Background />
      <LeaderBackdrop state={state} />
      <Header />
      <YearRail currentYear={state.year} progress={progress} />
      <BarRaceChart state={state} />
      <Footer />
    </AbsoluteFill>
  );
};

const Header = () => (
  <div style={styles.header}>
    <div style={styles.title}>{mobileGameTop10VideoConfig.title}</div>
    <div style={styles.titleHook}>{mobileGameTop10VideoConfig.titleHook}</div>
  </div>
);

const YearRail = ({
  currentYear,
  progress,
}: {
  currentYear: number;
  progress: number;
}) => {
  const fillWidth = clamp(progress, 0, 1) * yearRail.width;

  return (
    <div style={styles.yearRailBlock}>
      <div style={styles.yearRailHeader}>
        <div style={styles.currentYear}>{currentYear}</div>
        <div style={styles.tournamentBadge}>
          <span style={styles.tournamentBadgeIcon}>$</span>
          <span style={styles.tournamentBadgeText}>Annual grossing Top 10</span>
        </div>
        <div style={styles.yearRailTag}>{channelHandle}</div>
      </div>
      <svg
        height={58}
        style={styles.yearRailSvg}
        viewBox={`0 0 ${yearRail.width} 58`}
        width={yearRail.width}
      >
        <line
          stroke="rgba(255,255,255,0.22)"
          strokeLinecap="round"
          strokeWidth={6}
          x1={0}
          x2={yearRail.width}
          y1={19}
          y2={19}
        />
        <line
          stroke={accentColor}
          strokeLinecap="round"
          strokeWidth={6}
          x1={0}
          x2={fillWidth}
          y1={19}
          y2={19}
        />
        <text fill="rgba(255,255,255,0.56)" fontFamily={fontStack} fontSize={24} fontWeight={850} x={0} y={51}>
          {raceData.minYear}
        </text>
        <text
          fill="rgba(255,255,255,0.56)"
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

const BarRaceChart = ({ state }: { state: MobileGameFrameState }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const option = useMemo(() => buildEChartsBarRaceOption(state), [state]);

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
    <div style={styles.chart}>
      <div ref={containerRef} style={styles.echartsCanvas} />
    </div>
  );
};

type EChartsGraphicElement = Record<string, unknown>;

const buildEChartsBarRaceOption = (state: MobileGameFrameState): EChartsOption => {
  const elements: EChartsGraphicElement[] = [
    ...buildEChartsGridElements(),
    ...state.rows.map((raceRow) => buildEChartsRowElement({
      barWidth: barWidthForValue(raceRow.value, state.maxValue),
      raceRow,
      top: chartRankToY(raceRow.animatedRank),
    })),
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

const buildEChartsGridElements = (): EChartsGraphicElement[] => {
  const tickValues = [2, 4, 6, 8, 10];
  const xAxisElements = tickValues.map((tickValue) => {
    const x = barLeft + Math.round(barWidthForValue(tickValue, 10));

    return [
      {
        id: `grid-v-${tickValue}`,
        shape: { x1: x, x2: x, y1: chartContentTop - 26, y2: chart.height - 8 },
        silent: true,
        style: {
          lineDash: [3, 9],
          lineWidth: 2,
          opacity: 0.38,
          stroke: 'rgba(255,255,255,0.22)',
        },
        type: 'line',
      },
      {
        id: `grid-v-label-${tickValue}`,
        silent: true,
        style: {
          fill: 'rgba(255,255,255,0.48)',
          fontFamily: fontStack,
          fontSize: 18,
          fontWeight: 900,
          text: `#${11 - tickValue}`,
          textAlign: 'center',
          textVerticalAlign: 'middle',
        },
        type: 'text',
        x,
        y: chartContentTop - 31,
      },
    ];
  }).flat();
  const horizontalLines = Array.from({ length: topN + 1 }, (_, index) => {
    const y = clamp(
      chartContentTop - rowGap / 2 + index * rowStep,
      0,
      chart.height,
    );

    return {
      id: `grid-h-${index}`,
      shape: { x1: barLeft, x2: barLeft + barMaxWidth, y1: y, y2: y },
      silent: true,
      style: {
        lineDash: [3, 12],
        lineWidth: 1,
        opacity: 0.12,
        stroke: 'rgba(255,255,255,0.16)',
      },
      type: 'line',
    };
  });

  return [...xAxisElements, ...horizontalLines];
};

const buildEChartsRowElement = ({
  barWidth,
  raceRow,
  top,
}: {
  barWidth: number;
  raceRow: MobileGameRaceRow;
  top: number;
}): EChartsGraphicElement => {
  const barColor = solidBarColorFor(raceRow);
  const rankColor = rankColorFor(raceRow.displayRank);
  const valueColor = valueColorFor(raceRow);
  const rowOpacity = raceRow.opacity;

  return {
    children: [
      {
        id: `rank-${raceRow.id}`,
        style: {
          fill: colorWithOpacity(rankColor, rowOpacity),
          fontFamily: fontStack,
          fontSize: 31,
          fontWeight: 950,
          shadowBlur: raceRow.displayRank <= 3 ? 8 : 0,
          shadowColor: raceRow.displayRank <= 3 ? 'rgba(0,0,0,0.52)' : 'transparent',
          text: String(raceRow.displayRank),
          textAlign: 'right',
          textVerticalAlign: 'middle',
        },
        type: 'text',
        x: rankColumnWidth,
        y: 37,
      },
      {
        id: `bar-${raceRow.id}`,
        shape: {
          height: barHeight,
          r: 6,
          width: barWidth,
          x: barLeft,
          y: 4,
        },
        style: {
          fill: barGradientFor(barColor),
          lineWidth: 1,
          opacity: rowOpacity,
          stroke: 'rgba(255,255,255,0.14)',
        },
        type: 'rect',
      },
      {
        id: `bar-sheen-${raceRow.id}`,
        shape: {
          height: barHeight,
          r: 6,
          width: barWidth,
          x: barLeft,
          y: 4,
        },
        style: {
          fill: 'rgba(255,255,255,0.14)',
          opacity: rowOpacity * 0.36,
        },
        type: 'rect',
      },
      {
        id: `badge-bg-${raceRow.id}`,
        shape: {
          height: badgeSize,
          r: 7,
          width: badgeSize,
          x: badgeLeft,
          y: 2,
        },
        style: {
          fill: colorWithOpacity(mixHexColors(barColor, '#000000', 0.28), 0.92 * rowOpacity),
          lineWidth: 2,
          opacity: rowOpacity,
          stroke: colorWithOpacity('#FFFFFF', 0.2 * rowOpacity),
        },
        type: 'rect',
      },
      {
        id: `badge-text-${raceRow.id}`,
        style: {
          fill: colorWithOpacity('#FFFFFF', rowOpacity),
          fontFamily: fontStack,
          fontSize: 24,
          fontWeight: 950,
          shadowBlur: 4,
          shadowColor: 'rgba(0,0,0,0.7)',
          text: initialsForName(raceRow.name),
          textAlign: 'center',
          textVerticalAlign: 'middle',
        },
        type: 'text',
        x: badgeLeft + badgeSize / 2,
        y: 37,
        z2: 8,
      },
      {
        id: `name-${raceRow.id}`,
        style: {
          fill: `rgba(255,255,255,${rowOpacity})`,
          fontFamily: fontStack,
          fontSize: fontSizeForName(raceRow.name),
          fontWeight: 950,
          shadowBlur: 0,
          shadowColor: 'rgba(0,0,0,0.65)',
          shadowOffsetY: 3,
          text: raceRow.name,
          textAlign: 'left',
          textVerticalAlign: 'middle',
        },
        type: 'text',
        x: rowTextLeft,
        y: 32,
        z2: 8,
      },
      {
        id: `meta-${raceRow.id}`,
        style: {
          fill: `rgba(255,255,255,${0.68 * rowOpacity})`,
          fontFamily: fontStack,
          fontSize: 21,
          fontWeight: 900,
          overflow: 'truncate',
          text: raceRow.publisher,
          textAlign: 'left',
          textVerticalAlign: 'middle',
          width: 360,
        },
        type: 'text',
        x: rowTextLeft,
        y: 60,
        z2: 8,
      },
      {
        id: `value-${raceRow.id}`,
        style: {
          fill: colorWithOpacity(valueColor, rowOpacity),
          fontFamily: fontStack,
          fontSize: 48,
          fontWeight: 950,
          shadowBlur: raceRow.displayRank === 1 ? 4 : 1,
          shadowColor: raceRow.displayRank === 1 ? 'rgba(250,204,21,0.22)' : 'rgba(0,0,0,0.2)',
          text: `#${raceRow.displayRank}`,
          textAlign: 'left',
          textVerticalAlign: 'middle',
        },
        type: 'text',
        x: valueLeft,
        y: 19,
      },
      {
        id: `value-label-${raceRow.id}`,
        style: {
          fill: `rgba(255,255,255,${0.68 * rowOpacity})`,
          fontFamily: fontStack,
          fontSize: 21,
          fontWeight: 900,
          text: 'Annual rank',
          textAlign: 'left',
          textVerticalAlign: 'middle',
        },
        type: 'text',
        x: valueLeft,
        y: 60,
      },
    ],
    id: `row-${raceRow.id}`,
    silent: true,
    type: 'group',
    x: 0,
    y: top,
    z: Math.round(1000 - raceRow.liveRank * 10),
  };
};

const LeaderBackdrop = ({ state }: { state: MobileGameFrameState }) => {
  const leader = state.rows.find((raceRow) => raceRow.displayRank === 1) ?? state.rows[0];
  const color = leader ? solidBarColorFor(leader) : '#67E8F9';
  const scale = 1.02 + state.transitionPulse * 0.03;

  return (
    <AbsoluteFill style={styles.leaderBackdrop}>
      {leader ? (
        <div
          style={{
            ...styles.leaderBackdropInitials,
            color: colorWithOpacity(color, 0.16),
            transform: `rotate(-8deg) scale(${1.02 + state.transitionPulse * 0.02})`,
          }}
        >
          {initialsForName(leader.name)}
        </div>
      ) : null}
      <div
        style={{
          ...styles.leaderColorWash,
          background: `radial-gradient(circle at 72% 38%, ${colorWithOpacity(color, 0.24)} 0%, ${colorWithOpacity(color, 0.1)} 34%, rgba(3,7,18,0) 66%)`,
        }}
      />
      <div style={{ ...styles.cupHalo, transform: `rotate(-12deg) scale(${scale})` }}>TOP</div>
      <div style={styles.leaderBackdropVeil} />
    </AbsoluteFill>
  );
};

const Background = () => (
  <AbsoluteFill style={styles.background}>
    <div style={styles.digitalGrid} />
    <div style={styles.scanlines} />
    <div style={styles.topShadow} />
    <div style={styles.chartGlow} />
  </AbsoluteFill>
);

const Footer = () => (
  <div style={styles.footer}>
    <div style={styles.source}>{mobileGameTop10VideoConfig.source}</div>
    <div style={styles.source}>Rank score = 11 - annual rank.</div>
  </div>
);

const chartRankToY = (rank: number) => {
  const normalizedRank = clamp(rank, 1, topN + 0.35);

  return chartContentTop +
    ((normalizedRank - 1) / Math.max(1, topN - 1)) * rowTravelHeight;
};

const barWidthForValue = (value: number, maxValue: number) => {
  if (value <= 0) {
    return 0;
  }

  const ratio = clamp(value / Math.max(1, maxValue), 0, 1);
  const visualRatio = Math.pow(ratio, barVisualScaleExponent);

  return minimumBarWidth + visualRatio * (barMaxWidth - minimumBarWidth);
};

const formatInitialCandidate = (value: string) =>
  value.replace(/[^A-Za-z0-9]/g, '').slice(0, 1).toUpperCase();

const initialsForName = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean);
  const first = formatInitialCandidate(parts[0] ?? '');
  const second = formatInitialCandidate(parts[1] ?? '');

  return `${first}${second || first}`.slice(0, 2);
};

const fontSizeForName = (name: string) => {
  if (name.length > 22) {
    return 25;
  }

  if (name.length > 17) {
    return 28;
  }

  return 32;
};

const valueColorFor = (raceRow: MobileGameRaceRow) => {
  if (raceRow.displayRank === 1) {
    return '#FACC15';
  }

  if (raceRow.displayRank === 2) {
    return '#C7F9CC';
  }

  if (raceRow.displayRank === 3) {
    return '#FB923C';
  }

  return '#FFFFFF';
};

const rankColorFor = (rank: number) => {
  if (rank === 1) {
    return '#FACC15';
  }

  if (rank === 2) {
    return '#D9E0EA';
  }

  if (rank === 3) {
    return '#FB923C';
  }

  return '#FFFFFF';
};

const solidBarColorFor = (raceRow: MobileGameRaceRow) =>
  normalizeHexColor(raceRow.color) ?? flatBarPalette[Math.abs(hashText(raceRow.id)) % flatBarPalette.length];

const normalizeHexColor = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color) ? color : undefined;

const colorWithOpacity = (hexColor: string, opacity: number) => {
  const [red, green, blue] = hexToRgb(hexColor);

  return `rgba(${red},${green},${blue},${opacity})`;
};

const barGradientFor = (hexColor: string) => ({
  colorStops: [
    { offset: 0, color: mixHexColors(hexColor, '#FFFFFF', 0.12) },
    { offset: 0.58, color: hexColor },
    { offset: 1, color: mixHexColors(hexColor, '#000000', 0.14) },
  ],
  type: 'linear',
  x: 0,
  x2: 1,
  y: 0,
  y2: 0,
});

const mixHexColors = (fromColor: string, toColor: string, progress: number) => {
  const from = hexToRgb(fromColor);
  const to = hexToRgb(toColor);
  const mixed = from.map((channel, index) =>
    Math.round(channel + (to[index] - channel) * clamp(progress, 0, 1))
  );

  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
};

const hexToRgb = (hex: string) => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

const hashText = (text: string) => {
  let hash = 0;

  for (const char of text) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }

  return hash;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const flatBarPalette = [
  '#2563EB',
  '#DC2626',
  '#16A34A',
  '#D97706',
  '#7C3AED',
  '#0891B2',
  '#BE123C',
  '#65A30D',
] as const;

const styles: Record<string, CSSProperties> = {
  background: {
    backgroundColor: '#030712',
    backgroundImage:
      'linear-gradient(180deg, #030712 0%, #06121F 48%, #02030A 100%), repeating-linear-gradient(90deg, rgba(103,232,249,0.08) 0 1px, transparent 1px 112px)',
  },
  chart: {
    background:
      'linear-gradient(180deg, rgba(8,16,28,0.86), rgba(3,7,18,0.72)), radial-gradient(circle at 50% 42%, rgba(255,255,255,0.06), rgba(255,255,255,0) 62%)',
    border: '2px solid rgba(255,255,255,0.16)',
    borderRadius: 8,
    boxShadow:
      '0 30px 72px rgba(0,0,0,0.36), inset 0 0 0 1px rgba(255,255,255,0.08)',
    boxSizing: 'border-box',
    height: chart.height,
    left: chart.left,
    overflow: 'hidden',
    position: 'absolute',
    top: chart.top,
    width: chart.width,
    zIndex: 6,
  },
  chartGlow: {
    background:
      'linear-gradient(180deg, rgba(103,232,249,0.07), rgba(250,204,21,0.05) 45%, rgba(244,63,94,0.06)), linear-gradient(90deg, rgba(103,232,249,0), rgba(103,232,249,0.08), rgba(103,232,249,0))',
    height: chart.height + 260,
    left: 70,
    position: 'absolute',
    right: 70,
    top: chart.top - 95,
  },
  cupHalo: {
    border: '6px solid rgba(255,255,255,0.07)',
    borderRadius: '50%',
    color: 'rgba(255,255,255,0.055)',
    fontSize: 112,
    fontStyle: 'italic',
    fontWeight: 950,
    height: 430,
    letterSpacing: 0,
    lineHeight: '430px',
    position: 'absolute',
    right: -38,
    textAlign: 'center',
    top: 610,
    width: 430,
  },
  currentYear: {
    color: '#FFFFFF',
    fontSize: 76,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 0.9,
    textAlign: 'left',
    textShadow: '0 10px 26px rgba(0,0,0,0.45)',
  },
  digitalGrid: {
    backgroundImage:
      'linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.035) 1px, transparent 1px), repeating-linear-gradient(135deg, rgba(103,232,249,0.08) 0 2px, transparent 2px 44px)',
    backgroundSize: '120px 120px, 120px 120px, 100% 100%',
    inset: 0,
    opacity: 0.35,
    position: 'absolute',
  },
  echartsCanvas: {
    height: chart.height,
    inset: 0,
    position: 'absolute',
    width: chart.width,
  },
  footer: {
    bottom: 96,
    color: 'rgba(255,255,255,0.54)',
    fontSize: 20,
    fontWeight: 760,
    left: footerInset.left,
    lineHeight: 1.26,
    position: 'absolute',
    right: footerInset.right,
    zIndex: 12,
  },
  header: {
    left: frameLayout.frameInset.left,
    position: 'absolute',
    right: frameLayout.frameInset.right,
    top: frameLayout.headerTop,
    zIndex: 12,
  },
  leaderBackdrop: {
    overflow: 'hidden',
    zIndex: 1,
  },
  leaderBackdropInitials: {
    fontFamily: fontStack,
    fontSize: 300,
    fontStyle: 'italic',
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
    position: 'absolute',
    right: 2,
    textShadow: '0 30px 70px rgba(0,0,0,0.48)',
    top: 500,
  },
  leaderBackdropVeil: {
    background:
      'linear-gradient(90deg, rgba(3,7,18,0.96) 0%, rgba(3,7,18,0.86) 48%, rgba(3,7,18,0.62) 100%), linear-gradient(180deg, rgba(3,7,18,0.2), rgba(3,7,18,0.92) 84%)',
    inset: 0,
    position: 'absolute',
  },
  leaderColorWash: {
    inset: 0,
    position: 'absolute',
  },
  scanlines: {
    backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 5px)',
    inset: 0,
    mixBlendMode: 'soft-light',
    opacity: 0.25,
    position: 'absolute',
  },
  source: {
    marginBottom: 6,
  },
  stage: {
    backgroundColor: '#030712',
    color: '#FFFFFF',
    fontFamily: fontStack,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 68,
    fontStyle: 'italic',
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 0.95,
    textShadow: '0 14px 32px rgba(0,0,0,0.42)',
  },
  titleHook: {
    color: accentColor,
    fontSize: 34,
    fontStyle: 'italic',
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1.05,
    marginTop: 12,
    textShadow: '0 12px 24px rgba(0,0,0,0.36)',
  },
  topShadow: {
    background:
      'linear-gradient(180deg, rgba(0,0,0,0.42), rgba(0,0,0,0) 58%)',
    height: 520,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  tournamentBadge: {
    alignItems: 'center',
    background: 'rgba(0,0,0,0.42)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 8,
    boxShadow: '0 18px 44px rgba(0,0,0,0.26)',
    display: 'flex',
    gap: 11,
    height: 54,
    justifyContent: 'center',
    marginBottom: 6,
    padding: '0 16px',
    width: 360,
  },
  tournamentBadgeIcon: {
    color: accentColor,
    fontFamily: fontStack,
    fontSize: 30,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 1,
  },
  tournamentBadgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 25,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  yearRailBlock: {
    left: yearRail.left,
    position: 'absolute',
    top: yearRail.top,
    width: yearRail.width,
    zIndex: 12,
  },
  yearRailHeader: {
    alignItems: 'flex-end',
    display: 'flex',
    justifyContent: 'space-between',
  },
  yearRailSvg: {
    display: 'block',
    marginTop: 10,
  },
  yearRailTag: {
    background: 'rgba(250,204,21,0.1)',
    border: '1px solid rgba(250,204,21,0.36)',
    borderRadius: 999,
    color: accentColor,
    fontSize: 24,
    fontWeight: 950,
    lineHeight: 1,
    marginBottom: 7,
    padding: '10px 15px',
  },
};
