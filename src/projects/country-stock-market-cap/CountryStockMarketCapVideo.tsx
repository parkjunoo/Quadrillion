import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { VIDEO_WIDTH } from '../../shared/video';
import {
  createDefaultDataShortsFrameGeometry,
  dataVideoFontStack,
  defaultDataShortsTemplate,
} from '../../shared/dataVideoFrame';
import {
  countryStockMarketCapRaceEntries,
  countryStockMarketCapVideoConfig,
} from './config';
import {
  buildHostingCostRaceData,
  getHostingCostFrameState,
  type HostingCostFrameState,
  type HostingCostRaceRow,
} from './countryMarketCapRace';
import { introVoiceoverAsset } from './generated/introVoiceoverAsset';

const raceData = buildHostingCostRaceData();
const fontStack = dataVideoFontStack;
const channelHandle = '@whoa-data';
const topN = Math.min(
  countryStockMarketCapRaceEntries.length,
  countryStockMarketCapVideoConfig.topN,
);
const frameLayout = createDefaultDataShortsFrameGeometry({
  chartHeight: 984,
  chartLeft: 58,
  chartWidth: 930,
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
const maxYear = Math.floor(raceData.maxMonthIndex / 12);

export const CountryStockMarketCapVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(countryStockMarketCapVideoConfig.startHoldSeconds * fps);
  const endHoldFrames = Math.round(countryStockMarketCapVideoConfig.endHoldSeconds * fps);
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
          volume={countryStockMarketCapVideoConfig.introVoiceoverVolume}
        />
      ) : null}
      <Background />
      <LeaderBackdrop state={state} />
      <Header />
      <YearRail currentYear={state.currentYear} progress={progress} />
      <MarketCapTerritoryChart state={state} />
      <Footer />
    </AbsoluteFill>
  );
};

const Header = () => (
  <div style={styles.header}>
    <div style={styles.title}>{countryStockMarketCapVideoConfig.title}</div>
    <div style={styles.titleHook}>{countryStockMarketCapVideoConfig.titleHook}</div>
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

const MarketCapTerritoryChart = ({ state }: { state: HostingCostFrameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layout = useMemo(() => buildCountryTerritoryLayout(state), [state]);

  useLayoutEffect(() => {
    drawCountryTerritoryChart(canvasRef.current, layout);
  }, [layout]);

  return (
    <div style={styles.chart}>
      <canvas
        height={chart.height}
        ref={canvasRef}
        style={styles.territoryCanvas}
        width={chart.width}
      />
      <div style={styles.territoryShade} />
      <div style={styles.territoryLabelLayer}>
        {layout.sites
          .filter((site) =>
            site.cellCount > 18 &&
            site.cellShare > 0.006 &&
            site.row.opacity > 0.12
          )
          .map((site) => (
            <TerritoryLabel key={`country-territory-${site.row.code}`} site={site} />
          ))}
      </div>
    </div>
  );
};

type CountryTerritoryLayout = {
  cells: CountryTerritoryCell[];
  cellsByOwner: CountryTerritoryCell[][];
  sites: CountryTerritorySite[];
  tileSize: number;
};

type CountryTerritoryCell = {
  ownerIndex: number;
  x: number;
  y: number;
};

type CountryTerritorySite = {
  anchorX: number;
  anchorY: number;
  cellCount: number;
  cellShare: number;
  color: string;
  centroidX: number;
  centroidY: number;
  labelScale: number;
  row: HostingCostRaceRow;
  weightShare: number;
};

type CountryAnchor = {
  x: number;
  y: number;
};

const territoryTileSize = 10;
const territoryTileGap = 0;
const territoryGridColor = '#101827';
const territoryVisibleOpacityThreshold = 0.018;

const fixedCountryAnchors = [
  { x: 0.55, y: 0.42 },
  { x: 0.25, y: 0.72 },
  { x: 0.83, y: 0.50 },
  { x: 0.26, y: 0.28 },
  { x: 0.52, y: 0.68 },
  { x: 0.50, y: 0.17 },
  { x: 0.71, y: 0.78 },
  { x: 0.80, y: 0.22 },
  { x: 0.15, y: 0.50 },
  { x: 0.39, y: 0.84 },
  { x: 0.91, y: 0.76 },
  { x: 0.12, y: 0.18 },
] as const satisfies readonly CountryAnchor[];

const countryAnchorByCode = buildCountryAnchorMap();

const TerritoryLabel = ({ site }: { site: CountryTerritorySite }) => {
  const raceRow = site.row;
  const labelWidth = Math.round(clamp(148 + site.cellShare * 760, 166, 294));
  const labelX = clamp(site.centroidX, labelWidth / 2 + 12, chart.width - labelWidth / 2 - 12);
  const labelY = clamp(site.centroidY, 116, chart.height - 124);
  const flagSize = Math.round(clamp(48 + site.cellShare * 260, 56, 96));
  const hostText = hostLabelFor(raceRow.host);
  const rankNameText = `#${raceRow.displayRank} ${hostText}`;
  const rankNameFontSize = Math.round(
    clamp((labelWidth / Math.max(8, rankNameText.length)) * 1.6, 23, 37),
  );
  const valueFontSize = Math.round(clamp(27 + Math.sqrt(site.cellShare) * 52, 31, 46));
  const showRegion = site.cellShare > 0.045;
  const labelOpacity = clamp(raceRow.opacity * 1.18, 0, 1);
  const profileBorderColor = colorWithOpacity(
    site.color,
    clamp(0.74 + raceRow.opacity * 0.22, 0.74, 0.96),
  );
  const rankColor = rankColorFor(raceRow.displayRank);
  const rankShadow = raceRow.displayRank <= 3
    ? `0 3px 0 rgba(0,0,0,0.76), 0 0 18px ${colorWithOpacity(rankColor, 0.48)}`
    : styles.territoryRankName.textShadow;

  return (
    <div
      style={{
        ...styles.territoryLabel,
        left: labelX,
        opacity: labelOpacity,
        top: labelY,
        transform: `translate(-50%, -50%) scale(${site.labelScale})`,
        width: labelWidth,
        zIndex: 80 - Math.min(70, raceRow.displayRank),
      }}
    >
      <div
        style={{
          ...styles.territoryFlagBadge,
          border: `3px solid ${profileBorderColor}`,
          boxShadow: `0 14px 24px rgba(0,0,0,0.26), inset 0 0 0 2px rgba(255,255,255,0.16), 0 0 24px ${colorWithOpacity(site.color, 0.3)}`,
          height: flagSize,
          width: flagSize,
        }}
      >
        <div
          style={{
            ...styles.territoryFlag,
            fontSize: Math.round(flagSize * 0.65),
            lineHeight: `${flagSize}px`,
          }}
        >
          {countryEmojiForEntry(raceRow)}
        </div>
        <div style={styles.territoryCode}>{raceRow.code}</div>
      </div>
      <div
        style={{
          ...styles.territoryRankName,
          color: rankColor,
          fontSize: rankNameFontSize,
          textShadow: rankShadow,
        }}
      >
        {rankNameText}
      </div>
      <div
        style={{
          ...styles.territoryValue,
          color: valueColorFor(raceRow),
          fontSize: valueFontSize,
        }}
      >
        {formatDollar(raceRow.value)}
      </div>
      {showRegion ? <div style={styles.territoryRegion}>{raceRow.region}</div> : null}
    </div>
  );
};

const buildCountryTerritoryLayout = (state: HostingCostFrameState): CountryTerritoryLayout => {
  const visibleRows = state.rows
    .filter((raceRow) =>
      raceRow.value > 0 && raceRow.opacity > territoryVisibleOpacityThreshold
    )
    .sort((a, b) => a.displayRank - b.displayRank || b.value - a.value);
  const weightedValues = visibleRows.map((raceRow) =>
    Math.max(raceRow.value, state.maxValue * 0.003) * clamp(raceRow.opacity, 0, 1)
  );
  const totalWeight = weightedValues.reduce((sum, value) => sum + value, 0) || 1;
  const sites = visibleRows.map((raceRow, index) => {
    const anchor = countryTerritoryAnchorFor(raceRow, index);
    const weightShare = weightedValues[index] / totalWeight;

    return {
      anchorX: anchor.x,
      anchorY: anchor.y,
      cellCount: 0,
      cellShare: 0,
      color: raceRow.color,
      centroidX: anchor.x,
      centroidY: anchor.y,
      labelScale: 1,
      row: raceRow,
      weightShare,
    };
  });
  const columns = Math.ceil(chart.width / territoryTileSize);
  const rowsCount = Math.ceil(chart.height / territoryTileSize);
  const cells: CountryTerritoryCell[] = [];
  const cellsByOwner = sites.map((): CountryTerritoryCell[] => []);
  const centroidSums = sites.map(() => ({ count: 0, x: 0, y: 0 }));

  if (!sites.length) {
    return { cells, cellsByOwner, sites, tileSize: territoryTileSize };
  }

  for (let gridY = 0; gridY < rowsCount; gridY += 1) {
    for (let gridX = 0; gridX < columns; gridX += 1) {
      const x = Math.min(chart.width - 0.5, gridX * territoryTileSize + territoryTileSize / 2);
      const y = Math.min(chart.height - 0.5, gridY * territoryTileSize + territoryTileSize / 2);
      const ownerIndex = countryTerritoryOwnerForPoint(x, y, sites);

      const cell = {
        ownerIndex,
        x: gridX * territoryTileSize,
        y: gridY * territoryTileSize,
      };

      cells.push(cell);
      cellsByOwner[ownerIndex]?.push(cell);
      centroidSums[ownerIndex].count += 1;
      centroidSums[ownerIndex].x += x;
      centroidSums[ownerIndex].y += y;
    }
  }

  const cellTotal = Math.max(1, cells.length);

  return {
    cells,
    cellsByOwner,
    sites: sites.map((site, index) => {
      const centroid = centroidSums[index];
      const cellShare = centroid.count / cellTotal;

      return {
        ...site,
        cellCount: centroid.count,
        cellShare,
        centroidX: centroid.count ? centroid.x / centroid.count : site.anchorX,
        centroidY: centroid.count ? centroid.y / centroid.count : site.anchorY,
        labelScale: clamp(0.64 + Math.sqrt(Math.max(cellShare, site.weightShare)) * 1.42, 0.68, 1.08),
      };
    }),
    tileSize: territoryTileSize,
  };
};

const countryTerritoryOwnerForPoint = (
  x: number,
  y: number,
  sites: CountryTerritorySite[],
) => {
  let bestIndex = 0;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let index = 0; index < sites.length; index += 1) {
    const site = sites[index];
    const dx = x - site.anchorX;
    const dy = y - site.anchorY;
    const distance = dx * dx + dy * dy;
    const score = distance / Math.max(0.0001, Math.pow(site.weightShare, 0.86));

    if (score < bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  }

  return bestIndex;
};

function buildCountryAnchorMap() {
  const profiles = countryStockMarketCapRaceEntries
    .map((entry) => ({
      entry,
      maxValue: Math.max(0, ...entry.observations.map((observation) => observation.valueUsd)),
    }))
    .sort((profileA, profileB) =>
      profileB.maxValue - profileA.maxValue ||
      profileA.entry.firstYear - profileB.entry.firstYear ||
      profileA.entry.host.localeCompare(profileB.entry.host)
    );

  return new Map(
    profiles.map((profile, index) => [
      profile.entry.code,
      fixedCountryAnchors[index] ?? spiralCountryAnchorForIndex(index),
    ]),
  );
}

const countryTerritoryAnchorFor = (raceRow: HostingCostRaceRow, index: number) => {
  const anchor = countryAnchorByCode.get(raceRow.code) ??
    fixedCountryAnchors[index] ??
    spiralCountryAnchorForIndex(index);
  const jitterX = (hashUnit(`${raceRow.code}:x`) - 0.5) * 14;
  const jitterY = (hashUnit(`${raceRow.code}:y`) - 0.5) * 14;

  return {
    x: clamp(anchor.x * chart.width + jitterX, 42, chart.width - 42),
    y: clamp(anchor.y * chart.height + jitterY, 42, chart.height - 42),
  };
};

function spiralCountryAnchorForIndex(index: number): CountryAnchor {
  const angle = index * 2.399963229728653;
  const ring = 0.18 + (index % 18) * 0.019 + Math.floor(index / 18) * 0.06;

  return {
    x: clamp(0.5 + Math.cos(angle) * ring, 0.05, 0.95),
    y: clamp(0.5 + Math.sin(angle) * ring * 0.92, 0.05, 0.95),
  };
}

const drawCountryTerritoryChart = (
  canvas: HTMLCanvasElement | null,
  layout: CountryTerritoryLayout,
) => {
  if (!canvas) {
    return;
  }

  const context = canvas.getContext('2d');

  if (!context) {
    return;
  }

  context.clearRect(0, 0, chart.width, chart.height);
  context.fillStyle = territoryGridColor;
  context.fillRect(0, 0, chart.width, chart.height);

  for (const cell of layout.cells) {
    const site = layout.sites[cell.ownerIndex];

    if (!site) {
      continue;
    }

    const [red, green, blue] = hexToRgb(site.color);
    const alpha = clamp(0.62 + site.row.opacity * 0.36, 0.16, 0.98);

    context.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
    context.fillRect(
      cell.x,
      cell.y,
      Math.max(1, layout.tileSize - territoryTileGap),
      Math.max(1, layout.tileSize - territoryTileGap),
    );
  }

  context.globalCompositeOperation = 'screen';
  for (const site of layout.sites) {
    if (site.cellCount < 20) {
      continue;
    }

    const [red, green, blue] = hexToRgb(site.color);
    const radius = clamp(Math.sqrt(site.cellShare) * 720, 74, 270);
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
  drawCountryFlagWatermarks(context, layout);
  drawCountryTerritoryBoundaries(context, layout);

  context.strokeStyle = 'rgba(0,0,0,0.88)';
  context.lineWidth = 4;
  context.strokeRect(2, 2, chart.width - 4, chart.height - 4);
};

const drawCountryFlagWatermarks = (
  context: CanvasRenderingContext2D,
  layout: CountryTerritoryLayout,
) => {
  for (let siteIndex = 0; siteIndex < layout.sites.length; siteIndex += 1) {
    const site = layout.sites[siteIndex];
    const cells = layout.cellsByOwner[siteIndex] ?? [];
    const emoji = countryEmojiForEntry(site.row);
    const opacity = clamp(site.row.opacity * 0.15, 0, 0.15);

    if (cells.length < 18 || opacity <= 0.01 || emoji === '■') {
      continue;
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    context.save();
    context.beginPath();

    for (const cell of cells) {
      minX = Math.min(minX, cell.x);
      minY = Math.min(minY, cell.y);
      maxX = Math.max(maxX, cell.x + layout.tileSize);
      maxY = Math.max(maxY, cell.y + layout.tileSize);
      context.rect(cell.x, cell.y, layout.tileSize, layout.tileSize);
    }

    context.clip();
    context.globalAlpha = opacity;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;
    const fontSize = Math.round(clamp(Math.max(boundsWidth * 1.72, boundsHeight * 1.95), 172, 1480));
    const centerX = clamp(site.centroidX, minX + boundsWidth * 0.2, maxX - boundsWidth * 0.2);
    const centerY = clamp(site.centroidY, minY + boundsHeight * 0.2, maxY - boundsHeight * 0.2);
    const visualCenterY = centerY + fontSize * 0.14;

    context.font = `700 ${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    context.fillText(emoji, centerX, visualCenterY);

    context.restore();
  }
};

const drawCountryTerritoryBoundaries = (
  context: CanvasRenderingContext2D,
  layout: CountryTerritoryLayout,
) => {
  const columns = Math.ceil(chart.width / layout.tileSize);

  context.save();
  context.beginPath();
  context.strokeStyle = 'rgba(0,0,0,0.82)';
  context.lineCap = 'square';
  context.lineWidth = 3;

  for (let index = 0; index < layout.cells.length; index += 1) {
    const cell = layout.cells[index];
    const column = index % columns;
    const rightCell = column < columns - 1 ? layout.cells[index + 1] : undefined;
    const downCell = layout.cells[index + columns];

    if (rightCell && rightCell.ownerIndex !== cell.ownerIndex) {
      const x = cell.x + layout.tileSize - territoryTileGap / 2;

      context.moveTo(x, cell.y);
      context.lineTo(x, Math.min(chart.height, cell.y + layout.tileSize));
    }

    if (downCell && downCell.ownerIndex !== cell.ownerIndex) {
      const y = cell.y + layout.tileSize - territoryTileGap / 2;

      context.moveTo(cell.x, y);
      context.lineTo(Math.min(chart.width, cell.x + layout.tileSize), y);
    }
  }

  context.stroke();
  context.restore();
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
    <div style={styles.yearImageFlag}>{countryEmojiForEntry(raceRow)}</div>
    <div style={styles.yearImageCode}>{raceRow.code}</div>
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
          text: raceRow.code,
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
  const emojis = [countryEmojiForEntry(raceRow)];
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

const LeaderBackdrop = ({ state }: { state: HostingCostFrameState }) => {
  const leader = state.rows.find((raceRow) => raceRow.displayRank === 1) ?? state.rows[0];
  const color = leader?.color ?? '#67E8F9';
  const scale = 1.02 + state.transitionPulse * 0.03;

  return (
    <AbsoluteFill style={styles.leaderBackdrop}>
      {leader ? (
        <div
          style={{
            ...styles.leaderBackdropFlag,
            transform: `rotate(-8deg) scale(${1.02 + state.transitionPulse * 0.02})`,
          }}
        >
          {countryEmojiForEntry(leader)}
        </div>
      ) : null}
      <div
        style={{
          ...styles.leaderColorWash,
          background: `radial-gradient(circle at 72% 38%, ${colorWithOpacity(color, 0.24)} 0%, ${colorWithOpacity(color, 0.1)} 34%, rgba(3,7,18,0) 66%)`,
        }}
      />
      <div style={{ ...styles.costHalo, transform: `rotate(-12deg) scale(${scale})` }}>MKT</div>
      <div style={styles.leaderBackdropVeil} />
    </AbsoluteFill>
  );
};

const Footer = () => (
  <div style={styles.footer}>
    <div style={styles.source}>{countryStockMarketCapVideoConfig.source}</div>
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

  if (safeValue >= 1_000_000_000_000) {
    return `$${(safeValue / 1_000_000_000_000).toFixed(1)}T`;
  }

  if (safeValue >= 1_000_000_000) {
    return `$${(safeValue / 1_000_000_000).toFixed(1)}B`;
  }

  if (safeValue >= 1_000_000) {
    return `$${Math.round(safeValue / 1_000_000).toLocaleString('en-US')}M`;
  }

  return `$${Math.round(safeValue).toLocaleString('en-US')}`;
};

const valueFontSizeFor = (value: number) => {
  if (value >= 10_000_000_000_000) {
    return 38;
  }

  if (value >= 1_000_000_000_000) {
    return 38;
  }

  return 38;
};

const fontSizeForHost = (host: string, barWidth: number) => {
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
  const labels: Record<string, string> = {
    'Egypt, Arab Rep.': 'Egypt',
    'Hong Kong SAR, China': 'Hong Kong',
    'Iran, Islamic Rep.': 'Iran',
    'Korea, Rep.': 'South Korea',
    'Russian Federation': 'Russia',
    'United Kingdom': 'UK',
    'United Arab Emirates': 'UAE',
  };

  return labels[host] ?? host;
};

const countryEmojiForEntry = (entry: HostingCostRaceRow) => flagEmojiForIso2(entry.iso2);

const flagEmojiForIso2 = (iso2: string) => {
  if (!/^[A-Z]{2}$/.test(iso2)) {
    return '■';
  }

  return [...iso2]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
};

const valueColorFor = (raceRow: HostingCostRaceRow) => {
  if (raceRow.displayRank === 1) {
    return '#FACC15';
  }

  if (raceRow.value >= 1_000_000_000_000) {
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

const hashText = (text: string) => {
  let hash = 0;

  for (const char of text) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }

  return hash;
};

const hashUnit = (text: string) => (Math.abs(hashText(text)) % 1000) / 1000;

const hexToRgb = (hex: string) => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

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
    background:
      'linear-gradient(180deg, rgba(8,16,28,0.72), rgba(3,7,18,0.62)), radial-gradient(circle at 50% 42%, rgba(255,255,255,0.05), rgba(255,255,255,0) 62%)',
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
  leaderBackdropFlag: {
    filter: 'saturate(1.08)',
    fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
    fontSize: 520,
    opacity: 0.16,
    position: 'absolute',
    right: -76,
    top: 500,
    transformOrigin: 'center',
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
  territoryCanvas: {
    display: 'block',
    height: chart.height,
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
    width: chart.width,
  },
  territoryCode: {
    bottom: 6,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: fontStack,
    fontSize: 15,
    fontWeight: 950,
    left: 0,
    lineHeight: 1,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
    textShadow: '0 4px 10px rgba(0,0,0,0.72)',
    zIndex: 2,
  },
  territoryFlag: {
    fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
    left: 0,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
    top: -5,
  },
  territoryFlagBadge: {
    background: 'rgba(3,7,18,0.74)',
    border: '2px solid rgba(255,255,255,0.22)',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  territoryLabel: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'absolute',
    textAlign: 'center',
    transformOrigin: 'center center',
    willChange: 'transform, opacity',
  },
  territoryLabelLayer: {
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 3,
  },
  territoryRankName: {
    color: '#FFFFFF',
    fontWeight: 950,
    lineHeight: 1.02,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textShadow:
      '0 3px 0 rgba(0,0,0,0.76), 2px 0 0 rgba(0,0,0,0.54), -2px 0 0 rgba(0,0,0,0.54), 0 10px 20px rgba(0,0,0,0.42)',
    whiteSpace: 'nowrap',
  },
  territoryRegion: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1,
    marginTop: 7,
    maxWidth: '94%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textShadow: '0 3px 9px rgba(0,0,0,0.68)',
    whiteSpace: 'nowrap',
  },
  territoryShade: {
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.08) 42%, rgba(0,0,0,0.22)), radial-gradient(circle at 50% 44%, rgba(255,255,255,0.08), rgba(255,255,255,0) 58%)',
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 2,
  },
  territoryValue: {
    color: '#F9D36B',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    lineHeight: 1,
    marginTop: 4,
    textShadow:
      '0 3px 0 rgba(0,0,0,0.76), 2px 0 0 rgba(0,0,0,0.48), -2px 0 0 rgba(0,0,0,0.48)',
    whiteSpace: 'nowrap',
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
  yearImageCode: {
    bottom: 5,
    color: 'rgba(255,255,255,0.88)',
    fontFamily: fontStack,
    fontSize: 15,
    fontWeight: 950,
    left: 0,
    lineHeight: 1,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
    textShadow: '0 4px 10px rgba(0,0,0,0.72)',
    zIndex: 2,
  },
  yearImageFlag: {
    fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
    fontSize: 39,
    left: 0,
    lineHeight: `${yearImageSize}px`,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
    top: -4,
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
