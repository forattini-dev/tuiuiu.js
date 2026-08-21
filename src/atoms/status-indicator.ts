/**
 * StatusIndicator - Semantic status display component
 *
 * @layer Atom
 * @description Displays status with color-coded icons and optional labels
 *
 * Features:
 * - Built-in status types (success, warning, error, info, pending, running, stopped)
 * - Custom status with color/icon
 * - Pulse animation for running states
 * - Signal-transparent props
 * - Preset factory functions
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { resolveColor } from '../core/theme.js';
import { getRenderMode } from '../core/capabilities.js';
import { resolve, type MaybeReactive } from '../utils/resolve.js';
import { useState } from '../hooks/use-state.js';
import { useInterval } from '../hooks/use-interval.js';
import { component, type ComponentKeyProps } from '../app/component.js';

// =============================================================================
// Types
// =============================================================================

/** Built-in status types */
export type BuiltInStatus =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'pending'
  | 'running'
  | 'stopped';

/** Custom status definition */
export interface CustomStatus {
  color: ColorValue;
  icon?: string;
}

/** Status type (built-in or custom) */
export type StatusType = BuiltInStatus | CustomStatus;

/** Size variants */
export type StatusSize = 'sm' | 'md' | 'lg';

/** StatusIndicator props */
export interface StatusIndicatorProps extends ComponentKeyProps {
  /** Status type or custom status object */
  status: MaybeReactive<StatusType>;
  /** Optional text label */
  label?: MaybeReactive<string>;
  /** Display status icon (default: true) */
  showIcon?: boolean;
  /** Display colored dot instead of icon (default: false) */
  showDot?: boolean;
  /** Size variant (default: 'md') */
  size?: StatusSize;
  /** Enable pulse animation (default: auto for 'running') */
  pulse?: boolean;
  /** Gap between icon and label (default: 1) */
  gap?: number;
}

/** Keep pulse state stable in the StatusIndicator ComponentOwner. */
function usePulseVisibility(enabled: boolean): boolean {
  const [visible, setVisible] = useState(true);
  useInterval(
    () => setVisible((current) => !current),
    500,
    { enabled }
  );

  return visible();
}

// =============================================================================
// Status Mappings
// =============================================================================

interface StatusConfig {
  icon: string;
  iconAscii: string;
  color: string; // Theme semantic color name
  pulse: boolean;
}

const STATUS_CONFIGS: Record<BuiltInStatus, StatusConfig> = {
  success: { icon: '✓', iconAscii: '[ok]', color: 'success', pulse: false },
  warning: { icon: '⚠', iconAscii: '[!]', color: 'warning', pulse: false },
  error: { icon: '✗', iconAscii: '[x]', color: 'error', pulse: false },
  info: { icon: 'ℹ', iconAscii: '[i]', color: 'info', pulse: false },
  pending: { icon: '◌', iconAscii: '[ ]', color: 'muted', pulse: false },
  running: { icon: '●', iconAscii: '[*]', color: 'success', pulse: true },
  stopped: { icon: '⏹', iconAscii: '[.]', color: 'muted', pulse: false },
};

const DOT_CHARS = {
  unicode: '●',
  ascii: '*',
};

// =============================================================================
// Component
// =============================================================================

/**
 * StatusIndicator - Displays semantic status with color-coded icons
 *
 * @example
 * // Basic status
 * StatusIndicator({ status: 'success', label: 'Connected' })
 *
 * @example
 * // Running with pulse
 * StatusIndicator({ status: 'running', label: 'Processing...' })
 *
 * @example
 * // Custom status
 * StatusIndicator({
 *   status: { color: 'magenta', icon: '◆' },
 *   label: 'Custom'
 * })
 *
 * @example
 * // Reactive status
 * StatusIndicator({
 *   status: () => isOk() ? 'success' : 'error',
 *   label: () => isOk() ? 'Online' : 'Offline'
 * })
 */
export const StatusIndicator = component<StatusIndicatorProps, VNode>('StatusIndicator', (props) => {
  const {
    showIcon = true,
    showDot = false,
    size = 'md',
    gap = 1,
  } = props;

  const isAscii = getRenderMode() === 'ascii';

  // Resolve reactive props
  const status = resolve(props.status);
  const label = props.label !== undefined ? resolve(props.label) : undefined;

  // Determine config based on status type
  const isBuiltIn = typeof status === 'string';
  const config = isBuiltIn ? STATUS_CONFIGS[status] : null;

  // Resolve colors and icons
  const colorName = config ? config.color : (status as CustomStatus).color;
  const color = resolveColor(colorName as string);

  const icon = showDot
    ? (isAscii ? DOT_CHARS.ascii : DOT_CHARS.unicode)
    : config
      ? (isAscii ? config.iconAscii : config.icon)
      : (status as CustomStatus).icon || (isAscii ? DOT_CHARS.ascii : DOT_CHARS.unicode);

  // Determine if pulse should be active
  const shouldPulse = props.pulse !== undefined
    ? props.pulse
    : config?.pulse ?? false;

  const pulseVisible = usePulseVisibility(shouldPulse);

  // Size-based styling
  const iconStyle = size === 'lg' ? { bold: true } : {};

  return Box(
    {
      flexDirection: 'row',
      alignItems: 'center',
      gap,
    },
    // Icon or dot
    (showIcon || showDot) && Text(
      {
        color: shouldPulse && !pulseVisible ? 'transparent' : color,
        ...iconStyle,
      },
      icon
    ),
    // Label
    label && Text(
      { color: size === 'sm' ? 'muted' : undefined },
      label
    )
  );
});

// =============================================================================
// Presets
// =============================================================================

/**
 * Preset for success status
 *
 * @example
 * StatusIndicator(successStatus('Connected'))
 * StatusIndicator({ ...successStatus(), size: 'lg' })
 */
export function successStatus(label?: string): StatusIndicatorProps {
  return { status: 'success', label };
}

/**
 * Preset for error status
 *
 * @example
 * StatusIndicator(errorStatus('Failed'))
 */
export function errorStatus(label?: string): StatusIndicatorProps {
  return { status: 'error', label };
}

/**
 * Preset for warning status
 *
 * @example
 * StatusIndicator(warningStatus('Low disk space'))
 */
export function warningStatus(label?: string): StatusIndicatorProps {
  return { status: 'warning', label };
}

/**
 * Preset for info status
 *
 * @example
 * StatusIndicator(infoStatus('New update available'))
 */
export function infoStatus(label?: string): StatusIndicatorProps {
  return { status: 'info', label };
}

/**
 * Preset for loading/running status with pulse animation
 *
 * @example
 * StatusIndicator(loadingStatus())  // "Loading..."
 * StatusIndicator(loadingStatus('Processing...'))
 */
export function loadingStatus(label = 'Loading...'): StatusIndicatorProps {
  return { status: 'running', label, pulse: true };
}

/**
 * Preset for pending status
 *
 * @example
 * StatusIndicator(pendingStatus('Waiting for input'))
 */
export function pendingStatus(label?: string): StatusIndicatorProps {
  return { status: 'pending', label };
}

/**
 * Preset for stopped status
 *
 * @example
 * StatusIndicator(stoppedStatus('Service stopped'))
 */
export function stoppedStatus(label?: string): StatusIndicatorProps {
  return { status: 'stopped', label };
}
