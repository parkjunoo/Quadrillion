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
import {
  buildMarketValueRaceData,
  getMarketValueFrameState,
  type MarketValueFrameState,
  type MarketValueRaceData,
  type MarketValueRaceRow,
} from './marketValueRace';
import { marketValueVideoConfig } from './config';
import { SHORTS_PLATFORM_TOP_CLEARANCE } from '../../shared/video';
import {
  SHORTS_OUTRO_SECONDS,
  ShortsOutro,
} from '../../shared/shortsAnimations';

const chartData = buildMarketValueRaceData(marketValueVideoConfig.csv, {
  dataCadence: marketValueVideoConfig.dataCadence,
  startDate: marketValueVideoConfig.startDate,
});
const fontStack =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const emojiFontStack = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const templateTopOffset = SHORTS_PLATFORM_TOP_CLEARANCE;
const channelHandle = '@whoa-data';
const finalSettleSeconds = SHORTS_OUTRO_SECONDS;
const chart = {
  left: 58,
  top: 535 + templateTopOffset,
  width: 965,
  height: 920,
};
const row = {
  height: 74,
  gap: 18,
};
const rankColumnWidth = 46;
const barLeft = 66;
const barMaxWidth = 692;
const valueLeft = 778;
const valueWidth = 178;
const barHeight = 66;
const flagWatermark = {
  centerX: barLeft + 255,
  opacity: 0.11,
  size: 232,
};
const yearRail = {
  left: 118,
  top: 332 + templateTopOffset,
  width: 842,
};
const outroCopy = {
  accentColor: '#F5E829',
  channelHandle,
  kicker: 'NEXT SPORTS DATA STORY',
  secondaryColor: '#22C55E',
  subtitle: 'Follow for the next chart story',
  title: 'More value races',
};

export const FootballMarketValueVideo = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const finalSettleFrames = Math.round(finalSettleSeconds * fps);
  const motionFrames = Math.max(1, durationInFrames - finalSettleFrames);
  const raceFrame = clamp(frame, 0, motionFrames - 1);
  const state = getMarketValueFrameState({
    data: chartData,
    frame: raceFrame,
    durationInFrames: motionFrames,
    topN: marketValueVideoConfig.topN,
  });
  const intro = 1;
  const progress = (state.monthIndex - chartData.minMonthIndex) /
    Math.max(1, chartData.maxMonthIndex - chartData.minMonthIndex);

  const currentPeriod = marketValueVideoConfig.timeLabelCadence === 'yearly'
    ? formatTimelineYear(state.year)
    : formatTimelineMonth(state.year, state.month);

  return (
    <AbsoluteFill style={styles.stage}>
      <Background />
      <Header intro={intro} />
      <YearRail currentMonth={currentPeriod} intro={intro} progress={progress} />
      <ValueLegend intro={intro} />
      <BarRaceChart intro={intro} state={state} />
      <Footer />
      <ShortsOutro copy={outroCopy} durationInFrames={durationInFrames} fps={fps} frame={frame} />
    </AbsoluteFill>
  );
};

const Header = ({ intro }: { intro: number }) => {
  const y = interpolate(intro, [0, 1], [-28, 0]);

  return (
    <div style={{ ...styles.header, opacity: intro, transform: `translateY(${y}px)` }}>
      <div style={styles.headerTop}>
        <div style={styles.title}>{marketValueVideoConfig.title}</div>
        <div style={styles.channelTag}>{channelHandle}</div>
      </div>
      <div style={styles.titleHook}>{marketValueVideoConfig.titleHook}</div>
      <div style={styles.subtitle}>{marketValueVideoConfig.subtitle}</div>
    </div>
  );
};

const YearRail = ({
  currentMonth,
  intro,
  progress,
}: {
  currentMonth: string;
  intro: number;
  progress: number;
}) => {
  const fillWidth = clamp(progress, 0, 1) * yearRail.width;

  return (
    <div style={{ ...styles.yearRailBlock, opacity: intro }}>
      <div style={styles.currentMonth}>{currentMonth}</div>
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

const ValueLegend = ({ intro }: { intro: number }) => (
  <div style={{ ...styles.legend, opacity: intro }}>
    <span>{marketValueVideoConfig.dateLabel}</span>
    <span>{marketValueVideoConfig.valueColumnLabel}</span>
  </div>
);

const BarRaceChart = ({
  intro,
  state,
}: {
  intro: number;
  state: MarketValueFrameState;
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
      <ClubLogoOverlay state={state} />
      <ProfilePhotoOverlay state={state} />
    </div>
  );
};

type EChartsGraphicElement = Record<string, unknown>;

const chartRankToY = (rank: number) => {
  const rowSpan = row.height + row.gap;

  return clamp((rank - 1) / (marketValueVideoConfig.topN + 0.35), 0, 1.08) *
    ((marketValueVideoConfig.topN + 0.35) * rowSpan);
};

const barWidthForValue = (value: number, maxValue: number) =>
  clamp(value / Math.max(1, maxValue), 0, 1) * barMaxWidth;

const ProfilePhotoOverlay = ({ state }: { state: MarketValueFrameState }) => (
  <div style={styles.profileOverlay}>
    {state.rows.map((raceRow) => {
      const top = chartRankToY(raceRow.animatedRank);

      return (
        <div
          key={`photo-${raceRow.id}`}
          style={{
            ...styles.profilePhotoFrame,
            opacity: raceRow.opacity,
            top: top + 11,
          }}
        >
          {raceRow.imageUrl ? (
            <Img
              src={raceRow.imageUrl}
              style={styles.profilePhoto}
            />
          ) : (
            <span style={styles.profileInitials}>{initialsForName(raceRow.name)}</span>
          )}
          <div style={styles.profilePhotoSoftMask} />
        </div>
      );
    })}
  </div>
);

const ClubLogoOverlay = ({ state }: { state: MarketValueFrameState }) => (
  <div style={styles.clubLogoOverlay}>
    {state.rows.map((raceRow) => {
      const logoPath = clubLogoPathFor(raceRow.club);

      if (!logoPath) {
        return null;
      }

      const top = chartRankToY(raceRow.animatedRank);
      const currentBarWidth = barWidthForValue(raceRow.value, state.maxValue);

      return (
        <div
          key={`club-logo-${raceRow.id}`}
          style={{
            ...styles.clubLogoFrame,
            left: barLeft + Math.max(92, currentBarWidth) - 61,
            opacity: raceRow.opacity,
            top: top + 12,
          }}
        >
          <Img src={staticFile(logoPath)} style={styles.clubLogo} />
        </div>
      );
    })}
  </div>
);

const buildEChartsBarRaceOption = (state: MarketValueFrameState): EChartsOption => {
  const rowSpan = row.height + row.gap;
  const elements: EChartsGraphicElement[] = [
    ...buildEChartsGridElements(rowSpan),
    ...state.rows.map((raceRow) => buildEChartsRowElement({
      raceRow,
      top: chartRankToY(raceRow.animatedRank),
      valueWidth: Math.max(92, barWidthForValue(raceRow.value, state.maxValue)),
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
  const horizontalLines = Array.from({ length: marketValueVideoConfig.topN + 1 }, (_, index) => {
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
  raceRow,
  top,
  valueWidth: currentBarWidth,
}: {
  raceRow: MarketValueRaceRow;
  top: number;
  valueWidth: number;
}): EChartsGraphicElement => {
  const barColor = solidBarColorFor(raceRow.id);
  const valueColor = valueColorFor(raceRow);
  const displayRank = raceRow.displayRank <= marketValueVideoConfig.topN
    ? String(raceRow.displayRank)
    : '';
  const rankColor = rankColorFor(raceRow.displayRank);
  const nameFontSize = fontSizeForName(raceRow.name);
  const flag = flagForCountry(raceRow.country);
  const rowOpacity = raceRow.opacity;
  const clubChangeOpacity = raceRow.clubChangePulse * rowOpacity;
  const isClubChanging = clubChangeOpacity > 0.02;
  const clubTransitionProgress = smootherStep(raceRow.clubChangeProgress);
  const previousClubLabel = shortClubName(
    raceRow.clubChangedFrom || raceRow.previousClub || raceRow.club,
  );
  const currentClubLabel = shortClubName(raceRow.clubChangedTo || raceRow.club);
  const clubTextSize = 21;
  const clubTextY = 60;

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
          width: currentBarWidth,
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
      buildFlagWatermarkElement(raceRow.id, flag, currentBarWidth, rowOpacity),
      {
        type: 'rect',
        id: `avatar-bg-${raceRow.id}`,
        shape: {
          height: 52,
          r: 6,
          width: 52,
          x: barLeft + 8,
          y: 11,
        },
        style: {
          fill: 'rgba(0,0,0,0.42)',
          opacity: rowOpacity,
          stroke: 'rgba(255,255,255,0.18)',
          lineWidth: 2,
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
          fontSize: nameFontSize,
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
          text: formatMarketValue(raceRow.value),
          textAlign: 'left',
          textVerticalAlign: 'middle',
        },
      },
      ...(isClubChanging ? [
        {
          type: 'rect',
          id: `club-change-bg-${raceRow.id}`,
          x: 0,
          y: 0,
          shape: {
            height: 34,
            r: 7,
            width: valueWidth + 10,
            x: valueLeft - 7,
            y: 39,
          },
          style: {
            fill: `rgba(245,232,41,${0.18 + clubChangeOpacity * 0.2})`,
            opacity: clubChangeOpacity,
            stroke: `rgba(245,232,41,${0.4 + clubChangeOpacity * 0.35})`,
            lineWidth: 1.5,
          },
        },
        {
          type: 'line',
          id: `club-change-line-${raceRow.id}`,
          silent: true,
          shape: {
            x1: valueLeft - 3,
            x2: valueLeft - 3 + valueWidth * (0.35 + 0.65 * (1 - raceRow.clubChangeProgress)),
            y1: 73,
            y2: 73,
          },
          style: {
            opacity: clubChangeOpacity,
            stroke: '#F5E829',
            lineWidth: 3,
          },
        },
      ] : []),
      ...(isClubChanging ? [
        {
          type: 'text',
          id: `club-old-${raceRow.id}`,
          x: valueLeft + clubTransitionProgress * 32,
          y: clubTextY,
          style: {
            fill: `rgba(255,255,255,${0.5 * (1 - clubTransitionProgress) * rowOpacity})`,
            fontFamily: fontStack,
            fontSize: clubTextSize,
            fontWeight: 900,
            overflow: 'truncate',
            text: previousClubLabel,
            textAlign: 'left',
            textVerticalAlign: 'middle',
            width: valueWidth,
          },
        },
        {
          type: 'text',
          id: `club-new-${raceRow.id}`,
          x: valueLeft - (1 - clubTransitionProgress) * 32,
          y: clubTextY,
          style: {
            fill: `rgba(245,232,41,${Math.min(1, clubTransitionProgress * rowOpacity)})`,
            fontFamily: fontStack,
            fontSize: clubTextSize,
            fontWeight: 950,
            overflow: 'truncate',
            text: currentClubLabel,
            textAlign: 'left',
            textVerticalAlign: 'middle',
            width: valueWidth,
          },
        },
      ] : [{
        type: 'text',
        id: `club-${raceRow.id}`,
        x: valueLeft,
        y: clubTextY,
        style: {
          fill: `rgba(255,255,255,${0.68 * rowOpacity})`,
          fontFamily: fontStack,
          fontSize: clubTextSize,
          fontWeight: 900,
          overflow: 'truncate',
          text: currentClubLabel,
          textAlign: 'left',
          textVerticalAlign: 'middle',
          width: valueWidth,
        },
      }]),
    ],
  };
};

const buildFlagWatermarkElement = (
  id: string,
  flag: string,
  currentBarWidth: number,
  rowOpacity: number,
) => ({
  type: 'group',
  id: `flag-watermark-${id}`,
  clipPath: {
    type: 'rect',
    shape: {
      height: barHeight,
      width: currentBarWidth,
      x: barLeft,
      y: 4,
    },
  },
  silent: true,
  children: [{
    type: 'text',
    id: `flag-watermark-icon-${id}`,
    x: flagWatermark.centerX,
    y: 38,
    style: {
      fontFamily: emojiFontStack,
      fontSize: flagWatermark.size,
      opacity: flagWatermark.opacity * rowOpacity,
      text: flag,
      textAlign: 'center',
      textVerticalAlign: 'middle',
    },
  }],
});

type VoronoiTreemapLayout = {
  cells: TerritoryCell[];
  columns: number;
  rows: number;
  sites: TerritorySite[];
  tileSize: number;
};

type TerritoryCell = {
  ownerIndex: number;
  x: number;
  y: number;
};

type TerritorySite = {
  anchorX: number;
  anchorY: number;
  cellCount: number;
  cellShare: number;
  color: string;
  centroidX: number;
  centroidY: number;
  labelScale: number;
  logoPath: string;
  row: MarketValueRaceRow;
  weightShare: number;
};

const territoryTileSize = 10;
const territoryTileGap = 1;
const territoryPadding = 0;

const territoryRankAnchors = [
  { x: 0.55, y: 0.43 },
  { x: 0.24, y: 0.73 },
  { x: 0.84, y: 0.48 },
  { x: 0.25, y: 0.28 },
  { x: 0.52, y: 0.64 },
  { x: 0.47, y: 0.18 },
  { x: 0.67, y: 0.76 },
  { x: 0.78, y: 0.23 },
  { x: 0.15, y: 0.50 },
  { x: 0.38, y: 0.84 },
  { x: 0.90, y: 0.76 },
  { x: 0.12, y: 0.18 },
] as const;

const TerritoryLabel = ({ site }: { site: TerritorySite }) => {
  const { row } = site;
  const labelWidth = Math.round(clamp(140 + site.cellShare * 760, 150, 248));
  const labelX = clamp(site.centroidX, labelWidth / 2 + 12, chart.width - labelWidth / 2 - 12);
  const labelY = clamp(site.centroidY, 82, chart.height - 86);
  const photoSize = Math.round(clamp(44 + site.cellShare * 260, 50, 86));
  const showDetails = site.cellShare > 0.025;
  const showClub = site.cellShare > 0.045;
  const displayName = territoryDisplayName(row.name);
  const rankNameText = `#${row.displayRank} ${displayName}`;
  const rankNameFontSize = Math.round(
    clamp((labelWidth / Math.max(8, rankNameText.length)) * 1.42, 22, 31),
  );

  if (site.cellCount < 12 || row.opacity < 0.04) {
    return null;
  }

  return (
    <div
      style={{
        ...styles.territoryLabel,
        left: labelX,
        opacity: clamp(row.opacity * 1.18, 0, 1),
        top: labelY,
        transform: `translate(-50%, -50%) scale(${site.labelScale})`,
        width: labelWidth,
        zIndex: 40 - Math.min(30, row.liveRank),
      }}
    >
      {showDetails ? (
        <div
          style={{
            ...styles.territoryPhotoFrame,
            height: photoSize,
            width: photoSize,
          }}
        >
          {row.imageUrl ? (
            <Img src={row.imageUrl} style={styles.territoryPhoto} />
          ) : (
            <span style={styles.territoryInitials}>{initialsForName(row.name)}</span>
          )}
          {site.logoPath ? (
            <div style={styles.territoryClubLogoBadge}>
              <Img src={staticFile(site.logoPath)} style={styles.territoryClubLogo} />
            </div>
          ) : null}
        </div>
      ) : null}
      <div style={{ ...styles.territoryRankName, fontSize: rankNameFontSize }}>
        {rankNameText}
      </div>
      <div style={styles.territoryValue}>{formatMarketValue(row.value)}</div>
      {showClub ? (
        <div style={styles.territoryClub}>{shortClubName(row.club)}</div>
      ) : null}
    </div>
  );
};

const buildVoronoiTreemapLayout = (state: MarketValueFrameState): VoronoiTreemapLayout => {
  const visibleRows = state.rows
    .filter((raceRow) => raceRow.value > 0.001 && raceRow.opacity > 0.025)
    .sort((a, b) => a.animatedRank - b.animatedRank)
    .slice(0, marketValueVideoConfig.topN + 2);
  const weightedValues = visibleRows.map((raceRow) =>
    Math.max(raceRow.value, state.maxValue * 0.01) * Math.pow(clamp(raceRow.opacity, 0, 1), 0.62)
  );
  const totalWeight = weightedValues.reduce((sum, value) => sum + value, 0) || 1;
  const sites: TerritorySite[] = visibleRows.map((raceRow, index) => {
    const anchor = territoryAnchorForRank(raceRow.animatedRank, raceRow.id);
    const weightShare = weightedValues[index] / totalWeight;

    return {
      anchorX: anchor.x,
      anchorY: anchor.y,
      cellCount: 0,
      cellShare: 0,
      color: solidBarColorFor(raceRow.id),
      centroidX: anchor.x,
      centroidY: anchor.y,
      labelScale: 1,
      logoPath: clubLogoPathFor(raceRow.club),
      row: raceRow,
      weightShare,
    };
  });
  const columns = Math.ceil(chart.width / territoryTileSize);
  const rows = Math.ceil(chart.height / territoryTileSize);
  const cells: TerritoryCell[] = [];
  const centroidSums = sites.map(() => ({ count: 0, x: 0, y: 0 }));

  if (!sites.length) {
    return { cells, columns, rows, sites, tileSize: territoryTileSize };
  }

  for (let gridY = 0; gridY < rows; gridY += 1) {
    for (let gridX = 0; gridX < columns; gridX += 1) {
      const x = Math.min(chart.width - 0.5, gridX * territoryTileSize + territoryTileSize / 2);
      const y = Math.min(chart.height - 0.5, gridY * territoryTileSize + territoryTileSize / 2);
      const ownerIndex = territoryOwnerForPoint(x, y, sites);

      cells.push({
        ownerIndex,
        x: gridX * territoryTileSize,
        y: gridY * territoryTileSize,
      });
      centroidSums[ownerIndex].count += 1;
      centroidSums[ownerIndex].x += x;
      centroidSums[ownerIndex].y += y;
    }
  }

  const cellTotal = Math.max(1, cells.length);

  return {
    cells,
    columns,
    rows,
    sites: sites.map((site, index) => {
      const centroid = centroidSums[index];
      const cellShare = centroid.count / cellTotal;

      return {
        ...site,
        cellCount: centroid.count,
        cellShare,
        centroidX: centroid.count ? centroid.x / centroid.count : site.anchorX,
        centroidY: centroid.count ? centroid.y / centroid.count : site.anchorY,
        labelScale: clamp(0.62 + Math.sqrt(Math.max(cellShare, site.weightShare)) * 1.72, 0.68, 1.22),
      };
    }),
    tileSize: territoryTileSize,
  };
};

const territoryOwnerForPoint = (x: number, y: number, sites: TerritorySite[]) => {
  let bestIndex = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  const chartScale = Math.max(chart.width, chart.height);

  for (let index = 0; index < sites.length; index += 1) {
    const site = sites[index];
    const dx = x - site.anchorX;
    const dy = y - site.anchorY;
    const radius = Math.sqrt(site.weightShare) * chartScale * 0.92;
    const score = dx * dx + dy * dy - radius * radius;

    if (score < bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  }

  return bestIndex;
};

const territoryAnchorForRank = (rank: number, id: string) => {
  const slot = clamp(rank, 1, territoryRankAnchors.length);
  const lowerIndex = Math.floor(slot) - 1;
  const upperIndex = Math.min(territoryRankAnchors.length - 1, lowerIndex + 1);
  const progress = smootherStep(slot - Math.floor(slot));
  const lower = territoryRankAnchors[Math.max(0, lowerIndex)];
  const upper = territoryRankAnchors[upperIndex];
  const jitterX = (hashUnit(`${id}:x`) - 0.5) * 38;
  const jitterY = (hashUnit(`${id}:y`) - 0.5) * 34;

  return {
    x: clamp(
      (lower.x + (upper.x - lower.x) * progress) * chart.width + jitterX,
      42,
      chart.width - 42,
    ),
    y: clamp(
      (lower.y + (upper.y - lower.y) * progress) * chart.height + jitterY,
      42,
      chart.height - 42,
    ),
  };
};

const drawVoronoiTreemap = (
  canvas: HTMLCanvasElement | null,
  layout: VoronoiTreemapLayout,
) => {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext('2d');

  if (!context) {
    return;
  }

  context.clearRect(0, 0, chart.width, chart.height);
  context.fillStyle = '#04140E';
  context.fillRect(0, 0, chart.width, chart.height);

  for (const cell of layout.cells) {
    const site = layout.sites[cell.ownerIndex];

    if (!site) {
      continue;
    }

    const [red, green, blue] = hexToRgb(site.color);
    const alpha = clamp(0.62 + site.row.opacity * 0.34, 0.12, 0.96);

    context.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
    context.fillRect(
      cell.x + territoryPadding,
      cell.y + territoryPadding,
      Math.max(1, layout.tileSize - territoryTileGap),
      Math.max(1, layout.tileSize - territoryTileGap),
    );
  }

  context.globalCompositeOperation = 'screen';
  for (const site of layout.sites) {
    if (site.cellCount < 24) {
      continue;
    }

    const [red, green, blue] = hexToRgb(site.color);
    const radius = clamp(Math.sqrt(site.cellShare) * 640, 80, 250);
    const glow = context.createRadialGradient(
      site.centroidX,
      site.centroidY,
      0,
      site.centroidX,
      site.centroidY,
      radius,
    );

    glow.addColorStop(0, `rgba(${red},${green},${blue},${0.18 * site.row.opacity})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, chart.width, chart.height);
  }
  context.globalCompositeOperation = 'source-over';

  context.strokeStyle = 'rgba(255,255,255,0.22)';
  context.lineWidth = 3;
  context.strokeRect(1.5, 1.5, chart.width - 3, chart.height - 3);
};

const Footer = () => (
  <div style={styles.footer}>
    <div style={styles.source}>{marketValueVideoConfig.source}</div>
    <div style={styles.note}>Every player who appears in the source top 10 at least once is included in the tracked pool.</div>
  </div>
);

const Background = () => (
  <AbsoluteFill style={styles.background}>
    <div style={styles.pitchLines} />
    <div style={styles.topShadow} />
    <div style={styles.chartGlow} />
  </AbsoluteFill>
);

const formatTimelineMonth = (year: number, month: number) =>
  `${year}.${String(month).padStart(2, '0')}`;

const formatTimelineYear = (year: number) => String(year);

const formatMarketValue = (value: number) => {
  const safeValue = Math.max(0, value);

  if (safeValue >= 1) {
    return `€${safeValue.toFixed(2)}M`;
  }

  return `€${safeValue.toFixed(3)}M`;
};

const valueColorFor = (raceRow: MarketValueRaceRow) => {
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
    return '#EF4444';
  }

  return '#F9D36B';
};

const rankColorFor = (rank: number) => {
  if (rank === 1) {
    return '#F9D36B';
  }

  if (rank === 2) {
    return '#D9E0EA';
  }

  if (rank === 3) {
    return '#D38B4A';
  }

  return '#FFFFFF';
};

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

const fontSizeForName = (name: string) => {
  if (name.length > 18) {
    return 25;
  }

  if (name.length > 14) {
    return 28;
  }

  return 32;
};

const initialsForName = (name: string) => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase() ?? '')
  .join('');

const territoryDisplayName = (name: string) => {
  if (name.length <= 16) {
    return name;
  }

  return `${name.slice(0, 15).trim()}...`;
};

const clubLogoPathFor = (club: string) => {
  const key = clubLogoKeyFor(club);
  const slug = clubLogoSlugByKey[key];

  return slug ? `projects/football-market-values/club-logos/${slug}.png` : '';
};

const clubLogoKeyFor = (club: string) => {
  const normalized = club
    .trim()
    .replace(/\s+/g, ' ')
    .replace('Paris Saint-Germain Football Club', 'Paris Saint-Germain')
    .replace('Real Madrid Club de Fútbol', 'Real Madrid')
    .replace('Manchester City Football Club', 'Manchester City')
    .replace('Manchester United Football Club', 'Manchester United')
    .replace('Arsenal Football Club', 'Arsenal FC')
    .replace('Liverpool Football Club', 'Liverpool FC')
    .replace('Chelsea Football Club', 'Chelsea FC')
    .replace('Juventus Football Club', 'Juventus FC')
    .replace('Futbol Club Barcelona', 'FC Barcelona')
    .replace('Football Club Internazionale Milano S.p.A.', 'Inter Milan')
    .replace('Club Atlético de Madrid S.A.D.', 'Atletico Madrid')
    .replace('Società Sportiva Calcio Napoli', 'SSC Napoli');

  return clubLogoAliases[normalized] ?? normalized;
};

const clubLogoAliases: Record<string, string> = {
  'AC Milan': 'AC Milan',
  'Arsenal FC': 'Arsenal',
  'AS Monaco': 'AS Monaco',
  'AS Roma': 'AS Roma',
  'Atletico Madrid': 'Atletico Madrid',
  'Atlético de Madrid': 'Atletico Madrid',
  'Bayer 04 Leverkusen': 'Bayer Leverkusen',
  'Bayern Munich': 'Bayern Munich',
  'Borussia Dortmund': 'Borussia Dortmund',
  'Chelsea FC': 'Chelsea',
  'FC Barcelona': 'Barcelona',
  'FC Bayern München': 'Bayern Munich',
  'FC Internazionale': 'Inter Milan',
  'Inter Milan': 'Inter Milan',
  'Juventus FC': 'Juventus',
  'Liverpool FC': 'Liverpool',
  'Manchester City': 'Manchester City',
  'Manchester United': 'Manchester United',
  'Newcastle United': 'Newcastle United',
  'Paris Saint-Germain': 'Paris Saint-Germain',
  'Real Madrid': 'Real Madrid',
  'Real Madrid B': 'Real Madrid',
  'Santos FC': 'Santos',
  'Santos Futebol Clube': 'Santos',
  'SSC Napoli': 'SSC Napoli',
  'SV Werder Bremen': 'Werder Bremen',
  'Tottenham Hotspur': 'Tottenham Hotspur',
  'Tottenham Hotspur FC': 'Tottenham Hotspur',
  'Valencia CF': 'Valencia',
  'West Ham United': 'West Ham United',
  'Zenit St. Petersburg': 'Zenit St. Petersburg',
};

const clubLogoSlugByKey: Record<string, string> = {
  'AC Milan': 'ac_milan',
  Arsenal: 'arsenal',
  'AS Monaco': 'monaco',
  'AS Roma': 'roma',
  'Atletico Madrid': 'atletico',
  Barcelona: 'barcelona',
  'Bayer Leverkusen': 'leverkusen',
  'Bayern Munich': 'bayern',
  'Borussia Dortmund': 'dortmund',
  Chelsea: 'chelsea',
  'Inter Milan': 'inter',
  Juventus: 'juventus',
  Liverpool: 'liverpool',
  'Manchester City': 'man_city',
  'Manchester United': 'man_united',
  'Newcastle United': 'newcastle',
  'Paris Saint-Germain': 'psg',
  'Real Madrid': 'real_madrid',
  Santos: 'santos',
  'SSC Napoli': 'napoli',
  'Tottenham Hotspur': 'tottenham',
  Valencia: 'valencia',
  'Werder Bremen': 'werder_bremen',
  'West Ham United': 'west_ham',
  'Zenit St. Petersburg': 'zenit',
};

const shortClubName = (club: string) => {
  const normalized = club
    .replace('Paris Saint-Germain Football Club', 'Paris Saint-Germain')
    .replace('Real Madrid Club de Fútbol', 'Real Madrid')
    .replace('Manchester City Football Club', 'Manchester City')
    .replace('Manchester United Football Club', 'Manchester United')
    .replace('Futbol Club Barcelona', 'FC Barcelona')
    .replace('Football Club Internazionale Milano S.p.A.', 'Inter Milan')
    .replace('Club Atlético de Madrid S.A.D.', 'Atletico Madrid')
    .replace('Club Internacional de Fútbol Miami', 'Inter Miami')
    .replace('Società Sportiva Calcio Napoli', 'SSC Napoli')
    .replace('Associazione Calcio', 'AC')
    .replace('Associazione Sportiva', 'AS')
    .replace('Football Club', 'FC')
    .replace('Club de Fútbol', 'CF')
    .replace('Fútbol Club', 'FC')
    .replace('Sporting Club de Portugal', 'Sporting CP');

  return clubAliases[normalized] ?? normalized;
};

const clubAliases: Record<string, string> = {
  'Paris Saint-Germain': 'PSG',
  'FC Barcelona': 'Barcelona',
  'Manchester City': 'Man City',
  'Manchester United': 'Man United',
  'Atletico Madrid': 'Atletico',
  'Bayern Munich': 'Bayern',
  'FC Bayern München': 'Bayern',
  'Borussia Dortmund': 'Dortmund',
  'Inter Milan': 'Inter',
  'Inter Miami': 'Inter Miami',
  'Tottenham Hotspur': 'Tottenham',
  'Tottenham Hotspur FC': 'Tottenham',
  'Liverpool FC': 'Liverpool',
  'Arsenal FC': 'Arsenal',
  'Chelsea FC': 'Chelsea',
  'Juventus FC': 'Juventus',
  'SSC Napoli': 'Napoli',
  'AS Roma': 'Roma',
  'AC Milan': 'Milan',
  'Al-Nassr FC': 'Al-Nassr',
  'Vancouver Whitecaps FC': 'Vancouver',
};

const flagForCountry = (country: string) => countryFlagByName[country] ?? '⚽';

const solidBarColorFor = (id: string) => {
  barColorById ??= buildSolidBarColorMap(chartData, marketValueVideoConfig.topN);
  return barColorById.get(id) ?? flatBarPalette[Math.abs(hashText(id)) % flatBarPalette.length];
};

let barColorById: Map<string, string> | undefined;

const buildSolidBarColorMap = (data: MarketValueRaceData, topN: number) => {
  const appearances = new Map<string, number>();
  const coAppearances = new Map<string, Set<string>>();
  const assignments = new Map<string, string>();
  const colorUsage = new Map<string, number>();

  for (const snapshot of data.snapshots) {
    const visibleIds = [...snapshot.ranks.entries()]
      .filter(([id, rank]) => rank <= topN && (snapshot.values.get(id) ?? 0) > 0)
      .sort((a, b) => a[1] - b[1])
      .map(([id]) => id);

    for (const id of visibleIds) {
      appearances.set(id, (appearances.get(id) ?? 0) + 1);
      coAppearances.set(id, coAppearances.get(id) ?? new Set());
    }

    for (let outer = 0; outer < visibleIds.length; outer += 1) {
      for (let inner = outer + 1; inner < visibleIds.length; inner += 1) {
        coAppearances.get(visibleIds[outer])?.add(visibleIds[inner]);
        coAppearances.get(visibleIds[inner])?.add(visibleIds[outer]);
      }
    }
  }

  const idsByImportance = data.entities
    .map((entity) => entity.id)
    .sort((a, b) => (appearances.get(b) ?? 0) - (appearances.get(a) ?? 0) || a.localeCompare(b));

  for (const id of idsByImportance) {
    const neighborColors = [...(coAppearances.get(id) ?? [])]
      .map((neighborId) => assignments.get(neighborId))
      .filter((color): color is string => Boolean(color));
    const preferredIndex = Math.abs(hashText(id)) % flatBarPalette.length;
    let bestColor = flatBarPalette[preferredIndex];
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < flatBarPalette.length; index += 1) {
      const color = flatBarPalette[index];
      const distanceScore = neighborColors.length
        ? Math.min(...neighborColors.map((neighborColor) => colorDistance(color, neighborColor)))
        : 420;
      const exactConflictPenalty = neighborColors.includes(color) ? 1000 : 0;
      const reusePenalty = (colorUsage.get(color) ?? 0) * 18;
      const preferencePenalty = Math.abs(index - preferredIndex) * 0.08;
      const score = distanceScore - exactConflictPenalty - reusePenalty - preferencePenalty;

      if (score > bestScore) {
        bestScore = score;
        bestColor = color;
      }
    }

    assignments.set(id, bestColor);
    colorUsage.set(bestColor, (colorUsage.get(bestColor) ?? 0) + 1);
  }

  return assignments;
};

const colorDistance = (colorA: string, colorB: string) => {
  const [aRed, aGreen, aBlue] = hexToRgb(colorA);
  const [bRed, bGreen, bBlue] = hexToRgb(colorB);
  return Math.hypot(aRed - bRed, aGreen - bGreen, aBlue - bBlue);
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

const hashUnit = (text: string) => (Math.abs(hashText(text)) % 1000) / 1000;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const smootherStep = (value: number) => {
  const t = clamp(value, 0, 1);

  return t * t * t * (t * (t * 6 - 15) + 10);
};

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
  '#A16207',
  '#047857',
  '#9F1239',
  '#6D28D9',
  '#0F766E',
  '#CA8A04',
  '#4338CA',
  '#E11D48',
  '#0284C7',
  '#4D7C0F',
  '#B4538A',
  '#1E40AF',
  '#B83280',
  '#166534',
  '#92400E',
  '#5B21B6',
  '#155E75',
  '#991B1B',
  '#0E7490',
  '#854D0E',
  '#312E81',
  '#9D174D',
  '#075985',
  '#3F6212',
] as const;

const countryFlagByName: Record<string, string> = {
  Argentina: '🇦🇷',
  Belgium: '🇧🇪',
  Brazil: '🇧🇷',
  Canada: '🇨🇦',
  Chile: '🇨🇱',
  Colombia: '🇨🇴',
  Croatia: '🇭🇷',
  Egypt: '🇪🇬',
  England: '🇬🇧',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Italy: '🇮🇹',
  Netherlands: '🇳🇱',
  Norway: '🇳🇴',
  Poland: '🇵🇱',
  Portugal: '🇵🇹',
  Romania: '🇷🇴',
  Senegal: '🇸🇳',
  Spain: '🇪🇸',
  Sweden: '🇸🇪',
  Togo: '🇹🇬',
  Türkiye: '🇹🇷',
  Ukraine: '🇺🇦',
  Uruguay: '🇺🇾',
  Wales: '🇬🇧',
};

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
    fontSize: 68,
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
    left: chart.left + barLeft,
    top: chart.top - 46,
    width: valueLeft + valueWidth - barLeft,
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
  territoryChart: {
    backgroundColor: '#04140E',
    border: '3px solid rgba(255,255,255,0.22)',
    borderRadius: 0,
    boxShadow:
      '0 22px 56px rgba(0,0,0,0.48), inset 0 0 0 1px rgba(255,255,255,0.08)',
  },
  territoryCanvas: {
    position: 'absolute',
    inset: 0,
    display: 'block',
    width: chart.width,
    height: chart.height,
    pointerEvents: 'none',
  },
  territoryShade: {
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.08) 42%, rgba(0,0,0,0.2)), radial-gradient(circle at 50% 44%, rgba(255,255,255,0.08), rgba(255,255,255,0) 58%)',
    pointerEvents: 'none',
  },
  territoryLabelLayer: {
    position: 'absolute',
    inset: 0,
    zIndex: 3,
    pointerEvents: 'none',
  },
  territoryLabel: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    transformOrigin: 'center center',
    willChange: 'transform, opacity',
  },
  territoryPhotoFrame: {
    position: 'relative',
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.94)',
    boxShadow:
      '0 10px 22px rgba(0,0,0,0.38), inset 0 0 0 3px rgba(255,255,255,0.72)',
  },
  territoryPhoto: {
    display: 'block',
    width: '100%',
    height: '100%',
    borderRadius: 8,
    objectFit: 'cover',
    objectPosition: 'center top',
  },
  territoryInitials: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#07110D',
    fontSize: 21,
    fontWeight: 950,
    lineHeight: 1,
  },
  territoryClubLogoBadge: {
    position: 'absolute',
    right: -13,
    bottom: -12,
    width: 34,
    height: 34,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.96)',
    boxShadow: '0 6px 14px rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  territoryClubLogo: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  territoryRankName: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: 950,
    lineHeight: 1.02,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textShadow:
      '0 3px 0 rgba(0,0,0,0.76), 2px 0 0 rgba(0,0,0,0.54), -2px 0 0 rgba(0,0,0,0.54), 0 10px 20px rgba(0,0,0,0.42)',
    whiteSpace: 'nowrap',
  },
  territoryValue: {
    marginTop: 4,
    color: '#F9D36B',
    fontSize: 29,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    lineHeight: 1,
    textShadow:
      '0 3px 0 rgba(0,0,0,0.76), 2px 0 0 rgba(0,0,0,0.48), -2px 0 0 rgba(0,0,0,0.48)',
    whiteSpace: 'nowrap',
  },
  territoryClub: {
    marginTop: 7,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 17,
    fontWeight: 900,
    lineHeight: 1,
    maxWidth: '94%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textShadow: '0 3px 9px rgba(0,0,0,0.68)',
    whiteSpace: 'nowrap',
  },
  echartsCanvas: {
    position: 'absolute',
    inset: 0,
    width: chart.width,
    height: chart.height,
    pointerEvents: 'none',
  },
  profileOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 4,
    pointerEvents: 'none',
  },
  clubLogoOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 5,
    pointerEvents: 'none',
  },
  clubLogoFrame: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  clubLogo: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'saturate(0.98) contrast(1.02) drop-shadow(0 4px 7px rgba(0,0,0,0.34))',
  },
  profilePhotoFrame: {
    position: 'absolute',
    left: barLeft + 8,
    width: 52,
    height: 52,
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.2), 0 10px 18px rgba(0,0,0,0.28)',
    isolation: 'isolate',
  },
  profilePhoto: {
    display: 'block',
    width: '112%',
    height: '112%',
    marginLeft: '-6%',
    marginTop: '-6%',
    filter: 'blur(2.2px) saturate(0.92) brightness(0.9)',
    objectFit: 'cover',
    objectPosition: 'center top',
    opacity: 0.84,
    transform: 'translateZ(0)',
  },
  profilePhotoSoftMask: {
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.28)), rgba(0,0,0,0.08)',
    boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.16)',
  },
  profileInitials: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.82)',
    fontSize: 17,
    fontWeight: 950,
    lineHeight: 1,
    textShadow: '0 2px 7px rgba(0,0,0,0.85)',
  },
  chartGrid: {
    position: 'absolute',
    left: barLeft,
    top: 0,
    width: barMaxWidth,
    height: chart.height,
    opacity: 0.14,
    backgroundImage:
      'linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
    backgroundSize: '112px 100%, 100% 92px',
  },
  playerRow: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: chart.width,
    height: row.height,
    transformOrigin: `${barLeft}px center`,
    willChange: 'transform, opacity',
  },
  rankNumber: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: rankColumnWidth,
    color: 'rgba(255,255,255,0.58)',
    fontSize: 31,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    lineHeight: `${barHeight}px`,
    textAlign: 'right',
    textShadow: '0 6px 18px rgba(0,0,0,0.45)',
  },
  bar: {
    position: 'absolute',
    left: barLeft,
    top: 4,
    height: barHeight,
    minWidth: 92,
    overflow: 'hidden',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.14)',
  },
  flagGhost: {
    position: 'absolute',
    right: 14,
    top: -1,
    fontFamily: emojiFontStack,
    fontSize: 58,
    lineHeight: `${barHeight}px`,
    opacity: 0.74,
  },
  avatar: {
    position: 'absolute',
    left: 8,
    top: 7,
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.42)',
    backgroundPosition: 'center top',
    backgroundSize: 'cover',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    imageRendering: 'auto',
    boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.18), 0 10px 18px rgba(0,0,0,0.28)',
  },
  avatarFallback: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 17,
    fontWeight: 950,
    lineHeight: 1,
    textShadow: '0 2px 7px rgba(0,0,0,0.85)',
  },
  playerName: {
    position: 'absolute',
    left: 75,
    right: 78,
    top: 0,
    height: barHeight,
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    color: '#FFFFFF',
    fontWeight: 950,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    textShadow:
      '0 3px 0 rgba(0,0,0,0.55), 0 -1px 0 rgba(0,0,0,0.45), 3px 0 0 rgba(0,0,0,0.35)',
  },
  valueTicker: {
    position: 'absolute',
    left: valueLeft,
    top: 2,
    width: valueWidth,
    height: 38,
    overflow: 'hidden',
  },
  valueText: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: valueWidth,
    color: '#F9D36B',
    fontSize: 31,
    fontFeatureSettings: '"tnum"',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    lineHeight: '38px',
    textAlign: 'left',
    textShadow: '0 6px 18px rgba(0,0,0,0.45)',
    willChange: 'transform',
  },
  valueGhost: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: valueWidth,
    color: 'rgba(249,211,107,0.42)',
    fontSize: 31,
    fontFeatureSettings: '"tnum"',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    lineHeight: '38px',
    textAlign: 'left',
    textShadow: '0 6px 18px rgba(0,0,0,0.45)',
    willChange: 'transform, opacity',
  },
  clubText: {
    position: 'absolute',
    left: valueLeft,
    top: 43,
    width: valueWidth,
    overflow: 'hidden',
    color: 'rgba(255,255,255,0.62)',
    fontSize: 17,
    fontWeight: 850,
    lineHeight: 1.05,
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
