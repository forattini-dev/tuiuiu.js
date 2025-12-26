/**
 * Tests for chart annotations
 */

import { describe, it, expect } from 'vitest';
import {
  formatAnnotationLabel,
  getAnnotationColor,
  type ThresholdAnnotation,
  type RangeAnnotation,
  type TextAnnotation,
  type PointAnnotation,
} from '../../../src/molecules/data-viz/annotations.js';

describe('Chart Annotations', () => {
  describe('formatAnnotationLabel', () => {
    describe('threshold annotations', () => {
      it('should return custom label when provided', () => {
        const annotation: ThresholdAnnotation = {
          type: 'threshold',
          value: 100,
          label: 'Maximum',
        };
        expect(formatAnnotationLabel(annotation)).toBe('Maximum');
      });

      it('should return value as string when no label', () => {
        const annotation: ThresholdAnnotation = {
          type: 'threshold',
          value: 100,
        };
        expect(formatAnnotationLabel(annotation)).toBe('100');
      });

      it('should handle decimal values', () => {
        const annotation: ThresholdAnnotation = {
          type: 'threshold',
          value: 99.5,
        };
        expect(formatAnnotationLabel(annotation)).toBe('99.5');
      });
    });

    describe('range annotations', () => {
      it('should return custom label when provided', () => {
        const annotation: RangeAnnotation = {
          type: 'range',
          start: 0,
          end: 100,
          label: 'Normal Range',
        };
        expect(formatAnnotationLabel(annotation)).toBe('Normal Range');
      });

      it('should return range string when no label', () => {
        const annotation: RangeAnnotation = {
          type: 'range',
          start: 50,
          end: 150,
        };
        expect(formatAnnotationLabel(annotation)).toBe('50 - 150');
      });
    });

    describe('text annotations', () => {
      it('should return the text content', () => {
        const annotation: TextAnnotation = {
          type: 'text',
          x: 10,
          y: 20,
          text: 'Important note',
        };
        expect(formatAnnotationLabel(annotation)).toBe('Important note');
      });

      it('should handle empty text', () => {
        const annotation: TextAnnotation = {
          type: 'text',
          x: 0,
          y: 0,
          text: '',
        };
        expect(formatAnnotationLabel(annotation)).toBe('');
      });
    });

    describe('point annotations', () => {
      it('should return custom label when provided', () => {
        const annotation: PointAnnotation = {
          type: 'point',
          x: 5,
          y: 10,
          label: 'Peak',
        };
        expect(formatAnnotationLabel(annotation)).toBe('Peak');
      });

      it('should return default marker when no label', () => {
        const annotation: PointAnnotation = {
          type: 'point',
          x: 5,
          y: 10,
        };
        expect(formatAnnotationLabel(annotation)).toBe('●');
      });
    });
  });

  describe('getAnnotationColor', () => {
    it('should return custom color when provided', () => {
      const annotation: ThresholdAnnotation = {
        type: 'threshold',
        value: 100,
        color: 'red',
      };
      expect(getAnnotationColor(annotation)).toBe('red');
    });

    it('should return gray as default when no color', () => {
      const annotation: ThresholdAnnotation = {
        type: 'threshold',
        value: 100,
      };
      expect(getAnnotationColor(annotation)).toBe('gray');
    });

    it('should work with range annotations', () => {
      const annotation: RangeAnnotation = {
        type: 'range',
        start: 0,
        end: 100,
        color: 'blue',
      };
      expect(getAnnotationColor(annotation)).toBe('blue');
    });

    it('should work with text annotations', () => {
      const annotation: TextAnnotation = {
        type: 'text',
        x: 0,
        y: 0,
        text: 'test',
        color: 'green',
      };
      expect(getAnnotationColor(annotation)).toBe('green');
    });

    it('should work with point annotations', () => {
      const annotation: PointAnnotation = {
        type: 'point',
        x: 0,
        y: 0,
        color: 'yellow',
      };
      expect(getAnnotationColor(annotation)).toBe('yellow');
    });

    it('should handle hex color values', () => {
      const annotation: ThresholdAnnotation = {
        type: 'threshold',
        value: 100,
        color: '#ff0000',
      };
      expect(getAnnotationColor(annotation)).toBe('#ff0000');
    });
  });
});
