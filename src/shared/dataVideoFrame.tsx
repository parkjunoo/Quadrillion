import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { VIDEO_WIDTH } from './video';

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
  footerTop: number;
  frameInset: DataVideoFrameInset;
  headerTop: number;
  timelineRail: DataVideoTimelineRailBounds;
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

export const DataVideoFooter = ({
  children,
  geometry,
}: {
  children: ReactNode;
  geometry: DataVideoFrameGeometry;
}) => (
  <div
    style={{
      ...styles.footer,
      left: geometry.frameInset.left,
      right: geometry.frameInset.right,
      top: geometry.footerTop,
    }}
  >
    {children}
  </div>
);

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
