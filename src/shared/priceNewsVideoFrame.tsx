import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { VIDEO_WIDTH } from './video';
import { dataVideoFontStack, type DataVideoChartBounds, type DataVideoFrameInset } from './dataVideoFrame';

export type PriceNewsVideoTheme = {
  background: string;
  border: string;
  chartBackground: string;
  ink: string;
  muted: string;
  panel: string;
};

export type PriceNewsFrameGeometry = {
  chart: DataVideoChartBounds;
  dateReadoutTop: number;
  frameInset: DataVideoFrameInset;
  headerTop: number;
  newsFeedBottom: number;
};

export const createPriceNewsFrameGeometry = ({
  chartHeight,
  chartTop,
  dateReadoutTop,
  frameInset,
  headerTop,
  newsFeedBottom,
  videoWidth = VIDEO_WIDTH,
}: {
  chartHeight: number;
  chartTop: number;
  dateReadoutTop: number;
  frameInset: DataVideoFrameInset;
  headerTop: number;
  newsFeedBottom: number;
  videoWidth?: number;
}): PriceNewsFrameGeometry => {
  const frameWidth = videoWidth - frameInset.left - frameInset.right;

  return {
    chart: {
      height: chartHeight,
      left: frameInset.left,
      top: chartTop,
      width: frameWidth,
    },
    dateReadoutTop,
    frameInset,
    headerTop,
    newsFeedBottom,
  };
};

export const PriceNewsVideoFrame = ({
  children,
  theme,
}: {
  children: ReactNode;
  theme: PriceNewsVideoTheme;
}) => (
  <AbsoluteFill
    style={{
      ...styles.stage,
      backgroundColor: theme.background,
      color: theme.ink,
    }}
  >
    <div
      style={{
        ...styles.backgroundPanel,
        background:
          `linear-gradient(180deg, ${theme.background} 0%, rgba(241,243,247,0.92) 58%, ${theme.background} 100%)`,
      }}
    />
    {children}
  </AbsoluteFill>
);

export const PriceNewsHeader = ({
  badge,
  geometry,
  intro,
  subtitle,
  theme,
  title,
}: {
  badge: string;
  geometry: PriceNewsFrameGeometry;
  intro: number;
  subtitle: string;
  theme: PriceNewsVideoTheme;
  title: string;
}) => {
  const y = interpolate(intro, [0, 1], [-24, 0]);

  return (
    <div
      style={{
        ...styles.header,
        left: geometry.frameInset.left,
        opacity: intro,
        top: geometry.headerTop,
        transform: `translateY(${y}px)`,
      }}
    >
      <div style={{ ...styles.marketBadge, background: theme.ink }}>{badge}</div>
      <div style={{ ...styles.title, color: theme.ink }}>{title}</div>
      <div style={{ ...styles.subtitle, color: theme.muted }}>{subtitle}</div>
    </div>
  );
};

export const PriceNewsDateReadout = ({
  children,
  geometry,
  label,
  theme,
}: {
  children: ReactNode;
  geometry: PriceNewsFrameGeometry;
  label: string;
  theme: PriceNewsVideoTheme;
}) => (
  <div
    style={{
      ...styles.dateReadout,
      right: geometry.frameInset.right,
      top: geometry.dateReadoutTop,
    }}
  >
    <div style={{ ...styles.dateLabel, color: theme.muted }}>{label}</div>
    <div style={{ ...styles.currentDate, color: theme.ink }}>{children}</div>
  </div>
);

export const PriceNewsChartShell = ({
  children,
  geometry,
  theme,
}: {
  children: ReactNode;
  geometry: PriceNewsFrameGeometry;
  theme: PriceNewsVideoTheme;
}) => (
  <div
    style={{
      ...styles.chartShell,
      background: theme.chartBackground,
      borderColor: theme.border,
      height: geometry.chart.height,
      left: geometry.chart.left,
      top: geometry.chart.top,
      width: geometry.chart.width,
    }}
  >
    {children}
  </div>
);

export const PriceNewsMetricCard = ({
  accent,
  children,
  theme,
}: {
  accent: string;
  children: ReactNode;
  theme: PriceNewsVideoTheme;
}) => (
  <div
    style={{
      ...styles.metricCard,
      background: colorWithOpacity(theme.panel, 0.94),
      borderTopColor: accent,
    }}
  >
    {children}
  </div>
);

export const PriceNewsMetricLabel = ({
  children,
  theme,
}: {
  children: ReactNode;
  theme: PriceNewsVideoTheme;
}) => (
  <div style={{ ...styles.metricLabel, color: theme.muted }}>{children}</div>
);

export const PriceNewsMetricValue = ({
  children,
  theme,
}: {
  children: ReactNode;
  theme: PriceNewsVideoTheme;
}) => (
  <div style={{ ...styles.metricValue, color: theme.ink }}>{children}</div>
);

export const PriceNewsMetricMeta = ({ children }: { children: ReactNode }) => (
  <div style={styles.metricMetaRow}>{children}</div>
);

export const PriceNewsMetricDetail = ({
  children,
  theme,
}: {
  children: ReactNode;
  theme: PriceNewsVideoTheme;
}) => (
  <div style={{ ...styles.metricDetail, color: colorWithOpacity(theme.ink, 0.72) }}>{children}</div>
);

export const PriceNewsEventCard = ({
  accent,
  children,
  left,
  opacity,
  top,
  transform,
  transformOrigin,
}: {
  accent: string;
  children: ReactNode;
  left: number;
  opacity: number;
  top: number;
  transform: string;
  transformOrigin: string;
}) => (
  <div
    style={{
      ...styles.eventCard,
      borderColor: accent,
      left,
      opacity,
      top,
      transform,
      transformOrigin,
    }}
  >
    {children}
  </div>
);

export const PriceNewsEventImage = ({
  alt,
  credit,
  src,
}: {
  alt: string;
  credit: string;
  src: string;
}) => (
  <div style={styles.eventImageWrap}>
    <img src={src} alt={alt} style={styles.eventImage} />
    <div style={styles.eventImageTint} />
    <div style={styles.eventImageCredit}>{credit}</div>
  </div>
);

export const PriceNewsEventBody = ({ children }: { children: ReactNode }) => (
  <div style={styles.eventBody}>{children}</div>
);

export const PriceNewsEventDate = ({
  accent,
  children,
}: {
  accent: string;
  children: ReactNode;
}) => (
  <div style={{ ...styles.eventDate, color: accent }}>{children}</div>
);

export const PriceNewsEventTitle = ({
  children,
  theme,
}: {
  children: ReactNode;
  theme: PriceNewsVideoTheme;
}) => (
  <div style={{ ...styles.eventTitle, color: theme.ink }}>{children}</div>
);

export const PriceNewsEventDetail = ({
  children,
  theme,
}: {
  children: ReactNode;
  theme: PriceNewsVideoTheme;
}) => (
  <div style={{ ...styles.eventDetail, color: colorWithOpacity(theme.ink, 0.68) }}>{children}</div>
);

export const PriceNewsEventStat = ({
  children,
  color,
}: {
  children: ReactNode;
  color: string;
}) => (
  <div style={{ ...styles.eventStat, color }}>{children}</div>
);

export const PriceNewsFeed = ({
  children,
  geometry,
  transform,
}: {
  children: ReactNode;
  geometry: PriceNewsFrameGeometry;
  transform?: string;
}) => (
  <div
    style={{
      ...styles.newsFeed,
      bottom: geometry.newsFeedBottom,
      left: geometry.frameInset.left,
      right: geometry.frameInset.right,
      transform,
    }}
  >
    {children}
  </div>
);

export const PriceNewsFeedItem = ({
  accent,
  date,
  opacity,
  stat,
  theme,
  title,
  transform,
}: {
  accent: string;
  date: string;
  opacity: number;
  stat: string;
  theme: PriceNewsVideoTheme;
  title: string;
  transform: string;
}) => (
  <div
    style={{
      ...styles.newsFeedItem,
      background: colorWithOpacity(theme.panel, 0.94),
      borderLeftColor: accent,
      opacity,
      transform,
    }}
  >
    <span style={{ ...styles.newsFeedDate, color: accent }}>{date}</span>
    <span style={{ ...styles.newsFeedTitle, color: theme.ink }}>{title}</span>
    <span style={{ ...styles.newsFeedStat, color: colorWithOpacity(theme.ink, 0.68) }}>{stat}</span>
  </div>
);

const colorWithOpacity = (color: string, opacity: number) => {
  if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
    const normalized = color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;
    const red = Number.parseInt(normalized.slice(1, 3), 16);
    const green = Number.parseInt(normalized.slice(3, 5), 16);
    const blue = Number.parseInt(normalized.slice(5, 7), 16);

    return `rgba(${red},${green},${blue},${opacity})`;
  }

  return color;
};

export const priceNewsTemplate = {
  chartRightScaleWidth: 122,
  eventCardHeight: 340,
  eventCardWidth: 420,
  newsFeedGap: 8,
  newsRowHeight: 64,
} as const;

const styles = {
  stage: {
    fontFamily: dataVideoFontStack,
    overflow: 'hidden',
  },
  backgroundPanel: {
    position: 'absolute',
    inset: 0,
  },
  header: {
    position: 'absolute',
    width: 780,
    zIndex: 5,
  },
  marketBadge: {
    display: 'inline-block',
    padding: '12px 16px',
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1,
  },
  title: {
    marginTop: 24,
    fontSize: 72,
    fontWeight: 950,
    lineHeight: 0.96,
    letterSpacing: 0,
    maxWidth: 760,
  },
  subtitle: {
    marginTop: 16,
    width: 920,
    fontSize: 29,
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  dateReadout: {
    position: 'absolute',
    width: 420,
    textAlign: 'right',
    zIndex: 6,
  },
  dateLabel: {
    fontSize: 24,
    fontWeight: 950,
  },
  currentDate: {
    marginTop: 9,
    fontSize: 62,
    fontWeight: 950,
    lineHeight: 0.96,
    fontVariantNumeric: 'tabular-nums',
  },
  chartShell: {
    position: 'absolute',
    border: '2px solid',
    overflow: 'hidden',
    zIndex: 2,
  },
  metricCard: {
    position: 'absolute',
    left: 24,
    top: 24,
    width: 440,
    padding: '18px 22px 20px',
    borderTop: '8px solid',
    boxShadow: '0 18px 48px rgba(20,20,20,0.14)',
    zIndex: 12,
  },
  metricLabel: {
    fontSize: 21,
    fontWeight: 950,
    lineHeight: 1,
  },
  metricValue: {
    marginTop: 9,
    fontSize: 62,
    fontWeight: 950,
    lineHeight: 0.92,
    fontVariantNumeric: 'tabular-nums',
  },
  metricMetaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 14,
    marginTop: 11,
  },
  metricDetail: {
    marginTop: 10,
    fontSize: 25,
    fontWeight: 900,
    lineHeight: 1.08,
  },
  eventCard: {
    position: 'absolute',
    width: priceNewsTemplate.eventCardWidth,
    height: priceNewsTemplate.eventCardHeight,
    boxSizing: 'border-box',
    border: '3px solid',
    background: 'rgba(255,255,255,0.98)',
    boxShadow: '0 22px 58px rgba(20,20,20,0.24)',
    overflow: 'hidden',
  },
  eventImageWrap: {
    position: 'relative',
    width: '100%',
    height: 128,
    overflow: 'hidden',
    background: '#DDE2EA',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  eventImageTint: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.42))',
  },
  eventImageCredit: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 8,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 10,
    fontWeight: 780,
    lineHeight: 1.12,
    textShadow: '0 1px 8px rgba(0,0,0,0.52)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  eventBody: {
    padding: '13px 18px 16px',
  },
  eventDate: {
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  eventTitle: {
    marginTop: 7,
    fontSize: 30,
    fontWeight: 950,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  eventDetail: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: 760,
    lineHeight: 1.13,
    maxHeight: 58,
    overflow: 'hidden',
  },
  eventStat: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  newsFeed: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    gap: priceNewsTemplate.newsFeedGap,
    zIndex: 9,
  },
  newsFeedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    minHeight: priceNewsTemplate.newsRowHeight,
    boxSizing: 'border-box',
    padding: '7px 18px 9px',
    borderLeft: '9px solid',
    boxShadow: '0 14px 34px rgba(20,20,20,0.12)',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  newsFeedDate: {
    flex: '0 0 auto',
    width: 170,
    fontSize: 38,
    fontWeight: 950,
    lineHeight: 1,
  },
  newsFeedTitle: {
    flex: '1 1 auto',
    minWidth: 0,
    fontSize: 42,
    fontWeight: 950,
    lineHeight: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  newsFeedStat: {
    flex: '0 0 auto',
    fontSize: 38,
    fontWeight: 950,
    lineHeight: 1,
  },
} satisfies Record<string, CSSProperties>;
