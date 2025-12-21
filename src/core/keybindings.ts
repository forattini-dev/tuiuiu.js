/**
 * Key Binding Registry
 *
 * Centralized registry for keyboard shortcuts with context-aware resolution.
 * Supports vim/emacs modes, conflict detection, and hierarchical contexts.
 */

import { createSignal, createEffect } from '../primitives/signal.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Modifier keys
 */
export interface KeyModifiers {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean; // Cmd on Mac, Win on Windows
}

/**
 * Parsed key combination
 */
export interface KeyCombo {
  key: string; // The main key (e.g., 'k', 'Enter', 'ArrowUp')
  modifiers: KeyModifiers;
}

/**
 * Key binding definition
 */
export interface KeyBinding {
  /** Unique identifier for the binding */
  id: string;
  /** Key combination string (e.g., 'ctrl+k', 'shift+enter') */
  key: string;
  /** Parsed key combination */
  combo: KeyCombo;
  /** Action to execute */
  action: () => void | Promise<void>;
  /** Description for command palette */
  description?: string;
  /** Context where this binding is active (e.g., 'global', 'editor', component id) */
  context: string;
  /** Priority for conflict resolution (higher wins) */
  priority: number;
  /** Whether the binding is currently enabled */
  enabled: boolean;
  /** Associated command id (if registered via command system) */
  commandId?: string;
}

/**
 * Key binding registration options
 */
export interface KeyBindingOptions {
  /** Key combination string */
  key: string;
  /** Action to execute */
  action: () => void | Promise<void>;
  /** Description for command palette */
  description?: string;
  /** Context where this binding is active */
  context?: string;
  /** Priority for conflict resolution */
  priority?: number;
  /** Associated command id */
  commandId?: string;
}

/**
 * Key mode presets
 */
export type KeyMode = 'default' | 'vim' | 'emacs';

/**
 * Conflict information
 */
export interface KeyConflict {
  key: string;
  context: string;
  bindings: KeyBinding[];
}

// ============================================================================
// Key Parsing
// ============================================================================

/**
 * Normalize key names to consistent format
 */
function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    'esc': 'Escape',
    'escape': 'Escape',
    'enter': 'Enter',
    'return': 'Enter',
    'space': ' ',
    'spacebar': ' ',
    'up': 'ArrowUp',
    'down': 'ArrowDown',
    'left': 'ArrowLeft',
    'right': 'ArrowRight',
    'tab': 'Tab',
    'backspace': 'Backspace',
    'delete': 'Delete',
    'del': 'Delete',
    'home': 'Home',
    'end': 'End',
    'pageup': 'PageUp',
    'pagedown': 'PageDown',
    'insert': 'Insert',
    'ins': 'Insert',
  };

  const lower = key.toLowerCase();
  return keyMap[lower] || key;
}

/**
 * Parse a key combination string into a KeyCombo
 * Examples: 'ctrl+k', 'shift+enter', 'alt+shift+a', 'cmd+s'
 */
export function parseKeyCombo(keyString: string): KeyCombo {
  const parts = keyString.toLowerCase().split('+').map(p => p.trim());
  const modifiers: KeyModifiers = {};
  let mainKey = '';

  for (const part of parts) {
    switch (part) {
      case 'ctrl':
      case 'control':
        modifiers.ctrl = true;
        break;
      case 'alt':
      case 'option':
        modifiers.alt = true;
        break;
      case 'shift':
        modifiers.shift = true;
        break;
      case 'meta':
      case 'cmd':
      case 'command':
      case 'win':
      case 'windows':
        modifiers.meta = true;
        break;
      default:
        mainKey = normalizeKey(part);
    }
  }

  return { key: mainKey, modifiers };
}

/**
 * Convert a KeyCombo back to string representation
 */
export function keyComboToString(combo: KeyCombo): string {
  const parts: string[] = [];
  if (combo.modifiers.ctrl) parts.push('ctrl');
  if (combo.modifiers.alt) parts.push('alt');
  if (combo.modifiers.shift) parts.push('shift');
  if (combo.modifiers.meta) parts.push('meta');
  parts.push(combo.key.toLowerCase());
  return parts.join('+');
}

/**
 * Check if two key combos match
 */
export function keyComboEquals(a: KeyCombo, b: KeyCombo): boolean {
  return (
    a.key.toLowerCase() === b.key.toLowerCase() &&
    !!a.modifiers.ctrl === !!b.modifiers.ctrl &&
    !!a.modifiers.alt === !!b.modifiers.alt &&
    !!a.modifiers.shift === !!b.modifiers.shift &&
    !!a.modifiers.meta === !!b.modifiers.meta
  );
}

/**
 * Create KeyCombo from keyboard event data
 */
export function keyComboFromEvent(
  key: string,
  modifiers: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean }
): KeyCombo {
  return {
    key: normalizeKey(key),
    modifiers: {
      ctrl: !!modifiers.ctrl,
      alt: !!modifiers.alt,
      shift: !!modifiers.shift,
      meta: !!modifiers.meta,
    },
  };
}

// ============================================================================
// Key Binding Registry
// ============================================================================

/**
 * Global binding ID counter
 */
let bindingIdCounter = 0;

/**
 * Reset binding ID counter (for testing)
 */
export function resetBindingIdCounter(): void {
  bindingIdCounter = 0;
}

/**
 * Key Binding Registry
 *
 * Manages all keyboard shortcuts with context-aware resolution.
 */
export class KeyBindingRegistry {
  private bindings: Map<string, KeyBinding> = new Map();
  private contextStack: string[] = ['global'];
  private mode: KeyMode = 'default';
  private modeBindings: Map<KeyMode, KeyBinding[]> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initModePresets();
  }

  /**
   * Initialize mode presets (vim, emacs)
   */
  private initModePresets(): void {
    // Vim mode bindings will be added when mode is activated
    this.modeBindings.set('vim', []);
    this.modeBindings.set('emacs', []);
  }

  /**
   * Register a key binding
   */
  register(options: KeyBindingOptions): string {
    const id = `binding_${++bindingIdCounter}`;
    const combo = parseKeyCombo(options.key);

    const binding: KeyBinding = {
      id,
      key: options.key,
      combo,
      action: options.action,
      description: options.description,
      context: options.context || 'global',
      priority: options.priority ?? 0,
      enabled: true,
      commandId: options.commandId,
    };

    // Check for conflicts in dev mode
    if (process.env.NODE_ENV !== 'production') {
      const conflicts = this.findConflicts(binding);
      if (conflicts.length > 0) {
        console.warn(
          `[KeyBindings] Conflict detected for "${options.key}" in context "${binding.context}":`,
          conflicts.map(b => b.id)
        );
      }
    }

    this.bindings.set(id, binding);
    this.notifyListeners();
    return id;
  }

  /**
   * Unregister a key binding
   */
  unregister(id: string): boolean {
    const result = this.bindings.delete(id);
    if (result) {
      this.notifyListeners();
    }
    return result;
  }

  /**
   * Enable/disable a binding
   */
  setEnabled(id: string, enabled: boolean): void {
    const binding = this.bindings.get(id);
    if (binding) {
      binding.enabled = enabled;
      this.notifyListeners();
    }
  }

  /**
   * Get a binding by ID
   */
  get(id: string): KeyBinding | undefined {
    return this.bindings.get(id);
  }

  /**
   * Get all bindings
   */
  getAll(): KeyBinding[] {
    return Array.from(this.bindings.values());
  }

  /**
   * Get bindings for a specific context
   */
  getByContext(context: string): KeyBinding[] {
    return this.getAll().filter(b => b.context === context && b.enabled);
  }

  /**
   * Find bindings that conflict with a new binding
   */
  findConflicts(binding: KeyBinding): KeyBinding[] {
    return this.getAll().filter(
      b =>
        b.id !== binding.id &&
        b.context === binding.context &&
        b.enabled &&
        keyComboEquals(b.combo, binding.combo)
    );
  }

  /**
   * Get all conflicts in the registry
   */
  getAllConflicts(): KeyConflict[] {
    const conflicts: Map<string, KeyBinding[]> = new Map();

    for (const binding of this.getAll()) {
      if (!binding.enabled) continue;

      const key = `${binding.context}:${keyComboToString(binding.combo)}`;
      const existing = conflicts.get(key) || [];
      existing.push(binding);
      conflicts.set(key, existing);
    }

    const result: KeyConflict[] = [];
    for (const [key, bindings] of conflicts) {
      if (bindings.length > 1) {
        const [context, keyStr] = key.split(':');
        result.push({ key: keyStr, context, bindings });
      }
    }

    return result;
  }

  /**
   * Push a context onto the stack
   */
  pushContext(context: string): void {
    this.contextStack.push(context);
  }

  /**
   * Pop a context from the stack
   */
  popContext(): string | undefined {
    if (this.contextStack.length > 1) {
      return this.contextStack.pop();
    }
    return undefined;
  }

  /**
   * Get the current context stack
   */
  getContextStack(): string[] {
    return [...this.contextStack];
  }

  /**
   * Get the current (top) context
   */
  getCurrentContext(): string {
    return this.contextStack[this.contextStack.length - 1];
  }

  /**
   * Resolve which binding should handle a key combo
   * Returns the highest priority binding in the most specific context
   */
  resolve(combo: KeyCombo): KeyBinding | null {
    const candidates: KeyBinding[] = [];

    // Collect all matching bindings from current context stack
    for (const context of this.contextStack) {
      for (const binding of this.getByContext(context)) {
        if (keyComboEquals(binding.combo, combo)) {
          candidates.push(binding);
        }
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    // Sort by context specificity (later in stack = more specific) and priority
    candidates.sort((a, b) => {
      const aContextIndex = this.contextStack.indexOf(a.context);
      const bContextIndex = this.contextStack.indexOf(b.context);

      // More specific context wins
      if (aContextIndex !== bContextIndex) {
        return bContextIndex - aContextIndex;
      }

      // Higher priority wins
      return b.priority - a.priority;
    });

    return candidates[0];
  }

  /**
   * Handle a key event
   * Returns true if the event was handled
   */
  async handle(
    key: string,
    modifiers: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean }
  ): Promise<boolean> {
    const combo = keyComboFromEvent(key, modifiers);
    const binding = this.resolve(combo);

    if (binding) {
      await binding.action();
      return true;
    }

    return false;
  }

  /**
   * Set the key mode
   */
  setMode(mode: KeyMode): void {
    if (mode === this.mode) return;

    // Disable current mode bindings
    const currentModeBindings = this.modeBindings.get(this.mode);
    if (currentModeBindings) {
      for (const binding of currentModeBindings) {
        this.unregister(binding.id);
      }
    }

    this.mode = mode;

    // Enable new mode bindings
    if (mode === 'vim') {
      this.enableVimMode();
    } else if (mode === 'emacs') {
      this.enableEmacsMode();
    }

    this.notifyListeners();
  }

  /**
   * Get current key mode
   */
  getMode(): KeyMode {
    return this.mode;
  }

  /**
   * Enable vim mode bindings
   */
  private enableVimMode(): void {
    const vimBindings: KeyBindingOptions[] = [
      { key: 'j', action: () => {}, description: 'Move down', context: 'vim-nav' },
      { key: 'k', action: () => {}, description: 'Move up', context: 'vim-nav' },
      { key: 'h', action: () => {}, description: 'Move left', context: 'vim-nav' },
      { key: 'l', action: () => {}, description: 'Move right', context: 'vim-nav' },
      { key: 'g', action: () => {}, description: 'Go to first (gg)', context: 'vim-nav' },
      { key: 'shift+g', action: () => {}, description: 'Go to last', context: 'vim-nav' },
      { key: '/', action: () => {}, description: 'Search', context: 'vim-nav' },
      { key: 'n', action: () => {}, description: 'Next match', context: 'vim-nav' },
      { key: 'shift+n', action: () => {}, description: 'Previous match', context: 'vim-nav' },
    ];

    const registeredBindings: KeyBinding[] = [];
    for (const options of vimBindings) {
      const id = this.register(options);
      const binding = this.get(id);
      if (binding) {
        registeredBindings.push(binding);
      }
    }

    this.modeBindings.set('vim', registeredBindings);
  }

  /**
   * Enable emacs mode bindings
   */
  private enableEmacsMode(): void {
    const emacsBindings: KeyBindingOptions[] = [
      { key: 'ctrl+n', action: () => {}, description: 'Move down', context: 'emacs-nav' },
      { key: 'ctrl+p', action: () => {}, description: 'Move up', context: 'emacs-nav' },
      { key: 'ctrl+b', action: () => {}, description: 'Move left', context: 'emacs-nav' },
      { key: 'ctrl+f', action: () => {}, description: 'Move right', context: 'emacs-nav' },
      { key: 'ctrl+a', action: () => {}, description: 'Start of line', context: 'emacs-nav' },
      { key: 'ctrl+e', action: () => {}, description: 'End of line', context: 'emacs-nav' },
      { key: 'ctrl+s', action: () => {}, description: 'Search forward', context: 'emacs-nav' },
      { key: 'ctrl+r', action: () => {}, description: 'Search backward', context: 'emacs-nav' },
      { key: 'alt+<', action: () => {}, description: 'Go to start', context: 'emacs-nav' },
      { key: 'alt+>', action: () => {}, description: 'Go to end', context: 'emacs-nav' },
    ];

    const registeredBindings: KeyBinding[] = [];
    for (const options of emacsBindings) {
      const id = this.register(options);
      const binding = this.get(id);
      if (binding) {
        registeredBindings.push(binding);
      }
    }

    this.modeBindings.set('emacs', registeredBindings);
  }

  /**
   * Subscribe to registry changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Clear all bindings
   */
  clear(): void {
    this.bindings.clear();
    this.contextStack = ['global'];
    this.mode = 'default';
    this.notifyListeners();
  }
}

// ============================================================================
// Global Registry
// ============================================================================

let globalRegistry: KeyBindingRegistry | null = null;

/**
 * Get the global key binding registry
 */
export function getKeyBindingRegistry(): KeyBindingRegistry {
  if (!globalRegistry) {
    globalRegistry = new KeyBindingRegistry();
  }
  return globalRegistry;
}

/**
 * Reset the global registry (for testing)
 */
export function resetKeyBindingRegistry(): void {
  globalRegistry = null;
  resetBindingIdCounter();
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Register a global key binding
 */
export function registerKeybinding(options: KeyBindingOptions): string {
  return getKeyBindingRegistry().register(options);
}

/**
 * Unregister a key binding
 */
export function unregisterKeybinding(id: string): boolean {
  return getKeyBindingRegistry().unregister(id);
}

/**
 * Set the key mode (vim, emacs, default)
 */
export function setKeyMode(mode: KeyMode): void {
  getKeyBindingRegistry().setMode(mode);
}

/**
 * Get the current key mode
 */
export function getKeyMode(): KeyMode {
  return getKeyBindingRegistry().getMode();
}

/**
 * Handle a key event through the global registry
 */
export async function handleKeyEvent(
  key: string,
  modifiers: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean }
): Promise<boolean> {
  return getKeyBindingRegistry().handle(key, modifiers);
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for using key bindings in components
 */
export function useKeyBindings(
  bindings: KeyBindingOptions[],
  context?: string
): { cleanup: () => void } {
  const registry = getKeyBindingRegistry();
  const ids: string[] = [];

  // Push context if provided
  if (context) {
    registry.pushContext(context);
  }

  // Register all bindings
  for (const options of bindings) {
    const id = registry.register({
      ...options,
      context: context || options.context || registry.getCurrentContext(),
    });
    ids.push(id);
  }

  // Return cleanup function
  const cleanup = () => {
    for (const id of ids) {
      registry.unregister(id);
    }
    if (context) {
      registry.popContext();
    }
  };

  return { cleanup };
}

/**
 * Format key combo for display (e.g., "Ctrl+K")
 */
export function formatKeyCombo(combo: KeyCombo): string {
  const parts: string[] = [];

  if (combo.modifiers.ctrl) parts.push('Ctrl');
  if (combo.modifiers.meta) parts.push('Cmd');
  if (combo.modifiers.alt) parts.push('Alt');
  if (combo.modifiers.shift) parts.push('Shift');

  // Capitalize single letter keys
  let key = combo.key;
  if (key.length === 1) {
    key = key.toUpperCase();
  }
  parts.push(key);

  return parts.join('+');
}

/**
 * Format key string for display
 */
export function formatKeyString(keyString: string): string {
  return formatKeyCombo(parseKeyCombo(keyString));
}
