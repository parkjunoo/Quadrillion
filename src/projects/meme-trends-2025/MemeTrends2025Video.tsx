import type { CSSProperties } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
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
import { memeTrends2025VideoConfig } from './config';
import { maxKymVoteShare, memeTrendMonths2025, type MemeCandidate, type MemeMonth } from './data';

const fontStack = dataVideoFontStack;
const accentColor = '#31E7FF';
const hotColor = '#FF4FD8';
const channelHandle = '@whoa-data';
const templateTopOffset = SHORTS_PLATFORM_TOP_CLEARANCE;
const frameLayout = createDataVideoFrameGeometry({
  chartHeight: 985,
  chartTop: 515 + templateTopOffset,
  footerTop: 1584,
  frameInset: {
    left: 76,
    right: 76,
  },
  headerTop: 136 + templateTopOffset,
  timelineRailTop: 326 + templateTopOffset,
});
const chart = frameLayout.chart;

export const MemeTrends2025Video = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const startHoldFrames = Math.round(memeTrends2025VideoConfig.startHoldSeconds * fps);
  const endHoldFrames = Math.round(memeTrends2025VideoConfig.endHoldSeconds * fps);
  const motionFrames = Math.max(1, durationInFrames - startHoldFrames - endHoldFrames);
  const monthFrame = clamp(frame - startHoldFrames, 0, motionFrames - 1);
  const rawMonthIndex = (monthFrame / motionFrames) * memeTrendMonths2025.length;
  const activeIndex = clamp(Math.floor(rawMonthIndex), 0, memeTrendMonths2025.length - 1);
  const localProgress = rawMonthIndex - activeIndex;
  const month = memeTrendMonths2025[activeIndex];
  const intro = interpolate(frame, [0, 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const monthFade = interpolate(localProgress, [0, 0.08, 0.9, 1], [0.45, 1, 1, 0.45], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <DataVideoFrameLayout style={styles.stage}>
      <DataVideoBackground chart={chart} />
      <DataVideoHeader
        accentColor={accentColor}
        geometry={frameLayout}
        intro={intro}
        subtitle={memeTrends2025VideoConfig.subtitle}
        title={memeTrends2025VideoConfig.title}
        titleHook={memeTrends2025VideoConfig.titleHook}
      />
      <DataVideoTimelineRail
        accentColor={accentColor}
        currentLabel={month.label}
        geometry={frameLayout}
        intro={intro}
        maxLabel="DEC"
        minLabel="JAN"
        progress={(activeIndex + localProgress) / memeTrendMonths2025.length}
      />
      <DataVideoChartTopBar chart={chart} intro={intro}>
        <MonthPill month={month} />
        <DataVideoChannelTag>{channelHandle}</DataVideoChannelTag>
      </DataVideoChartTopBar>
      <DataVideoChartFrame chart={chart} intro={intro} style={styles.chartFrame}>
        <div style={{ ...styles.content, opacity: monthFade }}>
          <HeroWireframe month={month} localProgress={localProgress} />
          <BarChart candidates={month.candidates} localProgress={localProgress} />
        </div>
      </DataVideoChartFrame>
      <Footer />
    </DataVideoFrameLayout>
  );
};

const MonthPill = ({ month }: { month: MemeMonth }) => (
  <div style={styles.monthPill}>
    <span style={styles.monthPillLabel}>NOW SHOWING</span>
    <span style={styles.monthPillValue}>{month.monthName} 2025</span>
  </div>
);

const HeroWireframe = ({
  localProgress,
  month,
}: {
  localProgress: number;
  month: MemeMonth;
}) => {
  const pulse = interpolate(localProgress, [0, 0.22, 1], [0.72, 1, 0.86], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <section style={styles.heroSection}>
      <div style={styles.heroMetaRow}>
        <div style={styles.rankBadge}>#1</div>
        <div>
          <div style={styles.heroEyebrow}>TOP COMMUNITY PICK</div>
          <div style={styles.heroTitle}>{month.hero.name}</div>
        </div>
      </div>
      <div style={styles.videoWireframe}>
        <div style={styles.wireframeGrid} />
        <div style={{ ...styles.playButton, transform: `translate(-50%, -50%) scale(${pulse})` }}>
          <div style={styles.playTriangle} />
        </div>
        <div style={styles.videoLabel}>VIDEO SLOT</div>
        <div style={styles.videoSearch}>{month.hero.videoSearchQuery}</div>
        <div style={styles.videoTimeline}>
          <div
            style={{
              ...styles.videoTimelineFill,
              width: `${Math.round(clamp(localProgress, 0, 1) * 100)}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
};

const BarChart = ({
  candidates,
  localProgress,
}: {
  candidates: MemeCandidate[];
  localProgress: number;
}) => {
  const maxMonthValue = Math.max(...candidates.map((candidate) => candidate.kymVoteShare ?? 0), 1);

  return (
    <section style={styles.barSection}>
      <div style={styles.barHeader}>
        <div>
          <div style={styles.barEyebrow}>LOWER BAR CHART</div>
          <div style={styles.barTitle}>KYM poll share by candidate</div>
        </div>
        <div style={styles.trendsBadge}>Google Trends: retry pending</div>
      </div>
      <div style={styles.rows}>
        {candidates.map((candidate, index) => (
          <BarRow
            candidate={candidate}
            index={index}
            key={`${candidate.communityRank}-${candidate.name}`}
            localProgress={localProgress}
            maxMonthValue={maxMonthValue}
          />
        ))}
      </div>
    </section>
  );
};

const BarRow = ({
  candidate,
  index,
  localProgress,
  maxMonthValue,
}: {
  candidate: MemeCandidate;
  index: number;
  localProgress: number;
  maxMonthValue: number;
}) => {
  const value = candidate.kymVoteShare ?? 0;
  const rowIntro = interpolate(localProgress, [0.03 + index * 0.035, 0.22 + index * 0.035], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const width = interpolate(rowIntro, [0, 1], [0, (value / maxMonthValue) * 100]);
  const globalWidth = interpolate(rowIntro, [0, 1], [0, (value / maxKymVoteShare) * 100]);
  const color = index === 0 ? hotColor : index === 1 ? '#7CFFB2' : index === 2 ? '#FFD166' : '#9DB4FF';

  return (
    <div style={{ ...styles.row, opacity: interpolate(rowIntro, [0, 1], [0.2, 1]) }}>
      <div style={styles.rowTop}>
        <div style={styles.rowNameGroup}>
          <span style={{ ...styles.rowRank, borderColor: color, color }}>#{candidate.communityRank}</span>
          <span style={styles.rowName}>{candidate.name}</span>
        </div>
        <span style={styles.rowValue}>{candidate.kymVoteShare === null ? 'TBD' : `${candidate.kymVoteShare}%`}</span>
      </div>
      <div style={styles.barTrack}>
        <div style={{ ...styles.globalGhostBar, width: `${globalWidth}%` }} />
        <div
          style={{
            ...styles.barFill,
            background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.9))`,
            width: `${width}%`,
          }}
        />
      </div>
    </div>
  );
};

const Footer = () => (
  <DataVideoFooter geometry={frameLayout}>
    <DataVideoFooterSource>{memeTrends2025VideoConfig.source}</DataVideoFooterSource>
    <DataVideoFooterNote>
      Wireframe pass: replace the hero slot with sourced meme clips after rights and platform checks.
    </DataVideoFooterNote>
  </DataVideoFooter>
);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const styles = {
  stage: {
    backgroundColor: '#03040A',
  },
  chartFrame: {
    background:
      'linear-gradient(180deg, rgba(7,13,26,0.98) 0%, rgba(12,12,22,0.98) 50%, rgba(5,7,14,0.98) 100%)',
    border: '2px solid rgba(49,231,255,0.28)',
    boxShadow: '0 26px 70px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.06)',
  },
  content: {
    display: 'grid',
    gridTemplateRows: '500px 1fr',
    height: '100%',
    padding: 30,
    rowGap: 24,
  },
  monthPill: {
    alignItems: 'center',
    background: 'rgba(49,231,255,0.11)',
    border: '1px solid rgba(49,231,255,0.34)',
    display: 'flex',
    gap: 14,
    padding: '10px 14px',
  },
  monthPillLabel: {
    color: 'rgba(255,255,255,0.58)',
    fontFamily: fontStack,
    fontSize: 17,
    fontWeight: 900,
  },
  monthPillValue: {
    color: '#FFFFFF',
    fontFamily: fontStack,
    fontSize: 23,
    fontWeight: 950,
  },
  heroSection: {
    minHeight: 0,
  },
  heroMetaRow: {
    alignItems: 'center',
    display: 'flex',
    gap: 18,
    height: 96,
  },
  rankBadge: {
    alignItems: 'center',
    background: hotColor,
    color: '#07020A',
    display: 'flex',
    flex: '0 0 auto',
    fontFamily: fontStack,
    fontSize: 42,
    fontWeight: 950,
    height: 70,
    justifyContent: 'center',
    width: 86,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: fontStack,
    fontSize: 19,
    fontWeight: 950,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: fontStack,
    fontSize: 44,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
    marginTop: 5,
  },
  videoWireframe: {
    background:
      'linear-gradient(135deg, rgba(49,231,255,0.09), rgba(255,79,216,0.10)), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
    border: '2px dashed rgba(255,255,255,0.35)',
    height: 404,
    overflow: 'hidden',
    position: 'relative',
  },
  wireframeGrid: {
    backgroundImage:
      'linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
    backgroundSize: '54px 54px',
    inset: 0,
    opacity: 0.72,
    position: 'absolute',
  },
  playButton: {
    alignItems: 'center',
    background: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    display: 'flex',
    height: 122,
    justifyContent: 'center',
    left: '50%',
    position: 'absolute',
    top: '48%',
    width: 122,
  },
  playTriangle: {
    borderBottom: '24px solid transparent',
    borderLeft: '38px solid #050713',
    borderTop: '24px solid transparent',
    height: 0,
    marginLeft: 8,
    width: 0,
  },
  videoLabel: {
    color: 'rgba(255,255,255,0.64)',
    fontFamily: fontStack,
    fontSize: 24,
    fontWeight: 950,
    left: 24,
    position: 'absolute',
    top: 22,
  },
  videoSearch: {
    bottom: 54,
    color: '#FFFFFF',
    fontFamily: fontStack,
    fontSize: 24,
    fontWeight: 850,
    left: 24,
    lineHeight: 1.15,
    position: 'absolute',
    right: 24,
  },
  videoTimeline: {
    background: 'rgba(255,255,255,0.16)',
    bottom: 24,
    height: 9,
    left: 24,
    position: 'absolute',
    right: 24,
  },
  videoTimelineFill: {
    background: `linear-gradient(90deg, ${accentColor}, ${hotColor})`,
    height: '100%',
  },
  barSection: {
    minHeight: 0,
  },
  barHeader: {
    alignItems: 'flex-end',
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  barEyebrow: {
    color: 'rgba(255,255,255,0.52)',
    fontFamily: fontStack,
    fontSize: 18,
    fontWeight: 950,
  },
  barTitle: {
    color: '#FFFFFF',
    fontFamily: fontStack,
    fontSize: 29,
    fontWeight: 950,
    marginTop: 4,
  },
  trendsBadge: {
    background: 'rgba(255,209,102,0.12)',
    border: '1px solid rgba(255,209,102,0.42)',
    color: '#FFD166',
    fontFamily: fontStack,
    fontSize: 18,
    fontWeight: 900,
    padding: '9px 12px',
  },
  rows: {
    display: 'grid',
    gap: 12,
  },
  row: {
    minHeight: 68,
  },
  rowTop: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  rowNameGroup: {
    alignItems: 'center',
    display: 'flex',
    gap: 12,
    minWidth: 0,
  },
  rowRank: {
    border: '2px solid currentColor',
    flex: '0 0 auto',
    fontFamily: fontStack,
    fontSize: 19,
    fontWeight: 950,
    padding: '5px 8px',
  },
  rowName: {
    color: '#FFFFFF',
    fontFamily: fontStack,
    fontSize: 25,
    fontWeight: 920,
    lineHeight: 1.05,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rowValue: {
    color: 'rgba(255,255,255,0.86)',
    flex: '0 0 auto',
    fontFamily: fontStack,
    fontSize: 24,
    fontWeight: 950,
    marginLeft: 18,
  },
  barTrack: {
    background: 'rgba(255,255,255,0.09)',
    height: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  globalGhostBar: {
    background: 'rgba(255,255,255,0.11)',
    height: '100%',
    position: 'absolute',
  },
  barFill: {
    height: '100%',
    position: 'absolute',
  },
} satisfies Record<string, CSSProperties>;
