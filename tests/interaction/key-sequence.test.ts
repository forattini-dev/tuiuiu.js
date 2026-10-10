import { describe, expect, it } from 'vitest';
import { formatKeyChord } from '../../src/interaction/key-sequence.js';

describe('platform shortcut labels', () => {
  it.each([
    ['darwin', 'ctrl+s', '⌘S'],
    ['darwin', 'ctrl+shift+p', '⌘⇧P'],
    ['darwin', 'alt+z', '⌥Z'],
    ['darwin', 'cmd+s', '⌘S'],
    ['win32', 'ctrl+s', 'Ctrl+S'],
    ['win32', 'ctrl+shift+p', 'Ctrl+Shift+P'],
    ['linux', 'ctrl+s', 'Ctrl+S'],
    ['linux', 'alt+z', 'Alt+Z'],
  ] as const)('formats %s %s as %s', (platform, chord, label) => {
    expect(formatKeyChord(chord, platform)).toBe(label);
  });
});
