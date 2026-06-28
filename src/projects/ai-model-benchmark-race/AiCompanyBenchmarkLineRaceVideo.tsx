import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  createDefaultDataShortsFrameGeometry,
  dataVideoFontStack,
} from '../../shared/dataVideoFrame';
import {
  buildAiModelBenchmarkRaceData,
  type AiModelEntry,
  type AiModelOrganization,
} from './aiModelBenchmarkRace';
import { aiModelBenchmarkVideoConfig } from './config';

type CompanyLinePoint = {
  monthIndex: number;
  value: number;
};

type CompanyModelMilestone = {
  entry: AiModelEntry;
  releaseMonthIndex: number;
  score: number;
};

type CompanyRaceRow = {
  color: string;
  displayRank: number;
  id: AiModelOrganization;
  milestones: CompanyModelMilestone[];
  modelName: string;
  opacity: number;
  organization: AiModelOrganization;
  points: CompanyLinePoint[];
  releaseMonthIndex: number;
  value: number;
};

type CompanyFrameState = {
  currentMonthIndex: number;
  leaderColor: string;
  maxValue: number;
  minValue: number;
  month: number;
  monthProgress: number;
  outroProgress: number;
  rows: CompanyRaceRow[];
  xMaxMonthIndex: number;
  xMinMonthIndex: number;
  year: number;
};

const raceData = buildAiModelBenchmarkRaceData();
const frameLayout = createDefaultDataShortsFrameGeometry({
  chartHeight: 860,
});
const chart = frameLayout.chart;
const footerInset = frameLayout.footerInset ?? frameLayout.frameInset;
const yearRail = frameLayout.timelineRail;
const fontStack = dataVideoFontStack;
const channelHandle = '@whoa-data';
const topN = aiModelBenchmarkVideoConfig.topN;
const linePlot = {
  bottom: 92,
  left: 84,
  right: 54,
  top: 74,
};
const linePlotWidth = chart.width - linePlot.left - linePlot.right;
const linePlotHeight = chart.height - linePlot.top - linePlot.bottom;
const endpointLabelWidth = 258;
const endpointLogoSize = 46;
const lineRaceStartMonthIndex = monthIndexFromYearMonth(2023, 1);
const lineRaceEndMonthIndex = raceData.maxMonthIndex;
const minMonthYear = Math.floor(lineRaceStartMonthIndex / 12);
const minMonth = lineRaceStartMonthIndex % 12 + 1;
const maxDisplayMonthIndex = Math.round(lineRaceEndMonthIndex);
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

const companyLineColors: Record<AiModelOrganization, string> = {
  Alibaba: '#FF6A00',
  Anthropic: '#D7A27E',
  DeepSeek: '#2458FF',
  Google: '#FBBC04',
  Kimi: '#7C3AED',
  Meta: '#0866FF',
  Mistral: '#FA520F',
  OpenAI: '#10A37F',
  xAI: '#E5E7EB',
};

const milestoneLabelYOffsetByOrganization: Record<AiModelOrganization, number> = {
  Alibaba: 10,
  Anthropic: -13,
  DeepSeek: 11,
  Google: 9,
  Kimi: 11,
  Meta: -12,
  Mistral: -12,
  OpenAI: 10,
  xAI: -13,
};

const allOrganizations = Array.from(new Set(raceData.entries.map((entry) => entry.organization)));
const organizationMilestoneMap = new Map(
  allOrganizations.map((organization) => [
    organization,
    buildScoreMilestonesForOrganization(organization),
  ]),
);
const organizationOrder = allOrganizations
  .sort((a, b) =>
    firstReleaseMonthForOrganization(a) - firstReleaseMonthForOrganization(b) ||
    a.localeCompare(b)
  );

export const AiCompanyBenchmarkLineRaceVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(aiModelBenchmarkVideoConfig.startHoldSeconds * fps);
  const postRaceHoldFrames = Math.round(aiModelBenchmarkVideoConfig.postRaceHoldSeconds * fps);
  const zoomOutFrames = Math.round(aiModelBenchmarkVideoConfig.zoomOutSeconds * fps);
  const endHoldFrames = Math.round(aiModelBenchmarkVideoConfig.endHoldSeconds * fps);
  const raceDurationInFrames = Math.max(
    1,
    durationInFrames - startHoldFrames - postRaceHoldFrames - zoomOutFrames - endHoldFrames,
  );
  const raceFrame = clamp(frame - startHoldFrames, 0, raceDurationInFrames - 1);
  const zoomOutStartFrame = startHoldFrames + raceDurationInFrames + postRaceHoldFrames;
  const outroProgress = smootherStep(
    clamp((frame - zoomOutStartFrame) / Math.max(1, zoomOutFrames), 0, 1),
  );
  const intro = interpolate(frame, [0, Math.round(0.55 * fps)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const state = getCompanyFrameState({
    durationInFrames: raceDurationInFrames,
    frame: raceFrame,
    outroProgress,
  });

  return (
    <AbsoluteFill style={styles.stage}>
      <Background state={state} />
      <Header intro={intro} />
      <MonthRail intro={intro} state={state} />
      <LineRaceChart state={state} />
      <Footer />
    </AbsoluteFill>
  );
};

const Header = ({ intro }: { intro: number }) => {
  const y = interpolate(intro, [0, 1], [-28, 0]);

  return (
    <div style={{ ...styles.header, opacity: intro, transform: `translateY(${y}px)` }}>
      <div style={styles.titleHook}>{aiModelBenchmarkVideoConfig.titleHook}</div>
      <div style={styles.title}>AI Company Benchmark Race</div>
    </div>
  );
};

const MonthRail = ({ intro, state }: { intro: number; state: CompanyFrameState }) => {
  const fillWidth = clamp(state.monthProgress, 0, 1) * yearRail.width;

  return (
    <div style={{ ...styles.monthRailBlock, opacity: intro }}>
      <div style={styles.monthRailHeader}>
        <div style={styles.currentMonth}>{formatDisplayMonthLabel(state.year, state.month)}</div>
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
          {formatDisplayMonthLabel(minMonthYear, minMonth)}
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
          {formatDisplayMonthLabel(maxMonthYear, maxMonth)}
        </text>
      </svg>
    </div>
  );
};

const LineRaceChart = ({ state }: { state: CompanyFrameState }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const option = useMemo(() => buildEChartsLineRaceOption(state), [state]);

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
      <ModelMilestoneOverlay state={state} />
      <EndpointOverlay state={state} />
    </div>
  );
};

const ModelMilestoneOverlay = ({ state }: { state: CompanyFrameState }) => {
  const labels = buildMilestoneLabels(state);

  return (
    <div style={styles.milestoneOverlay}>
      {labels.map((label) => (
        <div
          key={`${label.organization}-${label.milestone.entry.id}`}
          style={{
            ...styles.milestoneLabel,
            color: colorWithOpacity(label.color, 0.9),
            left: label.x,
            opacity: label.opacity,
            top: label.y,
          }}
        >
          {label.milestone.entry.model}
        </div>
      ))}
    </div>
  );
};

const EndpointOverlay = ({ state }: { state: CompanyFrameState }) => {
  const endpoints = buildEndpointLabels(state);
  const overlayOpacity = 1 - state.outroProgress;

  return (
    <div style={styles.endpointOverlay}>
      {endpoints.map((endpoint) => {
        const logo = organizationLogoAssets[endpoint.row.organization];

        return (
          <div
            key={endpoint.row.id}
            style={{
              ...styles.endpointLabel,
              left: endpoint.x,
              opacity: endpoint.row.opacity * overlayOpacity,
              top: endpoint.y,
              zIndex: 1000 - endpoint.row.displayRank,
            }}
          >
            <div
              style={{
                ...styles.endpointLogo,
                borderColor: colorWithOpacity(endpoint.row.color, 0.76),
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
            <div style={styles.endpointTextBlock}>
              <div style={styles.endpointTopLine}>
                <span style={styles.endpointRank}>{endpoint.row.displayRank}</span>
                <span
                  style={{
                    ...styles.endpointName,
                  }}
                >
                  {formatEndpointModelName(endpoint.row.modelName)}
                </span>
              </div>
              <div style={styles.endpointScore}>{formatScore(endpoint.row.value)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const buildEChartsLineRaceOption = (state: CompanyFrameState): EChartsOption => {
  const currentX = xForMonth(state.currentMonthIndex, state);
  const milestoneDotSeries = buildMilestoneDotSeries(state);
  const lineFade = 1 - state.outroProgress;

  return {
    animation: false,
    animationDuration: 0,
    animationDurationUpdate: 0,
    backgroundColor: 'transparent',
    grid: {
      bottom: linePlot.bottom,
      left: linePlot.left,
      right: linePlot.right,
      top: linePlot.top,
    },
    graphic: {
      elements: [
        {
          type: 'line',
          id: 'current-month-line',
          silent: true,
          shape: {
            x1: currentX,
            x2: currentX,
            y1: linePlot.top,
            y2: chart.height - linePlot.bottom,
          },
          style: {
            lineDash: [10, 10],
            lineWidth: 2,
            opacity: 0.38 * lineFade,
            stroke: 'rgba(255,255,255,0.66)',
          },
        },
      ],
    } as EChartsOption['graphic'],
    series: [
      ...state.rows.map((row) => ({
        data: row.points.map((point) => [point.monthIndex, point.value]),
        emphasis: {
          disabled: true,
        },
        lineStyle: {
          color: row.color,
          opacity: row.opacity * lineFade,
          shadowBlur: 10,
          shadowColor: colorWithOpacity(row.color, 0.32 * lineFade),
          width: companyLineWidth,
        },
        name: row.modelName,
        showSymbol: false,
        smooth: 0.32,
        type: 'line' as const,
        z: 20 + topN - row.displayRank,
      })),
      ...milestoneDotSeries,
    ],
    tooltip: {
      show: false,
    },
    xAxis: {
      axisLabel: {
        color: 'rgba(255,255,255,0.52)',
        fontFamily: fontStack,
        fontSize: 18,
        fontWeight: 800,
        formatter: (value: number) => {
          if (value > lineRaceEndMonthIndex + 0.35) {
            return '';
          }

          return formatShortMonthLabel(value);
        },
        hideOverlap: true,
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(255,255,255,0.22)',
          width: 2,
        },
      },
      axisTick: {
        show: false,
      },
      max: state.xMaxMonthIndex,
      min: state.xMinMonthIndex,
      interval: xAxisIntervalForState(state),
      splitLine: {
        lineStyle: {
          color: 'rgba(255,255,255,0.09)',
          width: 1,
        },
      },
      splitNumber: 4,
      type: 'value',
    },
    yAxis: {
      axisLabel: {
        color: 'rgba(255,255,255,0.52)',
        fontFamily: fontStack,
        fontSize: 18,
        fontWeight: 800,
        formatter: (value: number) => `${Math.round(value)}%`,
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      max: state.maxValue,
      min: state.minValue,
      interval: yAxisIntervalForState(state),
      splitLine: {
        lineStyle: {
          color: 'rgba(255,255,255,0.1)',
          width: 1,
        },
      },
      splitNumber: 5,
      type: 'value',
    },
  };
};

const getCompanyFrameState = ({
  durationInFrames,
  frame,
  outroProgress,
}: {
  durationInFrames: number;
  frame: number;
  outroProgress: number;
}): CompanyFrameState => {
  const progress = clamp(frame / Math.max(1, durationInFrames - 1), 0, 1);
  const currentMonthIndex = lineRaceStartMonthIndex + progress * (lineRaceEndMonthIndex - lineRaceStartMonthIndex);
  const xWindow = xWindowForMonth(currentMonthIndex, outroProgress);
  const allRows = organizationOrder.map((organization) => {
    const milestones = milestonesForOrganization(organization);
    const value = companyValueAtMonth(organization, currentMonthIndex);
    const displayModel = targetDisplayMilestoneAtMonth(organization, currentMonthIndex) ?? milestones[0];
    const releaseMonthIndex = firstReleaseMonthForOrganization(organization);
    const color = colorForOrganization(organization);
    const points = linePointsForOrganization(organization, currentMonthIndex);
    const opacity = smootherStep(clamp(value / 8, 0, 1));

    return {
      color,
      displayRank: topN,
      id: organization,
      milestones,
      modelName: displayModel?.entry.model ?? organization,
      opacity,
      organization,
      points,
      releaseMonthIndex,
      value,
    };
  });
  const rankedRowsWithoutJoinOpacity = allRows
    .filter((row) => row.value > 0.05)
    .sort((a, b) =>
      b.value - a.value ||
      a.releaseMonthIndex - b.releaseMonthIndex ||
      a.organization.localeCompare(b.organization)
    )
    .slice(0, topN)
    .map((row, index) => ({
      ...row,
      displayRank: index + 1,
  }));
  const axis = axisRangeForRows(rankedRowsWithoutJoinOpacity, outroProgress);
  const rankedRows = rankedRowsWithoutJoinOpacity.map((row) => {
    const yJoinOpacity = smootherStep(
      clamp((row.value - axis.minValue) / yAxisJoinFadeScoreRange, 0, 1),
    );

    return {
      ...row,
      opacity: row.opacity * yJoinOpacity,
    };
  });
  const displayMonthIndex = Math.round(clamp(currentMonthIndex, lineRaceStartMonthIndex, lineRaceEndMonthIndex));

  return {
    currentMonthIndex,
    leaderColor: rankedRows[0]?.color ?? '#45E3AE',
    maxValue: axis.maxValue,
    minValue: axis.minValue,
    month: monthFromIndex(displayMonthIndex),
    monthProgress: clamp(
      (currentMonthIndex - lineRaceStartMonthIndex) / Math.max(1, lineRaceEndMonthIndex - lineRaceStartMonthIndex),
      0,
      1,
    ),
    outroProgress,
    rows: rankedRows,
    xMaxMonthIndex: xWindow.maxMonthIndex,
    xMinMonthIndex: xWindow.minMonthIndex,
    year: yearFromMonthIndex(displayMonthIndex),
  };
};

const buildEndpointLabels = (state: CompanyFrameState) => {
  const currentX = xForMonth(state.currentMonthIndex, state);
  const labelX = Math.max(linePlot.left + 28, currentX - endpointLogoSize / 2);
  const minY = linePlot.top - 6;
  const maxY = chart.height - linePlot.bottom - endpointLogoSize + 8;

  return state.rows.map((row) => ({
    row,
    x: labelX,
    y: clamp(yForScore(row.value, state) - endpointLogoSize / 2, minY, maxY),
  }));
};

const buildMilestoneLabels = (state: CompanyFrameState) => {
  const visibleOrganizations = new Set(state.rows.map((row) => row.organization));
  const labels = organizationOrder
    .filter((organization) => visibleOrganizations.has(organization))
    .flatMap((organization) => {
    const color = colorForOrganization(organization);

    return milestonesForOrganization(organization)
      .filter((milestone) => milestone.releaseMonthIndex <= state.currentMonthIndex)
      .filter((milestone) =>
        milestone.releaseMonthIndex >= state.xMinMonthIndex - 0.2 &&
        milestone.releaseMonthIndex <= state.xMaxMonthIndex + 0.2
      )
      .filter((milestone) =>
        milestone.score >= state.minValue - milestoneLabelYAxisMargin &&
        milestone.score <= state.maxValue + milestoneLabelYAxisMargin
      )
      .map((milestone, index) => {
        const fade = smootherStep(clamp((state.currentMonthIndex - milestone.releaseMonthIndex) / 0.7, 0, 1));
        const milestoneValue = companyValueAtMonth(organization, milestone.releaseMonthIndex);
        const x = xForMonth(milestone.releaseMonthIndex, state) + milestoneLabelXOffset;
        const y = yForScore(milestoneValue, state) + milestoneLabelYOffsetFor(
          organization,
          index,
          state.outroProgress,
        );

        return {
          color,
          milestone,
          opacity: milestoneLabelBaseOpacity + milestoneLabelFadeOpacity * fade,
          organization,
          x,
          y,
        };
      })
  });

  return labels.sort((a, b) =>
    a.milestone.releaseMonthIndex - b.milestone.releaseMonthIndex ||
    b.milestone.score - a.milestone.score ||
    a.milestone.entry.model.localeCompare(b.milestone.entry.model)
  );
};

const buildMilestoneDotSeries = (state: CompanyFrameState) =>
  organizationOrder
    .filter((organization) => state.rows.some((row) => row.organization === organization))
    .map((organization) => {
      const color = colorForOrganization(organization);
      const data = milestonesForOrganization(organization)
        .filter((milestone) => milestone.releaseMonthIndex <= state.currentMonthIndex)
        .filter((milestone) =>
          milestone.releaseMonthIndex >= state.xMinMonthIndex - 0.2 &&
          milestone.releaseMonthIndex <= state.xMaxMonthIndex + 0.2
        )
        .filter((milestone) =>
          milestone.score >= state.minValue - milestoneLabelYAxisMargin &&
          milestone.score <= state.maxValue + milestoneLabelYAxisMargin
        )
        .map((milestone) => [
          milestone.releaseMonthIndex,
          companyValueAtMonth(organization, milestone.releaseMonthIndex),
        ]);

      return {
        data,
        emphasis: {
          disabled: true,
        },
        itemStyle: {
          borderColor: 'rgba(255,255,255,0.86)',
          borderWidth: 2,
          color,
          opacity: milestoneDotOpacity,
        },
        name: `${organization} releases`,
        symbol: 'circle',
        symbolSize: milestoneDotSize,
        tooltip: {
          show: false,
        },
        type: 'scatter' as const,
        z: 18,
      };
    })
    .filter((series) => series.data.length > 0);

const milestoneLabelYOffsetFor = (
  organization: AiModelOrganization,
  index: number,
  outroProgress: number,
) => {
  const normalOffset = milestoneLabelYOffsetByOrganization[organization] + (index % 2) * 4;
  const finalOffset = -milestoneLabelFontSize / 2;

  return lerp(normalOffset, finalOffset, smootherStep(outroProgress));
};

const linePointsForOrganization = (
  organization: AiModelOrganization,
  currentMonthIndex: number,
) => {
  const milestones = milestonesForOrganization(organization);
  const firstMilestone = milestones[0];

  if (!firstMilestone) {
    return [];
  }

  const stageStart = firstStageStartMonthForOrganization(organization);

  if (currentMonthIndex < stageStart) {
    return [];
  }

  const pointMonths = new Set<number>([stageStart]);
  const startMonth = Math.ceil(stageStart);
  const endMonth = Math.floor(currentMonthIndex);

  for (let monthIndex = startMonth; monthIndex <= endMonth; monthIndex += 1) {
    pointMonths.add(monthIndex);
  }

  for (const milestone of milestones) {
    if (milestone.releaseMonthIndex <= currentMonthIndex) {
      pointMonths.add(milestone.releaseMonthIndex);
    }
  }

  pointMonths.add(currentMonthIndex);

  return [...pointMonths]
    .filter((monthIndex) => monthIndex >= stageStart)
    .filter((monthIndex) => monthIndex <= currentMonthIndex)
    .sort((a, b) => a - b)
    .map((monthIndex) => ({
      monthIndex,
      value: companyValueAtMonth(organization, monthIndex),
    }));
};

const companyValueAtMonth = (
  organization: AiModelOrganization,
  monthIndex: number,
) => {
  const milestones = milestonesForOrganization(organization);
  const firstMilestone = milestones[0];

  if (!firstMilestone) {
    return 0;
  }

  const stageStart = firstStageStartMonthForOrganization(organization);

  if (monthIndex < stageStart) {
    return 0;
  }

  if (monthIndex < firstMilestone.releaseMonthIndex) {
    return interpolateScore({
      endMonth: firstMilestone.releaseMonthIndex,
      endValue: firstMilestone.score,
      monthIndex,
      startMonth: stageStart,
      startValue: 0,
    });
  }

  for (let index = 0; index < milestones.length - 1; index += 1) {
    const current = milestones[index];
    const next = milestones[index + 1];

    if (monthIndex <= next.releaseMonthIndex) {
      return interpolateScore({
        endMonth: next.releaseMonthIndex,
        endValue: next.score,
        monthIndex,
        startMonth: current.releaseMonthIndex,
        startValue: current.score,
      });
    }
  }

  return milestones[milestones.length - 1].score;
};

const targetDisplayMilestoneAtMonth = (
  organization: AiModelOrganization,
  monthIndex: number,
) => {
  const milestones = milestonesForOrganization(organization);
  const firstMilestone = milestones[0];

  if (!firstMilestone || monthIndex < firstStageStartMonthForOrganization(organization)) {
    return undefined;
  }

  if (monthIndex < firstMilestone.releaseMonthIndex) {
    return firstMilestone;
  }

  for (let index = 0; index < milestones.length - 1; index += 1) {
    const next = milestones[index + 1];

    if (monthIndex < next.releaseMonthIndex) {
      return next;
    }
  }

  return milestones[milestones.length - 1];
};

function buildScoreMilestonesForOrganization(
  organization: AiModelOrganization,
): CompanyModelMilestone[] {
  const entries = raceData.entries
    .filter((entry) => entry.organization === organization)
    .sort((a, b) =>
      releaseMonthIndexForEntry(a) - releaseMonthIndexForEntry(b) ||
      b.score - a.score ||
      a.model.localeCompare(b.model)
    );
  const milestones: CompanyModelMilestone[] = [];
  let bestScore = -Infinity;

  for (const entry of entries) {
    if (entry.score <= bestScore + 0.04) {
      continue;
    }

    const releaseMonthIndex = releaseMonthIndexForEntry(entry);
    const previous = milestones.at(-1);

    if (previous && Math.abs(previous.releaseMonthIndex - releaseMonthIndex) < 0.015) {
      previous.entry = entry;
      previous.score = entry.score;
      bestScore = entry.score;
      continue;
    }

    milestones.push({
      entry,
      releaseMonthIndex,
      score: entry.score,
    });
    bestScore = entry.score;
  }

  return milestones;
}

function milestonesForOrganization(organization: AiModelOrganization) {
  return organizationMilestoneMap.get(organization) ?? [];
}

const interpolateScore = ({
  endMonth,
  endValue,
  monthIndex,
  startMonth,
  startValue,
}: {
  endMonth: number;
  endValue: number;
  monthIndex: number;
  startMonth: number;
  startValue: number;
}) => {
  const progress = smootherStep(clamp((monthIndex - startMonth) / Math.max(0.01, endMonth - startMonth), 0, 1));

  return startValue + (endValue - startValue) * progress;
};

const firstStageStartMonthForOrganization = (organization: AiModelOrganization) => {
  const firstReleaseMonth = firstReleaseMonthForOrganization(organization);

  return Math.max(lineRaceStartMonthIndex, firstReleaseMonth - firstModelBuildUpMonths);
};

function firstReleaseMonthForOrganization(organization: AiModelOrganization) {
  return milestonesForOrganization(organization)[0]?.releaseMonthIndex ?? lineRaceEndMonthIndex;
}

const colorForOrganization = (organization: AiModelOrganization) =>
  companyLineColors[organization] ?? raceData.entries.find((entry) => entry.organization === organization)?.color ?? '#45E3AE';

const axisRangeForRows = (rows: CompanyRaceRow[], outroProgress: number) => {
  if (rows.length === 0) {
    return {
      maxValue: yAxisFullMaxValue,
      minValue: yAxisFullMinValue,
    };
  }

  const values = rows.map((row) => row.value);
  const leader = Math.max(...values);
  const trailer = Math.min(...values);
  const visibleSpan = clamp(
    leader - trailer + yAxisValuePadding,
    yAxisMinVisibleScoreSpan,
    yAxisMaxVisibleScoreSpan,
  );
  const focusedMaxValue = Math.min(100, leader + yAxisTopPadding);
  const focusedMinValue = Math.max(0, focusedMaxValue - visibleSpan);
  const zoomOut = smootherStep(outroProgress);

  return {
    maxValue: lerp(focusedMaxValue, yAxisFullMaxValue, zoomOut),
    minValue: lerp(focusedMinValue, yAxisFullMinValue, zoomOut),
  };
};

const xWindowForMonth = (currentMonthIndex: number, outroProgress: number) => {
  const fullMaxMonthIndex = lineRaceEndMonthIndex + xAxisEndPaddingMonths;
  const fullSpan = fullMaxMonthIndex - lineRaceStartMonthIndex;
  const initialWindowSpan = xFollowWindowMonths * xInitialWindowScale;
  const initialWindowProgress = smootherStep(
    clamp((currentMonthIndex - lineRaceStartMonthIndex) / xInitialWindowBlendMonths, 0, 1),
  );
  const windowSpan = Math.min(
    lerp(initialWindowSpan, xFollowWindowMonths, initialWindowProgress),
    fullSpan,
  );
  const followMin = clamp(
    currentMonthIndex - windowSpan * xFollowAnchorRatio,
    lineRaceStartMonthIndex,
    fullMaxMonthIndex - windowSpan,
  );
  const followMax = followMin + windowSpan;
  const zoomOut = smootherStep(outroProgress);

  return {
    maxMonthIndex: lerp(followMax, fullMaxMonthIndex, zoomOut),
    minMonthIndex: lerp(followMin, lineRaceStartMonthIndex, zoomOut),
  };
};

const xForMonth = (monthIndex: number, state: CompanyFrameState) =>
  linePlot.left +
  ((monthIndex - state.xMinMonthIndex) / Math.max(1, state.xMaxMonthIndex - state.xMinMonthIndex)) *
    linePlotWidth;

const xAxisIntervalForState = (state: CompanyFrameState) => {
  const span = state.xMaxMonthIndex - state.xMinMonthIndex;

  if (span <= 16) {
    return 3;
  }

  if (span <= 28) {
    return 6;
  }

  return 12;
};

const yAxisIntervalForState = (state: CompanyFrameState) => {
  const span = state.maxValue - state.minValue;

  if (span > 55) {
    return 20;
  }

  if (span > 24) {
    return 10;
  }

  return 5;
};

const yForScore = (score: number, state: CompanyFrameState) =>
  linePlot.top +
  (1 - clamp((score - state.minValue) / Math.max(1, state.maxValue - state.minValue), 0, 1)) *
    linePlotHeight;

const formatShortMonthLabel = (monthIndex: number) => {
  const year = yearFromMonthIndex(Math.round(monthIndex));
  const month = monthFromIndex(Math.round(monthIndex));

  return `${formatTwoDigitMonth(month)}/${String(year).slice(2)}`;
};

const formatDisplayMonthLabel = (year: number, month: number) =>
  `${formatTwoDigitMonth(month)}/${year}`;

const formatTwoDigitMonth = (month: number) => String(month).padStart(2, '0');

const formatEndpointModelName = (modelName: string) =>
  modelName
    .replace(/\s*\((?:Reasoning|high|xhigh)\)/gi, '')
    .replace(/\s*\((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^)]+\)/gi, '')
    .replace(/\s+Preview$/i, '')
    .replace(/\s+Experimental.*$/i, ' Experimental')
    .replace(/\s+/g, ' ')
    .trim();

const Footer = () => (
  <div style={styles.footer}>
    <div style={styles.footerSource}>{aiModelBenchmarkVideoConfig.source}</div>
  </div>
);

const Background = ({ state }: { state: CompanyFrameState }) => (
  <AbsoluteFill style={styles.background}>
    <div style={styles.digitalGrid} />
    <div
      style={{
        ...styles.leaderColorWash,
        background: `radial-gradient(circle at 70% 42%, ${colorWithOpacity(state.leaderColor, 0.24)} 0%, ${colorWithOpacity(state.leaderColor, 0.1)} 34%, rgba(3,7,18,0) 66%)`,
      }}
    />
    <div style={styles.scanlines} />
    <div style={styles.topShadow} />
    <div style={styles.chartGlow} />
  </AbsoluteFill>
);

const formatScore = (value: number) => `${Math.max(0, value).toFixed(1)}%`;

const colorWithOpacity = (hexColor: string, opacity: number) => {
  const [red, green, blue] = hexToRgb(hexColor);

  return `rgba(${red},${green},${blue},${opacity})`;
};

const hexToRgb = (hex: string) => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

function releaseMonthIndexForEntry(entry: AiModelEntry) {
  const [yearText = '0', monthText = '1', dayText = '1'] = entry.releaseDate.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const daysInMonth = new Date(year, month, 0).getDate();

  return monthIndexFromYearMonth(year, month) + clamp((day - 1) / Math.max(1, daysInMonth), 0, 0.98);
}

function monthIndexFromYearMonth(year: number, month: number) {
  return year * 12 + month - 1;
}

const yearFromMonthIndex = (monthIndex: number) => Math.floor(monthIndex / 12);

const monthFromIndex = (monthIndex: number) => ((monthIndex % 12) + 12) % 12 + 1;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

const smootherStep = (value: number) => {
  const t = clamp(value, 0, 1);

  return t * t * t * (t * (t * 6 - 15) + 10);
};

const firstModelBuildUpMonths = 1.05;
const companyLineWidth = 6.5;
const milestoneDotOpacity = 0.84;
const milestoneDotSize = 10;
const milestoneLabelBaseOpacity = 0.24;
const milestoneLabelFadeOpacity = 0.42;
const milestoneLabelFontSize = 16;
const milestoneLabelXOffset = 8;
const milestoneLabelYAxisMargin = 0.7;
const xAxisEndPaddingMonths = 10.5;
const xFollowAnchorRatio = 0.72;
const xFollowWindowMonths = 11.5;
const xInitialWindowBlendMonths = 7.5;
const xInitialWindowScale = 0.5;
const yAxisFullMaxValue = raceData.maxValue;
const yAxisFullMinValue = 0;
const yAxisJoinFadeScoreRange = 0.95;
const yAxisMaxVisibleScoreSpan = 12;
const yAxisMinVisibleScoreSpan = 8.8;
const yAxisTopPadding = 1.15;
const yAxisValuePadding = 2.6;

const styles = {
  background: {
    backgroundColor: '#020617',
    backgroundImage:
      'linear-gradient(180deg, #020617 0%, #07101D 48%, #01030A 100%), repeating-linear-gradient(90deg, rgba(69,227,174,0.05) 0 1px, transparent 1px 120px)',
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
    overflow: 'visible',
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
    height: 33,
    objectFit: 'contain',
    width: 33,
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
  endpointLabel: {
    alignItems: 'center',
    display: 'flex',
    gap: 10,
    height: endpointLogoSize,
    overflow: 'visible',
    pointerEvents: 'none',
    position: 'absolute',
    width: endpointLabelWidth + 130,
  },
  endpointLogo: {
    alignItems: 'center',
    background: 'linear-gradient(180deg, #FFFFFF 0%, #E8EEF6 100%)',
    border: '2px solid rgba(255,255,255,0.24)',
    borderRadius: '50%',
    boxShadow: '0 12px 28px rgba(0,0,0,0.34)',
    display: 'flex',
    flex: `0 0 ${endpointLogoSize}px`,
    height: endpointLogoSize,
    justifyContent: 'center',
    overflow: 'hidden',
    width: endpointLogoSize,
  },
  endpointName: {
    color: '#FFFFFF',
    display: 'block',
    fontSize: 24,
    fontWeight: 950,
    lineHeight: 1,
    textShadow: '0 4px 14px rgba(0,0,0,0.65)',
    whiteSpace: 'nowrap',
  },
  endpointOverlay: {
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
  },
  endpointRank: {
    color: '#F5E829',
    fontSize: 20,
    fontWeight: 950,
    lineHeight: 1,
    minWidth: 22,
    textAlign: 'right',
  },
  endpointScore: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1,
    marginTop: 3,
    textShadow: '0 4px 14px rgba(0,0,0,0.65)',
  },
  endpointTextBlock: {
    minWidth: 0,
    overflow: 'visible',
  },
  endpointTopLine: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
    minWidth: 0,
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
  milestoneLabel: {
    fontFamily: fontStack,
    fontSize: milestoneLabelFontSize,
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1,
    pointerEvents: 'none',
    position: 'absolute',
    textShadow: '0 4px 14px rgba(0,0,0,0.72)',
    whiteSpace: 'nowrap',
  },
  milestoneOverlay: {
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 7,
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
