import type { CSSProperties } from 'react';
import { AbsoluteFill, interpolate, spring } from 'remotion';
import {
  SHORTS_PLATFORM_TOP_CLEARANCE,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from './video';

export const SHORTS_INTRO_SECONDS = 3;
export const SHORTS_OUTRO_SECONDS = 2;

export type ShortsAnimationCopy = {
  accentColor?: string;
  channelHandle?: string;
  kicker: string;
  meta?: string;
  secondaryColor?: string;
  subtitle: string;
  title: string;
};

const fontStack =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const introBars = [0.82, 0.56, 0.72, 0.44, 0.66, 0.38, 0.58];
const outroTicks = [0.18, 0.33, 0.47, 0.64, 0.78, 0.9];

export const ShortsIntro = ({
  copy,
  fps,
  frame,
}: {
  copy: ShortsAnimationCopy;
  fps: number;
  frame: number;
}) => {
  const durationFrames = Math.round(SHORTS_INTRO_SECONDS * fps);

  if (frame >= durationFrames) {
    return null;
  }

  const exitStartFrame = Math.max(1, durationFrames - Math.round(0.38 * fps));
  const exitProgress = interpolate(frame, [exitStartFrame, durationFrames - 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 23,
      mass: 0.82,
      stiffness: 126,
    },
  });
  const titleReveal = reveal(frame, Math.round(0.42 * fps), Math.round(0.5 * fps));
  const subtitleReveal = reveal(frame, Math.round(1.16 * fps), Math.round(0.42 * fps));
  const barReveal = reveal(frame, Math.round(1.6 * fps), Math.round(0.48 * fps));
  const sweepProgress = clamp(frame / Math.max(1, durationFrames - 1), 0, 1);
  const opacity = 1 - exitProgress;
  const titleY = interpolate(entrance, [0, 1], [74, 0]);
  const titleScale = interpolate(entrance, [0, 1], [0.93, 1]);
  const headlineSize = titleFontSize(copy.title);
  const accentColor = copy.accentColor ?? '#F5E829';
  const secondaryColor = copy.secondaryColor ?? '#31D07D';

  return (
    <AbsoluteFill style={{ ...styles.overlay, opacity }}>
      <SignalBackground
        accentColor={accentColor}
        progress={sweepProgress}
        secondaryColor={secondaryColor}
      />
      <div style={styles.introFrame}>
        <div style={styles.introTopRow}>
          <div style={{ ...styles.kickerPill, borderColor: accentColor, color: accentColor }}>
            {copy.kicker}
          </div>
          {copy.channelHandle ? (
            <div style={styles.channelHandle}>{copy.channelHandle}</div>
          ) : null}
        </div>
        <div
          style={{
            ...styles.introHero,
            transform: `translateY(${titleY}px) scale(${titleScale})`,
          }}
        >
          {copy.meta ? (
            <div
              style={{
                ...styles.metaLine,
                opacity: reveal(frame, Math.round(0.16 * fps), Math.round(0.34 * fps)),
              }}
            >
              {copy.meta}
            </div>
          ) : null}
          <div
            style={{
              ...styles.introTitle,
              color: accentColor,
              fontSize: headlineSize,
              opacity: titleReveal,
              transform: `translateY(${interpolate(titleReveal, [0, 1], [34, 0])}px)`,
            }}
          >
            {copy.title}
          </div>
          <div
            style={{
              ...styles.introSubtitle,
              opacity: subtitleReveal,
              transform: `translateY(${interpolate(subtitleReveal, [0, 1], [26, 0])}px)`,
            }}
          >
            {copy.subtitle}
          </div>
        </div>
        <div style={{ ...styles.introBars, opacity: barReveal }}>
          {introBars.map((bar, index) => {
            const active = sweepProgress > index / introBars.length;
            const width = interpolate(barReveal, [0, 1], [44, 270 * bar]);

            return (
              <div key={bar} style={styles.introBarRow}>
                <div
                  style={{
                    ...styles.introBarIndex,
                    color: active ? accentColor : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div style={styles.introBarTrack}>
                  <div
                    style={{
                      ...styles.introBarFill,
                      backgroundColor: active ? secondaryColor : 'rgba(255,255,255,0.28)',
                      width,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ShortsOutro = ({
  copy,
  durationInFrames,
  fps,
  frame,
}: {
  copy: ShortsAnimationCopy;
  durationInFrames: number;
  fps: number;
  frame: number;
}) => {
  const outroFrames = Math.round(SHORTS_OUTRO_SECONDS * fps);
  const startFrame = Math.max(0, durationInFrames - outroFrames);
  const localFrame = frame - startFrame;

  if (localFrame < 0) {
    return null;
  }

  const entrance = spring({
    frame: localFrame,
    fps,
    config: {
      damping: 20,
      mass: 0.8,
      stiffness: 148,
    },
  });
  const opacity = interpolate(localFrame, [0, Math.round(0.26 * fps)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const accentColor = copy.accentColor ?? '#F5E829';
  const secondaryColor = copy.secondaryColor ?? '#31D07D';
  const panelY = interpolate(entrance, [0, 1], [88, 0]);
  const panelScale = interpolate(entrance, [0, 1], [0.94, 1]);
  const sweepProgress = clamp(localFrame / Math.max(1, outroFrames - 1), 0, 1);

  return (
    <AbsoluteFill style={{ ...styles.overlay, opacity }}>
      <SignalBackground
        accentColor={accentColor}
        progress={sweepProgress}
        secondaryColor={secondaryColor}
      />
      <div style={styles.outroFrame}>
        <div
          style={{
            ...styles.outroPanel,
            borderColor: colorWithOpacity(accentColor, 0.38),
            transform: `translateY(${panelY}px) scale(${panelScale})`,
          }}
        >
          <div style={{ ...styles.outroKicker, color: accentColor }}>
            {copy.kicker}
          </div>
          <div style={styles.outroTitle}>{copy.title}</div>
          <div style={styles.outroSubtitle}>{copy.subtitle}</div>
          {copy.channelHandle ? (
            <div style={{ ...styles.outroHandle, backgroundColor: accentColor }}>
              {copy.channelHandle}
            </div>
          ) : null}
          <div style={styles.outroTickRail}>
            {outroTicks.map((tick) => (
              <div
                key={tick}
                style={{
                  ...styles.outroTick,
                  backgroundColor: sweepProgress >= tick ? secondaryColor : 'rgba(255,255,255,0.26)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SignalBackground = ({
  accentColor,
  progress,
  secondaryColor,
}: {
  accentColor: string;
  progress: number;
  secondaryColor: string;
}) => {
  const sweepX = interpolate(progress, [0, 1], [88, VIDEO_WIDTH - 88]);

  return (
    <AbsoluteFill style={styles.signalBackground}>
      <svg height={VIDEO_HEIGHT} style={styles.signalSvg} viewBox={`0 0 ${VIDEO_WIDTH} ${VIDEO_HEIGHT}`} width={VIDEO_WIDTH}>
        <rect fill="rgba(0,0,0,0.34)" height={VIDEO_HEIGHT} width={VIDEO_WIDTH} x={0} y={0} />
        <g opacity={0.16}>
          {Array.from({ length: 8 }, (_, index) => {
            const y = 300 + index * 162;

            return (
              <line
                key={`h-${index}`}
                stroke="rgba(255,255,255,0.5)"
                strokeDasharray="10 20"
                strokeWidth={1.4}
                x1={68}
                x2={VIDEO_WIDTH - 68}
                y1={y}
                y2={y}
              />
            );
          })}
          {Array.from({ length: 6 }, (_, index) => {
            const x = 110 + index * 172;

            return (
              <line
                key={`v-${index}`}
                stroke="rgba(255,255,255,0.46)"
                strokeDasharray="8 22"
                strokeWidth={1.2}
                x1={x}
                x2={x}
                y1={228}
                y2={VIDEO_HEIGHT - 276}
              />
            );
          })}
        </g>
        <path
          d="M112 1340 C 240 1194, 348 1284, 470 1048 S 704 862, 856 670 S 970 522, 1002 452"
          fill="none"
          opacity={0.64}
          stroke={secondaryColor}
          strokeLinecap="round"
          strokeWidth={10}
        />
        <path
          d="M112 1340 C 240 1194, 348 1284, 470 1048 S 704 862, 856 670 S 970 522, 1002 452"
          fill="none"
          opacity={0.24}
          stroke={secondaryColor}
          strokeLinecap="round"
          strokeWidth={30}
        />
        <line
          opacity={0.82}
          stroke={accentColor}
          strokeDasharray="8 18"
          strokeLinecap="round"
          strokeWidth={4}
          x1={sweepX}
          x2={sweepX}
          y1={246}
          y2={VIDEO_HEIGHT - 274}
        />
      </svg>
    </AbsoluteFill>
  );
};

const reveal = (frame: number, startFrame: number, durationFrames: number) =>
  easeOutCubic(
    interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

const titleFontSize = (title: string) => {
  if (title.length > 28) {
    return 68;
  }

  if (title.length > 20) {
    return 76;
  }

  return 88;
};

const colorWithOpacity = (hexColor: string, opacity: number) => {
  const normalized = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;

  if (normalized.length !== 6) {
    return hexColor;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${opacity})`;
};

const easeOutCubic = (value: number) => 1 - Math.pow(1 - clamp(value, 0, 1), 3);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const styles = {
  overlay: {
    backgroundColor: '#020604',
    color: '#FFFFFF',
    fontFamily: fontStack,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 1000,
  },
  signalBackground: {
    backgroundColor: '#020604',
    backgroundImage:
      'linear-gradient(180deg, rgba(1,8,7,0.98) 0%, rgba(3,16,13,0.95) 48%, rgba(0,0,0,0.98) 100%)',
  },
  signalSvg: {
    height: VIDEO_HEIGHT,
    left: 0,
    position: 'absolute',
    top: 0,
    width: VIDEO_WIDTH,
  },
  introFrame: {
    height: '100%',
    padding: `${138 + SHORTS_PLATFORM_TOP_CLEARANCE}px 84px 132px`,
    position: 'relative',
    width: '100%',
    zIndex: 1,
  },
  introTopRow: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  },
  kickerPill: {
    border: '2px solid',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
    padding: '14px 18px 12px',
  },
  channelHandle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 27,
    fontWeight: 900,
    letterSpacing: 0,
  },
  introHero: {
    marginTop: 298,
    maxWidth: 890,
  },
  metaLine: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 31,
    fontVariant: 'tabular-nums',
    fontWeight: 900,
    letterSpacing: 0,
    marginBottom: 22,
  },
  introTitle: {
    fontWeight: 1000,
    letterSpacing: 0,
    lineHeight: 0.96,
    maxWidth: 900,
    textShadow: '0 18px 38px rgba(0,0,0,0.45)',
  },
  introSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 34,
    fontWeight: 850,
    letterSpacing: 0,
    lineHeight: 1.18,
    marginTop: 30,
    maxWidth: 812,
  },
  introBars: {
    bottom: 190,
    left: 84,
    position: 'absolute',
    width: 430,
  },
  introBarRow: {
    alignItems: 'center',
    display: 'flex',
    height: 36,
    marginBottom: 14,
  },
  introBarIndex: {
    fontSize: 19,
    fontVariant: 'tabular-nums',
    fontWeight: 950,
    letterSpacing: 0,
    marginRight: 18,
    width: 30,
  },
  introBarTrack: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 6,
    height: 16,
    overflow: 'hidden',
    width: 286,
  },
  introBarFill: {
    borderRadius: 6,
    height: '100%',
  },
  outroFrame: {
    alignItems: 'flex-end',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    padding: `0 78px ${180}px`,
    position: 'relative',
    width: '100%',
    zIndex: 1,
  },
  outroPanel: {
    alignItems: 'center',
    backgroundColor: 'rgba(2,8,6,0.92)',
    border: '2px solid',
    borderRadius: 8,
    boxShadow: '0 30px 80px rgba(0,0,0,0.48)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 420,
    padding: '54px 54px 46px',
    width: '100%',
  },
  outroKicker: {
    fontSize: 25,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
  },
  outroTitle: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: 1000,
    letterSpacing: 0,
    lineHeight: 0.96,
    marginTop: 20,
    textAlign: 'center',
  },
  outroSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 31,
    fontWeight: 850,
    letterSpacing: 0,
    lineHeight: 1.16,
    marginTop: 20,
    maxWidth: 720,
    textAlign: 'center',
  },
  outroHandle: {
    borderRadius: 8,
    color: '#061006',
    fontSize: 34,
    fontWeight: 1000,
    letterSpacing: 0,
    lineHeight: 1,
    marginTop: 34,
    padding: '18px 26px 16px',
  },
  outroTickRail: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    marginTop: 36,
    width: '100%',
  },
  outroTick: {
    borderRadius: 5,
    height: 10,
    width: 72,
  },
} satisfies Record<string, CSSProperties>;
