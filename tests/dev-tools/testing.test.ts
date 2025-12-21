/**
 * Developer Tools - Testing Utilities Tests
 *
 * Tests for terminal simulator, snapshot testing, event simulation,
 * accessibility checker, and test harness.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Terminal simulator
  TerminalSimulator,
  // Snapshot testing
  createSnapshot,
  compareSnapshots,
  formatSnapshotDiff,
  stripAnsi,
  // Event simulation
  createEventSimulator,
  // Accessibility
  checkAccessibility,
  formatAccessibilityReport,
  // Test harness
  createTestHarness,
} from '../../src/dev-tools/index.js';
import type { VNode } from '../../src/utils/types.js';

// Helper to create test VNodes
function createNode(
  type: string,
  props: Record<string, unknown> = {},
  children: VNode[] = []
): VNode {
  return { type, props, children };
}

describe('Terminal Simulator', () => {
  let terminal: TerminalSimulator;

  beforeEach(() => {
    terminal = new TerminalSimulator(80, 24);
  });

  describe('initialization', () => {
    it('should create with default size', () => {
      const size = terminal.getSize();
      expect(size.columns).toBe(80);
      expect(size.rows).toBe(24);
    });

    it('should create with custom size', () => {
      const custom = new TerminalSimulator(100, 30);
      const size = custom.getSize();
      expect(size.columns).toBe(100);
      expect(size.rows).toBe(30);
    });

    it('should initialize with blank screen', () => {
      const screen = terminal.getScreen();
      expect(screen.length).toBe(24);
      expect(screen[0]!.trim()).toBe('');
    });

    it('should initialize cursor at origin', () => {
      const cursor = terminal.getCursor();
      expect(cursor.x).toBe(0);
      expect(cursor.y).toBe(0);
    });

    it('should have visible cursor by default', () => {
      expect(terminal.isCursorVisible()).toBe(true);
    });
  });

  describe('writing', () => {
    it('should write text to screen', () => {
      terminal.write('Hello');
      expect(terminal.getRow(0)).toContain('Hello');
    });

    it('should advance cursor after writing', () => {
      terminal.write('Hi');
      const cursor = terminal.getCursor();
      expect(cursor.x).toBe(2);
    });

    it('should handle newlines', () => {
      terminal.write('Line1\nLine2');
      expect(terminal.getRow(0)).toContain('Line1');
      expect(terminal.getRow(1)).toContain('Line2');
    });

    it('should handle carriage return', () => {
      terminal.write('ABC\rD');
      expect(terminal.getRow(0).startsWith('D')).toBe(true);
    });

    it('should record output', () => {
      terminal.write('test');
      const output = terminal.getOutput();
      expect(output).toContain('test');
    });

    it('should get output as string', () => {
      terminal.write('hello ');
      terminal.write('world');
      expect(terminal.getOutputString()).toBe('hello world');
    });

    it('should clear output buffer', () => {
      terminal.write('test');
      terminal.clearOutput();
      expect(terminal.getOutput().length).toBe(0);
    });
  });

  describe('cursor control', () => {
    it('should move cursor with CSI H', () => {
      terminal.write('\x1b[5;10H');
      const cursor = terminal.getCursor();
      expect(cursor.y).toBe(4); // 0-indexed
      expect(cursor.x).toBe(9);
    });

    it('should move cursor up', () => {
      terminal.write('\x1b[5;5H'); // Start at 5,5
      terminal.write('\x1b[2A'); // Move up 2
      const cursor = terminal.getCursor();
      expect(cursor.y).toBe(2);
    });

    it('should move cursor down', () => {
      terminal.write('\x1b[1;1H');
      terminal.write('\x1b[3B');
      const cursor = terminal.getCursor();
      expect(cursor.y).toBe(3);
    });

    it('should move cursor right', () => {
      terminal.write('\x1b[1;1H');
      terminal.write('\x1b[5C');
      const cursor = terminal.getCursor();
      expect(cursor.x).toBe(5);
    });

    it('should move cursor left', () => {
      terminal.write('\x1b[1;10H');
      terminal.write('\x1b[3D');
      const cursor = terminal.getCursor();
      expect(cursor.x).toBe(6);
    });

    it('should hide cursor', () => {
      terminal.write('\x1b[?25l');
      expect(terminal.isCursorVisible()).toBe(false);
    });

    it('should show cursor', () => {
      terminal.write('\x1b[?25l');
      terminal.write('\x1b[?25h');
      expect(terminal.isCursorVisible()).toBe(true);
    });
  });

  describe('erasing', () => {
    it('should erase from cursor to end of screen', () => {
      terminal.write('AAAAA');
      terminal.write('\x1b[1;3H'); // Move to column 3
      terminal.write('\x1b[0J'); // Erase from cursor to end
      expect(terminal.getRow(0)).toBe('AA' + ' '.repeat(78));
    });

    it('should erase entire screen', () => {
      terminal.write('Hello World');
      terminal.write('\x1b[2J');
      expect(terminal.getRow(0).trim()).toBe('');
    });

    it('should erase line from cursor', () => {
      terminal.write('Hello World');
      terminal.write('\x1b[1;6H');
      terminal.write('\x1b[0K');
      expect(terminal.getRow(0)).toBe('Hello' + ' '.repeat(75));
    });
  });

  describe('mode settings', () => {
    it('should enable mouse tracking', () => {
      terminal.write('\x1b[?1000h');
      const state = terminal.getState();
      expect(state.mouseEnabled).toBe(true);
    });

    it('should disable mouse tracking', () => {
      terminal.write('\x1b[?1000h');
      terminal.write('\x1b[?1000l');
      const state = terminal.getState();
      expect(state.mouseEnabled).toBe(false);
    });

    it('should enable bracketed paste', () => {
      terminal.write('\x1b[?2004h');
      const state = terminal.getState();
      expect(state.bracketedPaste).toBe(true);
    });

    it('should enable alternate screen', () => {
      terminal.write('\x1b[?1049h');
      const state = terminal.getState();
      expect(state.alternateScreen).toBe(true);
    });
  });

  describe('title', () => {
    it('should set window title via OSC', () => {
      terminal.write('\x1b]0;My Title\x07');
      expect(terminal.getTitle()).toBe('My Title');
    });

    it('should set window title via OSC 2', () => {
      terminal.write('\x1b]2;Another Title\x1b\\');
      expect(terminal.getTitle()).toBe('Another Title');
    });
  });

  describe('resize', () => {
    it('should resize terminal', () => {
      terminal.resize(100, 30);
      const size = terminal.getSize();
      expect(size.columns).toBe(100);
      expect(size.rows).toBe(30);
    });

    it('should emit resize event', () => {
      let resized = false;
      terminal.on('resize', () => { resized = true; });
      terminal.resize(100, 30);
      expect(resized).toBe(true);
    });

    it('should clear screen on resize', () => {
      terminal.write('Hello');
      terminal.resize(100, 30);
      expect(terminal.getRow(0).trim()).toBe('');
    });
  });

  describe('input simulation', () => {
    it('should send key events', () => {
      let received = '';
      terminal.on('data', (data) => { received = data as string; });
      terminal.sendKey({ key: 'a' });
      expect(received).toBe('a');
    });

    it('should send text', () => {
      const chars: string[] = [];
      terminal.on('data', (data) => { chars.push(data as string); });
      terminal.sendText('hi');
      expect(chars).toEqual(['h', 'i']);
    });

    it('should send special keys', () => {
      let received = '';
      terminal.on('data', (data) => { received = data as string; });
      terminal.sendKey({ key: 'escape' });
      expect(received).toBe('\x1b');
    });

    it('should send arrow keys', () => {
      let received = '';
      terminal.on('data', (data) => { received = data as string; });
      terminal.sendKey({ key: 'up' });
      expect(received).toBe('\x1b[A');
    });

    it('should handle ctrl modifier', () => {
      let received = '';
      terminal.on('data', (data) => { received = data as string; });
      terminal.sendKey({ key: 'c', ctrl: true });
      expect(received).toBe('\x03'); // Ctrl+C
    });

    it('should handle alt modifier', () => {
      let received = '';
      terminal.on('data', (data) => { received = data as string; });
      terminal.sendKey({ key: 'x', alt: true });
      expect(received).toBe('\x1bx');
    });

    it('should send mouse events when enabled', () => {
      terminal.write('\x1b[?1000h');
      let received = '';
      terminal.on('data', (data) => { received = data as string; });
      terminal.sendMouse({ x: 10, y: 5, button: 'left', action: 'press' });
      expect(received).toContain('\x1b[<');
    });

    it('should not send mouse events when disabled', () => {
      let received = '';
      terminal.on('data', (data) => { received = data as string; });
      terminal.sendMouse({ x: 10, y: 5, button: 'left', action: 'press' });
      expect(received).toBe('');
    });

    it('should send paste with bracketed mode', () => {
      terminal.write('\x1b[?2004h');
      let received = '';
      terminal.on('data', (data) => { received = data as string; });
      terminal.sendPaste('hello');
      expect(received).toContain('\x1b[200~');
      expect(received).toContain('hello');
      expect(received).toContain('\x1b[201~');
    });
  });

  describe('cell access', () => {
    it('should get cell at position', () => {
      terminal.write('X');
      const cell = terminal.getCell(0, 0);
      expect(cell).not.toBeNull();
      expect(cell!.char).toBe('X');
    });

    it('should return null for out of bounds', () => {
      const cell = terminal.getCell(100, 100);
      expect(cell).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset terminal state', () => {
      terminal.write('Hello');
      terminal.write('\x1b[?25l');
      terminal.reset();

      expect(terminal.getRow(0).trim()).toBe('');
      expect(terminal.isCursorVisible()).toBe(true);
      expect(terminal.getCursor()).toEqual({ x: 0, y: 0 });
    });
  });
});

describe('Snapshot Testing', () => {
  describe('createSnapshot', () => {
    it('should create snapshot of output', () => {
      const output = 'Hello World';
      const snapshot = createSnapshot(output);
      expect(snapshot).toBe('Hello World');
    });

    it('should strip ANSI codes when not including styles', () => {
      const output = '\x1b[31mRed\x1b[0m';
      const snapshot = createSnapshot(output, { normalize: true, includeStyles: false });
      expect(snapshot).toBe('Red');
    });

    it('should keep ANSI codes when including styles', () => {
      const output = '\x1b[31mRed\x1b[0m';
      const snapshot = createSnapshot(output, { normalize: true, includeStyles: true });
      expect(snapshot).toContain('\x1b[31m');
    });

    it('should normalize whitespace', () => {
      const output = 'Line1  \nLine2   \n';
      const snapshot = createSnapshot(output, { normalize: true });
      expect(snapshot).toBe('Line1\nLine2');
    });
  });

  describe('compareSnapshots', () => {
    it('should match identical snapshots', () => {
      const diff = compareSnapshots('Hello', 'Hello');
      expect(diff.matches).toBe(true);
      expect(diff.differences.length).toBe(0);
    });

    it('should detect differences', () => {
      const diff = compareSnapshots('Hello', 'World');
      expect(diff.matches).toBe(false);
      expect(diff.differences.length).toBe(1);
    });

    it('should report line numbers', () => {
      const diff = compareSnapshots('Line1\nLine2', 'Line1\nDifferent');
      expect(diff.differences[0]!.line).toBe(2);
    });

    it('should handle different line counts', () => {
      const diff = compareSnapshots('A\nB', 'A\nB\nC');
      expect(diff.matches).toBe(false);
      expect(diff.differences.length).toBe(1);
      expect(diff.differences[0]!.line).toBe(3);
    });
  });

  describe('formatSnapshotDiff', () => {
    it('should format matching snapshots', () => {
      const diff = compareSnapshots('Same', 'Same');
      const formatted = formatSnapshotDiff(diff);
      expect(formatted).toBe('Snapshots match');
    });

    it('should format differences', () => {
      const diff = compareSnapshots('Expected', 'Actual');
      const formatted = formatSnapshotDiff(diff);
      expect(formatted).toContain('differences');
      expect(formatted).toContain('Expected');
      expect(formatted).toContain('Actual');
    });
  });

  describe('stripAnsi', () => {
    it('should remove color codes', () => {
      expect(stripAnsi('\x1b[31mRed\x1b[0m')).toBe('Red');
    });

    it('should remove cursor codes', () => {
      expect(stripAnsi('\x1b[2JClear')).toBe('Clear');
    });

    it('should preserve plain text', () => {
      expect(stripAnsi('Plain text')).toBe('Plain text');
    });
  });
});

describe('Event Simulator', () => {
  let terminal: TerminalSimulator;
  let events: ReturnType<typeof createEventSimulator>;

  beforeEach(() => {
    terminal = new TerminalSimulator(80, 24);
    events = createEventSimulator(terminal);
  });

  it('should simulate keyPress', () => {
    let key = '';
    terminal.on('data', (data) => { key = data as string; });
    events.keyPress('a');
    expect(key).toBe('a');
  });

  it('should simulate keyPress with modifiers', () => {
    let key = '';
    terminal.on('data', (data) => { key = data as string; });
    events.keyPress('c', { ctrl: true });
    expect(key).toBe('\x03');
  });

  it('should simulate typing', async () => {
    const chars: string[] = [];
    terminal.on('data', (data) => { chars.push(data as string); });
    await events.type('hi');
    expect(chars).toEqual(['h', 'i']);
  });

  it('should simulate click', () => {
    terminal.write('\x1b[?1000h');
    const clicks: string[] = [];
    terminal.on('data', (data) => { clicks.push(data as string); });
    events.click(10, 5);
    expect(clicks.length).toBe(2); // press + release
  });

  it('should simulate doubleClick', () => {
    terminal.write('\x1b[?1000h');
    const clicks: string[] = [];
    terminal.on('data', (data) => { clicks.push(data as string); });
    events.doubleClick(10, 5);
    expect(clicks.length).toBe(4); // 2 clicks = 4 events
  });

  it('should simulate rightClick', () => {
    terminal.write('\x1b[?1000h');
    const clicks: string[] = [];
    terminal.on('data', (data) => { clicks.push(data as string); });
    events.rightClick(10, 5);
    expect(clicks.length).toBe(2);
    expect(clicks[0]).toContain('2'); // Right button
  });

  it('should simulate drag', () => {
    terminal.write('\x1b[?1000h');
    const events_data: string[] = [];
    terminal.on('data', (data) => { events_data.push(data as string); });
    events.drag(0, 0, 10, 0);
    expect(events_data.length).toBeGreaterThan(2); // press + moves + release
  });

  it('should simulate scroll', () => {
    terminal.write('\x1b[?1000h');
    const scrolls: string[] = [];
    terminal.on('data', (data) => { scrolls.push(data as string); });
    events.scroll(10, 5, 'up', 3);
    expect(scrolls.length).toBe(3);
  });

  it('should simulate paste', () => {
    terminal.write('\x1b[?2004h');
    let pasted = '';
    terminal.on('data', (data) => { pasted = data as string; });
    events.paste('pasted text');
    expect(pasted).toContain('pasted text');
  });

  it('should simulate resize', () => {
    let resized = false;
    terminal.on('resize', () => { resized = true; });
    events.resize(100, 30);
    expect(resized).toBe(true);
    expect(terminal.getSize()).toEqual({ columns: 100, rows: 30 });
  });
});

describe('Accessibility Checker', () => {
  it('should pass for accessible components', () => {
    const node = createNode('button', {
      label: 'Click me',
      focusable: true,
      tabIndex: 0,
    });

    const report = checkAccessibility(node);
    expect(report.valid).toBe(true);
    expect(report.summary.errors).toBe(0);
  });

  it('should detect missing label on button', () => {
    const node = createNode('button', {});

    const report = checkAccessibility(node);
    expect(report.valid).toBe(false);
    expect(report.issues.some((i) => i.code === 'missing-label')).toBe(true);
  });

  it('should detect missing label on input', () => {
    const node = createNode('input', {});

    const report = checkAccessibility(node);
    expect(report.issues.some((i) => i.code === 'missing-label')).toBe(true);
  });

  it('should accept aria-label', () => {
    const node = createNode('button', { 'aria-label': 'Submit form' });

    const report = checkAccessibility(node);
    expect(report.valid).toBe(true);
  });

  it('should warn about missing tabIndex on focusable', () => {
    const node = createNode('box', { focusable: true });

    const report = checkAccessibility(node);
    expect(report.issues.some((i) => i.code === 'missing-tabindex')).toBe(true);
  });

  it('should detect missing alt on image', () => {
    const node = createNode('image', { src: 'test.png' });

    const report = checkAccessibility(node);
    expect(report.issues.some((i) => i.code === 'missing-alt')).toBe(true);
  });

  it('should accept alt on image', () => {
    const node = createNode('image', { src: 'test.png', alt: 'Test image' });

    const report = checkAccessibility(node);
    expect(report.issues.filter((i) => i.code === 'missing-alt').length).toBe(0);
  });

  it('should warn about low contrast', () => {
    const node = createNode('text', {
      color: 'yellow',
      backgroundColor: 'white',
    });

    const report = checkAccessibility(node);
    expect(report.issues.some((i) => i.code === 'low-contrast')).toBe(true);
  });

  it('should warn about click without keyboard support', () => {
    const node = createNode('box', { onClick: () => {} });

    const report = checkAccessibility(node);
    expect(report.issues.some((i) => i.code === 'click-no-keyboard')).toBe(true);
  });

  it('should check children recursively', () => {
    const node = createNode('box', {}, [
      createNode('button', {}), // Missing label
      createNode('input', {}), // Missing label
    ]);

    const report = checkAccessibility(node);
    expect(report.issues.filter((i) => i.code === 'missing-label').length).toBe(2);
  });

  it('should format accessibility report', () => {
    const node = createNode('button', {});
    const report = checkAccessibility(node);
    const formatted = formatAccessibilityReport(report);

    expect(formatted).toContain('FAILED');
    expect(formatted).toContain('missing-label');
  });

  it('should format passing report', () => {
    const node = createNode('box', {});
    const report = checkAccessibility(node);
    const formatted = formatAccessibilityReport(report);

    expect(formatted).toContain('PASSED');
  });
});

describe('Test Harness', () => {
  it('should create test harness', () => {
    const harness = createTestHarness();

    expect(harness.terminal).toBeDefined();
    expect(harness.events).toBeDefined();
  });

  it('should create harness with custom size', () => {
    const harness = createTestHarness({ columns: 100, rows: 30 });

    expect(harness.terminal.getSize()).toEqual({ columns: 100, rows: 30 });
  });

  it('should enable mouse when requested', () => {
    const harness = createTestHarness({ enableMouse: true });

    expect(harness.terminal.getState().mouseEnabled).toBe(true);
  });

  it('should enable bracketed paste when requested', () => {
    const harness = createTestHarness({ enableBracketedPaste: true });

    expect(harness.terminal.getState().bracketedPaste).toBe(true);
  });

  it('should render VNode', () => {
    const harness = createTestHarness();
    const node = createNode('box', { id: 'test' });

    const result = harness.render(node);
    expect(result).toContain('box');
    expect(result).toContain('test');
  });

  it('should get screen', () => {
    const harness = createTestHarness();
    harness.terminal.write('Hello');

    const screen = harness.getScreen();
    expect(screen[0]).toContain('Hello');
  });

  it('should get screen as string', () => {
    const harness = createTestHarness();
    harness.terminal.write('Line1\nLine2');

    const str = harness.getScreenString();
    expect(str).toContain('Line1');
    expect(str).toContain('Line2');
  });

  it('should check accessibility', () => {
    const harness = createTestHarness();
    const node = createNode('button', {});

    const report = harness.checkA11y(node);
    expect(report.valid).toBe(false);
  });

  it('should create snapshots', () => {
    const harness = createTestHarness();

    const snapshot = harness.snapshot('Test output');
    expect(snapshot).toBe('Test output');
  });

  it('should compare snapshots', () => {
    const harness = createTestHarness();

    const diff = harness.compareSnapshot('Same', 'Same');
    expect(diff.matches).toBe(true);
  });

  it('should reset harness', () => {
    const harness = createTestHarness();
    harness.terminal.write('Content');
    harness.reset();

    expect(harness.terminal.getRow(0).trim()).toBe('');
  });

  it('should cleanup harness', () => {
    const harness = createTestHarness();
    harness.terminal.write('Content');
    harness.cleanup();

    expect(harness.terminal.getRow(0).trim()).toBe('');
  });
});
