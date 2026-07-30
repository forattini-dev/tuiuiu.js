/**
 * KeyboardShortcutHint & HintBar Tests
 *
 * Tests for keyboard shortcut hint rendering, formatting,
 * parentheses wrapping, bold/dim options, and HintBar separator behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import { setRenderMode } from '../../src/core/capabilities.js';
import {
  KeyboardShortcutHint,
  HintBar,
} from '../../src/atoms/keyboard-shortcut-hint.js';
import type { VNode } from '../../src/utils/types.js';

const platformCtrl = process.platform === 'darwin' ? '⌘' : 'Ctrl';

describe('KeyboardShortcutHint', () => {
  beforeEach(() => {
    setRenderMode('unicode');
  });

  it('renders shortcut text', () => {
    const node = KeyboardShortcutHint({ shortcut: 'ctrl+s' });
    expect(node).not.toBeNull();
    expect(node.type).toBe('text');
    const output = renderToString(node, 40);
    expect(output).toContain(`${platformCtrl}+S`);
  });

  it('renders shortcut with action using default separator', () => {
    const node = KeyboardShortcutHint({ shortcut: 'ctrl+s', action: 'save' });
    expect(node).not.toBeNull();
    const output = renderToString(node, 40);
    expect(output).toContain(`${platformCtrl}+S`);
    expect(output).toContain('save');
  });

  it('wraps in parentheses when parens=true', () => {
    const node = KeyboardShortcutHint({
      shortcut: 'escape',
      action: 'close',
      parens: true,
    });
    expect(node).not.toBeNull();
    const output = renderToString(node, 40);
    expect(output).toContain('(');
    expect(output).toContain(')');
    expect(output).toContain('close');
  });

  it('renders bold shortcut with separate text nodes', () => {
    const node = KeyboardShortcutHint({
      shortcut: 'ctrl+s',
      action: 'save',
      bold: true,
    });
    expect(node).not.toBeNull();
    // Bold mode returns a Box with two Text children
    expect(node.type).toBe('box');
    expect(node.children.length).toBe(2);
    // First child is the bold key, second is the rest
    expect(node.children[0]!.props.bold).toBe(true);
  });

  it('renders bold shortcut without action', () => {
    const node = KeyboardShortcutHint({
      shortcut: 'enter',
      bold: true,
    });
    expect(node).not.toBeNull();
    expect(node.type).toBe('box');
    expect(node.children.length).toBe(2);
    expect(node.children[0]!.props.bold).toBe(true);
  });

  it('renders bold with parens wrapping correctly', () => {
    const node = KeyboardShortcutHint({
      shortcut: 'escape',
      action: 'close',
      bold: true,
      parens: true,
    });
    expect(node).not.toBeNull();
    expect(node.type).toBe('box');
    const output = renderToString(node, 40);
    expect(output).toContain('(');
    expect(output).toContain(')');
  });

  it('applies dim styling by default', () => {
    const node = KeyboardShortcutHint({ shortcut: 'q' });
    expect(node).not.toBeNull();
    // Default dim=true
    expect(node.props.dim).toBe(true);
  });

  it('does not apply dim when dim=false', () => {
    const node = KeyboardShortcutHint({ shortcut: 'q', dim: false });
    expect(node).not.toBeNull();
    expect(node.props.dim).toBe(false);
  });

  it('uses custom separator between shortcut and action', () => {
    const node = KeyboardShortcutHint({
      shortcut: 'ctrl+z',
      action: 'undo',
      separator: ': ',
    });
    expect(node).not.toBeNull();
    const output = renderToString(node, 40);
    expect(output).toContain(`${platformCtrl}+Z`);
    expect(output).toContain('undo');
    // Should NOT contain the default separator
    expect(output).not.toContain(' to ');
  });

  it('accepts custom color', () => {
    const node = KeyboardShortcutHint({ shortcut: 'q', color: 'red' });
    expect(node).not.toBeNull();
    expect(node.props.color).toBe('red');
  });

  it('renders without action (shortcut only)', () => {
    const node = KeyboardShortcutHint({ shortcut: 'q' });
    expect(node).not.toBeNull();
    const output = renderToString(node, 40);
    expect(output).toContain('Q');
    // Should not contain any separator text
    expect(output).not.toContain(' to ');
  });
});

describe('HintBar', () => {
  beforeEach(() => {
    setRenderMode('unicode');
  });

  it('renders multiple hints with default middot separator', () => {
    const node = HintBar({
      hints: [
        { shortcut: 'enter', action: 'select' },
        { shortcut: 'escape', action: 'cancel' },
      ],
    });
    expect(node).not.toBeNull();
    expect(node.type).toBe('box');
    // Two hints + one separator = 3 children
    expect(node.children.length).toBe(3);

    const output = renderToString(node, 60);
    expect(output).toContain('Enter');
    expect(output).toContain('select');
    expect(output).toContain('Escape');
    expect(output).toContain('cancel');
    // Middot separator
    expect(output).toContain('\u00B7');
  });

  it('renders single hint without separator', () => {
    const node = HintBar({
      hints: [{ shortcut: 'q', action: 'quit' }],
    });
    expect(node).not.toBeNull();
    // One hint, no separators
    expect(node.children.length).toBe(1);
  });

  it('renders three hints with two separators', () => {
    const node = HintBar({
      hints: [
        { shortcut: 'enter', action: 'select' },
        { shortcut: 'escape', action: 'cancel' },
        { shortcut: 'ctrl+a', action: 'select all' },
      ],
    });
    expect(node).not.toBeNull();
    // 3 hints + 2 separators = 5 children
    expect(node.children.length).toBe(5);
  });

  it('uses custom separator', () => {
    const node = HintBar({
      hints: [
        { shortcut: 'q', action: 'quit' },
        { shortcut: 'h', action: 'help' },
      ],
      separator: ' | ',
    });
    expect(node).not.toBeNull();

    const output = renderToString(node, 60);
    expect(output).toContain('|');
    // Should NOT contain the default middot
    expect(output).not.toContain('\u00B7');
  });

  it('applies separator color and dim', () => {
    const node = HintBar({
      hints: [
        { shortcut: 'enter' },
        { shortcut: 'escape' },
      ],
      separatorColor: 'red',
      separatorDim: false,
    });
    expect(node).not.toBeNull();
    // The separator Text node (index 1)
    const separatorNode = node.children[1]!;
    expect(separatorNode.props.color).toBe('red');
    expect(separatorNode.props.dim).toBe(false);
  });

  it('renders empty hints array without crashing', () => {
    const node = HintBar({ hints: [] });
    expect(node).not.toBeNull();
    expect(node.children.length).toBe(0);
  });
});
