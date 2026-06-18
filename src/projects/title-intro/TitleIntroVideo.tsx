import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  SHORTS_PLATFORM_TOP_CLEARANCE,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from '../../shared/video';
import { titleIntroConfig } from './config';

const fontStack =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const templateTopOffset = SHORTS_PLATFORM_TOP_CLEARANCE;
const header = {
  left: 112,
  top: 166 + templateTopOffset,
  right: 70,
};
const titleFontSize = 68;

export const TitleIntroVideo = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const holdFrames = Math.round(fps);
  const moveProgress = easeOutCubic(
    interpolate(frame, [holdFrames, durationInFrames - 1], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const templateReveal = interpolate(moveProgress, [0.18, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleWidth = estimateTitleWidth(titleIntroConfig.title, titleFontSize);
  const startScale = 1.34;
  const startX = (VIDEO_WIDTH - titleWidth * startScale) / 2 - header.left;
  const startY = VIDEO_HEIGHT * 0.47 - (titleFontSize * 0.94 * startScale) / 2 - header.top;
  const titleX = interpolate(moveProgress, [0, 1], [startX, 0]);
  const titleY = interpolate(moveProgress, [0, 1], [startY, 0]);
  const titleScale = interpolate(moveProgress, [0, 1], [startScale, 1]);
  const titleTransform = `translate(${titleX}px, ${titleY}px) scale(${titleScale})`;
  const tagWidth = estimateNameTagWidth(titleIntroConfig.nameTag);
  const tagFinalX = header.left + titleWidth + 22;
  const tagFinalY = header.top + 11;
  const tagStartX = header.left + startX + titleWidth * startScale - tagWidth * 1.12;
  const tagStartY = header.top + startY + titleFontSize * startScale + 38;
  const tagX = interpolate(moveProgress, [0, 1], [tagStartX, tagFinalX]);
  const tagY = interpolate(moveProgress, [0, 1], [tagStartY, tagFinalY]);
  const tagScale = interpolate(moveProgress, [0, 1], [1.12, 1]);

  return (
    <AbsoluteFill style={styles.stage}>
      <SubjectPhotoBackground frame={frame} holdFrames={holdFrames} moveProgress={moveProgress} />
      <TemplatePlate progress={templateReveal} />
      <PremiumIntroLayer
        frame={frame}
        holdFrames={holdFrames}
        titleScale={titleScale}
        titleWidth={titleWidth}
        titleX={titleX}
        titleY={titleY}
      />
      <div
        style={{
          ...styles.titleGroup,
          width: titleWidth,
          transform: titleTransform,
        }}
      >
        <div style={styles.title}>{titleIntroConfig.title}</div>
        <div style={styles.introSubtitle}>{titleIntroConfig.bottomSubtitle}</div>
      </div>
      <div
        style={{
          ...styles.nameTag,
          transform: `translate(${tagX}px, ${tagY}px) scale(${tagScale})`,
        }}
      >
        {titleIntroConfig.nameTag}
      </div>
      <div
        style={{
          ...styles.headerDetails,
          opacity: interpolate(moveProgress, [0.9, 1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          transform: `translateY(${interpolate(moveProgress, [0.9, 1], [12, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })}px)`,
        }}
      >
        <div style={styles.subtitle}>{titleIntroConfig.subtitle}</div>
      </div>
    </AbsoluteFill>
  );
};

const SubjectPhotoBackground = ({
  frame,
  holdFrames,
  moveProgress,
}: {
  frame: number;
  holdFrames: number;
  moveProgress: number;
}) => {
  const photoOpacity = interpolate(frame, [0, 14, holdFrames, holdFrames + 24], [0, 0.36, 0.32, 0.04], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const photoScale = interpolate(frame, [0, holdFrames + 24], [1.08, 1.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const photoY = interpolate(frame, [0, holdFrames + 24], [28, -18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={styles.subjectPhotoLayer}>
      <Img
        src={staticFile(titleIntroConfig.backgroundImage)}
        style={{
          ...styles.subjectPhoto,
          opacity: photoOpacity,
          transform: `translateY(${photoY}px) scale(${photoScale})`,
        }}
      />
      <div style={styles.photoDarkener} />
      <div
        style={{
          ...styles.photoTitleScrim,
          opacity: interpolate(moveProgress, [0, 1], [1, 0.18], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />
    </AbsoluteFill>
  );
};

const PremiumIntroLayer = ({
  frame,
  holdFrames,
  titleScale,
  titleWidth,
  titleX,
  titleY,
}: {
  frame: number;
  holdFrames: number;
  titleScale: number;
  titleWidth: number;
  titleX: number;
  titleY: number;
}) => {
  if (frame >= holdFrames) {
    return null;
  }

  const progress = frame / Math.max(1, holdFrames - 1);
  const fade = interpolate(progress, [0, 0.08, 0.9, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const layerLeft = header.left + titleX;
  const layerTop = header.top + titleY;
  const titlePixelWidth = titleWidth * titleScale;
  const titlePixelHeight = titleFontSize * titleScale;

  return (
    <div style={{ ...styles.premiumIntroLayer, opacity: fade }}>
      <div
        style={{
          ...styles.premiumBackdrop,
          height: titlePixelHeight * 4.4,
          left: layerLeft - 150,
          top: layerTop - titlePixelHeight * 1.62,
          width: titlePixelWidth + 300,
        }}
      />
    </div>
  );
};

const TemplatePlate = ({ progress }: { progress: number }) => {
  const chartOpacity = interpolate(progress, [0.28, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ ...styles.templatePlate, opacity: progress }}>
      <div style={styles.gridLines} />
      <div style={styles.topShadow} />
      <div style={{ ...styles.yearRailBlock, opacity: chartOpacity }}>
        <div style={styles.currentYear}>2026</div>
        <svg height={58} style={styles.yearRailSvg} viewBox="0 0 842 58" width={842}>
          <line
            stroke="rgba(255,255,255,0.2)"
            strokeLinecap="round"
            strokeWidth={6}
            x1={0}
            x2={842}
            y1={19}
            y2={19}
          />
          <line
            stroke="#F5E829"
            strokeLinecap="round"
            strokeWidth={6}
            x1={0}
            x2={636}
            y1={19}
            y2={19}
          />
          <text fill="rgba(255,255,255,0.52)" fontFamily={fontStack} fontSize={24} fontWeight={850} x={0} y={51}>
            2005
          </text>
          <text
            fill="rgba(255,255,255,0.52)"
            fontFamily={fontStack}
            fontSize={24}
            fontWeight={850}
            textAnchor="end"
            x={842}
            y={51}
          >
            2026
          </text>
        </svg>
      </div>
      <div style={{ ...styles.chartGhost, opacity: chartOpacity }}>
        {chartRows.map((row, index) => (
          <div key={row.width} style={styles.chartRow}>
            <div style={styles.rank}>{index + 1}</div>
            <div style={{ ...styles.rowBar, backgroundColor: row.color, width: row.width }} />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const chartRows = [
  { color: '#8745E3', width: 720 },
  { color: '#E37F45', width: 662 },
  { color: '#455AE3', width: 612 },
  { color: '#77C8FF', width: 556 },
  { color: '#B1E345', width: 492 },
  { color: '#34D399', width: 428 },
];

const estimateTitleWidth = (title: string, fontSize: number) => title.length * fontSize * 0.5;

const estimateNameTagWidth = (nameTag: string) => nameTag.length * 16 + 42;

const easeOutCubic = (value: number) => {
  const clamped = clamp(value, 0, 1);

  return 1 - Math.pow(1 - clamped, 3);
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const styles = {
  stage: {
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontFamily: fontStack,
    overflow: 'hidden',
  },
  templatePlate: {
    backgroundColor: '#020604',
    backgroundImage: 'linear-gradient(180deg, #020604 0%, #03120E 52%, #000000 100%)',
  },
  subjectPhotoLayer: {
    backgroundColor: '#000000',
    inset: 0,
    overflow: 'hidden',
    position: 'absolute',
  },
  subjectPhoto: {
    height: '100%',
    objectFit: 'cover',
    objectPosition: '50% 52%',
    position: 'absolute',
    width: '100%',
    filter: 'saturate(0.88) contrast(1.18) brightness(0.76)',
  },
  photoDarkener: {
    background:
      'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 36%, rgba(0,0,0,0.66) 72%, rgba(0,0,0,0.95) 100%)',
    inset: 0,
    position: 'absolute',
  },
  photoTitleScrim: {
    background:
      'radial-gradient(ellipse at 50% 49%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.22) 34%, rgba(0,0,0,0.86) 76%)',
    inset: 0,
    position: 'absolute',
  },
  gridLines: {
    backgroundImage:
      'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.024) 1px, transparent 1px)',
    backgroundSize: '92px 92px',
    inset: 0,
    opacity: 0.36,
    position: 'absolute',
  },
  topShadow: {
    background:
      'linear-gradient(180deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.1) 34%, rgba(0,0,0,0.78) 100%)',
    inset: 0,
    position: 'absolute',
  },
  titleGroup: {
    left: header.left,
    position: 'absolute',
    top: header.top,
    transformOrigin: '0 0',
    zIndex: 5,
  },
  title: {
    color: '#F5E829',
    fontSize: titleFontSize,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 0.94,
    whiteSpace: 'nowrap',
  },
  introSubtitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1.1,
    marginTop: 16,
    whiteSpace: 'nowrap',
  },
  premiumIntroLayer: {
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 3,
  },
  premiumBackdrop: {
    background:
      'radial-gradient(ellipse at 50% 50%, rgba(245,232,41,0.16) 0%, rgba(245,232,41,0.07) 27%, rgba(0,0,0,0) 68%)',
    filter: 'blur(8px)',
    position: 'absolute',
  },
  headerDetails: {
    left: header.left,
    position: 'absolute',
    right: header.right,
    top: header.top + 118,
    zIndex: 4,
  },
  nameTag: {
    background: 'rgba(2,8,6,0.48)',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 999,
    boxShadow: '0 14px 34px rgba(0,0,0,0.26)',
    color: 'rgba(255,255,255,0.78)',
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1,
    padding: '8px 13px',
    position: 'absolute',
    transformOrigin: '0 0',
    zIndex: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 23,
    fontWeight: 800,
    letterSpacing: 0,
    lineHeight: 1.22,
    marginTop: 8,
  },
  yearRailBlock: {
    left: 118,
    position: 'absolute',
    top: 332 + templateTopOffset,
    width: 842,
    zIndex: 2,
  },
  currentYear: {
    color: '#FFFFFF',
    fontSize: 62,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
    marginBottom: 10,
  },
  yearRailSvg: {
    display: 'block',
  },
  chartGhost: {
    left: 58,
    position: 'absolute',
    top: 535 + templateTopOffset,
    width: 965,
    zIndex: 1,
  },
  chartRow: {
    alignItems: 'center',
    display: 'flex',
    height: 74,
    marginBottom: 18,
  },
  rank: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 32,
    fontVariant: 'tabular-nums',
    fontWeight: 950,
    textAlign: 'center',
    width: 46,
  },
  rowBar: {
    borderRadius: 8,
    boxShadow: '0 16px 34px rgba(0,0,0,0.28)',
    height: 66,
    opacity: 0.42,
  },
} satisfies Record<string, CSSProperties>;
