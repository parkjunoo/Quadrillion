import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { VIDEO_WIDTH } from '../../shared/video';
import {
  createDefaultDataShortsFrameGeometry,
  dataVideoFontStack,
  defaultDataShortsTemplate,
} from '../../shared/dataVideoFrame';
import {
  buildAiModelBenchmarkRaceData,
  formatMonthLabel,
  getAiModelBenchmarkFrameState,
  type AiModelFrameRow,
  type AiModelFrameState,
  type AiModelOrganization,
} from './aiModelBenchmarkRace';
import { aiModelBenchmarkVideoConfig } from './config';

const raceData = buildAiModelBenchmarkRaceData();
const frameLayout = createDefaultDataShortsFrameGeometry({
  chartHeight: 820,
});
const chart = frameLayout.chart;
const footerInset = frameLayout.footerInset ?? frameLayout.frameInset;
const yearRail = frameLayout.timelineRail;
const fontStack = dataVideoFontStack;
const channelHandle = '@whoa-data';
const topN = aiModelBenchmarkVideoConfig.topN;
const row = {
  height: 82,
};
const chartTopPadding = 58;
const chartBottomPadding = 18;
const rowTravelHeight = chart.height - row.height - chartTopPadding - chartBottomPadding;
const rowStep = rowTravelHeight / Math.max(1, topN - 1);
const rowGap = Math.max(0, rowStep - row.height);
const visualRankMinGap = 0.78;
const visualRankMaxGap = 1;
const rankColumnWidth = 42;
const logoLeft = 54;
const logoSize = 60;
const barLeft = 132;
const valueWidth = 124;
const chartRightPadding = defaultDataShortsTemplate.chartRightPadding;
const valueRight = VIDEO_WIDTH - chart.left - chartRightPadding;
const valueLeft = valueRight - valueWidth;
const barValueOverlap = 8;
const barMaxWidth = valueLeft - barLeft + barValueOverlap;
const barHeight = 74;
const barTop = 4;
const minMonthYear = Math.floor(raceData.minMonthIndex / 12);
const minMonth = raceData.minMonthIndex % 12 + 1;
const maxDisplayMonthIndex = Math.round(raceData.maxMonthIndex);
const maxMonthYear = Math.floor(maxDisplayMonthIndex / 12);
const maxMonth = maxDisplayMonthIndex % 12 + 1;

const organizationLogoAssets: Record<AiModelOrganization, { fileName: string; scale: number }> = {
  Alibaba: { fileName: 'alibaba.svg', scale: 0.88 },
  Anthropic: { fileName: 'anthropic.svg', scale: 0.88 },
  DeepSeek: { fileName: 'deepseek.svg', scale: 0.92 },
  Google: { fileName: 'google.svg', scale: 0.88 },
  Kimi: { fileName: 'kimi.svg', scale: 0.92 },
  Meta: { fileName: 'meta.svg', scale: 0.86 },
  Mistral: { fileName: 'mistral.svg', scale: 0.92 },
  OpenAI: { fileName: 'openai.svg', scale: 0.9 },
  xAI: { fileName: 'xai.svg', scale: 0.88 },
};

export const AiModelBenchmarkRaceVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(aiModelBenchmarkVideoConfig.startHoldSeconds * fps);
  const endHoldFrames = Math.round(aiModelBenchmarkVideoConfig.endHoldSeconds * fps);
  const raceDurationInFrames = Math.max(1, durationInFrames - startHoldFrames - endHoldFrames);
  const raceFrame = clamp(frame - startHoldFrames, 0, raceDurationInFrames - 1);
  const intro = interpolate(frame, [0, Math.round(0.55 * fps)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const state = getAiModelBenchmarkFrameState({
    data: raceData,
    durationInFrames: raceDurationInFrames,
    frame: raceFrame,
    topN,
  });

  return (
    <AbsoluteFill style={styles.stage}>
      <Background state={state} />
      <Header intro={intro} />
      <MonthRail intro={intro} state={state} />
      <BarRaceChart state={state} />
      <Footer />
    </AbsoluteFill>
  );
};

const Header = ({ intro }: { intro: number }) => {
  const y = interpolate(intro, [0, 1], [-28, 0]);

  return (
    <div style={{ ...styles.header, opacity: intro, transform: `translateY(${y}px)` }}>
      <div style={styles.titleHook}>{aiModelBenchmarkVideoConfig.titleHook}</div>
      <div style={styles.title}>{aiModelBenchmarkVideoConfig.title}</div>
    </div>
  );
};

const MonthRail = ({ intro, state }: { intro: number; state: AiModelFrameState }) => {
  const fillWidth = clamp(state.monthProgress, 0, 1) * yearRail.width;

  return (
    <div style={{ ...styles.monthRailBlock, opacity: intro }}>
      <div style={styles.monthRailHeader}>
        <div style={styles.currentMonth}>{formatMonthLabel(state.year, state.month)}</div>
        <div style={styles.channelTag}>{channelHandle}</div>
      </div>
      <svg height={58} style={styles.monthRailSvg} viewBox={`0 0 ${yearRail.width} 58`} width={yearRail.width}>
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
          stroke="#45E3AE"
          strokeLinecap="round"
          strokeWidth={6}
          x1={0}
          x2={fillWidth}
          y1={19}
          y2={19}
        />
        <text fill="rgba(255,255,255,0.58)" fontFamily={fontStack} fontSize={24} fontWeight={850} x={0} y={51}>
          {formatMonthLabel(minMonthYear, minMonth)}
        </text>
        <text
          fill="rgba(255,255,255,0.58)"
          fontFamily={fontStack}
          fontSize={24}
          fontWeight={850}
          textAnchor="end"
          x={yearRail.width}
          y={51}
        >
          {formatMonthLabel(maxMonthYear, maxMonth)}
        </text>
      </svg>
    </div>
  );
};

const BarRaceChart = ({ state }: { state: AiModelFrameState }) => {
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
      <LogoOverlay state={state} />
    </div>
  );
};

type EChartsGraphicElement = Record<string, unknown>;

const LogoOverlay = ({ state }: { state: AiModelFrameState }) => (
  <div style={styles.logoOverlay}>
    {state.rows.map((raceRow) => (
      <LogoTile
        key={`logo-${raceRow.id}`}
        raceRow={raceRow}
        top={chartRankToY(visualRankForRow(raceRow, state.rows))}
      />
    ))}
  </div>
);

const LogoTile = ({
  raceRow,
  top,
}: {
  raceRow: AiModelFrameRow;
  top: number;
}) => {
  const logo = organizationLogoAssets[raceRow.organization];

  return (
    <div
      style={{
        ...styles.logoTile,
        borderColor: colorWithOpacity(raceRow.color, 0.72),
        opacity: raceRow.opacity,
        top: top + 11,
        transform: `scale(${0.88 + smootherStep(raceRow.entryProgress) * 0.12})`,
        transformOrigin: 'center',
        zIndex: 1000 - raceRow.displayRank,
      }}
    >
      <Img
        src={staticFile(`projects/ai-model-benchmark-race/logos/${logo.fileName}`)}
        style={{
          ...styles.companyLogo,
          transform: `scale(${logo.scale})`,
        }}
      />
    </div>
  );
};

const buildEChartsBarRaceOption = (state: AiModelFrameState): EChartsOption => {
  const elements: EChartsGraphicElement[] = [
    ...buildEChartsGridElements(state.maxValue),
    ...state.rows.map((raceRow) => buildEChartsRowElement({
      barWidth: barWidthForValue(raceRow.value, state.maxValue),
      raceRow,
      top: chartRankToY(visualRankForRow(raceRow, state.rows)),
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

const buildEChartsGridElements = (maxValue: number): EChartsGraphicElement[] => {
  const verticalLines = Array.from({ length: 6 }, (_, index) => {
    const ratio = index / 5;
    const x = barLeft + Math.round(barMaxWidth * ratio);
    const label = `${Math.round(maxValue * ratio)}%`;

    return [
      {
        type: 'line',
        id: `grid-v-${index}`,
        silent: true,
        shape: { x1: x, y1: 0, x2: x, y2: chart.height },
        style: {
          lineWidth: 1,
          opacity: 0.13,
          stroke: 'rgba(255,255,255,0.16)',
        },
      },
      {
        type: 'text',
        id: `grid-label-${index}`,
        silent: true,
        x: x + 7,
        y: 22,
        style: {
          fill: 'rgba(255,255,255,0.38)',
          fontFamily: fontStack,
          fontSize: 18,
          fontWeight: 850,
          text: label,
          textAlign: 'left',
          textVerticalAlign: 'middle',
        },
      },
    ];
  }).flat();
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

  return [
    ...verticalLines,
    ...horizontalLines,
  ];
};

const buildEChartsRowElement = ({
  barWidth,
  raceRow,
  top,
}: {
  barWidth: number;
  raceRow: AiModelFrameRow;
  top: number;
}): EChartsGraphicElement => {
  const rankColor = rankColorFor(raceRow.displayRank);
  const valueColor = valueColorFor(raceRow);
  const rowOpacity = raceRow.opacity;
  const modelText = modelLabelFor(raceRow.model);
  const releaseMonthLabel = formatMonthLabel(
    Math.floor(raceRow.releaseMonthIndex / 12),
    raceRow.releaseMonthIndex % 12 + 1,
  );

  return {
    type: 'group',
    id: `row-${raceRow.id}`,
    x: 0,
    y: top,
    silent: true,
    z: Math.round(1000 - raceRow.displayRank * 10),
    children: [
      {
        type: 'text',
        id: `rank-${raceRow.id}`,
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
        id: `bar-${raceRow.id}`,
        shape: {
          height: barHeight,
          r: 7,
          width: barWidth,
          x: barLeft,
          y: barTop,
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
        id: `bar-sheen-${raceRow.id}`,
        shape: {
          height: barHeight,
          r: 6,
          width: barWidth,
          x: barLeft,
          y: barTop,
        },
        style: {
          fill: 'rgba(255,255,255,0.14)',
          opacity: rowOpacity * 0.45,
        },
      },
      {
        type: 'text',
        id: `model-${raceRow.id}`,
        z2: 8,
        x: barLeft + 22,
        y: 32,
        style: {
          fill: `rgba(255,255,255,${rowOpacity})`,
          fontFamily: fontStack,
          fontSize: fontSizeForModel(modelText, barWidth),
          fontWeight: 950,
          shadowBlur: 0,
          shadowColor: 'rgba(0,0,0,0.65)',
          shadowOffsetY: 3,
          text: modelText,
          textAlign: 'left',
          textVerticalAlign: 'middle',
        },
      },
      {
        type: 'text',
        id: `meta-${raceRow.id}`,
        z2: 8,
        x: barLeft + 22,
        y: 59,
        style: {
          fill: `rgba(255,255,255,${0.68 * rowOpacity})`,
          fontFamily: fontStack,
          fontSize: 20,
          fontWeight: 900,
          text: `${raceRow.organization} - ${releaseMonthLabel}`,
          textAlign: 'left',
          textVerticalAlign: 'middle',
        },
      },
      {
        type: 'text',
        id: `value-${raceRow.id}`,
        x: valueRight,
        y: 41,
        style: {
          fill: colorWithOpacity(valueColor, rowOpacity),
          fontFamily: fontStack,
          fontSize: 38,
          fontWeight: 950,
          text: formatScore(raceRow.value),
          textAlign: 'right',
          textVerticalAlign: 'middle',
        },
      },
    ],
  };
};

const Background = ({ state }: { state: AiModelFrameState }) => {
  const leader = state.rows.find((raceRow) => raceRow.displayRank === 1) ?? state.rows[0];
  const color = leader?.color ?? '#45E3AE';

  return (
    <AbsoluteFill style={styles.background}>
      <div style={styles.digitalGrid} />
      <div
        style={{
          ...styles.leaderColorWash,
          background: `radial-gradient(circle at 72% 38%, ${colorWithOpacity(color, 0.24)} 0%, ${colorWithOpacity(color, 0.1)} 34%, rgba(3,7,18,0) 66%)`,
        }}
      />
      <div style={styles.scanlines} />
      <div style={styles.topShadow} />
      <div style={styles.chartGlow} />
    </AbsoluteFill>
  );
};

const Footer = () => (
  <div style={styles.footer}>
    <div style={styles.footerSource}>{aiModelBenchmarkVideoConfig.source}</div>
  </div>
);

const chartRankToY = (rank: number) => {
  const normalizedRank = clamp(rank, 1, topN + 0.35);

  return chartTopPadding +
    ((normalizedRank - 1) / Math.max(1, topN - 1)) * rowTravelHeight;
};

const visualRankForRow = (raceRow: AiModelFrameRow, rows: AiModelFrameRow[]) => {
  let visualRank = 1;

  for (let index = 0; index < rows.length; index += 1) {
    const currentRow = rows[index];

    if (currentRow.id === raceRow.id) {
      return visualRank;
    }

    const nextRow = rows[index + 1];

    if (!nextRow) {
      break;
    }

    visualRank += clamp(
      nextRow.animatedRank - currentRow.animatedRank,
      visualRankMinGap,
      visualRankMaxGap,
    );
  }

  return raceRow.displayRank;
};

const barWidthForValue = (value: number, maxValue: number) => {
  if (value <= 0) {
    return 0;
  }

  const ratio = clamp(value / Math.max(1, maxValue), 0, 1);

  return ratio * barMaxWidth;
};

const formatScore = (value: number) => `${Math.max(0, value).toFixed(1)}%`;

const modelLabelFor = (model: string) => {
  if (model.length > 34) {
    return `${model.slice(0, 31)}...`;
  }

  return model;
};

const fontSizeForModel = (model: string, barWidth: number) => {
  const availableModelWidth = Math.max(94, barWidth - 42);
  const fittedSize = Math.round(availableModelWidth / Math.max(8, model.length) / 0.58);

  if (model.length > 30) {
    return clamp(fittedSize, 20, 28);
  }

  if (model.length > 22) {
    return clamp(fittedSize, 21, 31);
  }

  return clamp(fittedSize, 22, 35);
};

const valueColorFor = (raceRow: AiModelFrameRow) => {
  if (raceRow.displayRank === 1) {
    return '#F5E829';
  }

  if (raceRow.value >= 85) {
    return '#67E8F9';
  }

  return '#FFFFFF';
};

const rankColorFor = (rank: number) => {
  if (rank === 1) {
    return '#F5E829';
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
    backgroundColor: '#020617',
    backgroundImage:
      'linear-gradient(180deg, #020617 0%, #07101D 48%, #01030A 100%), repeating-linear-gradient(90deg, rgba(69,227,174,0.05) 0 1px, transparent 1px 120px)',
  },
  benchmarkHalo: {
    border: '6px solid rgba(255,255,255,0.06)',
    borderRadius: '50%',
    color: 'rgba(255,255,255,0.045)',
    fontFamily: fontStack,
    fontSize: 100,
    fontStyle: 'italic',
    fontWeight: 950,
    height: 420,
    letterSpacing: 0,
    lineHeight: '420px',
    position: 'absolute',
    right: -34,
    textAlign: 'center',
    top: 630,
    width: 420,
  },
  channelTag: {
    background: 'rgba(3,7,18,0.58)',
    border: '1px solid rgba(255,255,255,0.24)',
    borderRadius: 999,
    boxShadow: '0 14px 34px rgba(0,0,0,0.3)',
    color: 'rgba(255,255,255,0.78)',
    fontFamily: fontStack,
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1,
    padding: '8px 13px',
    position: 'absolute',
    right: 0,
    top: 10,
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
      'linear-gradient(180deg, rgba(69,227,174,0.08), rgba(105,167,255,0.05) 48%, rgba(185,140,255,0.06)), linear-gradient(90deg, rgba(69,227,174,0), rgba(69,227,174,0.08), rgba(69,227,174,0))',
    filter: 'blur(18px)',
    height: chart.height + 250,
    left: 70,
    maskImage: 'linear-gradient(180deg, transparent 0%, #000 15%, #000 84%, transparent 100%)',
    opacity: 0.92,
    position: 'absolute',
    right: 70,
    top: chart.top - 100,
    transform: 'translateZ(0)',
    WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 15%, #000 84%, transparent 100%)',
  },
  companyLogo: {
    display: 'block',
    height: 42,
    objectFit: 'contain',
    width: 42,
  },
  currentMonth: {
    color: '#FFFFFF',
    fontFamily: fontStack,
    fontSize: 74,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 0.9,
    textShadow: '0 10px 28px rgba(0,0,0,0.46)',
  },
  digitalGrid: {
    backgroundImage:
      'linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.035) 1px, transparent 1px), repeating-linear-gradient(135deg, rgba(69,227,174,0.075) 0 2px, transparent 2px 46px)',
    backgroundSize: '120px 120px, 120px 120px, 100% 100%',
    inset: 0,
    opacity: 0.34,
    position: 'absolute',
  },
  echartsCanvas: {
    height: chart.height,
    left: 0,
    position: 'absolute',
    top: 0,
    width: chart.width,
  },
  footer: {
    color: 'rgba(255,255,255,0.56)',
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
  footerSource: {
    marginLeft: 'auto',
    maxWidth: 860,
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
  logoOverlay: {
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
  },
  logoTile: {
    alignItems: 'center',
    background: 'linear-gradient(180deg, #FFFFFF 0%, #E8EEF6 100%)',
    border: '2px solid rgba(255,255,255,0.24)',
    borderRadius: '50%',
    boxShadow: '0 12px 28px rgba(0,0,0,0.34)',
    display: 'flex',
    height: logoSize,
    justifyContent: 'center',
    left: logoLeft,
    overflow: 'hidden',
    position: 'absolute',
    width: logoSize,
  },
  monthRailBlock: {
    left: yearRail.left,
    position: 'absolute',
    top: yearRail.top,
    width: yearRail.width,
    zIndex: 7,
  },
  monthRailHeader: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 14,
    width: yearRail.width,
  },
  monthRailSvg: {
    display: 'block',
    overflow: 'visible',
  },
  scanlines: {
    backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.034) 0 1px, transparent 1px 6px)',
    inset: 0,
    opacity: 0.2,
    position: 'absolute',
  },
  stage: {
    backgroundColor: '#020617',
    fontFamily: fontStack,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 26,
    fontWeight: 800,
    lineHeight: 1.15,
    marginTop: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 58,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 0.98,
    textShadow: '0 6px 20px rgba(0,0,0,0.62)',
    whiteSpace: 'nowrap',
  },
  titleHook: {
    color: '#45E3AE',
    fontSize: 62,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 0.98,
    marginBottom: 8,
    textShadow: '0 6px 20px rgba(0,0,0,0.62)',
    whiteSpace: 'nowrap',
  },
  topShadow: {
    background: 'linear-gradient(180deg, rgba(0,0,0,0.70), rgba(0,0,0,0))',
    height: 420,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
} satisfies Record<string, CSSProperties>;
