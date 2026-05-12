import { useEffect, useRef, useCallback } from 'react';
import { createChart, type IChartApi, type ISeriesApi, type CandlestickData } from 'lightweight-charts';

// =============================================================================
// Props Interface
// =============================================================================

interface CandlestickChartProps {
  data: CandlestickData[];
  isLoading?: boolean;
  height?: number; // default 300
}

// =============================================================================
// Constants
// =============================================================================

const CHART_COLORS = {
  up: '#10B981',
  down: '#EF4444',
  dark: {
    background: '#0F172A',
    text: '#E2E8F0',
    grid: '#1E293B',
  },
  light: {
    background: '#FFFFFF',
    text: '#1E293B',
    grid: '#E2E8F0',
  },
} as const;

const DEFAULT_HEIGHT = 300;

// =============================================================================
// Component
// =============================================================================

export function CandlestickChart({ data, isLoading, height = DEFAULT_HEIGHT }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  /**
   * Creates and configures the chart instance.
   * Called once on mount, never recreated on data changes.
   */
  const createChartInstance = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const isDark = document.documentElement.classList.contains('dark');

    const chart = createChart(container, {
      layout: {
        background: { color: isDark ? CHART_COLORS.dark.background : CHART_COLORS.light.background },
        textColor: isDark ? CHART_COLORS.dark.text : CHART_COLORS.light.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      grid: {
        vertLines: { color: isDark ? CHART_COLORS.dark.grid : CHART_COLORS.light.grid },
        horzLines: { color: isDark ? CHART_COLORS.dark.grid : CHART_COLORS.light.grid },
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
        vertLine: {
          color: isDark ? '#475569' : '#94A3B8',
          labelBackgroundColor: isDark ? '#475569' : '#94A3B8',
        },
        horzLine: {
          color: isDark ? '#475569' : '#94A3B8',
          labelBackgroundColor: isDark ? '#475569' : '#94A3B8',
        },
      },
      rightPriceScale: {
        borderColor: isDark ? CHART_COLORS.dark.grid : CHART_COLORS.light.grid,
      },
      timeScale: {
        borderColor: isDark ? CHART_COLORS.dark.grid : CHART_COLORS.light.grid,
        timeVisible: true,
        secondsVisible: false,
      },
      autoSize: false,
      height,
    });

    const series = chart.addCandlestickSeries({
      upColor: CHART_COLORS.up,
      downColor: CHART_COLORS.down,
      borderUpColor: CHART_COLORS.up,
      borderDownColor: CHART_COLORS.down,
      wickUpColor: CHART_COLORS.up,
      wickDownColor: CHART_COLORS.down,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Set initial data if provided
    if (data.length > 0) {
      series.setData(data);
      chart.timeScale().fitContent();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]); // Only recreate if height changes; data is handled by a separate effect

  /**
   * Updates chart data when it changes.
   * Uses setData() on the existing series - never recreates chart.
   */
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    if (data.length > 0) {
      seriesRef.current.setData(data);
      chartRef.current.timeScale().fitContent();
    }
  }, [data]);

  /**
   * Sets up ResizeObserver for responsive chart sizing.
   */
  useEffect(() => {
    if (!containerRef.current || !chartRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        chartRef.current?.applyOptions({ width });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /**
   * Observes theme changes and updates chart colors.
   */
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class' &&
          chartRef.current
        ) {
          const isDark = document.documentElement.classList.contains('dark');
          
          chartRef.current.applyOptions({
            layout: {
              background: { color: isDark ? CHART_COLORS.dark.background : CHART_COLORS.light.background },
              textColor: isDark ? CHART_COLORS.dark.text : CHART_COLORS.light.text,
            },
            grid: {
              vertLines: { color: isDark ? CHART_COLORS.dark.grid : CHART_COLORS.light.grid },
              horzLines: { color: isDark ? CHART_COLORS.dark.grid : CHART_COLORS.light.grid },
            },
            rightPriceScale: {
              borderColor: isDark ? CHART_COLORS.dark.grid : CHART_COLORS.light.grid,
            },
            timeScale: {
              borderColor: isDark ? CHART_COLORS.dark.grid : CHART_COLORS.light.grid,
            },
          });
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  /**
   * Initial chart creation.
   */
  useEffect(() => {
    createChartInstance();

    return () => {
      // Cleanup: Destroy chart instance
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [createChartInstance]);

  // Render skeleton during loading
  if (isLoading) {
    return (
      <div
        className="w-full animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg"
        style={{ height }}
        aria-label="Loading chart data"
        role="status"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full relative"
      style={{ height }}
      aria-label="Candlestick price chart"
      role="img"
    />
  );
}
