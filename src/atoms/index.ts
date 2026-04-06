/**
 * Atoms - Smallest UI units with internal state
 *
 * @layer Atoms
 * @description Basic interactive components (buttons, inputs, badges, etc.)
 *
 * Atoms are the smallest functional units in our component hierarchy.
 * They can have internal state but are not composed of other components.
 *
 * Examples:
 * - Badge: Simple status indicator
 * - Button: Clickable action trigger
 * - Spinner: Loading indicator
 * - TextInput: Text entry field
 * - Slider: Numeric value selection
 * - Switch: Boolean toggle
 * - Timer: Time display/countdown
 * - ProgressBar: Progress indicator
 * - Tooltip: Contextual information
 */

// =============================================================================
// Spinner - Loading indicators
// =============================================================================
export {
  Spinner,
  createSpinner,
  renderSpinner,
  listSpinnerStyles,
  getSpinnerConfig,
  getSpinnerCount,
  type SpinnerOptions,
  type SpinnerState,
  type SpinnerStyle,
} from './spinner.js';

// =============================================================================
// Timer - Stopwatch and countdown
// =============================================================================
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

// =============================================================================
// Button - Clickable actions with keyboard navigation
// =============================================================================
export {
  Button,
  IconButton,
  ButtonGroup,
  createButtonGroup,
  renderButtonGroup,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
  type IconButtonProps,
  type ButtonGroupProps,
  type ButtonGroupState,
  type ButtonGroupOptions,
} from './button.js';

// =============================================================================
// Switch - Boolean toggle
// =============================================================================
export {
  Switch,
  createSwitch,
  ToggleGroup,
  type SwitchProps,
  type SwitchState,
  type SwitchOptions,
  type ToggleOption,
  type ToggleGroupOptions,
} from './switch.js';

// =============================================================================
// Slider - Numeric value selection
// =============================================================================
export {
  Slider,
  createSlider,
  RangeSlider,
  createRangeSlider,
  type RangeSliderProps,
  type SliderProps,
  type SliderState,
  type SliderOptions,
  type RangeSliderState,
  type RangeSliderOptions,
} from './slider.js';

// =============================================================================
// TextInput - Text entry
// =============================================================================
export {
  TextInput,
  createTextInput,
  renderTextInput,
  useTextInputState,
  type TextInputProps,
  type TextInputCompletionAnchor,
  type TextInputHistoryEntry,
  type TextInputHistoryItem,
  type TextInputHistoryPersistenceOptions,
  type TextInputOptions,
  type TextInputSegment,
  type TextInputSegmentInput,
  type TextInputState,
} from './text-input.js';

// =============================================================================
// ProgressBar - Progress indicators
// =============================================================================
export {
  ProgressBar,
  createProgressBar,
  renderProgressBar,
  MultiProgressBar,
  type ProgressBarOptions,
  type ProgressBarStyle,
} from './progress-bar.js';

// =============================================================================
// Keyboard Shortcut Hints
// =============================================================================
export {
  KeyboardShortcutHint,
  HintBar,
} from './keyboard-shortcut-hint.js';

export type {
  KeyboardShortcutHintProps,
  HintBarProps,
} from './keyboard-shortcut-hint.js';

// =============================================================================
// Trigger Completion (inline @-mentions, /commands, #tags)
// =============================================================================
export {
  createTriggerCompletion,
  createMultiTriggerCompletion,
} from './trigger-completion.js';

export type {
  TriggerItem,
  TriggerConfig,
} from './trigger-completion.js';

// Completion Dropdown
export {
  CompletionDropdown,
} from './completion-dropdown.js';

export type {
  CompletionDropdownProps,
} from './completion-dropdown.js';

// =============================================================================
// Shimmer Text
// =============================================================================
export {
  ShimmerText,
  resetShimmerStartTime,
} from './shimmer-text.js';

export type {
  ShimmerTextProps,
} from './shimmer-text.js';

// =============================================================================
// Tooltip & related visual components
// =============================================================================
export {
  Tooltip,
  WithTooltip,
  helpTooltip,
  InfoBox,
  Popover,
  Tag,
  type TooltipOptions,
  type TooltipPosition,
  type WithTooltipOptions,
  type HelpTooltipOptions,
  type InfoBoxOptions,
  type InfoBoxType,
  type PopoverOptions,
  type TagOptions,
} from './tooltip.js';

// =============================================================================
// Badge - Status indicator
// =============================================================================
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
} from './badge.js';

// =============================================================================
// StatusIndicator - Semantic status display
// =============================================================================
export {
  StatusIndicator,
  // Presets
  successStatus,
  errorStatus,
  warningStatus,
  infoStatus,
  loadingStatus,
  pendingStatus,
  stoppedStatus,
  // Types
  type StatusIndicatorProps,
  type StatusType,
  type BuiltInStatus,
  type CustomStatus,
  type StatusSize,
} from './status-indicator.js';

// =============================================================================
// MetricDisplay - Dashboard metrics with auto-tracking
// =============================================================================
export {
  MetricDisplay,
  createMetric,
  type MetricDisplayProps,
  type CreateMetricOptions,
  type MetricState,
  type MetricLayout,
  type MetricSize,
} from './metric-display.js';

// =============================================================================
// DataRow - Key/value display
// =============================================================================
export {
  DataRow,
  type DataRowProps,
} from './data-row.js';

// =============================================================================
// ListItem - Standardized list row
// =============================================================================
export {
  ListItem,
  type ListItemProps,
} from './list-item.js';

// =============================================================================
// HttpStatus - HTTP status display
// =============================================================================
export {
  HttpStatus,
  httpOk,
  httpCreated,
  httpNoContent,
  httpBadRequest,
  httpUnauthorized,
  httpForbidden,
  httpNotFound,
  httpError,
  type HttpStatusProps,
  type HttpStatusVariant,
} from './http-status.js';

// =============================================================================
// Scrollbar - Scroll position indicator
// =============================================================================
export { Scrollbar } from './scrollbar.js';

// =============================================================================
// BigText - Large ASCII art text display
// =============================================================================
export {
  BigText,
  FigletText,
  BigTitle,
  Logo,
  listBigTextFonts,
  getBigTextFontInfo,
  renderBigText,
  getBigTextFontCount,
  type BigTextFont,
  type BigTextOptions,
  type FigletTextOptions,
  type BigTitleOptions,
  type LogoOptions,
} from './big-text.js';

// =============================================================================
// Digits - LCD-style numeric displays
// =============================================================================
export {
  Digits,
  Clock,
  Counter,
  Countdown,
  Stopwatch,
  DigitRoll,
  Score,
  type DigitsStyle,
  type DigitsOptions,
  type ClockOptions,
  type CounterOptions,
  type CountdownOptions,
  type StopwatchOptions,
  type DigitRollOptions,
  type ScoreOptions,
} from './digits.js';

// =============================================================================
// Picture - ASCII art and colored pixel art display
// =============================================================================
export {
  Picture,
  FramedPicture,
  ColoredPicture,
  AnimatedPicture,
  createPixelGrid,
  createPixelGridFromColors,
  parseColoredBBCode,
  renderPixelGrid,
  createSprite,
  getSpriteFrame,
  nextSpriteFrame,
  createGradientBar,
  rainbowText,
  createShadowedText,
  createBanner,
  createAnimatedPicture,
  adjustBrightness,
  interpolateColor,
  applyBrightnessToGrid,
  applyShimmerToGrid,
  applyRainbowToGrid,
  applyGlitchToGrid,
  AsciiPatterns,
  type PictureProps,
  type PictureFit,
  type PictureAlignX,
  type PictureAlignY,
  type FramedPictureProps,
  type ColoredPictureProps,
  type AnimatedPictureProps,
  type AnimatedPictureControls,
  type PictureAnimation,
  type AnimationEasing,
  type Pixel,
  type PixelGrid,
  type ColorPalette,
  type Sprite,
  type GradientStop,
} from './picture.js';

// =============================================================================
// TerminalImage - Protocol-backed terminal image rendering
// =============================================================================
export {
  TerminalImage,
  createTerminalImage,
  type TerminalImageProps,
  type TerminalImageOptions,
  type TerminalImageState,
} from './terminal-image.js';
