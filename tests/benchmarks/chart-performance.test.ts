/**
 * Performance Benchmarks: Data Visualization Components
 *
 * Tests rendering performance of chart components with various data sizes.
 * These benchmarks help ensure performance doesn't regress.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  renderToString,
  Sparkline,
  BarChart,
  LineChart,
  Gauge,
  Heatmap,
  setRenderMode,
  setTheme,
  darkTheme,
  DEFAULT_ZONES,
} from '../../src/index.js';

// =============================================================================
// Test Utilities
// =============================================================================

interface BenchmarkResult {
  name: string;
  dataSize: number;
  iterations: number;
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  opsPerSec: number;
}

function benchmark(
  name: string,
  fn: () => void,
  iterations: number = 100
): BenchmarkResult {
  const times: number[] = [];

  // Warm up
  for (let i = 0; i < 5; i++) {
    fn();
  }

  // Benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  const totalMs = times.reduce((a, b) => a + b, 0);
  const avgMs = totalMs / iterations;
  const minMs = Math.min(...times);
  const maxMs = Math.max(...times);
  const opsPerSec = 1000 / avgMs;

  return {
    name,
    dataSize: 0,
    iterations,
    totalMs,
    avgMs,
    minMs,
    maxMs,
    opsPerSec,
  };
}

function generateRandomData(size: number, min = 0, max = 100): number[] {
  return Array.from({ length: size }, () => Math.random() * (max - min) + min);
}

function generateBarChartData(
  size: number
): Array<{ label: string; value: number }> {
  return Array.from({ length: size }, (_, i) => ({
    label: `Item ${i + 1}`,
    value: Math.random() * 100,
  }));
}

function generateLineChartData(
  size: number
): Array<{ x: number; y: number }> {
  return Array.from({ length: size }, (_, i) => ({
    x: i,
    y: Math.random() * 100,
  }));
}

function generateHeatmapData(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.random() * 100)
  );
}

// =============================================================================
// Performance Thresholds
// =============================================================================

// Maximum acceptable average render time in milliseconds
const THRESHOLDS = {
  sparkline: {
    small: 5, // 10 points
    medium: 10, // 100 points
    large: 50, // 1000 points
  },
  barChart: {
    small: 5, // 5 bars
    medium: 10, // 20 bars
    large: 50, // 100 bars
  },
  lineChart: {
    small: 10, // 20 points
    medium: 25, // 100 points
    large: 100, // 500 points
  },
  gauge: {
    single: 5, // Single gauge
  },
  heatmap: {
    small: 10, // 5x5
    medium: 50, // 10x10
    large: 200, // 20x20
  },
};

describe('Performance Benchmarks: Chart Components', () => {
  beforeEach(() => {
    setTheme(darkTheme);
    setRenderMode('unicode');
  });

  afterEach(() => {
    setRenderMode('unicode');
  });

  // ===========================================================================
  // Sparkline Benchmarks
  // ===========================================================================

  describe('Sparkline Performance', () => {
    it('renders small datasets (10 points) efficiently', () => {
      const data = generateRandomData(10);
      const result = benchmark('sparkline-small', () => {
        const vnode = Sparkline({ data, width: 20 });
        renderToString(vnode, 30, 5);
      });

      expect(result.avgMs).toBeLessThan(THRESHOLDS.sparkline.small);
      expect(result.opsPerSec).toBeGreaterThan(200);
    });

    it('renders medium datasets (100 points) efficiently', () => {
      const data = generateRandomData(100);
      const result = benchmark('sparkline-medium', () => {
        const vnode = Sparkline({ data, width: 50 });
        renderToString(vnode, 60, 5);
      });

      expect(result.avgMs).toBeLessThan(THRESHOLDS.sparkline.medium);
      expect(result.opsPerSec).toBeGreaterThan(100);
    });

    it('renders large datasets (1000 points) reasonably', () => {
      const data = generateRandomData(1000);
      const result = benchmark(
        'sparkline-large',
        () => {
          const vnode = Sparkline({ data, width: 80 });
          renderToString(vnode, 100, 5);
        },
        50
      );

      expect(result.avgMs).toBeLessThan(THRESHOLDS.sparkline.large);
    });

    it('scales linearly with data size', () => {
      const sizes = [10, 50, 100, 200];
      const results: Array<{ size: number; avgMs: number }> = [];

      for (const size of sizes) {
        const data = generateRandomData(size);
        const result = benchmark(
          `sparkline-${size}`,
          () => {
            const vnode = Sparkline({ data, width: Math.min(size, 80) });
            renderToString(vnode, 100, 5);
          },
          50
        );
        results.push({ size, avgMs: result.avgMs });
      }

      // Check that scaling is roughly linear (not exponential)
      // Time for 200 points should be less than 10x time for 10 points
      const ratio = results[3].avgMs / results[0].avgMs;
      expect(ratio).toBeLessThan(20); // Allow 20x for 20x data
    });

    it('performs similarly in ASCII mode', () => {
      const data = generateRandomData(100);

      const unicodeResult = benchmark('sparkline-unicode', () => {
        setRenderMode('unicode');
        const vnode = Sparkline({ data, width: 50 });
        renderToString(vnode, 60, 5);
      });

      setRenderMode('ascii');
      const asciiResult = benchmark('sparkline-ascii', () => {
        const vnode = Sparkline({ data, width: 50, style: 'ascii' });
        renderToString(vnode, 60, 5);
      });

      // ASCII should be similar or faster
      expect(asciiResult.avgMs).toBeLessThan(unicodeResult.avgMs * 2);
    });
  });

  // ===========================================================================
  // BarChart Benchmarks
  // ===========================================================================

  describe('BarChart Performance', () => {
    it('renders small datasets (5 bars) efficiently', () => {
      const data = generateBarChartData(5);
      const result = benchmark('barchart-small', () => {
        const vnode = BarChart({ data, width: 40 });
        renderToString(vnode, 50, 10);
      });

      expect(result.avgMs).toBeLessThan(THRESHOLDS.barChart.small);
      expect(result.opsPerSec).toBeGreaterThan(200);
    });

    it('renders medium datasets (20 bars) efficiently', () => {
      const data = generateBarChartData(20);
      const result = benchmark('barchart-medium', () => {
        const vnode = BarChart({ data, width: 60 });
        renderToString(vnode, 70, 25);
      });

      expect(result.avgMs).toBeLessThan(THRESHOLDS.barChart.medium);
      expect(result.opsPerSec).toBeGreaterThan(100);
    });

    it('renders large datasets (100 bars) reasonably', () => {
      const data = generateBarChartData(100);
      const result = benchmark(
        'barchart-large',
        () => {
          const vnode = BarChart({ data, width: 80 });
          renderToString(vnode, 100, 110);
        },
        25
      );

      expect(result.avgMs).toBeLessThan(THRESHOLDS.barChart.large);
    });

    it('horizontal vs vertical performance is similar', () => {
      const data = generateBarChartData(20);

      const horizontalResult = benchmark('barchart-horizontal', () => {
        const vnode = BarChart({ data, width: 60, orientation: 'horizontal' });
        renderToString(vnode, 70, 25);
      });

      const verticalResult = benchmark('barchart-vertical', () => {
        const vnode = BarChart({ data, width: 60, orientation: 'vertical' });
        renderToString(vnode, 70, 25);
      });

      // Should be within 3x of each other
      const ratio = Math.max(
        horizontalResult.avgMs / verticalResult.avgMs,
        verticalResult.avgMs / horizontalResult.avgMs
      );
      expect(ratio).toBeLessThan(3);
    });
  });

  // ===========================================================================
  // LineChart Benchmarks
  // ===========================================================================

  describe('LineChart Performance', () => {
    it('renders small datasets (20 points) efficiently', () => {
      const data = generateLineChartData(20);
      const result = benchmark('linechart-small', () => {
        const vnode = LineChart({
          series: [{ name: 'Test', data, color: 'cyan' }],
          width: 40,
          height: 10,
        });
        renderToString(vnode, 50, 15);
      });

      expect(result.avgMs).toBeLessThan(THRESHOLDS.lineChart.small);
      expect(result.opsPerSec).toBeGreaterThan(100);
    });

    it('renders medium datasets (100 points) efficiently', () => {
      const data = generateLineChartData(100);
      const result = benchmark('linechart-medium', () => {
        const vnode = LineChart({
          series: [{ name: 'Test', data, color: 'cyan' }],
          width: 60,
          height: 15,
        });
        renderToString(vnode, 70, 20);
      });

      expect(result.avgMs).toBeLessThan(THRESHOLDS.lineChart.medium);
    });

    it('renders large datasets (500 points) reasonably', () => {
      const data = generateLineChartData(500);
      const result = benchmark(
        'linechart-large',
        () => {
          const vnode = LineChart({
            series: [{ name: 'Test', data, color: 'cyan' }],
            width: 80,
            height: 20,
          });
          renderToString(vnode, 100, 25);
        },
        25
      );

      expect(result.avgMs).toBeLessThan(THRESHOLDS.lineChart.large);
    });

    it('multi-series performance scales reasonably', () => {
      const data = generateLineChartData(50);

      const singleResult = benchmark('linechart-1series', () => {
        const vnode = LineChart({
          series: [{ name: 'A', data, color: 'cyan' }],
          width: 60,
          height: 15,
        });
        renderToString(vnode, 70, 20);
      });

      const multiResult = benchmark('linechart-3series', () => {
        const vnode = LineChart({
          series: [
            { name: 'A', data, color: 'cyan' },
            { name: 'B', data: generateLineChartData(50), color: 'green' },
            { name: 'C', data: generateLineChartData(50), color: 'yellow' },
          ],
          width: 60,
          height: 15,
        });
        renderToString(vnode, 70, 20);
      });

      // 3 series should take less than 5x the time of 1 series
      expect(multiResult.avgMs).toBeLessThan(singleResult.avgMs * 5);
    });
  });

  // ===========================================================================
  // Gauge Benchmarks
  // ===========================================================================

  describe('Gauge Performance', () => {
    it('renders single gauge efficiently', () => {
      const result = benchmark('gauge-single', () => {
        const vnode = Gauge({
          value: 75,
          max: 100,
          style: 'arc',
          zones: DEFAULT_ZONES,
        });
        renderToString(vnode, 30, 10);
      });

      expect(result.avgMs).toBeLessThan(THRESHOLDS.gauge.single);
      expect(result.opsPerSec).toBeGreaterThan(200);
    });

    it('renders all gauge styles efficiently', () => {
      const styles: Array<'arc' | 'semicircle' | 'linear'> = [
        'arc',
        'semicircle',
        'linear',
      ];
      const results: Array<{ style: string; avgMs: number }> = [];

      for (const style of styles) {
        const result = benchmark(`gauge-${style}`, () => {
          const vnode = Gauge({
            value: 75,
            max: 100,
            style,
            zones: DEFAULT_ZONES,
          });
          renderToString(vnode, 30, 10);
        });
        results.push({ style, avgMs: result.avgMs });
      }

      // All styles should render in under 5ms on average
      for (const r of results) {
        expect(r.avgMs).toBeLessThan(5);
      }
    });

    it('multiple gauges render efficiently', () => {
      const result = benchmark(
        'gauge-multiple',
        () => {
          for (let i = 0; i < 10; i++) {
            const vnode = Gauge({
              value: i * 10,
              max: 100,
              style: 'linear',
              zones: DEFAULT_ZONES,
            });
            renderToString(vnode, 30, 5);
          }
        },
        50
      );

      // 10 gauges should render in under 20ms total
      expect(result.avgMs).toBeLessThan(20);
    });
  });

  // ===========================================================================
  // Heatmap Benchmarks
  // ===========================================================================

  describe('Heatmap Performance', () => {
    it('renders small heatmaps (5x5) efficiently', () => {
      const data = generateHeatmapData(5, 5);
      const result = benchmark('heatmap-small', () => {
        const vnode = Heatmap({
          data,
          rowHeaders: ['A', 'B', 'C', 'D', 'E'],
          columnHeaders: ['1', '2', '3', '4', '5'],
        });
        renderToString(vnode, 40, 10);
      });

      expect(result.avgMs).toBeLessThan(THRESHOLDS.heatmap.small);
      expect(result.opsPerSec).toBeGreaterThan(100);
    });

    it('renders medium heatmaps (10x10) efficiently', () => {
      const data = generateHeatmapData(10, 10);
      const rowHeaders = Array.from({ length: 10 }, (_, i) => `R${i}`);
      const colHeaders = Array.from({ length: 10 }, (_, i) => `C${i}`);

      const result = benchmark('heatmap-medium', () => {
        const vnode = Heatmap({
          data,
          rowHeaders,
          columnHeaders: colHeaders,
        });
        renderToString(vnode, 60, 15);
      });

      expect(result.avgMs).toBeLessThan(THRESHOLDS.heatmap.medium);
    });

    it('renders large heatmaps (20x20) reasonably', () => {
      const data = generateHeatmapData(20, 20);
      const rowHeaders = Array.from({ length: 20 }, (_, i) => `R${i}`);
      const colHeaders = Array.from({ length: 20 }, (_, i) => `C${i}`);

      const result = benchmark(
        'heatmap-large',
        () => {
          const vnode = Heatmap({
            data,
            rowHeaders,
            columnHeaders: colHeaders,
          });
          renderToString(vnode, 100, 25);
        },
        25
      );

      expect(result.avgMs).toBeLessThan(THRESHOLDS.heatmap.large);
    });

    it('color scale performance is consistent', () => {
      const data = generateHeatmapData(10, 10);
      const rowHeaders = Array.from({ length: 10 }, (_, i) => `R${i}`);
      const colHeaders = Array.from({ length: 10 }, (_, i) => `C${i}`);

      const scales: Array<'heat' | 'cool' | 'viridis' | 'grayscale'> = [
        'heat',
        'cool',
        'viridis',
        'grayscale',
      ];
      const results: Array<{ scale: string; avgMs: number }> = [];

      for (const colorScale of scales) {
        const result = benchmark(`heatmap-${colorScale}`, () => {
          const vnode = Heatmap({
            data,
            rowHeaders,
            columnHeaders: colHeaders,
            colorScale,
          });
          renderToString(vnode, 60, 15);
        });
        results.push({ scale: colorScale, avgMs: result.avgMs });
      }

      // All color scales should perform similarly (within 2x)
      const times = results.map((r) => r.avgMs);
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      expect(maxTime / minTime).toBeLessThan(2);
    });
  });

  // ===========================================================================
  // Comparative Benchmarks
  // ===========================================================================

  describe('Comparative Performance', () => {
    it('all charts render within acceptable time for typical dashboard', () => {
      // Simulate a typical dashboard with multiple chart components
      const sparklineData = generateRandomData(50);
      const barData = generateBarChartData(10);
      const lineData = generateLineChartData(30);
      const heatmapData = generateHeatmapData(7, 7);

      const result = benchmark(
        'dashboard-typical',
        () => {
          // Render all chart types
          renderToString(Sparkline({ data: sparklineData, width: 40 }), 50, 5);
          renderToString(BarChart({ data: barData, width: 40 }), 50, 12);
          renderToString(
            LineChart({
              series: [{ name: 'Requests', data: lineData, color: 'cyan' }],
              width: 40,
              height: 10,
            }),
            50,
            15
          );
          renderToString(
            Gauge({ value: 75, max: 100, zones: DEFAULT_ZONES }),
            30,
            10
          );
          renderToString(
            Heatmap({
              data: heatmapData,
              rowHeaders: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
              columnHeaders: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
            }),
            50,
            10
          );
        },
        50
      );

      // Full dashboard should render in under 50ms
      expect(result.avgMs).toBeLessThan(50);
    });

    it('rendering is consistent across multiple iterations', () => {
      const data = generateRandomData(100);
      const times: number[] = [];

      for (let i = 0; i < 20; i++) {
        const start = performance.now();
        const vnode = Sparkline({ data, width: 50 });
        renderToString(vnode, 60, 5);
        times.push(performance.now() - start);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const variance =
        times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length;
      const stdDev = Math.sqrt(variance);

      // Standard deviation should be less than 50% of average (consistent performance)
      expect(stdDev / avg).toBeLessThan(0.5);
    });
  });

  // ===========================================================================
  // Memory Efficiency (basic checks)
  // ===========================================================================

  describe('Memory Efficiency', () => {
    it('does not leak memory across renders', () => {
      const data = generateRandomData(100);

      // Get initial memory (if available)
      const initialMemory =
        process.memoryUsage?.().heapUsed ?? 0;

      // Render many times
      for (let i = 0; i < 1000; i++) {
        const vnode = Sparkline({ data, width: 50 });
        renderToString(vnode, 60, 5);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage?.().heapUsed ?? 0;

      // Memory increase should be reasonable (less than 10MB)
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('large datasets do not cause excessive memory usage', () => {
      const initialMemory =
        process.memoryUsage?.().heapUsed ?? 0;

      // Render with large dataset
      const largeData = generateRandomData(10000);
      const vnode = Sparkline({ data: largeData, width: 80 });
      renderToString(vnode, 100, 5);

      const afterMemory = process.memoryUsage?.().heapUsed ?? 0;

      // Memory for rendering should be less than 5MB
      const memoryUsed = afterMemory - initialMemory;
      expect(memoryUsed).toBeLessThan(5 * 1024 * 1024);
    });
  });
});
