/**
 * Design System Feedback - User feedback components
 *
 * Re-exports from atoms (canonical source) plus unique Badge component.
 */

// Spinner (from atoms - canonical source)
export {
  createSpinner,
  renderSpinner,
  Spinner,
  listSpinnerStyles,
  getSpinnerConfig,
  getSpinnerCount,
  type SpinnerStyle,
  type SpinnerOptions,
} from '../../atoms/spinner.js';

// Progress Bar (from atoms - canonical source)
export {
  createProgressBar,
  renderProgressBar,
  ProgressBar,
  MultiProgressBar,
  type ProgressBarStyle,
  type ProgressBarOptions,
} from '../../atoms/progress-bar.js';

// Timer (from atoms - canonical source)
export {
  Timer,
  createTimer,
  createMultiTimer,
  formatTime,
  parseTime,
  type TimerProps,
  type TimerState,
  type TimerFormat,
  type TimerMode,
  type CreateTimerOptions,
  type MultiTimerState,
} from '../../atoms/timer.js';

// Badge (from atoms/badge.ts - canonical source)
export {
  Badge,
  successBadge,
  warningBadge,
  dangerBadge,
  infoBadge,
  primaryBadge,
  type BadgeProps,
  type BadgeVariant,
  type BadgeStyle,
} from '../../atoms/badge.js';
