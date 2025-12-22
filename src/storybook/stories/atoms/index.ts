/**
 * Atoms Stories
 *
 * Atoms are the basic building blocks of the UI.
 * They are the smallest, most fundamental components that cannot be broken down further:
 * - Box: Container with flexbox layout
 * - Text: Styled text rendering
 * - Spacer: Flexible spacing element
 * - Divider: Visual separator
 * - Badge: Simple status label
 * - Spinner: Loading indicator
 */

import { Box, Text, Spacer } from '../../../primitives/nodes.js';
import { Divider } from '../../../primitives/divider.js';
import { story, defaultControls } from '../../core/registry.js';
import { themeColor } from '../../../core/theme.js';
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
export const boxStories: Story[] = [
  story('Box - Basic')
    .category('Atoms')
    .description('Basic box container with content')
    .controls({
      padding: defaultControls.range('Padding', 1, 0, 5),
      content: defaultControls.text('Content', 'Hello, Box!'),
    })
    .render((props) =>
      Box(
        { padding: props.padding },
        Text({}, props.content)
      )
    ),

  story('Box - Flex Direction')
    .category('Atoms')
    .description('Box with different flex directions')
    .controls({
      direction: defaultControls.select('Direction', ['row', 'column', 'row-reverse', 'column-reverse'], 'column'),
    })
    .render((props) =>
      Box(
        { flexDirection: props.direction, gap: 1 },
        Text({ color: 'cyan' }, 'First'),
        Text({ color: 'green' }, 'Second'),
        Text({ color: 'yellow' }, 'Third')
      )
    ),

  story('Box - Border Styles')
    .category('Atoms')
    .description('Box with different border styles')
    .controls({
      borderStyle: defaultControls.select('Border Style', ['single', 'double', 'round', 'bold', 'singleDouble', 'doubleSingle', 'classic', 'arrow', 'none'], 'single'),
      borderColor: defaultControls.color('Border Color', 'cyan'),
    })
    .render((props) =>
      Box(
        {
          borderStyle: props.borderStyle,
          borderColor: props.borderColor,
          padding: 1,
        },
        Text({}, 'Bordered box')
      )
    ),

  story('Box - Padding & Margin')
    .category('Atoms')
    .description('Box with padding and margin variations')
    .controls({
      padding: defaultControls.range('Padding', 1, 0, 5),
      paddingX: defaultControls.range('Padding X', 0, 0, 5),
      paddingY: defaultControls.range('Padding Y', 0, 0, 5),
    })
    .render((props) =>
      Box(
        { borderStyle: 'single', borderColor: 'gray' },
        Box(
          {
            padding: props.padding,
            paddingX: props.paddingX || undefined,
            paddingY: props.paddingY || undefined,
            backgroundColor: 'blue',
          },
          Text({ color: 'white' }, 'Content')
        )
      )
    ),

  story('Box - Alignment')
    .category('Atoms')
    .description('Box with justify and align options')
    .controls({
      justifyContent: defaultControls.select('Justify', ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'], 'flex-start'),
      alignItems: defaultControls.select('Align', ['flex-start', 'flex-end', 'center', 'stretch'], 'flex-start'),
    })
    .render((props) =>
      Box(
        {
          width: 40,
          height: 10,
          justifyContent: props.justifyContent,
          alignItems: props.alignItems,
          borderStyle: 'single',
          borderColor: 'gray',
        },
        Box(
          { backgroundColor: 'blue', padding: 1 },
          Text({ color: 'white' }, 'A')
        ),
        Box(
          { backgroundColor: 'green', padding: 1 },
          Text({ color: 'white' }, 'B')
        )
      )
    ),

  story('Box - Dimensions')
    .category('Atoms')
    .description('Box with width and height')
    .controls({
      width: defaultControls.range('Width', 30, 10, 60),
      height: defaultControls.range('Height', 5, 3, 15),
    })
    .render((props) =>
      Box(
        {
          width: props.width,
          height: props.height,
          borderStyle: 'single',
          borderColor: 'cyan',
          justifyContent: 'center',
          alignItems: 'center',
        },
        Text({}, `${props.width}x${props.height}`)
      )
    ),
];

/**
 * Text component stories
 */
export const textStories: Story[] = [
  story('Text - Basic')
    .category('Atoms')
    .description('Basic text with styling options')
    .controls({
      content: defaultControls.text('Content', 'Hello, Tuiuiu!'),
      color: defaultControls.color('Color', 'white'),
      bold: defaultControls.boolean('Bold', false),
      italic: defaultControls.boolean('Italic', false),
      underline: defaultControls.boolean('Underline', false),
    })
    .render((props) =>
      Text(
        {
          color: props.color,
          bold: props.bold,
          italic: props.italic,
          underline: props.underline,
        },
        props.content
      )
    ),

  story('Text - All Colors')
    .category('Atoms')
    .description('Display all available colors')
    .render(() =>
      Box(
        { flexDirection: 'column' },
        Text({ color: 'white' }, 'white'),
        Text({ color: 'gray' }, 'gray'),
        Text({ color: 'red' }, 'red'),
        Text({ color: 'green' }, 'green'),
        Text({ color: 'yellow' }, 'yellow'),
        Text({ color: 'blue' }, 'blue'),
        Text({ color: 'magenta' }, 'magenta'),
        Text({ color: 'cyan' }, 'cyan'),
        Text({ color: 'redBright' }, 'redBright'),
        Text({ color: 'greenBright' }, 'greenBright'),
        Text({ color: 'yellowBright' }, 'yellowBright'),
        Text({ color: 'blueBright' }, 'blueBright'),
        Text({ color: 'magentaBright' }, 'magentaBright'),
        Text({ color: 'cyanBright' }, 'cyanBright')
      )
    ),

  story('Text - Dim Effect')
    .category('Atoms')
    .description('Text with dim styling')
    .controls({
      dim: defaultControls.boolean('Dim', true),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Text({}, 'Normal text'),
        Text({ dim: props.dim }, 'Dimmed text'),
        Text({ color: 'cyan', dim: props.dim }, 'Dimmed colored text')
      )
    ),

  story('Text - Inverse')
    .category('Atoms')
    .description('Text with inverse colors')
    .controls({
      inverse: defaultControls.boolean('Inverse', true),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Text({ color: 'cyan', inverse: props.inverse }, ' Selected Item '),
        Text({ color: 'green', inverse: props.inverse }, ' Active '),
        Text({ color: 'red', inverse: props.inverse }, ' Error ')
      )
    ),

  story('Text - Strikethrough')
    .category('Atoms')
    .description('Text with strikethrough effect')
    .controls({
      strikethrough: defaultControls.boolean('Strikethrough', true),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column' },
        Text({ strikethrough: props.strikethrough }, 'Completed task'),
        Text({ strikethrough: props.strikethrough, color: 'red' }, 'Deleted item'),
        Text({}, 'Normal text')
      )
    ),

  story('Text - Wrap Modes')
    .category('Atoms')
    .description('Text wrapping behavior')
    .controls({
      wrap: defaultControls.select('Wrap', ['wrap', 'truncate', 'truncate-start', 'truncate-middle', 'truncate-end'], 'wrap'),
    })
    .render((props) =>
      Box(
        { width: 30, borderStyle: 'single', borderColor: 'gray' },
        Text(
          { wrap: props.wrap },
          'This is a very long text that will demonstrate different wrapping behaviors in a narrow container.'
        )
      )
    ),
];

/**
 * Spacer component stories
 */
export const spacerStories: Story[] = [
  story('Spacer - Basic')
    .category('Atoms')
    .description('Flexible space between elements')
    .render(() =>
      Box(
        { flexDirection: 'row', width: 40, borderStyle: 'single', borderColor: 'gray' },
        Text({ color: 'cyan' }, 'Left'),
        Spacer({}),
        Text({ color: 'yellow' }, 'Right')
      )
    ),

  story('Spacer - Multiple')
    .category('Atoms')
    .description('Multiple spacers for even distribution')
    .render(() =>
      Box(
        { flexDirection: 'row', width: 50, borderStyle: 'single', borderColor: 'gray' },
        Text({}, 'A'),
        Spacer({}),
        Text({}, 'B'),
        Spacer({}),
        Text({}, 'C'),
        Spacer({}),
        Text({}, 'D')
      )
    ),

  story('Spacer - Vertical')
    .category('Atoms')
    .description('Spacer in vertical layout')
    .render(() =>
      Box(
        { flexDirection: 'column', height: 10, borderStyle: 'single', borderColor: 'gray' },
        Text({ color: 'cyan' }, 'Header'),
        Spacer({}),
        Text({ color: 'gray' }, 'Footer')
      )
    ),
];

/**
 * Divider component stories
 */
export const dividerStories: Story[] = [
  story('Divider - Horizontal')
    .category('Atoms')
    .description('Horizontal divider line')
    .controls({
      color: defaultControls.color('Color', 'gray'),
      char: defaultControls.text('Character', '─'),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', width: 40 },
        Text({}, 'Section 1'),
        Divider({ color: props.color, char: props.char }),
        Text({}, 'Section 2')
      )
    ),

  story('Divider - With Title')
    .category('Atoms')
    .description('Divider with title text')
    .controls({
      title: defaultControls.text('Title', 'Section'),
      titleColor: defaultControls.color('Title Color', 'cyan'),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', width: 40 },
        Text({}, 'Above'),
        Divider({ title: props.title, titleColor: props.titleColor }),
        Text({}, 'Below')
      )
    ),
];

/**
 * Badge component stories
 */
export const badgeStories: Story[] = [
  story('Badge - Basic')
    .category('Atoms')
    .description('Simple status badge')
    .controls({
      label: defaultControls.text('Label', 'NEW'),
      color: defaultControls.color('Color', 'cyan'),
    })
    .render((props) =>
      Text({ color: props.color, inverse: true }, ` ${props.label} `)
    ),

  story('Badge - Status Types')
    .category('Atoms')
    .description('Different status badge types')
    .render(() =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'green', inverse: true }, ' SUCCESS '),
        Text({ color: 'yellow', inverse: true }, ' WARNING '),
        Text({ color: 'red', inverse: true }, ' ERROR '),
        Text({ color: 'blue', inverse: true }, ' INFO '),
        Text({ color: 'gray', inverse: true }, ' DISABLED ')
      )
    ),

  story('Badge - Outline')
    .category('Atoms')
    .description('Outline style badges')
    .render(() =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Box(
          { borderStyle: 'single', borderColor: 'green', paddingX: 1 },
          Text({ color: 'green' }, 'Success')
        ),
        Box(
          { borderStyle: 'single', borderColor: 'yellow', paddingX: 1 },
          Text({ color: 'yellow' }, 'Warning')
        ),
        Box(
          { borderStyle: 'single', borderColor: 'red', paddingX: 1 },
          Text({ color: 'red' }, 'Error')
        )
      )
    ),

  story('Badge - With Icons')
    .category('Atoms')
    .description('Badges with status icons')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'green' }, '✓'),
          Text({ color: 'green', inverse: true }, ' PASSED ')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'red' }, '✗'),
          Text({ color: 'red', inverse: true }, ' FAILED ')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'yellow' }, '⚠'),
          Text({ color: 'yellow', inverse: true }, ' PENDING ')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'cyan' }, '●'),
          Text({ color: 'cyan', inverse: true }, ' RUNNING ')
        )
      )
    ),
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
        Text({ color: 'cyan' }, currentFrame),
        Text({ color: 'gray' }, 'Loading...')
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
          Text({ color: 'cyan' }, spinnerFrames.dots[frame % spinnerFrames.dots.length]),
          Text({ color: 'gray' }, 'dots')
        ),
        Box(
          { flexDirection: 'row', gap: 2, width: 20 },
          Text({ color: 'green' }, spinnerFrames.dots2[frame % spinnerFrames.dots2.length]),
          Text({ color: 'gray' }, 'dots2')
        ),
        Box(
          { flexDirection: 'row', gap: 2, width: 20 },
          Text({ color: 'yellow' }, spinnerFrames.dots3[frame % spinnerFrames.dots3.length]),
          Text({ color: 'gray' }, 'dots3')
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
          Text({ color: 'cyan' }, spinnerFrames.circle[frame % spinnerFrames.circle.length]),
          Text({ color: 'gray' }, 'circle')
        ),
        Box(
          { flexDirection: 'row', gap: 2, width: 20 },
          Text({ color: 'magenta' }, spinnerFrames.square[frame % spinnerFrames.square.length]),
          Text({ color: 'gray' }, 'square')
        ),
        Box(
          { flexDirection: 'row', gap: 2, width: 20 },
          Text({ color: 'yellow' }, spinnerFrames.arc[frame % spinnerFrames.arc.length]),
          Text({ color: 'gray' }, 'arc')
        ),
        Box(
          { flexDirection: 'row', gap: 2, width: 20 },
          Text({ color: 'green' }, spinnerFrames.line[frame % spinnerFrames.line.length]),
          Text({ color: 'gray' }, 'line')
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
          Text({ color: 'cyan' }, spinnerFrames.arrow[frame % spinnerFrames.arrow.length]),
          Text({ color: 'gray' }, 'arrow (rotating)')
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'green' }, spinnerFrames.arrowPulse[frame % spinnerFrames.arrowPulse.length]),
          Text({ color: 'gray' }, 'arrowPulse')
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
        Text({ color: 'gray' }, 'Time is passing...')
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
        Text({ color: 'gray' }, 'Connecting worldwide...')
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
        Text({ color: 'gray' }, 'Night mode loading...')
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
        Text({ color: 'gray' }, 'Sending love...')
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
        Text({ color: 'gray' }, 'Fetching forecast...')
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
        Text({ color: 'gray' }, 'Processing...')
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
        Text({ color: 'cyan' }, spinnerFrames.bouncingBar[frame % spinnerFrames.bouncingBar.length]),
        Text({ color: 'gray' }, 'Working...')
      )
    ),

  story('Spinner - Aesthetic Bar')
    .category('Atoms')
    .description('Modern aesthetic progress animation')
    .animated(80)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'magenta' }, spinnerFrames.aesthetic[frame % spinnerFrames.aesthetic.length]),
        Text({ color: 'gray' }, 'Loading...')
      )
    ),

  story('Spinner - Bar Growth')
    .category('Atoms')
    .description('Growing bar animation')
    .animated(80)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'green' }, spinnerFrames.bar[frame % spinnerFrames.bar.length]),
        Text({ color: 'gray' }, 'Filling...')
      )
    ),

  story('Spinner - Pulse')
    .category('Atoms')
    .description('Pulsing intensity animation')
    .animated(100)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'red' }, spinnerFrames.pulse[frame % spinnerFrames.pulse.length]),
        Text({ color: 'gray' }, 'Heartbeat...')
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
        Text({ color: 'cyan' }, spinnerFrames.pong[frame % spinnerFrames.pong.length]),
        Text({ color: 'gray', dim: true }, 'Playing Pong while waiting...')
      )
    ),

  story('Spinner - Binary')
    .category('Atoms')
    .description('Binary code animation - for hackers')
    .animated(100)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'green' }, spinnerFrames.binary[frame % spinnerFrames.binary.length]),
        Text({ color: 'green', dim: true }, 'Decoding...')
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
        Text({ color: 'green' }, binaryStr),
        Text({ color: 'green', dim: true }, `Decoding (${width} bits)...`)
      );
    }),

  story('Spinner - Star')
    .category('Atoms')
    .description('Twinkling star animation')
    .animated(100)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'yellow' }, spinnerFrames.star[frame % spinnerFrames.star.length]),
        Text({ color: 'gray' }, 'Sparkling...')
      )
    ),

  story('Spinner - Grow')
    .category('Atoms')
    .description('Growing/shrinking dot')
    .animated(120)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'cyan' }, spinnerFrames.grow[frame % spinnerFrames.grow.length]),
        Text({ color: 'gray' }, 'Breathing...')
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
          Text({ color: 'cyan' }, spinnerFrames.boxBounce[frame % spinnerFrames.boxBounce.length]),
          Text({ color: 'gray' }, 'boxBounce')
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'magenta' }, spinnerFrames.boxBounce2[frame % spinnerFrames.boxBounce2.length]),
          Text({ color: 'gray' }, 'boxBounce2')
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
        Text({ color: 'cyan' }, spinnerFrames.pipe[frame % spinnerFrames.pipe.length]),
        Text({ color: 'gray' }, 'Building...')
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
          Text({ color: 'cyan' }, spinnerFrames.toggle[frame % spinnerFrames.toggle.length]),
          Text({ color: 'gray' }, 'toggle')
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'white' }, spinnerFrames.toggle2[frame % spinnerFrames.toggle2.length]),
          Text({ color: 'gray' }, 'toggle2')
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
        Text({ color: 'gray' }, spinnerFrames.noise[frame % spinnerFrames.noise.length]),
        Text({ color: 'gray' }, 'Scanning...')
      )
    ),

  story('Spinner - Flip')
    .category('Atoms')
    .description('Flipping line animation')
    .animated(80)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Text({ color: 'yellow' }, spinnerFrames.flip[frame % spinnerFrames.flip.length]),
        Text({ color: 'gray' }, 'Flipping...')
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
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'cyan' }, spinnerFrames.dots[frame % spinnerFrames.dots.length]), Text({ color: 'gray' }, 'dots')),
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'cyan' }, spinnerFrames.line[frame % spinnerFrames.line.length]), Text({ color: 'gray' }, 'line')),
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'cyan' }, spinnerFrames.arc[frame % spinnerFrames.arc.length]), Text({ color: 'gray' }, 'arc')),
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'cyan' }, spinnerFrames.circle[frame % spinnerFrames.circle.length]), Text({ color: 'gray' }, 'circle')),
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'cyan' }, spinnerFrames.square[frame % spinnerFrames.square.length]), Text({ color: 'gray' }, 'square')),
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'cyan' }, spinnerFrames.bounce[frame % spinnerFrames.bounce.length]), Text({ color: 'gray' }, 'bounce')),
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'cyan' }, spinnerFrames.grow[frame % spinnerFrames.grow.length]), Text({ color: 'gray' }, 'grow')),
        Box({ flexDirection: 'row', gap: 2 }, Text({ color: 'cyan' }, spinnerFrames.star[frame % spinnerFrames.star.length]), Text({ color: 'gray' }, 'star'))
      )
    ),

  story('Spinner - All Emoji')
    .category('Atoms')
    .description('All emoji spinner types')
    .animated(150)
    .render((props, frame = 0) =>
      Box(
        { flexDirection: 'column', gap: 0 },
        Box({ flexDirection: 'row', gap: 2 }, Text({}, spinnerFrames.clock[frame % spinnerFrames.clock.length]), Text({ color: 'gray' }, 'clock')),
        Box({ flexDirection: 'row', gap: 2 }, Text({}, spinnerFrames.earth[frame % spinnerFrames.earth.length]), Text({ color: 'gray' }, 'earth')),
        Box({ flexDirection: 'row', gap: 2 }, Text({}, spinnerFrames.moon[frame % spinnerFrames.moon.length]), Text({ color: 'gray' }, 'moon')),
        Box({ flexDirection: 'row', gap: 2 }, Text({}, spinnerFrames.hearts[frame % spinnerFrames.hearts.length]), Text({ color: 'gray' }, 'hearts')),
        Box({ flexDirection: 'row', gap: 2 }, Text({}, spinnerFrames.weather[frame % spinnerFrames.weather.length]), Text({ color: 'gray' }, 'weather')),
        Box({ flexDirection: 'row', gap: 2 }, Text({}, spinnerFrames.runner[frame % spinnerFrames.runner.length]), Text({ color: 'gray' }, 'runner'))
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
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'round', borderColor: 'gray' },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'green' }, '✓'),
          Text({ color: 'green' }, 'Connected to server')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'cyan' }, spinnerFrames.dots[frame % spinnerFrames.dots.length]),
          Text({ color: 'white' }, 'Downloading assets...')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'yellow' }, spinnerFrames.bouncingBar[frame % spinnerFrames.bouncingBar.length]),
          Text({ color: 'white' }, 'Processing data...')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'magenta' }, spinnerFrames.aesthetic[frame % spinnerFrames.aesthetic.length]),
          Text({ color: 'white' }, 'Generating report...')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'gray', dim: true }, '○'),
          Text({ color: 'gray', dim: true }, 'Waiting: Upload files')
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
          Text({ color: 'green' }, spinnerFrames.dots[frame % spinnerFrames.dots.length]),
          Text({ color: 'gray' }, 'Fast (50ms)')
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'yellow' }, spinnerFrames.dots[Math.floor(frame / 2) % spinnerFrames.dots.length]),
          Text({ color: 'gray' }, 'Medium (100ms)')
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'red' }, spinnerFrames.dots[Math.floor(frame / 4) % spinnerFrames.dots.length]),
          Text({ color: 'gray' }, 'Slow (200ms)')
        )
      )
    ),
];

/**
 * All atom stories
 */
export const allAtomStories: Story[] = [
  ...boxStories,
  ...textStories,
  ...spacerStories,
  ...dividerStories,
  ...badgeStories,
  ...spinnerStories,
];

export default allAtomStories;
