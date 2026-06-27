import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import {
  Audio,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  createSimpleBarRaceFrameGeometry,
  DataVideoChartFrame,
  dataVideoFontStack,
  DataVideoFrameLayout,
} from '../../shared/dataVideoFrame';
import {
  buildGameConcurrencyRaceData,
  getGameConcurrencyFrameState,
  type GameConcurrencyFrameState,
  type GameConcurrencyRaceRow,
} from './gameConcurrencyRace';
import { onlineGameConcurrencyVideoConfig } from './config';
import { introVoiceoverAsset } from './generated/introVoiceoverAsset';
import worldMapGeoJson from '../ios-vs-android/generated/world.json';

const chartData = buildGameConcurrencyRaceData(onlineGameConcurrencyVideoConfig.csv, {
  dataCadence: onlineGameConcurrencyVideoConfig.dataCadence,
  startDate: onlineGameConcurrencyVideoConfig.startDate,
});
const fontStack = dataVideoFontStack;
const channelHandle = '@whoa-data';
const kickerText = 'GLOBAL DATA RACE / PC + MOBILE';
const accentColor = '#F8D84B';
const frameLayout = createSimpleBarRaceFrameGeometry({
  chartHeight: 970,
  chartTop: 595,
  footerTop: 1592,
  headerTop: 178,
  timelineRailTop: 412,
  verticalLayoutLift: 0,
});
const chart = frameLayout.chart;
const chartContentTop = 42;
const row = {
  height: 74,
  gap: 18,
};
const rankColumnWidth = 46;
const barLeft = 66;
const barMaxWidth = 620;
const valueLeft = 720;
const valueWidth = 178;
const barHeight = 66;
const minimumBarWidth = 18;
const barVisualScaleExponent = 0.56;
const eChartsWorldMapName = 'online-game-world';
const eChartsMapSize = {
  height: chart.height,
  width: chart.width,
};

echarts.registerMap(
  eChartsWorldMapName,
  worldMapGeoJson as unknown as Parameters<typeof echarts.registerMap>[1]
);

export const OnlineGameConcurrencyVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(onlineGameConcurrencyVideoConfig.startHoldSeconds * fps);
  const endHoldFrames = Math.round(onlineGameConcurrencyVideoConfig.endHoldSeconds * fps);
  const raceDurationInFrames = Math.max(1, durationInFrames - startHoldFrames - endHoldFrames);
  const raceFrame = clamp(frame - startHoldFrames, 0, raceDurationInFrames - 1);
  const state = getGameConcurrencyFrameState({
    data: chartData,
    durationInFrames: raceDurationInFrames,
    frame: raceFrame,
    topN: onlineGameConcurrencyVideoConfig.topN,
  });
  const intro = 1;

  return (
    <DataVideoFrameLayout style={styles.stage}>
      {introVoiceoverAsset ? (
        <Audio
          src={staticFile(introVoiceoverAsset.path)}
          volume={onlineGameConcurrencyVideoConfig.introVoiceoverVolume}
        />
      ) : null}
      <SimpleHeader />
      <SimpleTimeline currentYear={String(state.year)} />
      <SimpleValueLegend />
      <DataVideoChartFrame chart={chart} intro={intro} style={styles.chartFrame}>
        <BarRaceChart intro={intro} state={state} />
      </DataVideoChartFrame>
      <Footer />
    </DataVideoFrameLayout>
  );
};

const SimpleHeader = () => (
  <div style={styles.simpleHeader}>
    <div style={styles.simpleKicker}>{kickerText}</div>
    <div style={styles.simpleTitle}>{onlineGameConcurrencyVideoConfig.title}</div>
    <div style={styles.simpleHook}>{onlineGameConcurrencyVideoConfig.titleHook}</div>
  </div>
);

const SimpleTimeline = ({
  currentYear,
}: {
  currentYear: string;
}) => (
  <div style={styles.simpleTimeline}>
    <div style={styles.simpleCurrentYear}>{currentYear}</div>
    <div style={styles.simpleYearRange}>{chartData.minYear} → {chartData.maxYear}</div>
    <div style={styles.simpleTimelineHandle}>{channelHandle}</div>
  </div>
);

const SimpleValueLegend = () => (
  <div style={styles.legend}>
    <span>{onlineGameConcurrencyVideoConfig.dateLabel}</span>
    <span>{onlineGameConcurrencyVideoConfig.valueColumnLabel}</span>
  </div>
);

const mapMarkerSlots = [
  { x: 690, y: 258, region: 'East Asia', labelX: 52, labelY: -104, anchor: 'start' },
  { x: 205, y: 260, region: 'North America', labelX: 38, labelY: -38, anchor: 'start' },
  { x: 474, y: 244, region: 'Europe', labelX: -52, labelY: -102, anchor: 'end' },
  { x: 574, y: 330, region: 'SEA', labelX: 38, labelY: 34, anchor: 'start' },
  { x: 635, y: 292, region: 'China', labelX: 72, labelY: 30, anchor: 'start' },
  { x: 242, y: 320, region: 'US West', labelX: 42, labelY: 42, anchor: 'start' },
  { x: 525, y: 350, region: 'Global', labelX: -40, labelY: 50, anchor: 'end' },
  { x: 515, y: 285, region: 'Eurasia', labelX: -44, labelY: 30, anchor: 'end' },
] as const;

const eChartsMapSlots = [
  { coord: [127.5, 36.5], region: 'East Asia' },
  { coord: [-98, 39], region: 'North America' },
  { coord: [12, 51], region: 'Europe' },
  { coord: [103, 13], region: 'SEA' },
  { coord: [104, 35], region: 'China' },
  { coord: [-122, 37], region: 'US West' },
  { coord: [35, 0], region: 'Global' },
  { coord: [70, 45], region: 'Eurasia' },
] as const;

const EChartsWorldMapChart = ({
  intro,
  state,
}: {
  intro: number;
  state: GameConcurrencyFrameState;
}) => {
  const frame = useCurrentFrame();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const option = useMemo(() => buildEChartsWorldMapOption(state, frame), [frame, state]);

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    chartRef.current = echarts.init(containerRef.current, undefined, {
      height: eChartsMapSize.height,
      renderer: 'svg',
      width: eChartsMapSize.width,
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
    <div
      style={{
        ...styles.mapOnlyChart,
        opacity: intro,
      }}
    >
      <div ref={containerRef} style={styles.echartsWorldMapCanvas} />
      <div style={styles.mapOnlyVignette} />
    </div>
  );
};

const buildEChartsWorldMapOption = (
  state: GameConcurrencyFrameState,
  frame: number
): EChartsOption => {
  const mapRows = state.rows.slice(0, eChartsMapSlots.length);
  const maxValue = Math.max(...mapRows.map((raceRow) => raceRow.value), 1);
  const pulse = 0.5 + Math.sin(frame / 10) * 0.5;
  const pointData = mapRows.map((raceRow, index) => {
    const slot = eChartsMapSlots[index];
    const valueRatio = Math.sqrt(raceRow.value / maxValue);
    const symbolSize = 15 + valueRatio * 58 + (index === 0 ? pulse * 8 : pulse * 3);
    const color = solidBarColorFor(raceRow);

    return {
      name: raceRow.name,
      rawColor: color,
      value: [...slot.coord, raceRow.value],
      symbolSize,
      itemStyle: {
        borderColor: 'rgba(255,255,255,0.9)',
        borderWidth: 2.4,
        color: colorWithOpacity(color, 0.76),
        shadowBlur: 24,
        shadowColor: colorWithOpacity(color, 0.4),
      },
    };
  });
  const lineData = eChartsMapSlots.slice(1, 5).map((slot) => ({
    coords: [eChartsMapSlots[0].coord, slot.coord],
  }));

  return {
    animation: false,
    backgroundColor: '#000000',
    geo: {
      emphasis: {
        disabled: true,
      },
      itemStyle: {
        areaColor: '#111C33',
        borderColor: 'rgba(148,163,184,0.32)',
        borderWidth: 0.7,
      },
      layoutCenter: ['50%', '51%'],
      layoutSize: '122%',
      map: eChartsWorldMapName,
      roam: false,
      silent: true,
      zoom: 1,
    },
    series: [
      {
        coordinateSystem: 'geo',
        data: pointData.map((point) => ({
          ...point,
          itemStyle: {
            color: colorWithOpacity(point.rawColor, 0.12),
          },
          symbolSize: Number(point.symbolSize) * 2.15,
        })),
        silent: true,
        type: 'scatter',
        zlevel: 2,
      },
      {
        coordinateSystem: 'geo',
        data: lineData,
        effect: {
          color: 'rgba(248,216,75,0.7)',
          constantSpeed: 36,
          show: true,
          symbol: 'circle',
          symbolSize: 4,
          trailLength: 0.18,
        },
        lineStyle: {
          color: 'rgba(248,216,75,0.22)',
          curveness: 0.18,
          width: 2,
        },
        silent: true,
        type: 'lines',
        zlevel: 3,
      },
      {
        coordinateSystem: 'geo',
        data: pointData,
        silent: true,
        type: 'effectScatter',
        rippleEffect: {
          brushType: 'stroke',
          number: 2,
          scale: 2.7,
        },
        zlevel: 4,
      },
    ],
    tooltip: {
      show: false,
    },
  } as EChartsOption;
};

const MapOnlyChart = ({
  intro,
  state,
}: {
  intro: number;
  state: GameConcurrencyFrameState;
}) => {
  const frame = useCurrentFrame();
  const mapRows = state.rows.slice(0, mapMarkerSlots.length);
  const maxValue = Math.max(...mapRows.map((raceRow) => raceRow.value), 1);
  const pulse = 0.48 + Math.sin(frame / 11) * 0.36;

  return (
    <div
      style={{
        ...styles.mapOnlyChart,
        opacity: intro,
      }}
    >
      <svg viewBox="0 0 1080 1920" style={styles.mapOnlySvg}>
        <defs>
          <radialGradient id="map-only-glow" cx="50%" cy="50%" r="58%">
            <stop offset="0%" stopColor="rgba(37,99,235,0.28)" />
            <stop offset="52%" stopColor="rgba(37,99,235,0.08)" />
            <stop offset="100%" stopColor="rgba(37,99,235,0)" />
          </radialGradient>
          <linearGradient id="map-only-land" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#25314C" />
            <stop offset="100%" stopColor="#0E172A" />
          </linearGradient>
          <filter id="map-only-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="24" stdDeviation="24" floodColor="#000000" floodOpacity="0.52" />
          </filter>
        </defs>
        <rect x="0" y="0" width="1080" height="1920" fill="#000000" />
        <rect x="0" y="0" width="1080" height="1920" fill="url(#map-only-glow)" />
        <g transform="translate(52 512) scale(1.06)">
          {Array.from({ length: 8 }, (_, index) => {
            const y = 70 + index * 78;

            return (
              <path
                key={`map-only-lat-${index}`}
                d={`M58 ${y} C245 ${y + 22}, 472 ${y - 26}, 870 ${y + 6}`}
                stroke="rgba(148,163,184,0.13)"
                strokeWidth="1.2"
                fill="none"
              />
            );
          })}
          {Array.from({ length: 9 }, (_, index) => {
            const x = 68 + index * 106;

            return (
              <path
                key={`map-only-lon-${index}`}
                d={`M${x} 48 C${x - 38} 222, ${x + 34} 420, ${x - 18} 640`}
                stroke="rgba(148,163,184,0.1)"
                strokeWidth="1.2"
                fill="none"
              />
            );
          })}
          <g filter="url(#map-only-shadow)" opacity="0.98">
            <path
              d="M116 210 C142 166, 207 146, 260 168 C303 186, 316 230, 288 264 C260 296, 221 286, 191 318 C160 350, 112 336, 94 298 C77 262, 90 232, 116 210 Z"
              fill="url(#map-only-land)"
              stroke="rgba(148,163,184,0.25)"
              strokeWidth="2"
            />
            <path
              d="M260 340 C293 358, 312 398, 300 444 C292 477, 267 508, 248 552 C231 520, 213 488, 213 452 C213 410, 229 371, 260 340 Z"
              fill="url(#map-only-land)"
              stroke="rgba(148,163,184,0.22)"
              strokeWidth="2"
            />
            <path
              d="M409 229 C436 193, 494 182, 522 213 C546 239, 536 280, 502 294 C462 310, 421 288, 409 229 Z"
              fill="url(#map-only-land)"
              stroke="rgba(148,163,184,0.22)"
              strokeWidth="2"
            />
            <path
              d="M476 306 C521 286, 574 302, 595 342 C618 386, 590 452, 538 462 C492 471, 459 431, 465 386 C470 351, 451 325, 476 306 Z"
              fill="url(#map-only-land)"
              stroke="rgba(148,163,184,0.22)"
              strokeWidth="2"
            />
            <path
              d="M548 206 C612 154, 735 164, 788 222 C836 275, 794 342, 715 339 C660 336, 635 302, 594 286 C551 270, 515 234, 548 206 Z"
              fill="url(#map-only-land)"
              stroke="rgba(148,163,184,0.25)"
              strokeWidth="2"
            />
            <path
              d="M694 432 C733 404, 795 417, 819 456 C790 489, 728 498, 684 470 C668 460, 673 445, 694 432 Z"
              fill="url(#map-only-land)"
              stroke="rgba(148,163,184,0.22)"
              strokeWidth="2"
            />
          </g>
          <path
            d="M690 258 C564 162, 342 166, 205 260"
            stroke="rgba(248,216,75,0.32)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M690 258 C604 214, 534 214, 474 244"
            stroke="rgba(34,197,94,0.28)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M690 258 C650 282, 610 306, 574 330"
            stroke="rgba(251,113,133,0.26)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {mapRows.map((raceRow, index) => {
            const slot = mapMarkerSlots[index];
            const radius = 15 + Math.sqrt(raceRow.value / maxValue) * 30;
            const color = solidBarColorFor(raceRow);

            return (
              <g key={`map-only-marker-${raceRow.id}`}>
                <circle
                  cx={slot.x}
                  cy={slot.y}
                  r={radius + pulse * 9}
                  fill={colorWithOpacity(color, 0.13)}
                />
                <circle
                  cx={slot.x}
                  cy={slot.y}
                  r={radius}
                  fill={colorWithOpacity(color, 0.72)}
                  stroke="rgba(255,255,255,0.84)"
                  strokeWidth="3"
                />
                <circle
                  cx={slot.x - radius * 0.22}
                  cy={slot.y - radius * 0.22}
                  r={Math.max(4, radius * 0.18)}
                  fill="rgba(255,255,255,0.58)"
                />
              </g>
            );
          })}
        </g>
      </svg>
      <div style={styles.mapOnlyVignette} />
    </div>
  );
};

const WorldMapChart = ({
  intro,
  state,
}: {
  intro: number;
  state: GameConcurrencyFrameState;
}) => {
  const frame = useCurrentFrame();
  const mapRows = state.rows.slice(0, mapMarkerSlots.length);
  const maxValue = Math.max(...mapRows.map((raceRow) => raceRow.value), 1);
  const pulse = 0.55 + Math.sin(frame / 11) * 0.45;

  return (
    <div
      style={{
        ...styles.worldMapChart,
        opacity: intro,
      }}
    >
      <div style={styles.worldMapHeader}>
        <div>
          <div style={styles.worldMapEyebrow}>WORLD MAP VIEW</div>
          <div style={styles.worldMapTitle}>Peak concurrent players by global footprint</div>
        </div>
        <div style={styles.worldMapMetric}>
          <span style={styles.worldMapMetricValue}>{formatConcurrentPlayers(mapRows[0]?.value ?? 0)}</span>
          <span style={styles.worldMapMetricLabel}>largest reported peak</span>
        </div>
      </div>
      <svg
        viewBox="0 0 920 650"
        style={styles.worldMapSvg}
      >
        <defs>
          <radialGradient id="world-map-glow" cx="50%" cy="46%" r="70%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.26)" />
            <stop offset="48%" stopColor="rgba(59,130,246,0.08)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </radialGradient>
          <linearGradient id="world-map-land" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1F2A44" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <filter id="world-map-soft-shadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#000000" floodOpacity="0.42" />
          </filter>
        </defs>
        <rect x="0" y="0" width="920" height="650" fill="url(#world-map-glow)" />
        {Array.from({ length: 7 }, (_, index) => {
          const y = 92 + index * 74;

          return (
            <path
              key={`map-lat-${index}`}
              d={`M72 ${y} C260 ${y + 22}, 455 ${y - 22}, 848 ${y + 8}`}
              stroke="rgba(148,163,184,0.11)"
              strokeWidth="1"
              fill="none"
            />
          );
        })}
        {Array.from({ length: 8 }, (_, index) => {
          const x = 100 + index * 104;

          return (
            <path
              key={`map-lon-${index}`}
              d={`M${x} 76 C${x - 32} 230, ${x + 28} 398, ${x - 16} 574`}
              stroke="rgba(148,163,184,0.09)"
              strokeWidth="1"
              fill="none"
            />
          );
        })}
        <g filter="url(#world-map-soft-shadow)" opacity="0.96">
          <path
            d="M116 210 C142 166, 207 146, 260 168 C303 186, 316 230, 288 264 C260 296, 221 286, 191 318 C160 350, 112 336, 94 298 C77 262, 90 232, 116 210 Z"
            fill="url(#world-map-land)"
            stroke="rgba(148,163,184,0.22)"
            strokeWidth="2"
          />
          <path
            d="M260 340 C293 358, 312 398, 300 444 C292 477, 267 508, 248 552 C231 520, 213 488, 213 452 C213 410, 229 371, 260 340 Z"
            fill="url(#world-map-land)"
            stroke="rgba(148,163,184,0.2)"
            strokeWidth="2"
          />
          <path
            d="M409 229 C436 193, 494 182, 522 213 C546 239, 536 280, 502 294 C462 310, 421 288, 409 229 Z"
            fill="url(#world-map-land)"
            stroke="rgba(148,163,184,0.2)"
            strokeWidth="2"
          />
          <path
            d="M476 306 C521 286, 574 302, 595 342 C618 386, 590 452, 538 462 C492 471, 459 431, 465 386 C470 351, 451 325, 476 306 Z"
            fill="url(#world-map-land)"
            stroke="rgba(148,163,184,0.2)"
            strokeWidth="2"
          />
          <path
            d="M548 206 C612 154, 735 164, 788 222 C836 275, 794 342, 715 339 C660 336, 635 302, 594 286 C551 270, 515 234, 548 206 Z"
            fill="url(#world-map-land)"
            stroke="rgba(148,163,184,0.22)"
            strokeWidth="2"
          />
          <path
            d="M694 432 C733 404, 795 417, 819 456 C790 489, 728 498, 684 470 C668 460, 673 445, 694 432 Z"
            fill="url(#world-map-land)"
            stroke="rgba(148,163,184,0.2)"
            strokeWidth="2"
          />
        </g>
        <path
          d="M690 258 C564 162, 342 166, 205 260"
          stroke="rgba(248,216,75,0.34)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M690 258 C604 214, 534 214, 474 244"
          stroke="rgba(34,197,94,0.3)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M690 258 C650 282, 610 306, 574 330"
          stroke="rgba(251,113,133,0.28)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {mapRows.map((raceRow, index) => {
          const slot = mapMarkerSlots[index];
          const radius = 15 + Math.sqrt(raceRow.value / maxValue) * 28;
          const color = solidBarColorFor(raceRow);
          const valueColor = valueColorFor(raceRow);

          return (
            <g key={`map-marker-${raceRow.id}`}>
              <circle
                cx={slot.x}
                cy={slot.y}
                r={radius + pulse * 7}
                fill={colorWithOpacity(color, 0.13)}
              />
              <circle
                cx={slot.x}
                cy={slot.y}
                r={radius}
                fill={colorWithOpacity(color, 0.74)}
                stroke="rgba(255,255,255,0.82)"
                strokeWidth="3"
              />
              <circle
                cx={slot.x - radius * 0.22}
                cy={slot.y - radius * 0.22}
                r={Math.max(4, radius * 0.18)}
                fill="rgba(255,255,255,0.55)"
              />
              {index < 5 ? (
                <g transform={`translate(${slot.x + slot.labelX}, ${slot.y + slot.labelY})`}>
                  <rect
                    x={slot.anchor === 'end' ? -172 : 0}
                    y="-27"
                    width="172"
                    height="58"
                    rx="12"
                    fill="rgba(0,0,0,0.62)"
                    stroke="rgba(255,255,255,0.12)"
                  />
                  <text
                    x={slot.anchor === 'end' ? -12 : 12}
                    y="-3"
                    fill="rgba(255,255,255,0.92)"
                    fontFamily={fontStack}
                    fontSize="18"
                    fontWeight="950"
                    textAnchor={slot.anchor}
                  >
                    {compactMapLabel(raceRow.name)}
                  </text>
                  <text
                    x={slot.anchor === 'end' ? -12 : 12}
                    y="22"
                    fill={valueColor}
                    fontFamily={fontStack}
                    fontSize="18"
                    fontWeight="950"
                    textAnchor={slot.anchor}
                  >
                    {slot.region} · {formatConcurrentPlayers(raceRow.value)}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
      <div style={styles.worldMapLeaderboard}>
        {mapRows.slice(0, 4).map((raceRow, index) => (
          <div key={`map-leader-${raceRow.id}`} style={styles.worldMapLeaderRow}>
            <span style={{ ...styles.worldMapRank, color: rankColorFor(index + 1) }}>#{index + 1}</span>
            <span style={styles.worldMapLeaderName}>{raceRow.name}</span>
            <span style={{ ...styles.worldMapLeaderValue, color: valueColorFor(raceRow) }}>
              {formatConcurrentPlayers(raceRow.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BarRaceChart = ({
  intro,
  state,
}: {
  intro: number;
  state: GameConcurrencyFrameState;
}) => {
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
    <div
      style={{
        ...styles.chart,
        opacity: intro,
      }}
    >
      <div ref={containerRef} style={styles.echartsCanvas} />
      <ProfilePhotoOverlay state={state} />
    </div>
  );
};

type EChartsGraphicElement = Record<string, unknown>;

const ProfilePhotoOverlay = ({ state }: { state: GameConcurrencyFrameState }) => (
  <div style={styles.profileOverlay}>
    {state.rows.map((raceRow) => {
      const imageSrc = imageSourceFor(raceRow.imageUrl);
      const isLogoImage = /\.(?:png|svg)$/i.test(raceRow.imageUrl);

      return (
        <div
          key={`photo-${raceRow.id}`}
          style={{
            ...styles.profilePhotoFrame,
            opacity: raceRow.opacity,
            top: rowTopForRaceRow(raceRow) + 11,
          }}
        >
          {imageSrc ? (
            <Img
              src={imageSrc}
              style={{
                ...styles.profilePhoto,
                ...(isLogoImage ? styles.profileLogoPhoto : undefined),
              }}
            />
          ) : (
            <span style={styles.profileInitials}>{initialsForName(raceRow.name)}</span>
          )}
          <div style={styles.profilePhotoShade} />
        </div>
      );
    })}
  </div>
);

const buildEChartsBarRaceOption = (state: GameConcurrencyFrameState): EChartsOption => {
  const rowSpan = row.height + row.gap;
  const elements: EChartsGraphicElement[] = [
    ...buildEChartsGridElements(rowSpan),
    ...state.rows.map((raceRow) => buildEChartsRowElement({
      barWidth: barWidthForValue(raceRow.value, state.maxValue),
      raceRow,
      top: rowTopForRaceRow(raceRow),
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

const buildEChartsGridElements = (rowSpan: number): EChartsGraphicElement[] => {
  const verticalLines = Array.from({ length: 7 }, (_, index) => {
    const x = barLeft + Math.round((barMaxWidth / 6) * index);

    return {
      type: 'line',
      id: `grid-v-${index}`,
      silent: true,
      shape: { x1: x, y1: 0, x2: x, y2: chart.height },
      style: {
        opacity: 0.13,
        stroke: 'rgba(255,255,255,0.16)',
        lineWidth: 1,
      },
    };
  });
  const horizontalLines = Array.from({ length: onlineGameConcurrencyVideoConfig.topN + 1 }, (_, index) => {
    const y = index * rowSpan;

    return {
      type: 'line',
      id: `grid-h-${index}`,
      silent: true,
      shape: { x1: barLeft, y1: y, x2: barLeft + barMaxWidth, y2: y },
      style: {
        opacity: 0.08,
        stroke: 'rgba(255,255,255,0.12)',
        lineWidth: 1,
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
  raceRow: GameConcurrencyRaceRow;
  top: number;
}): EChartsGraphicElement => {
  const barColor = solidBarColorFor(raceRow);
  const valueColor = valueColorFor(raceRow);
  const displayRank = raceRow.displayRank <= onlineGameConcurrencyVideoConfig.topN
    ? String(raceRow.displayRank)
    : '';
  const rankColor = rankColorFor(raceRow.displayRank);
  const rowOpacity = raceRow.opacity;
  const platformLabel = platformLabelFor(raceRow);

  return {
    type: 'group',
    id: `row-${raceRow.id}`,
    x: 0,
    y: top,
    silent: true,
    z: Math.round(1000 - raceRow.liveRank * 10),
    children: [
      {
        type: 'text',
        id: `rank-${raceRow.id}`,
        x: rankColumnWidth,
        y: 37,
        style: {
          fill: colorWithOpacity(rankColor, rowOpacity),
          fontFamily: fontStack,
          fontSize: 31,
          fontWeight: 950,
          shadowBlur: raceRow.displayRank <= 3 ? 8 : 0,
          shadowColor: raceRow.displayRank <= 3 ? 'rgba(0,0,0,0.52)' : 'transparent',
          text: displayRank,
          textAlign: 'right',
          textVerticalAlign: 'middle',
        },
      },
      {
        type: 'rect',
        id: `bar-${raceRow.id}`,
        shape: {
          height: barHeight,
          r: 6,
          width: barWidth,
          x: barLeft,
          y: 4,
        },
        style: {
          fill: barColor,
          opacity: rowOpacity,
          stroke: 'rgba(255,255,255,0.14)',
          lineWidth: 1,
        },
      },
      {
        type: 'text',
        id: `name-${raceRow.id}`,
        z2: 8,
        x: barLeft + 75,
        y: 37,
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
      },
      {
        type: 'text',
        id: `value-${raceRow.id}`,
        x: valueLeft,
        y: 21,
        style: {
          fill: colorWithOpacity(valueColor, rowOpacity),
          fontFamily: fontStack,
          fontSize: 31,
          fontWeight: 950,
          text: formatConcurrentPlayers(raceRow.value),
          textAlign: 'left',
          textVerticalAlign: 'middle',
        },
      },
      {
        type: 'text',
        id: `platform-${raceRow.id}`,
        x: valueLeft,
        y: 60,
        style: {
          fill: `rgba(255,255,255,${0.68 * rowOpacity})`,
          fontFamily: fontStack,
          fontSize: 21,
          fontWeight: 900,
          overflow: 'truncate',
          text: platformLabel,
          textAlign: 'left',
          textVerticalAlign: 'middle',
          width: valueWidth + 10,
        },
      },
    ],
  };
};

const rowTopForRaceRow = (raceRow: GameConcurrencyRaceRow) =>
  chartRankToY(raceRow.displayRank);

const chartRankToY = (rank: number) => {
  const rowSpan = row.height + row.gap;

  return chartContentTop +
    clamp(Math.round(rank) - 1, 0, onlineGameConcurrencyVideoConfig.topN - 1) * rowSpan;
};

const barWidthForValue = (value: number, maxValue: number) => {
  const ratio = clamp(value / Math.max(1, maxValue), 0, 1);
  const visualRatio = Math.pow(ratio, barVisualScaleExponent);

  return minimumBarWidth + visualRatio * (barMaxWidth - minimumBarWidth);
};

const Footer = () => (
  <div style={styles.simpleFooter}>{onlineGameConcurrencyVideoConfig.source}</div>
);

const imageSourceFor = (imageUrl: string) => {
  if (!imageUrl) {
    return '';
  }

  if (/^https?:\/\//.test(imageUrl) || imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  return staticFile(imageUrl);
};

const formatConcurrentPlayers = (value: number) => {
  const safeValue = Math.max(0, value);

  if (safeValue >= 10_000_000) {
    return `${(safeValue / 1_000_000).toFixed(1)}M`;
  }

  if (safeValue >= 1_000_000) {
    return `${(safeValue / 1_000_000).toFixed(2)}M`;
  }

  if (safeValue >= 100_000) {
    return `${Math.round(safeValue / 1_000)}K`;
  }

  if (safeValue >= 10_000) {
    return `${(safeValue / 1_000).toFixed(1)}K`;
  }

  return Math.round(safeValue).toLocaleString('en-US');
};

const valueColorFor = (raceRow: GameConcurrencyRaceRow) => {
  const from = trendColorFor(raceRow.previousValueTrend);
  const to = trendColorFor(raceRow.valueTrend);
  const progress = raceRow.valueTrendBlend;

  if (
    raceRow.previousValueTrend !== 0 &&
    raceRow.valueTrend !== 0 &&
    raceRow.previousValueTrend !== raceRow.valueTrend
  ) {
    return progress < 0.5
      ? mixHexColors(from, trendColorFor(0), progress * 2)
      : mixHexColors(trendColorFor(0), to, (progress - 0.5) * 2);
  }

  return mixHexColors(from, to, progress);
};

const trendColorFor = (trend: -1 | 0 | 1) => {
  if (trend > 0) {
    return '#22C55E';
  }

  if (trend < 0) {
    return '#FB7185';
  }

  return '#FACC15';
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

const platformLabelFor = (raceRow: GameConcurrencyRaceRow) => {
  const raw = raceRow.platformScope || raceRow.region || raceRow.metricContext;
  const label = raw
    .replace('reported annual peak concurrent players', 'reported peak')
    .replace('annual peak concurrent players', 'annual peak')
    .replace('reported peak concurrent players', 'reported peak')
    .replace('reported peak concurrent users', 'reported peak')
    .replace('Steam co-op/sandbox', 'Steam')
    .replace('Steam co-op shooter', 'Steam');

  return label.length > 18 ? `${label.slice(0, 17).trim()}...` : label;
};

const fontSizeForName = (name: string) => {
  if (name.length > 26) {
    return 21;
  }

  if (name.length > 21) {
    return 24;
  }

  if (name.length > 16) {
    return 27;
  }

  return 32;
};

const compactMapLabel = (name: string) => {
  if (name.length > 18) {
    return `${name.slice(0, 16).trim()}...`;
  }

  return name;
};

const initialsForName = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase() ?? '')
  .join('');

const solidBarColorFor = (raceRow: GameConcurrencyRaceRow) =>
  normalizeHexColor(raceRow.color) ?? flatBarPalette[Math.abs(hashText(raceRow.id)) % flatBarPalette.length];

const normalizeHexColor = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color) ? color : undefined;

const colorWithOpacity = (hexColor: string, opacity: number) => {
  const [red, green, blue] = hexToRgb(hexColor);

  return `rgba(${red},${green},${blue},${opacity})`;
};

const mixHexColors = (fromColor: string, toColor: string, progress: number) => {
  const from = hexToRgb(fromColor);
  const to = hexToRgb(toColor);
  const t = clamp(progress, 0, 1);
  const mixed = from.map((channel, index) =>
    Math.round(channel + (to[index] - channel) * t)
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
  '#C2410C',
  '#4F46E5',
  '#0D9488',
  '#A21CAF',
  '#B45309',
  '#15803D',
  '#1D4ED8',
  '#B91C1C',
  '#0369A1',
  '#9333EA',
] as const;

const styles = {
  background: {
    backgroundColor: '#030712',
    backgroundImage:
      'linear-gradient(180deg, #030712 0%, #06121F 48%, #02030A 100%), repeating-linear-gradient(90deg, rgba(103,232,249,0.08) 0 1px, transparent 1px 112px)',
  },
  chartFrame: {
    background:
      'linear-gradient(180deg, rgba(5,10,22,0.98) 0%, rgba(2,6,18,0.98) 58%, rgba(2,4,12,1) 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 34,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 22px 80px rgba(0,0,0,0.28)',
  },
  chart: {
    height: chart.height,
    inset: 0,
    overflow: 'hidden',
    position: 'absolute',
    transformOrigin: 'center top',
    width: chart.width,
    willChange: 'transform, opacity',
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
  currentYear: {
    color: '#FFFFFF',
    fontSize: 62,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 0.9,
    marginBottom: 10,
    textAlign: 'right',
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
  echartsWorldMapCanvas: {
    height: eChartsMapSize.height,
    inset: 0,
    position: 'absolute',
    width: eChartsMapSize.width,
    zIndex: 2,
  },
  gridOverlay: {
    height: chart.height,
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
    width: chart.width,
  },
  barFill: {
    border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: 6,
    height: barHeight,
    left: barLeft,
    position: 'absolute',
    top: 4,
  },
  barFrontShade: {
    background:
      'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 18%, rgba(0,0,0,0.22) 100%)',
    borderRadius: 6,
    height: barHeight,
    left: barLeft,
    pointerEvents: 'none',
    position: 'absolute',
    top: 4,
    width: barMaxWidth,
  },
  barTrack: {
    background: 'rgba(3,7,18,0.42)',
    border: '1px solid rgba(255,255,255,0.11)',
    borderRadius: 6,
    height: barHeight,
    left: barLeft,
    position: 'absolute',
    top: 4,
    width: barMaxWidth,
  },
  footer: {
    left: 86,
    position: 'absolute',
    right: 86,
    top: chart.top + chart.height + 18,
    zIndex: 7,
  },
  footerNote: {
    color: 'rgba(245,232,41,0.86)',
    flex: '0 0 248px',
    fontSize: 19,
    fontWeight: 900,
    lineHeight: 1.18,
    textAlign: 'right',
  },
  footerRow: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: 26,
    justifyContent: 'space-between',
  },
  footerSource: {
    color: 'rgba(255,255,255,0.52)',
    flex: '1 1 auto',
    fontSize: 20,
    fontWeight: 850,
    lineHeight: 1.25,
  },
  header: {
    left: 86,
    position: 'absolute',
    right: 70,
    top: 208,
    zIndex: 5,
  },
  headerTop: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: 22,
    paddingRight: 174,
  },
  leaderBackdrop: {
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 1,
  },
  leaderBackdropImage: {
    filter: 'blur(7px) saturate(1.08)',
    height: 900,
    left: 430,
    objectFit: 'cover',
    objectPosition: 'center',
    opacity: 0.16,
    position: 'absolute',
    top: 540,
    transformOrigin: 'center',
    width: 820,
  },
  leaderBackdropLogoImage: {
    filter: 'blur(5px) saturate(1.18)',
    objectFit: 'contain',
    opacity: 0.18,
    padding: 86,
  },
  leaderBackdropVeil: {
    background:
      'linear-gradient(90deg, rgba(3,7,18,0.68) 0%, rgba(3,7,18,0.24) 48%, rgba(3,7,18,0.54) 100%), linear-gradient(180deg, rgba(3,7,18,0.46) 0%, rgba(3,7,18,0.08) 38%, rgba(3,7,18,0.68) 100%)',
    inset: 0,
    position: 'absolute',
  },
  leaderColorWash: {
    filter: 'blur(10px)',
    inset: 0,
    opacity: 0.92,
    position: 'absolute',
  },
  legend: {
    color: 'rgba(255,255,255,0.56)',
    display: 'flex',
    fontSize: 22,
    fontWeight: 950,
    justifyContent: 'space-between',
    left: chart.left + barLeft,
    letterSpacing: 0,
    position: 'absolute',
    top: chart.top - 46,
    width: valueLeft + valueWidth - barLeft,
    zIndex: 6,
  },
  metaText: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 18,
    fontWeight: 850,
    height: 22,
    left: valueLeft,
    lineHeight: '22px',
    overflow: 'hidden',
    position: 'absolute',
    textOverflow: 'ellipsis',
    textTransform: 'uppercase',
    top: 47,
    whiteSpace: 'nowrap',
    width: valueWidth + 10,
  },
  mapOnlyChart: {
    background:
      'radial-gradient(circle at 50% 47%, rgba(37,99,235,0.24), rgba(0,0,0,0) 58%)',
    height: eChartsMapSize.height,
    inset: 0,
    overflow: 'hidden',
    position: 'absolute',
    width: eChartsMapSize.width,
  },
  mapOnlySvg: {
    height: eChartsMapSize.height,
    inset: 0,
    position: 'absolute',
    width: eChartsMapSize.width,
    zIndex: 2,
  },
  mapOnlyVignette: {
    background:
      'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.12) 67%, rgba(0,0,0,0.62) 100%)',
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 6,
  },
  note: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 1.25,
    marginTop: 10,
  },
  profileInitials: {
    alignItems: 'center',
    color: '#FFFFFF',
    display: 'flex',
    fontSize: 18,
    fontWeight: 950,
    inset: 0,
    justifyContent: 'center',
    lineHeight: 1,
    position: 'absolute',
  },
  profilePhoto: {
    display: 'block',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    width: '100%',
  },
  profilePhotoFrame: {
    background: 'linear-gradient(135deg, rgba(248,250,252,0.96), rgba(148,163,184,0.42))',
    borderRadius: 6,
    boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.22), 0 10px 18px rgba(0,0,0,0.32)',
    height: 52,
    isolation: 'isolate',
    left: barLeft + 8,
    overflow: 'hidden',
    position: 'absolute',
    top: 11,
    width: 52,
  },
  profileLogoPhoto: {
    objectFit: 'contain',
    padding: 5,
  },
  profilePhotoShade: {
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(0,0,0,0) 42%, rgba(0,0,0,0.22))',
    inset: 0,
    position: 'absolute',
    zIndex: 2,
  },
  profileOverlay: {
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 10,
  },
  scanlines: {
    backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 6px)',
    inset: 0,
    opacity: 0.16,
    position: 'absolute',
  },
  raceRow: {
    height: row.height,
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    width: chart.width,
    willChange: 'top, opacity',
  },
  rankNumber: {
    alignItems: 'center',
    display: 'flex',
    fontSize: 31,
    fontWeight: 950,
    height: row.height,
    justifyContent: 'flex-end',
    left: 0,
    lineHeight: 1,
    position: 'absolute',
    top: 0,
    width: rankColumnWidth,
  },
  rowLayer: {
    inset: 0,
    position: 'absolute',
  },
  rowName: {
    color: '#FFFFFF',
    fontWeight: 950,
    height: barHeight,
    left: barLeft + 75,
    lineHeight: `${barHeight}px`,
    overflow: 'hidden',
    position: 'absolute',
    textOverflow: 'ellipsis',
    textShadow: '0 3px 8px rgba(0,0,0,0.7)',
    top: 4,
    whiteSpace: 'nowrap',
    width: valueLeft - barLeft - 96,
  },
  source: {
    color: 'rgba(255,255,255,0.64)',
    fontSize: 20,
    fontWeight: 850,
    lineHeight: 1.28,
  },
  simpleCurrentYear: {
    color: '#FFFFFF',
    fontSize: 52,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 0.95,
    marginBottom: 7,
    textAlign: 'center',
    textShadow: '0 7px 18px rgba(0,0,0,0.5)',
  },
  simpleFooter: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 22,
    fontWeight: 850,
    left: 96,
    lineHeight: 1.22,
    position: 'absolute',
    right: 96,
    textAlign: 'center',
    top: frameLayout.footerTop,
    zIndex: 8,
  },
  simpleHeader: {
    left: 72,
    position: 'absolute',
    right: 72,
    textAlign: 'center',
    top: chart.top - 388,
    zIndex: 5,
  },
  simpleHook: {
    color: accentColor,
    fontSize: 53,
    fontStyle: 'italic',
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 0.98,
    marginTop: 8,
    textShadow: '0 6px 16px rgba(0,0,0,0.54)',
  },
  simpleKicker: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 20,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
    marginBottom: 18,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  simpleMeta: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 22,
    fontWeight: 850,
    lineHeight: 1.18,
    marginTop: 18,
  },
  simpleTimeline: {
    left: frameLayout.frameInset.left,
    position: 'absolute',
    right: frameLayout.frameInset.right,
    textAlign: 'center',
    top: chart.top - 82,
    zIndex: 7,
  },
  simpleTimelineHandle: {
    background: 'rgba(0,0,0,0.72)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 999,
    color: 'rgba(255,255,255,0.52)',
    fontSize: 27,
    fontWeight: 950,
    left: 24,
    lineHeight: '32px',
    padding: '3px 14px 5px',
    position: 'absolute',
    textAlign: 'left',
    textShadow: '0 2px 7px rgba(0,0,0,0.62)',
    top: 48,
    zIndex: 20,
  },
  simpleTitle: {
    color: '#FFFFFF',
    fontSize: 56,
    fontStyle: 'italic',
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 0.98,
    textShadow: '0 6px 16px rgba(0,0,0,0.54)',
  },
  simpleYearRange: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 22,
    fontWeight: 850,
    lineHeight: 1,
  },
  stage: {
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontFamily: fontStack,
    overflow: 'hidden',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 23,
    fontWeight: 800,
    lineHeight: 1.22,
    marginTop: 8,
  },
  title: {
    color: '#67E8F9',
    fontSize: 58,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 0.96,
    textShadow: '0 5px 18px rgba(0,0,0,0.5)',
    maxWidth: 720,
  },
  titleHook: {
    color: '#FFFFFF',
    fontSize: 39,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1.05,
    marginTop: 13,
    textShadow: '0 5px 18px rgba(0,0,0,0.64)',
    whiteSpace: 'nowrap',
  },
  valueText: {
    fontSize: 31,
    fontWeight: 950,
    height: 36,
    left: valueLeft,
    lineHeight: '36px',
    position: 'absolute',
    top: 7,
    whiteSpace: 'nowrap',
  },
  worldMapChart: {
    inset: 0,
    overflow: 'hidden',
    position: 'absolute',
    width: chart.width,
    height: chart.height,
  },
  worldMapEyebrow: {
    color: 'rgba(248,216,75,0.76)',
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  worldMapHeader: {
    alignItems: 'flex-start',
    display: 'flex',
    justifyContent: 'space-between',
    left: 46,
    position: 'absolute',
    right: 44,
    top: 38,
    zIndex: 4,
  },
  worldMapLeaderName: {
    color: 'rgba(255,255,255,0.94)',
    flex: '1 1 auto',
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  worldMapLeaderboard: {
    background: 'rgba(0,0,0,0.32)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 18,
    bottom: 42,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
    display: 'grid',
    gap: 0,
    left: 46,
    overflow: 'hidden',
    position: 'absolute',
    right: 46,
    zIndex: 5,
  },
  worldMapLeaderRow: {
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    gap: 16,
    height: 58,
    padding: '0 22px',
  },
  worldMapLeaderValue: {
    flex: '0 0 108px',
    fontSize: 24,
    fontWeight: 950,
    lineHeight: 1,
    textAlign: 'right',
  },
  worldMapMetric: {
    alignItems: 'flex-end',
    display: 'flex',
    flexDirection: 'column',
    marginTop: 1,
  },
  worldMapMetricLabel: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 15,
    fontWeight: 850,
    lineHeight: 1,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  worldMapMetricValue: {
    color: '#22C55E',
    fontSize: 36,
    fontWeight: 950,
    lineHeight: 0.9,
  },
  worldMapRank: {
    flex: '0 0 54px',
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1,
  },
  worldMapSvg: {
    height: 700,
    left: 6,
    position: 'absolute',
    top: 104,
    width: chart.width - 12,
    zIndex: 2,
  },
  worldMapTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 950,
    lineHeight: 1.04,
    maxWidth: 560,
  },
  topShadow: {
    background:
      'linear-gradient(180deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.14) 34%, rgba(0,0,0,0.76) 100%)',
    inset: 0,
    position: 'absolute',
  },
} satisfies Record<string, CSSProperties>;
