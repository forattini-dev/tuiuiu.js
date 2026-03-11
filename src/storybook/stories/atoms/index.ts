/**
 * Atoms Stories
 *
 * Atoms are the basic building blocks of the UI.
 * They are the smallest, most fundamental components that cannot be broken down further:
 * - Badge: Simple status label
 * - Spinner: Loading indicator
 */

import { Box, Text } from '../../../primitives/nodes.js';
import { Badge } from '../../../atoms/badge.js';
import { Button, IconButton, ButtonGroup } from '../../../atoms/button.js';
import { Switch, ToggleGroup } from '../../../atoms/switch.js';
import { Slider, RangeSlider } from '../../../atoms/slider.js';
import { TextInput } from '../../../atoms/text-input.js';
import { ProgressBar, MultiProgressBar } from '../../../atoms/progress-bar.js';
import { Timer } from '../../../atoms/timer.js';
import { Tooltip, WithTooltip, InfoBox, Popover, Tag } from '../../../atoms/tooltip.js';
import { StatusIndicator } from '../../../atoms/status-indicator.js';
import { MetricDisplay } from '../../../atoms/metric-display.js';
import { DataRow } from '../../../atoms/data-row.js';
import { ListItem } from '../../../atoms/list-item.js';
import { HttpStatus } from '../../../atoms/http-status.js';
import { Scrollbar } from '../../../atoms/scrollbar.js';
import { BigText, FigletText, BigTitle, Logo, listBigTextFonts } from '../../../atoms/big-text.js';
import { Digits, Clock, Counter, Countdown, Stopwatch, DigitRoll, Score } from '../../../atoms/digits.js';
import { Picture, FramedPicture, ColoredPicture, AnimatedPicture, createPixelGridFromColors, AsciiPatterns } from '../../../atoms/picture.js';
import { story, defaultControls } from '../../core/registry.js';
import { getTheme } from '../../../core/theme.js';
import type { Story } from '../../types.js';

// Spinner frame definitions - All available spinner types
const spinnerFrames = {
  // Basic spinners
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  dots2: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
  dots3: ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈'],
  line: ['-', '\\', '|', '/'],
  arc: ['◜', '◠', '◝', '◞', '◡', '◟'],
  circle: ['◐', '◓', '◑', '◒'],
  square: ['◰', '◳', '◲', '◱'],
  bounce: ['⠁', '⠂', '⠄', '⠂'],
  pulse: ['█', '▓', '▒', '░', '▒', '▓'],
  bar: ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'],

  // Arrows & Movement
  arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
  arrowPulse: ['▹▹▹▹▹', '▸▹▹▹▹', '▹▸▹▹▹', '▹▹▸▹▹', '▹▹▹▸▹', '▹▹▹▹▸'],

  // Bouncing bar
  bouncingBar: [
    '[    ]', '[=   ]', '[==  ]', '[=== ]', '[ ===]',
    '[  ==]', '[   =]', '[    ]', '[   =]', '[  ==]',
    '[ ===]', '[====]', '[=== ]', '[==  ]', '[=   ]',
  ],

  // Emoji spinners
  clock: ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'],
  earth: ['🌍', '🌎', '🌏'],
  moon: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'],
  runner: ['🚶', '🏃'],
  hearts: ['💛', '💙', '💜', '💚', '❤️'],
  weather: ['🌤️', '⛅', '🌥️', '☁️', '🌧️', '⛈️', '🌩️', '🌨️'],

  // Binary/Tech
  binary: ['010010', '001100', '100101', '111010', '001011', '010111', '101100', '110001'],

  // Pong animation
  pong: [
    '▐⠂    ▌', '▐⠈    ▌', '▐ ⠂   ▌', '▐ ⠠   ▌', '▐  ⡀  ▌', '▐  ⠠  ▌', '▐   ⠂ ▌', '▐   ⠈ ▌', '▐    ⠂▌',
    '▐    ⠠▌', '▐    ⡀▌', '▐   ⠠ ▌', '▐   ⠂ ▌', '▐  ⠈  ▌', '▐  ⠂  ▌', '▐ ⠠   ▌', '▐ ⡀   ▌', '▐⠠    ▌',
  ],

  // Growing/shrinking
  grow: ['·', '•', '●', '•'],
  star: ['✶', '✷', '✸', '✹', '✺', '✹', '✷'],

  // Box drawing
  boxBounce: ['▖', '▘', '▝', '▗'],
  boxBounce2: ['▌', '▀', '▐', '▄'],

  // Flip
  flip: ['_', '_', '_', '-', '`', '`', '\'', '´', '-', '_', '_', '_'],

  // Simple
  toggle: ['⊶', '⊷'],
  toggle2: ['▫', '▪'],
  pipe: ['┤', '┘', '┴', '└', '├', '┌', '┬', '┐'],

  // Noise
  noise: ['▓', '▒', '░', '▒'],

  // Aesthetic
  aesthetic: ['▰▱▱▱▱▱▱', '▰▰▱▱▱▱▱', '▰▰▰▱▱▱▱', '▰▰▰▰▱▱▱', '▰▰▰▰▰▱▱', '▰▰▰▰▰▰▱', '▰▰▰▰▰▰▰', '▰▰▰▰▰▰▱', '▰▰▰▰▰▱▱', '▰▰▰▰▱▱▱', '▰▰▰▱▱▱▱', '▰▰▱▱▱▱▱'],
};

/**
 * Box component stories
 */
export const boxStories: Story[] = [];

/**
 * Text component stories
 */
export const textStories: Story[] = [];

/**
 * Spacer component stories
 */
export const spacerStories: Story[] = [];

/**
 * Divider component stories
 */
export const dividerStories: Story[] = [];

/**
 * Badge component stories
 */
export const badgeStories: Story[] = [
  story('Badge - Basic')
    .category('Atoms')
    .description('Simple status badge')
    .controls({
      label: defaultControls.text('Label', 'NEW'),
      variant: defaultControls.select('Variant', ['default', 'primary', 'secondary', 'success', 'warning', 'danger'], 'primary'),
    })
    .render((props) =>
      Badge({ label: props.label, variant: props.variant })
    ),

  story('Badge - Variants')
    .category('Atoms')
    .description('All badge variant types')
    .render(() =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Badge({ label: 'DEFAULT', variant: 'default' }),
        Badge({ label: 'PRIMARY', variant: 'primary' }),
        Badge({ label: 'SECONDARY', variant: 'secondary' }),
        Badge({ label: 'SUCCESS', variant: 'success' }),
        Badge({ label: 'WARNING', variant: 'warning' }),
        Badge({ label: 'DANGER', variant: 'danger' })
      )
    ),

  story('Badge - Custom Colors')
    .category('Atoms')
    .description('Badges with custom colors')
    .render(() =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Badge({ label: 'ORANGE', color: '#ff6600' }),
        Badge({ label: 'PURPLE', color: '#9b59b6' }),
        Badge({ label: 'TEAL', color: '#1abc9c' }),
        Badge({ label: 'PINK', color: '#e91e63' })
      )
    ),

  story('Badge - With Icons')
    .category('Atoms')
    .description('Badges with status icons')
    .render(() => {
      const theme = getTheme();
      return Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: theme.accents.positive }, '✓'),
          Badge({ label: 'PASSED', variant: 'success' })
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: theme.accents.critical }, '✗'),
          Badge({ label: 'FAILED', variant: 'danger' })
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: theme.accents.warning }, '⚠'),
          Badge({ label: 'PENDING', variant: 'warning' })
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: theme.palette.primary[500] }, '●'),
          Badge({ label: 'RUNNING', variant: 'primary' })
        )
      );
    }),
];

/**
 * Button component stories
 */
export const buttonStories: Story[] = [
  story('Button - Basic')
    .category('Atoms')
    .description('Button with variants and states (onClick not controllable)')
    .controls({
      label: defaultControls.text('Label', 'Click Me'),
      variant: defaultControls.select('Variant', ['solid', 'outline', 'ghost', 'link'], 'solid'),
      size: defaultControls.select('Size', ['small', 'medium', 'large'], 'medium'),
      color: defaultControls.color('Color', 'cyan'),
      disabled: defaultControls.boolean('Disabled', false),
      loading: defaultControls.boolean('Loading', false),
      loadingText: defaultControls.text('Loading Text', 'Loading...'),
      icon: defaultControls.text('Icon', ''),
      iconRight: defaultControls.text('Icon Right', ''),
      fullWidth: defaultControls.boolean('Full Width', false),
      focused: defaultControls.boolean('Focused', false),
      hovered: defaultControls.boolean('Hovered', false),
    })
    .render((props) =>
      Button({
        label: props.label,
        variant: props.variant,
        size: props.size,
        color: props.color,
        disabled: props.disabled,
        loading: props.loading,
        loadingText: props.loadingText,
        icon: props.icon || undefined,
        iconRight: props.iconRight || undefined,
        fullWidth: props.fullWidth,
        focused: props.focused,
        hovered: props.hovered,
        onClick: () => console.log('Button clicked'),
      })
    ),

  story('IconButton - Basic')
    .category('Atoms')
    .description('Icon-only button (onClick not controllable)')
    .controls({
      icon: defaultControls.text('Icon', '★'),
      label: defaultControls.text('Label', 'Star'),
      color: defaultControls.color('Color', 'cyan'),
      disabled: defaultControls.boolean('Disabled', false),
      focused: defaultControls.boolean('Focused', false),
      hovered: defaultControls.boolean('Hovered', false),
    })
    .render((props) =>
      IconButton({
        icon: props.icon,
        label: props.label,
        color: props.color,
        disabled: props.disabled,
        focused: props.focused,
        hovered: props.hovered,
        onClick: () => console.log('IconButton clicked'),
      })
    ),

  story('ButtonGroup - Basic')
    .category('Atoms')
    .description('Grouped buttons with keyboard navigation')
    .controls({
      direction: defaultControls.select('Direction', ['horizontal', 'vertical'], 'horizontal'),
      gap: defaultControls.range('Gap', 1, 0, 4),
    })
    .render((props) =>
      ButtonGroup({
        direction: props.direction,
        gap: props.gap,
        buttons: [
          { label: 'Save', variant: 'solid', color: 'success' },
          { label: 'Edit', variant: 'outline', color: 'warning' },
          { label: 'Delete', variant: 'ghost', color: 'error' },
        ],
      })
    ),
];

/**
 * TextInput component stories
 */
export const textInputStories: Story[] = [
  story('TextInput - Basic')
    .category('Atoms')
    .description('Basic text input field')
    .controls({
      initialValue: defaultControls.text('Initial Value', 'Hello, World!'),
      placeholder: defaultControls.text('Placeholder', 'Enter text...'),
    })
    .render((props) =>
      TextInput({
        initialValue: props.initialValue,
        placeholder: props.placeholder,
        onChange: (val: string) => console.log('Input changed:', val),
        onSubmit: (val: string) => console.log('Input submitted:', val),
      })
    ),

  story('TextInput - Password')
    .category('Atoms')
    .description('Password input with masked characters')
    .controls({
      initialValue: defaultControls.text('Initial Value', 'secret'),
      maskChar: defaultControls.text('Mask Char', '*'),
    })
    .render((props) =>
      TextInput({
        initialValue: props.initialValue,
        password: true,
        maskChar: props.maskChar,
        onChange: (val: string) => console.log('Password changed:', val),
      })
    ),

  story('TextInput - Multi-line')
    .category('Atoms')
    .description('Multi-line text input (Shift+Enter for newline)')
    .controls({
      initialValue: defaultControls.text('Initial Value', 'Line 1\nLine 2'),
    })
    .render((props) =>
      TextInput({
        initialValue: props.initialValue,
        multiline: true,
        onChange: (val: string) => console.log('Multi-line changed:', val),
      })
    ),

  story('TextInput - Auto-grow')
    .category('Atoms')
    .description('Auto-grow text input with overflow scrollbar')
    .controls({
      initialValue: defaultControls.text(
        'Initial Value',
        'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6'
      ),
    })
    .render((props) =>
      TextInput({
        initialValue: props.initialValue,
        multiline: true,
        wordWrap: true,
        autoGrow: true,
        maxLines: 5,
        showScrollbar: true,
        onChange: (val: string) => console.log('Auto-grow changed:', val),
      })
    ),

  story('TextInput - With Label')
    .category('Atoms')
    .description('TextInput with label and full-width')
    .controls({
      label: defaultControls.text('Label', 'Username:'),
      initialValue: defaultControls.text('Initial Value', 'john_doe'),
    })
    .render((props) =>
      Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color: 'primary' }, props.label),
        TextInput({
          initialValue: props.initialValue,
          fullWidth: true,
          onChange: (val: string) => console.log('Input changed:', val),
        })
      )
    ),
];

/**
 * ProgressBar stories
 */
export const progressBarStories: Story[] = [
  story('ProgressBar - Basic')
    .category('Atoms')
    .description('Basic progress bar')
    .controls({
      value: defaultControls.range('Progress', 65, 0, 100),
      width: defaultControls.range('Width', 30, 15, 50),
      showPercentage: defaultControls.boolean('Show %', true),
    })
    .render((props) =>
      ProgressBar({
        value: props.value,
        max: 100,
        width: props.width,
        showPercentage: props.showPercentage,
      })
    ),

  story('ProgressBar - Colors')
    .category('Atoms')
    .description('Progress bar with custom colors')
    .controls({
      value: defaultControls.range('Progress', 75, 0, 100),
      color: defaultControls.color('Color', 'green'),
    })
    .render((props) =>
      ProgressBar({
        value: props.value,
        max: 100,
        color: props.color,
        width: 30,
      })
    ),

  story('ProgressBar - With Label')
    .category('Atoms')
    .description('Progress bar with label')
    .controls({
      value: defaultControls.range('Progress', 42, 0, 100),
      label: defaultControls.text('Label', 'Progress'),
    })
    .render((props) =>
      ProgressBar({
        value: props.value,
        max: 100,
        label: props.label,
        width: 30,
      })
    ),

  story('ProgressBar - Multiple')
    .category('Atoms')
    .description('Multiple progress bars')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        ProgressBar({ value: 75, max: 100, width: 30, label: 'Downloading' }),
        ProgressBar({ value: 45, max: 100, width: 30, color: 'success', label: 'Installing' }),
        ProgressBar({ value: 10, max: 100, width: 30, color: 'warning', label: 'Configuring' })
      )
    ),

  story('ProgressBar - Thresholds')
    .category('Atoms')
    .description('Progress bar with color thresholds')
    .controls({
      value: defaultControls.range('Value', 80, 0, 100),
    })
    .render((props) => {
      const color = props.value > 80 ? 'red' : props.value > 60 ? 'yellow' : 'green';
      return ProgressBar({
        value: props.value,
        max: 100,
        width: 30,
        color,
      });
    }),
];

/**
 * MultiProgressBar stories
 */
export const multiProgressBarStories: Story[] = [
  story('MultiProgressBar - Segments')
    .category('Atoms')
    .description('Multi-segment progress bar (segments not fully controllable)')
    .render(() =>
      MultiProgressBar({
        total: 100,
        segments: [
          { value: 40, color: 'success', label: 'Ok' },
          { value: 30, color: 'warning', label: 'Warn' },
          { value: 30, color: 'error', label: 'Fail' },
        ],
      })
    ),
];

/**
 * Switch component stories
 */
export const switchStories: Story[] = [
  story('Switch - Basic')
    .category('Atoms')
    .description('Boolean toggle (onChange not controllable)')
    .controls({
      initialValue: defaultControls.boolean('Initial Value', true),
      label: defaultControls.text('Label', 'Dark Mode'),
      showLabels: defaultControls.boolean('Show Labels', false),
      onLabel: defaultControls.text('On Label', 'ON'),
      offLabel: defaultControls.text('Off Label', 'OFF'),
      size: defaultControls.select('Size', ['normal', 'compact'], 'normal'),
      disabled: defaultControls.boolean('Disabled', false),
      isActive: defaultControls.boolean('Active', true),
    })
    .render((props) =>
      Switch({
        initialValue: props.initialValue,
        label: props.label || undefined,
        showLabels: props.showLabels,
        onLabel: props.onLabel,
        offLabel: props.offLabel,
        size: props.size,
        disabled: props.disabled,
        isActive: props.isActive,
        onChange: () => {},
      })
    ),

  story('ToggleGroup - Basic')
    .category('Atoms')
    .description('Multiple toggles with shared layout (options not controllable)')
    .controls({
      direction: defaultControls.select('Direction', ['horizontal', 'vertical'], 'vertical'),
      gap: defaultControls.range('Gap', 1, 0, 4),
      isActive: defaultControls.boolean('Active', true),
    })
    .render((props) =>
      ToggleGroup({
        direction: props.direction,
        gap: props.gap,
        isActive: props.isActive,
        options: [
          { key: 'wifi', label: 'WiFi', initialValue: true },
          { key: 'bluetooth', label: 'Bluetooth', initialValue: false },
          { key: 'sync', label: 'Sync', initialValue: true },
        ],
        onChange: () => {},
      })
    ),
];

/**
 * Slider component stories
 */
export const sliderStories: Story[] = [
  story('Slider - Basic')
    .category('Atoms')
    .description('Single value slider (onChange not controllable)')
    .controls({
      label: defaultControls.text('Label', 'Volume'),
      min: defaultControls.number('Min', 0),
      max: defaultControls.number('Max', 100),
      step: defaultControls.number('Step', 1),
      initialValue: defaultControls.number('Initial Value', 50),
      showValue: defaultControls.boolean('Show Value', true),
      width: defaultControls.range('Width', 30, 10, 60),
      disabled: defaultControls.boolean('Disabled', false),
    })
    .render((props) =>
      Slider({
        label: props.label || undefined,
        min: props.min,
        max: props.max,
        step: props.step,
        initialValue: props.initialValue,
        showValue: props.showValue,
        width: props.width,
        disabled: props.disabled,
        onChange: () => {},
      })
    ),

  story('RangeSlider - Basic')
    .category('Atoms')
    .description('Range slider (onChange not controllable)')
    .controls({
      min: defaultControls.number('Min', 0),
      max: defaultControls.number('Max', 100),
      step: defaultControls.number('Step', 5),
      minValue: defaultControls.number('Min Value', 20),
      maxValue: defaultControls.number('Max Value', 80),
      width: defaultControls.range('Width', 30, 10, 60),
    })
    .render((props) =>
      RangeSlider({
        min: props.min,
        max: props.max,
        step: props.step,
        initialValue: [props.minValue, props.maxValue],
        width: props.width,
        onChange: () => {},
      })
    ),
];

/**
 * Timer component stories
 */
export const timerStories: Story[] = [
  story('Timer - Basic')
    .category('Atoms')
    .description('Timer display formatting')
    .controls({
      time: defaultControls.number('Time (ms)', 90450),
      format: defaultControls.select('Format', ['ss', 'mm:ss', 'hh:mm:ss', 'hh:mm:ss.ms', 'human'], 'mm:ss'),
      color: defaultControls.color('Color', 'cyan'),
      running: defaultControls.boolean('Running', true),
      paused: defaultControls.boolean('Paused', false),
      showIndicator: defaultControls.boolean('Show Indicator', true),
      label: defaultControls.text('Label', 'Timer'),
      bold: defaultControls.boolean('Bold', false),
      dimWhenPaused: defaultControls.boolean('Dim When Paused', true),
    })
    .render((props) =>
      Timer({
        time: props.time,
        format: props.format,
        color: props.color,
        running: props.running,
        paused: props.paused,
        showIndicator: props.showIndicator,
        label: props.label || undefined,
        bold: props.bold,
        dimWhenPaused: props.dimWhenPaused,
      })
    ),
];

/**
 * Tooltip component stories
 */
export const tooltipStories: Story[] = [
  story('Tooltip - Basic')
    .category('Atoms')
    .description('Standalone tooltip')
    .controls({
      content: defaultControls.text('Content', 'Tooltip content'),
      position: defaultControls.select('Position', ['top', 'bottom', 'left', 'right'], 'top'),
      arrow: defaultControls.boolean('Arrow', true),
      visible: defaultControls.boolean('Visible', true),
    })
    .render((props) =>
      Tooltip({
        content: props.content,
        position: props.position,
        arrow: props.arrow,
        visible: props.visible,
      }) ?? Box({})
    ),

  story('WithTooltip - Active')
    .category('Atoms')
    .description('Wrapper that shows tooltip when active')
    .controls({
      active: defaultControls.boolean('Active', true),
      position: defaultControls.select('Position', ['top', 'bottom', 'left', 'right'], 'top'),
      tooltip: defaultControls.text('Tooltip', 'Helpful hint'),
    })
    .render((props) =>
      WithTooltip({
        active: props.active,
        position: props.position,
        tooltip: props.tooltip,
        children: Button({ label: 'Hover or Focus', variant: 'outline' }),
      })
    ),

  story('InfoBox - Basic')
    .category('Atoms')
    .description('Info box message')
    .controls({
      title: defaultControls.text('Title', 'Info'),
      message: defaultControls.text('Message', 'This is an info message.'),
      type: defaultControls.select('Type', ['info', 'success', 'warning', 'error'], 'info'),
    })
    .render((props) =>
      InfoBox({
        title: props.title,
        message: props.message,
        type: props.type,
      })
    ),

  story('Popover - Basic')
    .category('Atoms')
    .description('Popover with content')
    .controls({
      visible: defaultControls.boolean('Visible', true),
      position: defaultControls.select('Position', ['top', 'bottom', 'left', 'right'], 'bottom'),
      width: defaultControls.range('Width', 24, 12, 40),
      arrow: defaultControls.boolean('Arrow', true),
    })
    .render((props) =>
      Popover({
        visible: props.visible,
        position: props.position,
        width: props.width,
        arrow: props.arrow,
        content: Box({ flexDirection: 'column', gap: 1 }, Text({}, 'Option 1'), Text({}, 'Option 2')),
      }) ?? Box({})
    ),

  story('Tag - Basic')
    .category('Atoms')
    .description('Tag label')
    .controls({
      label: defaultControls.text('Label', 'Tag'),
      color: defaultControls.color('Color', 'cyan'),
    })
    .render((props) =>
      Tag({
        label: props.label,
        color: props.color,
      })
    ),
];

/**
 * Status and metrics stories
 */
export const statusStories: Story[] = [
  story('StatusIndicator - Basic')
    .category('Atoms')
    .description('Status indicator with label')
    .controls({
      status: defaultControls.select('Status', ['success', 'warning', 'error', 'info', 'pending', 'running', 'stopped'], 'success'),
      label: defaultControls.text('Label', 'Connected'),
      showIcon: defaultControls.boolean('Show Icon', true),
      showDot: defaultControls.boolean('Show Dot', false),
      size: defaultControls.select('Size', ['sm', 'md', 'lg'], 'md'),
      pulse: defaultControls.boolean('Pulse', false),
    })
    .render((props) =>
      StatusIndicator({
        status: props.status,
        label: props.label,
        showIcon: props.showIcon,
        showDot: props.showDot,
        size: props.size,
        pulse: props.pulse,
      })
    ),

  story('MetricDisplay - Basic')
    .category('Atoms')
    .description('Metric display (trend not controllable)')
    .controls({
      label: defaultControls.text('Label', 'CPU'),
      value: defaultControls.number('Value', 42),
      unit: defaultControls.text('Unit', '%'),
      showTrend: defaultControls.boolean('Show Trend', true),
      showDelta: defaultControls.boolean('Show Delta', true),
    })
    .render((props) =>
      MetricDisplay({
        label: props.label,
        value: props.value,
        unit: props.unit,
        trend: [30, 40, 35, 50, 45, 60],
        showTrend: props.showTrend,
        showDelta: props.showDelta,
      })
    ),

  story('DataRow - Basic')
    .category('Atoms')
    .description('Key/value row with optional status indicator')
    .controls({
      label: defaultControls.text('Label', 'Host'),
      value: defaultControls.text('Value', 'api.internal.local'),
      status: defaultControls.select('Status', ['success', 'warning', 'error', 'info', 'pending', 'running', 'stopped'], 'success'),
      truncate: defaultControls.range('Truncate', 18, 8, 40),
    })
    .render((props) =>
      DataRow({
        label: props.label,
        value: props.value,
        status: props.status,
        truncate: props.truncate,
      })
    ),

  story('ListItem - Basic')
    .category('Atoms')
    .description('Standardized list row')
    .controls({
      icon: defaultControls.text('Icon', '📄'),
      primary: defaultControls.text('Primary', 'README.md'),
      secondary: defaultControls.text('Secondary', '2.1 KB'),
      trailing: defaultControls.text('Trailing', 'today'),
      selected: defaultControls.boolean('Selected', false),
      disabled: defaultControls.boolean('Disabled', false),
      indent: defaultControls.range('Indent', 0, 0, 4),
    })
    .render((props) =>
      ListItem({
        icon: props.icon,
        primary: props.primary,
        secondary: props.secondary,
        trailing: props.trailing,
        selected: props.selected,
        disabled: props.disabled,
        indent: props.indent,
      })
    ),

  story('HttpStatus - Basic')
    .category('Atoms')
    .description('HTTP status code with semantic colors')
    .controls({
      code: defaultControls.number('Code', 404),
      showText: defaultControls.boolean('Show Text', true),
      variant: defaultControls.select('Variant', ['badge', 'text', 'dot'], 'badge'),
    })
    .render((props) =>
      HttpStatus({
        code: props.code,
        showText: props.showText,
        variant: props.variant,
      })
    ),
];

/**
 * Scrollbar stories
 */
export const scrollbarStories: Story[] = [
  story('Scrollbar - Basic')
    .category('Atoms')
    .description('Standalone scrollbar')
    .controls({
      height: defaultControls.range('Height', 8, 4, 12),
      total: defaultControls.range('Total', 50, 10, 100),
      current: defaultControls.range('Current', 10, 0, 100),
      color: defaultControls.color('Color', 'cyan'),
      trackColor: defaultControls.color('Track Color', 'gray'),
    })
    .render((props) =>
      Scrollbar({
        height: props.height,
        total: props.total,
        current: Math.min(props.current, props.total),
        color: props.color,
        trackColor: props.trackColor,
      })
    ),
];

/**
 * Big text stories
 */
export const bigTextStories: Story[] = [
  story('BigText - Basic')
    .category('Atoms')
    .description('Large ASCII text display')
    .controls({
      text: defaultControls.text('Text', 'TUIUIU'),
      font: defaultControls.select('Font', listBigTextFonts(), listBigTextFonts()[0] || 'standard'),
      color: defaultControls.color('Color', 'cyan'),
    })
    .render((props) =>
      BigText({ text: props.text, font: props.font, color: props.color })
    ),

  story('FigletText - Basic')
    .category('Atoms')
    .description('Figlet-style text')
    .controls({
      text: defaultControls.text('Text', 'Figlet'),
      font: defaultControls.select('Font', listBigTextFonts(), listBigTextFonts()[0] || 'standard'),
      color: defaultControls.color('Color', 'green'),
    })
    .render((props) =>
      FigletText({ text: props.text, font: props.font, color: props.color })
    ),

  story('BigTitle - Basic')
    .category('Atoms')
    .description('Big title with subtitle')
    .controls({
      title: defaultControls.text('Title', 'Dashboard'),
      subtitle: defaultControls.text('Subtitle', 'System Status'),
      color: defaultControls.color('Color', 'cyan'),
    })
    .render((props) =>
      BigTitle({ title: props.title, subtitle: props.subtitle, color: props.color })
    ),

  story('Logo - Basic')
    .category('Atoms')
    .description('Logo renderer')
    .controls({
      text: defaultControls.text('Text', 'TUIUIU'),
      color: defaultControls.color('Color', 'cyan'),
    })
    .render((props) =>
      Logo({ text: props.text, colors: [props.color] })
    ),
];

/**
 * Digits stories
 */
export const digitsStories: Story[] = [
  story('Digits - Basic')
    .category('Atoms')
    .description('LCD-style numeric display')
    .controls({
      value: defaultControls.text('Value', '1234'),
      style: defaultControls.select('Style', ['lcd', 'block', 'dotmatrix', 'minimal'], 'lcd'),
      digits: defaultControls.range('Digits', 4, 2, 8),
      color: defaultControls.color('Color', 'cyan'),
    })
    .render((props) =>
      Digits({
        value: props.value,
        style: props.style,
        digits: props.digits,
        color: props.color,
      })
    ),

  story('Clock - Basic')
    .category('Atoms')
    .description('Clock display')
    .controls({
      time: defaultControls.text('Time', '12:34'),
      style: defaultControls.select('Style', ['lcd', 'block', 'dotmatrix', 'minimal'], 'block'),
      color: defaultControls.color('Color', 'green'),
    })
    .render((props) =>
      Clock({
        time: props.time,
        style: props.style,
        color: props.color,
      })
    ),

  story('Counter - Basic')
    .category('Atoms')
    .description('Counter display')
    .controls({
      value: defaultControls.number('Value', 42),
      style: defaultControls.select('Style', ['lcd', 'block', 'dotmatrix', 'minimal'], 'minimal'),
      color: defaultControls.color('Color', 'yellow'),
    })
    .render((props) =>
      Counter({
        value: props.value,
        style: props.style,
        color: props.color,
      })
    ),

  story('Countdown - Basic')
    .category('Atoms')
    .description('Countdown display')
    .controls({
      seconds: defaultControls.number('Seconds', 45),
      style: defaultControls.select('Style', ['lcd', 'block', 'dotmatrix', 'minimal'], 'lcd'),
      color: defaultControls.color('Color', 'red'),
    })
    .render((props) =>
      Countdown({
        seconds: props.seconds,
        style: props.style,
        color: props.color,
      })
    ),

  story('Stopwatch - Basic')
    .category('Atoms')
    .description('Stopwatch display')
    .controls({
      milliseconds: defaultControls.number('Milliseconds', 83000),
      style: defaultControls.select('Style', ['lcd', 'block', 'dotmatrix', 'minimal'], 'dotmatrix'),
      color: defaultControls.color('Color', 'cyan'),
    })
    .render((props) =>
      Stopwatch({
        milliseconds: props.milliseconds,
        style: props.style,
        color: props.color,
      })
    ),

  story('DigitRoll - Basic')
    .category('Atoms')
    .description('Digit roll animation')
    .controls({
      value: defaultControls.number('Value', 7),
      style: defaultControls.select('Style', ['lcd', 'block', 'dotmatrix', 'minimal'], 'block'),
      color: defaultControls.color('Color', 'green'),
    })
    .render((props) =>
      DigitRoll({
        value: props.value,
        style: props.style,
        color: props.color,
      })
    ),

  story('Score - Basic')
    .category('Atoms')
    .description('Score display')
    .controls({
      score: defaultControls.number('Score', 3),
      label: defaultControls.text('Label', 'SCORE'),
      style: defaultControls.select('Style', ['lcd', 'block', 'dotmatrix', 'minimal'], 'block'),
    })
    .render((props) =>
      Score({
        score: props.score,
        label: props.label,
        style: props.style,
      })
    ),
];

/**
 * Picture stories
 */
export const pictureStories: Story[] = [
  story('Picture - Basic')
    .category('Atoms')
    .description('ASCII picture renderer')
    .controls({
      width: defaultControls.range('Width', 16, 8, 30),
      height: defaultControls.range('Height', 8, 4, 15),
      borderStyle: defaultControls.select('Border Style', ['none', 'single', 'double', 'round', 'bold'], 'round'),
    })
    .render((props) =>
      Picture({
        source: AsciiPatterns.box(props.width, props.height, 'single'),
        borderStyle: props.borderStyle,
      })
    ),

  story('FramedPicture - Basic')
    .category('Atoms')
    .description('Framed picture with title')
    .controls({
      title: defaultControls.text('Title', 'Preview'),
    })
    .render((props) =>
      FramedPicture({
        title: props.title,
        source: AsciiPatterns.diamond(7),
      })
    ),

  story('ColoredPicture - Basic')
    .category('Atoms')
    .description('Colored picture from pixel grid')
    .render(() => {
      const pixels = createPixelGridFromColors([
        ['red', 'red', 'red', 'red'],
        ['red', 'yellow', 'yellow', 'red'],
        ['red', 'yellow', 'yellow', 'red'],
        ['red', 'red', 'red', 'red'],
      ]);
      return ColoredPicture({ pixels });
    }),

  story('AnimatedPicture - Basic')
    .category('Atoms')
    .description('Animated picture (animation props not controllable)')
    .render(() => {
      const pixels = createPixelGridFromColors([
        ['cyan', 'cyan', 'cyan'],
        ['cyan', null, 'cyan'],
        ['cyan', 'cyan', 'cyan'],
      ]);
      return AnimatedPicture({
        pixels,
        animation: 'pulse',
        duration: 1200,
        loop: true,
        autoPlay: true,
      });
    }),
];

/**
 * Spinner component stories (animated)
 *
 * These stories use the animation system to show real spinning animations.
 * Press [Space] to pause/resume the animation.
 */

// All spinner type names for the selector
const allSpinnerTypes = Object.keys(spinnerFrames) as (keyof typeof spinnerFrames)[];

export const spinnerStories: Story[] = [
  // ===== Basic Spinners =====
  story('Spinner - Selector')
    .category('Atoms')
    .description('Choose any spinner type - use [Space] to pause')
    .controls({
      type: defaultControls.select('Type', allSpinnerTypes as string[], 'dots'),
    })
    .animated(80)
    .render((props, frame = 0) => {
      const frames = spinnerFrames[props.type as keyof typeof spinnerFrames];
      const currentFrame = frames[frame % frames.length];
      return Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color: 'primary' }, currentFrame),
        Text({ color: 'mutedForeground' }, 'Loading...')
      );
    }),

  story('Spinner - Dots Variants')
    .category('Atoms')
    .description('Three different dot spinner styles')
    .animated(80)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 2, width: 20 },
          Text({ color: 'primary' }, spinnerFrames.dots[frame % spinnerFrames.dots.length]),
          Text({ color: 'mutedForeground' }, 'dots')
        ),
        Box(
          { flexDirection: 'row', gap: 2, width: 20 },
          Text({ color: 'success' }, spinnerFrames.dots2[frame % spinnerFrames.dots2.length]),
          Text({ color: 'mutedForeground' }, 'dots2')
        ),
        Box(
          { flexDirection: 'row', gap: 2, width: 20 },
          Text({ color: 'warning' }, spinnerFrames.dots3[frame % spinnerFrames.dots3.length]),
          Text({ color: 'mutedForeground' }, 'dots3')
        )
      )
    ),

  story('Spinner - Geometric')
    .category('Atoms')
    .description('Circle, square, arc and line spinners')
    .animated(100)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 2, width: 20 },
          Text({ color: 'primary' }, spinnerFrames.circle[frame % spinnerFrames.circle.length]),
          Text({ color: 'mutedForeground' }, 'circle')
        ),
        Box(
          { flexDirection: 'row', gap: 2, width: 20 },
          Text({ color: 'accent' }, spinnerFrames.square[frame % spinnerFrames.square.length]),
          Text({ color: 'mutedForeground' }, 'square')
        ),
        Box(
          { flexDirection: 'row', gap: 2, width: 20 },
          Text({ color: 'warning' }, spinnerFrames.arc[frame % spinnerFrames.arc.length]),
          Text({ color: 'mutedForeground' }, 'arc')
        ),
        Box(
          { flexDirection: 'row', gap: 2, width: 20 },
          Text({ color: 'success' }, spinnerFrames.line[frame % spinnerFrames.line.length]),
          Text({ color: 'mutedForeground' }, 'line')
        )
      )
    ),

  story('Spinner - Arrows')
    .category('Atoms')
    .description('Arrow-based spinners')
    .animated(100)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'primary' }, spinnerFrames.arrow[frame % spinnerFrames.arrow.length]),
          Text({ color: 'mutedForeground' }, 'arrow (rotating)')
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'success' }, spinnerFrames.arrowPulse[frame % spinnerFrames.arrowPulse.length]),
          Text({ color: 'mutedForeground' }, 'arrowPulse')
        )
      )
    ),

  // ===== Emoji Spinners =====
  story('Spinner - Emoji Clock')
    .category('Atoms')
    .description('Clock face emoji spinner')
    .animated(100)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({}, spinnerFrames.clock[frame % spinnerFrames.clock.length]),
        Text({ color: 'mutedForeground' }, 'Time is passing...')
      )
    ),

  story('Spinner - Emoji Earth')
    .category('Atoms')
    .description('Rotating earth globe')
    .animated(180)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({}, spinnerFrames.earth[frame % spinnerFrames.earth.length]),
        Text({ color: 'mutedForeground' }, 'Connecting worldwide...')
      )
    ),

  story('Spinner - Emoji Moon')
    .category('Atoms')
    .description('Moon phases animation')
    .animated(150)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({}, spinnerFrames.moon[frame % spinnerFrames.moon.length]),
        Text({ color: 'mutedForeground' }, 'Night mode loading...')
      )
    ),

  story('Spinner - Emoji Hearts')
    .category('Atoms')
    .description('Colorful hearts')
    .animated(150)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({}, spinnerFrames.hearts[frame % spinnerFrames.hearts.length]),
        Text({ color: 'mutedForeground' }, 'Sending love...')
      )
    ),

  story('Spinner - Emoji Weather')
    .category('Atoms')
    .description('Weather conditions cycling')
    .animated(200)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({}, spinnerFrames.weather[frame % spinnerFrames.weather.length]),
        Text({ color: 'mutedForeground' }, 'Fetching forecast...')
      )
    ),

  story('Spinner - Emoji Runner')
    .category('Atoms')
    .description('Walking/running animation')
    .animated(200)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({}, spinnerFrames.runner[frame % spinnerFrames.runner.length]),
        Text({ color: 'mutedForeground' }, 'Processing...')
      )
    ),

  // ===== Bar & Progress Spinners =====
  story('Spinner - Bouncing Bar')
    .category('Atoms')
    .description('Classic bouncing progress bar')
    .animated(80)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'primary' }, spinnerFrames.bouncingBar[frame % spinnerFrames.bouncingBar.length]),
        Text({ color: 'mutedForeground' }, 'Working...')
      )
    ),

  story('Spinner - Aesthetic Bar')
    .category('Atoms')
    .description('Modern aesthetic progress animation')
    .animated(80)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'accent' }, spinnerFrames.aesthetic[frame % spinnerFrames.aesthetic.length]),
        Text({ color: 'mutedForeground' }, 'Loading...')
      )
    ),

  story('Spinner - Bar Growth')
    .category('Atoms')
    .description('Growing bar animation')
    .animated(80)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'success' }, spinnerFrames.bar[frame % spinnerFrames.bar.length]),
        Text({ color: 'mutedForeground' }, 'Filling...')
      )
    ),

  story('Spinner - Pulse')
    .category('Atoms')
    .description('Pulsing intensity animation')
    .animated(100)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'destructive' }, spinnerFrames.pulse[frame % spinnerFrames.pulse.length]),
        Text({ color: 'mutedForeground' }, 'Heartbeat...')
      )
    ),

  // ===== Fun & Special Spinners =====
  story('Spinner - Pong')
    .category('Atoms')
    .description('Classic Pong game animation')
    .animated(80)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Text({ color: 'primary' }, spinnerFrames.pong[frame % spinnerFrames.pong.length]),
        Text({ color: 'mutedForeground', dim: true }, 'Playing Pong while waiting...')
      )
    ),

  story('Spinner - Binary')
    .category('Atoms')
    .description('Binary code animation - for hackers')
    .animated(100)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'success' }, spinnerFrames.binary[frame % spinnerFrames.binary.length]),
        Text({ color: 'success', dim: true }, 'Decoding...')
      )
    ),

  story('Spinner - Binary Config')
    .category('Atoms')
    .description('Binary spinner with configurable width')
    .controls({
      minWidth: defaultControls.range('Width', 12, 4, 32),
    })
    .animated(100)
    .render((props, frame = 0) => {
      // Simulate the dynamic generation logic for the story
      const width = props.minWidth;
      const seed = frame;
      let s = seed;
      const binaryStr = Array.from({ length: width }, () => {
          s = (s * 9301 + 49297) % 233280;
          return (s / 233280) > 0.5 ? '1' : '0';
      }).join('');
      
      return Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'success' }, binaryStr),
        Text({ color: 'success', dim: true }, `Decoding (${width} bits)...`)
      );
    }),

  story('Spinner - Star')
    .category('Atoms')
    .description('Twinkling star animation')
    .animated(100)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'warning' }, spinnerFrames.star[frame % spinnerFrames.star.length]),
        Text({ color: 'mutedForeground' }, 'Sparkling...')
      )
    ),

  story('Spinner - Grow')
    .category('Atoms')
    .description('Growing/shrinking dot')
    .animated(120)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'primary' }, spinnerFrames.grow[frame % spinnerFrames.grow.length]),
        Text({ color: 'mutedForeground' }, 'Breathing...')
      )
    ),

  // ===== Box Drawing Spinners =====
  story('Spinner - Box Bounce')
    .category('Atoms')
    .description('Box corner bouncing animations')
    .animated(100)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'primary' }, spinnerFrames.boxBounce[frame % spinnerFrames.boxBounce.length]),
          Text({ color: 'mutedForeground' }, 'boxBounce')
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'accent' }, spinnerFrames.boxBounce2[frame % spinnerFrames.boxBounce2.length]),
          Text({ color: 'mutedForeground' }, 'boxBounce2')
        )
      )
    ),

  story('Spinner - Pipe')
    .category('Atoms')
    .description('Rotating pipe/box characters')
    .animated(100)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'primary' }, spinnerFrames.pipe[frame % spinnerFrames.pipe.length]),
        Text({ color: 'mutedForeground' }, 'Building...')
      )
    ),

  // ===== Simple Spinners =====
  story('Spinner - Toggle')
    .category('Atoms')
    .description('Simple toggle animations')
    .animated(150)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'primary' }, spinnerFrames.toggle[frame % spinnerFrames.toggle.length]),
          Text({ color: 'mutedForeground' }, 'toggle')
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'foreground' }, spinnerFrames.toggle2[frame % spinnerFrames.toggle2.length]),
          Text({ color: 'mutedForeground' }, 'toggle2')
        )
      )
    ),

  story('Spinner - Noise')
    .category('Atoms')
    .description('Static noise effect')
    .animated(80)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'mutedForeground' }, spinnerFrames.noise[frame % spinnerFrames.noise.length]),
        Text({ color: 'mutedForeground' }, 'Scanning...')
      )
    ),

  story('Spinner - Flip')
    .category('Atoms')
    .description('Flipping line animation')
    .animated(80)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'warning' }, spinnerFrames.flip[frame % spinnerFrames.flip.length]),
        Text({ color: 'mutedForeground' }, 'Flipping...')
      )
    ),

  // ===== Combined Demos =====
  story('Spinner - All Basic')
    .category('Atoms')
    .description('All basic spinner types')
    .animated(80)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'column', gap: 0 },
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'primary' }, spinnerFrames.dots[frame % spinnerFrames.dots.length]), Text({ color: 'mutedForeground' }, 'dots')),
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'primary' }, spinnerFrames.line[frame % spinnerFrames.line.length]), Text({ color: 'mutedForeground' }, 'line')),
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'primary' }, spinnerFrames.arc[frame % spinnerFrames.arc.length]), Text({ color: 'mutedForeground' }, 'arc')),
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'primary' }, spinnerFrames.circle[frame % spinnerFrames.circle.length]), Text({ color: 'mutedForeground' }, 'circle')),
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'primary' }, spinnerFrames.square[frame % spinnerFrames.square.length]), Text({ color: 'mutedForeground' }, 'square')),
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'primary' }, spinnerFrames.bounce[frame % spinnerFrames.bounce.length]), Text({ color: 'mutedForeground' }, 'bounce')),
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'primary' }, spinnerFrames.grow[frame % spinnerFrames.grow.length]), Text({ color: 'mutedForeground' }, 'grow')),
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'primary' }, spinnerFrames.star[frame % spinnerFrames.star.length]), Text({ color: 'mutedForeground' }, 'star'))
      )
    ),

  story('Spinner - All Emoji')
    .category('Atoms')
    .description('All emoji spinner types')
    .animated(150)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'column', gap: 0 },
        Box({ flexDirection: 'row', gap: 2 }, Text({}, spinnerFrames.clock[frame % spinnerFrames.clock.length]), Text({ color: 'mutedForeground' }, 'clock')),
        Box({ flexDirection: 'row', gap: 2 }, Text({}, spinnerFrames.earth[frame % spinnerFrames.earth.length]), Text({ color: 'mutedForeground' }, 'earth')),
        Box({ flexDirection: 'row', gap: 2 }, Text({}, spinnerFrames.moon[frame % spinnerFrames.moon.length]), Text({ color: 'mutedForeground' }, 'moon')),
        Box({ flexDirection: 'row', gap: 2 }, Text({}, spinnerFrames.hearts[frame % spinnerFrames.hearts.length]), Text({ color: 'mutedForeground' }, 'hearts')),
        Box({ flexDirection: 'row', gap: 2 }, Text({}, spinnerFrames.weather[frame % spinnerFrames.weather.length]), Text({ color: 'mutedForeground' }, 'weather')),
        Box({ flexDirection: 'row', gap: 2 }, Text({}, spinnerFrames.runner[frame % spinnerFrames.runner.length]), Text({ color: 'mutedForeground' }, 'runner'))
      )
    ),

  story('Spinner - With Colors')
    .category('Atoms')
    .description('Customize spinner color')
    .controls({
      color: defaultControls.color('Color', 'cyan'),
      type: defaultControls.select('Type', ['dots', 'arc', 'circle', 'arrow', 'star', 'grow'], 'dots'),
    })
    .animated(80)
    .render((props, frame = 0) => {
      const frames = spinnerFrames[props.type as keyof typeof spinnerFrames];
      return Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: props.color }, frames[frame % frames.length]),
        Text({ color: props.color }, 'Loading...')
      );
    }),

  story('Spinner - Multi-Task')
    .category('Atoms')
    .description('Multiple concurrent tasks with different spinners')
    .animated(80)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'round', borderColor: 'border' },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'success' }, '✓'),
          Text({ color: 'success' }, 'Connected to server')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'primary' }, spinnerFrames.dots[frame % spinnerFrames.dots.length]),
          Text({ color: 'foreground' }, 'Downloading assets...')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'warning' }, spinnerFrames.bouncingBar[frame % spinnerFrames.bouncingBar.length]),
          Text({ color: 'foreground' }, 'Processing data...')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'accent' }, spinnerFrames.aesthetic[frame % spinnerFrames.aesthetic.length]),
          Text({ color: 'foreground' }, 'Generating report...')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'mutedForeground', dim: true }, '○'),
          Text({ color: 'mutedForeground', dim: true }, 'Waiting: Upload files')
        )
      )
    ),

  story('Spinner - Speed Demo')
    .category('Atoms')
    .description('Same spinner at different speeds')
    .animated(50)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'success' }, spinnerFrames.dots[frame % spinnerFrames.dots.length]),
          Text({ color: 'mutedForeground' }, 'Fast (50ms)')
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'warning' }, spinnerFrames.dots[Math.floor(frame / 2) % spinnerFrames.dots.length]),
          Text({ color: 'mutedForeground' }, 'Medium (100ms)')
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'destructive' }, spinnerFrames.dots[Math.floor(frame / 4) % spinnerFrames.dots.length]),
          Text({ color: 'mutedForeground' }, 'Slow (200ms)')
        )
      )
    ),
];

/**
 * All atom stories
 */
export const allAtomStories: Story[] = [
  ...badgeStories,
  ...buttonStories,
  ...textInputStories,
  ...progressBarStories,
  ...multiProgressBarStories,
  ...switchStories,
  ...sliderStories,
  ...timerStories,
  ...tooltipStories,
  ...statusStories,
  ...scrollbarStories,
  ...bigTextStories,
  ...digitsStories,
  ...pictureStories,
  ...spinnerStories,
];

export default allAtomStories;
