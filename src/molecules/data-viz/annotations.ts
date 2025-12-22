/**
 * Chart Annotations - Visual annotations for charts
 *
 * Features:
 * - Threshold lines
 * - Shaded regions
 * - Text labels
 * - Custom styling
 */

import type { ColorValue } from '../../utils/types.js';

// =============================================================================
// Types
// =============================================================================

export type AnnotationType = 'threshold' | 'range' | 'text' | 'point';

export interface ThresholdAnnotation {
  /** Type */
  type: 'threshold';
  /** Value on axis */
  value: number;
  /** Label */
  label?: string;
  /** Color */
  color?: ColorValue;
  /** Line style */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface RangeAnnotation {
  /** Type */
  type: 'range';
  /** Start value */
  start: number;
  /** End value */
  end: number;
  /** Label */
  label?: string;
  /** Color */
  color?: ColorValue;
  /** Opacity (0-1) */
  opacity?: number;
}

export interface TextAnnotation {
  /** Type */
  type: 'text';
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Text content */
  text: string;
  /** Color */
  color?: ColorValue;
  /** Background color */
  backgroundColor?: ColorValue;
}

export interface PointAnnotation {
  /** Type */
  type: 'point';
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Marker style */
  marker?: string;
  /** Color */
  color?: ColorValue;
  /** Label */
  label?: string;
}

export type Annotation = ThresholdAnnotation | RangeAnnotation | TextAnnotation | PointAnnotation;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Format annotation label
 */
export function formatAnnotationLabel(annotation: Annotation): string {
  switch (annotation.type) {
    case 'threshold':
      return annotation.label || `${annotation.value}`;
    case 'range':
      return annotation.label || `${annotation.start} - ${annotation.end}`;
    case 'text':
      return annotation.text;
    case 'point':
      return annotation.label || '●';
    default:
      return '';
  }
}

/**
 * Get annotation color
 */
export function getAnnotationColor(annotation: Annotation): ColorValue {
  return annotation.color || 'gray';
}

// =============================================================================
// Exports
// =============================================================================

// Types are exported above
