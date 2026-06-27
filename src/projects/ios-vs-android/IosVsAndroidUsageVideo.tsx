import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import { Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import * as echarts from 'echarts/core';
import { BarChart, MapChart } from 'echarts/charts';
import { GeoComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsCoreOption, EChartsType } from 'echarts/core';
import {
  createStandardDataVideoFrameGeometry,
  DataVideoBalancePill,
  DataVideoBackground,
  DataVideoChannelTag,
  DataVideoChartFrame,
  DataVideoChartTopBar,
  DataVideoFooter,
  DataVideoFooterNote,
  DataVideoFooterSource,
  dataVideoFontStack,
  DataVideoFrameLayout,
  DataVideoHeroHeader,
  DataVideoMetricPill,
  DataVideoTimelineRail,
} from '../../shared/dataVideoFrame';
import {
  iosAndroidUsageVideoConfig,
  type IosAndroidNewsEvent,
} from './config';
import { introVoiceoverAsset } from './generated/introVoiceoverAsset';
import worldGeoJson from './generated/world.json';
import {
  buildIosAndroidUsageData,
  formatShare,
  getIosAndroidFrameState,
  type IosAndroidFrameRow,
  type IosAndroidFrameState,
  type OsLeader,
} from './usageData';

echarts.use([
  BarChart,
  CanvasRenderer,
  GeoComponent,
  GridComponent,
  MapChart,
]);

const usageData = buildIosAndroidUsageData(iosAndroidUsageVideoConfig.annualCsv);
const fontStack = dataVideoFontStack;
const channelHandle = '@whoa-data';
const frameLayout = createStandardDataVideoFrameGeometry();
const chart = frameLayout.chart;
const worldMapName = 'ios-android-world';
const androidColor = '#3DDC84';
const iosDeepColor = '#5DA8FF';
const neutralColor = '#1B2933';
let worldMapIsRegistered = false;
const newsEventByYear = new Map(
  iosAndroidUsageVideoConfig.newsEvents.map((event) => [event.year, event]),
);
const snapshotIndexByYear = new Map(
  usageData.snapshots.map((snapshot, index) => [snapshot.year, index]),
);

export const IosVsAndroidUsageVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(iosAndroidUsageVideoConfig.startHoldSeconds * fps);
  const endHoldFrames = Math.round(iosAndroidUsageVideoConfig.endHoldSeconds * fps);
  const motionFrames = Math.max(1, durationInFrames - startHoldFrames - endHoldFrames);
  const usageFrame = clamp(frame - startHoldFrames, 0, motionFrames - 1);
  const state = getIosAndroidFrameState({
    data: usageData,
    durationInFrames: motionFrames,
    frame: usageFrame,
    raceCountries: iosAndroidUsageVideoConfig.raceCountries,
    topN: iosAndroidUsageVideoConfig.topN,
  });

  return (
    <DataVideoFrameLayout style={styles.stage}>
      {introVoiceoverAsset ? (
        <Audio
          src={staticFile(introVoiceoverAsset.path)}
          volume={iosAndroidUsageVideoConfig.introVoiceoverVolume}
        />
      ) : null}
      <DataVideoBackground chart={chart} />
      <DataVideoHeroHeader
        accentColor={androidColor}
        geometry={frameLayout}
        subtitle={iosAndroidUsageVideoConfig.titleHook}
        title={iosAndroidUsageVideoConfig.title}
      />
      <DataVideoTimelineRail
        accentColor={androidColor}
        currentLabel={state.periodLabel}
        geometry={frameLayout}
        intro={1}
        maxLabel={usageData.snapshots.at(-1)?.period ?? usageData.maxYear}
        minLabel={usageData.minYear}
        progress={state.yearProgress}
      />
      <DataVideoChartTopBar chart={chart} intro={1}>
        <OverviewStrip state={state} />
        <DataVideoChannelTag>{channelHandle}</DataVideoChannelTag>
      </DataVideoChartTopBar>
      <DataVideoChartFrame chart={chart} intro={1} style={styles.chartFrame}>
        <IosAndroidEchart state={state} />
        <ChartHud state={state} />
      </DataVideoChartFrame>
      <Footer />
    </DataVideoFrameLayout>
  );
};

const OverviewStrip = ({ state }: { state: IosAndroidFrameState }) => (
  <div style={styles.overviewStrip}>
    <DataVideoMetricPill
      accentColor={androidColor}
      label="ANDROID"
      value={`${state.androidCountryCount}`}
    />
    <DataVideoMetricPill
      accentColor={iosDeepColor}
      label="iOS"
      value={`${state.iosCountryCount}`}
    />
    <DataVideoBalancePill
      leftColor={androidColor}
      leftValue={state.avgAndroidShare}
      rightColor={iosDeepColor}
      rightValue={state.avgIosShare}
    />
  </div>
);

const IosAndroidEchart = ({ state }: { state: IosAndroidFrameState }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);
  const option = useMemo(() => buildChartOption(state), [state]);

  useLayoutEffect(() => {
    ensureWorldMapRegistered();

    if (!containerRef.current) {
      return undefined;
    }

    const instance = echarts.init(containerRef.current, undefined, {
      height: chart.height,
      renderer: 'canvas',
      width: chart.width,
    });
    chartRef.current = instance;

    return () => {
      instance.dispose();
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

  return <div ref={containerRef} style={styles.echartCanvas} />;
};

const ChartHud = ({ state }: { state: IosAndroidFrameState }) => {
  const newsEvent = newsEventByYear.get(state.year);

  return (
    <>
      <div style={styles.mapLabelBlock}>
        <div style={styles.mapKicker}>WORLD MAP</div>
        <div style={styles.mapPeriod}>{state.periodLabel}</div>
      </div>
      <NewsToast event={newsEvent} state={state} />
      <div style={styles.legendBlock}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendSwatch, backgroundColor: androidColor }} />
          <span>Android lead</span>
        </div>
        <div style={styles.legendDivider} />
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendSwatch, backgroundColor: iosDeepColor }} />
          <span>iOS lead</span>
        </div>
      </div>
      <div style={styles.raceCaption}>
        <span style={styles.raceCaptionLabel}>MAJOR COUNTRY RACE</span>
        <strong style={styles.raceCaptionValue}>
          {state.raceRows[0] ? `${state.raceRows[0].leader} leads ${state.raceRows[0].country}` : '-'}
        </strong>
      </div>
    </>
  );
};

const NewsToast = ({
  event,
  state,
}: {
  event: IosAndroidNewsEvent | undefined;
  state: IosAndroidFrameState;
}) => {
  if (!event) {
    return null;
  }

  const segmentCount = Math.max(1, usageData.snapshots.length - 1);
  const snapshotIndex = snapshotIndexByYear.get(state.year) ?? 0;
  const scaledProgress = state.yearProgress * segmentCount;
  const yearDisplayProgress = clamp(scaledProgress - snapshotIndex + 0.5, 0, 1);
  const opacity = interpolate(yearDisplayProgress, [0, 0.14, 1], [0, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(yearDisplayProgress, [0, 0.14, 1], [16, 0, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const accent = event.platform === 'Android' ? androidColor : iosDeepColor;

  return (
    <div
      style={{
        ...styles.newsToast,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div style={{ ...styles.newsAccent, backgroundColor: accent }} />
      <div style={styles.newsMetaRow}>
        <span style={styles.newsBadge}>BIG NEWS</span>
        <span style={styles.newsYear}>{event.year}</span>
        <span style={{ ...styles.newsPlatform, color: accent }}>{event.platform}</span>
      </div>
      <div style={styles.newsTitle}>{event.title}</div>
      <div style={styles.newsDetail}>{event.detail}</div>
    </div>
  );
};

const Footer = () => (
  <DataVideoFooter geometry={frameLayout}>
    <DataVideoFooterSource>{iosAndroidUsageVideoConfig.source}</DataVideoFooterSource>
    <DataVideoFooterNote>
      Pageview-based usage share, not shipments or installed base.
    </DataVideoFooterNote>
  </DataVideoFooter>
);

const buildChartOption = (state: IosAndroidFrameState): EChartsCoreOption => {
  const raceRows = state.raceRows;
  const raceLabels = raceRows.map((row) => compactCountryName(row.country));

  return {
    animation: false,
    backgroundColor: 'transparent',
    grid: {
      bottom: 30,
      containLabel: false,
      left: 180,
      right: 126,
      top: 660,
    },
    series: [
      {
        animation: false,
        data: state.mapRows
          .filter((row) => row.mapName)
          .map((row) => ({
            itemStyle: {
              areaColor: mapLeaderColor(row),
              borderColor: `rgba(255,255,255,${0.18 + row.leaderSwitchIntensity * 0.46})`,
              borderWidth: 0.75 + row.leaderSwitchIntensity * 1.15,
            },
            name: row.mapName,
            value: row.leader === 'iOS' ? 1 : row.leader === 'Android' ? -1 : 0,
          })),
        emphasis: {
          disabled: true,
        },
        itemStyle: {
          areaColor: neutralColor,
          borderColor: 'rgba(255,255,255,0.22)',
          borderWidth: 0.85,
        },
        label: {
          show: false,
        },
        left: 16,
        map: worldMapName,
        name: 'Country OS lead',
        right: 16,
        roam: false,
        select: {
          disabled: true,
        },
        selectedMode: false,
        silent: true,
        top: 24,
        type: 'map',
        zoom: 1.05,
      },
      {
        animation: false,
        barWidth: 24,
        data: raceRows.map((row) => ({
          itemStyle: {
            color: leaderColor(row.leader),
          },
          value: row.leaderShare,
        })),
        emphasis: {
          disabled: true,
        },
        label: {
          color: '#FFFFFF',
          fontFamily: fontStack,
          fontSize: 21,
          fontWeight: 950,
          formatter: (params: { dataIndex: number }) => {
            const row = raceRows[params.dataIndex];

            return row
              ? `${row.leader} ${formatShare(row.leaderShare)}`
              : '';
          },
          position: 'right',
          show: true,
        },
        name: 'Leading share',
        silent: true,
        type: 'bar',
        xAxisIndex: 0,
        yAxisIndex: 0,
      },
    ],
    textStyle: {
      fontFamily: fontStack,
    },
    tooltip: {
      show: false,
    },
    xAxis: [
      {
        axisLabel: {
          color: 'rgba(255,255,255,0.56)',
          fontFamily: fontStack,
          fontSize: 18,
          fontWeight: 850,
          formatter: '{value}%',
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255,255,255,0.16)',
          },
        },
        axisTick: {
          show: false,
        },
        max: 100,
        min: 0,
        splitLine: {
          lineStyle: {
            color: 'rgba(255,255,255,0.09)',
          },
        },
        type: 'value',
      },
    ],
    yAxis: [
      {
        axisLabel: {
          color: '#FFFFFF',
          fontFamily: fontStack,
          fontSize: 21,
          fontWeight: 950,
          formatter: (value: string, index: number) => {
            const row = raceRows[index];

            return row ? `#${row.displayRank} ${value}` : value;
          },
          interval: 0,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        data: raceLabels,
        inverse: true,
        type: 'category',
      },
    ],
  };
};

const ensureWorldMapRegistered = () => {
  if (worldMapIsRegistered) {
    return;
  }

  echarts.registerMap(
    worldMapName,
    worldGeoJson as unknown as Parameters<typeof echarts.registerMap>[1],
  );
  worldMapIsRegistered = true;
};

const leaderColor = (leader: OsLeader) => {
  if (leader === 'Android') {
    return androidColor;
  }

  if (leader === 'iOS') {
    return iosDeepColor;
  }

  return '#FACC15';
};

const mapLeaderColor = (row: IosAndroidFrameRow) => {
  if (row.leader === 'Tie' && row.leaderSwitchIntensity === 0) {
    return neutralColor;
  }

  return mixHex(androidColor, iosDeepColor, smoothstep(row.leaderBlend));
};

const mixHex = (from: string, to: string, progress: number) => {
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);

  return `#${toHexByte(lerp(fromRgb.r, toRgb.r, progress))}${toHexByte(
    lerp(fromRgb.g, toRgb.g, progress),
  )}${toHexByte(lerp(fromRgb.b, toRgb.b, progress))}`;
};

const hexToRgb = (hex: string) => ({
  b: Number.parseInt(hex.slice(5, 7), 16),
  g: Number.parseInt(hex.slice(3, 5), 16),
  r: Number.parseInt(hex.slice(1, 3), 16),
});

const toHexByte = (value: number) =>
  Math.round(value).toString(16).padStart(2, '0').toUpperCase();

const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;

const compactCountryName = (country: string) =>
  country
    .replace('United States', 'U.S.')
    .replace('United Kingdom', 'U.K.')
    .replace('Korea Republic of', 'South Korea')
    .replace('Russian Federation', 'Russia');

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const smoothstep = (value: number) => value * value * (3 - 2 * value);

const styles = {
  stage: {
    backgroundColor: '#020409',
  },
  chartFrame: {
    background:
      'linear-gradient(180deg, rgba(2,5,9,0.98), rgba(4,12,16,0.98) 45%, rgba(3,6,10,0.99)), radial-gradient(circle at 50% 26%, rgba(93,168,255,0.12), rgba(0,0,0,0) 56%)',
  },
  overviewStrip: {
    alignItems: 'center',
    display: 'flex',
    flex: '1 1 auto',
    gap: 12,
    minWidth: 0,
  },
  echartCanvas: {
    height: chart.height,
    inset: 0,
    position: 'absolute',
    width: chart.width,
  },
  mapLabelBlock: {
    left: 34,
    position: 'absolute',
    top: 28,
  },
  mapKicker: {
    color: 'rgba(61,220,132,0.82)',
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1,
  },
  mapPeriod: {
    color: '#FFFFFF',
    fontSize: 46,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 1,
    marginTop: 6,
    textShadow: '0 10px 30px rgba(0,0,0,0.55)',
  },
  newsToast: {
    background:
      'linear-gradient(135deg, rgba(3,10,16,0.94), rgba(2,7,12,0.84))',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 22px 54px rgba(0,0,0,0.48)',
    left: 34,
    minHeight: 118,
    overflow: 'hidden',
    padding: '14px 16px 15px 21px',
    position: 'absolute',
    top: 432,
    width: 462,
    zIndex: 4,
  },
  newsAccent: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 6,
  },
  newsMetaRow: {
    alignItems: 'center',
    display: 'flex',
    gap: 9,
    marginLeft: 8,
  },
  newsBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
    padding: '5px 7px',
  },
  newsYear: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1,
  },
  newsPlatform: {
    fontSize: 16,
    fontWeight: 950,
    lineHeight: 1,
  },
  newsTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 950,
    lineHeight: 1.04,
    marginLeft: 8,
    marginTop: 10,
    textShadow: '0 5px 18px rgba(0,0,0,0.62)',
    wordSpacing: 2,
  },
  newsDetail: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 19,
    fontWeight: 850,
    lineHeight: 1.14,
    marginLeft: 8,
    marginTop: 7,
    wordSpacing: 1,
  },
  legendBlock: {
    alignItems: 'center',
    background: 'rgba(2,8,14,0.72)',
    border: '1px solid rgba(255,255,255,0.16)',
    color: 'rgba(255,255,255,0.82)',
    display: 'flex',
    gap: 10,
    padding: '8px 10px',
    position: 'absolute',
    right: 34,
    top: 558,
  },
  legendItem: {
    alignItems: 'center',
    display: 'flex',
    fontSize: 15,
    fontWeight: 900,
    gap: 6,
    lineHeight: 1,
  },
  legendSwatch: {
    height: 12,
    width: 12,
  },
  legendDivider: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    height: 16,
    width: 1,
  },
  raceCaption: {
    alignItems: 'baseline',
    display: 'flex',
    gap: 12,
    left: 34,
    position: 'absolute',
    right: 34,
    top: 612,
  },
  raceCaptionLabel: {
    color: androidColor,
    fontSize: 16,
    fontWeight: 950,
    lineHeight: 1,
  },
  raceCaptionValue: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: 950,
    lineHeight: 1,
  },
} satisfies Record<string, CSSProperties>;
