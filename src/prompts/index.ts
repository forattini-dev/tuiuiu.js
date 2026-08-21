/**
 * Tuiuiu Prompts
 *
 * Simple, zero-dependency CLI prompts using Node.js readline.
 * Unlike the reactive TUI components, these are blocking functions
 * designed for simple CLI interactions.
 *
 * @example
 * ```typescript
 * import { prompt } from 'tuiuiu.js';
 *
 * const name = await prompt.input('What is your name?');
 * const confirmed = await prompt.confirm('Are you sure?');
 * const choice = await prompt.select('Choose environment:', ['dev', 'stg', 'prd']);
 * ```
 */

import * as readline from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { StringDecoder } from 'node:string_decoder';
import {
  segmentGraphemes,
} from '../utils/grapheme.js';
import {
  sanitizeInlineInput,
  sanitizeTerminalText,
} from '../utils/terminal-sanitize.js';
import { colorize, stringWidth } from '../utils/text-utils.js';
import {
  getPromptHost,
  PromptBusyError,
  PromptCancelledError,
  PromptNonInteractiveError,
  type PromptRenderer,
  type PromptRequest,
  type PromptControls,
} from '../interaction/prompt.js';
import { createTextEditor } from '../interaction/text-editor.js';

export {
  PromptBusyError,
  PromptCancelledError,
  PromptHostAmbiguousError,
  PromptHostUnavailableError,
  PromptNonInteractiveError,
} from '../interaction/prompt.js';

// =============================================================================
// Types
// =============================================================================

export interface PromptTheme {
  symbols: {
    /** Prefix shown before every prompt */
    question: string;
    /** Prefix shown before validation errors and cancellations */
    error: string;
    /** Cursor shown beside the active option */
    pointer: string;
    /** Marker shown beside selected checkbox options */
    selected: string;
    /** Marker shown beside unselected checkbox options */
    unselected: string;
    /** Cursor shown after autocomplete input */
    cursor: string;
  };
  colors: {
    /** Prompt prefix and active-option color */
    accent: string | null;
    /** Final answers, pointers, and selected-option color */
    answer: string | null;
    /** Validation error and cancellation color */
    error: string | null;
  };
}

export interface PromptThemeOptions {
  symbols?: Partial<PromptTheme['symbols']>;
  colors?: Partial<PromptTheme['colors']>;
}

export interface PromptAppearanceOptions {
  /** Appearance override for this prompt only */
  theme?: PromptThemeOptions;
}

export interface InputOptions extends PromptAppearanceOptions {
  default?: string;
  placeholder?: string;
  validate?: (value: string) => boolean | string;
  transform?: (value: string) => string;
}

export interface ConfirmOptions extends PromptAppearanceOptions {
  default?: boolean;
}

export interface SelectOptions<T extends string = string> extends PromptAppearanceOptions {
  default?: T;
}

export interface PasswordOptions extends PromptAppearanceOptions {
  mask?: string;
  validate?: (value: string) => boolean | string;
}

export interface CheckboxOptions<T extends string = string> extends PromptAppearanceOptions {
  default?: T[];
  min?: number;
  max?: number;
  validate?: (values: T[]) => boolean | string;
}

export interface AutocompleteOptions<T extends string = string> extends PromptAppearanceOptions {
  default?: T;
  /** Minimum characters before showing suggestions */
  minInput?: number;
  /** Maximum suggestions to show */
  maxSuggestions?: number;
  /** Custom filter function (default: fuzzy match) */
  filter?: (input: string, choice: T) => boolean;
}

// =============================================================================
// ANSI helpers
// =============================================================================

const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const CLEAR_LINE = '\x1b[2K\r';
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';
const MOVE_UP = '\x1b[1A';

let promptOwnsInput = false;

function acquirePromptInput(): () => void {
  if (promptOwnsInput) {
    throw new PromptBusyError();
  }
  promptOwnsInput = true;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    promptOwnsInput = false;
  };
}

function beginRawPrompt(hideCursor: boolean): () => void {
  const releaseInput = acquirePromptInput();
  const rawInput = input as NodeJS.ReadStream & {
    isRaw?: boolean;
    isPaused?: () => boolean;
  };
  const wasRaw = rawInput.isRaw === true;
  const wasPaused = rawInput.isPaused?.() ?? true;

  if (hideCursor) output.write(HIDE_CURSOR);
  if (input.isTTY && !wasRaw) input.setRawMode(true);
  if (wasPaused) input.resume();

  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    if (input.isTTY && !wasRaw) input.setRawMode(false);
    if (wasPaused) input.pause();
    if (hideCursor) output.write(SHOW_CURSOR);
    releaseInput();
  };
}

function safeInlineLabel(text: string): string {
  return sanitizeTerminalText(String(text)).replace(/[\r\n\t]/g, ' ');
}

const DEFAULT_PROMPT_THEME: PromptTheme = {
  symbols: {
    question: '?',
    error: '!',
    pointer: '❯',
    selected: '◉',
    unselected: '○',
    cursor: '▌',
  },
  colors: {
    accent: 'cyan',
    answer: 'green',
    error: 'yellow',
  },
};

let configuredPromptTheme = mergePromptTheme(DEFAULT_PROMPT_THEME);

function mergePromptTheme(
  base: PromptTheme,
  override: PromptThemeOptions = {},
): PromptTheme {
  return {
    symbols: {
      ...base.symbols,
      ...override.symbols,
    },
    colors: {
      ...base.colors,
      ...override.colors,
    },
  };
}

/**
 * Replace the process-wide prompt theme.
 *
 * Unspecified fields use the built-in defaults. Use the `theme` option on an
 * individual prompt when only one call should look different.
 */
export function setPromptTheme(theme: PromptThemeOptions): PromptTheme {
  configuredPromptTheme = mergePromptTheme(DEFAULT_PROMPT_THEME, theme);
  return getPromptTheme();
}

/** Return a defensive copy of the process-wide prompt theme. */
export function getPromptTheme(): PromptTheme {
  return mergePromptTheme(configuredPromptTheme);
}

/** Restore the built-in prompt theme. */
export function resetPromptTheme(): PromptTheme {
  configuredPromptTheme = mergePromptTheme(DEFAULT_PROMPT_THEME);
  return getPromptTheme();
}

function dim(text: string): string {
  return `${DIM}${safeInlineLabel(text)}${RESET}`;
}

function bold(text: string): string {
  return `${BOLD}${safeInlineLabel(text)}${RESET}`;
}

interface PromptPainter {
  question: () => string;
  error: () => string;
  pointer: () => string;
  selected: () => string;
  unselected: () => string;
  cursor: () => string;
  accent: (text: string) => string;
  answer: (text: string) => string;
}

function paint(text: string, color: string | null): string {
  const safeText = safeInlineLabel(text);
  return color ? colorize(safeText, color) : safeText;
}

function createPromptPainter(override?: PromptThemeOptions): PromptPainter {
  const theme = mergePromptTheme(configuredPromptTheme, override);

  return {
    question: () => paint(theme.symbols.question, theme.colors.accent),
    error: () => paint(theme.symbols.error, theme.colors.error),
    pointer: () => paint(theme.symbols.pointer, theme.colors.answer),
    selected: () => paint(theme.symbols.selected, theme.colors.answer),
    unselected: () => dim(theme.symbols.unselected),
    cursor: () => paint(theme.symbols.cursor, theme.colors.accent),
    accent: (text) => paint(text, theme.colors.accent),
    answer: (text) => paint(text, theme.colors.answer),
  };
}

// =============================================================================
// Core readline helper
// =============================================================================

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input,
    output,
    terminal: true,
  });
}

// =============================================================================
// prompt.input()
// =============================================================================

/**
 * Prompt for text input
 *
 * @example
 * ```typescript
 * const name = await prompt.input('What is your name?');
 * const email = await prompt.input('Email:', { validate: (v) => v.includes('@') || 'Invalid email' });
 * ```
 */
async function ansiPromptInput(message: string, options: InputOptions = {}): Promise<string> {
  if (!input.isTTY) {
    if (options.default === undefined) throw new PromptNonInteractiveError();
    const value = options.transform ? options.transform(options.default) : options.default;
    const result = options.validate?.(value) ?? true;
    if (result !== true) throw new Error(typeof result === 'string' ? result : 'Invalid input');
    return value;
  }
  const { default: defaultValue, placeholder, validate, transform } = options;
  const painter = createPromptPainter(options.theme);

  const releaseInput = acquirePromptInput();
  const rl = createReadlineInterface();

  const promptText = buildPromptText(message, defaultValue, placeholder, painter);

  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      rl.close();
      releaseInput();

      let value = answer.trim() || defaultValue || '';

      if (transform) {
        value = transform(value);
      }

      if (validate) {
        const result = validate(value);
        if (result !== true) {
          const errorMsg = typeof result === 'string' ? result : 'Invalid input';
          output.write(`${CLEAR_LINE}${painter.error()} ${safeInlineLabel(errorMsg)}\n`);
          resolve(ansiPromptInput(message, options));
          return;
        }
      }

      // Rewrite the line with the final answer
      output.write(`${MOVE_UP}${CLEAR_LINE}${painter.question()} ${bold(message)} ${painter.answer(value)}\n`);
      resolve(value);
    });
  });
}

function buildPromptText(
  message: string,
  defaultValue: string | undefined,
  placeholder: string | undefined,
  painter: PromptPainter,
): string {
  let text = `${painter.question()} ${bold(message)} `;

  if (defaultValue) {
    text += dim(`(${defaultValue}) `);
  } else if (placeholder) {
    text += dim(`${placeholder} `);
  }

  return text;
}

// =============================================================================
// prompt.confirm()
// =============================================================================

/**
 * Prompt for yes/no confirmation
 *
 * @example
 * ```typescript
 * const confirmed = await prompt.confirm('Delete this file?');
 * const proceed = await prompt.confirm('Continue?', { default: true });
 * ```
 */
async function ansiPromptConfirm(message: string, options: ConfirmOptions = {}): Promise<boolean> {
  if (!input.isTTY) {
    if (options.default === undefined) throw new PromptNonInteractiveError();
    return options.default;
  }
  const { default: defaultValue = false } = options;
  const painter = createPromptPainter(options.theme);

  const releaseInput = acquirePromptInput();
  const rl = createReadlineInterface();

  const hint = defaultValue ? 'Y/n' : 'y/N';
  const promptText = `${painter.question()} ${bold(message)} ${dim(`(${hint})`)} `;

  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      rl.close();
      releaseInput();

      const normalized = answer.trim().toLowerCase();

      let result: boolean;
      if (normalized === '') {
        result = defaultValue;
      } else if (normalized === 'y' || normalized === 'yes') {
        result = true;
      } else if (normalized === 'n' || normalized === 'no') {
        result = false;
      } else {
        result = defaultValue;
      }

      const displayValue = result ? 'Yes' : 'No';
      output.write(`${MOVE_UP}${CLEAR_LINE}${painter.question()} ${bold(message)} ${painter.answer(displayValue)}\n`);
      resolve(result);
    });
  });
}

// =============================================================================
// prompt.select()
// =============================================================================

/**
 * Prompt to select from a list of choices
 *
 * @example
 * ```typescript
 * const env = await prompt.select('Choose environment:', ['dev', 'stg', 'prd']);
 * const color = await prompt.select('Pick a color:', ['red', 'green', 'blue'], { default: 'blue' });
 * ```
 */
async function ansiPromptSelect<T extends string>(
  message: string,
  choices: readonly T[],
  options: SelectOptions<T> = {}
): Promise<T> {
  const { default: defaultValue } = options;
  const painter = createPromptPainter(options.theme);

  if (choices.length === 0) {
    throw new Error('prompt.select requires at least one choice');
  }

  // Non-TTY execution must be deterministic and explicitly authorized.
  if (!input.isTTY) {
    if (defaultValue === undefined) throw new PromptNonInteractiveError();
    const result = defaultValue;
    output.write(`${painter.question()} ${bold(message)} ${painter.answer(result)} ${dim('(non-interactive)')}\n`);
    return result;
  }

  const defaultIndex = defaultValue ? choices.indexOf(defaultValue) : 0;
  let selectedIndex = defaultIndex >= 0 ? defaultIndex : 0;
  const finishRawPrompt = beginRawPrompt(true);

  return new Promise((resolve, reject) => {
    // Render initial state
    renderSelect(message, choices, selectedIndex, painter);

    const handleKeypress = (chunk: Buffer) => {
      const key = chunk.toString();

      // Arrow up or k
      if (key === '\x1b[A' || key === 'k') {
        selectedIndex = (selectedIndex - 1 + choices.length) % choices.length;
        clearSelect(choices.length);
        renderSelect(message, choices, selectedIndex, painter);
      }
      // Arrow down or j
      else if (key === '\x1b[B' || key === 'j') {
        selectedIndex = (selectedIndex + 1) % choices.length;
        clearSelect(choices.length);
        renderSelect(message, choices, selectedIndex, painter);
      }
      // Enter
      else if (key === '\r' || key === '\n') {
        cleanup();
        const selected = choices[selectedIndex]!;

        // Clear and show final result
        clearSelect(choices.length);
        output.write(`${painter.question()} ${bold(message)} ${painter.answer(selected)}\n`);

        resolve(selected);
      }
      // Ctrl+C or Escape
      else if (key === '\x03' || key === '\x1b') {
        cleanup();
        clearSelect(choices.length);
        output.write(`${painter.error()} Cancelled\n`);
        reject(new PromptCancelledError());
      }
      // Number keys for quick selection
      else if (key >= '1' && key <= '9') {
        const num = parseInt(key, 10) - 1;
        if (num < choices.length) {
          selectedIndex = num;
          clearSelect(choices.length);
          renderSelect(message, choices, selectedIndex, painter);
        }
      }
    };

    const cleanup = () => {
      input.removeListener('data', handleKeypress);
      finishRawPrompt();
    };

    input.on('data', handleKeypress);
  });
}

function renderSelect<T extends string>(
  message: string,
  choices: readonly T[],
  selectedIndex: number,
  painter: PromptPainter,
): void {
  output.write(`${painter.question()} ${bold(message)}\n`);

  choices.forEach((choice, index) => {
    const prefix = index === selectedIndex ? painter.pointer() : ' ';
    const text = index === selectedIndex ? painter.accent(choice) : safeInlineLabel(choice);
    output.write(`  ${prefix} ${text}\n`);
  });
}

function clearSelect(choicesCount: number): void {
  // Move up and clear each line (question + choices = choicesCount + 1 lines)
  for (let i = 0; i <= choicesCount; i++) {
    output.write(`${CLEAR_LINE}${MOVE_UP}`);
  }
  output.write(CLEAR_LINE);
}

// =============================================================================
// prompt.password()
// =============================================================================

/**
 * Prompt for password input (masked)
 *
 * @example
 * ```typescript
 * const password = await prompt.password('Enter password:');
 * const secret = await prompt.password('API Key:', { mask: '*' });
 * ```
 */
async function ansiPromptPassword(message: string, options: PasswordOptions = {}): Promise<string> {
  if (!input.isTTY) throw new PromptNonInteractiveError();
  const { validate } = options;
  const mask = sanitizeInlineInput(options.mask ?? '*') || '*';
  const painter = createPromptPainter(options.theme);
  const finishRawPrompt = beginRawPrompt(false);

  return new Promise((resolve, reject) => {
    output.write(`${painter.question()} ${bold(message)} `);

    const editor = createTextEditor();
    let maskedDisplay = '';
    const decoder = new StringDecoder('utf8');

    const handleKeypress = (chunk: Buffer) => {
      const char = decoder.write(chunk);
      if (!char) return;

      // Enter
      if (char === '\r' || char === '\n') {
        cleanup();

        if (validate) {
          const result = validate(editor.snapshot().value);
          if (result !== true) {
            const errorMsg = typeof result === 'string' ? result : 'Invalid input';
            output.write(`\n${painter.error()} ${safeInlineLabel(errorMsg)}\n`);
            resolve(ansiPromptPassword(message, options));
            return;
          }
        }

        output.write(`\n`);
        resolve(editor.snapshot().value);
      }
      // Backspace
      else if (char === '\x7f' || char === '\b') {
        if (editor.backspace()) {
          const displayBoundary = Math.max(0, maskedDisplay.length - mask.length);
          const removedMask = maskedDisplay.slice(displayBoundary);
          maskedDisplay = maskedDisplay.slice(0, displayBoundary);
          const eraseWidth = stringWidth(removedMask);
          output.write('\b'.repeat(eraseWidth) + ' '.repeat(eraseWidth) + '\b'.repeat(eraseWidth));
        }
      }
      // Ctrl+C
      else if (char === '\x03') {
        cleanup();
        output.write('\n');
        reject(new PromptCancelledError());
      }
      // Regular character
      else {
        const cleanInput = sanitizeInlineInput(char);
        if (cleanInput) {
          const graphemeCount = segmentGraphemes(cleanInput).length;
          const display = mask.repeat(graphemeCount);
          editor.insert(cleanInput);
          maskedDisplay += display;
          output.write(display);
        }
      }
    };

    const cleanup = () => {
      input.removeListener('data', handleKeypress);
      decoder.end();
      finishRawPrompt();
    };

    input.on('data', handleKeypress);
  });
}

// =============================================================================
// prompt.checkbox()
// =============================================================================

/**
 * Prompt to select multiple items from a list
 *
 * @example
 * ```typescript
 * const features = await prompt.checkbox('Select features:', ['typescript', 'eslint', 'prettier']);
 * const colors = await prompt.checkbox('Pick colors:', ['red', 'green', 'blue'], { min: 1, max: 2 });
 * ```
 */
async function ansiPromptCheckbox<T extends string>(
  message: string,
  choices: readonly T[],
  options: CheckboxOptions<T> = {}
): Promise<T[]> {
  const { default: defaultValues = [], min = 0, max = choices.length, validate } = options;
  const painter = createPromptPainter(options.theme);

  if (choices.length === 0) {
    throw new Error('prompt.checkbox requires at least one choice');
  }

  // Non-TTY execution requires an explicit default selection.
  if (!input.isTTY) {
    if (options.default === undefined) throw new PromptNonInteractiveError();
    output.write(`${painter.question()} ${bold(message)} ${dim('(non-interactive)')}\n`);
    return defaultValues;
  }

  let selectedIndex = 0;
  const selected = new Set<T>(defaultValues);
  const finishRawPrompt = beginRawPrompt(true);

  return new Promise((resolve, reject) => {
    renderCheckbox(message, choices, selectedIndex, selected, painter);

    const handleKeypress = (chunk: Buffer) => {
      const key = chunk.toString();

      // Arrow up or k
      if (key === '\x1b[A' || key === 'k') {
        selectedIndex = (selectedIndex - 1 + choices.length) % choices.length;
        clearCheckbox(choices.length);
        renderCheckbox(message, choices, selectedIndex, selected, painter);
      }
      // Arrow down or j
      else if (key === '\x1b[B' || key === 'j') {
        selectedIndex = (selectedIndex + 1) % choices.length;
        clearCheckbox(choices.length);
        renderCheckbox(message, choices, selectedIndex, selected, painter);
      }
      // Space - toggle selection
      else if (key === ' ') {
        const choice = choices[selectedIndex]!;
        if (selected.has(choice)) {
          selected.delete(choice);
        } else if (selected.size < max) {
          selected.add(choice);
        }
        clearCheckbox(choices.length);
        renderCheckbox(message, choices, selectedIndex, selected, painter);
      }
      // Enter - confirm
      else if (key === '\r' || key === '\n') {
        const values = choices.filter(c => selected.has(c));

        // Check min constraint
        if (values.length < min) {
          clearCheckbox(choices.length);
          output.write(`${painter.error()} Select at least ${min} item(s)\n`);
          renderCheckbox(message, choices, selectedIndex, selected, painter);
          return;
        }

        // Custom validation
        if (validate) {
          const result = validate(values);
          if (result !== true) {
            const errorMsg = typeof result === 'string' ? result : 'Invalid selection';
            clearCheckbox(choices.length);
            output.write(`${painter.error()} ${safeInlineLabel(errorMsg)}\n`);
            renderCheckbox(message, choices, selectedIndex, selected, painter);
            return;
          }
        }

        cleanup();
        clearCheckbox(choices.length);
        const display = values.length > 0 ? values.join(', ') : dim('(none)');
        output.write(`${painter.question()} ${bold(message)} ${painter.answer(display)}\n`);
        resolve(values);
      }
      // Ctrl+C or Escape
      else if (key === '\x03' || key === '\x1b') {
        cleanup();
        clearCheckbox(choices.length);
        output.write(`${painter.error()} Cancelled\n`);
        reject(new PromptCancelledError());
      }
      // 'a' - select all
      else if (key === 'a') {
        if (selected.size === choices.length) {
          selected.clear();
        } else {
          choices.slice(0, max).forEach(c => selected.add(c));
        }
        clearCheckbox(choices.length);
        renderCheckbox(message, choices, selectedIndex, selected, painter);
      }
    };

    const cleanup = () => {
      input.removeListener('data', handleKeypress);
      finishRawPrompt();
    };

    input.on('data', handleKeypress);
  });
}

function renderCheckbox<T extends string>(
  message: string,
  choices: readonly T[],
  selectedIndex: number,
  selected: Set<T>,
  painter: PromptPainter,
): void {
  const hint = dim(`(space to toggle, a to toggle all, enter to confirm)`);
  output.write(`${painter.question()} ${bold(message)} ${hint}\n`);

  choices.forEach((choice, index) => {
    const isCurrent = index === selectedIndex;
    const isSelected = selected.has(choice);
    const cursor = isCurrent ? painter.pointer() : ' ';
    const checkbox = isSelected ? painter.selected() : painter.unselected();
    const text = isCurrent ? painter.accent(choice) : safeInlineLabel(choice);
    output.write(`  ${cursor} ${checkbox} ${text}\n`);
  });
}

function clearCheckbox(choicesCount: number): void {
  // question + choices = choicesCount + 1 lines
  for (let i = 0; i <= choicesCount; i++) {
    output.write(`${CLEAR_LINE}${MOVE_UP}`);
  }
  output.write(CLEAR_LINE);
}

// =============================================================================
// prompt.autocomplete()
// =============================================================================

/**
 * Prompt with autocomplete suggestions
 *
 * @example
 * ```typescript
 * const country = await prompt.autocomplete('Country:', ['Brazil', 'USA', 'Germany', 'Japan']);
 * const file = await prompt.autocomplete('File:', files, { minInput: 2 });
 * ```
 */
async function ansiPromptAutocomplete<T extends string>(
  message: string,
  choices: readonly T[],
  options: AutocompleteOptions<T> = {}
): Promise<T> {
  const {
    default: defaultValue,
    minInput = 0,
    maxSuggestions = 7,
    filter = defaultFuzzyFilter,
  } = options;
  const painter = createPromptPainter(options.theme);

  if (choices.length === 0) {
    throw new Error('prompt.autocomplete requires at least one choice');
  }

  // Non-TTY fallback
  if (!input.isTTY) {
    if (defaultValue === undefined) throw new PromptNonInteractiveError();
    output.write(`${painter.question()} ${bold(message)} ${dim('(non-interactive)')}\n`);
    return defaultValue;
  }

  const editor = createTextEditor({ initialValue: defaultValue ?? '' });
  const query = () => editor.snapshot().value;
  let selectedIndex = 0;
  let filtered = filterChoices(query(), choices, filter, minInput, maxSuggestions);
  const decoder = new StringDecoder('utf8');
  const finishRawPrompt = beginRawPrompt(true);

  return new Promise((resolve, reject) => {
    renderAutocomplete(message, query(), filtered, selectedIndex, painter);

    const handleKeypress = (chunk: Buffer) => {
      const key = decoder.write(chunk);
      if (!key) return;

      // Arrow up
      if (key === '\x1b[A') {
        if (filtered.length > 0) {
          selectedIndex = (selectedIndex - 1 + filtered.length) % filtered.length;
          clearAutocomplete(filtered.length);
          renderAutocomplete(message, query(), filtered, selectedIndex, painter);
        }
      }
      // Arrow down
      else if (key === '\x1b[B') {
        if (filtered.length > 0) {
          selectedIndex = (selectedIndex + 1) % filtered.length;
          clearAutocomplete(filtered.length);
          renderAutocomplete(message, query(), filtered, selectedIndex, painter);
        }
      }
      // Tab - complete with selected
      else if (key === '\t' && filtered.length > 0) {
        editor.setValue(filtered[selectedIndex]!);
        filtered = filterChoices(query(), choices, filter, minInput, maxSuggestions);
        selectedIndex = 0;
        clearAutocomplete(filtered.length || 1);
        renderAutocomplete(message, query(), filtered, selectedIndex, painter);
      }
      // Enter
      else if (key === '\r' || key === '\n') {
        // If exact match or selection exists, use it
        let result: T;
        if (filtered.length > 0) {
          result = filtered[selectedIndex]!;
        } else if (choices.includes(query() as T)) {
          result = query() as T;
        } else {
          // No match - re-prompt
          clearAutocomplete(filtered.length || 1);
          output.write(`${painter.error()} Please select a valid option\n`);
          renderAutocomplete(message, query(), filtered, selectedIndex, painter);
          return;
        }

        cleanup();
        clearAutocomplete(filtered.length || 1);
        output.write(`${painter.question()} ${bold(message)} ${painter.answer(result)}\n`);
        resolve(result);
      }
      // Backspace
      else if (key === '\x7f' || key === '\b') {
        if (query().length > 0) {
          const prevLength = filtered.length || 1;
          editor.backspace();
          filtered = filterChoices(query(), choices, filter, minInput, maxSuggestions);
          selectedIndex = 0;
          clearAutocomplete(prevLength);
          renderAutocomplete(message, query(), filtered, selectedIndex, painter);
        }
      }
      // Ctrl+C or Escape
      else if (key === '\x03' || key === '\x1b') {
        cleanup();
        clearAutocomplete(filtered.length || 1);
        output.write(`${painter.error()} Cancelled\n`);
        reject(new PromptCancelledError());
      }
      // Regular character
      else {
        const cleanInput = sanitizeInlineInput(key);
        if (!cleanInput) return;
        const prevLength = filtered.length || 1;
        editor.insert(cleanInput);
        filtered = filterChoices(query(), choices, filter, minInput, maxSuggestions);
        selectedIndex = 0;
        clearAutocomplete(prevLength);
        renderAutocomplete(message, query(), filtered, selectedIndex, painter);
      }
    };

    const cleanup = () => {
      input.removeListener('data', handleKeypress);
      decoder.end();
      finishRawPrompt();
    };

    input.on('data', handleKeypress);
  });
}

function defaultFuzzyFilter<T extends string>(input: string, choice: T): boolean {
  if (!input) return true;
  const inputLower = input.toLowerCase();
  const choiceLower = choice.toLowerCase();

  // Exact prefix match
  if (choiceLower.startsWith(inputLower)) return true;

  // Contains match
  if (choiceLower.includes(inputLower)) return true;

  // Fuzzy match - all characters must appear in order
  let inputIndex = 0;
  for (let i = 0; i < choiceLower.length && inputIndex < inputLower.length; i++) {
    if (choiceLower[i] === inputLower[inputIndex]) {
      inputIndex++;
    }
  }
  return inputIndex === inputLower.length;
}

function filterChoices<T extends string>(
  query: string,
  choices: readonly T[],
  filter: (input: string, choice: T) => boolean,
  minInput: number,
  maxSuggestions: number
): T[] {
  if (query.length < minInput) {
    return choices.slice(0, maxSuggestions);
  }
  return choices.filter(c => filter(query, c)).slice(0, maxSuggestions);
}

function renderAutocomplete<T extends string>(
  message: string,
  query: string,
  filtered: T[],
  selectedIndex: number,
  painter: PromptPainter,
): void {
  const displayQuery = query || dim('Type to search...');
  output.write(`${painter.question()} ${bold(message)} ${displayQuery}${query ? painter.cursor() : ''}\n`);

  if (filtered.length === 0) {
    output.write(`  ${dim('No matches')}\n`);
  } else {
    filtered.forEach((choice, index) => {
      const isCurrent = index === selectedIndex;
      const prefix = isCurrent ? painter.pointer() : ' ';
      const text = isCurrent ? painter.accent(choice) : safeInlineLabel(choice);
      output.write(`  ${prefix} ${text}\n`);
    });
  }
}

function clearAutocomplete(suggestionCount: number): void {
  // question + suggestions (or "no matches" line)
  const lines = Math.max(1, suggestionCount) + 1;
  for (let i = 0; i < lines; i++) {
    output.write(`${CLEAR_LINE}${MOVE_UP}`);
  }
  output.write(CLEAR_LINE);
}

// =============================================================================
// prompt.number()
// =============================================================================

export interface NumberOptions extends PromptAppearanceOptions {
  default?: number;
  min?: number;
  max?: number;
  integer?: boolean;
  validate?: (value: number) => boolean | string;
}

/**
 * Prompt for numeric input
 *
 * @example
 * ```typescript
 * const age = await prompt.number('Age:', { min: 0, max: 120, integer: true });
 * const price = await prompt.number('Price:', { min: 0 });
 * ```
 */
async function ansiPromptNumber(message: string, options: NumberOptions = {}): Promise<number> {
  if (!input.isTTY && options.default === undefined) throw new PromptNonInteractiveError();
  const { default: defaultValue, min, max, integer = false, validate } = options;

  const constraints: string[] = [];
  if (min !== undefined) constraints.push(`min: ${min}`);
  if (max !== undefined) constraints.push(`max: ${max}`);
  if (integer) constraints.push('integer');
  const hint = constraints.length > 0 ? ` ${dim(`(${constraints.join(', ')})`)}` : '';

  const result = await ansiPromptInput(message + hint, {
    default: defaultValue?.toString(),
    theme: options.theme,
    validate: (value) => {
      const num = parseFloat(value);
      if (isNaN(num)) return 'Please enter a valid number';
      if (integer && !Number.isInteger(num)) return 'Please enter an integer';
      if (min !== undefined && num < min) return `Value must be at least ${min}`;
      if (max !== undefined && num > max) return `Value must be at most ${max}`;
      if (validate) return validate(num);
      return true;
    },
  });

  return parseFloat(result);
}

// =============================================================================
// Exported prompt object
// =============================================================================

const ANSI_PROMPT_RENDERER: PromptRenderer = {
  present<TResult>(request: PromptRequest<any>, controls: PromptControls<TResult>): void {
    let operation: Promise<unknown>;
    switch (request.kind) {
      case 'input':
        operation = ansiPromptInput(request.message, request as InputOptions);
        break;
      case 'password':
        operation = ansiPromptPassword(request.message, request as PasswordOptions);
        break;
      case 'confirm':
        operation = ansiPromptConfirm(request.message, request as ConfirmOptions);
        break;
      case 'select':
        operation = ansiPromptSelect(request.message, request.choices, request as SelectOptions);
        break;
      case 'checkbox':
        operation = ansiPromptCheckbox(request.message, request.choices, request as CheckboxOptions);
        break;
      case 'autocomplete':
        operation = ansiPromptAutocomplete(request.message, request.choices, request as AutocompleteOptions);
        break;
      case 'number':
        operation = ansiPromptNumber(request.message, request as NumberOptions);
        break;
    }
    void operation.then(
      (value) => controls.resolve(value as TResult),
      (error) => controls.reject(error),
    );
  },
};

function resolvePublicPromptHost() {
  const host = getPromptHost();
  if (!host.available) host.setRenderer(ANSI_PROMPT_RENDERER);
  return host;
}

export function promptInput(message: string, options: InputOptions = {}): Promise<string> {
  return resolvePublicPromptHost().input(message, options);
}

export function promptConfirm(message: string, options: ConfirmOptions = {}): Promise<boolean> {
  return resolvePublicPromptHost().confirm(message, options);
}

export function promptSelect<T extends string>(
  message: string,
  choices: readonly T[],
  options: SelectOptions<T> = {},
): Promise<T> {
  return resolvePublicPromptHost().select(message, choices, options);
}

export function promptPassword(message: string, options: PasswordOptions = {}): Promise<string> {
  return resolvePublicPromptHost().password(message, options);
}

export function promptCheckbox<T extends string>(
  message: string,
  choices: readonly T[],
  options: CheckboxOptions<T> = {},
): Promise<T[]> {
  return resolvePublicPromptHost().checkbox(message, choices, options);
}

export function promptAutocomplete<T extends string>(
  message: string,
  choices: readonly T[],
  options: AutocompleteOptions<T> = {},
): Promise<T> {
  return resolvePublicPromptHost().autocomplete(message, choices, options);
}

export function promptNumber(message: string, options: NumberOptions = {}): Promise<number> {
  return resolvePublicPromptHost().number(message, options);
}

export const prompt = {
  input: promptInput,
  confirm: promptConfirm,
  select: promptSelect,
  password: promptPassword,
  checkbox: promptCheckbox,
  autocomplete: promptAutocomplete,
  number: promptNumber,
  setTheme: setPromptTheme,
  getTheme: getPromptTheme,
  resetTheme: resetPromptTheme,
};

export default prompt;
