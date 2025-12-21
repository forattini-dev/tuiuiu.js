/**
 * Storybook Types
 */

import type { VNode } from '../utils/types.js';

export type ControlType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'color'
  | 'range';

export interface ControlDefinition {
  type: ControlType;
  label: string;
  defaultValue: any;
  options?: string[]; // For select
  min?: number; // For range/number
  max?: number; // For range/number
  step?: number; // For range/number
}

export interface Story {
  /** Story name */
  name: string;
  /** Component category */
  category: string;
  /** Story description */
  description?: string;
  /** Control definitions (optional - stories without controls are allowed) */
  controls?: Record<string, ControlDefinition>;
  /** Render function - receives current control values and optional frame number for animations */
  render: (props: Record<string, any>, frame?: number) => VNode;
  /** Animation settings */
  animation?: {
    /** Enable animation (triggers periodic re-renders) */
    enabled: boolean;
    /** Animation interval in ms (default: 100) */
    interval?: number;
    /** Allow pausing animation with space key */
    pausable?: boolean;
  };
}

export interface StoryCategory {
  name: string;
  stories: Story[];
}
