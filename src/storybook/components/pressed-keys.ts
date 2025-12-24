/**
 * PressedKeysIndicator Component
 *
 * Shows recent key presses for visual feedback.
 * Helps users understand keyboard interactions.
 */

import { Box, Text } from '../../primitives/nodes.js';
import { createSignal } from '../../primitives/signal.js';
import { getTheme } from '../../core/theme.js';
import type { VNode } from '../../utils/types.js';
import type { Key } from '../../hooks/types.js';

// =============================================================================
// Types
// =============================================================================

interface KeyPress {
  key: string;
  timestamp: number;
}

// =============================================================================
// State
// =============================================================================

const [keyPresses, setKeyPresses] = createSignal<KeyPress[]>([]);
const KEY_DISPLAY_TIME = 3000; // Show keys for 3 seconds
const MAX_KEYS = 8; // Maximum keys to display

// =============================================================================
// Key Recording
// =============================================================================

/**
 * Record a key press to be displayed
 */
export function recordKeyPress(input: string, key: Key): void {
  const now = Date.now();

  // Determine display name for the key
  let keyName = '';

  if (key.escape) keyName = 'Esc';
  else if (key.return) keyName = 'Enter';
  else if (key.tab) keyName = 'Tab';
  else if (key.backspace) keyName = 'Bksp';
  else if (key.delete) keyName = 'Del';
  else if (key.upArrow) keyName = '↑';
  else if (key.downArrow) keyName = '↓';
  else if (key.leftArrow) keyName = '←';
  else if (key.rightArrow) keyName = '→';
  else if (key.pageUp) keyName = 'PgUp';
  else if (key.pageDown) keyName = 'PgDn';
  else if (key.home) keyName = 'Home';
  else if (key.end) keyName = 'End';
  else if (key.f1) keyName = 'F1';
  else if (key.f2) keyName = 'F2';
  else if (key.f3) keyName = 'F3';
  else if (key.f4) keyName = 'F4';
  else if (key.f5) keyName = 'F5';
  else if (key.f6) keyName = 'F6';
  else if (key.f7) keyName = 'F7';
  else if (key.f8) keyName = 'F8';
  else if (key.f9) keyName = 'F9';
  else if (key.f10) keyName = 'F10';
  else if (key.f11) keyName = 'F11';
  else if (key.f12) keyName = 'F12';
  else if (key.ctrl && input) keyName = `C-${input}`;
  else if (key.meta && input) keyName = `M-${input}`;
  else if (key.shift && input) keyName = input.toUpperCase();
  else if (input === ' ') keyName = 'Spc';
  else if (input) keyName = input;

  if (!keyName) return;

  setKeyPresses(prev => {
    // Remove old keys
    const filtered = prev.filter(k => now - k.timestamp < KEY_DISPLAY_TIME);
    // Add new key
    const updated = [...filtered, { key: keyName, timestamp: now }];
    // Keep only last MAX_KEYS
    return updated.slice(-MAX_KEYS);
  });
}

/**
 * Clear old key presses (call this periodically)
 */
export function clearOldKeyPresses(): void {
  const now = Date.now();
  setKeyPresses(prev => prev.filter(k => now - k.timestamp < KEY_DISPLAY_TIME));
}

/**
 * Reset all key presses
 */
export function resetKeyPresses(): void {
  setKeyPresses([]);
}

// =============================================================================
// Hook Helper
// =============================================================================

/**
 * Creates an input handler that records key presses
 */
export function withKeyRecording(
  handler: (input: string, key: Key) => void
): (input: string, key: Key) => void {
  return (input: string, key: Key) => {
    recordKeyPress(input, key);
    handler(input, key);
  };
}

// =============================================================================
// Component
// =============================================================================

/**
 * PressedKeysIndicator - shows recent key presses
 */
export function PressedKeysIndicator(): VNode {
  const theme = getTheme();
  const keys = keyPresses();
  const now = Date.now();

  return Box(
    {
      flexDirection: 'row',
      width: '100%',
      height: 1,
      paddingX: 1,
      backgroundColor: theme.background.base,
    },
    Text({ color: theme.foreground.muted, dim: true }, 'Keys: '),

    keys.length === 0
      ? Text({ color: theme.foreground.muted, dim: true }, '(none)')
      : Box(
          { flexDirection: 'row', gap: 1 },
          ...keys.map(({ key, timestamp }) => {
            const age = now - timestamp;
            const isFading = age > KEY_DISPLAY_TIME * 0.6;

            return Text(
              {
                color: isFading ? theme.foreground.muted : theme.accents.highlight,
                bold: !isFading,
                dim: isFading,
              },
              `[${key}]`,
            );
          }),
        ),
  );
}
