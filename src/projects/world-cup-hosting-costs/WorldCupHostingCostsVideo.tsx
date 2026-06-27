import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { VIDEO_WIDTH } from '../../shared/video';
import {
  createDefaultDataShortsFrameGeometry,
  dataVideoFontStack,
  defaultDataShortsTemplate,
} from '../../shared/dataVideoFrame';
import { worldCupHostingCostEntries, worldCupHostingCostsVideoConfig } from './config';
import {
  buildHostingCostRaceData,
  getHostingCostFrameState,
  type HostingCostFrameState,
  type HostingCostRaceRow,
} from './hostingCostRace';
import { introVoiceoverAsset } from './generated/introVoiceoverAsset';

const raceData = buildHostingCostRaceData();
const fontStack = dataVideoFontStack;
const channelHandle = '@whoa-data';
const topN = Math.min(worldCupHostingCostEntries.length, 10);
const frameLayout = createDefaultDataShortsFrameGeometry({
  chartHeight: 984,
});
const chart = frameLayout.chart;
const footerInset = frameLayout.footerInset ?? frameLayout.frameInset;
const row = {
  height: 82,
};
const chartTopPadding = 4;
const chartBottomPadding = 20;
const rowTravelHeight = chart.height - row.height - chartTopPadding - chartBottomPadding;
const rowStep = rowTravelHeight / Math.max(1, topN - 1);
const rowGap = Math.max(0, rowStep - row.height);
const rankColumnWidth = 50;
const barLeft = 68;
const yearImageLeft = barLeft + 8;
const yearImageSize = 60;
const valueWidth = 184;
const chartRightPadding = defaultDataShortsTemplate.chartRightPadding;
const valueRight = VIDEO_WIDTH - chart.left - chartRightPadding;
const valueLeft = valueRight - valueWidth;
const barValueOverlap = 8;
const barMaxWidth = valueLeft - barLeft + barValueOverlap;
const barHeight = 74;
const barFlagFontSize = 48;
const barFlagRightInset = 16;
const yearRail = frameLayout.timelineRail;
const minYear = Math.floor(raceData.minMonthIndex / 12);
const maxYear = worldCupHostingCostEntries.at(-1)?.year ?? 2022;

export const WorldCupHostingCostsVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(worldCupHostingCostsVideoConfig.startHoldSeconds * fps);
  const endHoldFrames = Math.round(worldCupHostingCostsVideoConfig.endHoldSeconds * fps);
  const raceDurationInFrames = Math.max(1, durationInFrames - startHoldFrames - endHoldFrames);
  const raceFrame = clamp(frame - startHoldFrames, 0, raceDurationInFrames - 1);
  const state = getHostingCostFrameState({
    data: raceData,
    durationInFrames: raceDurationInFrames,
    frame: raceFrame,
  });
  const progress = (state.monthIndex - raceData.minMonthIndex) /
    Math.max(1, raceData.maxMonthIndex - raceData.minMonthIndex);

  return (
    <AbsoluteFill style={styles.stage}>
      {introVoiceoverAsset ? (
        <Audio
          src={staticFile(introVoiceoverAsset.path)}
          volume={worldCupHostingCostsVideoConfig.introVoiceoverVolume}
        />
      ) : null}
      <Background />
      <LeaderBackdrop state={state} />
      <Header />
      <YearRail currentYear={state.currentYear} progress={progress} />
      <BarRaceChart state={state} />
      <Footer />
    </AbsoluteFill>
  );
};

const Header = () => (
  <div style={styles.header}>
    <div style={styles.title}>{worldCupHostingCostsVideoConfig.title}</div>
    <div style={styles.titleHook}>{worldCupHostingCostsVideoConfig.titleHook}</div>
  </div>
);

const YearRail = ({ currentYear, progress }: { currentYear: number; progress: number }) => {
  const fillWidth = clamp(progress, 0, 1) * yearRail.width;

  return (
    <div style={styles.yearRailBlock}>
      <div style={styles.yearRailHeader}>
        <div style={styles.currentYear}>{currentYear}</div>
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
          {minYear}
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
          {maxYear}
        </text>
      </svg>
    </div>
  );
};

const BarRaceChart = ({ state }: { state: HostingCostFrameState }) => {
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
      <YearImageOverlay state={state} />
    </div>
  );
};

type EChartsGraphicElement = Record<string, unknown>;

const YearImageOverlay = ({ state }: { state: HostingCostFrameState }) => (
  <div style={styles.yearImageOverlay}>
    {state.rows.map((raceRow) => (
      <YearImageTile
        key={`year-image-${raceRow.code}`}
        raceRow={raceRow}
        top={chartRankToY(raceRow.animatedRank)}
      />
    ))}
  </div>
);

const YearImageTile = ({
  raceRow,
  top,
}: {
  raceRow: HostingCostRaceRow;
  top: number;
}) => (
  <div
    style={{
      ...styles.yearImageTile,
      borderColor: colorWithOpacity(raceRow.color, 0.72),
      opacity: raceRow.opacity,
      top: top + 11,
      transform: `scale(${0.88 + smootherStep(raceRow.entryProgress) * 0.12})`,
      transformOrigin: 'center',
      zIndex: 1000 - raceRow.displayRank,
    }}
  >
    <Img src={staticFile(raceRow.imagePath)} style={styles.yearImage} />
    <div style={styles.yearImageScrim} />
  </div>
);

const buildEChartsBarRaceOption = (state: HostingCostFrameState): EChartsOption => {
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
  const verticalLines = Array.from({ length: 7 }, (_, index) => {
    const x = barLeft + Math.round((barMaxWidth / 6) * index);

    return {
      type: 'line',
      id: `grid-v-${index}`,
      silent: true,
      shape: { x1: x, y1: 0, x2: x, y2: chart.height },
      style: {
        lineWidth: 1,
        opacity: 0.13,
        stroke: 'rgba(255,255,255,0.16)',
      },
    };
  });
  const horizontalLines = Array.from({ length: topN + 1 }, (_, index) => {
    const y = clamp(
      chartTopPadding - rowGap / 2 + index * rowStep,
      0,
      chart.height,
    );

    return {
      type: 'line',
      id: `grid-h-${index}`,
      silent: true,
      shape: { x1: barLeft, y1: y, x2: barLeft + barMaxWidth, y2: y },
      style: {
        lineWidth: 1,
        opacity: 0.08,
        stroke: 'rgba(255,255,255,0.12)',
      },
    };
  });

  return [...verticalLines, ...horizontalLines];
};

const buildEChartsRowElement = ({
  barWidth,
  raceRow,
  top,
}: {
  barWidth: number;
  raceRow: HostingCostRaceRow;
  top: number;
}): EChartsGraphicElement => {
  const rankColor = rankColorFor(raceRow.displayRank);
  const valueColor = valueColorFor(raceRow);
  const rowOpacity = raceRow.opacity;
  const hostText = hostLabelFor(raceRow.host);

  return {
    type: 'group',
    id: `row-${raceRow.code}`,
    x: 0,
    y: top,
    silent: true,
    z: Math.round(1000 - raceRow.displayRank * 10),
    children: [
      {
        type: 'text',
        id: `rank-${raceRow.code}`,
        x: rankColumnWidth,
        y: 41,
        style: {
          fill: colorWithOpacity(rankColor, rowOpacity),
          fontFamily: fontStack,
          fontSize: 34,
          fontWeight: 950,
          shadowBlur: raceRow.displayRank <= 3 ? 8 : 0,
          shadowColor: raceRow.displayRank <= 3 ? 'rgba(0,0,0,0.52)' : 'transparent',
          text: String(raceRow.displayRank),
          textAlign: 'right',
          textVerticalAlign: 'middle',
        },
      },
      {
        type: 'rect',
        id: `bar-${raceRow.code}`,
        shape: {
          height: barHeight,
          r: 7,
          width: barWidth,
          x: barLeft,
          y: 4,
        },
        style: {
          fill: barGradientFor(raceRow.color),
          lineWidth: 1,
          opacity: rowOpacity,
          stroke: 'rgba(255,255,255,0.16)',
        },
      },
      {
        type: 'rect',
        id: `bar-sheen-${raceRow.code}`,
        shape: {
          height: barHeight,
          r: 6,
          width: barWidth,
          x: barLeft,
          y: 4,
        },
        style: {
          fill: 'rgba(255,255,255,0.14)',
          opacity: rowOpacity * 0.45,
        },
      },
      ...(barWidth > 0
        ? [buildBarFlagElement({
            barWidth,
            raceRow,
            rowOpacity,
          })]
        : []),
      {
        type: 'text',
        id: `host-${raceRow.code}`,
        z2: 8,
        x: barLeft + 82,
        y: 33,
        style: {
          fill: `rgba(255,255,255,${rowOpacity})`,
          fontFamily: fontStack,
          fontSize: fontSizeForHost(hostText, barWidth),
          fontWeight: 950,
          shadowBlur: 0,
          shadowColor: 'rgba(0,0,0,0.65)',
          shadowOffsetY: 3,
          text: hostText,
          textAlign: 'left',
          textVerticalAlign: 'middle',
        },
      },
      {
        type: 'text',
        id: `code-${raceRow.code}`,
        z2: 8,
        x: barLeft + 82,
        y: 59,
        style: {
          fill: `rgba(255,255,255,${0.68 * rowOpacity})`,
          fontFamily: fontStack,
          fontSize: fontSizeForCode(raceRow.code),
          fontWeight: 900,
          text: String(raceRow.year),
          textAlign: 'left',
          textVerticalAlign: 'middle',
        },
      },
      {
        type: 'text',
        id: `value-${raceRow.code}`,
        x: valueRight,
        y: 41,
        style: {
          fill: colorWithOpacity(valueColor, rowOpacity),
          fontFamily: fontStack,
          fontSize: valueFontSizeFor(raceRow.value),
          fontWeight: 950,
          text: formatDollar(raceRow.value),
          textAlign: 'right',
          textVerticalAlign: 'middle',
        },
      },
    ],
  };
};

const buildBarFlagElement = ({
  barWidth,
  raceRow,
  rowOpacity,
}: {
  barWidth: number;
  raceRow: HostingCostRaceRow;
  rowOpacity: number;
}): EChartsGraphicElement => {
  const emojis = countryEmojisForHost(raceRow.host);
  const flagText = emojis.join('');
  const flagWidth = emojis.length * barFlagFontSize * 0.92;
  const flagX = barLeft + barWidth - flagWidth - barFlagRightInset;

  return {
    type: 'group',
    id: `flag-clip-${raceRow.code}`,
    clipPath: {
      type: 'rect',
      shape: {
        height: barHeight,
        r: 7,
        width: barWidth,
        x: barLeft,
        y: 4,
      },
    },
    children: [
      {
        type: 'text',
        id: `flags-${raceRow.code}`,
        z2: 2,
        x: flagX,
        y: 42,
        style: {
          fill: `rgba(255,255,255,${0.34 * rowOpacity})`,
          fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
          fontSize: barFlagFontSize,
          fontWeight: 400,
          opacity: 0.72 * rowOpacity,
          text: flagText,
          textAlign: 'left',
          textVerticalAlign: 'middle',
        },
      },
    ],
  };
};

const LeaderPhoto = ({ state }: { state: HostingCostFrameState }) => {
  const leader = state.rows.find((raceRow) => raceRow.displayRank === 1) ?? state.rows[0];

  if (!leader) {
    return null;
  }

  return (
    <div style={styles.leaderPhotoCard}>
      <div style={{ ...styles.leaderPhotoFrame, borderColor: colorWithOpacity(leader.color, 0.78) }}>
        <Img src={staticFile(leader.imagePath)} style={styles.leaderPhotoImage} />
        <div style={styles.leaderPhotoScrim} />
        <div style={styles.leaderPhotoYear}>{leader.year}</div>
      </div>
      <div style={styles.leaderPhotoMeta}>
        <div style={styles.leaderPhotoKicker}>#1 HOST COST</div>
        <div style={styles.leaderPhotoHost}>{leader.host}</div>
        <div style={{ ...styles.leaderPhotoValue, color: valueColorFor(leader) }}>
          {formatDollar(leader.value)}
        </div>
      </div>
    </div>
  );
};

const LeaderBackdrop = ({ state }: { state: HostingCostFrameState }) => {
  const leader = state.rows.find((raceRow) => raceRow.displayRank === 1) ?? state.rows[0];
  const color = leader?.color ?? '#67E8F9';
  const scale = 1.02 + state.transitionPulse * 0.03;
  const imageScale = 1.08 + state.transitionPulse * 0.025;

  return (
    <AbsoluteFill style={styles.leaderBackdrop}>
      {leader ? (
        <Img
          src={staticFile(leader.imagePath)}
          style={{
            ...styles.leaderBackdropImage,
            transform: `scale(${imageScale})`,
          }}
        />
      ) : null}
      <div
        style={{
          ...styles.leaderColorWash,
          background: `radial-gradient(circle at 72% 38%, ${colorWithOpacity(color, 0.24)} 0%, ${colorWithOpacity(color, 0.1)} 34%, rgba(3,7,18,0) 66%)`,
        }}
      />
      <div style={{ ...styles.costHalo, transform: `rotate(-12deg) scale(${scale})` }}>FIFA</div>
      <div style={styles.leaderBackdropVeil} />
    </AbsoluteFill>
  );
};

const Footer = () => (
  <div style={styles.footer}>
    <div style={styles.source}>{worldCupHostingCostsVideoConfig.source}</div>
  </div>
);

const Background = () => (
  <AbsoluteFill style={styles.background}>
    <div style={styles.digitalGrid} />
    <div style={styles.scanlines} />
    <div style={styles.topShadow} />
    <div style={styles.chartGlow} />
  </AbsoluteFill>
);

const chartRankToY = (rank: number) => {
  const normalizedRank = clamp(rank, 1, topN + 0.35);

  return chartTopPadding +
    ((normalizedRank - 1) / Math.max(1, topN - 1)) * rowTravelHeight;
};

const barWidthForValue = (value: number, maxValue: number) => {
  if (value <= 0) {
    return 0;
  }

  const ratio = clamp(value / Math.max(1, maxValue), 0, 1);

  return ratio * barMaxWidth;
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

const valueFontSizeFor = (value: number) => {
  if (value >= 100_000_000_000) {
    return 38;
  }

  if (value >= 10_000_000_000) {
    return 38;
  }

  return 38;
};

const fontSizeForHost = (host: string, barWidth: number) => {
  if (host === 'CAN/MEX/USA') {
    return 27;
  }

  const availableHostWidth = Math.max(92, barWidth - 106);
  const fittedSize = Math.round(availableHostWidth / Math.max(7, host.length) / 0.58);

  if (host.length > 28) {
    return clamp(fittedSize, 22, 27);
  }

  if (host.length > 21) {
    return clamp(fittedSize, 22, 31);
  }

  return clamp(fittedSize, 22, 36);
};

const fontSizeForCode = (code: string) => code.length > 9 ? 18 : 20;

const hostLabelFor = (host: string) => {
  if (host === 'South Korea / Japan') {
    return 'Korea / Japan';
  }

  if (host === 'Canada / Mexico / United States') {
    return 'CAN/MEX/USA';
  }

  return host;
};

const countryEmojisForHost = (host: string) => {
  if (host === 'Canada / Mexico / United States') {
    return ['🇨🇦', '🇲🇽', '🇺🇸'];
  }

  if (host === 'South Korea / Japan') {
    return ['🇰🇷', '🇯🇵'];
  }

  if (host === 'West Germany' || host === 'Germany') {
    return ['🇩🇪'];
  }

  const emojisByHost: Record<string, string[]> = {
    Argentina: ['🇦🇷'],
    Brazil: ['🇧🇷'],
    France: ['🇫🇷'],
    Italy: ['🇮🇹'],
    Mexico: ['🇲🇽'],
    Qatar: ['🇶🇦'],
    Russia: ['🇷🇺'],
    Spain: ['🇪🇸'],
    'South Africa': ['🇿🇦'],
    'United States': ['🇺🇸'],
  };

  return emojisByHost[host] ?? ['🏆'];
};

const valueColorFor = (raceRow: HostingCostRaceRow) => {
  if (raceRow.displayRank === 1) {
    return '#FACC15';
  }

  if (raceRow.value >= 10_000_000_000) {
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

const colorWithOpacity = (hexColor: string, opacity: number) => {
  const [red, green, blue] = hexToRgb(hexColor);

  return `rgba(${red},${green},${blue},${opacity})`;
};

const barGradientFor = (hexColor: string) => ({
  type: 'linear',
  x: 0,
  x2: 1,
  y: 0,
  y2: 0,
  colorStops: [
    { offset: 0, color: mixHexColors(hexColor, '#FFFFFF', 0.12) },
    { offset: 0.58, color: hexColor },
    { offset: 1, color: mixHexColors(hexColor, '#000000', 0.12) },
  ],
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const smootherStep = (value: number) => {
  const t = clamp(value, 0, 1);

  return t * t * t * (t * (t * 6 - 15) + 10);
};

const styles = {
  background: {
    backgroundColor: '#030712',
    backgroundImage:
      'linear-gradient(180deg, #030712 0%, #06121F 48%, #02030A 100%), repeating-linear-gradient(90deg, rgba(103,232,249,0.08) 0 1px, transparent 1px 112px)',
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
      'linear-gradient(180deg, rgba(103,232,249,0.07), rgba(250,204,21,0.05) 45%, rgba(244,63,94,0.06)), linear-gradient(90deg, rgba(103,232,249,0), rgba(103,232,249,0.08), rgba(103,232,249,0))',
    height: chart.height + 260,
    left: 70,
    position: 'absolute',
    right: 70,
    top: chart.top - 95,
  },
  channelTag: {
    background: 'rgba(3,7,18,0.58)',
    border: '1px solid rgba(255,255,255,0.24)',
    borderRadius: 999,
    boxShadow: '0 14px 34px rgba(0,0,0,0.3)',
    color: 'rgba(255,255,255,0.78)',
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1,
    padding: '8px 13px',
    position: 'absolute',
    right: 0,
    top: 10,
  },
  costHalo: {
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
  headerTop: {
    paddingRight: 190,
    position: 'relative',
  },
  leaderBackdrop: {
    zIndex: 1,
  },
  leaderBackdropImage: {
    filter: 'blur(1.4px) saturate(1.02) brightness(0.78)',
    height: '100%',
    inset: 0,
    objectFit: 'cover',
    opacity: 0.34,
    position: 'absolute',
    transformOrigin: 'center',
    width: '100%',
  },
  leaderBackdropVeil: {
    background:
      'linear-gradient(90deg, rgba(3,7,18,0.94) 0%, rgba(3,7,18,0.78) 34%, rgba(3,7,18,0.48) 62%, rgba(3,7,18,0.82) 100%), linear-gradient(180deg, rgba(3,7,18,0.08), rgba(3,7,18,0.96) 78%)',
    inset: 0,
    position: 'absolute',
  },
  leaderColorWash: {
    inset: 0,
    position: 'absolute',
  },
  leaderPhotoCard: {
    alignItems: 'center',
    background: 'linear-gradient(90deg, rgba(3,7,18,0.9), rgba(3,7,18,0.52))',
    border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: 8,
    boxShadow: '0 22px 54px rgba(0,0,0,0.36)',
    display: 'flex',
    gap: 16,
    height: 112,
    left: chart.left + 6,
    overflow: 'hidden',
    padding: 8,
    position: 'absolute',
    top: chart.top - 150,
    width: 520,
    zIndex: 7,
  },
  leaderPhotoFrame: {
    border: '2px solid rgba(255,255,255,0.28)',
    borderRadius: 6,
    flex: '0 0 auto',
    height: 96,
    overflow: 'hidden',
    position: 'relative',
    width: 96,
  },
  leaderPhotoHost: {
    color: '#FFFFFF',
    fontFamily: fontStack,
    fontSize: 27,
    fontWeight: 950,
    lineHeight: 1,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    width: 380,
  },
  leaderPhotoImage: {
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  leaderPhotoKicker: {
    color: '#67E8F9',
    fontFamily: fontStack,
    fontSize: 18,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
    marginBottom: 8,
  },
  leaderPhotoMeta: {
    minWidth: 0,
  },
  leaderPhotoScrim: {
    background: 'linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.72))',
    inset: 0,
    position: 'absolute',
  },
  leaderPhotoValue: {
    fontFamily: fontStack,
    fontSize: 25,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 1,
    marginTop: 8,
    whiteSpace: 'nowrap',
  },
  leaderPhotoYear: {
    bottom: 7,
    color: '#FFFFFF',
    fontFamily: fontStack,
    fontSize: 25,
    fontStyle: 'italic',
    fontWeight: 950,
    left: 0,
    lineHeight: 1,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
    textShadow: '0 5px 12px rgba(0,0,0,0.76)',
  },
  legend: {
    color: 'rgba(255,255,255,0.56)',
    display: 'flex',
    fontFamily: fontStack,
    fontSize: 22,
    fontWeight: 950,
    justifyContent: 'space-between',
    left: chart.left + 8,
    letterSpacing: 0,
    position: 'absolute',
    right: 84,
    top: chart.top - 32,
    zIndex: 7,
  },
  note: {
    color: 'rgba(255,255,255,0.44)',
    marginTop: 7,
  },
  scanlines: {
    backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 6px)',
    inset: 0,
    opacity: 0.22,
    position: 'absolute',
  },
  source: {
    maxWidth: 860,
    marginLeft: 'auto',
  },
  stage: {
    backgroundColor: '#030712',
    fontFamily: fontStack,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 56,
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
  yearImage: {
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  yearImageScrim: {
    background: 'linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.14))',
    inset: 0,
    position: 'absolute',
  },
  yearImageOverlay: {
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 10,
  },
  yearImageTile: {
    background: 'rgba(3,7,18,0.76)',
    border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.18), 0 10px 18px rgba(0,0,0,0.28)',
    height: yearImageSize,
    left: yearImageLeft,
    overflow: 'hidden',
    position: 'absolute',
    top: 2,
    width: yearImageSize,
  },
  yearImageYear: {
    bottom: 7,
    color: '#FFFFFF',
    fontFamily: fontStack,
    fontSize: 23,
    fontStyle: 'italic',
    fontWeight: 950,
    left: 0,
    lineHeight: 1,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
    textShadow: '0 5px 12px rgba(0,0,0,0.76)',
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
    color: 'rgba(255,255,255,0.72)',
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1,
    marginBottom: 7,
    padding: '7px 13px',
    position: 'absolute',
    right: 0,
    whiteSpace: 'nowrap',
  },
} satisfies Record<string, CSSProperties>;
