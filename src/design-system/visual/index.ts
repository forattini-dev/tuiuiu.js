/**
 * Design System Visual - Decorative and display components
 *
 * BigText:
 * - Large ASCII art text
 * - Multiple font styles
 * - Gradient colors
 *
 * Digits:
 * - LCD-style numeric display
 * - Clock, counter, countdown
 *
 * Tooltips:
 * - Tooltip, Popover
 * - InfoBox, Badge, Tag
 */

// BigText (9 fonts: block, slant, small, standard, banner, mini, shadow, doom, graffiti)
export {
  BigText,
  FigletText,
  BigTitle,
  Logo,
  listBigTextFonts,
  getBigTextFontInfo,
  getBigTextFontCount,
  renderBigText,
  type BigTextFont,
  type BigTextOptions,
  type FigletTextOptions,
  type BigTitleOptions,
  type LogoOptions,
} from './big-text.js';

// Digits
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

// Tooltip
export {
  Tooltip,
  WithTooltip,
  HelpTooltip,
  InfoBox,
  Popover,
  Badge,
  Tag,
  type TooltipPosition,
  type TooltipOptions,
  type WithTooltipOptions,
  type HelpTooltipOptions,
  type InfoBoxType,
  type InfoBoxOptions,
  type PopoverOptions,
  type BadgeOptions,
  type TagOptions,
} from './tooltip.js';
