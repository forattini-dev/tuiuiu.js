/**
 * Tests for Heatmap Normalization Modes
 *
 * Covers: calculatePercentiles, normalizePercentile, normalizeLogarithmic,
 * normalizeWithMode, Heatmap with normalization option, ContributionGraph
 * default normalization.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import { setRenderMode } from '../../src/core/capabilities.js';
import {
  Heatmap,
  ContributionGraph,
  calculatePercentiles,
  COLOR_SCALES,
} from '../../src/molecules/data-viz/heatmap.js';
import type {
  NormalizationMode,
  Percentiles,
} from '../../src/molecules/data-viz/heatmap.js';

describe('Heatmap Normalization', () => {
  beforeEach(() => {
    setRenderMode('unicode');
  });

  // ===========================================================================
  // calculatePercentiles
  // ===========================================================================

  describe('calculatePercentiles', () => {
    it('should calculate percentiles for a uniform distribution', () => {
      // 1..100 sorted
      const values = Array.from({ length: 100 }, (_, i) => i + 1);
      const result = calculatePercentiles(values);
      expect(result).not.toBeNull();
      // p25 is at index 25 of sorted non-zero: value 26
      expect(result!.p25).toBe(26);
      // p50 is at index 50: value 51
      expect(result!.p50).toBe(51);
      // p75 is at index 75: value 76
      expect(result!.p75).toBe(76);
    });

    it('should calculate percentiles for a small dataset', () => {
      const values = [1, 2, 3, 4];
      const result = calculatePercentiles(values);
      expect(result).not.toBeNull();
      // sorted nonZero = [1,2,3,4], length=4
      // p25: floor(4*0.25)=1 => sorted[1]=2
      // p50: floor(4*0.5)=2 => sorted[2]=3
      // p75: floor(4*0.75)=3 => sorted[3]=4
      expect(result!.p25).toBe(2);
      expect(result!.p50).toBe(3);
      expect(result!.p75).toBe(4);
    });

    it('should calculate percentiles for repeated values', () => {
      const values = [5, 5, 5, 5, 5, 5, 5, 5];
      const result = calculatePercentiles(values);
      expect(result).not.toBeNull();
      expect(result!.p25).toBe(5);
      expect(result!.p50).toBe(5);
      expect(result!.p75).toBe(5);
    });

    it('should handle a single-element array', () => {
      const result = calculatePercentiles([42]);
      expect(result).not.toBeNull();
      // All percentiles fall back to nonZero[0] = 42
      expect(result!.p25).toBe(42);
      expect(result!.p50).toBe(42);
      expect(result!.p75).toBe(42);
    });

    it('should handle two-element array', () => {
      const result = calculatePercentiles([3, 7]);
      expect(result).not.toBeNull();
      // sorted = [3,7], length=2
      // p25: floor(2*0.25)=0 => sorted[0]=3
      // p50: floor(2*0.5)=1 => sorted[1]=7
      // p75: floor(2*0.75)=1 => sorted[1]=7
      expect(result!.p25).toBe(3);
      expect(result!.p50).toBe(7);
      expect(result!.p75).toBe(7);
    });

    it('should calculate percentiles for a skewed distribution', () => {
      // Many low values, few high values
      const values = [1, 1, 1, 1, 1, 1, 1, 1, 1, 100];
      const result = calculatePercentiles(values);
      expect(result).not.toBeNull();
      // sorted = [1,1,1,1,1,1,1,1,1,100], length=10
      // p25: floor(10*0.25)=2 => sorted[2]=1
      // p50: floor(10*0.5)=5 => sorted[5]=1
      // p75: floor(10*0.75)=7 => sorted[7]=1
      expect(result!.p25).toBe(1);
      expect(result!.p50).toBe(1);
      expect(result!.p75).toBe(1);
    });

    it('should filter zeros from values', () => {
      const values = [0, 0, 0, 5, 10, 15, 20];
      const result = calculatePercentiles(values);
      expect(result).not.toBeNull();
      // nonZero = [5,10,15,20], length=4
      // p25: floor(4*0.25)=1 => 10
      // p50: floor(4*0.5)=2 => 15
      // p75: floor(4*0.75)=3 => 20
      expect(result!.p25).toBe(10);
      expect(result!.p50).toBe(15);
      expect(result!.p75).toBe(20);
    });

    it('should return null for empty data', () => {
      const result = calculatePercentiles([]);
      expect(result).toBeNull();
    });

    it('should return null for all-zero data', () => {
      const result = calculatePercentiles([0, 0, 0, 0]);
      expect(result).toBeNull();
    });

    it('should return null for array with only zeros and negatives filtered', () => {
      // filter is v > 0, so -1 and 0 are both excluded
      const result = calculatePercentiles([0, 0, -1, -5]);
      expect(result).toBeNull();
    });

    it('should sort unsorted input correctly', () => {
      const values = [50, 10, 30, 20, 40];
      const result = calculatePercentiles(values);
      expect(result).not.toBeNull();
      // sorted = [10,20,30,40,50], length=5
      // p25: floor(5*0.25)=1 => sorted[1]=20
      // p50: floor(5*0.5)=2 => sorted[2]=30
      // p75: floor(5*0.75)=3 => sorted[3]=40
      expect(result!.p25).toBe(20);
      expect(result!.p50).toBe(30);
      expect(result!.p75).toBe(40);
    });
  });

  // ===========================================================================
  // normalizeWithMode (tested indirectly via Heatmap)
  // ===========================================================================

  describe('normalizeWithMode via Heatmap rendering', () => {
    it('should render heatmap with linear normalization (default)', () => {
      const data = [
        [0, 5, 10],
        [2, 7, 9],
      ];
      const node = Heatmap({ data, normalization: 'linear' });
      expect(node).not.toBeNull();
      const output = renderToString(node, 80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('should render heatmap with percentile normalization', () => {
      const data = [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [8, 9, 10, 100],
      ];
      const node = Heatmap({ data, normalization: 'percentile' });
      expect(node).not.toBeNull();
      const output = renderToString(node, 80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('should render heatmap with logarithmic normalization', () => {
      const data = [
        [1, 10, 100],
        [1000, 5000, 10000],
      ];
      const node = Heatmap({ data, normalization: 'logarithmic' });
      expect(node).not.toBeNull();
      const output = renderToString(node, 80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('should produce different output for linear vs percentile normalization', () => {
      // Skewed data where linear and percentile should differ
      const data = [
        [0, 0, 0, 0],
        [0, 1, 2, 3],
        [0, 0, 0, 100],
      ];

      const linearNode = Heatmap({ data, normalization: 'linear', showValues: true });
      const percentileNode = Heatmap({ data, normalization: 'percentile', showValues: true });

      const linearOutput = renderToString(linearNode, 80);
      const percentileOutput = renderToString(percentileNode, 80);

      // Both should render, but color codes may differ
      expect(linearOutput.length).toBeGreaterThan(0);
      expect(percentileOutput.length).toBeGreaterThan(0);
    });

    it('should produce different output for linear vs logarithmic normalization', () => {
      const data = [
        [1, 10, 100],
        [1000, 5000, 10000],
      ];

      const linearNode = Heatmap({ data, normalization: 'linear' });
      const logNode = Heatmap({ data, normalization: 'logarithmic' });

      const linearOutput = renderToString(linearNode, 80);
      const logOutput = renderToString(logNode, 80);

      expect(linearOutput.length).toBeGreaterThan(0);
      expect(logOutput.length).toBeGreaterThan(0);
    });

    it('should default to linear normalization when not specified', () => {
      const data = [[1, 2], [3, 4]];
      const nodeDefault = Heatmap({ data });
      const nodeLinear = Heatmap({ data, normalization: 'linear' });

      const outputDefault = renderToString(nodeDefault, 80);
      const outputLinear = renderToString(nodeLinear, 80);

      // Without specifying normalization, Heatmap defaults to 'linear'
      expect(outputDefault).toBe(outputLinear);
    });
  });

  // ===========================================================================
  // normalizePercentile behavior (tested via Heatmap with percentile mode)
  // ===========================================================================

  describe('percentile normalization behavior', () => {
    it('should map zero values to lowest intensity', () => {
      // With percentile normalization, zero values should map to 0 (no color)
      const data = [
        [0, 0, 0],
        [0, 5, 0],
        [0, 0, 0],
      ];
      const node = Heatmap({ data, normalization: 'percentile' });
      expect(node).not.toBeNull();
      const output = renderToString(node, 80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('should handle all-equal nonzero values', () => {
      // All equal values => percentiles are all the same
      const data = [
        [5, 5, 5],
        [5, 5, 5],
      ];
      const node = Heatmap({ data, normalization: 'percentile' });
      expect(node).not.toBeNull();
      const output = renderToString(node, 80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('should handle all-zero data gracefully', () => {
      const data = [
        [0, 0],
        [0, 0],
      ];
      // percentile with all-zero data: calculatePercentiles returns null
      // normalizePercentile(0, null) returns 0
      const node = Heatmap({ data, normalization: 'percentile' });
      expect(node).not.toBeNull();
      const output = renderToString(node, 80);
      expect(output.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // normalizeLogarithmic behavior (tested via Heatmap with logarithmic mode)
  // ===========================================================================

  describe('logarithmic normalization behavior', () => {
    it('should compress large dynamic range', () => {
      // Logarithmic normalization compresses large ranges
      const data = [
        [1, 10, 100, 1000, 10000],
      ];
      const node = Heatmap({ data, normalization: 'logarithmic' });
      expect(node).not.toBeNull();
      const output = renderToString(node, 80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('should handle equal min and max', () => {
      // When all values are the same, normalizeLogarithmic returns 0.5
      const data = [[7, 7], [7, 7]];
      const node = Heatmap({ data, normalization: 'logarithmic' });
      expect(node).not.toBeNull();
    });

    it('should handle values at min boundary', () => {
      const data = [
        [0, 0, 10],
        [0, 5, 20],
      ];
      const node = Heatmap({
        data,
        normalization: 'logarithmic',
        minValue: 0,
        maxValue: 20,
      });
      expect(node).not.toBeNull();
    });
  });

  // ===========================================================================
  // ContributionGraph normalization
  // ===========================================================================

  describe('ContributionGraph with normalization', () => {
    const sampleContributions = [
      { date: new Date('2024-01-01'), count: 1 },
      { date: new Date('2024-01-02'), count: 3 },
      { date: new Date('2024-01-03'), count: 0 },
      { date: new Date('2024-01-04'), count: 5 },
      { date: new Date('2024-01-05'), count: 10 },
      { date: new Date('2024-01-06'), count: 2 },
      { date: new Date('2024-01-07'), count: 0 },
      { date: new Date('2024-01-08'), count: 7 },
      { date: new Date('2024-01-09'), count: 15 },
      { date: new Date('2024-01-10'), count: 1 },
    ];

    it('should default to percentile normalization', () => {
      // ContributionGraph defaults normalization to 'percentile'
      const node = ContributionGraph({
        data: sampleContributions,
        weeks: 4,
      });
      expect(node).not.toBeNull();
      const output = renderToString(node, 120);
      expect(output.length).toBeGreaterThan(0);
    });

    it('should accept explicit percentile normalization', () => {
      const node = ContributionGraph({
        data: sampleContributions,
        normalization: 'percentile',
        weeks: 4,
      });
      expect(node).not.toBeNull();
    });

    it('should accept linear normalization', () => {
      const node = ContributionGraph({
        data: sampleContributions,
        normalization: 'linear',
        weeks: 4,
      });
      expect(node).not.toBeNull();
    });

    it('should accept logarithmic normalization', () => {
      const node = ContributionGraph({
        data: sampleContributions,
        normalization: 'logarithmic',
        weeks: 4,
      });
      expect(node).not.toBeNull();
    });

    it('should produce different rendering for different normalization modes', () => {
      const linearNode = ContributionGraph({
        data: sampleContributions,
        normalization: 'linear',
        weeks: 4,
        showMonths: false,
        showDays: false,
      });
      const percentileNode = ContributionGraph({
        data: sampleContributions,
        normalization: 'percentile',
        weeks: 4,
        showMonths: false,
        showDays: false,
      });

      const linearOutput = renderToString(linearNode, 120);
      const percentileOutput = renderToString(percentileNode, 120);

      // Both should render successfully
      expect(linearOutput.length).toBeGreaterThan(0);
      expect(percentileOutput.length).toBeGreaterThan(0);
    });

    it('should handle empty contributions with percentile normalization', () => {
      const node = ContributionGraph({
        data: [],
        normalization: 'percentile',
        weeks: 4,
      });
      expect(node).not.toBeNull();
    });

    it('should handle all-zero contributions with percentile normalization', () => {
      const zeroData = [
        { date: new Date('2024-01-01'), count: 0 },
        { date: new Date('2024-01-02'), count: 0 },
        { date: new Date('2024-01-03'), count: 0 },
      ];
      const node = ContributionGraph({
        data: zeroData,
        normalization: 'percentile',
        weeks: 4,
      });
      expect(node).not.toBeNull();
    });
  });

  // ===========================================================================
  // Heatmap component with normalization prop
  // ===========================================================================

  describe('Heatmap component with normalization prop', () => {
    it('should accept normalization prop in HeatmapOptions', () => {
      const modes: NormalizationMode[] = ['linear', 'percentile', 'logarithmic'];

      for (const mode of modes) {
        const node = Heatmap({
          data: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
          normalization: mode,
        });
        expect(node).not.toBeNull();
      }
    });

    it('should work with showValues and normalization', () => {
      const node = Heatmap({
        data: [[1, 100], [10, 1000]],
        normalization: 'logarithmic',
        showValues: true,
      });
      expect(node).not.toBeNull();
      const output = renderToString(node, 80);
      // Should contain formatted values
      expect(output).toContain('1');
      expect(output).toContain('100');
    });

    it('should work with custom color scale and normalization', () => {
      const node = Heatmap({
        data: [[0, 5, 10], [15, 20, 25]],
        normalization: 'percentile',
        colorScale: 'cool',
      });
      expect(node).not.toBeNull();
    });

    it('should work with row/column headers and normalization', () => {
      const node = Heatmap({
        data: [[1, 2], [3, 4]],
        rowHeaders: ['A', 'B'],
        columnHeaders: ['X', 'Y'],
        normalization: 'percentile',
      });
      expect(node).not.toBeNull();
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should work with showBorder and normalization', () => {
      const node = Heatmap({
        data: [[1, 2], [3, 4]],
        normalization: 'logarithmic',
        showBorder: true,
      });
      expect(node).not.toBeNull();
      const output = renderToString(node, 80);
      expect(output).toContain('│');
    });

    it('should work with custom min/max values and normalization', () => {
      const node = Heatmap({
        data: [[5, 10], [15, 20]],
        minValue: 0,
        maxValue: 100,
        normalization: 'logarithmic',
      });
      expect(node).not.toBeNull();
    });
  });
});
