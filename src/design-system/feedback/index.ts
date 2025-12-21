/**
 * Design System Feedback - User feedback components
 */

// Spinner (advanced) - 60+ styles
export {
  createSpinner,
  renderSpinner,
  Spinner,
  listSpinnerStyles,
  getSpinnerConfig,
  getSpinnerCount,
  type SpinnerStyle,
  type SpinnerOptions,
} from './spinner.js';

// Progress Bar (advanced)
export {
  createProgressBar,
  renderProgressBar,
  ProgressBar,
  MultiProgressBar,
  type ProgressBarStyle,
  type ProgressBarOptions,
} from './progress-bar.js';

// Badge
export {
  Badge,
  type BadgeProps,
} from './badge.js';

// Timer (Kyma-inspired)
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
} from './timer.js';
