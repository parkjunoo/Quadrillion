import type { CSSProperties } from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
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
import { timeUse24hVideoConfig } from './config';
import {
  firstTimeUseSnapshot,
  formatHours,
  formatSignedMinutes,
  getCategory,
  getTimeUseFrameState,
  lastTimeUseSnapshot,
  type TimeUseFrameRow,
  type TimeUseFrameState,
} from './timeUseData';

const fontStack = dataVideoFontStack;
const channelHandle = '@whoa-data';
const accentColor = '#7CFFB2';
const templateTopOffset = SHORTS_PLATFORM_TOP_CLEARANCE;
const frameInset = {
  left: 76,
  right: 76,
};
const frameLayout = createDataVideoFrameGeometry({
  chartHeight: 945,
  chartTop: 560 + templateTopOffset,
  footerTop: 1588,
  frameInset,
  headerTop: 154 + templateTopOffset,
  timelineRailTop: 332 + templateTopOffset,
});
const chart = frameLayout.chart;
const calloutByYear = new Map(
  timeUse24hVideoConfig.callouts.map((callout) => [callout.year, callout]),
);

export const TimeUse24hVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(timeUse24hVideoConfig.startHoldSeconds * fps);
  const endHoldFrames = Math.round(timeUse24hVideoConfig.endHoldSeconds * fps);
  const motionFrames = Math.max(1, durationInFrames - startHoldFrames - endHoldFrames);
  const timeUseFrame = clamp(frame - startHoldFrames, 0, motionFrames - 1);
  const state = getTimeUseFrameState({
    durationInFrames: motionFrames,
    frame: timeUseFrame,
  });

  return (
    <DataVideoFrameLayout style={styles.stage}>
      <DataVideoBackground chart={chart} />
      <DataVideoHeader
        accentColor={accentColor}
        geometry={frameLayout}
        intro={1}
        subtitle={timeUse24hVideoConfig.subtitle}
        title={timeUse24hVideoConfig.title}
        titleHook={timeUse24hVideoConfig.titleHook}
      />
      <DataVideoTimelineRail
        accentColor={accentColor}
        currentLabel={Math.round(state.year)}
        geometry={frameLayout}
        intro={1}
        maxLabel={lastTimeUseSnapshot.year}
        minLabel={firstTimeUseSnapshot.year}
        progress={state.yearProgress}
      />
      <DataVideoChartTopBar chart={chart} intro={1}>
        <CalloutStrip state={state} />
        <DataVideoChannelTag>{channelHandle}</DataVideoChannelTag>
      </DataVideoChartTopBar>
      <DataVideoChartFrame chart={chart} intro={1} style={styles.chartFrame}>
        <TwentyFourHourBar state={state} />
        <TimeUsePieSection state={state} />
      </DataVideoChartFrame>
      <Footer />
    </DataVideoFrameLayout>
  );
};

const CalloutStrip = ({ state }: { state: TimeUseFrameState }) => {
  const callout = calloutByYear.get(state.calloutYear);

  if (!callout) {
    return <div style={styles.calloutGhost}>24 hours, zero extra minutes</div>;
  }

  const category = getCategory(callout.categoryId);
  const proximity = clamp(1 - Math.abs(state.year - callout.year) / 1.8, 0, 1);
  const opacity = interpolate(proximity, [0, 1], [0.26, 1]);

  return (
    <div
      style={{
        ...styles.callout,
        borderColor: hexToRgba(category.color, 0.7),
        boxShadow: `0 14px 30px rgba(0,0,0,0.32), 0 0 20px ${hexToRgba(category.color, 0.16)}`,
        opacity,
      }}
    >
      <div style={{ ...styles.calloutDot, backgroundColor: category.color }} />
      <div>
        <div style={{ ...styles.calloutTitle, color: category.color }}>{callout.title}</div>
        <div style={styles.calloutDetail}>{callout.detail}</div>
      </div>
    </div>
  );
};

const TwentyFourHourBar = ({ state }: { state: TimeUseFrameState }) => {
  const orderedRows = timeUse24hVideoConfig.categories
    .map((category) => state.rows.find((row) => row.category.id === category.id))
    .filter((row): row is TimeUseFrameRow => Boolean(row));
  let x = 0;

  return (
    <div style={styles.dayBlock}>
      <div style={styles.dayHeader}>
        <span style={styles.dayTitle}>THE 24-HOUR DAY</span>
        <span style={styles.dayTotal}>24h locked</span>
      </div>
      <svg height={260} style={styles.daySvg} viewBox={`0 0 ${chart.width - 80} 260`} width={chart.width - 80}>
        <rect fill="rgba(255,255,255,0.05)" height={116} rx={20} width={chart.width - 80} x={0} y={44} />
        {orderedRows.map((row) => {
          const width = (row.hours / 24) * (chart.width - 80);
          const segment = (
            <g key={row.category.id}>
              <rect
                fill={row.category.color}
                height={116}
                opacity={row.category.id === 'other' ? 0.52 : 0.94}
                rx={x === 0 || x + width >= chart.width - 82 ? 20 : 0}
                width={Math.max(0, width)}
                x={x}
                y={44}
              />
              {width > 62 ? (
                <text
                  fill={row.category.id === 'social' ? '#081018' : '#071018'}
                  fontFamily={fontStack}
                  fontSize={22}
                  fontWeight={950}
                  textAnchor="middle"
                  x={x + width / 2}
                  y={110}
                >
                  {row.category.shortLabel}
                </text>
              ) : null}
            </g>
          );
          x += width;

          return segment;
        })}
        {Array.from({ length: 7 }).map((_, index) => {
          const tickX = (index / 6) * (chart.width - 80);
          const textAnchor = index === 0 ? 'start' : index === 6 ? 'end' : 'middle';

          return (
            <g key={`tick-${index}`}>
              <line stroke="rgba(255,255,255,0.16)" strokeWidth={2} x1={tickX} x2={tickX} y1={28} y2={182} />
              <text
                fill="rgba(255,255,255,0.55)"
                fontFamily={fontStack}
                fontSize={19}
                fontWeight={850}
                textAnchor={textAnchor}
                x={tickX}
                y={218}
              >
                {index * 4}h
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const TimeUsePieSection = ({ state }: { state: TimeUseFrameState }) => {
  const rows = state.rows.slice(0, 9);

  return (
    <div style={styles.pieSection}>
      <TimeUsePie rows={state.rows} />
      <div style={styles.legendRows}>
        {rows.map((row) => (
          <TimeUseLegendRow key={row.category.id} row={row} />
        ))}
      </div>
    </div>
  );
};

const TimeUsePie = ({ rows }: { rows: TimeUseFrameRow[] }) => {
  const size = 426;
  const radius = 166;
  const center = size / 2;
  const total = rows.reduce((sum, row) => sum + row.hours, 0);
  let cursor = -90;

  return (
    <div style={styles.pieWrap}>
      <svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <circle cx={center} cy={center} fill="rgba(255,255,255,0.04)" r={radius + 18} />
        {rows.map((row) => {
          const angle = (row.hours / total) * 360;
          const path = describeArc(center, center, radius, cursor, cursor + angle);
          const labelAngle = cursor + angle / 2;
          const labelPoint = polarToCartesian(center, center, radius * 0.68, labelAngle);
          cursor += angle;

          return (
            <g key={`slice-${row.category.id}`}>
              <path
                d={`${path} L ${center} ${center} Z`}
                fill={row.category.color}
                opacity={row.category.id === 'other' ? 0.58 : 0.96}
                stroke="rgba(3,5,7,0.86)"
                strokeWidth={3}
              />
              {angle > 17 ? (
                <text
                  fill={row.category.id === 'social' ? '#071018' : '#071018'}
                  fontFamily={fontStack}
                  fontSize={angle > 42 ? 22 : 16}
                  fontWeight={950}
                  textAnchor="middle"
                  x={labelPoint.x}
                  y={labelPoint.y + 7}
                >
                  {row.category.shortLabel}
                </text>
              ) : null}
            </g>
          );
        })}
        <circle cx={center} cy={center} fill="rgba(4,6,9,0.96)" r={82} />
        <text
          fill="#FFFFFF"
          fontFamily={fontStack}
          fontSize={48}
          fontWeight={950}
          textAnchor="middle"
          x={center}
          y={center - 4}
        >
          24h
        </text>
        <text
          fill="rgba(255,255,255,0.62)"
          fontFamily={fontStack}
          fontSize={18}
          fontWeight={900}
          textAnchor="middle"
          x={center}
          y={center + 30}
        >
          one day
        </text>
      </svg>
    </div>
  );
};

const TimeUseLegendRow = ({ row }: { row: TimeUseFrameRow }) => (
  <div style={styles.legendRow}>
    <div style={{ ...styles.legendRank, color: row.category.color }}>#{row.rank}</div>
    <div style={{ ...styles.legendDot, backgroundColor: row.category.color }} />
    <div style={styles.legendLabel}>{row.category.label}</div>
    <div style={styles.legendValue}>{formatHours(row.hours)}</div>
    <div
      style={{
        ...styles.legendChange,
        color: row.changeFromStart >= 0 ? '#7CFFB2' : '#FF8A70',
      }}
    >
      {formatSignedMinutes(row.changeFromStart)}
    </div>
  </div>
);

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
  ].join(' ');
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

const Footer = () => (
  <DataVideoFooter geometry={frameLayout}>
    <DataVideoFooterSource>{timeUse24hVideoConfig.source}</DataVideoFooterSource>
    <DataVideoFooterNote>
      Note: grouped categories are simplified for video pacing; values are rounded and constrained to 24h.
    </DataVideoFooterNote>
  </DataVideoFooter>
);

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const styles = {
  stage: {
    backgroundColor: '#030507',
  },
  chartFrame: {
    background:
      'linear-gradient(180deg, rgba(9,16,22,0.98), rgba(4,6,9,0.98)), linear-gradient(90deg, rgba(124,255,178,0.08), rgba(110,168,255,0.06))',
    borderColor: 'rgba(255,255,255,0.09)',
  },
  calloutGhost: {
    border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: 999,
    background: 'rgba(2,8,14,0.62)',
    color: 'rgba(255,255,255,0.72)',
    fontFamily: fontStack,
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1,
    padding: '12px 16px',
  },
  callout: {
    alignItems: 'center',
    background: 'rgba(2,8,14,0.72)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 8,
    display: 'flex',
    gap: 12,
    minHeight: 60,
    padding: '10px 14px',
    width: 680,
  },
  calloutDot: {
    borderRadius: 999,
    flex: '0 0 auto',
    height: 18,
    width: 18,
  },
  calloutTitle: {
    fontFamily: fontStack,
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1,
  },
  calloutDetail: {
    color: 'rgba(255,255,255,0.76)',
    fontFamily: fontStack,
    fontSize: 17,
    fontWeight: 780,
    lineHeight: 1.18,
    marginTop: 5,
  },
  dayBlock: {
    left: 40,
    position: 'absolute',
    right: 40,
    top: 34,
  },
  dayHeader: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
  dayTitle: {
    color: '#FFFFFF',
    fontFamily: fontStack,
    fontSize: 28,
    fontWeight: 950,
    letterSpacing: 0,
  },
  dayTotal: {
    border: '1px solid rgba(124,255,178,0.42)',
    borderRadius: 999,
    color: '#7CFFB2',
    fontFamily: fontStack,
    fontSize: 20,
    fontWeight: 950,
    lineHeight: 1,
    padding: '8px 12px',
  },
  daySvg: {
    display: 'block',
    marginTop: 8,
  },
  pieSection: {
    alignItems: 'center',
    display: 'grid',
    gap: 30,
    gridTemplateColumns: '426px 1fr',
    left: 40,
    position: 'absolute',
    right: 40,
    top: 330,
  },
  pieWrap: {
    alignItems: 'center',
    display: 'flex',
    height: 426,
    justifyContent: 'center',
  },
  legendRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  legendRow: {
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.065)',
    display: 'grid',
    gap: 10,
    gridTemplateColumns: '48px 18px 1fr 102px 72px',
    minHeight: 42,
    paddingBottom: 10,
  },
  legendRank: {
    fontFamily: fontStack,
    fontSize: 23,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 1,
    textAlign: 'right',
  },
  legendDot: {
    borderRadius: 999,
    height: 14,
    width: 14,
  },
  legendLabel: {
    color: '#FFFFFF',
    fontFamily: fontStack,
    fontSize: 22,
    fontWeight: 930,
    lineHeight: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  legendValue: {
    color: '#FFFFFF',
    fontFamily: fontStack,
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1,
    textAlign: 'right',
  },
  legendChange: {
    fontFamily: fontStack,
    fontSize: 18,
    fontWeight: 930,
    lineHeight: 1,
    textAlign: 'right',
  },
} satisfies Record<string, CSSProperties>;
