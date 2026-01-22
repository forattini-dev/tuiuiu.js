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

// =============================================================================
// Types
// =============================================================================

export interface InputOptions {
  default?: string;
  placeholder?: string;
  validate?: (value: string) => boolean | string;
  transform?: (value: string) => string;
}

export interface ConfirmOptions {
  default?: boolean;
}

export interface SelectOptions<T extends string = string> {
  default?: T;
}

export interface PasswordOptions {
  mask?: string;
  validate?: (value: string) => boolean | string;
}

export interface CheckboxOptions<T extends string = string> {
  default?: T[];
  min?: number;
  max?: number;
  validate?: (values: T[]) => boolean | string;
}

export interface AutocompleteOptions<T extends string = string> {
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

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const CLEAR_LINE = '\x1b[2K\r';
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';
const MOVE_UP = '\x1b[1A';

function cyan(text: string): string {
  return `${CYAN}${text}${RESET}`;
}

function green(text: string): string {
  return `${GREEN}${text}${RESET}`;
}

function yellow(text: string): string {
  return `${YELLOW}${text}${RESET}`;
}

function dim(text: string): string {
  return `${DIM}${text}${RESET}`;
}

function bold(text: string): string {
  return `${BOLD}${text}${RESET}`;
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
export async function promptInput(message: string, options: InputOptions = {}): Promise<string> {
  const { default: defaultValue, placeholder, validate, transform } = options;

  const rl = createReadlineInterface();

  const promptText = buildPromptText(message, defaultValue, placeholder);

  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      rl.close();

      let value = answer.trim() || defaultValue || '';

      if (transform) {
        value = transform(value);
      }

      if (validate) {
        const result = validate(value);
        if (result !== true) {
          const errorMsg = typeof result === 'string' ? result : 'Invalid input';
          output.write(`${CLEAR_LINE}${yellow('!')} ${errorMsg}\n`);
          resolve(promptInput(message, options));
          return;
        }
      }

      // Rewrite the line with the final answer
      output.write(`${MOVE_UP}${CLEAR_LINE}${cyan('?')} ${bold(message)} ${green(value)}\n`);
      resolve(value);
    });
  });
}

function buildPromptText(message: string, defaultValue?: string, placeholder?: string): string {
  let text = `${cyan('?')} ${bold(message)} `;

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
export async function promptConfirm(message: string, options: ConfirmOptions = {}): Promise<boolean> {
  const { default: defaultValue = false } = options;

  const rl = createReadlineInterface();

  const hint = defaultValue ? 'Y/n' : 'y/N';
  const promptText = `${cyan('?')} ${bold(message)} ${dim(`(${hint})`)} `;

  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      rl.close();

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
      output.write(`${MOVE_UP}${CLEAR_LINE}${cyan('?')} ${bold(message)} ${green(displayValue)}\n`);
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
export async function promptSelect<T extends string>(
  message: string,
  choices: readonly T[],
  options: SelectOptions<T> = {}
): Promise<T> {
  const { default: defaultValue } = options;

  if (choices.length === 0) {
    throw new Error('prompt.select requires at least one choice');
  }

  // Non-TTY fallback: return default or first choice
  if (!input.isTTY) {
    const result = defaultValue ?? choices[0]!;
    output.write(`${cyan('?')} ${bold(message)} ${green(result)} ${dim('(non-interactive)')}\n`);
    return result;
  }

  const defaultIndex = defaultValue ? choices.indexOf(defaultValue) : 0;
  let selectedIndex = defaultIndex >= 0 ? defaultIndex : 0;

  return new Promise((resolve) => {
    // Hide cursor during selection
    output.write(HIDE_CURSOR);

    // Render initial state
    renderSelect(message, choices, selectedIndex);

    // Handle raw input
    if (input.isTTY) {
      input.setRawMode(true);
    }
    input.resume();

    const handleKeypress = (chunk: Buffer) => {
      const key = chunk.toString();

      // Arrow up or k
      if (key === '\x1b[A' || key === 'k') {
        selectedIndex = (selectedIndex - 1 + choices.length) % choices.length;
        clearSelect(choices.length);
        renderSelect(message, choices, selectedIndex);
      }
      // Arrow down or j
      else if (key === '\x1b[B' || key === 'j') {
        selectedIndex = (selectedIndex + 1) % choices.length;
        clearSelect(choices.length);
        renderSelect(message, choices, selectedIndex);
      }
      // Enter
      else if (key === '\r' || key === '\n') {
        cleanup();
        const selected = choices[selectedIndex]!;

        // Clear and show final result
        clearSelect(choices.length);
        output.write(`${cyan('?')} ${bold(message)} ${green(selected)}\n`);

        resolve(selected);
      }
      // Ctrl+C or Escape
      else if (key === '\x03' || key === '\x1b') {
        cleanup();
        clearSelect(choices.length);
        output.write(`${yellow('!')} Cancelled\n`);
        process.exit(0);
      }
      // Number keys for quick selection
      else if (key >= '1' && key <= '9') {
        const num = parseInt(key, 10) - 1;
        if (num < choices.length) {
          selectedIndex = num;
          clearSelect(choices.length);
          renderSelect(message, choices, selectedIndex);
        }
      }
    };

    const cleanup = () => {
      input.removeListener('data', handleKeypress);
      if (input.isTTY) {
        input.setRawMode(false);
      }
      input.pause();
      output.write(SHOW_CURSOR);
    };

    input.on('data', handleKeypress);
  });
}

function renderSelect<T extends string>(message: string, choices: readonly T[], selectedIndex: number): void {
  output.write(`${cyan('?')} ${bold(message)}\n`);

  choices.forEach((choice, index) => {
    const prefix = index === selectedIndex ? green('❯') : ' ';
    const text = index === selectedIndex ? cyan(choice) : choice;
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
export async function promptPassword(message: string, options: PasswordOptions = {}): Promise<string> {
  const { mask = '*', validate } = options;

  return new Promise((resolve) => {
    output.write(`${cyan('?')} ${bold(message)} `);

    if (input.isTTY) {
      input.setRawMode(true);
    }
    input.resume();

    let password = '';
    let maskedDisplay = '';

    const handleKeypress = (chunk: Buffer) => {
      const char = chunk.toString();

      // Enter
      if (char === '\r' || char === '\n') {
        cleanup();

        if (validate) {
          const result = validate(password);
          if (result !== true) {
            const errorMsg = typeof result === 'string' ? result : 'Invalid input';
            output.write(`\n${yellow('!')} ${errorMsg}\n`);
            resolve(promptPassword(message, options));
            return;
          }
        }

        output.write(`\n`);
        resolve(password);
      }
      // Backspace
      else if (char === '\x7f' || char === '\b') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          maskedDisplay = maskedDisplay.slice(0, -1);
          output.write('\b \b');
        }
      }
      // Ctrl+C
      else if (char === '\x03') {
        cleanup();
        output.write('\n');
        process.exit(0);
      }
      // Regular character
      else if (char.length === 1 && char >= ' ') {
        password += char;
        maskedDisplay += mask;
        output.write(mask);
      }
    };

    const cleanup = () => {
      input.removeListener('data', handleKeypress);
      if (input.isTTY) {
        input.setRawMode(false);
      }
      input.pause();
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
export async function promptCheckbox<T extends string>(
  message: string,
  choices: readonly T[],
  options: CheckboxOptions<T> = {}
): Promise<T[]> {
  const { default: defaultValues = [], min = 0, max = choices.length, validate } = options;

  if (choices.length === 0) {
    throw new Error('prompt.checkbox requires at least one choice');
  }

  // Non-TTY fallback: return defaults or empty array
  if (!input.isTTY) {
    output.write(`${cyan('?')} ${bold(message)} ${dim('(non-interactive)')}\n`);
    return defaultValues;
  }

  let selectedIndex = 0;
  const selected = new Set<T>(defaultValues);

  return new Promise((resolve) => {
    output.write(HIDE_CURSOR);
    renderCheckbox(message, choices, selectedIndex, selected);
    input.setRawMode(true);
    input.resume();

    const handleKeypress = (chunk: Buffer) => {
      const key = chunk.toString();

      // Arrow up or k
      if (key === '\x1b[A' || key === 'k') {
        selectedIndex = (selectedIndex - 1 + choices.length) % choices.length;
        clearCheckbox(choices.length);
        renderCheckbox(message, choices, selectedIndex, selected);
      }
      // Arrow down or j
      else if (key === '\x1b[B' || key === 'j') {
        selectedIndex = (selectedIndex + 1) % choices.length;
        clearCheckbox(choices.length);
        renderCheckbox(message, choices, selectedIndex, selected);
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
        renderCheckbox(message, choices, selectedIndex, selected);
      }
      // Enter - confirm
      else if (key === '\r' || key === '\n') {
        const values = choices.filter(c => selected.has(c));

        // Check min constraint
        if (values.length < min) {
          clearCheckbox(choices.length);
          output.write(`${yellow('!')} Select at least ${min} item(s)\n`);
          renderCheckbox(message, choices, selectedIndex, selected);
          return;
        }

        // Custom validation
        if (validate) {
          const result = validate(values);
          if (result !== true) {
            const errorMsg = typeof result === 'string' ? result : 'Invalid selection';
            clearCheckbox(choices.length);
            output.write(`${yellow('!')} ${errorMsg}\n`);
            renderCheckbox(message, choices, selectedIndex, selected);
            return;
          }
        }

        cleanup();
        clearCheckbox(choices.length);
        const display = values.length > 0 ? values.join(', ') : dim('(none)');
        output.write(`${cyan('?')} ${bold(message)} ${green(display)}\n`);
        resolve(values);
      }
      // Ctrl+C or Escape
      else if (key === '\x03' || key === '\x1b') {
        cleanup();
        clearCheckbox(choices.length);
        output.write(`${yellow('!')} Cancelled\n`);
        process.exit(0);
      }
      // 'a' - select all
      else if (key === 'a') {
        if (selected.size === choices.length) {
          selected.clear();
        } else {
          choices.slice(0, max).forEach(c => selected.add(c));
        }
        clearCheckbox(choices.length);
        renderCheckbox(message, choices, selectedIndex, selected);
      }
    };

    const cleanup = () => {
      input.removeListener('data', handleKeypress);
      input.setRawMode(false);
      input.pause();
      output.write(SHOW_CURSOR);
    };

    input.on('data', handleKeypress);
  });
}

function renderCheckbox<T extends string>(
  message: string,
  choices: readonly T[],
  selectedIndex: number,
  selected: Set<T>
): void {
  const hint = dim(`(space to toggle, a to toggle all, enter to confirm)`);
  output.write(`${cyan('?')} ${bold(message)} ${hint}\n`);

  choices.forEach((choice, index) => {
    const isCurrent = index === selectedIndex;
    const isSelected = selected.has(choice);
    const cursor = isCurrent ? green('❯') : ' ';
    const checkbox = isSelected ? green('◉') : dim('○');
    const text = isCurrent ? cyan(choice) : choice;
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
export async function promptAutocomplete<T extends string>(
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

  if (choices.length === 0) {
    throw new Error('prompt.autocomplete requires at least one choice');
  }

  // Non-TTY fallback
  if (!input.isTTY) {
    output.write(`${cyan('?')} ${bold(message)} ${dim('(non-interactive)')}\n`);
    return defaultValue ?? choices[0]!;
  }

  let query = defaultValue ?? '';
  let selectedIndex = 0;
  let filtered = filterChoices(query, choices, filter, minInput, maxSuggestions);

  return new Promise((resolve) => {
    output.write(HIDE_CURSOR);
    renderAutocomplete(message, query, filtered, selectedIndex);
    input.setRawMode(true);
    input.resume();

    const handleKeypress = (chunk: Buffer) => {
      const key = chunk.toString();

      // Arrow up
      if (key === '\x1b[A') {
        if (filtered.length > 0) {
          selectedIndex = (selectedIndex - 1 + filtered.length) % filtered.length;
          clearAutocomplete(filtered.length);
          renderAutocomplete(message, query, filtered, selectedIndex);
        }
      }
      // Arrow down
      else if (key === '\x1b[B') {
        if (filtered.length > 0) {
          selectedIndex = (selectedIndex + 1) % filtered.length;
          clearAutocomplete(filtered.length);
          renderAutocomplete(message, query, filtered, selectedIndex);
        }
      }
      // Tab - complete with selected
      else if (key === '\t' && filtered.length > 0) {
        query = filtered[selectedIndex]!;
        filtered = filterChoices(query, choices, filter, minInput, maxSuggestions);
        selectedIndex = 0;
        clearAutocomplete(filtered.length || 1);
        renderAutocomplete(message, query, filtered, selectedIndex);
      }
      // Enter
      else if (key === '\r' || key === '\n') {
        cleanup();

        // If exact match or selection exists, use it
        let result: T;
        if (filtered.length > 0) {
          result = filtered[selectedIndex]!;
        } else if (choices.includes(query as T)) {
          result = query as T;
        } else {
          // No match - re-prompt
          clearAutocomplete(filtered.length || 1);
          output.write(`${yellow('!')} Please select a valid option\n`);
          output.write(HIDE_CURSOR);
          renderAutocomplete(message, query, filtered, selectedIndex);
          input.setRawMode(true);
          input.resume();
          input.on('data', handleKeypress);
          return;
        }

        clearAutocomplete(filtered.length || 1);
        output.write(`${cyan('?')} ${bold(message)} ${green(result)}\n`);
        resolve(result);
      }
      // Backspace
      else if (key === '\x7f' || key === '\b') {
        if (query.length > 0) {
          const prevLength = filtered.length || 1;
          query = query.slice(0, -1);
          filtered = filterChoices(query, choices, filter, minInput, maxSuggestions);
          selectedIndex = 0;
          clearAutocomplete(prevLength);
          renderAutocomplete(message, query, filtered, selectedIndex);
        }
      }
      // Ctrl+C or Escape
      else if (key === '\x03' || key === '\x1b') {
        cleanup();
        clearAutocomplete(filtered.length || 1);
        output.write(`${yellow('!')} Cancelled\n`);
        process.exit(0);
      }
      // Regular character
      else if (key.length === 1 && key >= ' ') {
        const prevLength = filtered.length || 1;
        query += key;
        filtered = filterChoices(query, choices, filter, minInput, maxSuggestions);
        selectedIndex = 0;
        clearAutocomplete(prevLength);
        renderAutocomplete(message, query, filtered, selectedIndex);
      }
    };

    const cleanup = () => {
      input.removeListener('data', handleKeypress);
      input.setRawMode(false);
      input.pause();
      output.write(SHOW_CURSOR);
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
  selectedIndex: number
): void {
  const cursor = '▌';
  const displayQuery = query || dim('Type to search...');
  output.write(`${cyan('?')} ${bold(message)} ${displayQuery}${query ? cursor : ''}\n`);

  if (filtered.length === 0) {
    output.write(`  ${dim('No matches')}\n`);
  } else {
    filtered.forEach((choice, index) => {
      const isCurrent = index === selectedIndex;
      const prefix = isCurrent ? green('❯') : ' ';
      const text = isCurrent ? cyan(choice) : choice;
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

export interface NumberOptions {
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
export async function promptNumber(message: string, options: NumberOptions = {}): Promise<number> {
  const { default: defaultValue, min, max, integer = false, validate } = options;

  const constraints: string[] = [];
  if (min !== undefined) constraints.push(`min: ${min}`);
  if (max !== undefined) constraints.push(`max: ${max}`);
  if (integer) constraints.push('integer');
  const hint = constraints.length > 0 ? ` ${dim(`(${constraints.join(', ')})`)}` : '';

  const result = await promptInput(message + hint, {
    default: defaultValue?.toString(),
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

export const prompt = {
  input: promptInput,
  confirm: promptConfirm,
  select: promptSelect,
  password: promptPassword,
  checkbox: promptCheckbox,
  autocomplete: promptAutocomplete,
  number: promptNumber,
};

export default prompt;
