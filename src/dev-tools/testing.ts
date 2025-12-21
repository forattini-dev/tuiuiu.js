/**
 * Testing Utilities - Tools for testing tuiuiu applications
 *
 * Provides:
 * - Terminal Simulator: Mock terminal for testing
 * - Snapshot Testing: Compare rendered output
 * - Event Simulation: Simulate user input
 * - Accessibility Checker: Validate a11y requirements
 * - Test Harness: Complete testing environment
 */

import type { VNode } from '../utils/types.js';

// =============================================================================
// Types
// =============================================================================

export interface TerminalSize {
  columns: number;
  rows: number;
}

export interface CursorPosition {
  x: number;
  y: number;
}

export interface TerminalCell {
  char: string;
  fg?: string;
  bg?: string;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  inverse?: boolean;
  strikethrough?: boolean;
}

export interface TerminalState {
  cells: TerminalCell[][];
  cursor: CursorPosition;
  cursorVisible: boolean;
  title: string;
  alternateScreen: boolean;
  mouseEnabled: boolean;
  bracketedPaste: boolean;
}

export interface KeyEvent {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

export interface MouseEvent {
  x: number;
  y: number;
  button: 'left' | 'right' | 'middle' | 'none';
  action: 'press' | 'release' | 'move' | 'scroll';
  scrollDirection?: 'up' | 'down';
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
}

export interface SnapshotOptions {
  includeStyles?: boolean;
  includePositions?: boolean;
  normalize?: boolean;
}

export interface SnapshotDiff {
  matches: boolean;
  differences: Array<{
    line: number;
    expected: string;
    actual: string;
  }>;
}

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  node?: VNode;
  path?: string;
}

export interface AccessibilityReport {
  valid: boolean;
  issues: AccessibilityIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

// =============================================================================
// Terminal Simulator
// =============================================================================

/**
 * Simulated terminal for testing
 */
export class TerminalSimulator {
  private state: TerminalState;
  private size: TerminalSize;
  private output: string[] = [];
  private inputQueue: string[] = [];
  private eventHandlers: Map<string, Array<(...args: unknown[]) => void>> = new Map();

  constructor(columns = 80, rows = 24) {
    this.size = { columns, rows };
    this.state = this.createInitialState();
  }

  private createInitialState(): TerminalState {
    const cells: TerminalCell[][] = [];
    for (let y = 0; y < this.size.rows; y++) {
      const row: TerminalCell[] = [];
      for (let x = 0; x < this.size.columns; x++) {
        row.push({ char: ' ' });
      }
      cells.push(row);
    }

    return {
      cells,
      cursor: { x: 0, y: 0 },
      cursorVisible: true,
      title: '',
      alternateScreen: false,
      mouseEnabled: false,
      bracketedPaste: false,
    };
  }

  /**
   * Get terminal size
   */
  getSize(): TerminalSize {
    return { ...this.size };
  }

  /**
   * Resize terminal
   */
  resize(columns: number, rows: number): void {
    this.size = { columns, rows };
    this.state = this.createInitialState();
    this.emit('resize', this.size);
  }

  /**
   * Write to terminal (process ANSI sequences)
   */
  write(data: string): void {
    this.output.push(data);
    this.processOutput(data);
  }

  /**
   * Get raw output
   */
  getOutput(): string[] {
    return [...this.output];
  }

  /**
   * Get combined output
   */
  getOutputString(): string {
    return this.output.join('');
  }

  /**
   * Clear output buffer
   */
  clearOutput(): void {
    this.output = [];
  }

  /**
   * Get current terminal state
   */
  getState(): TerminalState {
    return {
      ...this.state,
      cells: this.state.cells.map((row) => row.map((cell) => ({ ...cell }))),
      cursor: { ...this.state.cursor },
    };
  }

  /**
   * Get cell at position
   */
  getCell(x: number, y: number): TerminalCell | null {
    if (y >= 0 && y < this.size.rows && x >= 0 && x < this.size.columns) {
      return { ...this.state.cells[y]![x]! };
    }
    return null;
  }

  /**
   * Get row as string
   */
  getRow(y: number): string {
    if (y >= 0 && y < this.size.rows) {
      return this.state.cells[y]!.map((c) => c.char).join('');
    }
    return '';
  }

  /**
   * Get screen as string array
   */
  getScreen(): string[] {
    return this.state.cells.map((row) =>
      row.map((c) => c.char).join('')
    );
  }

  /**
   * Get screen as single string
   */
  getScreenString(): string {
    return this.getScreen().join('\n');
  }

  /**
   * Simulate key press
   */
  sendKey(event: KeyEvent): void {
    const sequence = this.keyToSequence(event);
    this.inputQueue.push(sequence);
    this.emit('data', sequence);
  }

  /**
   * Simulate text input
   */
  sendText(text: string): void {
    for (const char of text) {
      this.sendKey({ key: char });
    }
  }

  /**
   * Simulate mouse event
   */
  sendMouse(event: MouseEvent): void {
    if (!this.state.mouseEnabled) return;

    const sequence = this.mouseToSequence(event);
    this.inputQueue.push(sequence);
    this.emit('data', sequence);
  }

  /**
   * Simulate paste
   */
  sendPaste(text: string): void {
    if (this.state.bracketedPaste) {
      this.inputQueue.push(`\x1b[200~${text}\x1b[201~`);
      this.emit('data', `\x1b[200~${text}\x1b[201~`);
    } else {
      this.sendText(text);
    }
  }

  /**
   * Get cursor position
   */
  getCursor(): CursorPosition {
    return { ...this.state.cursor };
  }

  /**
   * Check if cursor is visible
   */
  isCursorVisible(): boolean {
    return this.state.cursorVisible;
  }

  /**
   * Get window title
   */
  getTitle(): string {
    return this.state.title;
  }

  /**
   * Register event handler
   */
  on(event: string, handler: (...args: unknown[]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Remove event handler
   */
  off(event: string, handler: (...args: unknown[]) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, ...args: unknown[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(...args);
      }
    }
  }

  /**
   * Reset terminal
   */
  reset(): void {
    this.state = this.createInitialState();
    this.output = [];
    this.inputQueue = [];
  }

  /**
   * Process ANSI output
   */
  private processOutput(data: string): void {
    let i = 0;
    while (i < data.length) {
      if (data[i] === '\x1b') {
        // ESC sequence
        const result = this.parseEscapeSequence(data, i);
        i = result.nextIndex;
      } else if (data[i] === '\n') {
        // Newline
        this.state.cursor.y++;
        this.state.cursor.x = 0;
        i++;
      } else if (data[i] === '\r') {
        // Carriage return
        this.state.cursor.x = 0;
        i++;
      } else if (data[i] === '\t') {
        // Tab
        this.state.cursor.x = Math.min(
          this.state.cursor.x + (8 - (this.state.cursor.x % 8)),
          this.size.columns - 1
        );
        i++;
      } else {
        // Regular character
        this.writeChar(data[i]!);
        i++;
      }
    }
  }

  private writeChar(char: string): void {
    const { x, y } = this.state.cursor;
    if (y >= 0 && y < this.size.rows && x >= 0 && x < this.size.columns) {
      this.state.cells[y]![x]!.char = char;
      this.state.cursor.x++;
      if (this.state.cursor.x >= this.size.columns) {
        this.state.cursor.x = 0;
        this.state.cursor.y++;
      }
    }
  }

  private parseEscapeSequence(
    data: string,
    start: number
  ): { nextIndex: number } {
    if (start + 1 >= data.length) {
      return { nextIndex: start + 1 };
    }

    const next = data[start + 1];

    // CSI sequence
    if (next === '[') {
      return this.parseCSI(data, start + 2);
    }

    // OSC sequence
    if (next === ']') {
      return this.parseOSC(data, start + 2);
    }

    // Other sequences
    return { nextIndex: start + 2 };
  }

  private parseCSI(data: string, start: number): { nextIndex: number } {
    let params = '';
    let i = start;

    // Collect parameters
    while (i < data.length && /[0-9;?]/.test(data[i]!)) {
      params += data[i];
      i++;
    }

    if (i >= data.length) {
      return { nextIndex: i };
    }

    const cmd = data[i];
    i++;

    // Process CSI command
    switch (cmd) {
      case 'H': // Cursor position
      case 'f': {
        const [row, col] = params.split(';').map((n) => parseInt(n) || 1);
        this.state.cursor.y = (row ?? 1) - 1;
        this.state.cursor.x = (col ?? 1) - 1;
        break;
      }
      case 'A': // Cursor up
        this.state.cursor.y -= parseInt(params) || 1;
        break;
      case 'B': // Cursor down
        this.state.cursor.y += parseInt(params) || 1;
        break;
      case 'C': // Cursor forward
        this.state.cursor.x += parseInt(params) || 1;
        break;
      case 'D': // Cursor back
        this.state.cursor.x -= parseInt(params) || 1;
        break;
      case 'J': // Erase display
        this.eraseDisplay(parseInt(params) || 0);
        break;
      case 'K': // Erase line
        this.eraseLine(parseInt(params) || 0);
        break;
      case 'h': // Set mode
        this.setMode(params, true);
        break;
      case 'l': // Reset mode
        this.setMode(params, false);
        break;
      case 'm': // SGR (style)
        // Ignore for now - could track styles
        break;
    }

    return { nextIndex: i };
  }

  private parseOSC(data: string, start: number): { nextIndex: number } {
    // Find ST (string terminator)
    let i = start;
    while (i < data.length) {
      if (data[i] === '\x07' || (data[i] === '\x1b' && data[i + 1] === '\\')) {
        break;
      }
      i++;
    }

    const content = data.slice(start, i);
    const semicolon = content.indexOf(';');
    if (semicolon !== -1) {
      const code = content.slice(0, semicolon);
      const value = content.slice(semicolon + 1);

      if (code === '0' || code === '2') {
        this.state.title = value;
      }
    }

    return { nextIndex: data[i] === '\x1b' ? i + 2 : i + 1 };
  }

  private eraseDisplay(mode: number): void {
    switch (mode) {
      case 0: // From cursor to end
        for (let y = this.state.cursor.y; y < this.size.rows; y++) {
          const startX = y === this.state.cursor.y ? this.state.cursor.x : 0;
          for (let x = startX; x < this.size.columns; x++) {
            this.state.cells[y]![x]!.char = ' ';
          }
        }
        break;
      case 1: // From start to cursor
        for (let y = 0; y <= this.state.cursor.y; y++) {
          const endX = y === this.state.cursor.y ? this.state.cursor.x : this.size.columns;
          for (let x = 0; x < endX; x++) {
            this.state.cells[y]![x]!.char = ' ';
          }
        }
        break;
      case 2: // Entire screen
      case 3:
        for (let y = 0; y < this.size.rows; y++) {
          for (let x = 0; x < this.size.columns; x++) {
            this.state.cells[y]![x]!.char = ' ';
          }
        }
        break;
    }
  }

  private eraseLine(mode: number): void {
    const y = this.state.cursor.y;
    if (y < 0 || y >= this.size.rows) return;

    switch (mode) {
      case 0: // From cursor to end
        for (let x = this.state.cursor.x; x < this.size.columns; x++) {
          this.state.cells[y]![x]!.char = ' ';
        }
        break;
      case 1: // From start to cursor
        for (let x = 0; x <= this.state.cursor.x; x++) {
          this.state.cells[y]![x]!.char = ' ';
        }
        break;
      case 2: // Entire line
        for (let x = 0; x < this.size.columns; x++) {
          this.state.cells[y]![x]!.char = ' ';
        }
        break;
    }
  }

  private setMode(params: string, enable: boolean): void {
    if (params.startsWith('?')) {
      const mode = parseInt(params.slice(1));
      switch (mode) {
        case 25: // Cursor visibility
          this.state.cursorVisible = enable;
          break;
        case 1000: // Mouse tracking
        case 1002:
        case 1003:
        case 1006:
          this.state.mouseEnabled = enable;
          break;
        case 1049: // Alternate screen
          this.state.alternateScreen = enable;
          break;
        case 2004: // Bracketed paste
          this.state.bracketedPaste = enable;
          break;
      }
    }
  }

  private keyToSequence(event: KeyEvent): string {
    let seq = '';

    // Special keys
    const specialKeys: Record<string, string> = {
      enter: '\r',
      return: '\r',
      escape: '\x1b',
      esc: '\x1b',
      tab: '\t',
      backspace: '\x7f',
      delete: '\x1b[3~',
      up: '\x1b[A',
      down: '\x1b[B',
      right: '\x1b[C',
      left: '\x1b[D',
      home: '\x1b[H',
      end: '\x1b[F',
      pageup: '\x1b[5~',
      pagedown: '\x1b[6~',
      insert: '\x1b[2~',
      f1: '\x1bOP',
      f2: '\x1bOQ',
      f3: '\x1bOR',
      f4: '\x1bOS',
      f5: '\x1b[15~',
      f6: '\x1b[17~',
      f7: '\x1b[18~',
      f8: '\x1b[19~',
      f9: '\x1b[20~',
      f10: '\x1b[21~',
      f11: '\x1b[23~',
      f12: '\x1b[24~',
      space: ' ',
    };

    const key = event.key.toLowerCase();
    if (specialKeys[key]) {
      seq = specialKeys[key]!;
    } else if (event.key.length === 1) {
      seq = event.key;
    }

    // Apply modifiers
    if (event.ctrl && seq.length === 1) {
      const code = seq.charCodeAt(0);
      if (code >= 97 && code <= 122) {
        // a-z
        seq = String.fromCharCode(code - 96);
      }
    }

    if (event.alt && seq.length === 1) {
      seq = '\x1b' + seq;
    }

    return seq;
  }

  private mouseToSequence(event: MouseEvent): string {
    // SGR mouse encoding
    const buttonMap = { left: 0, middle: 1, right: 2, none: 3 };
    let button = buttonMap[event.button];

    if (event.action === 'scroll') {
      button = event.scrollDirection === 'up' ? 64 : 65;
    } else if (event.action === 'move') {
      button = 32 + button;
    }

    if (event.shift) button += 4;
    if (event.alt) button += 8;
    if (event.ctrl) button += 16;

    const action = event.action === 'release' ? 'm' : 'M';
    return `\x1b[<${button};${event.x + 1};${event.y + 1}${action}`;
  }
}

// =============================================================================
// Snapshot Testing
// =============================================================================

/**
 * Create a snapshot of rendered output
 */
export function createSnapshot(
  output: string,
  options: SnapshotOptions = {}
): string {
  let snapshot = output;

  if (options.normalize) {
    // Remove ANSI codes if not including styles
    if (!options.includeStyles) {
      snapshot = stripAnsi(snapshot);
    }

    // Normalize whitespace
    snapshot = snapshot
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trimEnd();
  }

  return snapshot;
}

/**
 * Compare snapshots
 */
export function compareSnapshots(
  expected: string,
  actual: string
): SnapshotDiff {
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const differences: SnapshotDiff['differences'] = [];

  const maxLines = Math.max(expectedLines.length, actualLines.length);

  for (let i = 0; i < maxLines; i++) {
    const exp = expectedLines[i] ?? '';
    const act = actualLines[i] ?? '';

    if (exp !== act) {
      differences.push({
        line: i + 1,
        expected: exp,
        actual: act,
      });
    }
  }

  return {
    matches: differences.length === 0,
    differences,
  };
}

/**
 * Format snapshot diff for display
 */
export function formatSnapshotDiff(diff: SnapshotDiff): string {
  if (diff.matches) {
    return 'Snapshots match';
  }

  const lines = ['Snapshot differences:', ''];

  for (const d of diff.differences) {
    lines.push(`Line ${d.line}:`);
    lines.push(`  - ${d.expected}`);
    lines.push(`  + ${d.actual}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Strip ANSI codes from string
 */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

// =============================================================================
// Event Simulation
// =============================================================================

export interface EventSimulator {
  keyPress(key: string, modifiers?: Partial<KeyEvent>): void;
  keyDown(key: string, modifiers?: Partial<KeyEvent>): void;
  keyUp(key: string, modifiers?: Partial<KeyEvent>): void;
  type(text: string, delay?: number): Promise<void>;
  click(x: number, y: number, button?: MouseEvent['button']): void;
  doubleClick(x: number, y: number): void;
  rightClick(x: number, y: number): void;
  drag(fromX: number, fromY: number, toX: number, toY: number): void;
  scroll(x: number, y: number, direction: 'up' | 'down', amount?: number): void;
  paste(text: string): void;
  resize(columns: number, rows: number): void;
}

/**
 * Create event simulator for terminal
 */
export function createEventSimulator(terminal: TerminalSimulator): EventSimulator {
  return {
    keyPress(key: string, modifiers: Partial<KeyEvent> = {}): void {
      terminal.sendKey({ key, ...modifiers });
    },

    keyDown(key: string, modifiers: Partial<KeyEvent> = {}): void {
      // For simulation, keyDown is same as keyPress
      terminal.sendKey({ key, ...modifiers });
    },

    keyUp(_key: string, _modifiers: Partial<KeyEvent> = {}): void {
      // Terminal doesn't have separate keyup events
    },

    async type(text: string, delay = 0): Promise<void> {
      for (const char of text) {
        terminal.sendKey({ key: char });
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    },

    click(x: number, y: number, button: MouseEvent['button'] = 'left'): void {
      terminal.sendMouse({ x, y, button, action: 'press' });
      terminal.sendMouse({ x, y, button, action: 'release' });
    },

    doubleClick(x: number, y: number): void {
      this.click(x, y);
      this.click(x, y);
    },

    rightClick(x: number, y: number): void {
      this.click(x, y, 'right');
    },

    drag(fromX: number, fromY: number, toX: number, toY: number): void {
      terminal.sendMouse({ x: fromX, y: fromY, button: 'left', action: 'press' });

      // Simulate movement
      const steps = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY));
      for (let i = 1; i <= steps; i++) {
        const x = Math.round(fromX + ((toX - fromX) * i) / steps);
        const y = Math.round(fromY + ((toY - fromY) * i) / steps);
        terminal.sendMouse({ x, y, button: 'left', action: 'move' });
      }

      terminal.sendMouse({ x: toX, y: toY, button: 'left', action: 'release' });
    },

    scroll(
      x: number,
      y: number,
      direction: 'up' | 'down',
      amount = 3
    ): void {
      for (let i = 0; i < amount; i++) {
        terminal.sendMouse({
          x,
          y,
          button: 'none',
          action: 'scroll',
          scrollDirection: direction,
        });
      }
    },

    paste(text: string): void {
      terminal.sendPaste(text);
    },

    resize(columns: number, rows: number): void {
      terminal.resize(columns, rows);
    },
  };
}

// =============================================================================
// Accessibility Checker
// =============================================================================

/**
 * Check accessibility of VNode tree
 */
export function checkAccessibility(node: VNode): AccessibilityReport {
  const issues: AccessibilityIssue[] = [];

  function check(n: VNode, path: string): void {
    const props = n.props || {};
    const type = typeof n.type === 'string' ? n.type : (n.type as { name?: string } | undefined)?.name || 'Component';

    // Check for missing labels on interactive elements
    const interactiveTypes = ['button', 'input', 'select', 'textinput', 'checkbox'];
    if (interactiveTypes.includes(type.toLowerCase())) {
      if (!props.label && !props['aria-label'] && !props['aria-labelledby']) {
        issues.push({
          type: 'error',
          code: 'missing-label',
          message: `Interactive element "${type}" is missing a label`,
          node: n,
          path,
        });
      }
    }

    // Check for focusable elements without tabIndex
    if (props.focusable === true && props.tabIndex === undefined) {
      issues.push({
        type: 'warning',
        code: 'missing-tabindex',
        message: `Focusable element "${type}" should have explicit tabIndex`,
        node: n,
        path,
      });
    }

    // Check for images without alt text
    if (type.toLowerCase() === 'image' || type.toLowerCase() === 'picture') {
      if (!props.alt && !props['aria-label']) {
        issues.push({
          type: 'error',
          code: 'missing-alt',
          message: `Image element is missing alt text`,
          node: n,
          path,
        });
      }
    }

    // Check for color contrast issues (basic check)
    if (props.color && props.backgroundColor) {
      const hasLowContrast = checkLowContrast(
        props.color as string,
        props.backgroundColor as string
      );
      if (hasLowContrast) {
        issues.push({
          type: 'warning',
          code: 'low-contrast',
          message: `Potential low contrast between "${props.color}" and "${props.backgroundColor}"`,
          node: n,
          path,
        });
      }
    }

    // Check for keyboard accessibility
    if (props.onClick && !props.onKeyPress && !props.focusable) {
      issues.push({
        type: 'warning',
        code: 'click-no-keyboard',
        message: `Element with onClick should be keyboard accessible`,
        node: n,
        path,
      });
    }

    // Check for heading hierarchy
    if (type === 'heading' || props.role === 'heading') {
      if (!props.level && !props['aria-level']) {
        issues.push({
          type: 'info',
          code: 'heading-no-level',
          message: `Heading should have explicit level for screen readers`,
          node: n,
          path,
        });
      }
    }

    // Recursively check children
    const children = n.children || [];
    let childIndex = 0;
    for (const child of children) {
      if (child && typeof child === 'object' && 'type' in child) {
        check(child as VNode, `${path}.${childIndex}`);
        childIndex++;
      }
    }
  }

  check(node, '0');

  return {
    valid: issues.filter((i) => i.type === 'error').length === 0,
    issues,
    summary: {
      errors: issues.filter((i) => i.type === 'error').length,
      warnings: issues.filter((i) => i.type === 'warning').length,
      info: issues.filter((i) => i.type === 'info').length,
    },
  };
}

/**
 * Basic low contrast check (simplified)
 */
function checkLowContrast(fg: string, bg: string): boolean {
  // Simple check for obviously problematic combinations
  const similar = [
    ['gray', 'grey'],
    ['lightgray', 'white'],
    ['darkgray', 'black'],
    ['yellow', 'white'],
    ['cyan', 'white'],
  ];

  const fgLower = fg.toLowerCase();
  const bgLower = bg.toLowerCase();

  for (const pair of similar) {
    if (
      (pair.includes(fgLower) && pair.includes(bgLower)) ||
      fgLower === bgLower
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Format accessibility report
 */
export function formatAccessibilityReport(report: AccessibilityReport): string {
  const lines = [
    `Accessibility Report: ${report.valid ? '✓ PASSED' : '✗ FAILED'}`,
    `  Errors: ${report.summary.errors}`,
    `  Warnings: ${report.summary.warnings}`,
    `  Info: ${report.summary.info}`,
    '',
  ];

  if (report.issues.length > 0) {
    lines.push('Issues:');
    for (const issue of report.issues) {
      const icon = issue.type === 'error' ? '✗' : issue.type === 'warning' ? '⚠' : 'ℹ';
      lines.push(`  ${icon} [${issue.code}] ${issue.message}`);
      if (issue.path) {
        lines.push(`    at path: ${issue.path}`);
      }
    }
  }

  return lines.join('\n');
}

// =============================================================================
// Test Harness
// =============================================================================

export interface TestHarnessOptions {
  columns?: number;
  rows?: number;
  enableMouse?: boolean;
  enableBracketedPaste?: boolean;
}

export interface TestHarness {
  terminal: TerminalSimulator;
  events: EventSimulator;
  render(node: VNode): string;
  getScreen(): string[];
  getScreenString(): string;
  checkA11y(node: VNode): AccessibilityReport;
  snapshot(output: string, options?: SnapshotOptions): string;
  compareSnapshot(expected: string, actual: string): SnapshotDiff;
  reset(): void;
  cleanup(): void;
}

/**
 * Create a complete test harness
 */
export function createTestHarness(options: TestHarnessOptions = {}): TestHarness {
  const { columns = 80, rows = 24 } = options;

  const terminal = new TerminalSimulator(columns, rows);
  const events = createEventSimulator(terminal);

  // Enable mouse if requested
  if (options.enableMouse) {
    terminal.write('\x1b[?1000h');
  }

  // Enable bracketed paste if requested
  if (options.enableBracketedPaste) {
    terminal.write('\x1b[?2004h');
  }

  return {
    terminal,
    events,

    render(node: VNode): string {
      // This would integrate with the actual renderer
      // For now, return a simple string representation
      return formatVNode(node);
    },

    getScreen(): string[] {
      return terminal.getScreen();
    },

    getScreenString(): string {
      return terminal.getScreenString();
    },

    checkA11y(node: VNode): AccessibilityReport {
      return checkAccessibility(node);
    },

    snapshot(output: string, opts?: SnapshotOptions): string {
      return createSnapshot(output, opts);
    },

    compareSnapshot(expected: string, actual: string): SnapshotDiff {
      return compareSnapshots(expected, actual);
    },

    reset(): void {
      terminal.reset();
    },

    cleanup(): void {
      terminal.reset();
    },
  };
}

/**
 * Format VNode as string (simple representation)
 */
function formatVNode(node: VNode, indent = 0): string {
  const type = typeof node.type === 'string' ? node.type : (node.type as { name?: string } | undefined)?.name || 'Component';
  const props = node.props || {};
  const prefix = '  '.repeat(indent);

  let result = `${prefix}<${type}`;

  // Add relevant props
  if (props.id) result += ` id="${props.id}"`;
  if (props.className) result += ` class="${props.className}"`;

  const children = node.children || [];
  const hasChildren = children.length > 0;

  if (!hasChildren) {
    result += ' />\n';
  } else {
    result += '>\n';

    for (const child of children) {
      if (typeof child === 'string') {
        result += `${prefix}  ${child}\n`;
      } else if (child && typeof child === 'object' && 'type' in child) {
        result += formatVNode(child as VNode, indent + 1);
      }
    }

    result += `${prefix}</${type}>\n`;
  }

  return result;
}
