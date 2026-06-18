import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import {
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  buildMarketCapRaceData,
  getMarketCapFrameState,
  type MarketCapFrameRow,
  type MarketCapFrameState,
  type MarketCapRaceData,
} from './marketCapRace';
import { globalMarketCapVideoConfig } from './config';
import {
  globalMarketCapEventByYear,
  type GlobalMarketCapEvent,
} from './events';
import { SHORTS_PLATFORM_TOP_CLEARANCE } from '../../shared/video';
import {
  createDataVideoFrameGeometry,
  DataVideoBackground,
  DataVideoChannelTag,
  DataVideoChartFrame,
  DataVideoChartTopBar,
  DataVideoFooter,
  DataVideoFooterNote,
  DataVideoFooterSource,
  dataVideoFontStack,
  DataVideoFrameLayout,
  DataVideoHeader,
  DataVideoTimelineRail,
} from '../../shared/dataVideoFrame';

const raceData = buildMarketCapRaceData(globalMarketCapVideoConfig.csv);
const fontStack = dataVideoFontStack;
const templateTopOffset = SHORTS_PLATFORM_TOP_CLEARANCE;
const channelHandle = '@whoa-data';
const frameInset = {
  left: 76,
  right: 76,
};
const frameLayout = createDataVideoFrameGeometry({
  chartHeight: 880,
  chartTop: 575 + templateTopOffset,
  footerTop: 1558,
  frameInset,
  headerTop: 166 + templateTopOffset,
  timelineRailTop: 332 + templateTopOffset,
});
const chart = frameLayout.chart;
export const GlobalMarketCapVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(globalMarketCapVideoConfig.startHoldSeconds * fps);
  const endHoldFrames = Math.round(globalMarketCapVideoConfig.endHoldSeconds * fps);
  const motionFrames = Math.max(1, durationInFrames - startHoldFrames - endHoldFrames);
  const raceFrame = clamp(frame - startHoldFrames, 0, motionFrames - 1);
  const state = getMarketCapFrameState({
    data: raceData,
    durationInFrames: motionFrames,
    frame: raceFrame,
    topN: globalMarketCapVideoConfig.topN,
  });
  const currentEvent = globalMarketCapEventByYear.get(state.year);

  return (
    <DataVideoFrameLayout>
      <DataVideoBackground chart={chart} />
      <DataVideoHeader
        geometry={frameLayout}
        intro={1}
        subtitle={globalMarketCapVideoConfig.subtitle}
        title={globalMarketCapVideoConfig.title}
        titleHook={globalMarketCapVideoConfig.titleHook}
      />
      <DataVideoTimelineRail
        currentLabel={state.year}
        geometry={frameLayout}
        intro={1}
        maxLabel={raceData.maxYear}
        minLabel={raceData.minYear}
        progress={state.yearProgress}
      />
      <CreatorLine event={currentEvent} intro={1} state={state} />
      <MarketCapVoronoiChart intro={1} state={state} />
      <Footer />
    </DataVideoFrameLayout>
  );
};

const CreatorLine = ({
  event,
  intro,
  state,
}: {
  event: GlobalMarketCapEvent | undefined;
  intro: number;
  state: MarketCapFrameState;
}) => (
  <DataVideoChartTopBar chart={chart} intro={intro}>
    <YearNewsStrip event={event} intro={intro} state={state} />
    <DataVideoChannelTag>{channelHandle}</DataVideoChannelTag>
  </DataVideoChartTopBar>
);

const YearNewsStrip = ({
  event,
  intro,
  state,
}: {
  event: GlobalMarketCapEvent | undefined;
  intro: number;
  state: MarketCapFrameState;
}) => {
  if (!event) {
    return null;
  }

  const eventRow = state.rows.find((row) =>
    row.code === event.code || row.name === event.companyName
  );
  const brandAccent = brandColorByCompanyName[event.companyName] ??
    (eventRow ? territoryColorFor(eventRow) : eventToneAccentByTone[event.tone]);
  const toneAccent = event.tone === 'caution'
    ? eventToneAccentByTone.caution
    : brandAccent;
  const fadeIn = clamp(state.segmentProgress / 0.12, 0.62, 1);
  const fadeOut = clamp((1 - state.segmentProgress) / 0.08, 0.8, 1);
  const stripOpacity = intro * fadeIn * fadeOut;
  const y = Math.round((1 - fadeIn) * 5);
  const rankText = eventRow ? `#${eventRow.displayRank}` : '';

  return (
    <div
      style={{
        ...styles.newsCard,
        borderColor: hexToRgba(toneAccent, 0.68),
        boxShadow: `0 10px 22px rgba(0,0,0,0.28), 0 0 14px ${hexToRgba(toneAccent, 0.16)}, inset 0 0 0 1px rgba(255,255,255,0.06)`,
        opacity: stripOpacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          ...styles.newsAccentBar,
          backgroundColor: toneAccent,
        }}
      />
      <CompanyNewsLogo
        code={event.code}
        companyName={event.companyName}
        color={toneAccent}
      />
      {rankText ? (
        <span
          style={{
            ...styles.newsRank,
            backgroundColor: hexToRgba(toneAccent, 0.18),
            borderColor: hexToRgba(toneAccent, 0.66),
            color: toneAccent,
          }}
        >
          {rankText}
        </span>
      ) : null}
      <span style={styles.newsHeadline}>{event.headline}</span>
    </div>
  );
};

const MarketCapVoronoiChart = ({
  intro,
  state,
}: {
  intro: number;
  state: MarketCapFrameState;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layout = useMemo(() => buildVoronoiTreemapLayout(state), [state]);

  useLayoutEffect(() => {
    drawVoronoiTreemap(canvasRef.current, layout);
  }, [layout]);

  return (
    <DataVideoChartFrame chart={chart} intro={intro}>
      <canvas
        height={chart.height}
        ref={canvasRef}
        style={styles.territoryCanvas}
        width={chart.width}
      />
      <div style={styles.territoryShade} />
      <div style={styles.territoryLabelLayer}>
        {layout.sites
          .filter((site) => site.cellCount > 0 && site.row.opacity > 0.025)
          .map((site) => (
            <TerritoryLabel key={`territory-label-${site.row.id}`} site={site} />
          ))}
      </div>
    </DataVideoChartFrame>
  );
};

type VoronoiTreemapLayout = {
  cells: TerritoryCell[];
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
  row: MarketCapFrameRow;
  weightShare: number;
};

const territoryTileSize = 10;
const territoryTileGap = 1;
const territoryGridColor = 'rgba(255,255,255,0.16)';

type CompanyAnchor = {
  x: number;
  y: number;
};

const fixedCompanyAnchors = [
  { x: 0.55, y: 0.43 },
  { x: 0.24, y: 0.73 },
  { x: 0.84, y: 0.49 },
  { x: 0.25, y: 0.28 },
  { x: 0.51, y: 0.66 },
  { x: 0.48, y: 0.17 },
  { x: 0.69, y: 0.77 },
  { x: 0.79, y: 0.22 },
  { x: 0.15, y: 0.50 },
  { x: 0.39, y: 0.84 },
  { x: 0.91, y: 0.76 },
  { x: 0.12, y: 0.18 },
  { x: 0.68, y: 0.18 },
  { x: 0.14, y: 0.37 },
  { x: 0.73, y: 0.35 },
  { x: 0.56, y: 0.85 },
  { x: 0.34, y: 0.12 },
  { x: 0.92, y: 0.33 },
  { x: 0.10, y: 0.66 },
  { x: 0.46, y: 0.55 },
  { x: 0.74, y: 0.88 },
  { x: 0.30, y: 0.47 },
  { x: 0.61, y: 0.29 },
  { x: 0.86, y: 0.65 },
  { x: 0.18, y: 0.86 },
  { x: 0.43, y: 0.24 },
  { x: 0.65, y: 0.61 },
  { x: 0.07, y: 0.24 },
  { x: 0.96, y: 0.18 },
  { x: 0.52, y: 0.08 },
  { x: 0.36, y: 0.66 },
  { x: 0.82, y: 0.08 },
  { x: 0.20, y: 0.58 },
  { x: 0.58, y: 0.74 },
  { x: 0.04, y: 0.82 },
  { x: 0.96, y: 0.91 },
  { x: 0.27, y: 0.04 },
  { x: 0.76, y: 0.44 },
  { x: 0.49, y: 0.93 },
  { x: 0.08, y: 0.08 },
  { x: 0.94, y: 0.52 },
  { x: 0.31, y: 0.92 },
  { x: 0.63, y: 0.04 },
  { x: 0.16, y: 0.28 },
  { x: 0.70, y: 0.70 },
  { x: 0.41, y: 0.38 },
  { x: 0.88, y: 0.85 },
  { x: 0.22, y: 0.12 },
  { x: 0.79, y: 0.30 },
  { x: 0.11, y: 0.75 },
  { x: 0.54, y: 0.53 },
] as const satisfies readonly CompanyAnchor[];

const companyAnchorById = buildCompanyAnchorMap(raceData);
const medalAccentByRank: Record<number, string> = {
  1: '#FFD43B',
  2: '#D8E3EE',
  3: '#D88B45',
};

const TerritoryLabel = ({ site }: { site: TerritorySite }) => {
  const row = site.row;
  const labelWidth = Math.round(clamp(136 + site.cellShare * 720, 148, 252));
  const labelBaseX = site.centroidX;
  const labelBaseY = site.centroidY;
  const labelX = clamp(labelBaseX, labelWidth / 2 + 12, chart.width - labelWidth / 2 - 12);
  const labelY = clamp(labelBaseY, 118, chart.height - 128);
  const logoSize = Math.round(clamp(48 + site.cellShare * 240, 54, 86));
  const displayName = companyDisplayName(row.name);
  const rankNameText = `#${row.displayRank} ${displayName}`;
  const rankNameFontSize = Math.round(
    clamp((labelWidth / Math.max(8, rankNameText.length)) * 1.5, 22, 34),
  );
  const showCountry = site.cellShare > 0.055;
  const labelOpacity = clamp(row.opacity * 1.18, 0, 1);
  const medalAccent = medalAccentForRank(row.displayRank);
  const medalTextShadow = medalAccent
    ? `0 3px 0 rgba(0,0,0,0.78), 2px 0 0 rgba(0,0,0,0.56), -2px 0 0 rgba(0,0,0,0.56), 0 0 18px ${hexToRgba(medalAccent, 0.45)}`
    : undefined;

  return (
    <div
      style={{
        ...styles.territoryLabel,
        left: labelX,
        opacity: labelOpacity,
        top: labelY,
        transform: `translate(-50%, -50%) scale(${site.labelScale})`,
        width: labelWidth,
        zIndex: 80 - Math.min(70, row.displayRank),
      }}
    >
      <CompanyLogoBadge row={row} size={logoSize} />
      <div
        style={{
          ...styles.territoryRankName,
          color: medalAccent ?? styles.territoryRankName.color,
          fontSize: rankNameFontSize,
          textShadow: medalTextShadow ?? styles.territoryRankName.textShadow,
        }}
      >
        {rankNameText}
      </div>
      <div
        style={{
          ...styles.territoryValue,
          color: medalAccent ?? styles.territoryValue.color,
          textShadow: medalTextShadow ?? styles.territoryValue.textShadow,
        }}
      >
        {formatMarketCap(row.value)}
      </div>
      {showCountry ? (
        <div style={styles.territoryCountry}>{row.country}</div>
      ) : null}
    </div>
  );
};

const buildVoronoiTreemapLayout = (state: MarketCapFrameState): VoronoiTreemapLayout => {
  const rows = state.rows
    .filter((row) => row.value > 0.001 && row.topNPresence > 0.001);
  const weightedValues = rows.map((row) =>
    Math.max(row.value, state.maxValue * 0.004) * clamp(row.topNPresence, 0, 1)
  );
  const totalWeight = weightedValues.reduce((sum, value) => sum + value, 0) || 1;
  const sites = rows.map((row, index) => {
    const anchor = territoryAnchorForCompany(row);
    const weightShare = weightedValues[index] / totalWeight;

    return {
      anchorX: anchor.x,
      anchorY: anchor.y,
      cellCount: 0,
      cellShare: 0,
      color: territoryColorFor(row),
      centroidX: anchor.x,
      centroidY: anchor.y,
      labelScale: 1,
      row,
      weightShare,
    };
  });
  const columns = Math.ceil(chart.width / territoryTileSize);
  const rowsCount = Math.ceil(chart.height / territoryTileSize);
  const cells: TerritoryCell[] = [];
  const centroidSums = sites.map(() => ({ count: 0, x: 0, y: 0 }));

  if (!sites.length) {
    return { cells, sites, tileSize: territoryTileSize };
  }

  for (let gridY = 0; gridY < rowsCount; gridY += 1) {
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
    sites: sites.map((site, index) => {
      const centroid = centroidSums[index];
      const cellShare = centroid.count / cellTotal;

      return {
        ...site,
        cellCount: centroid.count,
        cellShare,
        centroidX: centroid.count ? centroid.x / centroid.count : site.anchorX,
        centroidY: centroid.count ? centroid.y / centroid.count : site.anchorY,
        labelScale: clamp(0.62 + Math.sqrt(Math.max(cellShare, site.weightShare)) * 1.44, 0.66, 1.08),
      };
    }),
    tileSize: territoryTileSize,
  };
};

const territoryOwnerForPoint = (x: number, y: number, sites: TerritorySite[]) => {
  let bestIndex = 0;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let index = 0; index < sites.length; index += 1) {
    const site = sites[index];
    const dx = x - site.anchorX;
    const dy = y - site.anchorY;
    const weightedDistance = dx * dx + dy * dy;
    const score = weightedDistance / Math.max(0.0001, Math.pow(site.weightShare, 0.86));

    if (score < bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  }

  return bestIndex;
};

function buildCompanyAnchorMap(data: MarketCapRaceData) {
  const profiles = data.entities
    .map((entity) => {
      let bestRank = Number.POSITIVE_INFINITY;
      let firstTopRank = Number.POSITIVE_INFINITY;
      let firstTopYear = Number.POSITIVE_INFINITY;
      let maxValue = 0;

      for (const snapshot of data.snapshots) {
        const rank = snapshot.ranks.get(entity.id) ?? Number.POSITIVE_INFINITY;
        const value = snapshot.values.get(entity.id) ?? 0;

        maxValue = Math.max(maxValue, value);
        bestRank = Math.min(bestRank, rank);

        if (rank <= globalMarketCapVideoConfig.topN && firstTopYear === Number.POSITIVE_INFINITY) {
          firstTopRank = rank;
          firstTopYear = snapshot.year;
        }
      }

      return {
        entity,
        bestRank,
        firstTopRank,
        firstTopYear,
        maxValue,
      };
    })
    .sort((profileA, profileB) => {
      const topA = Number.isFinite(profileA.firstTopYear) ? 0 : 1;
      const topB = Number.isFinite(profileB.firstTopYear) ? 0 : 1;

      return (
        topA - topB ||
        profileB.maxValue - profileA.maxValue ||
        profileA.bestRank - profileB.bestRank ||
        profileA.firstTopYear - profileB.firstTopYear ||
        profileA.firstTopRank - profileB.firstTopRank ||
        profileA.entity.name.localeCompare(profileB.entity.name)
      );
    });

  return new Map(
    profiles.map((profile, index) => [
      profile.entity.id,
      fixedCompanyAnchors[index] ?? spiralAnchorForIndex(index),
    ]),
  );
}

const territoryAnchorForCompany = (row: MarketCapFrameRow) => {
  const id = row.id;
  const anchor = companyAnchorById.get(id) ?? spiralAnchorForIndex(Math.abs(hashText(id)) % 120);
  const jitterX = (hashUnit(`${id}:x`) - 0.5) * 18;
  const jitterY = (hashUnit(`${id}:y`) - 0.5) * 18;
  const baseX = clamp(anchor.x * chart.width + jitterX, 42, chart.width - 42);
  const baseY = clamp(anchor.y * chart.height + jitterY, 42, chart.height - 42);

  return {
    x: baseX,
    y: baseY,
  };
};

function spiralAnchorForIndex(index: number): CompanyAnchor {
  const angle = index * 2.399963229728653;
  const ring = 0.18 + (index % 22) * 0.017 + Math.floor(index / 22) * 0.06;

  return {
    x: clamp(0.5 + Math.cos(angle) * ring, 0.05, 0.95),
    y: clamp(0.5 + Math.sin(angle) * ring * 0.92, 0.05, 0.95),
  };
}

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
  context.fillStyle = territoryGridColor;
  context.fillRect(0, 0, chart.width, chart.height);

  for (const cell of layout.cells) {
    const site = layout.sites[cell.ownerIndex];

    if (!site) {
      continue;
    }

    const [red, green, blue] = hexToRgb(site.color);
    const alpha = clamp(0.64 + site.row.opacity * 0.34, 0.16, 0.98);

    context.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
    context.fillRect(
      cell.x,
      cell.y,
      Math.max(1, layout.tileSize - territoryTileGap),
      Math.max(1, layout.tileSize - territoryTileGap),
    );
  }

  drawTerritoryBoundaries(context, layout);

  context.globalCompositeOperation = 'screen';
  for (const site of layout.sites) {
    if (site.cellCount < 20) {
      continue;
    }

    const [red, green, blue] = hexToRgb(site.color);
    const radius = clamp(Math.sqrt(site.cellShare) * 700, 70, 260);
    const glow = context.createRadialGradient(
      site.centroidX,
      site.centroidY,
      0,
      site.centroidX,
      site.centroidY,
      radius,
    );

    glow.addColorStop(0, `rgba(${red},${green},${blue},${0.16 * site.row.opacity})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, chart.width, chart.height);
  }
  context.globalCompositeOperation = 'source-over';
  drawTerritoryBoundaries(context, layout);

  context.strokeStyle = 'rgba(0,0,0,0.92)';
  context.lineWidth = 4;
  context.strokeRect(2, 2, chart.width - 4, chart.height - 4);
};

const drawTerritoryBoundaries = (
  context: CanvasRenderingContext2D,
  layout: VoronoiTreemapLayout,
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

const Footer = () => (
  <DataVideoFooter geometry={frameLayout}>
    <DataVideoFooterSource>{globalMarketCapVideoConfig.source}</DataVideoFooterSource>
    <DataVideoFooterNote>Area = annual top 6 market cap share. Not financial advice.</DataVideoFooterNote>
  </DataVideoFooter>
);

const formatMarketCap = (value: number) => {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}T`;
  }

  if (value >= 100) {
    return `$${Math.round(value)}B`;
  }

  return `$${value.toFixed(1)}B`;
};

const companyDisplayName = (name: string) => {
  const normalized = companyAliases[name] ?? name;

  if (normalized.length <= 16) {
    return normalized;
  }

  return `${normalized.slice(0, 15).trim()}...`;
};

const tickerForLabel = (code: string) => {
  const cleaned = code.replace(/\.(SS|SZ|T|HK|DE|L|PA|AS|SW|KS)$/i, '');

  if (cleaned.length <= 5) {
    return cleaned;
  }

  return cleaned.slice(0, 5);
};

const CompanyLogoBadge = ({
  row,
  size,
}: {
  row: MarketCapFrameRow;
  size: number;
}) => {
  const logoFileName = logoFileNameForCode(row.code);
  const logoZoom = logoZoomByCompanyName[row.name] ?? 1;
  const medalAccent = medalAccentForRank(row.displayRank);
  const badgeStyle = {
    ...styles.logoBadge,
    boxShadow: medalAccent
      ? `0 10px 22px rgba(0,0,0,0.4), 0 0 0 4px ${medalAccent}, 0 0 24px ${hexToRgba(medalAccent, 0.55)}, inset 0 0 0 3px rgba(255,255,255,0.72)`
      : styles.logoBadge.boxShadow,
    height: size,
    width: size,
  };

  const fallbackText = tickerForLabel(row.code);
  const fallbackTextLength = Math.max(2, fallbackText.length);
  const fallbackFontSize = Math.round(clamp(((size - 12) / fallbackTextLength) * 1.4, 9, 18));

  return (
    <div
      style={{
        ...styles.logoBadgeShell,
        height: size,
        width: size,
      }}
    >
      {row.displayRank === 1 ? <CrownIcon size={size} /> : null}
      <div style={badgeStyle}>
        {logoFileName ? (
          <Img
            src={staticFile(`projects/global-market-cap/logos/${logoFileName}`)}
            style={{
              ...styles.logoImage,
              transform: `scale(${logoZoom})`,
            }}
          />
        ) : (
          <div
            style={{
              ...styles.logoText,
              color: brandColorByCompanyName[row.name] ?? '#09111D',
              fontSize: fallbackFontSize,
            }}
          >
            {fallbackText}
          </div>
        )}
      </div>
    </div>
  );
};

const CompanyNewsLogo = ({
  code,
  color,
  companyName,
}: {
  code: string;
  color: string;
  companyName: string;
}) => {
  const logoFileName = logoFileNameForCode(code);
  const logoZoom = logoZoomByCompanyName[companyName] ?? 1;
  const fallbackText = tickerForLabel(code);

  return (
    <div
      style={{
        ...styles.newsLogoShell,
        boxShadow: `0 6px 12px rgba(0,0,0,0.3), 0 0 0 1px ${hexToRgba(color, 0.72)}`,
      }}
    >
      {logoFileName ? (
        <Img
          src={staticFile(`projects/global-market-cap/logos/${logoFileName}`)}
          style={{
            ...styles.newsLogoImage,
            transform: `scale(${logoZoom})`,
          }}
        />
      ) : (
        <div
          style={{
            ...styles.newsLogoText,
            color,
          }}
        >
          {fallbackText}
        </div>
      )}
    </div>
  );
};

const CrownIcon = ({ size }: { size: number }) => {
  const crownWidth = Math.round(clamp(size * 0.74, 42, 64));
  const crownHeight = Math.round(crownWidth * 0.58);

  return (
    <svg
      height={crownHeight}
      style={{
        ...styles.crownIcon,
        left: (size - crownWidth) / 2,
        top: -Math.round(crownHeight * 0.48),
      }}
      viewBox="0 0 96 56"
      width={crownWidth}
    >
      <path
        d="M8 45L14 15L34 32L48 7L62 32L82 15L88 45H8Z"
        fill="#FFD43B"
        stroke="#1B1200"
        strokeLinejoin="round"
        strokeWidth={5}
      />
      <path
        d="M13 45H83V53H13V45Z"
        fill="#F4B400"
        stroke="#1B1200"
        strokeLinejoin="round"
        strokeWidth={5}
      />
      <circle cx={14} cy={15} fill="#FFF3A1" r={6} stroke="#1B1200" strokeWidth={4} />
      <circle cx={48} cy={7} fill="#FFF3A1" r={6} stroke="#1B1200" strokeWidth={4} />
      <circle cx={82} cy={15} fill="#FFF3A1" r={6} stroke="#1B1200" strokeWidth={4} />
    </svg>
  );
};

const medalAccentForRank = (rank: number) => medalAccentByRank[rank];

const eventToneAccentByTone: Record<GlobalMarketCapEvent['tone'], string> = {
  caution: '#FF6B57',
  growth: '#00F5A0',
  milestone: '#F5E829',
  shift: '#7DD3FC',
};

const logoFileNameForCode = (code: string) => {
  const normalized = code
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized ? `${normalized}.png` : '';
};

const logoZoomByCompanyName: Record<string, number> = {
  'Broadcom': 1.16,
  'Meta Platforms (Facebook)': 1.08,
  'Saudi Aramco': 1.18,
  'SpaceX': 1.2,
  'Tesla': 1.12,
};

const territoryColorFor = (row: MarketCapFrameRow) =>
  top10TerritoryColorByCompanyName[row.name] ??
  brandColorByCompanyName[row.name] ??
  fallbackColorFor(row);

const fallbackColorFor = (row: MarketCapFrameRow) =>
  fallbackTerritoryPalette[Math.abs(hashText(row.id)) % fallbackTerritoryPalette.length];

const hexToRgb = (hex: string) => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

const hexToRgba = (hex: string, alpha: number) => {
  const [red, green, blue] = hexToRgb(hex);

  return `rgba(${red},${green},${blue},${alpha})`;
};

const hashText = (text: string) => {
  let hash = 0;

  for (const char of text) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }

  return hash;
};

const hashUnit = (text: string) => (Math.abs(hashText(text)) % 1000) / 1000;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const brandColorByCompanyName: Record<string, string> = {
  'Alphabet (Google)': '#4285F4',
  'Alibaba': '#FF6A00',
  'Altria Group': '#C4A661',
  'Amazon': '#FF9900',
  'Ambev': '#0057B8',
  'American International Group': '#0057A8',
  'Apple': '#A2AAAD',
  'AT&T': '#00A8E0',
  'Bank of America': '#E31837',
  'Berkshire Hathaway': '#005BAC',
  'BHP Group': '#E35205',
  'BP': '#009B00',
  'Broadcom': '#CC092F',
  'Chevron': '#0057B8',
  'China Construction Bank': '#003B79',
  'China Mobile': '#00843D',
  'Cisco': '#8BFF00',
  'Citigroup': '#004B8D',
  'Coca-Cola': '#F40009',
  'Eli Lilly': '#D52B1E',
  'Exxon Mobil': '#ED1B2F',
  'General Electric': '#3B73B9',
  'HSBC': '#DB0011',
  'IBM': '#0033FF',
  'ICBC': '#C8102E',
  'Intel': '#0071C5',
  'Johnson & Johnson': '#D71920',
  'JPMorgan Chase': '#005EB8',
  'Lucent Technologies': '#EF3E42',
  'Merck': '#007A73',
  'Meta Platforms (Facebook)': '#0668E1',
  'Microsoft': '#00A4EF',
  'Mitsubishi UFJ Financial': '#E60012',
  'Nestlé': '#8B5E3C',
  'NVIDIA': '#76B900',
  'NTT Docomo': '#E60012',
  'Nokia': '#124191',
  'Petrobras': '#008542',
  'PetroChina': '#E60012',
  'Pfizer': '#00F5A0',
  'Procter & Gamble': '#003DA5',
  'Roche': '#0072CE',
  'Saudi Aramco': '#00A3A1',
  'Shell': '#FFD500',
  'Sinopec': '#E60012',
  'SpaceX': '#A7A9AC',
  'Tesla': '#E82127',
  'Tencent': '#0052D9',
  'Toyota': '#EB0A1E',
  'TSMC': '#D5001C',
  'Unilever': '#1F36C7',
  'UnitedHealth': '#0057B8',
  'Visa': '#1A1F71',
  'Vodafone': '#E60000',
  'Walmart': '#0071CE',
  'Wells Fargo': '#D71E28',
};

const strongBrandTerritoryColorByCompanyName: Record<string, string> = {
  'Alphabet (Google)': '#4285F4',
  'Amazon': '#FF9900',
  'Apple': '#C9CED6',
  'Bank of America': '#E31837',
  'BP': '#009B00',
  'Cisco': '#8BFF00',
  'Coca-Cola': '#F40009',
  'IBM': '#0033FF',
  'Intel': '#0071C5',
  'Microsoft': '#00A4EF',
  'NVIDIA': '#76B900',
  'Pfizer': '#00F5A0',
  'Saudi Aramco': '#00A3A1',
  'Shell': '#FFD500',
  'SpaceX': '#596675',
  'Tesla': '#E82127',
  'Visa': '#1A1F71',
  'Walmart': '#FF7A00',
};

const highSeparationTerritoryColorByCompanyName: Record<string, string> = {
  'Alibaba': '#FF5A1F',
  'Altria Group': '#B68C00',
  'Ambev': '#FF2D95',
  'American International Group': '#F72585',
  'AT&T': '#00FFEA',
  'Berkshire Hathaway': '#A855F7',
  'BHP Group': '#00E5FF',
  'Broadcom': '#C0008B',
  'Chevron': '#00FF66',
  'China Construction Bank': '#2937FF',
  'China Mobile': '#00C853',
  'Citigroup': '#52FF00',
  'Eli Lilly': '#00FFB3',
  'Exxon Mobil': '#FF3D00',
  'General Electric': '#6C63FF',
  'HSBC': '#E6007A',
  'ICBC': '#D500F9',
  'Johnson & Johnson': '#FF6EC7',
  'JPMorgan Chase': '#00FFD1',
  'Lucent Technologies': '#FF40A0',
  'Merck': '#00BFA5',
  'Meta Platforms (Facebook)': '#FF00C8',
  'Mitsubishi UFJ Financial': '#FF2E63',
  'Nestlé': '#B000FF',
  'NTT Docomo': '#FF006E',
  'Nokia': '#124191',
  'Petrobras': '#FF00A8',
  'PetroChina': '#B5E61D',
  'Procter & Gamble': '#FFEA00',
  'Roche': '#FFE600',
  'Sinopec': '#FFF100',
  'Tencent': '#7B2FF7',
  'Toyota': '#FF8C00',
  'TSMC': '#8A1538',
  'Unilever': '#6A00FF',
  'UnitedHealth': '#39FF14',
  'Vodafone': '#FF0054',
  'Wells Fargo': '#FDE047',
};

const top10TerritoryColorByCompanyName: Record<string, string> = {
  ...strongBrandTerritoryColorByCompanyName,
  ...highSeparationTerritoryColorByCompanyName,
};

const fallbackTerritoryPalette = [
  '#006CFF',
  '#FF3B30',
  '#00A86B',
  '#FF9F0A',
  '#AF52DE',
  '#00C7BE',
  '#FF2D55',
  '#B5E61D',
  '#FF6B00',
  '#5856D6',
  '#00B894',
  '#D81B60',
  '#8E5A00',
  '#0A84FF',
  '#C21807',
  '#40C8E0',
  '#7D3CFF',
  '#2E7D32',
  '#B000F5',
  '#F4B400',
] as const;

const companyAliases: Record<string, string> = {
  'Berkshire Hathaway': 'Berkshire',
  'China Construction Bank': 'China Const. Bank',
  'Eli Lilly': 'Eli Lilly',
  'JPMorgan Chase': 'JPMorgan',
  'Mitsubishi UFJ Financial': 'Mitsubishi UFJ',
  'Procter & Gamble': 'P&G',
  'Saudi Aramco': 'Saudi Aramco',
  'Taiwan Semiconductor Manufacturing Company': 'TSMC',
};

const styles = {
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
  logoBadgeShell: {
    position: 'relative',
    flex: '0 0 auto',
    marginBottom: 10,
    overflow: 'visible',
  },
  logoBadge: {
    position: 'relative',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.98)',
    boxShadow:
      '0 10px 22px rgba(0,0,0,0.38), inset 0 0 0 3px rgba(255,255,255,0.72)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    overflow: 'hidden',
  },
  crownIcon: {
    position: 'absolute',
    zIndex: 4,
    display: 'block',
    filter: 'drop-shadow(0 7px 9px rgba(0,0,0,0.5))',
    pointerEvents: 'none',
  },
  logoImage: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transformOrigin: 'center center',
  },
  logoText: {
    boxSizing: 'border-box',
    color: '#09111D',
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1,
    padding: '0 2px',
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    textAlign: 'center',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
  territoryCountry: {
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
  newsCard: {
    flex: '1 1 auto',
    minWidth: 0,
    height: 62,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    overflow: 'hidden',
    padding: '6px 15px 6px 10px',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    background:
      'linear-gradient(90deg, rgba(5,10,16,0.82) 0%, rgba(10,17,23,0.72) 62%, rgba(2,4,9,0.62) 100%)',
    transformOrigin: 'center center',
    willChange: 'opacity, transform',
  },
  newsAccentBar: {
    flex: '0 0 auto',
    width: 6,
    height: 40,
    borderRadius: 4,
  },
  newsLogoShell: {
    flex: '0 0 auto',
    width: 48,
    height: 48,
    boxSizing: 'border-box',
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.98)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 7,
  },
  newsLogoImage: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transformOrigin: 'center center',
  },
  newsLogoText: {
    maxWidth: '100%',
    overflow: 'hidden',
    textAlign: 'center',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 16,
    fontWeight: 950,
    lineHeight: 1,
  },
  newsRank: {
    flex: '0 0 auto',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 5,
    padding: '5px 9px',
    fontSize: 27,
    fontWeight: 950,
    lineHeight: 1,
  },
  newsCompany: {
    flex: '0 1 auto',
    maxWidth: 210,
    overflow: 'hidden',
    color: 'rgba(255,255,255,0.86)',
    fontSize: 32,
    fontWeight: 950,
    lineHeight: 1,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  newsDivider: {
    flex: '0 0 auto',
    color: 'rgba(255,255,255,0.36)',
    fontSize: 28,
    fontWeight: 950,
    lineHeight: 1,
  },
  newsHeadline: {
    minWidth: 0,
    flex: '1 1 auto',
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: 950,
    lineHeight: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textShadow: '0 4px 12px rgba(0,0,0,0.5)',
    whiteSpace: 'nowrap',
  },
} satisfies Record<string, CSSProperties>;
