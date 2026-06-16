import type { CSSProperties } from 'react';
import { useLayoutEffect, useRef } from 'react';
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  CandlestickSeries,
  ColorType,
  createChart,
  PriceScaleMode,
  type AutoscaleInfoProvider,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';
import {
  nasdaqCandles,
  nasdaqEventIndexByDate,
  nasdaqEvents,
  nasdaqVideoConfig,
  type NasdaqCandle,
  type NasdaqEvent,
} from './nasdaqHistoryData';
import { SHORTS_PLATFORM_TOP_CLEARANCE } from './script';

type EventWithFrame = NasdaqEvent & {
  frame: number;
  index: number;
  pauseEndFrame: number;
};

type PlaybackSegment =
  | {
      type: 'move';
      fromFrame: number;
      toFrame: number;
      fromIndex: number;
      toIndex: number;
    }
  | {
      type: 'pause';
      fromFrame: number;
      toFrame: number;
      index: number;
    };

type PlaybackSchedule = {
  events: EventWithFrame[];
  segments: PlaybackSegment[];
};

type VisibleLogicalRange = {
  from: number;
  to: number;
};

type PriceRange = {
  from: number;
  to: number;
};

type EventChartLayout = {
  arrowEndX: number;
  arrowEndY: number;
  arrowStartX: number;
  arrowStartY: number;
  bandHeight: number;
  bandLeft: number;
  bandTop: number;
  bandWidth: number;
  cardLeft: number;
  cardSide: 'left' | 'right';
  cardTop: number;
  closeY: number;
  paneHeight: number;
  plotWidth: number;
  x: number;
};

type EventPriceMove = {
  bodyPercent: number;
  bodyPointMove: number;
  isBodyUp: boolean;
};

const fontStack =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const chartWidth = 980;
const chartHeight = 830;
const chartPlotWidth = 858;
const chartPaneHeight = 774;
const chartLeft = 50;
const chartTop = 450 + SHORTS_PLATFORM_TOP_CLEARANCE;
const youtubeBottomSafeArea = 220;
const headerTop = 118 + SHORTS_PLATFORM_TOP_CLEARANCE;
const priceReadoutTop = 232 + SHORTS_PLATFORM_TOP_CLEARANCE;
const priceScaleTopMargin = 0.16;
const priceScaleBottomMargin = 0.02;
const introSequenceFrames = 0;
const eventPauseFrames = 72;
const eventPauseBudgetRatio = 0.36;
const eventCardLeadFrames = 8;
const eventCardFrames = 96;
const finalHoldFrames = 30;
const fullChartRevealFrames = 42;
const postRevealHoldFrames = 38;
const endPromoFrames = 92;
const outroFrames = finalHoldFrames + fullChartRevealFrames + postRevealHoldFrames;
const rollingWindowLeftPadding = 4;
const rollingWindowRightPadding = 8;
const fullChartLeftPadding = 8;
const fullChartRightPadding = 18;
const visibleNewsCount = 5;
const newsRowHeight = 66;
const newsFeedGap = 7;
const eventCalloutCardWidth = 420;
const eventCalloutCardHeight = 340;
const soundtrackPath = 'audio/intergalactic-alex-jones-xander-jones.mp3';
const soundtrackStartFromSeconds = 10;
const soundtrackVolume = 0.2;
const soundtrackFadeOutSeconds = 1.2;
const channelName = 'WHOA-DATA';
const playbackScheduleCache = new Map<string, PlaybackSchedule>();
const chartCandles = nasdaqCandles.map((candle) => ({
  time: candle.time,
  open: candle.open,
  high: candle.high,
  low: candle.low,
  close: candle.close,
}));

export const NasdaqHistoryVideo = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const chartFrame = Math.max(0, frame - introSequenceFrames);
  const chartDurationInFrames = Math.max(1, durationInFrames - introSequenceFrames);
  const isIntroSequence = frame < introSequenceFrames;
  const intro = spring({
    frame: chartFrame,
    fps,
    config: {
      damping: 24,
      mass: 0.78,
      stiffness: 116,
    },
  });
  const schedule = getPlaybackSchedule(chartDurationInFrames, 0);
  const currentIndex = getTimelineIndex(chartFrame, schedule.segments);
  const currentCandle = nasdaqCandles[currentIndex] ?? nasdaqCandles[nasdaqCandles.length - 1];
  const previousCandle = nasdaqCandles[Math.max(0, currentIndex - 1)] ?? currentCandle;
  const monthlyPointMove = currentCandle.close - previousCandle.close;
  const monthlyChangePercent =
    previousCandle.close === 0 ? 0 : (monthlyPointMove / previousCandle.close) * 100;
  const isOutro = chartFrame >= getOutroStartFrame(chartDurationInFrames);
  const fullChartProgress = getFullChartRevealProgress(chartFrame, chartDurationInFrames);
  const activeEvent = isIntroSequence || isOutro ? null : getActiveEvent(chartFrame, schedule.events);
  const soundtrackFadeOutFrames = Math.max(1, Math.round(soundtrackFadeOutSeconds * fps));
  const soundtrackFadeStartFrame = Math.max(0, durationInFrames - soundtrackFadeOutFrames);
  const soundtrackFrameVolume = interpolate(
    frame,
    [soundtrackFadeStartFrame, durationInFrames - 1],
    [soundtrackVolume, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

  return (
    <AbsoluteFill style={styles.stage}>
      <Audio
        src={staticFile(soundtrackPath)}
        startFrom={soundtrackStartFromSeconds * fps}
        volume={soundtrackFrameVolume}
      />
      <div style={styles.backgroundPanel} />
      <Header intro={intro} />
      <DateReadout candle={currentCandle} />
      <div style={styles.chartShell}>
        <TradingViewCandleChart currentIndex={currentIndex} fullChartProgress={fullChartProgress} />
        <ChartPriceBadge
          candle={currentCandle}
          event={activeEvent}
          fullChartProgress={fullChartProgress}
          monthlyChangePercent={monthlyChangePercent}
          monthlyPointMove={monthlyPointMove}
        />
        <ChartEventMediaOverlay event={activeEvent} frame={chartFrame} />
      </div>
      <NewsHistory events={schedule.events} frame={chartFrame} />
      <EndChannelPromo durationInFrames={durationInFrames} fps={fps} frame={frame} />
    </AbsoluteFill>
  );
};

const EndChannelPromo = ({
  durationInFrames,
  fps,
  frame,
}: {
  durationInFrames: number;
  fps: number;
  frame: number;
}) => {
  const startFrame = Math.max(0, durationInFrames - endPromoFrames);
  const localFrame = frame - startFrame;

  if (localFrame < 0) {
    return null;
  }

  const panelSpring = spring({
    frame: localFrame,
    fps,
    config: {
      damping: 20,
      mass: 0.86,
      stiffness: 142,
    },
  });
  const likeSpring = spring({
    frame: Math.max(0, localFrame - 18),
    fps,
    config: {
      damping: 12,
      mass: 0.64,
      stiffness: 180,
    },
  });
  const bellSpring = spring({
    frame: Math.max(0, localFrame - 30),
    fps,
    config: {
      damping: 11,
      mass: 0.66,
      stiffness: 190,
    },
  });
  const flashProgress = reveal(localFrame, 42, 18);
  const opacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const panelY = interpolate(panelSpring, [0, 1], [76, 0]);
  const bellShake = Math.sin(localFrame * 0.72) * interpolate(localFrame, [34, 52, 78], [0, 12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ ...styles.endPromoOverlay, opacity }}>
      <div
        style={{
          ...styles.endPromoGlow,
          opacity: interpolate(flashProgress, [0, 1], [0, 1]),
          transform: `scale(${interpolate(flashProgress, [0, 1], [0.82, 1.08])})`,
        }}
      />
      <div
        style={{
          ...styles.endPromoPanel,
          transform: `translateY(${panelY}px) scale(${interpolate(panelSpring, [0, 1], [0.94, 1])})`,
        }}
      >
        <div style={styles.endPromoKicker}>FOLLOW THE NEXT MARKET STORY</div>
        <div style={styles.endPromoChannel}>{channelName}</div>
        <div style={styles.endPromoActions}>
          <div
            style={{
              ...styles.endPromoAction,
              transform: `scale(${interpolate(likeSpring, [0, 1], [0.72, 1])}) rotate(${interpolate(
                likeSpring,
                [0, 1],
                [-8, 0],
              )}deg)`,
            }}
          >
            <ThumbsUpIcon />
            <span>LIKE</span>
          </div>
          <div
            style={{
              ...styles.endPromoSubscribe,
              opacity: reveal(localFrame, 24, 14),
              transform: `translateY(${interpolate(reveal(localFrame, 24, 14), [0, 1], [20, 0])}px)`,
            }}
          >
            SUBSCRIBE
          </div>
          <div
            style={{
              ...styles.endPromoAction,
              transform: `scale(${interpolate(bellSpring, [0, 1], [0.72, 1])}) rotate(${bellShake}deg)`,
            }}
          >
            <BellIcon />
            <span>NOTIFY</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ThumbsUpIcon = () => (
  <svg aria-hidden="true" style={styles.endPromoIconSvg} viewBox="0 0 64 64">
    <path
      d="M24 28V56H12C8.7 56 6 53.3 6 50V34C6 30.7 8.7 28 12 28H24Z"
      fill="currentColor"
      opacity="0.22"
    />
    <path
      d="M24 28L35.2 10.3C37 7.5 41.2 8.6 41.5 11.9L42.2 22H52.5C56.4 22 59.3 25.6 58.5 29.4L54.6 48.6C53.7 52.9 50 56 45.6 56H24V28Z"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="5"
    />
    <path
      d="M24 28V56M14 36V48"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="5"
    />
  </svg>
);

const BellIcon = () => (
  <svg aria-hidden="true" style={styles.endPromoIconSvg} viewBox="0 0 64 64">
    <path
      d="M18 29C18 20.8 24.3 14 32 14C39.7 14 46 20.8 46 29V37L53 47H11L18 37V29Z"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="5"
    />
    <path d="M27 51C28.1 54.1 29.8 56 32 56C34.2 56 35.9 54.1 37 51" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
    <path d="M32 8V5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
    <path d="M12 16L8 12M52 16L56 12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4" opacity="0.55" />
  </svg>
);

const Header = ({ intro }: { intro: number }) => {
  const y = interpolate(intro, [0, 1], [-24, 0]);

  return (
    <div style={{ ...styles.header, opacity: intro, transform: `translateY(${y}px)` }}>
      <div style={styles.marketBadge}>NASDAQ COMPOSITE</div>
      <div style={styles.title}>{nasdaqVideoConfig.title}</div>
      <div style={styles.subtitle}>{nasdaqVideoConfig.subtitle}</div>
    </div>
  );
};

const DateReadout = ({ candle }: { candle: NasdaqCandle }) => {
  return (
    <div style={styles.dateReadout}>
      <div style={styles.dateLabel}>CURRENT MONTH</div>
      <div style={styles.currentDate}>{formatDisplayMonth(candle.time)}</div>
    </div>
  );
};

const TradingViewCandleChart = ({
  currentIndex,
  fullChartProgress,
}: {
  currentIndex: number;
  fullChartProgress: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useLayoutEffect(() => {
    if (!containerRef.current || chartRef.current) {
      return;
    }

    const chart = createChart(containerRef.current, {
      width: chartWidth,
      height: chartHeight,
      autoSize: false,
      handleScroll: false,
      handleScale: false,
      layout: {
        background: { type: ColorType.Solid, color: theme.chartBackground },
        textColor: 'rgba(20,20,20,0.72)',
        fontFamily: fontStack,
        fontSize: 25,
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: 'rgba(20,20,20,0.055)' },
        horzLines: { color: 'rgba(20,20,20,0.065)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(20,20,20,0.18)',
        minimumWidth: 116,
        mode: PriceScaleMode.Normal,
        scaleMargins: {
          top: priceScaleTopMargin,
          bottom: priceScaleBottomMargin,
        },
      },
      timeScale: {
        borderColor: 'rgba(20,20,20,0.18)',
        rightOffset: 0,
        barSpacing: 7,
        minBarSpacing: 0.1,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: formatChartTick,
      },
      localization: {
        priceFormatter: formatIndexShort,
      },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
    });
    const series = chart.addSeries(CandlestickSeries, {
      autoscaleInfoProvider: ((original) => {
        const info = original();

        if (!info?.priceRange) {
          return info;
        }

        const minValue =
          info.priceRange.minValue < 0 || info.priceRange.maxValue <= info.priceRange.minValue
            ? 0
            : info.priceRange.minValue;
        const maxValue =
          info.priceRange.maxValue <= minValue ? minValue + 1 : info.priceRange.maxValue;

        return {
          ...info,
          priceRange: {
            minValue,
            maxValue,
          },
        };
      }) satisfies AutoscaleInfoProvider,
      upColor: theme.up,
      downColor: theme.down,
      wickUpColor: theme.up,
      wickDownColor: theme.down,
      borderUpColor: theme.up,
      borderDownColor: theme.down,
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: {
        type: 'price',
        precision: 0,
        minMove: 1,
      },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;

    if (!chart || !series) {
      return;
    }

    const revealProgress = clamp(fullChartProgress, 0, 1);
    const latestIndex = nasdaqCandles.length - 1;
    const rangeIndex = revealProgress > 0 ? latestIndex : currentIndex;
    const shownCandles = revealProgress > 0 ? chartCandles : chartCandles.slice(0, rangeIndex + 1);

    series.setData(shownCandles);
    chart.timeScale().setVisibleLogicalRange(getVisibleLogicalRange(rangeIndex, revealProgress));
    series.priceScale().setAutoScale(false);
    series.priceScale().setVisibleRange(getVisiblePriceRange(rangeIndex, revealProgress));
  }, [currentIndex, fullChartProgress]);

  return <div ref={containerRef} style={styles.chartCanvas} />;
};

const ChartPriceBadge = ({
  candle,
  event,
  fullChartProgress,
  monthlyChangePercent,
  monthlyPointMove,
}: {
  candle: NasdaqCandle;
  event: EventWithFrame | null;
  fullChartProgress: number;
  monthlyChangePercent: number;
  monthlyPointMove: number;
}) => {
  const isUp = monthlyPointMove >= 0;
  const accent = event ? getEventAccent(event.tone) : isUp ? theme.up : theme.down;
  const detail =
    fullChartProgress > 0.35
      ? `${formatDisplayMonth(nasdaqCandles[0].time)} - ${formatDisplayMonth(
          nasdaqCandles[nasdaqCandles.length - 1].time,
        )}`
      : 'Monthly close';

  return (
      <div style={{ ...styles.chartPriceBadge, borderTopColor: accent }}>
      <div style={styles.chartPriceLabel}>MONTHLY CLOSE</div>
      <div style={styles.chartPriceValue}>{formatUsdIndex(candle.close)}</div>
      <div style={styles.chartPriceMetaRow}>
        <span style={{ ...styles.chartPriceMove, color: isUp ? theme.up : theme.down }}>
          {formatSignedPoints(monthlyPointMove)} pts / {formatSignedPercent(monthlyChangePercent)}
        </span>
      </div>
      <div style={styles.chartPriceDetail}>{detail}</div>
    </div>
  );
};

const ChartEventMediaOverlay = ({
  event,
  frame,
}: {
  event: EventWithFrame | null;
  frame: number;
}) => {
  if (!event) {
    return null;
  }

  const localFrame = frame - event.frame;

  if (localFrame < 0) {
    return null;
  }

  const candle = nasdaqCandles[event.index];

  if (!candle) {
    return null;
  }

  const layout = getEventChartLayout(event.index);
  const accent = getEventAccent(event.tone);
  const eventMove = getEventPriceMove(event.index);
  const pauseLength = Math.max(1, event.pauseEndFrame - event.frame);
  const inOpacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outOpacity = interpolate(localFrame, [pauseLength - 8, pauseLength + 8], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(inOpacity, outOpacity);
  const bandProgress = reveal(localFrame, 0, 12);
  const arrowProgress = reveal(localFrame, 8, 12);
  const cardProgress = reveal(localFrame, 16, 12);
  const arrowDx = layout.arrowEndX - layout.arrowStartX;
  const arrowDy = layout.arrowEndY - layout.arrowStartY;
  const arrowLength = Math.sqrt(arrowDx ** 2 + arrowDy ** 2);
  const arrowAngle = Math.atan2(arrowDy, arrowDx);
  const cardOrigin = layout.cardSide === 'left' ? 'right center' : 'left center';
  const cardEntrance = layout.cardSide === 'left' ? 18 : -18;

  return (
    <div style={{ ...styles.eventMediaOverlay, opacity }}>
      <div
        style={{
          ...styles.eventRangeBand,
          left: layout.bandLeft,
          top: layout.bandTop,
          width: layout.bandWidth,
          height: layout.bandHeight,
          borderColor: accent,
          opacity: interpolate(bandProgress, [0, 1], [0.25, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          transform: `scaleX(${bandProgress})`,
        }}
      />
      <div
        style={{
          ...styles.eventDateLine,
          left: layout.x,
          height: layout.paneHeight,
          opacity: 0.5 * bandProgress,
        }}
      />
      <div
        style={{
          ...styles.eventMonthMarker,
          left: clamp(layout.x - 58, 8, Math.max(8, layout.plotWidth - 116)),
          top: layout.paneHeight - 42,
          borderColor: accent,
          color: accent,
          opacity: bandProgress,
        }}
      >
        {formatDisplayMonth(event.date)}
      </div>
      <div
        style={{
          ...styles.eventArrowLine,
          left: layout.arrowStartX,
          top: layout.arrowStartY,
          width: arrowLength * arrowProgress,
          background: accent,
          transform: `rotate(${arrowAngle}rad)`,
        }}
      />
      <div
        style={{
          ...styles.eventArrowHead,
          left: layout.arrowEndX,
          top: layout.arrowEndY,
          borderLeftColor: accent,
          opacity: arrowProgress,
          transform: `translate(-50%, -50%) rotate(${arrowAngle}rad)`,
        }}
      />
      <div
        style={{
          ...styles.eventMediaCard,
          left: layout.cardLeft,
          top: layout.cardTop,
          borderColor: accent,
          opacity: cardProgress,
          transform: `translateX(${interpolate(cardProgress, [0, 1], [cardEntrance, 0])}px) scaleX(${interpolate(
            cardProgress,
            [0, 1],
            [0.72, 1],
          )})`,
          transformOrigin: cardOrigin,
        }}
      >
        <div style={styles.eventImageWrap}>
          <img src={staticFile(event.image.src)} alt={event.image.alt} style={styles.eventImage} />
          <div style={styles.eventImageTint} />
          <div style={styles.eventImageCredit}>{event.image.credit}</div>
        </div>
        <div style={styles.eventMediaBody}>
          <div style={{ ...styles.eventMediaDate, color: accent }}>
            {formatDisplayMonth(event.date)}
          </div>
          <div style={styles.eventMediaTitle}>{event.title}</div>
          <div style={styles.eventMediaDetail}>{event.detail}</div>
          <div style={{ ...styles.eventMediaStat, color: eventMove.isBodyUp ? theme.up : theme.down }}>
            {formatSignedPoints(eventMove.bodyPointMove)} pts / {formatSignedPercent(eventMove.bodyPercent)}
          </div>
        </div>
      </div>
    </div>
  );
};

const NewsHistory = ({
  events,
  frame,
}: {
  events: EventWithFrame[];
  frame: number;
}) => {
  const history = getNewsHistoryForFrame(frame, events).slice(0, visibleNewsCount);

  if (history.length === 0) {
    return null;
  }

  const newestEvent = history[0];
  const localFrame = frame - getEventCardStartFrame(newestEvent.frame);
  const stackProgress = reveal(localFrame, 0, 18);
  const y = interpolate(stackProgress, [0, 1], [18, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        ...styles.newsFeed,
        transform: `translateY(${y}px)`,
      }}
    >
      {history.map((historyEvent, position) => {
        const accent = getEventAccent(historyEvent.tone);
        const baseOpacity = position === 0 ? 1 : Math.max(0.14, 0.72 - position * 0.12);
        const rowOpacity = position === 0 ? stackProgress : baseOpacity;
        const rowShift =
          position > 0 && newestEvent.frame === history[0].frame
            ? -(newsRowHeight + newsFeedGap) * (1 - stackProgress)
            : 0;

        return (
          <div
            key={`${historyEvent.date}-${historyEvent.title}`}
            style={{
              ...styles.newsFeedItem,
              borderLeftColor: accent,
              opacity: rowOpacity,
              transform: `translateY(${rowShift}px)`,
            }}
          >
            <span style={{ ...styles.newsFeedDate, color: accent }}>
              {formatDisplayMonth(historyEvent.date)}
            </span>
            <span style={styles.newsFeedTitle}>{historyEvent.title}</span>
            <span style={styles.newsFeedStat}>{formatEventNewsStat(historyEvent)}</span>
          </div>
        );
      })}
    </div>
  );
};

const getPlaybackSchedule = (durationInFrames: number, startIndex: number): PlaybackSchedule => {
  const cacheKey = `${durationInFrames}:${startIndex}`;
  const cached = playbackScheduleCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const playbackRange = Math.max(1, nasdaqCandles.length - 1 - startIndex);
  const playbackEndFrame = getPlaybackEndFrame(durationInFrames);
  const eventCandidates = nasdaqEvents
    .map((event) => ({
      ...event,
      index: nasdaqEventIndexByDate.get(event.date) ?? -1,
    }))
    .filter((event) => event.index >= startIndex && event.index < nasdaqCandles.length - 1)
    .sort((a, b) => a.index - b.index);
  const pauseBudget = Math.floor(playbackEndFrame * eventPauseBudgetRatio);
  const pauseFrames = Math.min(
    eventPauseFrames,
    Math.max(1, Math.floor(pauseBudget / Math.max(1, eventCandidates.length))),
  );
  const movementFrames = Math.max(1, playbackEndFrame - eventCandidates.length * pauseFrames);
  const events: EventWithFrame[] = [];
  const segments: PlaybackSegment[] = [];
  let previousIndex = startIndex;
  let previousMoveFrame = 0;
  let pauseOffset = 0;

  eventCandidates.forEach((event, eventPosition) => {
    const desiredMoveFrame = Math.round(((event.index - startIndex) / playbackRange) * movementFrames);
    const remainingEvents = eventCandidates.length - eventPosition - 1;
    const minMoveFrame = Math.min(movementFrames, previousMoveFrame + 1);
    const maxMoveFrame = Math.max(minMoveFrame, movementFrames - remainingEvents);
    const moveFrame = clamp(desiredMoveFrame, minMoveFrame, maxMoveFrame);
    const eventFrame = moveFrame + pauseOffset;
    const pauseEndFrame = Math.min(playbackEndFrame, eventFrame + pauseFrames);

    segments.push({
      type: 'move',
      fromFrame: previousMoveFrame + pauseOffset,
      toFrame: eventFrame,
      fromIndex: previousIndex,
      toIndex: event.index,
    });
    segments.push({
      type: 'pause',
      fromFrame: eventFrame,
      toFrame: pauseEndFrame,
      index: event.index,
    });
    events.push({
      ...event,
      frame: eventFrame,
      index: event.index,
      pauseEndFrame,
    });

    previousIndex = event.index;
    previousMoveFrame = moveFrame;
    pauseOffset += pauseFrames;
  });

  segments.push({
    type: 'move',
    fromFrame: previousMoveFrame + pauseOffset,
    toFrame: playbackEndFrame,
    fromIndex: previousIndex,
    toIndex: nasdaqCandles.length - 1,
  });

  const schedule = { events, segments };
  playbackScheduleCache.set(cacheKey, schedule);

  return schedule;
};

const getTimelineIndex = (frame: number, segments: PlaybackSegment[]) => {
  const safeFrame = Math.max(0, frame);
  const pauseSegment = segments.find(
    (segment) =>
      segment.type === 'pause' && safeFrame >= segment.fromFrame && safeFrame <= segment.toFrame,
  );

  if (pauseSegment?.type === 'pause') {
    return pauseSegment.index;
  }

  for (const segment of segments) {
    if (safeFrame < segment.fromFrame || safeFrame > segment.toFrame) {
      continue;
    }

    if (segment.type === 'pause') {
      return segment.index;
    }

    if (segment.toFrame <= segment.fromFrame) {
      return segment.toIndex;
    }

    const progress = clamp(
      (safeFrame - segment.fromFrame) / Math.max(1, segment.toFrame - segment.fromFrame),
      0,
      1,
    );

    return Math.min(segment.toIndex, Math.floor(lerp(segment.fromIndex, segment.toIndex, progress)));
  }

  const lastSegment = segments[segments.length - 1];

  return lastSegment?.type === 'pause' ? lastSegment.index : lastSegment?.toIndex ?? nasdaqCandles.length - 1;
};

const getPlaybackEndFrame = (durationInFrames: number) =>
  Math.max(1, durationInFrames - outroFrames - 1);

const getOutroStartFrame = (durationInFrames: number) =>
  Math.max(0, durationInFrames - outroFrames);

const getFullChartRevealProgress = (frame: number, durationInFrames: number) => {
  const revealEndFrame = Math.max(0, durationInFrames - postRevealHoldFrames - 1);
  const revealStartFrame = Math.max(0, revealEndFrame - fullChartRevealFrames);
  const progress = interpolate(frame, [revealStartFrame, Math.max(revealStartFrame + 1, revealEndFrame)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return easeOutCubic(progress);
};

const getActiveEvent = (frame: number, events: EventWithFrame[]) => {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    const cardStartFrame = getEventCardStartFrame(event.frame);

    if (frame >= cardStartFrame && frame <= cardStartFrame + eventCardFrames) {
      return event;
    }
  }

  return null;
};

const getNewsHistoryForFrame = (frame: number, events: EventWithFrame[]) =>
  events.filter((event) => frame >= getEventCardStartFrame(event.frame)).reverse();

const getEventCardStartFrame = (eventFrame: number) => Math.max(0, eventFrame - eventCardLeadFrames);

const getEventChartLayout = (eventIndex: number): EventChartLayout => {
  const candle = nasdaqCandles[eventIndex] ?? nasdaqCandles[nasdaqCandles.length - 1];
  const visibleRange = getVisibleLogicalRange(eventIndex, 0);
  const priceRange = getVisiblePriceRange(eventIndex, 0);
  const eventMove = getEventPriceMove(eventIndex);
  const plotWidth = chartPlotWidth;
  const paneHeight = chartPaneHeight;
  const logicalSpan = Math.max(1, visibleRange.to - visibleRange.from);
  const x = stablePixel(
    clamp(((eventIndex - visibleRange.from) / logicalSpan) * plotWidth, 28, plotWidth - 28),
  );
  const openY = priceToY(candle.open, priceRange, paneHeight);
  const closeY = priceToY(candle.close, priceRange, paneHeight);
  const rawBandTop = Math.min(openY, closeY) - 10;
  const rawBandHeight = Math.abs(closeY - openY) + 20;
  const bandTop = stablePixel(clamp(rawBandTop, 0, paneHeight - 18));
  const bandHeight = stablePixel(clamp(rawBandHeight, 18, paneHeight - bandTop));
  const bandWidth = stablePixel(clamp(72 + Math.abs(eventMove.bodyPercent) * 1.5, 76, 118));
  const bandLeft = stablePixel(clamp(x - bandWidth / 2, 8, plotWidth - bandWidth - 8));
  const rangeRect = {
    height: bandHeight,
    left: bandLeft,
    top: bandTop,
    width: bandWidth,
  };
  const priceBadgeRect = {
    height: 224,
    left: 24,
    top: 24,
    width: 486,
  };
  const maxCardTop = paneHeight - eventCalloutCardHeight - 10;
  const rightCardLeft = plotWidth - eventCalloutCardWidth - 22;
  const cardCandidates = [
    { left: 30, top: 262 },
    { left: rightCardLeft, top: 262 },
    { left: 30, top: maxCardTop },
    { left: rightCardLeft, top: maxCardTop },
    { left: 226, top: maxCardTop },
  ].map((candidate) => ({
    left: stablePixel(clamp(candidate.left, 18, plotWidth - eventCalloutCardWidth - 10)),
    top: stablePixel(clamp(candidate.top, 246, maxCardTop)),
  }));
  const rotation = eventIndex % cardCandidates.length;
  const rotatedCandidates = [
    ...cardCandidates.slice(rotation),
    ...cardCandidates.slice(0, rotation),
  ];
  const selectedCard = rotatedCandidates
    .map((candidate, rotatedIndex) => {
      const cardRect = {
        height: eventCalloutCardHeight,
        left: candidate.left,
        top: candidate.top,
        width: eventCalloutCardWidth,
      };
      const cardCenterX = candidate.left + eventCalloutCardWidth / 2;
      const cardCenterY = candidate.top + eventCalloutCardHeight / 2;
      const distanceFromEvent = Math.hypot(cardCenterX - x, cardCenterY - closeY);
      const score =
        getRectOverlapArea(cardRect, priceBadgeRect) * 80 +
        getRectOverlapArea(cardRect, rangeRect) * 24 -
        distanceFromEvent * 0.18 +
        rotatedIndex * 42;

      return {
        ...candidate,
        score,
      };
    })
    .sort((a, b) => a.score - b.score)[0] ?? cardCandidates[0];
  const cardLeft = selectedCard.left;
  const cardTop = selectedCard.top;
  const cardSide = cardLeft + eventCalloutCardWidth / 2 < x ? 'left' : 'right';
  const arrowStartX = cardSide === 'left' ? bandLeft : bandLeft + bandWidth;
  const arrowStartY = stablePixel(clamp((openY + closeY) / 2, bandTop + 8, bandTop + bandHeight - 8));
  const arrowEndX = cardSide === 'left' ? cardLeft + eventCalloutCardWidth - 3 : cardLeft + 3;
  const arrowEndY = stablePixel(cardTop + 142);

  return {
    arrowEndX,
    arrowEndY,
    arrowStartX,
    arrowStartY,
    bandHeight,
    bandLeft,
    bandTop,
    bandWidth,
    cardLeft,
    cardSide,
    cardTop,
    closeY,
    paneHeight,
    plotWidth,
    x,
  };
};

const priceToY = (price: number, priceRange: PriceRange, paneHeight: number) => {
  const span = Math.max(1, priceRange.to - priceRange.from);
  const progress = clamp((price - priceRange.from) / span, 0, 1);
  const topMargin = paneHeight * priceScaleTopMargin;
  const bottomMargin = paneHeight * priceScaleBottomMargin;
  const drawableHeight = paneHeight - topMargin - bottomMargin;

  return stablePixel(topMargin + (1 - progress) * drawableHeight);
};

const getRectOverlapArea = (
  first: { height: number; left: number; top: number; width: number },
  second: { height: number; left: number; top: number; width: number },
) => {
  const overlapWidth = Math.max(
    0,
    Math.min(first.left + first.width, second.left + second.width) -
      Math.max(first.left, second.left),
  );
  const overlapHeight = Math.max(
    0,
    Math.min(first.top + first.height, second.top + second.height) -
      Math.max(first.top, second.top),
  );

  return overlapWidth * overlapHeight;
};

const getEventPriceMove = (eventIndex: number): EventPriceMove => {
  const candle = nasdaqCandles[eventIndex] ?? nasdaqCandles[nasdaqCandles.length - 1];
  const bodyPointMove = candle.close - candle.open;
  const bodyPercent = candle.open === 0 ? 0 : (bodyPointMove / candle.open) * 100;

  return {
    bodyPercent,
    bodyPointMove,
    isBodyUp: bodyPointMove >= 0,
  };
};

const getVisibleLogicalRange = (
  rangeIndex: number,
  fullChartProgress: number,
): VisibleLogicalRange => {
  const latestIndex = nasdaqCandles.length - 1;
  const revealProgress = clamp(fullChartProgress, 0, 1);
  const rollingFrom = getRollingWindowStartIndex(rangeIndex) - rollingWindowLeftPadding;
  const rollingTo = rangeIndex + rollingWindowRightPadding + 1;

  if (revealProgress <= 0) {
    return {
      from: rollingFrom,
      to: rollingTo,
    };
  }

  return {
    from: lerp(rollingFrom, -fullChartLeftPadding, revealProgress),
    to: lerp(rollingTo, latestIndex + fullChartRightPadding, revealProgress),
  };
};

const getVisiblePriceRange = (rangeIndex: number, fullChartProgress: number): PriceRange => {
  const revealProgress = clamp(fullChartProgress, 0, 1);
  const fromIndex = revealProgress > 0 ? 0 : getRollingWindowStartIndex(rangeIndex);
  const toIndex = revealProgress > 0 ? nasdaqCandles.length - 1 : rangeIndex;
  let high = 0;

  for (let index = fromIndex; index <= toIndex; index += 1) {
    high = Math.max(high, nasdaqCandles[index]?.high ?? 0);
  }

  if (!Number.isFinite(high) || high <= 0) {
    return { from: 0, to: 1 };
  }

  return {
    from: 0,
    to: high * 1.08,
  };
};

const getRollingWindowStartIndex = (currentIndex: number) =>
  Math.max(0, currentIndex - nasdaqVideoConfig.visibleCandles + 1);

const reveal = (frame: number, startFrame: number, durationFrames: number) =>
  easeOutCubic(
    interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;

const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3;

const stablePixel = (value: number) => Math.round(value * 100) / 100;

const getEventAccent = (tone: NasdaqEvent['tone']) =>
  tone === 'bullish' ? theme.up : tone === 'bearish' ? theme.down : theme.neutral;

const formatIndexShort = (value: number) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1000) {
    return `${sign}${trimNumber(abs / 1000)}K`;
  }

  return `${sign}${trimNumber(abs)}`;
};

const formatIndex = (value: number) =>
  Math.round(value).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });

const formatUsdIndex = (value: number) => `$${formatIndex(value)}`;

const formatSignedPoints = (value: number) =>
  `${value >= 0 ? '+' : '-'}${Math.abs(Math.round(value)).toLocaleString('en-US')}`;

const formatEventNewsStat = (event: EventWithFrame) => {
  const eventMove = getEventPriceMove(event.index);

  return formatSignedPercent(eventMove.bodyPercent);
};

const trimNumber = (value: number) =>
  value.toFixed(value >= 10 ? 0 : 1).replace(/\.0$/, '');

const formatDisplayMonth = (date: string) => {
  const [year, month] = date.split('-');

  if (!year || !month) {
    return date;
  }

  return `${month.padStart(2, '0')}-${year}`;
};

const formatChartTick = (time: Time) => {
  if (typeof time === 'string') {
    return formatDisplayMonth(time);
  }

  if (typeof time === 'object' && 'year' in time && 'month' in time) {
    return `${String(time.month).padStart(2, '0')}-${time.year}`;
  }

  return null;
};

const formatSignedPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

const theme = {
  background: '#F6F8FB',
  ink: '#151618',
  muted: 'rgba(21,22,24,0.62)',
  panel: '#FFFFFF',
  chartBackground: '#F6F8FB',
  border: 'rgba(21,22,24,0.1)',
  up: '#087F5B',
  down: '#D64545',
  neutral: '#235BDB',
  gold: '#C58A19',
} as const;

const styles = {
  stage: {
    backgroundColor: theme.background,
    color: theme.ink,
    fontFamily: fontStack,
    overflow: 'hidden',
  },
  backgroundPanel: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, #F6F8FB 0%, #F1F3F7 58%, #F6F8FB 100%)',
  },
  endPromoOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 30,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: `0 50px ${youtubeBottomSafeArea - 24}px`,
    background:
      'linear-gradient(180deg, rgba(246,248,251,0) 0%, rgba(246,248,251,0.4) 38%, rgba(17,18,22,0.92) 100%)',
  },
  endPromoGlow: {
    position: 'absolute',
    left: 120,
    right: 120,
    bottom: youtubeBottomSafeArea - 36,
    height: 340,
    background:
      'linear-gradient(90deg, rgba(8,127,91,0.38), rgba(198,138,25,0.4), rgba(35,91,219,0.42))',
    filter: 'blur(34px)',
  },
  endPromoPanel: {
    position: 'relative',
    width: 980,
    minHeight: 330,
    boxSizing: 'border-box',
    border: '2px solid rgba(255,255,255,0.24)',
    background: 'rgba(18,20,24,0.92)',
    boxShadow: '0 34px 90px rgba(0,0,0,0.42)',
    padding: '34px 44px 38px',
    color: '#FFFFFF',
  },
  endPromoKicker: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 26,
    fontWeight: 950,
    lineHeight: 1,
    letterSpacing: 0,
  },
  endPromoChannel: {
    marginTop: 18,
    color: '#FFFFFF',
    fontSize: 96,
    fontWeight: 950,
    lineHeight: 0.92,
    letterSpacing: 0,
    textShadow: '0 12px 32px rgba(0,0,0,0.4)',
  },
  endPromoActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    marginTop: 34,
  },
  endPromoAction: {
    flex: '1 1 0',
    height: 84,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    boxSizing: 'border-box',
    border: '2px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: 950,
    lineHeight: 1,
  },
  endPromoSubscribe: {
    flex: '1.24 1 0',
    height: 88,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FFFFFF',
    color: '#151618',
    boxShadow: '0 18px 42px rgba(255,255,255,0.2)',
    fontSize: 30,
    fontWeight: 950,
    lineHeight: 1,
  },
  endPromoIconSvg: {
    width: 42,
    height: 42,
    display: 'block',
  },
  header: {
    position: 'absolute',
    left: 62,
    top: headerTop,
    width: 780,
    zIndex: 5,
  },
  marketBadge: {
    display: 'inline-block',
    padding: '12px 16px',
    background: '#151618',
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1,
  },
  title: {
    marginTop: 24,
    color: theme.ink,
    fontSize: 72,
    fontWeight: 950,
    lineHeight: 0.96,
    letterSpacing: 0,
    maxWidth: 760,
  },
  subtitle: {
    marginTop: 16,
    width: 920,
    color: theme.muted,
    fontSize: 29,
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  dateReadout: {
    position: 'absolute',
    right: 58,
    top: priceReadoutTop,
    width: 420,
    textAlign: 'right',
    zIndex: 6,
  },
  dateLabel: {
    color: theme.muted,
    fontSize: 24,
    fontWeight: 950,
  },
  currentDate: {
    marginTop: 9,
    color: theme.ink,
    fontSize: 62,
    fontWeight: 950,
    lineHeight: 0.96,
    fontVariantNumeric: 'tabular-nums',
  },
  chartShell: {
    position: 'absolute',
    left: chartLeft,
    top: chartTop,
    width: chartWidth,
    height: chartHeight,
    border: `2px solid ${theme.border}`,
    background: theme.chartBackground,
    overflow: 'hidden',
    zIndex: 2,
  },
  chartCanvas: {
    width: chartWidth,
    height: chartHeight,
  },
  chartPriceBadge: {
    position: 'absolute',
    left: 24,
    top: 24,
    width: 440,
    padding: '18px 22px 20px',
    borderTop: '8px solid',
    background: 'rgba(255,255,255,0.94)',
    boxShadow: '0 18px 48px rgba(20,20,20,0.14)',
    zIndex: 12,
  },
  chartPriceLabel: {
    color: theme.muted,
    fontSize: 21,
    fontWeight: 950,
    lineHeight: 1,
  },
  chartPriceValue: {
    marginTop: 9,
    color: theme.ink,
    fontSize: 62,
    fontWeight: 950,
    lineHeight: 0.92,
    fontVariantNumeric: 'tabular-nums',
  },
  chartPriceMetaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 14,
    marginTop: 11,
  },
  chartPriceMove: {
    fontSize: 23,
    fontWeight: 950,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  chartPriceDetail: {
    marginTop: 10,
    color: 'rgba(21,22,24,0.72)',
    fontSize: 25,
    fontWeight: 900,
    lineHeight: 1.08,
  },
  eventMediaOverlay: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 8,
  },
  eventRangeBand: {
    position: 'absolute',
    boxSizing: 'border-box',
    border: '4px solid',
    background: 'rgba(255,255,255,0.08)',
    boxShadow: '0 0 0 999px rgba(246,248,251,0.03), 0 0 28px rgba(255,255,255,0.48) inset',
    transformOrigin: 'left center',
  },
  eventDateLine: {
    position: 'absolute',
    top: 0,
    width: 2,
    background: 'rgba(21,22,24,0.42)',
    transform: 'translateX(-1px)',
  },
  eventMonthMarker: {
    position: 'absolute',
    width: 116,
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    border: '2px solid',
    background: 'rgba(255,255,255,0.96)',
    boxShadow: '0 10px 24px rgba(20,20,20,0.16)',
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  eventArrowLine: {
    position: 'absolute',
    height: 4,
    transformOrigin: 'left center',
    boxShadow: '0 0 18px rgba(255,255,255,0.75)',
  },
  eventArrowHead: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderTop: '10px solid transparent',
    borderBottom: '10px solid transparent',
    borderLeft: '16px solid',
  },
  eventMediaCard: {
    position: 'absolute',
    width: eventCalloutCardWidth,
    height: eventCalloutCardHeight,
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
  eventMediaBody: {
    padding: '12px 17px 15px',
  },
  eventMediaDate: {
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  eventMediaTitle: {
    marginTop: 7,
    color: theme.ink,
    fontSize: 30,
    fontWeight: 950,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  eventMediaDetail: {
    marginTop: 8,
    color: 'rgba(21,22,24,0.68)',
    fontSize: 17,
    fontWeight: 760,
    lineHeight: 1.13,
    maxHeight: 58,
    overflow: 'hidden',
  },
  eventMediaStat: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  newsFeed: {
    position: 'absolute',
    left: 50,
    right: 50,
    bottom: youtubeBottomSafeArea,
    display: 'flex',
    flexDirection: 'column',
    gap: newsFeedGap,
    zIndex: 9,
  },
  newsFeedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    minHeight: newsRowHeight,
    boxSizing: 'border-box',
    padding: '8px 18px 10px',
    borderLeft: '9px solid',
    background: 'rgba(255,255,255,0.94)',
    boxShadow: '0 14px 34px rgba(20,20,20,0.12)',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  newsFeedDate: {
    flex: '0 0 auto',
    width: 170,
    fontSize: 40,
    fontWeight: 950,
    lineHeight: 1,
  },
  newsFeedTitle: {
    flex: '1 1 auto',
    minWidth: 0,
    color: theme.ink,
    fontSize: 44,
    fontWeight: 950,
    lineHeight: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  newsFeedStat: {
    flex: '0 0 auto',
    color: 'rgba(21,22,24,0.68)',
    fontSize: 40,
    fontWeight: 950,
    lineHeight: 1,
  },
} satisfies Record<string, CSSProperties>;
