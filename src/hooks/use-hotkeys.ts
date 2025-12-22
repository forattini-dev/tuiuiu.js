/**
 * Hotkey System for Tuiuiu
 *
 * Provides keyboard shortcut handling for terminal applications.
 * Inspired by hotkeys-js but adapted for terminal raw input.
 *
 * ## Quick Start
 *
 * ```typescript
 * import { useHotkeys } from 'tuiuiu';
 *
 * function MyComponent() {
 *   // Simple hotkey
 *   useHotkeys('ctrl+s', () => save());
 *
 *   // Multiple bindings (cross-platform)
 *   useHotkeys(['ctrl+z', 'cmd+z'], () => undo());
 *
 *   // With scope (only active when scope matches)
 *   useHotkeys('escape', () => closeModal(), { scope: 'modal' });
 *
 *   return Box({}, Text({}, 'Press Ctrl+S to save'));
 * }
 * ```
 *
 * ## Standalone Registration (outside components)
 *
 * ```typescript
 * import { registerHotkey, setHotkeyScope } from 'tuiuiu';
 *
 * // Register global hotkeys
 * const unregister = registerHotkey('ctrl+q', () => process.exit(0), {
 *   description: 'Quit application',
 *   scope: 'global',
 * });
 *
 * // Change scope to enable/disable groups of hotkeys
 * setHotkeyScope('modal'); // Only 'modal' and 'global' hotkeys work
 * setHotkeyScope('global'); // Back to default
 *
 * // Cleanup
 * unregister();
 * ```
 *
 * ## Display Registered Hotkeys
 *
 * ```typescript
 * import { getRegisteredHotkeys, formatHotkeyPlatform } from 'tuiuiu';
 *
 * // Get all registered hotkeys for help screen
 * const hotkeys = getRegisteredHotkeys();
 * hotkeys.forEach(h => console.log(`${h.keys}: ${h.description}`));
 *
 * // Format for display (shows ⌘ on Mac, Ctrl on others)
 * formatHotkeyPlatform('ctrl+s'); // "⌘S" on Mac, "Ctrl+S" on Linux/Windows
 * ```
 *
 * ## Supported Keys
 *
 * **Modifiers:** ctrl, alt, shift, meta, cmd, command, option
 *
 * **Special Keys:** enter, return, escape, esc, tab, space, backspace, delete, del
 *
 * **Navigation:** up, down, left, right, home, end, pageup, pagedown, pgup, pgdn
 *
 * **Function Keys:** f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12
 *
 * **Letters & Numbers:** a-z, 0-9
 */

import { createSignal } from '../core/signal.js';
import { useInput } from './use-input.js';
import type { Key } from './types.js';

// =============================================================================
// Types
// =============================================================================

export interface HotkeyBinding {
  key: string; // normalized key name (lowercase)
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

export interface HotkeyOptions {
  /** Scope for this hotkey (default: 'global') */
  scope?: string;
  /** Only trigger when input is not focused (default: true) */
  excludeInput?: boolean;
  /** Description for help/display */
  description?: string;
}

export type HotkeyHandler = () => void;

// =============================================================================
// Key Aliases
// =============================================================================

const KEY_ALIASES: Record<string, string> = {
  // Arrow keys
  up: 'upArrow',
  down: 'downArrow',
  left: 'leftArrow',
  right: 'rightArrow',
  arrowup: 'upArrow',
  arrowdown: 'downArrow',
  arrowleft: 'leftArrow',
  arrowright: 'rightArrow',

  // Special keys
  esc: 'escape',
  return: 'enter',
  space: ' ',
  del: 'delete',
  ins: 'insert',
  pgup: 'pageUp',
  pgdn: 'pageDown',
  pageup: 'pageUp',
  pagedown: 'pageDown',

  // Modifier aliases
  command: 'meta',
  cmd: 'meta',
  option: 'alt',
  control: 'ctrl',
};

// =============================================================================
// Parser
// =============================================================================

/**
 * Parse a hotkey string like 'ctrl+shift+s' into a binding object
 */
export function parseHotkey(hotkeyStr: string): HotkeyBinding {
  const parts = hotkeyStr.toLowerCase().split('+').map(p => p.trim());

  const binding: HotkeyBinding = {
    key: '',
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
  };

  for (const part of parts) {
    // Check for modifiers
    if (part === 'ctrl' || part === 'control') {
      binding.ctrl = true;
    } else if (part === 'alt' || part === 'option') {
      binding.alt = true;
    } else if (part === 'shift') {
      binding.shift = true;
    } else if (part === 'meta' || part === 'cmd' || part === 'command') {
      binding.meta = true;
    } else {
      // It's a key - normalize via aliases
      binding.key = KEY_ALIASES[part] || part;
    }
  }

  return binding;
}

/**
 * Parse multiple hotkey strings (comma or array)
 */
export function parseHotkeys(hotkeys: string | string[]): HotkeyBinding[] {
  if (Array.isArray(hotkeys)) {
    return hotkeys.map(parseHotkey);
  }
  // Split by comma for multiple bindings
  return hotkeys.split(',').map(h => parseHotkey(h.trim()));
}

// =============================================================================
// Matcher
// =============================================================================

/**
 * Check if a terminal key event matches a hotkey binding
 */
export function matchesHotkey(
  input: string,
  key: Key,
  binding: HotkeyBinding
): boolean {
  // Check modifiers
  if (binding.ctrl !== (key.ctrl ?? false)) return false;
  if (binding.alt !== (key.meta ?? false)) return false; // Terminal alt comes as meta
  if (binding.shift !== (key.shift ?? false)) return false;
  // Note: meta key in terminal is complex, often alt+escape sequence

  // Check key
  const normalizedInput = input.toLowerCase();
  const bindingKey = binding.key;

  // Special key checks
  if (bindingKey === 'upArrow') return key.upArrow ?? false;
  if (bindingKey === 'downArrow') return key.downArrow ?? false;
  if (bindingKey === 'leftArrow') return key.leftArrow ?? false;
  if (bindingKey === 'rightArrow') return key.rightArrow ?? false;
  if (bindingKey === 'escape') return key.escape ?? false;
  if (bindingKey === 'enter' || bindingKey === 'return') return key.return ?? false;
  if (bindingKey === 'tab') return key.tab ?? false;
  if (bindingKey === 'backspace') return key.backspace ?? false;
  if (bindingKey === 'delete') return key.delete ?? false;
  if (bindingKey === 'pageUp') return key.pageUp ?? false;
  if (bindingKey === 'pageDown') return key.pageDown ?? false;
  if (bindingKey === 'home') return key.home ?? false;
  if (bindingKey === 'end') return key.end ?? false;
  if (bindingKey === 'insert') return key.insert ?? false;

  // F-keys (f1 through f12)
  if (bindingKey.startsWith('f') && /^f\d{1,2}$/.test(bindingKey)) {
    const fNum = parseInt(bindingKey.slice(1), 10);
    const fKey = `f${fNum}` as keyof Key;
    return (key[fKey] as boolean | undefined) === true;
  }

  // Regular character match
  // For ctrl+letter, input is often a control character
  if (binding.ctrl && bindingKey.length === 1) {
    // Ctrl+A is \x01, Ctrl+B is \x02, etc.
    const expectedCode = bindingKey.charCodeAt(0) - 96; // 'a' -> 1, 'b' -> 2
    if (expectedCode > 0 && expectedCode < 27) {
      return input.charCodeAt(0) === expectedCode;
    }
  }

  // Direct character match
  return normalizedInput === bindingKey;
}

// =============================================================================
// Scope Management
// =============================================================================

const [currentScope, setCurrentScope] = createSignal<string>('global');

/**
 * Get the current active scope
 */
export function getHotkeyScope(): string {
  return currentScope();
}

/**
 * Set the current active scope
 */
export function setHotkeyScope(scope: string): void {
  setCurrentScope(scope);
}

/**
 * Reset scope to global
 */
export function resetHotkeyScope(): void {
  setCurrentScope('global');
}

// =============================================================================
// Registry
// =============================================================================

interface RegisteredHotkey {
  bindings: HotkeyBinding[];
  handler: HotkeyHandler;
  options: HotkeyOptions;
}

const hotkeyRegistry: RegisteredHotkey[] = [];

/**
 * Register a hotkey handler
 */
export function registerHotkey(
  hotkeys: string | string[],
  handler: HotkeyHandler,
  options: HotkeyOptions = {}
): () => void {
  const bindings = parseHotkeys(hotkeys);
  const entry: RegisteredHotkey = {
    bindings,
    handler,
    options: {
      scope: 'global',
      excludeInput: true,
      ...options,
    },
  };

  hotkeyRegistry.push(entry);

  // Return unregister function
  return () => {
    const index = hotkeyRegistry.indexOf(entry);
    if (index > -1) {
      hotkeyRegistry.splice(index, 1);
    }
  };
}

/**
 * Check if a key event matches any registered hotkey and trigger it
 */
export function triggerHotkey(input: string, key: Key): boolean {
  const scope = currentScope();

  for (const entry of hotkeyRegistry) {
    // Check scope
    const entryScope = entry.options.scope || 'global';
    if (entryScope !== 'global' && entryScope !== scope) {
      continue;
    }

    // Check bindings
    for (const binding of entry.bindings) {
      if (matchesHotkey(input, key, binding)) {
        entry.handler();
        return true; // Hotkey was handled
      }
    }
  }

  return false;
}

/**
 * Get all registered hotkeys for help display
 */
export function getRegisteredHotkeys(): Array<{
  keys: string;
  description: string;
  scope: string;
}> {
  return hotkeyRegistry.map(entry => ({
    keys: entry.bindings
      .map(b => {
        const parts: string[] = [];
        if (b.ctrl) parts.push('Ctrl');
        if (b.alt) parts.push('Alt');
        if (b.shift) parts.push('Shift');
        if (b.meta) parts.push('Cmd');
        parts.push(b.key.charAt(0).toUpperCase() + b.key.slice(1));
        return parts.join('+');
      })
      .join(', '),
    description: entry.options.description || '',
    scope: entry.options.scope || 'global',
  }));
}

// =============================================================================
// Hook
// =============================================================================

/**
 * useHotkeys hook - register keyboard shortcuts in a component
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   useHotkeys('ctrl+s', () => save(), { description: 'Save file' });
 *   useHotkeys(['ctrl+z', 'cmd+z'], () => undo());
 *   useHotkeys('escape', () => close(), { scope: 'modal' });
 *   // ...
 * }
 * ```
 */
export function useHotkeys(
  hotkeys: string | string[],
  handler: HotkeyHandler,
  options: HotkeyOptions = {}
): void {
  // Parse the hotkey bindings
  const bindings = parseHotkeys(hotkeys);
  const scope = options.scope || 'global';

  // Use the input hook to listen for key events
  useInput((input, key) => {
    // Check scope
    const activeScope = currentScope();
    if (scope !== 'global' && scope !== activeScope) {
      return;
    }

    // Check each binding
    for (const binding of bindings) {
      if (matchesHotkey(input, key, binding)) {
        handler();
        return;
      }
    }
  });
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format a hotkey for display (e.g., "Ctrl+S")
 */
export function formatHotkey(hotkeyStr: string): string {
  const binding = parseHotkey(hotkeyStr);
  const parts: string[] = [];

  if (binding.ctrl) parts.push('Ctrl');
  if (binding.alt) parts.push('Alt');
  if (binding.shift) parts.push('Shift');
  if (binding.meta) parts.push('Cmd');

  // Capitalize the key
  const keyName =
    binding.key.length === 1
      ? binding.key.toUpperCase()
      : binding.key.charAt(0).toUpperCase() + binding.key.slice(1);
  parts.push(keyName);

  return parts.join('+');
}

/**
 * Check if running on macOS (for displaying Cmd vs Ctrl)
 */
export function isMac(): boolean {
  return process.platform === 'darwin';
}

/**
 * Format hotkey with platform-aware modifier (Cmd on Mac, Ctrl otherwise)
 */
export function formatHotkeyPlatform(hotkeyStr: string): string {
  const formatted = formatHotkey(hotkeyStr);
  if (isMac()) {
    return formatted.replace('Ctrl', '⌘').replace('Alt', '⌥').replace('Shift', '⇧');
  }
  return formatted;
}
