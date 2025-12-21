/**
 * Tests for Canvas Widget
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Canvas,
  createCanvas,
  // Braille utilities
  createBrailleBuffer,
  setBrailleDot,
  brailleBufferToString,
  // Block utilities
  createBlockBuffer,
  setBlockPixel,
  blockBufferToString,
  // Drawing algorithms
  bresenhamLine,
  midpointCircle,
  filledCircle,
  midpointEllipse,
  arcPoints,
  bezierCurve,
  quadraticBezier,
  polygonPoints,
  filledPolygon,
  rectanglePoints,
  filledRectangle,
  // Utility functions
  drawSparkline,
  drawBarChart,
  drawScatterPlot,
  type Point,
  type CanvasMode,
} from '../../src/primitives/canvas.js';

describe('Canvas Widget', () => {
  describe('Braille Utilities', () => {
    it('should create braille buffer', () => {
      const buffer = createBrailleBuffer(10, 5);

      // 10 chars * 2 = 20 dots wide
      // 5 chars * 4 = 20 dots tall
      expect(buffer.length).toBe(20);
      expect(buffer[0]!.length).toBe(20);
    });

    it('should set braille dots', () => {
      const buffer = createBrailleBuffer(5, 5);

      setBrailleDot(buffer, 0, 0, true);
      setBrailleDot(buffer, 1, 1, true);

      expect(buffer[0]![0]).toBe(true);
      expect(buffer[1]![1]).toBe(true);
      expect(buffer[0]![1]).toBe(false);
    });

    it('should handle out of bounds safely', () => {
      const buffer = createBrailleBuffer(5, 5);

      // Should not throw
      setBrailleDot(buffer, -1, 0, true);
      setBrailleDot(buffer, 100, 100, true);
    });

    it('should convert braille buffer to string', () => {
      const buffer = createBrailleBuffer(2, 1);

      // Set some dots
      setBrailleDot(buffer, 0, 0, true);
      setBrailleDot(buffer, 1, 1, true);

      const output = brailleBufferToString(buffer);

      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe('Block Utilities', () => {
    it('should create block buffer', () => {
      const buffer = createBlockBuffer(10, 5);

      // 10 chars * 2 = 20 pixels wide
      // 5 chars * 2 = 10 pixels tall
      expect(buffer.length).toBe(10);
      expect(buffer[0]!.length).toBe(20);
    });

    it('should set block pixels', () => {
      const buffer = createBlockBuffer(5, 5);

      setBlockPixel(buffer, 0, 0, true);
      setBlockPixel(buffer, 1, 1, true);

      expect(buffer[0]![0]).toBe(true);
      expect(buffer[1]![1]).toBe(true);
    });

    it('should convert block buffer to string', () => {
      const buffer = createBlockBuffer(4, 2);

      // Full block (all 4 pixels set)
      setBlockPixel(buffer, 0, 0, true);
      setBlockPixel(buffer, 1, 0, true);
      setBlockPixel(buffer, 0, 1, true);
      setBlockPixel(buffer, 1, 1, true);

      const output = blockBufferToString(buffer);

      expect(output).toContain('█');
    });

    it('should render half blocks correctly', () => {
      const buffer = createBlockBuffer(2, 2);

      // Top half only
      setBlockPixel(buffer, 0, 0, true);
      setBlockPixel(buffer, 1, 0, true);

      const output = blockBufferToString(buffer);

      expect(output).toContain('▀');
    });

    it('should render quarter blocks correctly', () => {
      const buffer = createBlockBuffer(2, 2);

      // Top left only
      setBlockPixel(buffer, 0, 0, true);

      const output = blockBufferToString(buffer);

      expect(output).toContain('▘');
    });
  });

  describe('Drawing Algorithms', () => {
    describe('bresenhamLine', () => {
      it('should draw horizontal line', () => {
        const points = bresenhamLine(0, 0, 5, 0);

        expect(points.length).toBe(6);
        expect(points[0]).toEqual({ x: 0, y: 0 });
        expect(points[5]).toEqual({ x: 5, y: 0 });
      });

      it('should draw vertical line', () => {
        const points = bresenhamLine(0, 0, 0, 5);

        expect(points.length).toBe(6);
        expect(points[0]).toEqual({ x: 0, y: 0 });
        expect(points[5]).toEqual({ x: 0, y: 5 });
      });

      it('should draw diagonal line', () => {
        const points = bresenhamLine(0, 0, 5, 5);

        expect(points.length).toBe(6);
        expect(points[0]).toEqual({ x: 0, y: 0 });
        expect(points[5]).toEqual({ x: 5, y: 5 });
      });

      it('should handle reverse direction', () => {
        const points = bresenhamLine(5, 5, 0, 0);

        expect(points.length).toBe(6);
        expect(points[0]).toEqual({ x: 5, y: 5 });
        expect(points[5]).toEqual({ x: 0, y: 0 });
      });

      it('should handle steep lines', () => {
        const points = bresenhamLine(0, 0, 2, 5);

        expect(points.length).toBeGreaterThan(5);
        expect(points[0]).toEqual({ x: 0, y: 0 });
        expect(points[points.length - 1]).toEqual({ x: 2, y: 5 });
      });
    });

    describe('midpointCircle', () => {
      it('should draw circle with radius 0', () => {
        const points = midpointCircle(5, 5, 0);

        expect(points.length).toBe(1);
        expect(points[0]).toEqual({ x: 5, y: 5 });
      });

      it('should draw circle with radius 1', () => {
        const points = midpointCircle(5, 5, 1);

        expect(points.length).toBeGreaterThan(1);
      });

      it('should draw larger circles', () => {
        const points = midpointCircle(10, 10, 5);

        expect(points.length).toBeGreaterThan(20);

        // All points should be approximately 5 units from center
        for (const p of points) {
          const dist = Math.sqrt((p.x - 10) ** 2 + (p.y - 10) ** 2);
          expect(dist).toBeCloseTo(5, 0);
        }
      });
    });

    describe('filledCircle', () => {
      it('should fill circle', () => {
        const points = filledCircle(5, 5, 3);

        expect(points.length).toBeGreaterThan(midpointCircle(5, 5, 3).length);

        // All points should be within radius
        for (const p of points) {
          const dist = Math.sqrt((p.x - 5) ** 2 + (p.y - 5) ** 2);
          expect(dist).toBeLessThanOrEqual(3.5);
        }
      });
    });

    describe('midpointEllipse', () => {
      it('should handle zero radius', () => {
        const points = midpointEllipse(5, 5, 0, 0);

        expect(points.length).toBe(1);
      });

      it('should draw ellipse', () => {
        const points = midpointEllipse(10, 10, 5, 3);

        expect(points.length).toBeGreaterThan(10);
      });

      it('should draw circle when rx === ry', () => {
        const ellipsePoints = midpointEllipse(10, 10, 5, 5);
        const circlePoints = midpointCircle(10, 10, 5);

        // Should have similar number of points
        expect(Math.abs(ellipsePoints.length - circlePoints.length)).toBeLessThan(10);
      });
    });

    describe('arcPoints', () => {
      it('should draw quarter arc', () => {
        const points = arcPoints(10, 10, 5, 0, 90);

        expect(points.length).toBeGreaterThan(5);
      });

      it('should draw full circle arc', () => {
        const points = arcPoints(10, 10, 5, 0, 360);

        expect(points.length).toBeGreaterThan(20);
      });
    });

    describe('bezierCurve', () => {
      it('should draw cubic bezier', () => {
        const points = bezierCurve(
          { x: 0, y: 0 },
          { x: 10, y: 20 },
          { x: 20, y: 20 },
          { x: 30, y: 0 }
        );

        expect(points.length).toBe(51); // steps + 1
        expect(points[0]).toEqual({ x: 0, y: 0 });
        expect(points[50]).toEqual({ x: 30, y: 0 });
      });
    });

    describe('quadraticBezier', () => {
      it('should draw quadratic bezier', () => {
        const points = quadraticBezier(
          { x: 0, y: 0 },
          { x: 15, y: 30 },
          { x: 30, y: 0 }
        );

        expect(points.length).toBe(51);
        expect(points[0]).toEqual({ x: 0, y: 0 });
        expect(points[50]).toEqual({ x: 30, y: 0 });
      });
    });

    describe('polygonPoints', () => {
      it('should draw triangle', () => {
        const vertices: Point[] = [
          { x: 10, y: 0 },
          { x: 20, y: 15 },
          { x: 0, y: 15 },
        ];

        const points = polygonPoints(vertices);

        expect(points.length).toBeGreaterThan(30);
      });

      it('should handle single point', () => {
        const points = polygonPoints([{ x: 5, y: 5 }]);
        expect(points.length).toBe(0);
      });
    });

    describe('filledPolygon', () => {
      it('should fill triangle', () => {
        const vertices: Point[] = [
          { x: 10, y: 0 },
          { x: 20, y: 10 },
          { x: 0, y: 10 },
        ];

        const filled = filledPolygon(vertices);
        const outline = polygonPoints(vertices);

        expect(filled.length).toBeGreaterThan(outline.length);
      });

      it('should fill rectangle', () => {
        const vertices: Point[] = [
          { x: 0, y: 0 },
          { x: 5, y: 0 },
          { x: 5, y: 5 },
          { x: 0, y: 5 },
        ];

        const points = filledPolygon(vertices);

        // Should have approximately width * height points
        expect(points.length).toBeGreaterThan(20);
      });
    });

    describe('rectanglePoints', () => {
      it('should draw rectangle outline', () => {
        const points = rectanglePoints(0, 0, 10, 5);

        // Should have perimeter points
        expect(points.length).toBe(2 * 10 + 2 * (5 - 2));
      });
    });

    describe('filledRectangle', () => {
      it('should fill rectangle', () => {
        const points = filledRectangle(0, 0, 5, 5);

        expect(points.length).toBe(25);
      });

      it('should create correct coordinates', () => {
        const points = filledRectangle(2, 3, 2, 2);

        expect(points).toContainEqual({ x: 2, y: 3 });
        expect(points).toContainEqual({ x: 3, y: 4 });
      });
    });
  });

  describe('Canvas Class', () => {
    describe('Construction', () => {
      it('should create canvas with default options', () => {
        const canvas = createCanvas({ width: 20, height: 10 });

        expect(canvas.dimensions).toEqual({ width: 20, height: 10 });
      });

      it('should create canvas in braille mode', () => {
        const canvas = createCanvas({ width: 20, height: 10, mode: 'braille' });

        expect(canvas.resolution).toEqual({ width: 40, height: 40 });
      });

      it('should create canvas in block mode', () => {
        const canvas = createCanvas({ width: 20, height: 10, mode: 'block' });

        expect(canvas.resolution).toEqual({ width: 40, height: 20 });
      });
    });

    describe('setPixel / getPixel', () => {
      it('should set and get pixels in character mode', () => {
        const canvas = createCanvas({ width: 10, height: 5 });

        canvas.setPixel(3, 2, 'X');

        expect(canvas.getPixel(3, 2)).toBe('X');
      });

      it('should use default fill char', () => {
        const canvas = createCanvas({ width: 10, height: 5 });

        canvas.setPixel(3, 2);

        expect(canvas.getPixel(3, 2)).toBe('█');
      });

      it('should ignore out of bounds', () => {
        const canvas = createCanvas({ width: 10, height: 5 });

        // Should not throw
        canvas.setPixel(-1, 0);
        canvas.setPixel(100, 100);

        expect(canvas.getPixel(-1, 0)).toBe(' ');
      });
    });

    describe('line', () => {
      it('should draw line', () => {
        const canvas = createCanvas({ width: 10, height: 5 });

        canvas.line(0, 0, 9, 0);

        expect(canvas.getPixel(0, 0)).not.toBe(' ');
        expect(canvas.getPixel(5, 0)).not.toBe(' ');
        expect(canvas.getPixel(9, 0)).not.toBe(' ');
      });

      it('should draw line with custom char', () => {
        const canvas = createCanvas({ width: 10, height: 5 });

        canvas.line(0, 0, 5, 0, '-');

        expect(canvas.getPixel(0, 0)).toBe('-');
      });
    });

    describe('rect', () => {
      it('should draw rectangle outline', () => {
        const canvas = createCanvas({ width: 10, height: 5 });

        canvas.rect(1, 1, 5, 3);

        // Top edge
        expect(canvas.getPixel(1, 1)).not.toBe(' ');
        expect(canvas.getPixel(3, 1)).not.toBe(' ');

        // Interior should be empty
        expect(canvas.getPixel(3, 2)).toBe(' ');
      });

      it('should draw filled rectangle', () => {
        const canvas = createCanvas({ width: 10, height: 5 });

        canvas.rect(1, 1, 3, 2, true);

        expect(canvas.getPixel(2, 1)).not.toBe(' ');
        expect(canvas.getPixel(2, 2)).not.toBe(' ');
      });
    });

    describe('circle', () => {
      it('should draw circle outline', () => {
        const canvas = createCanvas({ width: 20, height: 10 });

        canvas.circle(10, 5, 3);

        // Should have pixels at radius distance
        const output = canvas.render();
        expect(output).toContain('█');
      });

      it('should draw filled circle', () => {
        const canvas = createCanvas({ width: 20, height: 10 });

        canvas.circle(10, 5, 3, true);

        // Center should be filled
        expect(canvas.getPixel(10, 5)).not.toBe(' ');
      });
    });

    describe('ellipse', () => {
      it('should draw ellipse', () => {
        const canvas = createCanvas({ width: 30, height: 15 });

        canvas.ellipse(15, 7, 10, 5);

        const output = canvas.render();
        expect(output).toContain('█');
      });
    });

    describe('arc', () => {
      it('should draw arc', () => {
        const canvas = createCanvas({ width: 20, height: 10 });

        canvas.arc(10, 5, 4, 0, 180);

        const output = canvas.render();
        expect(output).toContain('█');
      });
    });

    describe('polygon', () => {
      it('should draw polygon outline', () => {
        const canvas = createCanvas({ width: 20, height: 10 });

        canvas.polygon([
          { x: 10, y: 1 },
          { x: 18, y: 8 },
          { x: 2, y: 8 },
        ]);

        const output = canvas.render();
        expect(output).toContain('█');
      });

      it('should draw filled polygon', () => {
        const canvas = createCanvas({ width: 20, height: 10 });

        canvas.polygon(
          [
            { x: 10, y: 1 },
            { x: 18, y: 8 },
            { x: 2, y: 8 },
          ],
          true
        );

        // Center of triangle should be filled
        expect(canvas.getPixel(10, 5)).not.toBe(' ');
      });
    });

    describe('bezier', () => {
      it('should draw cubic bezier curve', () => {
        const canvas = createCanvas({ width: 30, height: 15 });

        canvas.bezier(
          { x: 0, y: 7 },
          { x: 10, y: 0 },
          { x: 20, y: 14 },
          { x: 29, y: 7 }
        );

        const output = canvas.render();
        expect(output).toContain('█');
      });
    });

    describe('quadBezier', () => {
      it('should draw quadratic bezier curve', () => {
        const canvas = createCanvas({ width: 30, height: 15 });

        canvas.quadBezier(
          { x: 0, y: 14 },
          { x: 15, y: 0 },
          { x: 29, y: 14 }
        );

        const output = canvas.render();
        expect(output).toContain('█');
      });
    });

    describe('text', () => {
      it('should draw text', () => {
        const canvas = createCanvas({ width: 20, height: 5 });

        canvas.text(5, 2, 'Hello');

        expect(canvas.getPixel(5, 2)).toBe('H');
        expect(canvas.getPixel(6, 2)).toBe('e');
        expect(canvas.getPixel(9, 2)).toBe('o');
      });

      it('should center align text', () => {
        const canvas = createCanvas({ width: 10, height: 3 });

        canvas.text(5, 1, 'Hi', { align: 'center' });

        expect(canvas.getPixel(4, 1)).toBe('H');
        expect(canvas.getPixel(5, 1)).toBe('i');
      });

      it('should right align text', () => {
        const canvas = createCanvas({ width: 10, height: 3 });

        canvas.text(9, 1, 'Hi', { align: 'right' });

        expect(canvas.getPixel(8, 1)).toBe('H');
        expect(canvas.getPixel(9, 1)).toBe('i');
      });

      it('should clip text at boundaries', () => {
        const canvas = createCanvas({ width: 10, height: 3 });

        canvas.text(-2, 1, 'Hello');

        expect(canvas.getPixel(0, 1)).toBe('l');
        expect(canvas.getPixel(1, 1)).toBe('l');
        expect(canvas.getPixel(2, 1)).toBe('o');
      });
    });

    describe('drawPoints', () => {
      it('should draw array of points', () => {
        const canvas = createCanvas({ width: 10, height: 5 });

        canvas.drawPoints([
          { x: 1, y: 1 },
          { x: 3, y: 3 },
          { x: 5, y: 1 },
        ]);

        expect(canvas.getPixel(1, 1)).not.toBe(' ');
        expect(canvas.getPixel(3, 3)).not.toBe(' ');
        expect(canvas.getPixel(5, 1)).not.toBe(' ');
      });
    });

    describe('floodFill', () => {
      it('should flood fill area', () => {
        const canvas = createCanvas({ width: 10, height: 5 });

        // Draw a box
        canvas.rect(1, 1, 5, 3);

        // Fill inside
        canvas.floodFill(3, 2, '#');

        expect(canvas.getPixel(3, 2)).toBe('#');
      });

      it('should not fill outside boundary', () => {
        const canvas = createCanvas({ width: 10, height: 5 });

        canvas.rect(1, 1, 5, 3);
        canvas.floodFill(3, 2, '#');

        // Outside should remain empty
        expect(canvas.getPixel(0, 0)).toBe(' ');
        expect(canvas.getPixel(8, 4)).toBe(' ');
      });
    });

    describe('clear', () => {
      it('should clear canvas', () => {
        const canvas = createCanvas({ width: 10, height: 5 });

        canvas.rect(0, 0, 10, 5, true);
        canvas.clear();

        expect(canvas.getPixel(5, 2)).toBe(' ');
      });
    });

    describe('render', () => {
      it('should render character mode', () => {
        const canvas = createCanvas({ width: 5, height: 3 });

        canvas.setPixel(2, 1, 'X');

        const output = canvas.render();
        const lines = output.split('\n');

        expect(lines.length).toBe(3);
        expect(lines[1]!.includes('X')).toBe(true);
      });

      it('should render braille mode', () => {
        const canvas = createCanvas({ width: 5, height: 3, mode: 'braille' });

        canvas.setPixel(2, 2);

        const output = canvas.render();

        expect(output).not.toBe('');
      });

      it('should render block mode', () => {
        const canvas = createCanvas({ width: 5, height: 3, mode: 'block' });

        canvas.setPixel(2, 2);

        const output = canvas.render();

        expect(output).not.toBe('');
      });
    });

    describe('getState', () => {
      it('should return canvas state', () => {
        const canvas = createCanvas({
          width: 10,
          height: 5,
          foreground: 'red',
        });

        const state = canvas.getState();

        expect(state.width).toBe(10);
        expect(state.height).toBe(5);
        expect(state.foreground).toBe('red');
        expect(state.buffer.length).toBe(5);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('drawSparkline', () => {
      it('should draw sparkline', () => {
        const canvas = createCanvas({ width: 20, height: 5 });
        const data = [1, 4, 2, 8, 5, 7, 2, 6, 4, 9];

        drawSparkline(canvas, data, 0, 0, 20, 5);

        const output = canvas.render();
        expect(output).toContain('█');
      });

      it('should handle empty data', () => {
        const canvas = createCanvas({ width: 20, height: 5 });

        // Should not throw
        drawSparkline(canvas, [], 0, 0, 20, 5);
      });
    });

    describe('drawBarChart', () => {
      it('should draw bar chart', () => {
        const canvas = createCanvas({ width: 20, height: 10 });
        const data = [5, 10, 3, 8, 6];

        drawBarChart(canvas, data, 0, 0, 20, 10);

        const output = canvas.render();
        expect(output).toContain('█');
      });

      it('should handle empty data', () => {
        const canvas = createCanvas({ width: 20, height: 10 });

        // Should not throw
        drawBarChart(canvas, [], 0, 0, 20, 10);
      });
    });

    describe('drawScatterPlot', () => {
      it('should draw scatter plot', () => {
        const canvas = createCanvas({ width: 20, height: 10 });
        const points = [
          { x: 1, y: 2 },
          { x: 3, y: 5 },
          { x: 7, y: 3 },
          { x: 8, y: 9 },
        ];

        drawScatterPlot(
          canvas,
          points,
          { minX: 0, maxX: 10, minY: 0, maxY: 10 },
          { x: 0, y: 0, width: 20, height: 10 }
        );

        const output = canvas.render();
        expect(output).toContain('●');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle 1x1 canvas', () => {
      const canvas = createCanvas({ width: 1, height: 1 });

      canvas.setPixel(0, 0, 'X');

      expect(canvas.render()).toBe('X');
    });

    it('should handle very large coordinates in line', () => {
      const canvas = createCanvas({ width: 10, height: 10 });

      // Should not throw, just draw visible portion
      canvas.line(-100, -100, 100, 100);
    });

    it('should preserve existing content when drawing', () => {
      const canvas = createCanvas({ width: 10, height: 5 });

      canvas.setPixel(5, 2, 'A');
      canvas.setPixel(6, 2, 'B');

      expect(canvas.getPixel(5, 2)).toBe('A');
      expect(canvas.getPixel(6, 2)).toBe('B');
    });
  });
});
