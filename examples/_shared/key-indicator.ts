/**
 * KeyIndicator - Shows pressed keys at the bottom of the screen
 *
 * Helps viewers understand what's happening during demos.
 * Keys fade out after a few seconds.
 */

import {
  Box,
  Text,
  createSignal,
  themeColor,
} from '../../src/index.js';
import type { VNode } from '../../src/utils/types.js';
import type { Key } from '../../src/hooks/types.js';

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
const MAX_KEYS = 10; // Maximum keys to display

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

  if (key.escape) keyName = 'esc';
  else if (key.return) keyName = 'enter';
  else if (key.tab) keyName = 'tab';
  else if (key.backspace) keyName = 'backspace';
  else if (key.delete) keyName = 'delete';
  else if (key.upArrow) keyName = '↑';
  else if (key.downArrow) keyName = '↓';
  else if (key.leftArrow) keyName = '←';
  else if (key.rightArrow) keyName = '→';
  else if (key.pageUp) keyName = 'pgup';
  else if (key.pageDown) keyName = 'pgdn';
  else if (key.home) keyName = 'home';
  else if (key.end) keyName = 'end';
  else if (key.ctrl && input) keyName = `ctrl+${input}`;
  else if (key.meta && input) keyName = `cmd+${input}`;
  else if (key.shift && input) keyName = input.toUpperCase();
  else if (input === ' ') keyName = 'space';
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
// Component
// =============================================================================

interface KeyIndicatorProps {
  width?: number;
}

/**
 * KeyIndicator component - shows recent key presses
 *
 * Full-width bar at the bottom with theme-responsive colors.
 */
export function KeyIndicator({ width }: KeyIndicatorProps = {}): VNode {
  const keys = keyPresses();
  const termWidth = width ?? process.stdout.columns ?? 80;

  // Background color from theme
  const bgColor = themeColor('muted');
  const fgColor = themeColor('mutedForeground');

  if (keys.length === 0) {
    // Empty state - still show the bar for consistency
    const emptyText = ' Keys: (none) ';
    const padding = Math.max(0, termWidth - emptyText.length);

    return Box(
      {
        flexDirection: 'row',
        width: termWidth,
        backgroundColor: bgColor,
      },
      Text({ color: fgColor, dim: true }, emptyText),
      Text({ color: fgColor, backgroundColor: bgColor }, ' '.repeat(padding)),
    );
  }

  const now = Date.now();

  // Build key display string
  const keyDisplays = keys.map(({ key, timestamp }) => {
    const age = now - timestamp;
    const isFading = age > KEY_DISPLAY_TIME * 0.6;
    return { key, isFading };
  });

  // Calculate spacing
  const keysLabel = ' Keys: ';
  const keyStrings = keyDisplays.map(k => `[${k.key}]`).join(' ');
  const usedWidth = keysLabel.length + keyStrings.length + 1;
  const padding = Math.max(0, termWidth - usedWidth);

  return Box(
    {
      flexDirection: 'row',
      width: termWidth,
      backgroundColor: bgColor,
    },
    Text({ color: fgColor, dim: true }, keysLabel),
    ...keyDisplays.flatMap(({ key, isFading }, i) => [
      Text({
        color: isFading ? fgColor : themeColor('accent'),
        bold: !isFading,
        dim: isFading,
      }, `[${key}]`),
      i < keyDisplays.length - 1 ? Text({ color: fgColor }, ' ') : null,
    ]).filter(Boolean),
    Text({ color: fgColor, backgroundColor: bgColor }, ' '.repeat(padding + 1)),
  );
}

// =============================================================================
// Helper Hook
// =============================================================================

/**
 * Creates an input handler that records key presses
 *
 * Usage:
 * useInput(withKeyIndicator((input, key) => {
 *   // Your input handling logic
 * }));
 */
export function withKeyIndicator(
  handler: (input: string, key: Key) => void
): (input: string, key: Key) => void {
  return (input: string, key: Key) => {
    recordKeyPress(input, key);
    handler(input, key);
  };
}
