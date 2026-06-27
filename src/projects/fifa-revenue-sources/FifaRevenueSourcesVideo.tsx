import { type CSSProperties } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { VIDEO_WIDTH } from '../../shared/video';
import {
  createDefaultDataShortsFrameGeometry,
  dataVideoFontStack,
  defaultDataShortsTemplate,
} from '../../shared/dataVideoFrame';
import { fifaRevenueSourcesVideoConfig } from './config';
import {
  buildRevenueSourceRaceData,
  getRevenueSourceFrameState,
  type RevenueSourceFrameState,
  type RevenueSourceRaceRow,
} from './revenueSourceRace';

const raceData = buildRevenueSourceRaceData();
const fontStack = dataVideoFontStack;
const channelHandle = '@whoa-data';
const topN = raceData.entries.length;
const frameLayout = createDefaultDataShortsFrameGeometry();
const chart = frameLayout.chart;
const footerInset = frameLayout.footerInset ?? frameLayout.frameInset;
const yearRail = frameLayout.timelineRail;
const row = {
  gap: 22,
  height: 118,
};
const rankColumnWidth = 50;
const barLeft = 82;
const valueWidth = 190;
const chartRightPadding = defaultDataShortsTemplate.chartRightPadding;
const valueRight = VIDEO_WIDTH - chart.left - chartRightPadding;
const valueLeft = valueRight - valueWidth;
const barValueOverlap = 12;
const barMaxWidth = valueLeft - barLeft + barValueOverlap;
const barHeight = 104;
const minimumBarWidth = 70;
const barVisualScaleExponent = 0.44;
const chartRowsTop = 134;

export const FifaRevenueSourcesVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(fifaRevenueSourcesVideoConfig.startHoldSeconds * fps);
  const endHoldFrames = Math.round(fifaRevenueSourcesVideoConfig.endHoldSeconds * fps);
  const raceDurationInFrames = Math.max(1, durationInFrames - startHoldFrames - endHoldFrames);
  const raceFrame = clamp(frame - startHoldFrames, 0, raceDurationInFrames - 1);
  const state = getRevenueSourceFrameState({
    data: raceData,
    durationInFrames: raceDurationInFrames,
    frame: raceFrame,
  });

  return (
    <AbsoluteFill style={styles.stage}>
      <Background state={state} />
      <Header />
      <YearRail state={state} />
      <BarRaceChart state={state} />
      <Footer />
    </AbsoluteFill>
  );
};

const Header = () => (
  <div style={styles.header}>
    <div style={styles.title}>{fifaRevenueSourcesVideoConfig.title}</div>
    <div style={styles.titleHook}>{fifaRevenueSourcesVideoConfig.titleHook}</div>
  </div>
);

const YearRail = ({ state }: { state: RevenueSourceFrameState }) => {
  const fillWidth = clamp(state.yearProgress, 0, 1) * yearRail.width;

  return (
    <div style={styles.yearRailBlock}>
      <div style={styles.yearRailHeader}>
        <div style={styles.currentYear}>{state.displayYear}</div>
        <div style={styles.yearRailTag}>{channelHandle}</div>
      </div>
      <svg height={58} style={styles.yearRailSvg} viewBox={`0 0 ${yearRail.width} 58`} width={yearRail.width}>
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
          stroke="#F5E829"
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
          {raceData.maxYear}F
        </text>
      </svg>
    </div>
  );
};

const BarRaceChart = ({ state }: { state: RevenueSourceFrameState }) => (
  <div style={styles.chart}>
    <ChartGrid />
    <TotalRevenueOverlay state={state} />
    {state.rows.map((raceRow) => (
      <RevenueRow
        key={raceRow.code}
        raceRow={raceRow}
        top={chartRankToY(raceRow.animatedRank)}
        width={barWidthForValue(raceRow.value, state.maxValue)}
      />
    ))}
  </div>
);

const ChartGrid = () => (
  <div style={styles.chartGrid}>
    {Array.from({ length: 7 }, (_, index) => (
      <div
        key={`grid-v-${index}`}
        style={{
          ...styles.gridVertical,
          left: barLeft + Math.round((barMaxWidth / 6) * index),
        }}
      />
    ))}
    {Array.from({ length: topN + 1 }, (_, index) => (
      <div
        key={`grid-h-${index}`}
        style={{
          ...styles.gridHorizontal,
          top: chartRowsTop + index * (row.height + row.gap),
        }}
      />
    ))}
  </div>
);

const TotalRevenueOverlay = ({ state }: { state: RevenueSourceFrameState }) => (
  <div style={styles.totalOverlay}>
    <div style={styles.totalLabel}>TOTAL FIFA REVENUE</div>
    <div style={styles.totalValue}>{formatDollar(state.totalValue)}</div>
  </div>
);

const RevenueRow = ({
  raceRow,
  top,
  width,
}: {
  raceRow: RevenueSourceRaceRow;
  top: number;
  width: number;
}) => {
  const rankColor = rankColorFor(raceRow.displayRank);
  const valueColor = valueColorFor(raceRow);
  const barWidth = Math.max(raceRow.value <= 0 ? 6 : minimumBarWidth, width);

  return (
    <div
      style={{
        ...styles.raceRow,
        opacity: raceRow.opacity,
        top,
        zIndex: 1000 - raceRow.displayRank,
      }}
    >
      <div style={{ ...styles.rank, color: colorWithOpacity(rankColor, raceRow.opacity) }}>
        {raceRow.displayRank}
      </div>
      <div
        style={{
          ...styles.bar,
          background: barGradientFor(raceRow.color),
          borderColor: colorWithOpacity(raceRow.color, 0.58),
          boxShadow: `0 18px 38px rgba(0,0,0,0.30), 0 0 ${raceRow.displayRank === 1 ? 36 : 20}px ${colorWithOpacity(raceRow.color, raceRow.displayRank === 1 ? 0.34 : 0.16)}`,
          width: barWidth,
        }}
      />
      <div style={{ ...styles.barSheen, width: barWidth }} />
      <div style={{ ...styles.codeBadge, borderColor: colorWithOpacity(raceRow.color, 0.74) }}>
        <div style={{ ...styles.codeDot, backgroundColor: raceRow.color }} />
        {raceRow.code}
      </div>
      <div style={styles.rowTextBlock}>
        <div style={styles.sourceName}>{raceRow.name}</div>
        <div style={styles.sourceRegion}>{raceRow.region}</div>
      </div>
      <div style={{ ...styles.value, color: colorWithOpacity(valueColor, raceRow.opacity) }}>
        {formatDollar(raceRow.value)}
      </div>
    </div>
  );
};

const Background = ({ state }: { state: RevenueSourceFrameState }) => {
  const leader = state.rows.find((raceRow) => raceRow.displayRank === 1) ?? state.rows[0];
  const color = leader?.color ?? '#38BDF8';
  const scale = 1.02 + state.transitionPulse * 0.025;

  return (
    <AbsoluteFill style={styles.background}>
      <div style={styles.digitalGrid} />
      <div
        style={{
          ...styles.leaderColorWash,
          background: `radial-gradient(circle at 73% 43%, ${colorWithOpacity(color, 0.28)} 0%, ${colorWithOpacity(color, 0.1)} 34%, rgba(3,7,18,0) 68%)`,
        }}
      />
      <div style={{ ...styles.revenueHalo, borderColor: colorWithOpacity(color, 0.13), transform: `rotate(-12deg) scale(${scale})` }}>
        {leader?.code ?? 'FIFA'}
      </div>
      <div style={styles.moneyHalo}>$</div>
      <div style={styles.scanlines} />
      <div style={styles.topShadow} />
      <div style={styles.chartGlow} />
    </AbsoluteFill>
  );
};

const Footer = () => (
  <div style={styles.footer}>
    <div style={styles.source}>{fifaRevenueSourcesVideoConfig.source}</div>
  </div>
);

const chartRankToY = (rank: number) =>
  chartRowsTop + clamp((rank - 1) / Math.max(1, topN - 1), 0, 1) * ((topN - 1) * (row.height + row.gap));

const barWidthForValue = (value: number, maxValue: number) => {
  if (value <= 0) {
    return 6;
  }

  const ratio = clamp(value / Math.max(1, maxValue), 0, 1);
  const visualRatio = Math.pow(ratio, barVisualScaleExponent);

  return minimumBarWidth + visualRatio * (barMaxWidth - minimumBarWidth);
};

const formatDollar = (value: number) => {
  const safeValue = Math.max(0, value);

  if (safeValue >= 1_000_000_000) {
    return `$${(safeValue / 1_000_000_000).toFixed(1)}B`;
  }

  if (safeValue >= 1_000_000) {
    return `$${Math.round(safeValue / 1_000_000).toLocaleString('en-US')}M`;
  }

  return `$${Math.round(safeValue).toLocaleString('en-US')}`;
};

const valueColorFor = (raceRow: RevenueSourceRaceRow) => {
  if (raceRow.displayRank === 1) {
    return '#FACC15';
  }

  if (raceRow.value >= 1_000_000_000) {
    return '#67E8F9';
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

const barGradientFor = (hexColor: string) =>
  `linear-gradient(90deg, ${mixHexColors(hexColor, '#FFFFFF', 0.16)} 0%, ${hexColor} 58%, ${mixHexColors(hexColor, '#000000', 0.14)} 100%)`;

const colorWithOpacity = (hexColor: string, opacity: number) => {
  const [red, green, blue] = hexToRgb(hexColor);

  return `rgba(${red},${green},${blue},${opacity})`;
};

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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const styles = {
  background: {
    backgroundColor: '#030712',
    backgroundImage:
      'linear-gradient(180deg, #030712 0%, #07101D 48%, #02030A 100%), repeating-linear-gradient(90deg, rgba(56,189,248,0.07) 0 1px, transparent 1px 112px)',
  },
  bar: {
    border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: 8,
    height: barHeight,
    left: barLeft,
    position: 'absolute',
    top: 7,
  },
  barSheen: {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.02) 45%, rgba(0,0,0,0.10))',
    borderRadius: 7,
    height: barHeight,
    left: barLeft,
    opacity: 0.48,
    position: 'absolute',
    top: 7,
  },
  chart: {
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
      'linear-gradient(180deg, rgba(56,189,248,0.08), rgba(250,204,21,0.05) 46%, rgba(34,197,94,0.06)), linear-gradient(90deg, rgba(56,189,248,0), rgba(56,189,248,0.08), rgba(56,189,248,0))',
    height: chart.height + 260,
    left: 70,
    position: 'absolute',
    right: 70,
    top: chart.top - 95,
  },
  chartGrid: {
    inset: 0,
    position: 'absolute',
  },
  codeBadge: {
    alignItems: 'center',
    background: 'rgba(3,7,18,0.72)',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 8,
    color: '#FFFFFF',
    display: 'flex',
    fontFamily: fontStack,
    fontSize: 23,
    fontWeight: 950,
    gap: 8,
    height: 44,
    justifyContent: 'center',
    left: barLeft + 15,
    lineHeight: 1,
    position: 'absolute',
    top: 22,
    width: 80,
  },
  codeDot: {
    borderRadius: '50%',
    height: 9,
    width: 9,
  },
  currentYear: {
    color: '#FFFFFF',
    fontSize: 72,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 0.9,
    textAlign: 'left',
    textShadow: '0 10px 26px rgba(0,0,0,0.45)',
  },
  digitalGrid: {
    backgroundImage:
      'linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.035) 1px, transparent 1px), repeating-linear-gradient(135deg, rgba(56,189,248,0.08) 0 2px, transparent 2px 44px)',
    backgroundSize: '120px 120px, 120px 120px, 100% 100%',
    inset: 0,
    opacity: 0.35,
    position: 'absolute',
  },
  footer: {
    color: 'rgba(255,255,255,0.58)',
    fontFamily: fontStack,
    fontSize: 22,
    fontWeight: 700,
    left: footerInset.left,
    lineHeight: 1.35,
    position: 'absolute',
    right: footerInset.right,
    textAlign: 'right',
    top: frameLayout.footerTop,
    zIndex: 7,
  },
  gridHorizontal: {
    background: 'rgba(255,255,255,0.10)',
    height: 1,
    left: barLeft,
    opacity: 0.42,
    position: 'absolute',
    width: barMaxWidth,
  },
  gridVertical: {
    background: 'rgba(255,255,255,0.15)',
    height: chart.height - chartRowsTop + 22,
    opacity: 0.45,
    position: 'absolute',
    top: chartRowsTop - 16,
    width: 1,
  },
  header: {
    color: '#FFFFFF',
    fontFamily: fontStack,
    left: frameLayout.frameInset.left,
    position: 'absolute',
    right: frameLayout.frameInset.right,
    textAlign: 'center',
    top: frameLayout.headerTop,
    zIndex: 7,
  },
  leaderColorWash: {
    inset: 0,
    position: 'absolute',
  },
  moneyHalo: {
    bottom: 264,
    color: 'rgba(255,255,255,0.04)',
    fontFamily: fontStack,
    fontSize: 420,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 1,
    position: 'absolute',
    right: 30,
  },
  raceRow: {
    height: row.height,
    left: 0,
    position: 'absolute',
    right: 0,
    transition: 'none',
  },
  rank: {
    fontFamily: fontStack,
    fontSize: 42,
    fontWeight: 950,
    left: 0,
    lineHeight: 1,
    position: 'absolute',
    textAlign: 'right',
    textShadow: '0 10px 22px rgba(0,0,0,0.48)',
    top: 41,
    width: rankColumnWidth,
  },
  revenueHalo: {
    border: '6px solid rgba(255,255,255,0.07)',
    borderRadius: '50%',
    color: 'rgba(255,255,255,0.055)',
    fontFamily: fontStack,
    fontSize: 126,
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
  rowTextBlock: {
    left: barLeft + 112,
    maxWidth: valueLeft - barLeft - 136,
    position: 'absolute',
    top: 27,
  },
  scanlines: {
    backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 6px)',
    inset: 0,
    opacity: 0.22,
    position: 'absolute',
  },
  source: {
    marginLeft: 'auto',
    maxWidth: 860,
  },
  sourceName: {
    color: '#FFFFFF',
    fontFamily: fontStack,
    fontSize: 34,
    fontWeight: 950,
    lineHeight: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textShadow: '0 5px 16px rgba(0,0,0,0.70)',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  sourceRegion: {
    color: 'rgba(255,255,255,0.70)',
    fontFamily: fontStack,
    fontSize: 21,
    fontWeight: 900,
    lineHeight: 1,
    marginTop: 9,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  stage: {
    backgroundColor: '#030712',
    fontFamily: fontStack,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 58,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
    textShadow: '0 5px 18px rgba(0,0,0,0.64)',
    whiteSpace: 'nowrap',
  },
  titleHook: {
    color: '#F5E829',
    fontSize: 64,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 0.98,
    marginTop: 7,
    textShadow: '0 5px 18px rgba(0,0,0,0.64)',
    whiteSpace: 'nowrap',
  },
  topShadow: {
    background: 'linear-gradient(180deg, rgba(0,0,0,0.68), rgba(0,0,0,0))',
    height: 420,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: fontStack,
    fontSize: 20,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
    textAlign: 'right',
  },
  totalOverlay: {
    position: 'absolute',
    right: chart.width - valueRight,
    textAlign: 'right',
    top: 22,
    width: 420,
    zIndex: 9,
  },
  totalValue: {
    color: '#F5E829',
    fontFamily: fontStack,
    fontSize: 48,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 1,
    marginTop: 7,
    textShadow: '0 10px 24px rgba(0,0,0,0.50)',
  },
  value: {
    fontFamily: fontStack,
    fontSize: 39,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 1,
    position: 'absolute',
    right: chart.width - valueRight,
    textAlign: 'right',
    textShadow: '0 10px 24px rgba(0,0,0,0.55)',
    top: 38,
    whiteSpace: 'nowrap',
    width: valueWidth,
  },
  yearRailBlock: {
    left: yearRail.left,
    position: 'absolute',
    top: yearRail.top,
    width: yearRail.width,
    zIndex: 7,
  },
  yearRailHeader: {
    marginBottom: 7,
    position: 'relative',
  },
  yearRailSvg: {
    display: 'block',
    overflow: 'visible',
  },
  yearRailTag: {
    background: 'rgba(2,8,6,0.44)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 999,
    bottom: 0,
    boxShadow: '0 12px 28px rgba(0,0,0,0.24)',
    color: 'rgba(255,255,255,0.78)',
    fontSize: 24,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
    marginBottom: 7,
    padding: '8px 14px',
    position: 'absolute',
    right: 0,
    whiteSpace: 'nowrap',
  },
} satisfies Record<string, CSSProperties>;
