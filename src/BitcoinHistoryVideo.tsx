import type { CSSProperties } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  CandlestickSeries,
  ColorType,
  createChart,
  PriceScaleMode,
  type AutoscaleInfoProvider,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';
import {
  bitcoinCandles,
  bitcoinEvents,
  bitcoinIntroEvents,
  bitcoinVideoConfig,
  eventIndexByDate,
  type BitcoinCandle,
  type BitcoinEvent,
  type BitcoinIntroEvent,
} from './bitcoinHistoryData';
import { SHORTS_PLATFORM_TOP_CLEARANCE } from './script';

type EventWithFrame = BitcoinEvent & {
  frame: number;
  index: number;
  pauseEndFrame: number;
  rangeEndFrame: number;
  rangeStartFrame: number;
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

type ChartPriceMoveLayout = {
  closeY: number;
  eventIndex: number;
  highY: number;
  lowY: number;
  openY: number;
  paneHeight: number;
  plotWidth: number;
  rangeHeight: number;
  rangeTop: number;
  x: number;
};

type VisibleLogicalRange = {
  from: number;
  to: number;
};

type PriceRange = {
  from: number;
  to: number;
};

const fontStack =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const chartWidth = 980;
const chartHeight = 780;
const chartPlotWidth = 856;
const chartPaneHeight = 738;
const rollingWindowRightPadding = 12;
const priceScaleTopMargin = 0.14;
const priceScaleBottomMargin = 0.12;
const chartLeft = 50;
const youtubeTopSafeArea = 108 + SHORTS_PLATFORM_TOP_CLEARANCE;
const youtubeBottomSafeArea = 220;
const headerTop = youtubeTopSafeArea + 6;
const priceReadoutTop = youtubeTopSafeArea + 74;
const chartTop = 454 + SHORTS_PLATFORM_TOP_CLEARANCE;
const toastBottom = youtubeBottomSafeArea + 100;
const timelineBottom = youtubeBottomSafeArea;
const introPaddingTop = 170 + SHORTS_PLATFORM_TOP_CLEARANCE;
const introSequenceFrames = 90;
const eventPauseFrames = 75;
const eventPauseBudgetRatio = 0.6;
const eventToastLeadFrames = 10;
const eventToastFrames = 195;
const liquidityRangeFrames = eventPauseFrames;
const finalHoldFrames = 75;
const fullChartRevealFrames = 90;
const postRevealHoldFrames = 90;
const outroFrames = finalHoldFrames + fullChartRevealFrames + postRevealHoldFrames;
const fullChartRightPadding = 28;
const soundtrackPath = 'audio/stake-out-alex-jones-xander-jones.mp3';
const soundtrackStartFromSeconds = 60;
const soundtrackVolume = 0.42;
const playbackScheduleCache = new Map<string, PlaybackSchedule>();
const timelineEvents = getUniqueTimelineEvents([...bitcoinEvents, ...bitcoinIntroEvents]);
const bitcoinUsdCandles = bitcoinCandles.map((candle) => ({
  time: candle.time,
  open: candle.openUsd,
  high: candle.highUsd,
  low: candle.lowUsd,
  close: candle.closeUsd,
}));

export const BitcoinHistoryVideo = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const [priceMoveLayout, setPriceMoveLayout] = useState<ChartPriceMoveLayout | null>(null);
  const chartFrame = Math.max(0, frame - introSequenceFrames);
  const chartDurationInFrames = Math.max(1, durationInFrames - introSequenceFrames);
  const isIntroSequence = frame < introSequenceFrames;
  const startIndex = 0;
  const schedule = getPlaybackSchedule(chartDurationInFrames, startIndex);
  const currentIndex = getTimelineIndex(chartFrame, schedule.segments);
  const currentCandle = bitcoinCandles[currentIndex] ?? bitcoinCandles[bitcoinCandles.length - 1];
  const previousCandle = bitcoinCandles[Math.max(0, currentIndex - 1)] ?? currentCandle;
  const dailyChangeUsd = currentCandle.closeUsd - previousCandle.closeUsd;
  const dailyChangePercent =
    previousCandle.closeUsd === 0 ? 0 : (dailyChangeUsd / previousCandle.closeUsd) * 100;
  const intro = spring({
    frame: chartFrame,
    fps,
    config: {
      damping: 24,
      mass: 0.8,
      stiffness: 120,
    },
  });
  const isOutro = chartFrame >= getOutroStartFrame(chartDurationInFrames);
  const fullChartProgress = getFullChartRevealProgress(chartFrame, chartDurationInFrames);
  const activeEvent = isIntroSequence || isOutro ? null : getActiveEvent(chartFrame, schedule.events);
  const liquidityEvent =
    isIntroSequence || isOutro ? null : getActiveLiquidityEvent(chartFrame, schedule.events);
  const handlePriceMoveLayoutChange = useCallback((layout: ChartPriceMoveLayout | null) => {
    setPriceMoveLayout((previousLayout) =>
      arePriceMoveLayoutsEqual(previousLayout, layout) ? previousLayout : layout,
    );
  }, []);

  return (
    <AbsoluteFill style={styles.stage}>
      <Audio
        src={staticFile(soundtrackPath)}
        startFrom={soundtrackStartFromSeconds * fps}
        volume={soundtrackVolume}
      />
      <div style={styles.backgroundPanel} />
      <Header intro={intro} />
      <PriceReadout
        candle={currentCandle}
        dailyChangeUsd={dailyChangeUsd}
        dailyChangePercent={dailyChangePercent}
      />
      <div style={styles.chartShell}>
        <TradingViewCandleChart
          currentIndex={currentIndex}
          fullChartProgress={fullChartProgress}
          liquidityEvent={liquidityEvent}
          onPriceMoveLayoutChange={handlePriceMoveLayoutChange}
        />
        <FullHistoryBadge progress={fullChartProgress} />
        <LiquidityRangeOverlay event={liquidityEvent} frame={chartFrame} layout={priceMoveLayout} />
        <ChartEventBadge event={activeEvent} frame={chartFrame} />
      </div>
      <EventToast
        key={activeEvent ? getEventIdentity(activeEvent) : 'event-toast-empty'}
        event={activeEvent}
        events={schedule.events}
        frame={chartFrame}
      />
      <Timeline currentIndex={currentIndex} startIndex={startIndex} />
      <TitleHookIntro frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

const introReveal = (frame: number, startFrame: number, durationFrames: number) =>
  easeOutCubic(
    interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

const TitleHookIntro = ({ frame, fps }: { frame: number; fps: number }) => {
  if (frame >= introSequenceFrames) {
    return null;
  }

  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 22,
      mass: 0.75,
      stiffness: 120,
    },
  });
  const outroOpacity = interpolate(frame, [introSequenceFrames - 14, introSequenceFrames - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleY = interpolate(entrance, [0, 1], [74, 0]);
  const titleScale = interpolate(entrance, [0, 1], [0.94, 1]);
  const eyebrowReveal = introReveal(frame, 3, 14);
  const kickerReveal = introReveal(frame, 11, 16);
  const headlineReveal = introReveal(frame, 20, 18);
  const hookReveal = introReveal(frame, 40, 18);
  const dateReveal = introReveal(frame, 55, 16);

  return (
    <div style={{ ...styles.introOverlay, opacity: outroOpacity }}>
      <div style={styles.introTopRow}>
        <div
          style={{
            ...styles.introEyebrow,
            opacity: eyebrowReveal,
            transform: `translateY(${interpolate(eyebrowReveal, [0, 1], [20, 0])}px)`,
          }}
        >
          BTC / USD 3-DAY CANDLES
        </div>
      </div>
      <div
        style={{
          ...styles.introHeroText,
          transform: `translateY(${titleY}px) scale(${titleScale})`,
        }}
      >
        <div
          style={{
            ...styles.introKicker,
            opacity: kickerReveal,
            transform: `translateY(${interpolate(kickerReveal, [0, 1], [30, 0])}px)`,
          }}
        >
          2009 - 2026
        </div>
        <div
          style={{
            ...styles.introHeadline,
            opacity: headlineReveal,
            transform: `translateY(${interpolate(headlineReveal, [0, 1], [44, 0])}px)`,
          }}
        >
          Bitcoin Price History
        </div>
        <div
          style={{
            ...styles.introHookLine,
            opacity: hookReveal,
            transform: `translateY(${interpolate(hookReveal, [0, 1], [34, 0])}px)`,
          }}
        >
          Every crash, halving, hack and ETF decision in one chart.
        </div>
      </div>
      <div
        style={{
          ...styles.introDateRange,
          opacity: dateReveal,
          transform: `translateY(${interpolate(dateReveal, [0, 1], [24, 0])}px)`,
        }}
      >
        A short history of Bitcoin, told through price.
      </div>
    </div>
  );
};

const LiquidityRangeOverlay = ({
  event,
  frame,
  layout,
}: {
  event: EventWithFrame | null;
  frame: number;
  layout: ChartPriceMoveLayout | null;
}) => {
  if (!event) {
    return null;
  }

  const candle = bitcoinCandles[event.index];

  if (!candle) {
    return null;
  }

  if (!layout || layout.eventIndex !== event.index) {
    return null;
  }

  const rangeLocalFrame = frame - event.rangeStartFrame;
  const eventLocalFrame = frame - event.frame;
  const stableRangeFrames = Math.max(1, event.rangeEndFrame - event.rangeStartFrame);
  const inOpacity = interpolate(rangeLocalFrame, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outOpacity = interpolate(
    rangeLocalFrame,
    [Math.max(12, stableRangeFrames - 18), stableRangeFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const expandProgress = easeOutCubic(
    interpolate(rangeLocalFrame, [6, 24], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const labelOpacity = interpolate(eventLocalFrame, [18, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dateMarkerOpacity = Math.min(inOpacity, outOpacity);
  const moveUsd = candle.closeUsd - candle.openUsd;
  const movePercent = candle.openUsd === 0 ? 0 : ((candle.closeUsd - candle.openUsd) / candle.openUsd) * 100;
  const isUp = moveUsd >= 0;
  const accent = isUp ? '#2F7DFF' : '#FF4D52';
  const eventAccent = getEventAccent(event.tone);
  const guideWidth = Math.max(0, Math.min(layout.plotWidth, chartPlotWidth));
  const bandHeight = Math.max(8, layout.rangeHeight);
  const bandTop = stablePixel(
    clamp(
      layout.rangeTop - Math.max(0, bandHeight - layout.rangeHeight) / 2,
      0,
      Math.max(0, layout.paneHeight - bandHeight),
    ),
  );
  const dateMarkerWidth = 184;
  const dateMarkerHeight = 38;
  const dateMarkerLeft = clamp(
    layout.x - dateMarkerWidth / 2,
    8,
    Math.max(8, guideWidth - dateMarkerWidth),
  );
  const dateMarkerTop = clamp(layout.paneHeight - dateMarkerHeight - 10, 8, chartHeight - 58);
  const labelHeightEstimate = 236;
  const labelTop = clamp(
    layout.closeY > layout.paneHeight - 130
      ? layout.closeY - labelHeightEstimate - 30
      : layout.closeY - 92,
    118,
    Math.min(layout.paneHeight, chartHeight) - labelHeightEstimate,
  );
  const opacity = Math.min(inOpacity, outOpacity);

  return (
    <div style={{ ...styles.liquidityOverlay, opacity }}>
      <div
        style={{
          ...styles.priceMoveBox,
          left: 0,
          width: guideWidth,
          top: bandTop,
          height: stablePixel(bandHeight),
          borderColor: accent,
          background: isUp
            ? 'linear-gradient(90deg, rgba(47,125,255,0.24), rgba(47,125,255,0.08))'
            : 'linear-gradient(90deg, rgba(255,77,82,0.24), rgba(255,77,82,0.08))',
          opacity: interpolate(expandProgress, [0, 1], [0.2, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />
      <div
        style={{
          ...styles.priceMoveDateLine,
          left: layout.x,
          height: layout.paneHeight,
          background: 'rgba(190,198,208,0.78)',
          opacity: 0.46 * expandProgress,
        }}
      />
      <div
        style={{
          ...styles.priceMoveDateMarker,
          left: dateMarkerLeft,
          top: dateMarkerTop,
          borderColor: eventAccent,
          opacity: dateMarkerOpacity,
        }}
      >
        <span style={{ ...styles.priceMoveDateDot, background: eventAccent }} />
        {formatDisplayDate(event.date)}
      </div>
      <div
        style={{
          ...styles.priceMoveLabel,
          top: labelTop,
          borderColor: accent,
          color: accent,
          opacity: labelOpacity,
        }}
      >
        <div style={styles.priceMoveEventTitle}>{event.title}</div>
        <div style={styles.priceMoveLabelTitle}>{formatDisplayDate(event.date)} · Price at the time</div>
        <div style={styles.priceMovePriceBlock}>
          <div style={styles.priceMovePriceKrw}>{formatUsd(candle.closeUsd)}</div>
          <div style={{ ...styles.priceMoveDeltaKrw, color: isUp ? '#22D6A8' : '#FF5C52' }}>
            ({formatSignedUsd(moveUsd)})
          </div>
          <div style={{ ...styles.priceMoveDeltaPercent, color: isUp ? '#22D6A8' : '#FF5C52' }}>
            {formatSignedPercent(movePercent)}
          </div>
        </div>
      </div>
    </div>
  );
};

const TradingViewCandleChart = ({
  currentIndex,
  fullChartProgress,
  liquidityEvent,
  onPriceMoveLayoutChange,
}: {
  currentIndex: number;
  fullChartProgress: number;
  liquidityEvent: EventWithFrame | null;
  onPriceMoveLayoutChange: (layout: ChartPriceMoveLayout | null) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lockedLayoutRef = useRef<ChartPriceMoveLayout | null>(null);
  const lockedPriceRangeRef = useRef<PriceRange | null>(null);
  const lockedVisibleRangeRef = useRef<VisibleLogicalRange | null>(null);
  const lockedEventKeyRef = useRef<string | null>(null);

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
        background: { type: ColorType.Solid, color: '#07090D' },
        textColor: 'rgba(255,255,255,0.62)',
        fontFamily: fontStack,
        fontSize: 24,
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.06)' },
        horzLines: { color: 'rgba(255,255,255,0.08)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.16)',
        minimumWidth: 124,
        mode: PriceScaleMode.Normal,
        scaleMargins: {
          top: priceScaleTopMargin,
          bottom: priceScaleBottomMargin,
        },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.16)',
        rightOffset: 0,
        barSpacing: 6,
        minBarSpacing: 0.05,
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        priceFormatter: formatUsdShort,
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
      upColor: '#22D6A8',
      downColor: '#FF5C52',
      wickUpColor: '#22D6A8',
      wickDownColor: '#FF5C52',
      borderUpColor: '#22D6A8',
      borderDownColor: '#FF5C52',
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
    const isFullChartReveal = revealProgress > 0;
    const latestIndex = bitcoinCandles.length - 1;
    const rangeIndex = isFullChartReveal ? latestIndex : currentIndex;
    const shownCandles = isFullChartReveal
      ? bitcoinUsdCandles
      : bitcoinUsdCandles.slice(0, rangeIndex + 1);
    const visibleRange = getVisibleLogicalRange(rangeIndex, revealProgress);
    const eventKey = liquidityEvent
      ? `${liquidityEvent.date}:${liquidityEvent.index}:${liquidityEvent.frame}`
      : null;

    series.setData(shownCandles);

    if (liquidityEvent && eventKey) {
      const eventVisibleRange =
        lockedEventKeyRef.current === eventKey && lockedVisibleRangeRef.current
          ? lockedVisibleRangeRef.current
          : getVisibleLogicalRange(liquidityEvent.index, 0);
      const priceRange =
        lockedEventKeyRef.current === eventKey && lockedPriceRangeRef.current
          ? lockedPriceRangeRef.current
          : getStablePriceScaleRange(liquidityEvent.index);

      chart.timeScale().setVisibleLogicalRange(eventVisibleRange);
      series.priceScale().setAutoScale(false);
      series.priceScale().setVisibleRange(priceRange);

      if (lockedEventKeyRef.current !== eventKey) {
        lockedEventKeyRef.current = eventKey;
        lockedVisibleRangeRef.current = eventVisibleRange;
        lockedPriceRangeRef.current = priceRange;
        lockedLayoutRef.current = getChartPriceMoveLayout(
          liquidityEvent.index,
          eventVisibleRange,
          priceRange,
        );
      }

      onPriceMoveLayoutChange(lockedLayoutRef.current);
      return;
    }

    chart.timeScale().setVisibleLogicalRange(visibleRange);

    if (lockedEventKeyRef.current !== null) {
      lockedEventKeyRef.current = null;
      lockedLayoutRef.current = null;
      lockedPriceRangeRef.current = null;
      lockedVisibleRangeRef.current = null;
      series.priceScale().setAutoScale(true);
    }

    onPriceMoveLayoutChange(null);
  }, [currentIndex, fullChartProgress, liquidityEvent, onPriceMoveLayoutChange]);

  return <div ref={containerRef} style={styles.chartCanvas} />;
};

const FullHistoryBadge = ({ progress }: { progress: number }) => {
  if (progress <= 0) {
    return null;
  }

  const firstCandle = bitcoinCandles[0];
  const lastCandle = bitcoinCandles[bitcoinCandles.length - 1];

  return (
    <div
      style={{
        ...styles.fullHistoryBadge,
        opacity: interpolate(progress, [0, 0.35], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      }}
    >
      <div style={styles.fullHistoryTitle}>Full History Chart</div>
      <div style={styles.fullHistoryRange}>
        {formatDisplayDate(firstCandle.time)} - {formatDisplayDate(lastCandle.time)}
      </div>
    </div>
  );
};

const ChartEventBadge = ({ event, frame }: { event: EventWithFrame | null; frame: number }) => {
  if (!event) {
    return null;
  }

  const localFrame = frame - getEventToastStartFrame(event.frame);
  const opacity = Math.min(
    interpolate(localFrame, [0, 8], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    interpolate(localFrame, [eventToastFrames - 26, eventToastFrames], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const accent = getEventAccent(event.tone);

  return (
    <div style={{ ...styles.chartEventBadge, borderLeftColor: accent, opacity }}>
      <div style={{ ...styles.chartEventDate, color: accent }}>{formatDisplayDate(event.date)}</div>
      <div style={styles.chartEventTitle}>{event.title}</div>
    </div>
  );
};

const Header = ({ intro }: { intro: number }) => {
  const y = interpolate(intro, [0, 1], [-28, 0]);

  return (
    <div style={{ ...styles.header, opacity: intro, transform: `translateY(${y}px)` }}>
      <div style={styles.templateBadge}>Bitcoin</div>
      <div style={styles.title}>{bitcoinVideoConfig.title}</div>
      <div style={styles.subtitle}>{bitcoinVideoConfig.subtitle}</div>
    </div>
  );
};

const PriceReadout = ({
  candle,
  dailyChangeUsd,
  dailyChangePercent,
}: {
  candle: Pick<BitcoinCandle, 'time' | 'close' | 'closeUsd'>;
  dailyChangeUsd: number;
  dailyChangePercent: number;
}) => {
  const isUp = dailyChangeUsd >= 0;

  return (
    <div style={styles.priceReadout}>
      <div style={styles.dateLabel}>BTC / USD 3-Day Candles</div>
      <div style={styles.currentDate}>{formatDisplayDate(candle.time)}</div>
      <div style={styles.currentPrice}>{formatUsd(candle.closeUsd)}</div>
      <div style={{ ...styles.changePill, color: isUp ? '#22D6A8' : '#FF5C52' }}>
        {formatSignedUsd(dailyChangeUsd)} · {formatSignedPercent(dailyChangePercent)}
      </div>
    </div>
  );
};

const EventToast = ({
  event,
  events,
  frame,
}: {
  event: EventWithFrame | null;
  events: EventWithFrame[];
  frame: number;
}) => {
  if (!event) {
    return null;
  }

  const history = getEventHistory(event, events);
  const localFrame = frame - getEventToastStartFrame(event.frame);
  const inOpacity = interpolate(localFrame, [0, 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outOpacity = interpolate(localFrame, [eventToastFrames - 18, eventToastFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(localFrame, [0, 18], [36, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(inOpacity, outOpacity);

  return (
    <div
      style={{
        ...styles.toastStack,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      {history.map((historyEvent, position) => {
        const accent = getEventAccent(historyEvent.tone);
        const isCurrent = position === 0;

        if (isCurrent) {
          return (
            <div
              key={`${historyEvent.date}-${historyEvent.title}`}
              style={{
                ...styles.toast,
                borderLeftColor: accent,
              }}
            >
              <div style={{ ...styles.toastDate, color: accent }}>
                {formatDisplayDate(historyEvent.date)}
              </div>
              <div style={styles.toastTitle}>{historyEvent.title}</div>
              <div style={styles.toastDetail}>{historyEvent.detail}</div>
            </div>
          );
        }

        return (
          <div
            key={`${historyEvent.date}-${historyEvent.title}`}
            style={{
              ...styles.toastHistoryItem,
              borderLeftColor: accent,
              opacity: position === 1 ? 0.58 : 0.36,
            }}
          >
            <div style={styles.toastHistoryHeader}>
              <span style={{ ...styles.toastHistoryDate, color: accent }}>
                {formatDisplayDate(historyEvent.date)}
              </span>
              <span style={styles.toastHistoryLabel}>Previous</span>
            </div>
            <div style={styles.toastHistoryTitle}>{historyEvent.title}</div>
          </div>
        );
      })}
    </div>
  );
};

const Timeline = ({ currentIndex, startIndex }: { currentIndex: number; startIndex: number }) => {
  const progress = Math.min(
    100,
    (Math.max(0, currentIndex - startIndex) /
      Math.max(1, bitcoinCandles.length - 1 - startIndex)) *
      100,
  );

  return (
    <div style={styles.timelineWrap}>
      <div style={styles.timelineTrack}>
        <div style={{ ...styles.timelineFill, width: `${progress}%` }} />
      </div>
      <div style={styles.sourceNote}>
        © 2026 whoa. · Music credit: Stake Out - Alex Jones & Xander Jones · All music rights belong to their respective owners
      </div>
    </div>
  );
};

const getPlaybackSchedule = (durationInFrames: number, startIndex: number): PlaybackSchedule => {
  const cacheKey = `${durationInFrames}:${startIndex}`;
  const cached = playbackScheduleCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const playbackRange = Math.max(1, bitcoinCandles.length - 1 - startIndex);
  const playbackEndFrame = getPlaybackEndFrame(durationInFrames);
  const eventCandidates = timelineEvents
    .map((event) => ({
      ...event,
      index: eventIndexByDate.get(event.date) ?? -1,
    }))
    .filter((event) => event.index >= startIndex && event.index < bitcoinCandles.length - 1)
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
      pauseEndFrame,
      rangeEndFrame: pauseEndFrame,
      rangeStartFrame: eventFrame,
    });

    previousIndex = event.index;
    previousMoveFrame = moveFrame;
    pauseOffset += pauseFrames;
  });

  let groupStartIndex = 0;

  while (groupStartIndex < events.length) {
    let groupEndIndex = groupStartIndex;

    while (
      groupEndIndex + 1 < events.length &&
      events[groupEndIndex + 1].index === events[groupStartIndex].index &&
      events[groupEndIndex + 1].frame <= events[groupEndIndex].pauseEndFrame + 1
    ) {
      groupEndIndex += 1;
    }

    const rangeStartFrame = events[groupStartIndex].frame;
    const rangeEndFrame = events[groupEndIndex].pauseEndFrame;

    for (let index = groupStartIndex; index <= groupEndIndex; index += 1) {
      events[index].rangeStartFrame = rangeStartFrame;
      events[index].rangeEndFrame = rangeEndFrame;
    }

    groupStartIndex = groupEndIndex + 1;
  }

  segments.push({
    type: 'move',
    fromFrame: previousMoveFrame + pauseOffset,
    toFrame: playbackEndFrame,
    fromIndex: previousIndex,
    toIndex: bitcoinCandles.length - 1,
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
    const index = Math.floor(lerp(segment.fromIndex, segment.toIndex, progress));

    return Math.min(segment.toIndex, index);
  }

  const lastSegment = segments[segments.length - 1];

  return lastSegment?.type === 'pause' ? lastSegment.index : lastSegment?.toIndex ?? bitcoinCandles.length - 1;
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
    const toastStartFrame = getEventToastStartFrame(event.frame);

    if (frame >= toastStartFrame && frame <= toastStartFrame + eventToastFrames) {
      return event;
    }
  }

  return null;
};

function getUniqueTimelineEvents(events: BitcoinEvent[]) {
  const seenDates = new Set<string>();

  return events
    .filter((event) => {
      if (seenDates.has(event.date)) {
        return false;
      }

      seenDates.add(event.date);
      return true;
    })
    .sort((firstEvent, secondEvent) => firstEvent.date.localeCompare(secondEvent.date));
}

const getEventIdentity = (event: Pick<BitcoinEvent, 'date' | 'title'>) =>
  `${event.date}:${event.title}`;

const getEventHistory = (event: EventWithFrame, events: EventWithFrame[]) => {
  const activeIndex = events.findIndex(
    (historyEvent) =>
      getEventIdentity(historyEvent) === getEventIdentity(event) &&
      historyEvent.frame === event.frame,
  );

  if (activeIndex < 0) {
    return [event];
  }

  const previousEvents: EventWithFrame[] = [];
  const seenPreviousEvents = new Set<string>();

  for (let index = activeIndex - 1; index >= 0 && previousEvents.length < 2; index -= 1) {
    const previousEvent = events[index];
    const identity = getEventIdentity(previousEvent);

    if (seenPreviousEvents.has(identity) || identity === getEventIdentity(event)) {
      continue;
    }

    seenPreviousEvents.add(identity);
    previousEvents.push(previousEvent);
  }

  return [event, ...previousEvents];
};

const getEventAccent = (tone: BitcoinEvent['tone']) =>
  tone === 'bullish' ? '#22D6A8' : tone === 'bearish' ? '#FF5C52' : '#F6C85F';

const getEventToastStartFrame = (eventFrame: number) => Math.max(0, eventFrame - eventToastLeadFrames);

const getActiveLiquidityEvent = (frame: number, events: EventWithFrame[]) => {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    const liquidityEndFrame = Math.min(event.frame + liquidityRangeFrames, event.pauseEndFrame);

    if (frame >= event.frame && frame <= liquidityEndFrame) {
      return event;
    }
  }

  return null;
};

const getChartPriceMoveLayout = (
  eventIndex: number,
  visibleRange: VisibleLogicalRange,
  priceRange: PriceRange,
): ChartPriceMoveLayout | null => {
  const candle = bitcoinCandles[eventIndex] ?? bitcoinCandles[bitcoinCandles.length - 1];
  const paneHeight = chartPaneHeight;
  const plotWidth = chartPlotWidth;
  const x = logicalToStableCoordinate(eventIndex, visibleRange, plotWidth);
  const openY = priceToStableCoordinate(candle.openUsd, priceRange, paneHeight);
  const highY = priceToStableCoordinate(candle.highUsd, priceRange, paneHeight);
  const lowY = priceToStableCoordinate(candle.lowUsd, priceRange, paneHeight);
  const closeY = priceToStableCoordinate(candle.closeUsd, priceRange, paneHeight);
  const clampedHighY = stablePixel(clamp(Number(highY), 0, paneHeight));
  const clampedLowY = stablePixel(clamp(Number(lowY), 0, paneHeight));
  const rawTop = Math.min(clampedHighY, clampedLowY);
  const rawHeight = Math.abs(clampedLowY - clampedHighY);
  const rangeHeight = Math.max(2, rawHeight);
  const rangeTop = clamp(
    rawTop - Math.max(0, rangeHeight - rawHeight) / 2,
    0,
    Math.max(0, paneHeight - rangeHeight),
  );

  return {
    closeY: stablePixel(clamp(Number(closeY), 0, paneHeight)),
    eventIndex,
    highY: clampedHighY,
    lowY: clampedLowY,
    openY: stablePixel(clamp(Number(openY), 0, paneHeight)),
    paneHeight: stablePixel(paneHeight),
    plotWidth: stablePixel(plotWidth),
    rangeHeight: stablePixel(rangeHeight),
    rangeTop: stablePixel(rangeTop),
    x: stablePixel(clamp(Number(x), 0, plotWidth)),
  };
};

const getVisibleLogicalRange = (
  rangeIndex: number,
  fullChartProgress: number,
): VisibleLogicalRange => {
  const latestIndex = bitcoinCandles.length - 1;
  const revealProgress = clamp(fullChartProgress, 0, 1);
  const rollingFrom = getRollingWindowStartIndex(rangeIndex);
  const rollingTo = rangeIndex + rollingWindowRightPadding;

  if (revealProgress <= 0) {
    return {
      from: rollingFrom,
      to: rollingTo,
    };
  }

  return {
    from: lerp(rollingFrom, 0, revealProgress),
    to: lerp(rollingTo, latestIndex + fullChartRightPadding, revealProgress),
  };
};

const getStablePriceScaleRange = (eventIndex: number): PriceRange => {
  const from = getRollingWindowStartIndex(eventIndex);
  const visibleCandles = bitcoinCandles.slice(from, eventIndex + 1);
  let high = Number.NEGATIVE_INFINITY;
  let low = Number.POSITIVE_INFINITY;

  for (const candle of visibleCandles) {
    high = Math.max(high, candle.highUsd);
    low = Math.min(low, candle.lowUsd);
  }

  if (!Number.isFinite(high) || !Number.isFinite(low)) {
    return { from: 0, to: 1 };
  }

  if (high <= low) {
    const minRange = Math.max(1, Math.abs(high) * 0.08);

    return {
      from: Math.max(0, low - minRange / 2),
      to: high + minRange / 2,
    };
  }

  const range = high - low;
  const padding = Math.max(1, range * 0.12);

  return {
    from: Math.max(0, low - padding),
    to: high + padding,
  };
};

const logicalToStableCoordinate = (
  logicalIndex: number,
  visibleRange: VisibleLogicalRange,
  plotWidth: number,
) => {
  const range = Math.max(0.000001, visibleRange.to - visibleRange.from);

  return ((logicalIndex - visibleRange.from) / range) * plotWidth;
};

const priceToStableCoordinate = (
  price: number,
  priceRange: PriceRange,
  paneHeight: number,
) => {
  const topMargin = paneHeight * priceScaleTopMargin;
  const bottomMargin = paneHeight * priceScaleBottomMargin;
  const drawableHeight = Math.max(1, paneHeight - topMargin - bottomMargin);
  const range = Math.max(0.000001, priceRange.to - priceRange.from);
  const progress = clamp((priceRange.to - price) / range, 0, 1);

  return topMargin + progress * drawableHeight;
};

const getRollingWindowStartIndex = (currentIndex: number) =>
  Math.max(0, currentIndex - bitcoinVideoConfig.visibleCandles + 1);

const arePriceMoveLayoutsEqual = (
  firstLayout: ChartPriceMoveLayout | null,
  secondLayout: ChartPriceMoveLayout | null,
) => {
  if (firstLayout === secondLayout) {
    return true;
  }

  if (!firstLayout || !secondLayout || firstLayout.eventIndex !== secondLayout.eventIndex) {
    return false;
  }

  return (
    Math.abs(firstLayout.closeY - secondLayout.closeY) < 0.25 &&
    Math.abs(firstLayout.highY - secondLayout.highY) < 0.25 &&
    Math.abs(firstLayout.lowY - secondLayout.lowY) < 0.25 &&
    Math.abs(firstLayout.openY - secondLayout.openY) < 0.25 &&
    Math.abs(firstLayout.paneHeight - secondLayout.paneHeight) < 0.25 &&
    Math.abs(firstLayout.plotWidth - secondLayout.plotWidth) < 0.25 &&
    Math.abs(firstLayout.rangeHeight - secondLayout.rangeHeight) < 0.25 &&
    Math.abs(firstLayout.rangeTop - secondLayout.rangeTop) < 0.25 &&
    Math.abs(firstLayout.x - secondLayout.x) < 0.25
  );
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const stablePixel = (value: number) => Math.round(value);

const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;

const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3;

const formatUsdShort = (value: number) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (value === 0) {
    return '$0';
  }

  if (abs < 1) {
    return `${sign}$${abs.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })}`;
  }

  if (abs >= 1000000) {
    return `${sign}$${trimNumber(abs / 1000000)}M`;
  }

  if (abs >= 1000) {
    return `${sign}$${trimNumber(abs / 1000)}K`;
  }

  return `${sign}$${trimNumber(abs)}`;
};

const formatUsd = (value: number) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs === 0) {
    return '$0';
  }

  if (abs < 1) {
    return `${sign}$${abs.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })}`;
  }

  if (abs < 100) {
    return `${sign}$${abs.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (abs < 1000) {
    return `${sign}$${abs.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })}`;
  }

  return `${sign}$${Math.round(abs).toLocaleString('en-US')}`;
};

const formatSignedUsd = (value: number) => `${value >= 0 ? '+' : '-'}${formatUsd(Math.abs(value))}`;

const trimNumber = (value: number) =>
  value.toFixed(value >= 10 ? 0 : 1).replace(/\.0$/, '');

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDisplayDate = (date: string) => {
  const [year, month, day] = date.split('-');
  const monthIndex = Number(month) - 1;

  if (!year || !day || monthIndex < 0 || monthIndex >= monthNames.length) {
    return date;
  }

  return `${monthNames[monthIndex]} ${day}, ${year}`;
};

const formatSignedPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

const styles = {
  stage: {
    backgroundColor: '#05070A',
    color: '#FFFFFF',
    fontFamily: fontStack,
    overflow: 'hidden',
  },
  backgroundPanel: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, #05070A 0%, #0B1016 40%, #05070A 100%), linear-gradient(90deg, rgba(34,214,168,0.08), rgba(255,92,82,0.06))',
  },
  introOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 30,
    overflow: 'hidden',
    padding: `${introPaddingTop}px 70px 140px`,
    background: '#000000',
  },
  introBackdrop: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(circle at 82% 20%, rgba(47,125,255,0.22) 0%, rgba(47,125,255,0) 34%), radial-gradient(circle at 16% 72%, rgba(34,214,168,0.2) 0%, rgba(34,214,168,0) 36%), linear-gradient(180deg, rgba(5,7,10,0.98) 0%, rgba(8,13,18,0.99) 48%, #05070A 100%)',
  },
  introGrid: {
    position: 'absolute',
    inset: 0,
    opacity: 0.42,
    backgroundImage:
      'linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)',
    backgroundSize: '86px 86px',
  },
  introLightSweep: {
    position: 'absolute',
    top: -120,
    bottom: -120,
    width: 180,
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)',
    filter: 'blur(4px)',
  },
  introFlash: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, rgba(34,214,168,0.14), rgba(255,255,255,0.22), rgba(255,92,82,0.1))',
  },
  introTopRow: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  introEyebrow: {
    position: 'relative',
    color: 'rgba(255,255,255,0.58)',
    fontSize: 26,
    fontWeight: 950,
    letterSpacing: 0,
  },
  introDateRange: {
    position: 'absolute',
    left: 70,
    right: 70,
    bottom: 270,
    color: 'rgba(255,255,255,0.64)',
    fontSize: 32,
    fontWeight: 950,
    lineHeight: 1.18,
  },
  introHeroText: {
    position: 'relative',
    marginTop: 290,
    transformOrigin: 'left top',
  },
  introKicker: {
    color: '#22D6A8',
    fontSize: 42,
    fontWeight: 950,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  introHeadline: {
    marginTop: 24,
    maxWidth: 910,
    color: '#FFFFFF',
    fontSize: 116,
    fontWeight: 950,
    lineHeight: 0.92,
    letterSpacing: 0,
  },
  introHookLine: {
    marginTop: 30,
    maxWidth: 820,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 38,
    fontWeight: 850,
    lineHeight: 1.18,
  },
  introTagRow: {
    position: 'relative',
    display: 'flex',
    gap: 12,
    marginTop: 40,
  },
  introTag: {
    padding: '11px 15px 12px',
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.055)',
    color: 'rgba(255,255,255,0.72)',
    fontSize: 22,
    fontWeight: 900,
    lineHeight: 1,
  },
  introChartStage: {
    position: 'absolute',
    left: 70,
    right: 70,
    bottom: 186,
    height: 610,
    borderTop: '1px solid rgba(255,255,255,0.11)',
    borderBottom: '1px solid rgba(255,255,255,0.11)',
    background: 'linear-gradient(180deg, rgba(7,10,14,0.14), rgba(7,10,14,0.74))',
    overflow: 'hidden',
  },
  introChartLabel: {
    position: 'absolute',
    left: 0,
    top: 24,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 24,
    fontWeight: 950,
  },
  introChartPrice: {
    position: 'absolute',
    right: 0,
    top: 18,
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 950,
    fontVariantNumeric: 'tabular-nums',
  },
  introChartBaseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    height: 2,
    background: 'rgba(255,255,255,0.18)',
  },
  introChartRevealMask: {
    position: 'absolute',
    left: 0,
    bottom: 80,
    height: 500,
    overflow: 'hidden',
  },
  introCandleRow: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'flex-end',
    gap: 30,
    width: 940,
    height: 500,
  },
  introCandleSlot: {
    position: 'relative',
    width: 58,
    height: 500,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  introCandleWick: {
    position: 'absolute',
    bottom: 0,
    width: 4,
  },
  introCandleBody: {
    position: 'absolute',
    bottom: 0,
    width: 38,
  },
  introSparkLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 248,
    height: 3,
    background: 'linear-gradient(90deg, rgba(34,214,168,0), #22D6A8 34%, #F6C85F 70%, #FF5C52)',
    boxShadow: '0 0 28px rgba(34,214,168,0.42)',
    transform: 'rotate(-16deg)',
    transformOrigin: 'left center',
  },
  introBottomRail: {
    position: 'absolute',
    left: 70,
    right: 70,
    bottom: 96,
    height: 10,
    background: 'rgba(255,255,255,0.16)',
  },
  introProgressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #22D6A8, #F6C85F)',
  },
  header: {
    position: 'absolute',
    left: 70,
    top: headerTop,
    width: 610,
    zIndex: 5,
  },
  templateBadge: {
    width: 190,
    padding: '11px 15px',
    border: '1px solid rgba(255,255,255,0.22)',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 23,
    fontWeight: 900,
    textAlign: 'center',
  },
  title: {
    marginTop: 30,
    color: '#FFFFFF',
    fontSize: 78,
    fontWeight: 950,
    lineHeight: 0.96,
    letterSpacing: 0,
  },
  subtitle: {
    width: 640,
    marginTop: 18,
    color: 'rgba(255,255,255,0.64)',
    fontSize: 30,
    fontWeight: 750,
    lineHeight: 1.22,
  },
  priceReadout: {
    position: 'absolute',
    right: 58,
    top: priceReadoutTop,
    width: 430,
    textAlign: 'right',
    zIndex: 6,
  },
  dateLabel: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 24,
    fontWeight: 900,
  },
  currentDate: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 46,
    fontWeight: 950,
  },
  currentPrice: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: 950,
    lineHeight: 0.98,
  },
  currentPriceUsd: {
    marginTop: 9,
    color: 'rgba(255,255,255,0.58)',
    fontSize: 32,
    fontWeight: 850,
    lineHeight: 1,
  },
  changePill: {
    marginTop: 16,
    fontSize: 27,
    fontWeight: 900,
  },
  chartShell: {
    position: 'absolute',
    left: chartLeft,
    top: chartTop,
    width: chartWidth,
    height: chartHeight,
    border: '1px solid rgba(255,255,255,0.14)',
    background: '#07090D',
    overflow: 'hidden',
    zIndex: 2,
  },
  chartCanvas: {
    width: chartWidth,
    height: chartHeight,
  },
  fullHistoryBadge: {
    position: 'absolute',
    left: 24,
    top: 24,
    padding: '12px 16px 14px',
    background: 'rgba(6,9,13,0.9)',
    border: '1px solid rgba(255,255,255,0.18)',
    boxShadow: '0 16px 44px rgba(0,0,0,0.34)',
    zIndex: 6,
  },
  fullHistoryTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 950,
    lineHeight: 1,
  },
  fullHistoryRange: {
    marginTop: 7,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 20,
    fontWeight: 850,
    lineHeight: 1,
  },
  chartEventBadge: {
    position: 'absolute',
    left: 24,
    top: 24,
    width: 420,
    padding: '16px 20px 18px',
    borderLeft: '8px solid',
    background: 'rgba(6,9,13,0.9)',
    boxShadow: '0 16px 46px rgba(0,0,0,0.38)',
    zIndex: 6,
  },
  chartEventDate: {
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1,
  },
  chartEventTitle: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 950,
    lineHeight: 1.08,
  },
  liquidityOverlay: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 5,
  },
  priceMoveBox: {
    position: 'absolute',
    boxSizing: 'border-box',
    borderTop: '2px solid',
    borderBottom: '2px solid',
    boxShadow: '0 0 30px rgba(255,255,255,0.1) inset',
    willChange: 'opacity',
  },
  priceMoveDateLine: {
    position: 'absolute',
    top: 0,
    width: 2,
    transform: 'translateX(-1px)',
  },
  priceMoveDateMarker: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: 184,
    height: 38,
    boxSizing: 'border-box',
    padding: '0 12px',
    border: '1px solid',
    background: 'rgba(6,9,13,0.92)',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1,
    boxShadow: '0 10px 26px rgba(0,0,0,0.35)',
  },
  priceMoveDateDot: {
    width: 8,
    height: 8,
    flex: '0 0 auto',
  },
  priceMoveLabel: {
    position: 'absolute',
    left: 24,
    width: 430,
    padding: '18px 21px 20px',
    background: 'rgba(6,9,13,0.88)',
    border: '1px solid',
    boxShadow: '0 18px 54px rgba(0,0,0,0.36)',
    textAlign: 'left',
  },
  priceMoveEventTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 950,
    lineHeight: 1.08,
  },
  priceMoveLabelTitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 19,
    fontWeight: 950,
  },
  priceMovePriceBlock: {
    marginTop: 12,
  },
  priceMovePriceKrw: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: 950,
    lineHeight: 0.98,
    whiteSpace: 'nowrap',
  },
  priceMovePriceUsd: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.66)',
    fontSize: 23,
    fontWeight: 900,
    lineHeight: 1,
  },
  priceMoveDeltaKrw: {
    marginTop: 9,
    fontSize: 22,
    fontWeight: 950,
    lineHeight: 1,
  },
  priceMoveDeltaPercent: {
    marginTop: 7,
    fontSize: 31,
    fontWeight: 950,
    lineHeight: 1,
  },
  toastStack: {
    position: 'absolute',
    left: 70,
    right: 70,
    bottom: toastBottom,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    zIndex: 8,
  },
  toast: {
    padding: '25px 34px 28px',
    borderLeft: '10px solid',
    background: 'rgba(8,11,16,0.98)',
    boxShadow: '0 18px 60px rgba(0,0,0,0.46)',
  },
  toastDate: {
    fontSize: 24,
    fontWeight: 950,
  },
  toastTitle: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: 950,
    lineHeight: 1,
  },
  toastDetail: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 28,
    fontWeight: 750,
    lineHeight: 1.24,
  },
  toastHistoryItem: {
    padding: '15px 24px 17px',
    borderLeft: '8px solid',
    background: 'rgba(8,11,16,0.82)',
    boxShadow: '0 14px 42px rgba(0,0,0,0.28)',
  },
  toastHistoryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
  },
  toastHistoryDate: {
    fontSize: 19,
    fontWeight: 950,
  },
  toastHistoryLabel: {
    color: 'rgba(255,255,255,0.44)',
    fontSize: 17,
    fontWeight: 900,
  },
  toastHistoryTitle: {
    marginTop: 5,
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: 900,
    lineHeight: 1.08,
  },
  timelineWrap: {
    position: 'absolute',
    left: 70,
    right: 70,
    bottom: timelineBottom,
    zIndex: 6,
  },
  timelineTrack: {
    width: '100%',
    height: 10,
    background: 'rgba(255,255,255,0.16)',
  },
  timelineFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #22D6A8, #F6C85F, #FF5C52)',
  },
  sourceNote: {
    marginTop: 24,
    color: 'rgba(255,255,255,0.52)',
    fontSize: 22,
    fontWeight: 750,
    lineHeight: 1.25,
  },
} satisfies Record<string, CSSProperties>;
