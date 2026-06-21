import type { CSSProperties } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
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
import { SHORTS_PLATFORM_TOP_CLEARANCE } from '../../shared/video';
import { worldCupRankTrackerConfig } from './config';
import {
  buildWorldCupRankData,
  formatRank,
  getWorldCupRankFrameState,
  rankValueForDisplay,
  type WorldCupRankFrameCountry,
  type WorldCupRankFrameState,
  type WorldCupRankSnapshot,
} from './rankData';

const rankData = buildWorldCupRankData(worldCupRankTrackerConfig.snapshots);
const fontStack = dataVideoFontStack;
const channelHandle = '@whoa-data';
const rankCutoff = 8;
const frameInset = {
  left: 76,
  right: 76,
};
const frameLayout = createDataVideoFrameGeometry({
  chartHeight: 965,
  chartTop: 552 + SHORTS_PLATFORM_TOP_CLEARANCE,
  footerTop: 1606,
  frameInset,
  headerTop: 158 + SHORTS_PLATFORM_TOP_CLEARANCE,
  timelineRailTop: 342 + SHORTS_PLATFORM_TOP_CLEARANCE,
});
const chart = frameLayout.chart;
const plot = {
  bottom: 132,
  left: 118,
  right: 82,
  top: 86,
};
const plotWidth = chart.width - plot.left - plot.right;
const plotHeight = chart.height - plot.top - plot.bottom;
const plotRight = plot.left + plotWidth;
const plotBottom = plot.top + plotHeight;
const plotVerticalPadding = 58;
const plotInnerTop = plot.top + plotVerticalPadding;
const plotInnerBottom = plotBottom - plotVerticalPadding;
const plotInnerHeight = plotInnerBottom - plotInnerTop;
const rankExitDistance = 150;
const visibleTournamentSpan = 3;
const windowAnchorRatio = 2 / 3;
const rankTicks = [1, 2, 3, 4, 5, 6, 7, 8];

export const WorldCupRankTrackerVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(worldCupRankTrackerConfig.startHoldSeconds * fps);
  const endHoldFrames = Math.round(worldCupRankTrackerConfig.endHoldSeconds * fps);
  const motionFrames = Math.max(1, durationInFrames - startHoldFrames - endHoldFrames);
  const rankFrame = clamp(frame - startHoldFrames, 0, motionFrames - 1);
  const endSequenceFrame = frame - (durationInFrames - endHoldFrames);
  const endZoomFrames = Math.max(1, Math.round(endHoldFrames * 0.72));
  const overviewProgress = easeInOutCubic(clamp(endSequenceFrame / endZoomFrames, 0, 1));
  const state = getWorldCupRankFrameState({
    data: rankData,
    durationInFrames: motionFrames,
    frame: rankFrame,
  });

  return (
    <DataVideoFrameLayout style={styles.stage}>
      <DataVideoBackground chart={chart} />
      <DataVideoHeader
        accentColor="#FACC15"
        geometry={frameLayout}
        intro={1}
        subtitle={worldCupRankTrackerConfig.subtitle}
        title={worldCupRankTrackerConfig.title}
        titleHook={worldCupRankTrackerConfig.titleHook}
      />
      <DataVideoTimelineRail
        accentColor="#FACC15"
        currentLabel={state.currentLabel}
        geometry={frameLayout}
        intro={1}
        maxLabel={rankData.maxYear}
        minLabel={rankData.minYear}
        progress={state.progress}
      />
      <DataVideoChartTopBar chart={chart} intro={1}>
        <TournamentStrip state={state} />
        <DataVideoChannelTag>{channelHandle}</DataVideoChannelTag>
      </DataVideoChartTopBar>
      <DataVideoChartFrame chart={chart} intro={1} style={styles.chartFrame}>
        <RankLineChart overviewProgress={overviewProgress} state={state} />
      </DataVideoChartFrame>
      <Footer />
    </DataVideoFrameLayout>
  );
};

const TournamentStrip = ({ state }: { state: WorldCupRankFrameState }) => (
  <div style={styles.tournamentStrip}>
    <div style={styles.tournamentItem}>
      <span style={styles.tournamentLabel}>WORLD CUP</span>
      <span style={styles.tournamentValue}>{state.currentLabel}</span>
    </div>
    <div style={styles.tournamentDivider} />
    <div style={styles.tournamentItem}>
      <span style={styles.tournamentLabel}>BEST NOW</span>
      <span style={styles.tournamentValue}>
        {state.leader ? `${state.leader.name} ${formatRank(state.leader.displayRank)}` : '-'}
      </span>
    </div>
  </div>
);

type ChartPoint = {
  index: number;
  rank: number | null;
  rankValue: number;
  x: number;
  y: number;
};

type RankSeries = {
  country: WorldCupRankFrameCountry;
  currentPoint: ChartPoint;
  path: string;
  points: ChartPoint[];
};

type ChartWindow = {
  currentIndex: number;
  endIndex: number;
  overviewProgress: number;
  span: number;
  startIndex: number;
};

const RankLineChart = ({
  overviewProgress,
  state,
}: {
  overviewProgress: number;
  state: WorldCupRankFrameState;
}) => {
  const window = getChartWindow(state.progress, overviewProgress);
  const series = buildRankSeries(state, window);
  const currentX = xForIndex(window.currentIndex, window);
  const markerLabels = buildMarkerLabels(series);

  return (
    <svg height={chart.height} style={styles.rankSvg} viewBox={`0 0 ${chart.width} ${chart.height}`} width={chart.width}>
      <defs>
        <linearGradient id="rankBackdrop" x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#08111D" />
          <stop offset="56%" stopColor="#03060B" />
          <stop offset="100%" stopColor="#010205" />
        </linearGradient>
        <radialGradient cx="50%" cy="18%" id="rankGlow" r="78%">
          <stop offset="0%" stopColor="rgba(250,204,21,0.16)" />
          <stop offset="42%" stopColor="rgba(45,212,191,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <clipPath id="rankPlotClip">
          <rect height={plotHeight} width={plotWidth} x={plot.left} y={plot.top} />
        </clipPath>
        <filter height="170%" id="lineShadow" width="170%" x="-35%" y="-35%">
          <feDropShadow dx={0} dy={10} floodColor="#000000" floodOpacity={0.66} stdDeviation={6} />
        </filter>
        <filter height="170%" id="pointGlow" width="170%" x="-35%" y="-35%">
          <feDropShadow dx={0} dy={0} floodColor="#FFFFFF" floodOpacity={0.38} stdDeviation={3} />
          <feDropShadow dx={0} dy={8} floodColor="#000000" floodOpacity={0.5} stdDeviation={5} />
        </filter>
      </defs>
      <rect fill="url(#rankBackdrop)" height={chart.height} width={chart.width} x={0} y={0} />
      <rect fill="url(#rankGlow)" height={chart.height} width={chart.width} x={0} y={0} />
      <AxisGrid window={window} />
      <line
        opacity={0.92}
        stroke="#FACC15"
        strokeDasharray="10 12"
        strokeWidth={4}
        x1={currentX}
        x2={currentX}
        y1={plotInnerTop - 18}
        y2={plotInnerBottom + 18}
      />
      <CurrentMarkerLabel currentX={currentX} state={state} />
      <g clipPath="url(#rankPlotClip)">
        <g filter="url(#lineShadow)">
          {series.map((line) => {
            const presence = overviewLinePresence(line, window.overviewProgress);

            return (
              <path
                d={line.path}
                fill="none"
                key={`${line.country.id}-underlay`}
                opacity={0.78 * presence}
                stroke="#000000"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={lineUnderlayWidth(line, window.overviewProgress)}
              />
            );
          })}
        </g>
        {series.map((line) => (
          <path
            d={line.path}
            fill="none"
            key={line.country.id}
            opacity={overviewLinePresence(line, window.overviewProgress)}
            stroke={line.country.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={lineStrokeWidth(line, window.overviewProgress)}
          />
        ))}
        {series.map((line) => (
          <g key={`${line.country.id}-points`}>
            {line.points.map((point) => (
              <circle
                cx={point.x}
                cy={point.y}
                fill="#020409"
                key={`${line.country.id}-${point.index}`}
                opacity={overviewPointPresence(line, window.overviewProgress)}
                r={5}
                stroke={line.country.color}
                strokeWidth={3}
              />
            ))}
            <circle
              cx={line.currentPoint.x}
              cy={line.currentPoint.y}
              fill={line.country.color}
              filter="url(#pointGlow)"
              r={line.country.targetRank && line.country.targetRank <= 3 ? 13 : 11}
              stroke="#FFFFFF"
              strokeWidth={4}
            />
          </g>
        ))}
      </g>
      {markerLabels.map((label) => (
        <MarkerLabel
          key={`${label.series.country.id}-label`}
          labelX={label.labelX}
          labelY={label.labelY}
          series={label.series}
          side={label.side}
        />
      ))}
    </svg>
  );
};

const AxisGrid = ({ window }: { window: ChartWindow }) => {
  return (
    <g>
    <rect
      fill="rgba(255,255,255,0.03)"
      height={plotHeight}
      stroke="rgba(255,255,255,0.2)"
      strokeWidth={1}
      width={plotWidth}
      x={plot.left}
      y={plot.top}
    />
    {rankTicks.map((rank) => {
      const y = yForRankValue(rank);
      const isCutoff = rank === rankCutoff;

      return (
        <g key={`rank-${rank}`}>
          <line
            stroke={isCutoff ? 'rgba(250,204,21,0.72)' : 'rgba(255,255,255,0.16)'}
            strokeDasharray={isCutoff ? '7 9' : undefined}
            strokeWidth={isCutoff ? 3 : 1}
            x1={plot.left}
            x2={plotRight}
            y1={y}
            y2={y}
          />
          <text
            fill={isCutoff ? '#FACC15' : 'rgba(255,255,255,0.82)'}
            fontFamily={fontStack}
            fontSize={24}
            fontWeight={950}
            textAnchor="end"
            x={plot.left - 18}
            y={y + 8}
          >
            {`#${rank}`}
          </text>
        </g>
      );
    })}
    {rankData.snapshots.map((snapshot, index) => {
      const x = xForIndex(index, window);
      const isVisibleLine = x >= plot.left - 1 && x <= plotRight + 1;
      const isVirtualStart = snapshot.isVirtualStart === true;
      const isOverview = window.overviewProgress > 0.55;
      const labelBaseIndex = Math.min(
        rankData.snapshots.length - 2,
        Math.max(1, Math.floor(window.currentIndex + 0.0001)),
      );
      const [yearLabel, ...hostParts] = snapshot.label.split(' ');
      const hostLabel = hostParts.join(' ');
      const isActiveLabel = Math.abs(index - window.currentIndex) < 0.5;
      const shouldShowRacingLabel =
        !isVirtualStart &&
        index >= labelBaseIndex - 1 &&
        index <= labelBaseIndex + 1 &&
        x >= plot.left - 4 &&
        x <= plotRight + 4;
      const shouldShowOverviewLabel =
        !isVirtualStart &&
        (index === 1 ||
          index === rankData.snapshots.length - 1 ||
          (index > 1 &&
            index < rankData.snapshots.length - 3 &&
            (index - 1) % 5 === 0)) &&
        x >= plot.left - 4 &&
        x <= plotRight + 4;
      const shouldShowLabel = isOverview ? shouldShowOverviewLabel : shouldShowRacingLabel;
      const shouldShowHost = !isOverview;

      if (!isVisibleLine) {
        return null;
      }

      return (
        <g key={snapshot.year}>
          <line
            stroke={shouldShowLabel ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.09)'}
            strokeWidth={shouldShowLabel ? 2 : 1}
            x1={x}
            x2={x}
            y1={plotInnerTop}
            y2={plotInnerBottom}
          />
          {shouldShowLabel ? (
            <text
              fill={isActiveLabel ? '#FACC15' : '#FFFFFF'}
              fontFamily={fontStack}
              fontSize={isOverview ? (isActiveLabel ? 19 : 16) : isActiveLabel ? 23 : 20}
              fontWeight={950}
              textAnchor="middle"
              x={x}
              y={plotBottom + 43}
            >
              <tspan x={x}>{yearLabel}</tspan>
              {shouldShowHost ? (
                <tspan
                  fill={
                    isActiveLabel
                      ? 'rgba(250,204,21,0.86)'
                      : 'rgba(255,255,255,0.74)'
                  }
                  fontSize={15}
                  x={x}
                  y={plotBottom + 67}
                >
                  {hostLabel}
                </tspan>
              ) : null}
            </text>
          ) : null}
        </g>
      );
    })}
    <text
      fill="rgba(250,204,21,0.96)"
      fontFamily={fontStack}
      fontSize={24}
      fontWeight={950}
      x={plot.left}
      y={plot.top - 34}
    >
      Top 8 final rank
    </text>
    {window.overviewProgress < 0.55 ? (
      <text
        fill="rgba(250,204,21,0.82)"
        fontFamily={fontStack}
        fontSize={18}
        fontWeight={850}
        textAnchor="end"
        x={plotRight}
        y={yForRankValue(rankCutoff) - 10}
      >
        TOP 8 CUTOFF
      </text>
    ) : null}
    </g>
  );
};

const CurrentMarkerLabel = ({
  currentX,
  state,
}: {
  currentX: number;
  state: WorldCupRankFrameState;
}) => {
  const labelWidth = 210;
  const x = clamp(currentX - labelWidth / 2, plot.left, plotRight - labelWidth);

  return (
    <g>
      <rect
        fill="#FACC15"
        height={38}
        rx={5}
        width={labelWidth}
        x={x}
        y={plot.top - 70}
      />
      <text
        fill="#020409"
        fontFamily={fontStack}
        fontSize={21}
        fontWeight={950}
        textAnchor="middle"
        x={x + labelWidth / 2}
        y={plot.top - 45}
      >
        {state.currentLabel}
      </text>
    </g>
  );
};

type MarkerLabelLayout = {
  labelX: number;
  labelY: number;
  series: RankSeries;
  side: 'left' | 'right';
};

const MarkerLabel = ({
  labelX,
  labelY,
  side,
  series,
}: MarkerLabelLayout) => {
  const country = series.country;
  const currentRank = series.currentPoint.rank;
  const countryLabelWidth = 162;
  const labelHeight = 34;
  const rankText = formatRank(currentRank);
  const rankWidth = rankText === 'OUT' ? 44 : 36;
  const labelGap = 7;
  const rankX = side === 'right' ? labelX : labelX + countryLabelWidth + labelGap;
  const countryLabelX = side === 'right' ? labelX + rankWidth + labelGap : labelX;
  const connectorX = side === 'right' ? rankX : rankX + rankWidth;

  return (
    <g>
      <line
        opacity={0.7}
        stroke={country.color}
        strokeWidth={2}
        x1={series.currentPoint.x}
        x2={connectorX}
        y1={series.currentPoint.y}
        y2={labelY}
      />
      <rect
        fill="rgba(2,4,9,0.96)"
        height={labelHeight}
        rx={6}
        stroke={country.color}
        strokeOpacity={1}
        strokeWidth={2}
        width={countryLabelWidth}
        x={countryLabelX}
        y={labelY - labelHeight / 2}
      />
      <text
        fill="#FFFFFF"
        fontFamily='"Apple Color Emoji", "Segoe UI Emoji", sans-serif'
        fontSize={19}
        fontWeight={900}
        x={countryLabelX + 10}
        y={labelY + 7}
      >
        {flagForCode(country.code)}
      </text>
      <text
        fill="#FFFFFF"
        fontFamily={fontStack}
        fontSize={13}
        fontWeight={950}
        x={countryLabelX + 38}
        y={labelY + 5}
      >
        {country.name}
      </text>
      <rect
        fill={country.color}
        height={24}
        rx={5}
        width={rankWidth}
        x={rankX}
        y={labelY - 12}
      />
      <text
        fill="#020409"
        fontFamily={fontStack}
        fontSize={rankText === 'OUT' ? 12 : 13}
        fontWeight={950}
        textAnchor="middle"
        x={rankX + rankWidth / 2}
        y={labelY + 5}
      >
        {rankText}
      </text>
    </g>
  );
};

const buildRankSeries = (state: WorldCupRankFrameState, window: ChartWindow): RankSeries[] => {
  const startIndex = Math.max(0, Math.floor(window.startIndex) - 1);
  const completeIndex = Math.min(
    rankData.snapshots.length - 1,
    Math.floor(window.currentIndex + 0.0001),
  );

  return state.rows.map((country) => {
    const points: ChartPoint[] = [];

    for (let index = startIndex; index <= completeIndex; index += 1) {
      const snapshot = rankData.snapshots[index];
      points.push(pointForSnapshot(index, snapshot, country.id, window));
    }

    const currentPoint = pointForProgress(country, window);
    const duplicatesExistingPoint = points.some((point) => Math.abs(point.index - window.currentIndex) < 0.001);

    if (!duplicatesExistingPoint) {
      points.push(currentPoint);
    }

    const sortedPoints = points.sort((pointA, pointB) => pointA.index - pointB.index);

    return {
      country,
      currentPoint,
      path: buildPath(sortedPoints),
      points: sortedPoints,
    };
  });
};

const pointForSnapshot = (
  index: number,
  snapshot: WorldCupRankSnapshot | undefined,
  countryId: string,
  window: ChartWindow,
): ChartPoint => {
  const rank = snapshot?.countries.find((country) => country.id === countryId)?.rank ?? null;
  const rankValue = rankValueForDisplay(rank);

  return {
    index,
    rank,
    rankValue,
    x: xForIndex(index, window),
    y: yForRankValue(rankValue),
  };
};

const pointForProgress = (country: WorldCupRankFrameCountry, window: ChartWindow): ChartPoint => ({
  index: window.currentIndex,
  rank: country.displayRank,
  rankValue: country.rankValue,
  x: xForIndex(window.currentIndex, window),
  y: yForRankValue(country.rankValue),
});

const buildMarkerLabels = (series: RankSeries[]): MarkerLabelLayout[] => {
  const labels = series
    .filter((line) => line.currentPoint.rank !== null && line.currentPoint.y <= plotBottom - 8)
    .map((line) => ({
      labelX: 0,
      labelY: line.currentPoint.y,
      series: line,
      side: 'right' as const,
    }));
  const groupedLabels = new Map<number, MarkerLabelLayout[]>();

  for (const label of labels) {
    const key = Math.round(label.series.currentPoint.y / 18);
    groupedLabels.set(key, [...(groupedLabels.get(key) ?? []), label]);
  }

  for (const group of groupedLabels.values()) {
    const baseY =
      group.reduce((sum, label) => sum + label.series.currentPoint.y, 0) / Math.max(1, group.length);
    const isLowerHalf = baseY > (plotInnerTop + plotInnerBottom) / 2;

    group
      .sort((labelA, labelB) =>
        labelA.series.currentPoint.rankValue - labelB.series.currentPoint.rankValue ||
        labelA.series.country.name.localeCompare(labelB.series.country.name)
      )
      .forEach((label, index) => {
        const spread = group.length === 1 ? 0 : index * 38;
        const offset = isLowerHalf ? -spread : spread;

        label.labelY = round1(clamp(baseY + offset, plotInnerTop - 28, plotInnerBottom + 28));
        label.labelX = labelXForAttachedPoint(label.series.currentPoint.x, label.side);
      });
  }

  return labels;
};

const labelXForAttachedPoint = (
  pointX: number,
  side: 'left' | 'right',
) => {
  const labelWidth = 216;
  const labelGap = 18;
  const rawX = side === 'right' ? pointX + labelGap : pointX - labelWidth - labelGap;

  return round1(clamp(rawX, plot.left + 6, plotRight - labelWidth - 6));
};

const isRankedNow = (line: RankSeries) => line.country.displayRank !== null;

const overviewLinePresence = (line: RankSeries, overviewProgress: number) =>
  isRankedNow(line) ? 1 : lerp(1, 0.1, overviewProgress);

const overviewPointPresence = (line: RankSeries, overviewProgress: number) =>
  isRankedNow(line) ? 1 : lerp(1, 0, overviewProgress);

const lineStrokeWidth = (line: RankSeries, overviewProgress: number) => {
  const baseWidth = line.country.targetRank && line.country.targetRank <= 3 ? 9 : 6;

  return isRankedNow(line) ? baseWidth : lerp(baseWidth, 2.2, overviewProgress);
};

const lineUnderlayWidth = (line: RankSeries, overviewProgress: number) => {
  const baseWidth = line.country.targetRank && line.country.targetRank <= 3 ? 18 : 14;

  return isRankedNow(line) ? baseWidth : lerp(baseWidth, 3, overviewProgress);
};

const flagIso2ByCode: Record<string, string> = {
  ARG: 'AR',
  AUT: 'AT',
  BEL: 'BE',
  BRA: 'BR',
  BUL: 'BG',
  CHI: 'CL',
  CMR: 'CM',
  COL: 'CO',
  CRC: 'CR',
  CRO: 'HR',
  CUB: 'CU',
  DEN: 'DK',
  ESP: 'ES',
  FRA: 'FR',
  FRG: 'DE',
  GDR: 'DE',
  GER: 'DE',
  GHA: 'GH',
  HUN: 'HU',
  IRL: 'IE',
  ITA: 'IT',
  KOR: 'KR',
  MAR: 'MA',
  MEX: 'MX',
  NED: 'NL',
  PAR: 'PY',
  PER: 'PE',
  POL: 'PL',
  POR: 'PT',
  PRK: 'KP',
  ROU: 'RO',
  RUS: 'RU',
  SEN: 'SN',
  SUI: 'CH',
  SWE: 'SE',
  TCH: 'CZ',
  TUR: 'TR',
  UKR: 'UA',
  URS: 'RU',
  URU: 'UY',
  USA: 'US',
  YUG: 'RS',
};

const flagForCode = (code: string) => {
  if (code === 'ENG') {
    return subdivisionFlag('gbeng');
  }

  if (code === 'NIR') {
    return subdivisionFlag('gbnir');
  }

  if (code === 'WAL') {
    return subdivisionFlag('gbwls');
  }

  const iso2Code = flagIso2ByCode[code] ?? code.slice(0, 2);
  const letters = iso2Code.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);

  if (letters.length !== 2) {
    return code;
  }

  return [...letters]
    .map((letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397))
    .join('');
};

const subdivisionFlag = (tag: string) =>
  String.fromCodePoint(
    0x1F3F4,
    ...[...tag.toLowerCase()].map((letter) => 0xE0000 + letter.charCodeAt(0)),
    0xE007F,
  );

const buildPath = (points: ChartPoint[]) =>
  points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${round1(point.x)} ${round1(point.y)}`)
    .join(' ');

const getChartWindow = (progress: number, overviewProgress: number): ChartWindow => {
  const maxIndex = Math.max(0, rankData.snapshots.length - 1);
  const racingSpan = Math.min(visibleTournamentSpan, Math.max(1, maxIndex));
  const currentIndex = progress * maxIndex;
  const racingStartIndex = Math.max(0, currentIndex - racingSpan * windowAnchorRatio);
  const overviewSpan = Math.max(racingSpan, maxIndex / windowAnchorRatio);
  const span = lerp(racingSpan, overviewSpan, overviewProgress);
  const startIndex = lerp(racingStartIndex, 0, overviewProgress);

  return {
    currentIndex,
    endIndex: startIndex + span,
    overviewProgress,
    span,
    startIndex,
  };
};

const xForIndex = (index: number, window: ChartWindow) =>
  round1(plot.left + ((index - window.startIndex) / window.span) * plotWidth);

const yForRankValue = (rankValue: number) => {
  if (rankValue > rankCutoff) {
    return round1(plotInnerBottom + (rankValue - rankCutoff) * rankExitDistance);
  }

  return round1(plotInnerTop + ((rankValue - 1) / (rankCutoff - 1)) * plotInnerHeight);
};

const Footer = () => (
  <DataVideoFooter geometry={frameLayout}>
    <DataVideoFooterSource>{worldCupRankTrackerConfig.source}</DataVideoFooterSource>
    <DataVideoFooterNote>
      Teams outside the top 8 leave the chart below the cutoff line.
    </DataVideoFooterNote>
  </DataVideoFooter>
);

const round1 = (value: number) => Math.round(value * 10) / 10;

const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

const easeInOutCubic = (value: number) =>
  value < 0.5 ? 4 * value * value * value : 1 - ((-2 * value + 2) ** 3) / 2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const styles = {
  stage: {
    backgroundColor: '#020409',
  },
  chartFrame: {
    background:
      'linear-gradient(180deg, rgba(2,4,9,0.98), rgba(7,18,28,0.98)), radial-gradient(circle at 50% 26%, rgba(250,204,21,0.13), rgba(0,0,0,0) 58%)',
  },
  tournamentStrip: {
    alignItems: 'center',
    background: 'rgba(2,8,14,0.84)',
    border: '1px solid rgba(255,255,255,0.24)',
    boxShadow: '0 14px 34px rgba(0,0,0,0.34)',
    display: 'flex',
    gap: 14,
    minHeight: 44,
    padding: '8px 14px',
  },
  tournamentItem: {
    alignItems: 'baseline',
    display: 'flex',
    gap: 8,
  },
  tournamentLabel: {
    color: 'rgba(250,204,21,0.86)',
    fontSize: 15,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
  },
  tournamentValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1,
  },
  tournamentDivider: {
    alignSelf: 'stretch',
    background: 'rgba(255,255,255,0.24)',
    width: 1,
  },
  rankSvg: {
    display: 'block',
    height: chart.height,
    width: chart.width,
  },
} satisfies Record<string, CSSProperties>;
