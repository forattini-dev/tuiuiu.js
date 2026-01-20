/**
 * MCP Documentation for Terminal Colors API
 *
 * Standalone ANSI colors module - zero dependencies.
 */

import type { ComponentDoc, PropDefinition } from '../types.js';

const colorFnProps: PropDefinition[] = [
  {
    name: 'text',
    type: 'string',
    required: true,
    description: 'The text to colorize',
  },
];

export const colors: ComponentDoc[] = [
  // ==========================================================================
  // Simple Color Functions
  // ==========================================================================
  {
    name: 'red',
    category: 'colors',
    description: 'Apply red foreground color to text',
    props: colorFnProps,
    examples: [`import { red } from 'tuiuiu.js/colors'
console.log(red('Error message'))`],
  },
  {
    name: 'green',
    category: 'colors',
    description: 'Apply green foreground color to text',
    props: colorFnProps,
    examples: [`import { green } from 'tuiuiu.js/colors'
console.log(green('Success!'))`],
  },
  {
    name: 'yellow',
    category: 'colors',
    description: 'Apply yellow foreground color to text',
    props: colorFnProps,
    examples: [`import { yellow } from 'tuiuiu.js/colors'
console.log(yellow('Warning'))`],
  },
  {
    name: 'blue',
    category: 'colors',
    description: 'Apply blue foreground color to text',
    props: colorFnProps,
    examples: [`import { blue } from 'tuiuiu.js/colors'
console.log(blue('Info'))`],
  },
  {
    name: 'cyan',
    category: 'colors',
    description: 'Apply cyan foreground color to text',
    props: colorFnProps,
    examples: [`import { cyan } from 'tuiuiu.js/colors'
console.log(cyan('Highlight'))`],
  },
  {
    name: 'magenta',
    category: 'colors',
    description: 'Apply magenta foreground color to text',
    props: colorFnProps,
    examples: [`import { magenta } from 'tuiuiu.js/colors'
console.log(magenta('Special'))`],
  },
  {
    name: 'white',
    category: 'colors',
    description: 'Apply white foreground color to text',
    props: colorFnProps,
    examples: [`import { white } from 'tuiuiu.js/colors'
console.log(white('Text'))`],
  },
  {
    name: 'black',
    category: 'colors',
    description: 'Apply black foreground color to text',
    props: colorFnProps,
    examples: [`import { black, bgWhite } from 'tuiuiu.js/colors'
console.log(bgWhite(black('Dark on light')))`],
  },
  {
    name: 'gray',
    category: 'colors',
    description: 'Apply gray foreground color to text',
    props: colorFnProps,
    examples: [`import { gray } from 'tuiuiu.js/colors'
console.log(gray('Muted text'))`],
  },

  // ==========================================================================
  // Modifiers
  // ==========================================================================
  {
    name: 'bold',
    category: 'colors',
    description: 'Apply bold style to text',
    props: colorFnProps,
    examples: [`import { bold } from 'tuiuiu.js/colors'
console.log(bold('Important'))`],
  },
  {
    name: 'dim',
    category: 'colors',
    description: 'Apply dim/faded style to text',
    props: colorFnProps,
    examples: [`import { dim } from 'tuiuiu.js/colors'
console.log(dim('Less important'))`],
  },
  {
    name: 'italic',
    category: 'colors',
    description: 'Apply italic style to text',
    props: colorFnProps,
    examples: [`import { italic } from 'tuiuiu.js/colors'
console.log(italic('Emphasized'))`],
  },
  {
    name: 'underline',
    category: 'colors',
    description: 'Apply underline to text',
    props: colorFnProps,
    examples: [`import { underline } from 'tuiuiu.js/colors'
console.log(underline('Link'))`],
  },
  {
    name: 'strikethrough',
    category: 'colors',
    description: 'Apply strikethrough to text',
    props: colorFnProps,
    examples: [`import { strikethrough } from 'tuiuiu.js/colors'
console.log(strikethrough('Deleted'))`],
  },
  {
    name: 'inverse',
    category: 'colors',
    description: 'Swap foreground and background colors',
    props: colorFnProps,
    examples: [`import { inverse } from 'tuiuiu.js/colors'
console.log(inverse('Highlighted'))`],
  },

  // ==========================================================================
  // Composition
  // ==========================================================================
  {
    name: 'compose',
    category: 'colors',
    description: 'Compose multiple color functions into one',
    props: [
      {
        name: '...fns',
        type: 'ColorFn[]',
        required: true,
        description: 'Color functions to compose',
      },
    ],
    examples: [`import { compose, red, bold, underline, cyan } from 'tuiuiu.js/colors'

const errorStyle = compose(red, bold)
console.log(errorStyle('Critical error!'))

const linkStyle = compose(cyan, underline)
console.log(linkStyle('https://example.com'))`],
  },
  {
    name: 'styled',
    category: 'colors',
    description: 'Apply multiple styles to text in one call',
    props: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'The text to style',
      },
      {
        name: '...fns',
        type: 'ColorFn[]',
        required: true,
        description: 'Color functions to apply',
      },
    ],
    examples: [`import { styled, red, bold } from 'tuiuiu.js/colors'
console.log(styled('Error!', red, bold))`],
  },

  // ==========================================================================
  // Chainable API
  // ==========================================================================
  {
    name: 'c',
    category: 'colors',
    description: 'Chainable color API for fluent style composition',
    props: [],
    examples: [`import { c } from 'tuiuiu.js/colors'

// Single style
console.log(c.red('Error!'))

// Chained styles
console.log(c.red.bold('Critical!'))
console.log(c.bgBlue.white.bold('Info'))

// RGB/Hex colors
console.log(c.hex('#ff6600')('Orange'))
console.log(c.rgb(255, 100, 50).bold('Custom'))

// ANSI 256
console.log(c.ansi256(196)('Bright red'))`],
  },

  // ==========================================================================
  // Template Literal
  // ==========================================================================
  {
    name: 'tpl',
    category: 'colors',
    description: 'Template literal for inline color formatting',
    props: [],
    examples: [`import { tpl } from 'tuiuiu.js/colors'

// Simple colors
console.log(tpl\`{red Error:} Something went wrong\`)

// Chained styles
console.log(tpl\`{bold.underline Important} message\`)

// Hex colors
console.log(tpl\`{hex('#ff6600') Orange text}\`)

// RGB
console.log(tpl\`{rgb(255,100,50) Custom color}\`)

// Interpolation
const name = 'World'
console.log(tpl\`Hello {blue \${name}}!\`)`],
  },

  // ==========================================================================
  // RGB/Hex/256 Functions
  // ==========================================================================
  {
    name: 'hex',
    category: 'colors',
    description: 'Create color function from hex code',
    props: [
      {
        name: 'color',
        type: 'string',
        required: true,
        description: 'Hex color code (e.g., "#ff6600" or "#f60")',
      },
    ],
    examples: [`import { hex } from 'tuiuiu.js/colors'
const orange = hex('#ff6600')
console.log(orange('Orange text'))`],
  },
  {
    name: 'rgb',
    category: 'colors',
    description: 'Create color function from RGB values',
    props: [
      { name: 'r', type: 'number', required: true, description: 'Red (0-255)' },
      { name: 'g', type: 'number', required: true, description: 'Green (0-255)' },
      { name: 'b', type: 'number', required: true, description: 'Blue (0-255)' },
    ],
    examples: [`import { rgb } from 'tuiuiu.js/colors'
const custom = rgb(255, 100, 50)
console.log(custom('Custom color'))`],
  },
  {
    name: 'ansi256',
    category: 'colors',
    description: 'Create color function from ANSI 256 color code',
    props: [
      {
        name: 'code',
        type: 'number',
        required: true,
        description: 'ANSI 256 color code (0-255)',
      },
    ],
    examples: [`import { ansi256 } from 'tuiuiu.js/colors'
const brightRed = ansi256(196)
console.log(brightRed('Bright red'))`],
  },

  // ==========================================================================
  // Theme Integration
  // ==========================================================================
  {
    name: 'theme',
    category: 'colors',
    description: 'Theme-aware color functions that use tuiuiu semantic colors',
    props: [],
    examples: [`import { theme } from 'tuiuiu.js/colors'

console.log(theme.primary('Action'))
console.log(theme.success('Done!'))
console.log(theme.error('Failed'))
console.log(theme.warning('Caution'))
console.log(theme.info('Note'))
console.log(theme.muted('Secondary'))

// Bold variants
console.log(theme.primaryBold('Important action'))
console.log(theme.errorBold('Critical error'))`],
  },
  {
    name: 'tw',
    category: 'colors',
    description: 'Tailwind CSS palette color functions',
    props: [],
    examples: [`import { tw } from 'tuiuiu.js/colors'

// Access colors by name and shade
console.log(tw.blue[500]('Blue-500'))
console.log(tw.red[600]('Red-600'))
console.log(tw.emerald[400]('Emerald-400'))
console.log(tw.purple[700]('Purple-700'))

// Base colors
console.log(tw.white('White'))
console.log(tw.black('Black'))`],
  },

  // ==========================================================================
  // Pre-composed Styles
  // ==========================================================================
  {
    name: 'styles',
    category: 'colors',
    description: 'Pre-composed style functions for common use cases',
    props: [],
    examples: [`import { styles } from 'tuiuiu.js/colors'

// Error variations
console.log(styles.errorBold('Error!'))
console.log(styles.errorDim('Minor error'))

// Success variations
console.log(styles.successBold('Success!'))

// Links
console.log(styles.link('https://example.com'))
console.log(styles.linkBold('Important link'))

// Highlights
console.log(styles.highlight('Important'))
console.log(styles.highlightError('Critical'))

// Headers
console.log(styles.h1('Title'))
console.log(styles.h2('Subtitle'))
console.log(styles.h3('Section'))

// Code
console.log(styles.code('const x = 1'))`],
  },

  // ==========================================================================
  // Utilities
  // ==========================================================================
  {
    name: 'stripAnsi',
    category: 'colors',
    description: 'Remove all ANSI escape codes from a string',
    props: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'Text with ANSI codes',
      },
    ],
    examples: [`import { stripAnsi, red } from 'tuiuiu.js/colors'

const colored = red('Error')
const plain = stripAnsi(colored)
console.log(plain) // 'Error' (no color codes)`],
  },
  {
    name: 'hasAnsi',
    category: 'colors',
    description: 'Check if a string contains ANSI escape codes',
    props: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'Text to check',
      },
    ],
    examples: [`import { hasAnsi, red } from 'tuiuiu.js/colors'

console.log(hasAnsi(red('Error'))) // true
console.log(hasAnsi('plain'))       // false`],
  },
  {
    name: 'visibleLength',
    category: 'colors',
    description: 'Get visible length of text (excluding ANSI codes)',
    props: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'Text to measure',
      },
    ],
    examples: [`import { visibleLength, red } from 'tuiuiu.js/colors'

const colored = red('Hello')
console.log(visibleLength(colored)) // 5`],
  },

  // ==========================================================================
  // Color Detection
  // ==========================================================================
  {
    name: 'supportsColor',
    category: 'colors',
    description: 'Check if terminal supports colors',
    props: [],
    examples: [`import { supportsColor } from 'tuiuiu.js/colors'

if (supportsColor()) {
  console.log('Colors supported!')
}`],
  },
  {
    name: 'supportsTrueColor',
    category: 'colors',
    description: 'Check if terminal supports 24-bit true color',
    props: [],
    examples: [`import { supportsTrueColor } from 'tuiuiu.js/colors'

if (supportsTrueColor()) {
  console.log('True color (16M colors) supported!')
}`],
  },
  {
    name: 'getColorLevel',
    category: 'colors',
    description: 'Get terminal color support level (0=none, 1=basic, 2=256, 3=truecolor)',
    props: [],
    examples: [`import { getColorLevel } from 'tuiuiu.js/colors'

const level = getColorLevel()
// 0 = No color support
// 1 = Basic colors (16)
// 2 = 256 colors
// 3 = True color (16M)`],
  },
];

/**
 * Quick reference guide for the colors module
 */
export const colorsGuide = `# Terminal Colors API

Zero-dependency ANSI colors for CLI tools. Use standalone without the full UI framework.

## Import

\`\`\`typescript
import { red, bold, compose, c, tpl, theme, tw, styles } from 'tuiuiu.js/colors'
\`\`\`

## API Styles

### 1. Simple Functions
\`\`\`typescript
console.log(red('Error!'))
console.log(bold('Important'))
console.log(bgBlue('Highlighted'))
\`\`\`

### 2. Composition
\`\`\`typescript
const errorStyle = compose(red, bold)
console.log(errorStyle('Critical!'))
\`\`\`

### 3. Chainable API (c)
\`\`\`typescript
console.log(c.red.bold('Error!'))
console.log(c.bgBlue.white('Info'))
console.log(c.hex('#ff6600')('Orange'))
\`\`\`

### 4. Template Literal (tpl)
\`\`\`typescript
console.log(tpl\`{red Error:} Something went wrong\`)
console.log(tpl\`{bold.underline Important}\`)
\`\`\`

### 5. Theme Colors
\`\`\`typescript
console.log(theme.primary('Action'))
console.log(theme.success('Done'))
console.log(theme.error('Failed'))
\`\`\`

### 6. Tailwind Palette
\`\`\`typescript
console.log(tw.blue[500]('Blue'))
console.log(tw.red[600]('Red'))
\`\`\`

## Available Colors

**Foreground:** black, red, green, yellow, blue, magenta, cyan, white, gray/grey
**Bright:** blackBright, redBright, greenBright, yellowBright, blueBright, magentaBright, cyanBright, whiteBright
**Background:** bgBlack, bgRed, bgGreen, bgYellow, bgBlue, bgMagenta, bgCyan, bgWhite, bgGray/bgGrey
**Modifiers:** bold, dim, italic, underline, overline, inverse, hidden, strikethrough/strike, reset

## CLI Formatter Pattern

\`\`\`typescript
import { c, styles } from 'tuiuiu.js/colors'

const formatter = {
  'section-header': (s: string) => c.bold.white(s),
  'option-flag': (s: string) => c.green(s),
  'option-type': (s: string) => c.cyan(s),
  'error-message': styles.errorBold,
}
\`\`\`
`;
