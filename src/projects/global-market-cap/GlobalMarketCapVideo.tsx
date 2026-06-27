import { type CSSProperties } from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  buildMarketCapRaceData,
  getMarketCapFrameState,
  type MarketCapFrameRow,
  type MarketCapFrameState,
} from './marketCapRace';
import { globalMarketCapVideoConfig } from './config';
import { VIDEO_WIDTH } from '../../shared/video';
import {
  defaultDataShortsFooterInset,
  defaultDataShortsFrameInset,
  defaultDataShortsTemplate,
} from '../../shared/dataVideoFrame';
import { introVoiceoverAsset } from './generated/introVoiceoverAsset';

const raceData = buildMarketCapRaceData(globalMarketCapVideoConfig.csv);
const fontStack =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const channelHandle = '@whoa-data';
const hookQuestion = 'where’s NVIDIA?';
const introBlackSeconds = 1;
const titleMoveSeconds = 0.8;
const postTitleHoldSeconds = 0.5;
const appleBoxDrawSeconds = 0.7;
const appleBoxHoldSeconds = 1;
const appleBoxFadeSeconds = 0.35;
const appleFocusSeconds = appleBoxDrawSeconds + appleBoxHoldSeconds + appleBoxFadeSeconds;
const raceStartDelaySeconds = introBlackSeconds + titleMoveSeconds + postTitleHoldSeconds + appleFocusSeconds;
const nvidiaFocusYear = 2023;
const nvidiaFocusSegmentProgress = 0.08;
const nvidiaBoxDrawSeconds = 0.3;
const nvidiaFocusHoldSeconds = 1.5;
const nvidiaFocusFadeSeconds = 0.25;
const nvidiaFocusSeconds = nvidiaBoxDrawSeconds + nvidiaFocusHoldSeconds + nvidiaFocusFadeSeconds;
const finalWaitSeconds = 0.5;
const chart = {
  left: defaultDataShortsTemplate.chartLeft,
  top: defaultDataShortsTemplate.chartTop,
  width: defaultDataShortsTemplate.chartWidth,
  height: defaultDataShortsTemplate.chartHeight,
};
const visibleChart = {
  left: defaultDataShortsFrameInset.left,
  right: defaultDataShortsFrameInset.right,
};
const yearRail = {
  left: visibleChart.left + defaultDataShortsTemplate.timelineRailLeftPadding,
  top: defaultDataShortsTemplate.timelineRailTop,
  width: VIDEO_WIDTH -
    visibleChart.left -
    visibleChart.right -
    defaultDataShortsTemplate.timelineRailLeftPadding -
    defaultDataShortsTemplate.timelineRailRightPadding,
};
const row = {
  height: 106,
  gap: 16,
};
const rankColumnWidth = 52;
const barLeft = 72;
const valueWidth = 178;
const valueRight = chart.width - defaultDataShortsTemplate.chartRightPadding + 52;
const valueLeft = valueRight - valueWidth;
const barValueOverlap = 8;
const barMaxWidth = valueLeft - barLeft + barValueOverlap;
const barHeight = 96;
const logoSize = 66;
const storyCompanies = new Set(['Apple', 'NVIDIA']);

export const GlobalMarketCapVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const raceStartFrame = Math.round(raceStartDelaySeconds * fps);
  const finalWaitFrames = Math.round(finalWaitSeconds * fps);
  const finalSpotlightFrames = Math.round(globalMarketCapVideoConfig.endHoldSeconds * fps);
  const nvidiaFocusFrames = Math.round(nvidiaFocusSeconds * fps);
  const motionFrames = Math.max(
    1,
    durationInFrames - raceStartFrame - nvidiaFocusFrames - finalWaitFrames - finalSpotlightFrames,
  );
  const nvidiaFocusRaceFrame = frameForYearProgress({
    motionFrames,
    segmentProgress: nvidiaFocusSegmentProgress,
    year: nvidiaFocusYear,
  });
  const rawRaceFrame = frame - raceStartFrame;
  const pausedRaceFrame = rawRaceFrame < nvidiaFocusRaceFrame
    ? rawRaceFrame
    : rawRaceFrame < nvidiaFocusRaceFrame + nvidiaFocusFrames
      ? nvidiaFocusRaceFrame
      : rawRaceFrame - nvidiaFocusFrames;
  const raceFrame = clamp(pausedRaceFrame, 0, motionFrames - 1);
  const nvidiaFocusStartFrame = raceStartFrame + nvidiaFocusRaceFrame;
  const nvidiaFocusEndFrame = nvidiaFocusStartFrame + nvidiaFocusFrames;
  const finalSpotlightStartFrame = raceStartFrame + nvidiaFocusFrames + motionFrames + finalWaitFrames;
  const finalSpotlightProgress = interpolate(
    frame,
    [finalSpotlightStartFrame, finalSpotlightStartFrame + Math.round(0.34 * fps)],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const finalNameTagWiggleProgress = interpolate(
    frame,
    [finalSpotlightStartFrame, finalSpotlightStartFrame + finalSpotlightFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const finalNvidiaReleaseProgress = interpolate(
    frame,
    [durationInFrames - Math.round(0.5 * fps), durationInFrames - 1],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const state = getMarketCapFrameState({
    data: raceData,
    durationInFrames: motionFrames,
    frame: raceFrame,
    topN: globalMarketCapVideoConfig.topN,
  });
  const chartIntro = interpolate(
    frame,
    [Math.round(introBlackSeconds * fps), Math.round((introBlackSeconds + 0.42) * fps)],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const headerIntro = interpolate(
    frame,
    [Math.round((introBlackSeconds + 0.2) * fps), Math.round((introBlackSeconds + titleMoveSeconds) * fps)],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const titleHookOpacity = interpolate(
    frame,
    [Math.round((introBlackSeconds + titleMoveSeconds - 0.08) * fps), Math.round((introBlackSeconds + titleMoveSeconds + 0.12) * fps)],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const pageBrightness = interpolate(frame, [raceStartFrame - Math.round(0.28 * fps), raceStartFrame], [0.72, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={styles.stage}>
      {introVoiceoverAsset ? (
        <Audio
          src={staticFile(introVoiceoverAsset.path)}
          volume={globalMarketCapVideoConfig.introVoiceoverVolume}
        />
      ) : null}
      <div style={{ ...styles.videoContent, filter: `brightness(${pageBrightness})` }}>
        <Background finalSpotlightProgress={finalSpotlightProgress} />
        <Header frame={frame} fps={fps} intro={headerIntro} titleHookOpacity={titleHookOpacity} />
        <YearRail
          currentYear={state.year}
          intro={chartIntro}
          nameTagWiggleProgress={finalNameTagWiggleProgress}
          progress={state.yearProgress}
        />
        <RaceBeatLegend intro={chartIntro} state={state} />
        <BarRaceChart
          finalNvidiaReleaseProgress={finalNvidiaReleaseProgress}
          finalSpotlightProgress={finalSpotlightProgress}
          intro={chartIntro}
          state={state}
        />
        <Footer />
      </div>
      <AppleRowFocusOverlay fps={fps} frame={frame} state={state} />
      <NvidiaRowFocusOverlay
        endFrame={nvidiaFocusEndFrame}
        fps={fps}
        frame={frame}
        startFrame={nvidiaFocusStartFrame}
        state={state}
      />
      <HookIntroOverlay fps={fps} frame={frame} />
    </AbsoluteFill>
  );
};

const Header = ({
  frame,
  fps,
  intro,
  titleHookOpacity,
}: {
  frame: number;
  fps: number;
  intro: number;
  titleHookOpacity: number;
}) => {
  const y = interpolate(intro, [0, 1], [-28, 0]);
  const subtitleOpacity = interpolate(
    frame,
    [Math.round((introBlackSeconds + titleMoveSeconds + 0.02) * fps), Math.round((introBlackSeconds + titleMoveSeconds + 0.26) * fps)],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  return (
    <div style={{ ...styles.header, opacity: intro, transform: `translateY(${y}px)` }}>
      <div style={{ ...styles.titleHook, opacity: titleHookOpacity }}>
        {globalMarketCapVideoConfig.titleHook}
      </div>
      <div style={styles.title}>{globalMarketCapVideoConfig.title}</div>
      <div style={{ ...styles.subtitle, opacity: subtitleOpacity }}>
        {globalMarketCapVideoConfig.subtitle}
      </div>
    </div>
  );
};

const YearRail = ({
  currentYear,
  intro,
  nameTagWiggleProgress,
  progress,
}: {
  currentYear: number;
  intro: number;
  nameTagWiggleProgress: number;
  progress: number;
}) => {
  const fillWidth = clamp(progress, 0, 1) * yearRail.width;
  const wiggleEnvelope = nameTagWiggleProgress <= 0 ? 0 : Math.sin(Math.PI * nameTagWiggleProgress);
  const wiggleAngle = Math.sin(nameTagWiggleProgress * Math.PI * 13) * 4.2 * wiggleEnvelope;
  const wiggleX = Math.sin(nameTagWiggleProgress * Math.PI * 13 + 0.7) * 2.2 * wiggleEnvelope;

  return (
    <div style={{ ...styles.yearRailBlock, opacity: intro }}>
      <div style={styles.yearRailHeader}>
        <div style={styles.currentYear}>{currentYear}</div>
        <div
          style={{
            ...styles.yearRailTag,
            transform: `translateX(${wiggleX}px) rotate(${wiggleAngle}deg)`,
          }}
        >
          {channelHandle}
        </div>
      </div>
      <svg height={58} style={styles.yearRailSvg} viewBox={`0 0 ${yearRail.width} 58`} width={yearRail.width}>
        <line
          stroke="rgba(255,255,255,0.2)"
          strokeLinecap="round"
          strokeWidth={6}
          x1={0}
          x2={yearRail.width}
          y1={19}
          y2={19}
        />
        <line
          stroke="#F5E829"
          strokeLinecap="round"
          strokeWidth={6}
          x1={0}
          x2={fillWidth}
          y1={19}
          y2={19}
        />
        <text fill="rgba(255,255,255,0.52)" fontFamily={fontStack} fontSize={24} fontWeight={850} x={0} y={51}>
          {raceData.minYear}
        </text>
        <text
          fill="rgba(255,255,255,0.52)"
          fontFamily={fontStack}
          fontSize={24}
          fontWeight={850}
          textAnchor="end"
          x={yearRail.width}
          y={51}
        >
          {raceData.maxYear}
        </text>
      </svg>
    </div>
  );
};

const RaceBeatLegend = ({
  intro,
  state,
}: {
  intro: number;
  state: MarketCapFrameState;
}) => {
  const beat = storyBeatForYear(state.year);
  const accent = beat.companyName
    ? brandColorByCompanyName[beat.companyName] ?? '#F5E829'
    : '#F5E829';

  return (
    <div style={{ ...styles.legend, opacity: intro }}>
      <div style={styles.legendLeft}>
        <span style={{ ...styles.legendKicker, color: accent }}>{beat.kicker}</span>
        <span style={styles.legendHeadline}>{beat.headline}</span>
      </div>
      <span style={styles.legendValue}>{globalMarketCapVideoConfig.valueColumnLabel}</span>
    </div>
  );
};

const BarRaceChart = ({
  finalNvidiaReleaseProgress,
  finalSpotlightProgress,
  intro,
  state,
}: {
  finalNvidiaReleaseProgress: number;
  finalSpotlightProgress: number;
  intro: number;
  state: MarketCapFrameState;
}) => (
  <div style={{ ...styles.chart, opacity: intro }}>
    <GridLines />
    <div style={styles.rowsLayer}>
      {state.rows
        .filter((raceRow) => raceRow.displayRank <= globalMarketCapVideoConfig.topN)
        .map((raceRow) => (
          <BarRaceRow
            finalNvidiaReleaseProgress={finalNvidiaReleaseProgress}
            finalSpotlightProgress={finalSpotlightProgress}
            key={raceRow.id}
            raceRow={raceRow}
            state={state}
          />
        ))}
    </div>
  </div>
);

const GridLines = () => (
  <div style={styles.gridLayer}>
    {Array.from({ length: 7 }, (_, index) => (
      <div
        key={`grid-v-${index}`}
        style={{
          ...styles.gridVerticalLine,
          left: barLeft + Math.round((barMaxWidth / 6) * index),
        }}
      />
    ))}
    {Array.from({ length: globalMarketCapVideoConfig.topN + 1 }, (_, index) => (
      <div
        key={`grid-h-${index}`}
        style={{
          ...styles.gridHorizontalLine,
          top: index * (row.height + row.gap),
        }}
      />
    ))}
  </div>
);

const BarRaceRow = ({
  finalNvidiaReleaseProgress,
  finalSpotlightProgress,
  raceRow,
  state,
}: {
  finalNvidiaReleaseProgress: number;
  finalSpotlightProgress: number;
  raceRow: MarketCapFrameRow;
  state: MarketCapFrameState;
}) => {
  const top = chartRankToY(raceRow.animatedRank);
  const currentBarWidth = Math.max(122, barWidthForValue(raceRow.value, state.maxValue));
  const color = colorForCompany(raceRow);
  const rankColor = rankColorFor(raceRow.displayRank);
  const rowOpacity = opacityForRow(raceRow, state.year, finalSpotlightProgress);
  const nvidiaHighlightProgress = raceRow.name === 'NVIDIA'
    ? finalSpotlightProgress * (1 - finalNvidiaReleaseProgress)
    : finalSpotlightProgress;
  const finalBrightness = raceRow.name === 'NVIDIA'
    ? interpolate(nvidiaHighlightProgress, [0, 1], [1, 1.28])
    : interpolate(finalSpotlightProgress, [0, 1], [1, 0.62]);
  const finalSaturation = raceRow.name === 'NVIDIA'
    ? interpolate(nvidiaHighlightProgress, [0, 1], [1, 1.18])
    : interpolate(finalSpotlightProgress, [0, 1], [1, 0.74]);
  const rowGlow = storyCompanies.has(raceRow.name)
    ? `0 0 24px ${hexToRgba(color, 0.26)}`
    : 'none';
  const nameWidth = Math.max(250, Math.min(currentBarWidth - 124, valueLeft - barLeft - 112));
  const nameText = companyDisplayName(raceRow.name);

  return (
    <div
      style={{
        ...styles.barRow,
        filter: `brightness(${finalBrightness}) saturate(${finalSaturation})`,
        opacity: rowOpacity,
        top,
        zIndex: raceRow.name === 'NVIDIA' && finalSpotlightProgress > 0
          ? 140
          : 100 - Math.min(80, raceRow.displayRank),
      }}
    >
      <div style={{ ...styles.rank, color: rankColor }}>#{raceRow.displayRank}</div>
      <div
        style={{
          ...styles.bar,
          background: barGradientFor(color),
          boxShadow: rowGlow,
          width: currentBarWidth,
        }}
      />
      <div
        style={{
          ...styles.logoShell,
          borderColor: raceRow.displayRank === 1 ? '#F5E829' : 'rgba(255,255,255,0.22)',
          boxShadow: raceRow.displayRank === 1
            ? `0 9px 20px rgba(0,0,0,0.34), 0 0 0 3px #F5E829, 0 0 22px ${hexToRgba('#F5E829', 0.36)}`
            : styles.logoShell.boxShadow,
        }}
      >
        {raceRow.displayRank === 1 ? <CrownIcon size={logoSize} /> : null}
        <CompanyLogoMark code={raceRow.code} name={raceRow.name} size={logoSize} />
      </div>
      <div
        style={{
          ...styles.companyName,
          fontSize: fontSizeForCompanyName(nameText, nameWidth),
          width: nameWidth,
        }}
      >
        {nameText}
      </div>
      <div style={styles.companyMeta}>
        <span style={{ ...styles.tickerPill, borderColor: hexToRgba(color, 0.54), color }}>
          {tickerForLabel(raceRow.code)}
        </span>
        <span style={styles.countryText}>{countryDisplayName(raceRow.country)}</span>
      </div>
      <div style={{ ...styles.value, color: raceRow.name === 'NVIDIA' ? '#F5E829' : '#FFFFFF' }}>
        {formatMarketCap(raceRow.value)}
      </div>
    </div>
  );
};

const HookIntroOverlay = ({
  fps,
  frame,
}: {
  fps: number;
  frame: number;
}) => {
  const blackEndFrame = Math.round(introBlackSeconds * fps);
  const moveEndFrame = Math.round((introBlackSeconds + titleMoveSeconds) * fps);
  const overlayEndFrame = moveEndFrame + Math.round(0.08 * fps);

  if (frame > overlayEndFrame) {
    return null;
  }

  const moveProgress = interpolate(frame, [blackEndFrame, moveEndFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const blackOpacity = interpolate(frame, [blackEndFrame, moveEndFrame], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const logoOpacity = interpolate(frame, [blackEndFrame - Math.round(0.04 * fps), blackEndFrame + Math.round(0.28 * fps)], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textOpacity = interpolate(frame, [moveEndFrame, overlayEndFrame], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textY = interpolate(moveProgress, [0, 1], [990, defaultDataShortsTemplate.headerTop]);
  const fontSize = interpolate(moveProgress, [0, 1], [74, 62]);
  const letterSpacing = interpolate(moveProgress, [0, 1], [0, 0]);
  const logoY = interpolate(moveProgress, [0, 1], [820, 700]);
  const logoScale = interpolate(moveProgress, [0, 1], [1, 0.72]);
  const questionOpacity = interpolate(
    frame,
    [blackEndFrame, blackEndFrame + Math.round(0.26 * fps)],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const questionY = textY + interpolate(moveProgress, [0, 1], [88, 34]);
  const questionFontSize = interpolate(moveProgress, [0, 1], [36, 24]);

  return (
    <AbsoluteFill style={styles.hookOverlay}>
      <div style={{ ...styles.hookBlack, opacity: blackOpacity }} />
      <div
        style={{
          ...styles.hookLogoWrap,
          opacity: logoOpacity,
          top: logoY,
          transform: `translate(-50%, -50%) scale(${logoScale})`,
        }}
      >
        <div style={styles.hookAppleBehind}>
          <CompanyLogoMark code="NVDA" name="NVIDIA" size={116} />
        </div>
        <div style={styles.hookNvidiaFront}>
          <CompanyLogoMark code="AAPL" name="Apple" size={154} />
        </div>
      </div>
      <div
        style={{
          ...styles.movingHookText,
          fontSize,
          letterSpacing,
          opacity: textOpacity,
          top: textY,
        }}
      >
        {globalMarketCapVideoConfig.titleHook}
      </div>
      <div
        style={{
          ...styles.movingHookQuestion,
          fontSize: questionFontSize,
          opacity: textOpacity * questionOpacity,
          top: questionY,
        }}
      >
        {hookQuestion}
      </div>
    </AbsoluteFill>
  );
};

const AppleRowFocusOverlay = ({
  fps,
  frame,
  state,
}: {
  fps: number;
  frame: number;
  state: MarketCapFrameState;
}) => {
  const focusStartFrame = Math.round((introBlackSeconds + titleMoveSeconds + postTitleHoldSeconds) * fps);
  const focusEndFrame = Math.round(raceStartDelaySeconds * fps);
  const drawEndFrame = focusStartFrame + Math.round(appleBoxDrawSeconds * fps);
  const fadeOutStartFrame = focusEndFrame - Math.round(appleBoxFadeSeconds * fps);
  const appleRow = state.rows.find((raceRow) => raceRow.name === 'Apple');

  if (!appleRow || frame < focusStartFrame || frame > focusEndFrame) {
    return null;
  }

  const opacity = interpolate(
    frame,
    [focusStartFrame, focusStartFrame + Math.round(0.14 * fps), fadeOutStartFrame, focusEndFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  if (opacity <= 0.01) {
    return null;
  }

  const drawProgress = interpolate(
    frame,
    [focusStartFrame, drawEndFrame],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const rectTop = chart.top + chartRankToY(appleRow.animatedRank);
  const rectLeft = chart.left;
  const rectWidth = chart.width;
  const rectHeight = row.height;
  const dimOpacity = opacity * 0.68;

  return (
    <AbsoluteFill style={styles.appleFocusOverlay}>
      <div style={{ ...styles.focusDimTop, height: rectTop, opacity: dimOpacity }} />
      <div style={{ ...styles.focusDimBottom, top: rectTop + rectHeight, opacity: dimOpacity }} />
      <div style={{ ...styles.focusDimLeft, top: rectTop, width: rectLeft, height: rectHeight, opacity: dimOpacity }} />
      <div
        style={{
          ...styles.focusDimRight,
          left: rectLeft + rectWidth,
          top: rectTop,
          height: rectHeight,
          opacity: dimOpacity,
        }}
      />
      <div
        style={{
          ...styles.focusBoxClip,
          height: rectHeight,
          left: rectLeft,
          opacity,
          top: rectTop,
          width: rectWidth * drawProgress,
        }}
      >
        <div
          style={{
            ...styles.appleFocusBox,
            height: rectHeight,
            left: 0,
            top: 0,
            width: rectWidth,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const NvidiaRowFocusOverlay = ({
  endFrame,
  fps,
  frame,
  startFrame,
  state,
}: {
  endFrame: number;
  fps: number;
  frame: number;
  startFrame: number;
  state: MarketCapFrameState;
}) => {
  const fadeOutStartFrame = endFrame - Math.round(nvidiaFocusFadeSeconds * fps);
  const nvidiaRow = state.rows.find((raceRow) => raceRow.name === 'NVIDIA');

  if (!nvidiaRow || frame < startFrame || frame > endFrame) {
    return null;
  }

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + Math.round(0.12 * fps), fadeOutStartFrame, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  if (opacity <= 0.01) {
    return null;
  }

  const drawProgress = interpolate(
    frame,
    [startFrame, startFrame + Math.round(nvidiaBoxDrawSeconds * fps)],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const rectTop = chart.top + chartRankToY(nvidiaRow.animatedRank);
  const rectLeft = chart.left;
  const rectWidth = chart.width;
  const rectHeight = row.height;
  const newsTop = Math.max(chart.top + 12, rectTop - 182);
  const newsY = interpolate(
    frame,
    [startFrame, startFrame + Math.round(0.18 * fps)],
    [10, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const dimOpacity = opacity * 0.68;

  return (
    <AbsoluteFill style={styles.nvidiaFocusOverlay}>
      <div style={{ ...styles.focusDimTop, height: rectTop, opacity: dimOpacity }} />
      <div style={{ ...styles.focusDimBottom, top: rectTop + rectHeight, opacity: dimOpacity }} />
      <div style={{ ...styles.focusDimLeft, top: rectTop, width: rectLeft, height: rectHeight, opacity: dimOpacity }} />
      <div
        style={{
          ...styles.focusDimRight,
          left: rectLeft + rectWidth,
          top: rectTop,
          height: rectHeight,
          opacity: dimOpacity,
        }}
      />
      <div
        style={{
          ...styles.nvidiaNewsCard,
          opacity,
          top: newsTop,
          transform: `translateY(${newsY}px)`,
        }}
      >
        <div style={styles.nvidiaNewsKicker}>WHY NVIDIA?</div>
        <div style={styles.nvidiaNewsHeadline}>AI data centers needed its GPUs.</div>
        <div style={styles.nvidiaNewsDetail}>Data Center revenue +142% to $115B.</div>
      </div>
      <div
        style={{
          ...styles.focusBoxClip,
          height: rectHeight,
          left: rectLeft,
          opacity,
          top: rectTop,
          width: rectWidth * drawProgress,
        }}
      >
        <div
          style={{
            ...styles.nvidiaFocusBox,
            height: rectHeight,
            left: 0,
            top: 0,
            width: rectWidth,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const Footer = () => (
  <div style={styles.footer}>
    <div style={styles.source}>{globalMarketCapVideoConfig.source}</div>
    <div style={styles.note}>USD billions at year end. Information visualization, not financial advice.</div>
  </div>
);

const Background = ({
  finalSpotlightProgress,
}: {
  finalSpotlightProgress: number;
}) => (
  <AbsoluteFill style={styles.background}>
    <div
      style={{
        ...styles.finalNeutralBackground,
        opacity: finalSpotlightProgress,
      }}
    />
    <div style={styles.gridTexture} />
    <div style={styles.topShadow} />
    <div
      style={{
        ...styles.chartGlow,
        opacity: interpolate(finalSpotlightProgress, [0, 1], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      }}
    />
  </AbsoluteFill>
);

const CompanyLogoMark = ({
  code,
  name,
  size,
}: {
  code: string;
  name: string;
  size: number;
}) => {
  const logoFileName = logoFileNameForCode(code);
  const logoZoom = logoZoomByCompanyName[name] ?? 1;
  const fallbackText = tickerForLabel(code);
  const fallbackFontSize = Math.round(clamp(((size - 14) / Math.max(2, fallbackText.length)) * 1.42, 13, 22));

  return (
    <div
      style={{
        ...styles.logoMark,
        height: size,
        width: size,
      }}
    >
      {logoFileName ? (
        <Img
          src={staticFile(`projects/global-market-cap/logos/${logoFileName}`)}
          style={{
            ...styles.logoImage,
            transform: `scale(${logoZoom})`,
          }}
        />
      ) : (
        <span
          style={{
            ...styles.logoFallback,
            color: brandColorByCompanyName[name] ?? '#07111C',
            fontSize: fallbackFontSize,
          }}
        >
          {fallbackText}
        </span>
      )}
    </div>
  );
};

const CrownIcon = ({ size }: { size: number }) => {
  const crownWidth = Math.round(clamp(size * 0.74, 42, 64));
  const crownHeight = Math.round(crownWidth * 0.58);

  return (
    <svg
      height={crownHeight}
      style={{
        ...styles.crownIcon,
        left: (size - crownWidth) / 2,
        top: -Math.round(crownHeight * 0.48),
      }}
      viewBox="0 0 96 56"
      width={crownWidth}
    >
      <path
        d="M8 45L14 15L34 32L48 7L62 32L82 15L88 45H8Z"
        fill="#FFD43B"
        stroke="#1B1200"
        strokeLinejoin="round"
        strokeWidth={5}
      />
      <path
        d="M13 45H83V53H13V45Z"
        fill="#F4B400"
        stroke="#1B1200"
        strokeLinejoin="round"
        strokeWidth={5}
      />
      <circle cx={14} cy={15} fill="#FFF3A1" r={6} stroke="#1B1200" strokeWidth={4} />
      <circle cx={48} cy={7} fill="#FFF3A1" r={6} stroke="#1B1200" strokeWidth={4} />
      <circle cx={82} cy={15} fill="#FFF3A1" r={6} stroke="#1B1200" strokeWidth={4} />
    </svg>
  );
};

const chartRankToY = (rank: number) => {
  const rowSpan = row.height + row.gap;

  return clamp((rank - 1) / (globalMarketCapVideoConfig.topN + 0.35), 0, 1.08) *
    ((globalMarketCapVideoConfig.topN + 0.35) * rowSpan);
};

const frameForYearProgress = ({
  motionFrames,
  segmentProgress,
  year,
}: {
  motionFrames: number;
  segmentProgress: number;
  year: number;
}) => {
  const segmentCount = Math.max(1, raceData.snapshots.length - 1);
  const yearIndex = clamp(year - raceData.minYear + segmentProgress, 0, segmentCount);

  return Math.round((yearIndex / segmentCount) * Math.max(1, motionFrames - 1));
};

const barWidthForValue = (value: number, maxValue: number) =>
  clamp(value / Math.max(1, maxValue), 0, 1) * barMaxWidth;

const opacityForRow = (
  raceRow: MarketCapFrameRow,
  year: number,
  finalSpotlightProgress: number,
) => {
  const storyDim = year >= 2023 && !storyCompanies.has(raceRow.name) ? 0.74 : 1;
  const finalDim = raceRow.name === 'NVIDIA'
    ? interpolate(finalSpotlightProgress, [0, 1], [1, 1])
    : interpolate(finalSpotlightProgress, [0, 1], [1, 0.52]);

  return clamp(raceRow.opacity * storyDim * finalDim, 0, 1);
};

const storyBeatForYear = (year: number) => {
  if (year <= 2011) {
    return {
      companyName: 'Apple',
      headline: 'Apple enters the crown fight',
      kicker: 'EARLY MONEY',
    };
  }

  if (year <= 2017) {
    return {
      companyName: 'Apple',
      headline: 'Apple turns the race into an iPhone era',
      kicker: 'CROWN TAKEN',
    };
  }

  if (year <= 2019) {
    return {
      companyName: 'Microsoft',
      headline: 'Big tech bunches up at the top',
      kicker: 'TECH WAR',
    };
  }

  if (year <= 2022) {
    return {
      companyName: 'Saudi Aramco',
      headline: 'Oil interrupts the tech throne',
      kicker: 'POWER SHIFT',
    };
  }

  if (year <= 2024) {
    return {
      companyName: 'NVIDIA',
      headline: 'NVIDIA explodes into the top six',
      kicker: 'WATCH GREEN',
    };
  }

  return {
    companyName: 'NVIDIA',
    headline: 'AI takes the crown from Apple',
    kicker: 'NEW KING',
  };
};

const formatMarketCap = (value: number) => {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}T`;
  }

  if (value >= 100) {
    return `$${Math.round(value)}B`;
  }

  return `$${value.toFixed(1)}B`;
};

const companyDisplayName = (name: string) => {
  const normalized = companyAliases[name] ?? name;

  if (normalized.length <= 18) {
    return normalized;
  }

  return `${normalized.slice(0, 17).trim()}...`;
};

const countryDisplayName = (country: string) => countryAliases[country] ?? country;

const tickerForLabel = (code: string) => {
  const cleaned = code.replace(/\.(SS|SZ|T|HK|DE|L|PA|AS|SW|KS|SR)$/i, '');

  if (cleaned.length <= 5) {
    return cleaned;
  }

  return cleaned.slice(0, 5);
};

const logoFileNameForCode = (code: string) => {
  const normalized = code
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized ? `${normalized}.png` : '';
};

const colorForCompany = (row: MarketCapFrameRow) =>
  brandColorByCompanyName[row.name] ??
  fallbackPalette[Math.abs(hashText(row.id)) % fallbackPalette.length];

const rankColorFor = (rank: number) => {
  if (rank === 1) {
    return '#F9D36B';
  }

  if (rank === 2) {
    return '#D9E0EA';
  }

  if (rank === 3) {
    return '#D38B4A';
  }

  return '#FFFFFF';
};

const fontSizeForCompanyName = (name: string, width: number) => {
  if (name.length > 16) {
    return Math.min(34, fitFontSizeForText(name, width));
  }

  if (name.length > 12) {
    return Math.min(38, fitFontSizeForText(name, width));
  }

  return Math.min(42, fitFontSizeForText(name, width));
};

const fitFontSizeForText = (text: string, width: number) =>
  Math.round(clamp((width / Math.max(8, text.length)) * 1.72, 30, 44));

const barGradientFor = (hexColor: string) =>
  `linear-gradient(90deg, ${mixHexColors(hexColor, '#FFFFFF', 0.14)} 0%, ${hexColor} 58%, ${mixHexColors(hexColor, '#000000', 0.16)} 100%)`;

const mixHexColors = (fromColor: string, toColor: string, progress: number) => {
  const from = hexToRgb(fromColor);
  const to = hexToRgb(toColor);
  const t = clamp(progress, 0, 1);
  const mixed = from.map((channel, index) =>
    Math.round(channel + (to[index] - channel) * t)
  );

  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
};

const hexToRgb = (hex: string) => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

const hexToRgba = (hex: string, alpha: number) => {
  const [red, green, blue] = hexToRgb(hex);

  return `rgba(${red},${green},${blue},${alpha})`;
};

const hashText = (text: string) => {
  let hash = 0;

  for (const char of text) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }

  return hash;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const logoZoomByCompanyName: Record<string, number> = {
  'Broadcom': 1.16,
  'Meta Platforms (Facebook)': 1.08,
  'Saudi Aramco': 1.18,
  'SpaceX': 1.2,
  'Tesla': 1.12,
};

const brandColorByCompanyName: Record<string, string> = {
  'Alphabet (Google)': '#4285F4',
  'Amazon': '#FF9900',
  'Ambev': '#FF2D95',
  'Apple': '#C9CED6',
  'Berkshire Hathaway': '#A855F7',
  'BHP Group': '#00E5FF',
  'Broadcom': '#C0008B',
  'China Construction Bank': '#2937FF',
  'China Mobile': '#00C853',
  'Cisco': '#8BFF00',
  'Citigroup': '#52FF00',
  'Exxon Mobil': '#FF3D00',
  'General Electric': '#6C63FF',
  'ICBC': '#D500F9',
  'Meta Platforms (Facebook)': '#FF00C8',
  'Microsoft': '#00A4EF',
  'NVIDIA': '#76B900',
  'PetroChina': '#B5E61D',
  'Pfizer': '#00F5A0',
  'Saudi Aramco': '#00A3A1',
  'SpaceX': '#596675',
  'Tesla': '#E82127',
  'TSMC': '#8A1538',
  'Walmart': '#FF7A00',
};

const fallbackPalette = [
  '#006CFF',
  '#FF3B30',
  '#00A86B',
  '#FF9F0A',
  '#AF52DE',
  '#00C7BE',
  '#FF2D55',
  '#B5E61D',
  '#5856D6',
  '#00B894',
  '#D81B60',
  '#F4B400',
] as const;

const companyAliases: Record<string, string> = {
  'Alphabet (Google)': 'Alphabet',
  'Berkshire Hathaway': 'Berkshire',
  'China Construction Bank': 'China Const. Bank',
  'Meta Platforms (Facebook)': 'Meta',
  'Procter & Gamble': 'P&G',
  'Saudi Aramco': 'Saudi Aramco',
  'Taiwan Semiconductor Manufacturing Company': 'TSMC',
};

const countryAliases: Record<string, string> = {
  'S. Arabia': 'Saudi Arabia',
  'S. Korea': 'South Korea',
  UK: 'United Kingdom',
  USA: 'United States',
};

const styles = {
  stage: {
    backgroundColor: '#020409',
    color: '#FFFFFF',
    fontFamily: fontStack,
    overflow: 'hidden',
  },
  videoContent: {
    position: 'absolute',
    inset: 0,
    willChange: 'filter',
  },
  background: {
    backgroundColor: '#020409',
    backgroundImage:
      'radial-gradient(circle at 50% 58%, rgba(118,185,0,0.16) 0%, rgba(7,25,45,0.12) 36%, rgba(2,4,9,0) 68%), radial-gradient(circle at 15% 24%, rgba(245,232,41,0.08) 0%, rgba(245,232,41,0) 34%), radial-gradient(circle at 88% 16%, rgba(0,164,239,0.08) 0%, rgba(0,164,239,0) 36%), linear-gradient(180deg, #020409 0%, #06101B 52%, #020409 100%)',
  },
  gridTexture: {
    position: 'absolute',
    inset: 0,
    opacity: 0.26,
    backgroundImage:
      'linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.026) 1px, transparent 1px)',
    backgroundSize: '92px 92px',
  },
  finalNeutralBackground: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'radial-gradient(circle at 54% 54%, rgba(36,46,56,0.2) 0%, rgba(10,15,22,0.16) 38%, rgba(2,4,9,0) 66%), linear-gradient(180deg, #020409 0%, #07101A 52%, #020409 100%)',
    willChange: 'opacity',
  },
  topShadow: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.12) 34%, rgba(0,0,0,0.72) 100%)',
  },
  chartGlow: {
    position: 'absolute',
    left: 70,
    right: 70,
    top: chart.top - 95,
    height: chart.height + 260,
    background:
      'radial-gradient(ellipse at 54% 50%, rgba(118,185,0,0.1), rgba(7,28,44,0.22) 38%, rgba(0,0,0,0) 74%)',
  },
  header: {
    position: 'absolute',
    left: visibleChart.left,
    right: visibleChart.right,
    top: defaultDataShortsTemplate.headerTop,
    zIndex: 5,
    textAlign: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
    marginTop: 8,
    textShadow: '0 5px 18px rgba(0,0,0,0.64)',
    whiteSpace: 'nowrap',
  },
  titleHook: {
    color: '#F5E829',
    fontSize: 62,
    fontWeight: 950,
    letterSpacing: 0,
    lineHeight: 1,
    textShadow: '0 5px 18px rgba(0,0,0,0.64)',
    whiteSpace: 'nowrap',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 27,
    fontWeight: 800,
    lineHeight: 1.2,
    marginTop: 10,
  },
  yearRailBlock: {
    position: 'absolute',
    left: yearRail.left,
    top: yearRail.top,
    width: yearRail.width,
    zIndex: 9,
  },
  yearRailHeader: {
    marginBottom: 7,
    position: 'relative',
  },
  currentYear: {
    color: '#FFFFFF',
    fontSize: 76,
    fontStyle: 'italic',
    fontWeight: 950,
    lineHeight: 0.9,
    textAlign: 'left',
    textShadow: '0 10px 26px rgba(0,0,0,0.38)',
  },
  yearRailTag: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    marginBottom: 7,
    padding: '7px 13px',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 999,
    background: 'rgba(2,8,14,0.48)',
    color: 'rgba(255,255,255,0.72)',
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: 0,
    boxShadow: '0 12px 28px rgba(0,0,0,0.24)',
    transformOrigin: '50% -16px',
    willChange: 'transform',
    whiteSpace: 'nowrap',
  },
  yearRailSvg: {
    display: 'block',
  },
  legend: {
    position: 'absolute',
    left: chart.left + barLeft,
    top: chart.top - 32,
    width: valueRight - barLeft,
    zIndex: 6,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 20,
    color: 'rgba(255,255,255,0.58)',
    fontSize: 20,
    fontWeight: 950,
    letterSpacing: 0,
    overflow: 'hidden',
  },
  legendLeft: {
    display: 'flex',
    flex: '1 1 auto',
    gap: 10,
    minWidth: 0,
    overflow: 'hidden',
  },
  legendKicker: {
    flex: '0 0 auto',
  },
  legendHeadline: {
    color: '#FFFFFF',
    flex: '1 1 auto',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  legendValue: {
    flex: '0 0 auto',
    textAlign: 'right',
  },
  chart: {
    position: 'absolute',
    left: chart.left,
    top: chart.top,
    width: chart.width,
    height: chart.height,
    zIndex: 6,
    overflow: 'hidden',
    transformOrigin: 'center top',
    willChange: 'opacity',
  },
  gridLayer: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    pointerEvents: 'none',
  },
  gridVerticalLine: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: chart.height,
    backgroundColor: 'rgba(255,255,255,0.16)',
    opacity: 0.13,
  },
  gridHorizontalLine: {
    position: 'absolute',
    left: barLeft,
    width: barMaxWidth,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    opacity: 0.08,
  },
  rowsLayer: {
    position: 'absolute',
    inset: 0,
    zIndex: 3,
  },
  barRow: {
    position: 'absolute',
    left: 0,
    width: chart.width,
    height: row.height,
    willChange: 'filter, opacity, top',
  },
  rank: {
    position: 'absolute',
    left: 0,
    top: 34,
    width: rankColumnWidth,
    fontSize: 33,
    fontWeight: 950,
    lineHeight: 1,
    textAlign: 'right',
    textShadow: '0 4px 10px rgba(0,0,0,0.48)',
  },
  bar: {
    position: 'absolute',
    left: barLeft,
    top: 5,
    height: barHeight,
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 7,
  },
  logoShell: {
    position: 'absolute',
    left: barLeft + 10,
    top: 20,
    width: logoSize,
    height: logoSize,
    border: '2px solid rgba(255,255,255,0.22)',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.98)',
    boxShadow: '0 9px 20px rgba(0,0,0,0.34), inset 0 0 0 1px rgba(255,255,255,0.66)',
  },
  logoMark: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    overflow: 'hidden',
    padding: 7,
    boxSizing: 'border-box',
    backgroundColor: 'rgba(255,255,255,0.98)',
  },
  logoImage: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    transformOrigin: 'center center',
  },
  logoFallback: {
    maxWidth: '100%',
    overflow: 'hidden',
    textAlign: 'center',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 950,
    lineHeight: 1,
  },
  crownIcon: {
    position: 'absolute',
    zIndex: 4,
    display: 'block',
    filter: 'drop-shadow(0 7px 9px rgba(0,0,0,0.5))',
    pointerEvents: 'none',
  },
  companyName: {
    position: 'absolute',
    left: barLeft + 90,
    top: 21,
    color: '#FFFFFF',
    fontWeight: 950,
    lineHeight: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textShadow: '0 3px 0 rgba(0,0,0,0.72), 0 8px 18px rgba(0,0,0,0.38)',
    whiteSpace: 'nowrap',
  },
  companyMeta: {
    position: 'absolute',
    left: barLeft + 90,
    top: 59,
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    maxWidth: valueLeft - barLeft - 112,
    overflow: 'hidden',
  },
  tickerPill: {
    flex: '0 0 auto',
    border: '1px solid rgba(255,255,255,0.34)',
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.34)',
    padding: '4px 7px',
    fontSize: 17,
    fontWeight: 950,
    lineHeight: 1,
  },
  countryText: {
    minWidth: 0,
    overflow: 'hidden',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: 850,
    lineHeight: 1,
    textOverflow: 'ellipsis',
    textShadow: '0 3px 9px rgba(0,0,0,0.56)',
    whiteSpace: 'nowrap',
  },
  value: {
    position: 'absolute',
    left: valueLeft,
    top: 32,
    width: valueWidth,
    fontSize: 37,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 950,
    lineHeight: 1,
    textAlign: 'right',
    textShadow: '0 4px 12px rgba(0,0,0,0.46)',
    whiteSpace: 'nowrap',
  },
  hookOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 40,
    pointerEvents: 'none',
  },
  hookBlack: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#000000',
  },
  hookLogoWrap: {
    position: 'absolute',
    left: '50%',
    zIndex: 42,
    width: 248,
    height: 176,
    filter: 'drop-shadow(0 18px 42px rgba(0,0,0,0.72))',
    transformOrigin: 'center center',
    willChange: 'opacity, top, transform',
  },
  hookAppleBehind: {
    position: 'absolute',
    left: 112,
    top: 37,
    zIndex: 1,
    opacity: 0.94,
    filter: 'brightness(0.9) drop-shadow(0 12px 24px rgba(0,0,0,0.58))',
  },
  hookNvidiaFront: {
    position: 'absolute',
    left: 18,
    top: 9,
    zIndex: 2,
    filter: 'drop-shadow(0 16px 30px rgba(118,185,0,0.28))',
  },
  movingHookText: {
    position: 'absolute',
    left: '50%',
    zIndex: 43,
    width: 1040,
    boxSizing: 'border-box',
    color: '#F5E829',
    fontWeight: 950,
    lineHeight: 0.98,
    textAlign: 'center',
    textShadow: '0 5px 18px rgba(0,0,0,0.64)',
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
    willChange: 'opacity, top, font-size',
  },
  movingHookQuestion: {
    position: 'absolute',
    left: '50%',
    zIndex: 43,
    width: 1040,
    boxSizing: 'border-box',
    color: '#FFFFFF',
    fontWeight: 900,
    lineHeight: 1,
    textAlign: 'center',
    textShadow: '0 5px 18px rgba(0,0,0,0.64)',
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
    willChange: 'opacity, top, font-size',
  },
  appleFocusOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 28,
    pointerEvents: 'none',
  },
  focusDimTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: '#000000',
  },
  focusDimBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  focusDimLeft: {
    position: 'absolute',
    left: 0,
    backgroundColor: '#000000',
  },
  focusDimRight: {
    position: 'absolute',
    right: 0,
    backgroundColor: '#000000',
  },
  focusBoxClip: {
    position: 'absolute',
    zIndex: 2,
    overflow: 'hidden',
    willChange: 'opacity, width',
  },
  appleFocusBox: {
    position: 'absolute',
    border: '4px solid #F5E829',
    borderRadius: 0,
    boxShadow:
      '0 0 0 1px rgba(0,0,0,0.86), 0 0 28px rgba(245,232,41,0.5), inset 0 0 0 1px rgba(255,255,255,0.16)',
    boxSizing: 'border-box',
  },
  nvidiaFocusOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 29,
    pointerEvents: 'none',
  },
  nvidiaFocusBox: {
    position: 'absolute',
    border: '4px solid #76B900',
    borderRadius: 0,
    boxShadow:
      '0 0 0 1px rgba(0,0,0,0.86), 0 0 30px rgba(118,185,0,0.66), inset 0 0 0 1px rgba(255,255,255,0.16)',
    boxSizing: 'border-box',
  },
  nvidiaNewsCard: {
    position: 'absolute',
    left: chart.left + 68,
    width: chart.width - 136,
    zIndex: 3,
    boxSizing: 'border-box',
    border: '3px solid rgba(118,185,0,0.88)',
    borderRadius: 7,
    background:
      'linear-gradient(90deg, rgba(6,13,9,0.94) 0%, rgba(12,31,14,0.9) 55%, rgba(4,8,7,0.9) 100%)',
    boxShadow:
      '0 18px 42px rgba(0,0,0,0.52), 0 0 30px rgba(118,185,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.1)',
    padding: '18px 22px 20px',
    willChange: 'opacity, transform',
  },
  nvidiaNewsKicker: {
    color: '#76B900',
    fontSize: 27,
    fontWeight: 950,
    lineHeight: 1,
    marginBottom: 8,
    textShadow: '0 4px 12px rgba(0,0,0,0.5)',
    whiteSpace: 'nowrap',
  },
  nvidiaNewsHeadline: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: 950,
    lineHeight: 1.05,
    textShadow: '0 5px 16px rgba(0,0,0,0.56)',
    whiteSpace: 'nowrap',
  },
  nvidiaNewsDetail: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 28,
    fontWeight: 850,
    lineHeight: 1.12,
    marginTop: 8,
    whiteSpace: 'nowrap',
  },
  footer: {
    position: 'absolute',
    left: defaultDataShortsFooterInset.left,
    right: defaultDataShortsFooterInset.right,
    top: defaultDataShortsTemplate.footerTop,
    zIndex: 7,
  },
  source: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 1.28,
    textAlign: 'right',
  },
  note: {
    marginTop: 9,
    color: 'rgba(245,232,41,0.78)',
    fontSize: 22,
    fontWeight: 850,
    lineHeight: 1.22,
    textAlign: 'right',
  },
} satisfies Record<string, CSSProperties>;
