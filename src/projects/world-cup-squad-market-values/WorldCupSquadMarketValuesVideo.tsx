import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SHORTS_PLATFORM_TOP_CLEARANCE } from '../../shared/video';
import {
  createDataVideoFrameGeometry,
  DataVideoBackground,
  DataVideoChannelTag,
  DataVideoChartFrame,
  DataVideoChartTopBar,
  DataVideoFooter,
  DataVideoFooterSource,
  dataVideoFontStack,
  DataVideoFrameLayout,
  DataVideoHeader,
  DataVideoTimelineRail,
} from '../../shared/dataVideoFrame';
import { worldCupSquadMarketValueVideoConfig } from './config';
import {
  buildSquadMarketRaceData,
  getSquadMarketFrameState,
  type SquadMarketFrameRow,
  type SquadMarketFrameState,
  type SquadMarketRaceData,
} from './squadMarketRace';
import {
  worldCupSquadPlayerBreakdowns,
  type WorldCupSquadPlayerBreakdown,
  type WorldCupSquadPlayerSegment,
} from './generated/worldCupSquadPlayerBreakdowns';

const raceData = buildSquadMarketRaceData(worldCupSquadMarketValueVideoConfig.csv);
const playerBreakdownByCountryYear = buildPlayerBreakdownMap();
const fontStack = dataVideoFontStack;
const channelHandle = '@whoa-data';
const templateTopOffset = SHORTS_PLATFORM_TOP_CLEARANCE;
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

type CountryAnchor = {
  x: number;
  y: number;
};

const territoryTileSize = 6;
const territoryTileGap = 0.75;
const territoryGridColor = 'rgba(255,255,255,0.16)';
const playerLabelMinCells = 4;
const playerBreakdownTopN = 6;
const eurToUsdRate = 1.08;
const fixedCountryAnchors = [
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
] as const satisfies readonly CountryAnchor[];
const countryAnchorById = buildCountryAnchorMap(raceData);
const medalAccentByRank: Record<number, string> = {
  1: '#FFD43B',
  2: '#D8E3EE',
  3: '#D88B45',
};
const countryTerritoryColorByCode: Record<string, string> = {
  ARG: '#F97316',
  BRA: '#22C55E',
  CMR: '#A78BFA',
  ENG: '#FB7185',
  ESP: '#14B8A6',
  FRA: '#38BDF8',
  GER: '#84CC16',
  ITA: '#6366F1',
  NED: '#F59E0B',
  POR: '#FACC15',
  YUG: '#EF4444',
};
const flagEmojiByCode: Record<string, string> = {
  ARG: '🇦🇷',
  BRA: '🇧🇷',
  CMR: '🇨🇲',
  ENG: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  ESP: '🇪🇸',
  FRA: '🇫🇷',
  GER: '🇩🇪',
  ITA: '🇮🇹',
  NED: '🇳🇱',
  POR: '🇵🇹',
  YUG: '🇷🇸',
};

export const WorldCupSquadMarketValuesVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(worldCupSquadMarketValueVideoConfig.startHoldSeconds * fps);
  const endHoldFrames = Math.round(worldCupSquadMarketValueVideoConfig.endHoldSeconds * fps);
  const motionFrames = Math.max(1, durationInFrames - startHoldFrames - endHoldFrames);
  const raceFrame = clamp(frame - startHoldFrames, 0, motionFrames - 1);
  const state = getSquadMarketFrameState({
    data: raceData,
    durationInFrames: motionFrames,
    frame: raceFrame,
    topN: worldCupSquadMarketValueVideoConfig.topN,
  });

  return (
    <DataVideoFrameLayout>
      <DataVideoBackground chart={chart} />
      <DataVideoHeader
        geometry={frameLayout}
        intro={1}
        subtitle={worldCupSquadMarketValueVideoConfig.subtitle}
        title={worldCupSquadMarketValueVideoConfig.title}
        titleHook={worldCupSquadMarketValueVideoConfig.titleHook}
      />
      <DataVideoTimelineRail
        currentLabel={state.year}
        geometry={frameLayout}
        intro={1}
        maxLabel={raceData.maxYear}
        minLabel={raceData.minYear}
        progress={state.yearProgress}
      />
      <CreatorLine intro={1} state={state} />
      <SquadValueTerritoryChart intro={1} state={state} />
      <Footer />
    </DataVideoFrameLayout>
  );
};

const CreatorLine = ({
  intro,
  state,
}: {
  intro: number;
  state: SquadMarketFrameState;
}) => (
  <DataVideoChartTopBar chart={chart} intro={intro}>
    <YearLeaderStrip state={state} />
    <DataVideoChannelTag>{channelHandle}</DataVideoChannelTag>
  </DataVideoChartTopBar>
);

const YearLeaderStrip = ({ state }: { state: SquadMarketFrameState }) => {
  const topRows = state.rows
    .filter((row) => row.liveRank <= 3)
    .sort((rowA, rowB) => rowA.liveRank - rowB.liveRank)
    .slice(0, 3);

  return (
    <div style={styles.leaderStrip}>
      <div style={styles.leaderAccentBar} />
      {topRows.map((row) => (
        <div key={`leader-row-${row.id}`} style={styles.topCountrySlot}>
          <div style={styles.leaderDivider} />
          <div style={styles.topCountryGroup}>
            <span style={styles.leaderLabel}>#{row.liveRank}</span>
            <span style={styles.topCountryValue}>
              {`${flagEmojiForCountry(row)} ${countryDisplayName(row.name)}`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const SquadValueTerritoryChart = ({
  intro,
  state,
}: {
  intro: number;
  state: SquadMarketFrameState;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layout = useMemo(() => buildTerritoryLayout(state), [state]);

  useLayoutEffect(() => {
    drawTerritory(canvasRef.current, layout);
  }, [layout]);

  return (
    <DataVideoChartFrame chart={chart} intro={intro} style={styles.chartFrame}>
      <canvas
        height={chart.height}
        ref={canvasRef}
        style={styles.territoryCanvas}
        width={chart.width}
      />
      <div style={styles.territoryShade} />
      <div style={styles.territoryLabelLayer}>
        {layout.playerSites
          .filter(playerTerritoryLabelIsVisible)
          .map((site) => (
            <PlayerTerritoryLabel key={`player-territory-${site.id}`} site={site} />
          ))}
        {layout.sites
          .filter((site) =>
            site.cellCount > 0 &&
            labelPresenceForRow(site.row) > 0.2
          )
          .map((site) => (
            <CountryTerritoryLabel key={`country-territory-${site.row.id}`} site={site} />
          ))}
      </div>
    </DataVideoChartFrame>
  );
};

type TerritoryLayout = {
  cells: TerritoryCell[];
  playerSites: PlayerTerritorySite[];
  sites: TerritorySite[];
  tileSize: number;
};

type TerritoryCell = {
  ownerIndex: number;
  playerIndex: number;
  x: number;
  y: number;
};

type TerritoryBounds = {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
};

type TerritorySite = {
  anchorX: number;
  anchorY: number;
  bounds: TerritoryBounds;
  cellCount: number;
  cellShare: number;
  color: string;
  centroidX: number;
  centroidY: number;
  labelScale: number;
  playerSites: PlayerTerritorySite[];
  row: SquadMarketFrameRow;
  weightShare: number;
};

type PlayerTerritorySite = {
  anchorX: number;
  anchorY: number;
  bounds: TerritoryBounds;
  cellCount: number;
  cellShare: number;
  color: string;
  countryIndex: number;
  countryRow: SquadMarketFrameRow;
  displayName: string;
  fullName: string;
  globalIndex: number;
  id: string;
  kind: 'player' | 'rest';
  localRank: number;
  position: string;
  segmentShare: number;
  value: number;
  weightShare: number;
  centroidX: number;
  centroidY: number;
};

type PlayerTerritoryEntry = {
  displayName: string;
  fullName: string;
  id: string;
  kind: 'player' | 'rest';
  localRank: number;
  position: string;
  value: number;
};

const CountryTerritoryLabel = ({ site }: { site: TerritorySite }) => {
  const row = site.row;
  const labelRank = rankForLabel(row);
  const labelPlacement = countryLabelPlacement(site);
  const labelWidth = labelPlacement.width;
  const labelX = labelPlacement.x;
  const labelY = labelPlacement.y;
  const displayName = countryDisplayName(row.name);
  const rankNameText = `#${labelRank} ${flagEmojiForCountry(row)} ${displayName}`;
  const rankNameFontSize = Math.round(
    clamp((labelWidth / Math.max(8, visualTextLength(rankNameText))) * 1.7, 22, 35),
  );
  const labelOpacity = clamp((labelPresenceForRow(row) - 0.2) / 0.24, 0, 1);
  const medalAccent = medalAccentForRank(labelRank);
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
        zIndex: 80 - Math.min(70, labelRank),
      }}
    >
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
        }}
      >
        {formatSquadValue(row.value)}
      </div>
    </div>
  );
};

const PlayerTerritoryLabel = ({ site }: { site: PlayerTerritorySite }) => {
  const boundsWidth = Math.max(territoryTileSize, site.bounds.maxX - site.bounds.minX + territoryTileSize);
  const boundsHeight = Math.max(territoryTileSize, site.bounds.maxY - site.bounds.minY + territoryTileSize);
  const labelText = site.kind === 'rest' ? 'Others' : `${site.localRank}. ${site.displayName}`;
  const labelWidth = Math.round(clamp(Math.min(boundsWidth * 0.94, 42 + Math.sqrt(site.segmentShare) * 150), 26, 132));
  const labelX = site.centroidX;
  const labelY = site.centroidY;
  const fitNameSize = (labelWidth / Math.max(5, labelText.length)) * 1.78;
  const areaSize = Math.min(boundsWidth, boundsHeight) * 0.3;
  const nameFontSize = Math.round(clamp(Math.min(fitNameSize, areaSize), 5, 16));
  const valueFontSize = Math.round(clamp(Math.min(nameFontSize - 1, boundsHeight * 0.18), 5, 14));
  const showPlayerValue = boundsHeight >= 18 && nameFontSize >= 6;
  const opacity = clamp((presenceForRow(site.countryRow) - 0.18) / 0.26, 0, 0.72);

  return (
    <div
      style={{
        ...styles.playerTerritoryLabel,
        left: labelX,
        opacity,
        top: labelY,
        transform: 'translate(-50%, -50%)',
        width: labelWidth,
      }}
    >
      <div
        style={{
          ...styles.playerTerritoryName,
          fontSize: nameFontSize,
        }}
      >
        {labelText}
      </div>
      {showPlayerValue ? (
        <div
          style={{
            ...styles.playerTerritoryValue,
            fontSize: valueFontSize,
          }}
        >
          {formatCompactValue(site.value)}
        </div>
      ) : null}
    </div>
  );
};

const buildTerritoryLayout = (state: SquadMarketFrameState): TerritoryLayout => {
  const rows = state.rows.filter((row) => row.value > 0.001 && presenceForRow(row) > 0.001);
  const weightedValues = rows.map((row) =>
    Math.max(row.value, state.maxValue * 0.004) * presenceForRow(row)
  );
  const totalWeight = weightedValues.reduce((sum, value) => sum + value, 0) || 1;
  const sites = rows.map((row, index) => {
    const anchor = territoryAnchorForCountry(row);
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
  const boundsBySite = sites.map(() => emptyTerritoryBounds());

  if (!sites.length) {
    return { cells, playerSites: [], sites: [], tileSize: territoryTileSize };
  }

  for (let gridY = 0; gridY < rowsCount; gridY += 1) {
    for (let gridX = 0; gridX < columns; gridX += 1) {
      const x = Math.min(chart.width - 0.5, gridX * territoryTileSize + territoryTileSize / 2);
      const y = Math.min(chart.height - 0.5, gridY * territoryTileSize + territoryTileSize / 2);
      const ownerIndex = territoryOwnerForPoint(x, y, sites);

      cells.push({
        ownerIndex,
        playerIndex: -1,
        x: gridX * territoryTileSize,
        y: gridY * territoryTileSize,
      });
      centroidSums[ownerIndex].count += 1;
      centroidSums[ownerIndex].x += x;
      centroidSums[ownerIndex].y += y;
      extendTerritoryBounds(boundsBySite[ownerIndex], x, y);
    }
  }

  const cellTotal = Math.max(1, cells.length);
  const countrySites: TerritorySite[] = sites.map((site, index) => {
    const centroid = centroidSums[index];
    const cellShare = centroid.count / cellTotal;

    return {
      ...site,
      bounds: normalizedTerritoryBounds(boundsBySite[index], site.anchorX, site.anchorY),
      cellCount: centroid.count,
      cellShare,
      centroidX: centroid.count ? centroid.x / centroid.count : site.anchorX,
      centroidY: centroid.count ? centroid.y / centroid.count : site.anchorY,
      labelScale: clamp(0.62 + Math.sqrt(Math.max(cellShare, site.weightShare)) * 1.44, 0.66, 1.08),
      playerSites: [],
    };
  });
  const playerSites: PlayerTerritorySite[] = [];
  const playerSums: Array<{ count: number; x: number; y: number }> = [];
  const playerBounds: TerritoryBounds[] = [];
  const playerSitesByCountryIndex = countrySites.map((site, countryIndex) => {
    const playerBreakdownYear = playerBreakdownYearForCountry(state, site.row);
    const entries = playerEntriesForCountry(playerBreakdownYear, site.row);
    const entryTotal = entries.reduce((sum, entry) => sum + entry.value, 0) || 1;

    return entries.map((entry, entryIndex) => {
      const anchor = playerAnchorForEntry(entryIndex, entries.length, site, entry);
      const playerSite: PlayerTerritorySite = {
        anchorX: anchor.x,
        anchorY: anchor.y,
        bounds: emptyTerritoryBounds(),
        cellCount: 0,
        cellShare: 0,
        color: site.color,
        countryIndex,
        countryRow: site.row,
        displayName: entry.displayName,
        fullName: entry.fullName,
        globalIndex: playerSites.length,
        id: `${site.row.id}:${playerBreakdownYear}:${entry.id}`,
        kind: entry.kind,
        localRank: entry.localRank,
        position: entry.position,
        segmentShare: 0,
        value: entry.value,
        weightShare: entry.value / entryTotal,
        centroidX: anchor.x,
        centroidY: anchor.y,
      };

      playerSites.push(playerSite);
      playerSums.push({ count: 0, x: 0, y: 0 });
      playerBounds.push(emptyTerritoryBounds());
      return playerSite;
    });
  });

  for (const cell of cells) {
    const ownerSite = countrySites[cell.ownerIndex];
    const countryPlayerSites = playerSitesByCountryIndex[cell.ownerIndex];

    if (!ownerSite || !countryPlayerSites.length) {
      continue;
    }

    const x = Math.min(chart.width - 0.5, cell.x + territoryTileSize / 2);
    const y = Math.min(chart.height - 0.5, cell.y + territoryTileSize / 2);
    const playerSite = playerOwnerForPoint(x, y, countryPlayerSites);

    cell.playerIndex = playerSite.globalIndex;
    playerSums[playerSite.globalIndex].count += 1;
    playerSums[playerSite.globalIndex].x += x;
    playerSums[playerSite.globalIndex].y += y;
    extendTerritoryBounds(playerBounds[playerSite.globalIndex], x, y);
  }

  const finalPlayerSites = playerSites.map((site) => {
    const sum = playerSums[site.globalIndex];
    const countryCellCount = Math.max(1, countrySites[site.countryIndex]?.cellCount ?? 1);

    return {
      ...site,
      bounds: normalizedTerritoryBounds(playerBounds[site.globalIndex], site.anchorX, site.anchorY),
      cellCount: sum.count,
      cellShare: sum.count / cellTotal,
      centroidX: sum.count ? sum.x / sum.count : site.anchorX,
      centroidY: sum.count ? sum.y / sum.count : site.anchorY,
      segmentShare: sum.count / countryCellCount,
    };
  });

  return {
    cells,
    playerSites: finalPlayerSites,
    sites: countrySites.map((site, countryIndex) => ({
      ...site,
      playerSites: playerSitesByCountryIndex[countryIndex].map(
        (playerSite) => finalPlayerSites[playerSite.globalIndex],
      ),
    })),
    tileSize: territoryTileSize,
  };
};

function buildPlayerBreakdownMap() {
  const breakdownMap = new Map<string, WorldCupSquadPlayerBreakdown>();

  for (const breakdown of worldCupSquadPlayerBreakdowns) {
    breakdownMap.set(playerBreakdownKey(breakdown.year, breakdown.code), breakdown);
    breakdownMap.set(playerBreakdownKey(breakdown.year, breakdown.country), breakdown);
  }

  return breakdownMap;
}

function playerBreakdownKey(year: number, codeOrCountry: string) {
  return `${year}:${codeOrCountry.trim().toLowerCase()}`;
}

const playerBreakdownForCountry = (year: number, row: SquadMarketFrameRow) =>
  playerBreakdownByCountryYear.get(playerBreakdownKey(year, row.code)) ??
  playerBreakdownByCountryYear.get(playerBreakdownKey(year, row.name));

const playerBreakdownYearForCountry = (
  state: SquadMarketFrameState,
  row: SquadMarketFrameRow,
) => {
  const topN = worldCupSquadMarketValueVideoConfig.topN;

  if (row.previousRank > topN && row.targetRank <= topN) {
    return state.targetYear;
  }

  if (row.previousRank <= topN && row.targetRank > topN) {
    return state.previousYear;
  }

  return state.segmentProgress < 0.5 ? state.previousYear : state.targetYear;
};

const playerEntriesForCountry = (
  year: number,
  row: SquadMarketFrameRow,
): PlayerTerritoryEntry[] => {
  const breakdown = playerBreakdownForCountry(year, row);

  if (!breakdown) {
    return [];
  }

  const playerEntries = breakdown.players
    .filter((player) => player.value > 0)
    .slice(0, playerBreakdownTopN)
    .map((player, index) => playerEntryForSegment(player, index + 1));

  if (breakdown.restValue > 0.05) {
    playerEntries.push({
      displayName: 'Others',
      fullName: 'Others',
      id: 'others',
      kind: 'rest',
      localRank: playerEntries.length + 1,
      position: '',
      value: breakdown.restValue,
    });
  }

  return playerEntries;
};

const playerEntryForSegment = (
  player: WorldCupSquadPlayerSegment,
  rank: number,
): PlayerTerritoryEntry => ({
  displayName: playerDisplayName(player.name),
  fullName: player.name,
  id: `${rank}:${player.name}`,
  kind: 'player',
  localRank: rank,
  position: player.position,
  value: player.value,
});

const playerAnchorForEntry = (
  index: number,
  total: number,
  countrySite: TerritorySite,
  entry: PlayerTerritoryEntry,
): CountryAnchor => {
  if (total <= 1) {
    return {
      x: countrySite.centroidX,
      y: countrySite.centroidY,
    };
  }

  const boundsWidth = Math.max(territoryTileSize, countrySite.bounds.maxX - countrySite.bounds.minX);
  const boundsHeight = Math.max(territoryTileSize, countrySite.bounds.maxY - countrySite.bounds.minY);
  const seed = hashUnit(`${countrySite.row.id}:${entry.id}`);
  const angle = index * 2.399963229728653 + seed * Math.PI * 0.8;
  const ring = 0.18 + (index % 5) * 0.09 + Math.floor(index / 5) * 0.1;
  const x = countrySite.centroidX + Math.cos(angle) * boundsWidth * ring;
  const y = countrySite.centroidY + Math.sin(angle) * boundsHeight * ring;

  return {
    x: clampRange(x, countrySite.bounds.minX + 12, countrySite.bounds.maxX - 12),
    y: clampRange(y, countrySite.bounds.minY + 12, countrySite.bounds.maxY - 12),
  };
};

const playerOwnerForPoint = (x: number, y: number, sites: PlayerTerritorySite[]) => {
  let bestSite = sites[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const site of sites) {
    const dx = x - site.anchorX;
    const dy = y - site.anchorY;
    const weightedDistance = dx * dx + dy * dy;
    const score = weightedDistance / Math.max(0.0001, Math.pow(site.weightShare, 0.88));

    if (score < bestScore) {
      bestSite = site;
      bestScore = score;
    }
  }

  return bestSite;
};

const emptyTerritoryBounds = (): TerritoryBounds => ({
  maxX: Number.NEGATIVE_INFINITY,
  maxY: Number.NEGATIVE_INFINITY,
  minX: Number.POSITIVE_INFINITY,
  minY: Number.POSITIVE_INFINITY,
});

const extendTerritoryBounds = (bounds: TerritoryBounds, x: number, y: number) => {
  bounds.maxX = Math.max(bounds.maxX, x);
  bounds.maxY = Math.max(bounds.maxY, y);
  bounds.minX = Math.min(bounds.minX, x);
  bounds.minY = Math.min(bounds.minY, y);
};

const normalizedTerritoryBounds = (
  bounds: TerritoryBounds,
  fallbackX: number,
  fallbackY: number,
): TerritoryBounds => {
  if (!Number.isFinite(bounds.minX) || !Number.isFinite(bounds.minY)) {
    return {
      maxX: fallbackX,
      maxY: fallbackY,
      minX: fallbackX,
      minY: fallbackY,
    };
  }

  return bounds;
};

const territoryOwnerForPoint = (
  x: number,
  y: number,
  sites: Array<Pick<TerritorySite, 'anchorX' | 'anchorY' | 'weightShare'>>,
) => {
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

const drawTerritory = (
  canvas: HTMLCanvasElement | null,
  layout: TerritoryLayout,
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
    const playerSite = cell.playerIndex >= 0 ? layout.playerSites[cell.playerIndex] : undefined;

    if (!site) {
      continue;
    }

    const [red, green, blue] = hexToRgb(playerSite?.color ?? site.color);
    const alpha = clamp(0.64 + site.row.opacity * 0.34, 0.16, 0.98);

    context.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
    context.fillRect(
      cell.x,
      cell.y,
      Math.max(1, layout.tileSize - territoryTileGap),
      Math.max(1, layout.tileSize - territoryTileGap),
    );
  }

  drawPlayerBoundaries(context, layout);
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
  drawPlayerBoundaries(context, layout);
  drawTerritoryBoundaries(context, layout);

  context.strokeStyle = 'rgba(0,0,0,0.92)';
  context.lineWidth = 4;
  context.strokeRect(2, 2, chart.width - 4, chart.height - 4);
};

const drawPlayerBoundaries = (
  context: CanvasRenderingContext2D,
  layout: TerritoryLayout,
) => {
  const columns = Math.ceil(chart.width / layout.tileSize);

  context.save();
  context.beginPath();
  context.strokeStyle = 'rgba(255,255,255,0.32)';
  context.lineCap = 'square';
  context.lineWidth = 1.5;

  for (let index = 0; index < layout.cells.length; index += 1) {
    const cell = layout.cells[index];
    const column = index % columns;
    const rightCell = column < columns - 1 ? layout.cells[index + 1] : undefined;
    const downCell = layout.cells[index + columns];

    if (
      rightCell &&
      rightCell.ownerIndex === cell.ownerIndex &&
      rightCell.playerIndex !== cell.playerIndex
    ) {
      const x = cell.x + layout.tileSize - territoryTileGap / 2;

      context.moveTo(x, cell.y);
      context.lineTo(x, Math.min(chart.height, cell.y + layout.tileSize));
    }

    if (
      downCell &&
      downCell.ownerIndex === cell.ownerIndex &&
      downCell.playerIndex !== cell.playerIndex
    ) {
      const y = cell.y + layout.tileSize - territoryTileGap / 2;

      context.moveTo(cell.x, y);
      context.lineTo(Math.min(chart.width, cell.x + layout.tileSize), y);
    }
  }

  context.stroke();
  context.restore();
};

const drawTerritoryBoundaries = (
  context: CanvasRenderingContext2D,
  layout: TerritoryLayout,
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

function buildCountryAnchorMap(data: SquadMarketRaceData) {
  const profiles = data.countries
    .map((country) => {
      let bestRank = Number.POSITIVE_INFINITY;
      let firstTopRank = Number.POSITIVE_INFINITY;
      let firstTopYear = Number.POSITIVE_INFINITY;
      let maxValue = 0;

      for (const snapshot of data.snapshots) {
        const rank = snapshot.ranks.get(country.id) ?? Number.POSITIVE_INFINITY;
        const value = snapshot.values.get(country.id) ?? 0;

        maxValue = Math.max(maxValue, value);
        bestRank = Math.min(bestRank, rank);

        if (rank <= worldCupSquadMarketValueVideoConfig.topN && firstTopYear === Number.POSITIVE_INFINITY) {
          firstTopRank = rank;
          firstTopYear = snapshot.year;
        }
      }

      return {
        bestRank,
        country,
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
        profileA.country.name.localeCompare(profileB.country.name)
      );
    });

  return new Map(
    profiles.map((profile, index) => [
      profile.country.id,
      fixedCountryAnchors[index] ?? spiralAnchorForIndex(index),
    ]),
  );
}

const territoryAnchorForCountry = (row: SquadMarketFrameRow) => {
  const anchor = countryAnchorById.get(row.id) ?? spiralAnchorForIndex(Math.abs(hashText(row.id)) % 120);
  const jitterX = (hashUnit(`${row.id}:x`) - 0.5) * 18;
  const jitterY = (hashUnit(`${row.id}:y`) - 0.5) * 18;
  const baseX = clamp(anchor.x * chart.width + jitterX, 42, chart.width - 42);
  const baseY = clamp(anchor.y * chart.height + jitterY, 42, chart.height - 42);

  return {
    x: baseX,
    y: baseY,
  };
};

function spiralAnchorForIndex(index: number): CountryAnchor {
  const angle = index * 2.399963229728653;
  const ring = 0.18 + (index % 22) * 0.017 + Math.floor(index / 22) * 0.06;

  return {
    x: clamp(0.5 + Math.cos(angle) * ring, 0.05, 0.95),
    y: clamp(0.5 + Math.sin(angle) * ring * 0.92, 0.05, 0.95),
  };
}

const Footer = () => (
  <DataVideoFooter geometry={frameLayout}>
    <DataVideoFooterSource>{worldCupSquadMarketValueVideoConfig.source}</DataVideoFooterSource>
  </DataVideoFooter>
);

const presenceForRow = (row: SquadMarketFrameRow) =>
  easeInOutCubic(clamp(row.topNPresence || (row.liveRank <= worldCupSquadMarketValueVideoConfig.topN ? 1 : 0), 0, 1));

const labelPresenceForRow = (row: SquadMarketFrameRow) => presenceForRow(row);

const countryLabelPlacement = (site: TerritorySite) => {
  const width = Math.round(clamp(184 + site.cellShare * 760, 190, 330));

  return {
    width,
    x: clamp(site.centroidX, width / 2 + 12, chart.width - width / 2 - 12),
    y: clamp(site.centroidY, 118, chart.height - 128),
  };
};

const playerTerritoryLabelIsVisible = (site: PlayerTerritorySite) => {
  if (site.cellCount < playerLabelMinCells) {
    return false;
  }

  return site.kind === 'rest' || site.localRank <= playerBreakdownTopN;
};

const rankForLabel = (row: SquadMarketFrameRow) => {
  if (row.liveRank <= worldCupSquadMarketValueVideoConfig.labelTopN) {
    return row.displayRank;
  }

  if (row.targetRank <= worldCupSquadMarketValueVideoConfig.labelTopN) {
    return row.targetRank;
  }

  return row.previousRank;
};

const formatSquadValue = (value: number) => {
  const usdValue = value * eurToUsdRate;

  if (usdValue >= 1000) {
    return `$${trimFixed(usdValue / 1000, 2)}B`;
  }

  if (usdValue >= 100) {
    return `$${Math.round(usdValue)}M`;
  }

  return `$${trimFixed(usdValue, usdValue >= 10 ? 1 : 2)}M`;
};

const formatCompactValue = (value: number) => {
  const usdValue = value * eurToUsdRate;

  if (usdValue >= 1000) {
    return `$${trimFixed(usdValue / 1000, 1)}B`;
  }

  if (usdValue >= 100) {
    return `$${Math.round(usdValue)}M`;
  }

  if (usdValue >= 10) {
    return `$${trimFixed(usdValue, 1)}M`;
  }

  return `$${trimFixed(usdValue, usdValue >= 1 ? 1 : 2)}M`;
};

const trimFixed = (value: number, digits: number) =>
  value.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');

const countryDisplayName = (name: string) => {
  if (name.length <= 17) {
    return name;
  }

  return `${name.slice(0, 16).trim()}...`;
};

const visualTextLength = (text: string) =>
  Array.from(text.replace(/[\u{E0000}-\u{E007F}]/gu, '')).length;

const playerDisplayName = (name: string) => {
  const cleaned = name.replace(/\s+/g, ' ').trim();
  const lastToken = cleaned.split(' ').filter(Boolean).at(-1) ?? cleaned;
  const preferredName = lastToken.length >= 4 ? lastToken : cleaned;

  if (preferredName.length <= 12) {
    return preferredName;
  }

  return `${preferredName.slice(0, 11).trim()}...`;
};

const flagEmojiForCountry = (row: Pick<SquadMarketFrameRow, 'code'>) =>
  flagEmojiByCode[row.code.toUpperCase()] ?? '🏳️';

const territoryColorFor = (row: SquadMarketFrameRow) =>
  countryTerritoryColorByCode[row.code.toUpperCase()] ??
  (isHexColor(row.color) ? row.color : colorFromHash(row.id));

const medalAccentForRank = (rank: number) => medalAccentByRank[rank];

const colorFromHash = (text: string) => {
  const palette = [
    '#38BDF8',
    '#F97316',
    '#22C55E',
    '#FB7185',
    '#A78BFA',
    '#FACC15',
    '#2DD4BF',
    '#FF4D6D',
  ];

  return palette[Math.abs(hashText(text)) % palette.length];
};

const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

const hexToRgb = (hex: string): [number, number, number] => {
  const fallback: [number, number, number] = [56, 189, 248];
  const normalized = isHexColor(hex) ? hex.slice(1) : '';

  if (!normalized) {
    return fallback;
  }

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
};

const hexToRgba = (hex: string, alpha: number) => {
  const [red, green, blue] = hexToRgb(hex);

  return `rgba(${red},${green},${blue},${alpha})`;
};

const hashUnit = (text: string) => (Math.abs(hashText(text)) % 10000) / 10000;

const hashText = (text: string) => {
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }

  return hash;
};

const easeInOutCubic = (value: number) =>
  value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const clampRange = (value: number, min: number, max: number) => {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);

  return clamp(value, lower, upper);
};

const styles = {
  chartFrame: {
    background:
      'linear-gradient(180deg, rgba(2,4,9,0.98), rgba(7,18,28,0.98)), radial-gradient(circle at 50% 28%, rgba(245,232,41,0.11), rgba(0,0,0,0) 58%)',
  },
  leaderAccentBar: {
    alignSelf: 'stretch',
    background: '#F5E829',
    width: 5,
  },
  leaderDivider: {
    alignSelf: 'stretch',
    background: 'rgba(255,255,255,0.24)',
    width: 1,
  },
  leaderLabel: {
    color: 'rgba(245,232,41,0.82)',
    fontSize: 28,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
  },
  leaderStrip: {
    alignItems: 'center',
    background: 'rgba(2,8,14,0.82)',
    border: '1px solid rgba(255,255,255,0.22)',
    boxShadow: '0 14px 34px rgba(0,0,0,0.34)',
    display: 'flex',
    flex: '1 1 auto',
    gap: 8,
    minWidth: 0,
    minHeight: 38,
    overflow: 'hidden',
    padding: '3px 12px 3px 0',
  },
  topCountryGroup: {
    alignItems: 'baseline',
    display: 'flex',
    flex: '1 1 auto',
    gap: 9,
    minWidth: 0,
  },
  topCountrySlot: {
    alignItems: 'stretch',
    display: 'flex',
    flex: '1 1 0',
    gap: 10,
    minWidth: 0,
  },
  topCountryValue: {
    color: '#FFFFFF',
    flex: '1 1 auto',
    fontSize: 30,
    fontWeight: 950,
    lineHeight: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  playerTerritoryLabel: {
    color: '#FFFFFF',
    pointerEvents: 'none',
    position: 'absolute',
    textAlign: 'center',
    textShadow: '0 2px 0 rgba(0,0,0,0.54), 0 0 8px rgba(0,0,0,0.52)',
    transformOrigin: 'center center',
    willChange: 'opacity, transform',
    zIndex: 24,
  },
  playerTerritoryName: {
    color: 'rgba(255,255,255,0.78)',
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 0.96,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  playerTerritoryValue: {
    color: 'rgba(255,255,255,0.66)',
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
    marginTop: 2,
    whiteSpace: 'nowrap',
  },
  territoryCanvas: {
    display: 'block',
    height: chart.height,
    width: chart.width,
  },
  territoryCoverage: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1,
    marginTop: 7,
    textShadow: '0 3px 9px rgba(0,0,0,0.76)',
  },
  territoryLabel: {
    color: '#FFFFFF',
    position: 'absolute',
    textAlign: 'center',
    transformOrigin: 'center center',
    willChange: 'transform, opacity',
  },
  territoryLabelLayer: {
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
  },
  territoryRankName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 0.94,
    textShadow:
      '0 3px 0 rgba(0,0,0,0.82), 2px 0 0 rgba(0,0,0,0.46), -2px 0 0 rgba(0,0,0,0.46)',
    whiteSpace: 'nowrap',
  },
  territoryShade: {
    background:
      'radial-gradient(circle at 50% 18%, rgba(255,255,255,0.08), rgba(255,255,255,0) 30%), linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.24)), radial-gradient(ellipse at center, rgba(0,0,0,0) 48%, rgba(0,0,0,0.42) 100%)',
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
  },
  territoryValue: {
    color: 'rgba(255,255,255,0.96)',
    fontSize: 31,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1.02,
    marginTop: 7,
    textShadow:
      '0 3px 0 rgba(0,0,0,0.88), 2px 0 0 rgba(0,0,0,0.56), -2px 0 0 rgba(0,0,0,0.56)',
    whiteSpace: 'nowrap',
  },
} satisfies Record<string, CSSProperties>;
