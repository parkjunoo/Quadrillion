import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { SHORTS_PLATFORM_TOP_CLEARANCE, VIDEO_WIDTH } from './video';

export const dataVideoFontStack =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export type DataVideoFrameInset = {
  left: number;
  right: number;
};

export type DataVideoChartBounds = {
  height: number;
  left: number;
  top: number;
  width: number;
};

export type DataVideoTimelineRailBounds = {
  left: number;
  top: number;
  width: number;
};

export type DataVideoFrameGeometry = {
  chart: DataVideoChartBounds;
  footerInset?: DataVideoFrameInset;
  footerTop: number;
  frameInset: DataVideoFrameInset;
  headerTop: number;
  timelineRail: DataVideoTimelineRailBounds;
};

export const standardDataVideoFrameInset: DataVideoFrameInset = {
  left: 76,
  right: 76,
};

export const defaultDataShortsFrameInset: DataVideoFrameInset = {
  left: 86,
  right: 104,
};

export const defaultDataShortsFooterInset: DataVideoFrameInset = {
  left: 86,
  right: 86,
};

export const defaultDataShortsTemplate = {
  chartHeight: 940,
  chartLeft: 78,
  chartRightPadding: 128,
  chartTop: 498 + SHORTS_PLATFORM_TOP_CLEARANCE,
  chartWidth: 952,
  footerTop: 1532,
  headerTop: 154 + SHORTS_PLATFORM_TOP_CLEARANCE,
  timelineRailLeftPadding: 60,
  timelineRailRightPadding: 48,
  timelineRailTop: 332 + SHORTS_PLATFORM_TOP_CLEARANCE,
} as const;

export type StandardDataVideoFrameGeometryOptions = {
  chartHeight?: number;
  chartTop?: number;
  footerInset?: DataVideoFrameInset;
  footerTop?: number;
  frameInset?: DataVideoFrameInset;
  headerTop?: number;
  timelineRailLeftPadding?: number;
  timelineRailRightPadding?: number;
  timelineRailTop?: number;
  verticalLayoutLift?: number;
  videoWidth?: number;
};

export const createDataVideoFrameGeometry = ({
  chartHeight,
  chartTop,
  footerTop,
  frameInset,
  headerTop,
  timelineRailTop,
  videoWidth = VIDEO_WIDTH,
}: {
  chartHeight: number;
  chartTop: number;
  footerTop: number;
  frameInset: DataVideoFrameInset;
  headerTop: number;
  timelineRailTop: number;
  videoWidth?: number;
}): DataVideoFrameGeometry => {
  const frameWidth = videoWidth - frameInset.left - frameInset.right;

  return {
    chart: {
      height: chartHeight,
      left: frameInset.left,
      top: chartTop,
      width: frameWidth,
    },
    footerTop,
    frameInset,
    headerTop,
    timelineRail: {
      left: frameInset.left,
      top: timelineRailTop,
      width: frameWidth,
    },
  };
};

export const createStandardDataVideoFrameGeometry = ({
  chartHeight = 970,
  chartTop,
  footerInset,
  footerTop,
  frameInset = standardDataVideoFrameInset,
  headerTop,
  timelineRailLeftPadding = 0,
  timelineRailRightPadding = 0,
  timelineRailTop,
  verticalLayoutLift = 46,
  videoWidth = VIDEO_WIDTH,
}: StandardDataVideoFrameGeometryOptions = {}): DataVideoFrameGeometry => {
  const geometry = createDataVideoFrameGeometry({
    chartHeight,
    chartTop: chartTop ?? 575 + SHORTS_PLATFORM_TOP_CLEARANCE - verticalLayoutLift,
    footerTop: footerTop ?? 1634 - verticalLayoutLift,
    frameInset,
    headerTop: headerTop ?? 166 + SHORTS_PLATFORM_TOP_CLEARANCE - verticalLayoutLift,
    timelineRailTop: timelineRailTop ?? 332 + SHORTS_PLATFORM_TOP_CLEARANCE - verticalLayoutLift,
    videoWidth,
  });

  return {
    ...geometry,
    footerInset,
    timelineRail: {
      left: frameInset.left + timelineRailLeftPadding,
      top: geometry.timelineRail.top,
      width: videoWidth - frameInset.left - frameInset.right - timelineRailLeftPadding - timelineRailRightPadding,
    },
  };
};

export const createDefaultDataShortsFrameGeometry = ({
  chartHeight = defaultDataShortsTemplate.chartHeight,
  chartTop = defaultDataShortsTemplate.chartTop,
  chartWidth = defaultDataShortsTemplate.chartWidth,
  chartLeft = defaultDataShortsTemplate.chartLeft,
  footerInset = defaultDataShortsFooterInset,
  footerTop = defaultDataShortsTemplate.footerTop,
  frameInset = defaultDataShortsFrameInset,
  headerTop = defaultDataShortsTemplate.headerTop,
  timelineRailLeftPadding = defaultDataShortsTemplate.timelineRailLeftPadding,
  timelineRailRightPadding = defaultDataShortsTemplate.timelineRailRightPadding,
  timelineRailTop = defaultDataShortsTemplate.timelineRailTop,
  videoWidth = VIDEO_WIDTH,
}: StandardDataVideoFrameGeometryOptions & {
  chartLeft?: number;
  chartWidth?: number;
} = {}): DataVideoFrameGeometry => ({
  chart: {
    height: chartHeight,
    left: chartLeft,
    top: chartTop,
    width: chartWidth,
  },
  footerInset,
  footerTop,
  frameInset,
  headerTop,
  timelineRail: {
    left: frameInset.left + timelineRailLeftPadding,
    top: timelineRailTop,
    width: videoWidth - frameInset.left - frameInset.right - timelineRailLeftPadding - timelineRailRightPadding,
  },
});

export const createSimpleBarRaceFrameGeometry = createStandardDataVideoFrameGeometry;

export const DataVideoFrameLayout = ({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) => (
  <AbsoluteFill style={{ ...styles.stage, ...style }}>
    {children}
  </AbsoluteFill>
);

export const DataVideoBackground = ({
  chart,
}: {
  chart: DataVideoChartBounds;
}) => (
  <AbsoluteFill style={styles.background}>
    <div style={styles.gridLines} />
    <div style={styles.topShadow} />
    <div
      style={{
        ...styles.chartGlow,
        height: chart.height + 260,
        top: chart.top - 95,
      }}
    />
  </AbsoluteFill>
);

export const DataVideoHeader = ({
  accentColor = '#F5E829',
  children,
  geometry,
  intro,
  subtitle,
  title,
  titleHook,
}: {
  accentColor?: string;
  children?: ReactNode;
  geometry: DataVideoFrameGeometry;
  intro: number;
  subtitle: string;
  title: string;
  titleHook: string;
}) => {
  const y = interpolate(intro, [0, 1], [-28, 0]);

  return (
    <div
      style={{
        ...styles.header,
        left: geometry.frameInset.left,
        opacity: intro,
        right: geometry.frameInset.right,
        top: geometry.headerTop,
        transform: `translateY(${y}px)`,
      }}
    >
      <div style={styles.headerTop}>
        <div style={{ ...styles.title, color: accentColor }}>{title}</div>
        {children}
      </div>
      <div style={styles.titleHook}>{titleHook}</div>
      <div style={styles.subtitle}>{subtitle}</div>
    </div>
  );
};

export const DataVideoHeroHeader = ({
  accentColor = '#F5E829',
  geometry,
  intro = 1,
  style,
  subtitle,
  subtitleStyle,
  title,
  titleStyle,
}: {
  accentColor?: string;
  geometry: DataVideoFrameGeometry;
  intro?: number;
  style?: CSSProperties;
  subtitle: string;
  subtitleStyle?: CSSProperties;
  title: string;
  titleStyle?: CSSProperties;
}) => {
  const y = interpolate(intro, [0, 1], [-28, 0]);

  return (
    <div
      style={{
        ...styles.heroHeader,
        left: geometry.frameInset.left,
        opacity: intro,
        right: geometry.frameInset.right,
        top: geometry.headerTop,
        transform: `translateY(${y}px)`,
        ...style,
      }}
    >
      <div style={{ ...styles.heroTitle, color: accentColor, ...titleStyle }}>{title}</div>
      <div style={{ ...styles.heroSubtitle, ...subtitleStyle }}>{subtitle}</div>
    </div>
  );
};

export const DataVideoFocusHeader = ({
  accentColor = '#F5E829',
  channelTag,
  geometry,
  intro = 1,
  style,
  subtitle,
  title,
  titleHook,
}: {
  accentColor?: string;
  channelTag?: ReactNode;
  geometry: DataVideoFrameGeometry;
  intro?: number;
  style?: CSSProperties;
  subtitle?: string;
  title: string;
  titleHook: string;
}) => {
  const y = interpolate(intro, [0, 1], [-28, 0]);

  return (
    <div
      style={{
        ...styles.focusHeader,
        left: geometry.frameInset.left,
        opacity: intro,
        right: geometry.frameInset.right,
        top: geometry.headerTop,
        transform: `translateY(${y}px)`,
        ...style,
      }}
    >
      <div style={styles.focusHeaderTop}>
        <div style={{ ...styles.focusTitle, color: accentColor }}>{title}</div>
        {channelTag ? <div style={styles.focusChannelTag}>{channelTag}</div> : null}
      </div>
      <div style={styles.focusTitleHook}>{titleHook}</div>
      {subtitle ? <div style={styles.focusSubtitle}>{subtitle}</div> : null}
    </div>
  );
};

export const DataVideoTimelineRail = ({
  accentColor = '#F5E829',
  currentLabel,
  geometry,
  intro,
  maxLabel,
  minLabel,
  progress,
}: {
  accentColor?: string;
  currentLabel: number | string;
  geometry: DataVideoFrameGeometry;
  intro: number;
  maxLabel: number | string;
  minLabel: number | string;
  progress: number;
}) => {
  const rail = geometry.timelineRail;
  const fillWidth = clamp(progress, 0, 1) * rail.width;

  return (
    <div
      style={{
        ...styles.timelineRailBlock,
        left: rail.left,
        opacity: intro,
        top: rail.top,
        width: rail.width,
      }}
    >
      <div style={styles.currentTimelineLabel}>{currentLabel}</div>
      <svg height={58} style={styles.timelineRailSvg} viewBox={`0 0 ${rail.width} 58`} width={rail.width}>
        <line
          stroke="rgba(255,255,255,0.2)"
          strokeLinecap="round"
          strokeWidth={6}
          x1={0}
          x2={rail.width}
          y1={19}
          y2={19}
        />
        <line
          stroke={accentColor}
          strokeLinecap="round"
          strokeWidth={6}
          x1={0}
          x2={fillWidth}
          y1={19}
          y2={19}
        />
        <text fill="rgba(255,255,255,0.52)" fontFamily={dataVideoFontStack} fontSize={24} fontWeight={850} x={0} y={51}>
          {minLabel}
        </text>
        <text
          fill="rgba(255,255,255,0.52)"
          fontFamily={dataVideoFontStack}
          fontSize={24}
          fontWeight={850}
          textAnchor="end"
          x={rail.width}
          y={51}
        >
          {maxLabel}
        </text>
      </svg>
    </div>
  );
};

export const DataVideoChartTopBar = ({
  chart,
  children,
  intro,
  topOffset = -70,
}: {
  chart: DataVideoChartBounds;
  children: ReactNode;
  intro: number;
  topOffset?: number;
}) => (
  <div
    style={{
      ...styles.chartTopBar,
      left: chart.left,
      opacity: intro,
      top: chart.top + topOffset,
      width: chart.width,
    }}
  >
    {children}
  </div>
);

export const DataVideoChartFrame = ({
  chart,
  children,
  intro,
  style,
}: {
  chart: DataVideoChartBounds;
  children: ReactNode;
  intro: number;
  style?: CSSProperties;
}) => (
  <div
    style={{
      ...styles.chartFrame,
      height: chart.height,
      left: chart.left,
      opacity: intro,
      top: chart.top,
      width: chart.width,
      ...style,
    }}
  >
    {children}
  </div>
);

export const DataVideoChannelTag = ({ children }: { children: ReactNode }) => (
  <div style={styles.channelTag}>{children}</div>
);

export const DataVideoMetricPill = ({
  accentColor = '#F5E829',
  label,
  style,
  value,
  valueStyle,
  valueWidth = 54,
}: {
  accentColor?: string;
  label: ReactNode;
  style?: CSSProperties;
  value: ReactNode;
  valueStyle?: CSSProperties;
  valueWidth?: number;
}) => (
  <div style={{ ...styles.metricPill, ...style }}>
    <div style={{ ...styles.metricAccent, backgroundColor: accentColor }} />
    <span style={{ ...styles.metricLabel, color: accentColor }}>{label}</span>
    <span style={{ ...styles.metricValue, width: valueWidth, ...valueStyle }}>{value}</span>
  </div>
);

export const DataVideoBalancePill = ({
  leftColor,
  leftLabel,
  leftValue,
  minTotal = 1,
  rightColor,
  rightLabel,
  rightValue,
  style,
}: {
  leftColor: string;
  leftLabel?: ReactNode;
  leftValue: number;
  minTotal?: number;
  rightColor: string;
  rightLabel?: ReactNode;
  rightValue: number;
  style?: CSSProperties;
}) => {
  const totalValue = Math.max(leftValue + rightValue, minTotal);
  const leftWidth = clamp((leftValue / totalValue) * 100, 0, 100);
  const rightWidth = 100 - leftWidth;

  return (
    <div style={{ ...styles.balancePill, ...style }}>
      <div style={styles.balanceBarShell}>
        <div
          style={{
            ...styles.balanceBarSegment,
            backgroundColor: leftColor,
            width: `${leftWidth}%`,
          }}
        />
        <div
          style={{
            ...styles.balanceBarSegment,
            backgroundColor: rightColor,
            width: `${rightWidth}%`,
          }}
        />
        <div style={{ ...styles.balanceBarSplit, left: `${leftWidth}%` }} />
        <span style={{ ...styles.balanceBarLabel, left: 12 }}>
          {leftLabel ?? `${Math.round(leftWidth)}%`}
        </span>
        <span style={{ ...styles.balanceBarLabel, right: 12 }}>
          {rightLabel ?? `${Math.round(rightWidth)}%`}
        </span>
      </div>
    </div>
  );
};

export const DataVideoRaceSummaryStrip = ({
  accentColor = '#F5E829',
  currentLabel,
  currentValue,
  leaderLabel = 'LEADER',
  leaderName,
  leaderValue,
  style,
  valueLabel,
}: {
  accentColor?: string;
  currentLabel: ReactNode;
  currentValue: ReactNode;
  leaderLabel?: ReactNode;
  leaderName: ReactNode;
  leaderValue?: ReactNode;
  style?: CSSProperties;
  valueLabel?: ReactNode;
}) => (
  <div style={{ ...styles.raceSummaryStrip, ...style }}>
    <div style={styles.raceSummaryCurrent}>
      <span style={{ ...styles.raceSummaryKicker, color: accentColor }}>{currentLabel}</span>
      <strong style={styles.raceSummaryCurrentValue}>{currentValue}</strong>
    </div>
    <div style={styles.raceSummaryDivider} />
    <div style={styles.raceSummaryLeader}>
      <span style={{ ...styles.raceSummaryKicker, color: accentColor }}>{leaderLabel}</span>
      <strong style={styles.raceSummaryLeaderName}>{leaderName}</strong>
      {leaderValue ? <span style={styles.raceSummaryLeaderValue}>{leaderValue}</span> : null}
      {valueLabel ? <span style={styles.raceSummaryValueLabel}>{valueLabel}</span> : null}
    </div>
  </div>
);

export const DataVideoFooter = ({
  children,
  geometry,
}: {
  children: ReactNode;
  geometry: DataVideoFrameGeometry;
}) => {
  const footerInset = geometry.footerInset ?? geometry.frameInset;

  return (
    <div
      style={{
        ...styles.footer,
        left: footerInset.left,
        right: footerInset.right,
        top: geometry.footerTop,
      }}
    >
      {children}
    </div>
  );
};

export const DataVideoFooterSource = ({ children }: { children: ReactNode }) => (
  <div style={styles.source}>{children}</div>
);

export const DataVideoFooterNote = ({ children }: { children: ReactNode }) => (
  <div style={styles.note}>{children}</div>
);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const styles = {
  stage: {
    backgroundColor: '#020409',
    color: '#FFFFFF',
    fontFamily: dataVideoFontStack,
    overflow: 'hidden',
  },
  background: {
    backgroundColor: '#020409',
    backgroundImage:
      'radial-gradient(circle at 50% 58%, rgba(31,111,180,0.16) 0%, rgba(7,25,45,0.12) 36%, rgba(2,4,9,0) 68%), radial-gradient(circle at 15% 24%, rgba(245,232,41,0.08) 0%, rgba(245,232,41,0) 34%), radial-gradient(circle at 88% 16%, rgba(56,189,248,0.08) 0%, rgba(56,189,248,0) 36%), linear-gradient(180deg, #020409 0%, #06101B 52%, #020409 100%)',
  },
  gridLines: {
    position: 'absolute',
    inset: 0,
    opacity: 0.25,
    backgroundImage:
      'linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.026) 1px, transparent 1px)',
    backgroundSize: '92px 92px',
  },
  topShadow: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.12) 34%, rgba(0,0,0,0.72) 100%)',
  },
  chartGlow: {
    position: 'absolute',
    left: 70,
    right: 70,
    background:
      'radial-gradient(ellipse at 54% 50%, rgba(56,189,248,0.08), rgba(7,28,44,0.22) 38%, rgba(0,0,0,0) 74%)',
  },
  header: {
    position: 'absolute',
    zIndex: 5,
  },
  headerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 18,
  },
  title: {
    fontSize: 66,
    fontWeight: 950,
    lineHeight: 0.94,
    letterSpacing: 0,
    whiteSpace: 'nowrap',
  },
  titleHook: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 950,
    lineHeight: 1.05,
    letterSpacing: 0,
    textShadow: '0 5px 18px rgba(0,0,0,0.64)',
    whiteSpace: 'nowrap',
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.86)',
    fontSize: 25,
    fontWeight: 800,
    lineHeight: 1.22,
  },
  heroHeader: {
    position: 'absolute',
    zIndex: 5,
  },
  heroTitle: {
    fontSize: 82,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 0.9,
    whiteSpace: 'nowrap',
  },
  heroSubtitle: {
    color: '#FFFFFF',
    fontSize: 43,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1.06,
    marginTop: 16,
    textShadow: '0 5px 18px rgba(0,0,0,0.64)',
    whiteSpace: 'nowrap',
  },
  focusHeader: {
    position: 'absolute',
    zIndex: 5,
  },
  focusHeaderTop: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: 18,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  focusTitle: {
    flex: '1 1 auto',
    fontSize: 58,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 0.96,
    maxWidth: 744,
    textShadow: '0 5px 18px rgba(0,0,0,0.5)',
  },
  focusChannelTag: {
    flex: '0 0 auto',
    marginTop: 8,
  },
  focusTitleHook: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1.05,
    marginTop: 13,
    textShadow: '0 5px 18px rgba(0,0,0,0.64)',
    whiteSpace: 'nowrap',
  },
  focusSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 21,
    fontWeight: 800,
    lineHeight: 1.22,
    marginTop: 9,
  },
  timelineRailBlock: {
    position: 'absolute',
    zIndex: 9,
  },
  currentTimelineLabel: {
    marginBottom: 10,
    color: '#FFFFFF',
    fontSize: 62,
    fontWeight: 950,
    lineHeight: 0.9,
    textAlign: 'right',
    fontStyle: 'italic',
    textShadow: '0 10px 26px rgba(0,0,0,0.38)',
  },
  timelineRailSvg: {
    display: 'block',
  },
  chartTopBar: {
    position: 'absolute',
    zIndex: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
  },
  chartFrame: {
    position: 'absolute',
    zIndex: 6,
    overflow: 'hidden',
    backgroundColor: '#000000',
    border: '3px solid rgba(0,0,0,0.95)',
    borderRadius: 0,
    boxShadow:
      '0 22px 56px rgba(0,0,0,0.48), inset 0 0 0 1px rgba(255,255,255,0.08)',
    transformOrigin: 'center top',
    willChange: 'transform, opacity',
  },
  channelTag: {
    flex: '0 0 auto',
    padding: '7px 11px',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 999,
    background: 'rgba(2,8,14,0.54)',
    color: 'rgba(255,255,255,0.78)',
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: 0,
    boxShadow: '0 14px 34px rgba(0,0,0,0.26)',
  },
  metricPill: {
    alignItems: 'center',
    background: 'rgba(2,8,14,0.82)',
    border: '1px solid rgba(255,255,255,0.22)',
    boxShadow: '0 14px 34px rgba(0,0,0,0.34)',
    display: 'flex',
    flex: '0 0 auto',
    gap: 11,
    minHeight: 54,
    padding: '10px 15px',
  },
  metricAccent: {
    height: 30,
    width: 6,
  },
  metricLabel: {
    fontSize: 17,
    fontWeight: 950,
    lineHeight: 1,
  },
  metricValue: {
    color: '#FFFFFF',
    display: 'inline-block',
    fontSize: 27,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    lineHeight: 1,
    textAlign: 'right',
  },
  balancePill: {
    alignItems: 'center',
    background: 'rgba(2,8,14,0.82)',
    border: '1px solid rgba(255,255,255,0.22)',
    boxShadow: '0 14px 34px rgba(0,0,0,0.34)',
    display: 'flex',
    flex: '1 1 auto',
    gap: 12,
    minHeight: 54,
    minWidth: 250,
    padding: '10px 13px',
  },
  balanceBarShell: {
    background: 'rgba(255,255,255,0.12)',
    display: 'flex',
    flex: 1,
    height: 20,
    minWidth: 190,
    overflow: 'hidden',
    position: 'relative',
  },
  balanceBarSegment: {
    height: '100%',
  },
  balanceBarSplit: {
    background: 'rgba(2,8,14,0.9)',
    height: '100%',
    position: 'absolute',
    top: 0,
    transform: 'translateX(-50%)',
    width: 3,
  },
  balanceBarLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1,
    position: 'absolute',
    textShadow: '0 2px 8px rgba(0,0,0,0.72)',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  raceSummaryStrip: {
    alignItems: 'center',
    background: 'rgba(2,8,14,0.78)',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 14px 34px rgba(0,0,0,0.3)',
    display: 'flex',
    flex: '1 1 auto',
    gap: 15,
    minHeight: 58,
    minWidth: 0,
    overflow: 'hidden',
    padding: '10px 15px',
  },
  raceSummaryCurrent: {
    alignItems: 'baseline',
    display: 'flex',
    flex: '0 0 auto',
    gap: 10,
    minWidth: 0,
  },
  raceSummaryDivider: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.18)',
    flex: '0 0 auto',
    width: 1,
  },
  raceSummaryLeader: {
    alignItems: 'baseline',
    display: 'flex',
    flex: '1 1 auto',
    gap: 10,
    minWidth: 0,
    overflow: 'hidden',
  },
  raceSummaryKicker: {
    flex: '0 0 auto',
    fontSize: 16,
    fontWeight: 950,
    lineHeight: 1,
  },
  raceSummaryCurrentValue: {
    color: '#FFFFFF',
    flex: '0 0 auto',
    fontSize: 27,
    fontStyle: 'italic',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    lineHeight: 1,
  },
  raceSummaryLeaderName: {
    color: '#FFFFFF',
    flex: '0 1 auto',
    fontSize: 25,
    fontWeight: 950,
    lineHeight: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  raceSummaryLeaderValue: {
    color: '#FFFFFF',
    flex: '0 0 auto',
    fontSize: 25,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    lineHeight: 1,
  },
  raceSummaryValueLabel: {
    color: 'rgba(255,255,255,0.58)',
    flex: '0 0 auto',
    fontSize: 16,
    fontWeight: 900,
    lineHeight: 1,
  },
  footer: {
    position: 'absolute',
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
