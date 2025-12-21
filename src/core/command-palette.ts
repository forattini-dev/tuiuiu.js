/**
 * Command Palette System
 *
 * Provides a fuzzy-searchable command palette for discovering and executing actions.
 * Inspired by VS Code, Textual, and other modern editor command palettes.
 */

import { createSignal } from '../primitives/signal.js';
import {
  getKeyBindingRegistry,
  parseKeyCombo,
  formatKeyString,
  type KeyBindingOptions,
} from './keybindings.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Command definition
 */
export interface Command {
  /** Unique identifier for the command */
  id: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Category for grouping */
  category?: string;
  /** Keyboard shortcut string (e.g., 'ctrl+k') */
  keybinding?: string;
  /** Action to execute */
  action: () => void | Promise<void>;
  /** Whether the command is currently enabled */
  enabled?: boolean;
  /** Icon character or emoji */
  icon?: string;
  /** Tags for additional search matching */
  tags?: string[];
  /** When true, don't add to recent commands */
  hideFromRecent?: boolean;
}

/**
 * Command registration options (partial command)
 */
export type CommandOptions = Omit<Command, 'id'> & { id?: string };

/**
 * Fuzzy match result
 */
export interface FuzzyMatch {
  command: Command;
  score: number;
  matches: number[]; // Indices of matching characters in the label
}

/**
 * Command palette state
 */
export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  results: FuzzyMatch[];
  selectedIndex: number;
  isLoading: boolean;
}

/**
 * Command palette options
 */
export interface CommandPaletteOptions {
  /** Maximum number of results to show */
  maxResults?: number;
  /** Maximum number of recent commands to track */
  maxRecent?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show categories */
  showCategories?: boolean;
  /** Whether to show keybindings */
  showKeybindings?: boolean;
  /** Whether to show descriptions */
  showDescriptions?: boolean;
  /** Custom key to open the palette (default: 'ctrl+k') */
  openKey?: string;
}

// ============================================================================
// Fuzzy Search Algorithm
// ============================================================================

/**
 * Score bonuses for different match types
 */
const SCORE_CONSECUTIVE = 15; // Bonus for consecutive matches
const SCORE_WORD_START = 10; // Bonus for matching at word start
const SCORE_FIRST_CHAR = 8; // Bonus for matching first character
const SCORE_SEPARATOR = 5; // Bonus for matching after separator
const SCORE_CASE_MATCH = 1; // Bonus for case-sensitive match
const PENALTY_DISTANCE = 1; // Penalty per character of gap

/**
 * Characters that indicate word boundaries
 */
const WORD_SEPARATORS = new Set([' ', '-', '_', '.', '/', ':', '\\']);

/**
 * Perform fuzzy matching on a string
 * Returns null if no match, or a score and match positions
 */
export function fuzzyMatch(pattern: string, text: string): FuzzyMatch | null {
  if (!pattern) {
    return { command: null as any, score: 0, matches: [] };
  }

  const patternLower = pattern.toLowerCase();
  const textLower = text.toLowerCase();

  // Quick check: all pattern chars must exist in text
  let patternIdx = 0;
  for (let i = 0; i < textLower.length && patternIdx < patternLower.length; i++) {
    if (textLower[i] === patternLower[patternIdx]) {
      patternIdx++;
    }
  }
  if (patternIdx !== patternLower.length) {
    return null;
  }

  // Find best match positions using dynamic programming
  const matches: number[] = [];
  let score = 0;
  let prevMatchIdx = -1;
  patternIdx = 0;

  for (let i = 0; i < text.length && patternIdx < pattern.length; i++) {
    if (textLower[i] === patternLower[patternIdx]) {
      matches.push(i);

      // Base score for match
      score += 1;

      // Consecutive match bonus
      if (prevMatchIdx === i - 1) {
        score += SCORE_CONSECUTIVE;
      } else if (prevMatchIdx >= 0) {
        // Gap penalty
        score -= (i - prevMatchIdx - 1) * PENALTY_DISTANCE;
      }

      // First character bonus
      if (i === 0) {
        score += SCORE_FIRST_CHAR;
      }

      // Word start bonus
      if (i > 0 && WORD_SEPARATORS.has(text[i - 1])) {
        score += SCORE_WORD_START;
      }

      // Separator match bonus
      if (WORD_SEPARATORS.has(text[i])) {
        score += SCORE_SEPARATOR;
      }

      // Case match bonus
      if (pattern[patternIdx] === text[i]) {
        score += SCORE_CASE_MATCH;
      }

      prevMatchIdx = i;
      patternIdx++;
    }
  }

  // Bonus for shorter strings (more focused match)
  score += Math.max(0, 50 - text.length);

  return { command: null as any, score, matches };
}

/**
 * Search commands with fuzzy matching
 */
export function searchCommands(
  commands: Command[],
  query: string,
  maxResults: number = 50
): FuzzyMatch[] {
  if (!query.trim()) {
    // Return all enabled commands sorted by label when no query
    return commands
      .filter(cmd => cmd.enabled !== false)
      .slice(0, maxResults)
      .map(cmd => ({ command: cmd, score: 0, matches: [] }));
  }

  const results: FuzzyMatch[] = [];

  for (const command of commands) {
    if (command.enabled === false) continue;

    // Try matching label
    let match = fuzzyMatch(query, command.label);
    if (match) {
      match.command = command;
      results.push(match);
      continue;
    }

    // Try matching category + label
    if (command.category) {
      match = fuzzyMatch(query, `${command.category}: ${command.label}`);
      if (match) {
        match.command = command;
        // Lower score for category match
        match.score *= 0.8;
        results.push(match);
        continue;
      }
    }

    // Try matching tags
    if (command.tags) {
      for (const tag of command.tags) {
        match = fuzzyMatch(query, tag);
        if (match) {
          match.command = command;
          // Lower score for tag match
          match.score *= 0.6;
          results.push(match);
          break;
        }
      }
    }

    // Try matching description
    if (command.description) {
      match = fuzzyMatch(query, command.description);
      if (match) {
        match.command = command;
        // Lower score for description match
        match.score *= 0.5;
        results.push(match);
      }
    }
  }

  // Sort by score (descending) and limit results
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
}

// ============================================================================
// Command Registry
// ============================================================================

/**
 * Global command ID counter
 */
let commandIdCounter = 0;

/**
 * Reset command ID counter (for testing)
 */
export function resetCommandIdCounter(): void {
  commandIdCounter = 0;
}

/**
 * Command Registry
 *
 * Centralized registry for all discoverable commands.
 */
export class CommandRegistry {
  private commands: Map<string, Command> = new Map();
  private recentCommands: string[] = [];
  private maxRecent: number = 10;
  private listeners: Set<() => void> = new Set();

  /**
   * Register a command
   */
  register(options: CommandOptions): string {
    const id = options.id || `command_${++commandIdCounter}`;

    const command: Command = {
      ...options,
      id,
      enabled: options.enabled !== false,
    };

    this.commands.set(id, command);

    // Register keybinding if provided
    if (options.keybinding) {
      const registry = getKeyBindingRegistry();
      registry.register({
        key: options.keybinding,
        action: async () => { await this.execute(id); },
        description: options.label,
        commandId: id,
      });
    }

    this.notifyListeners();
    return id;
  }

  /**
   * Unregister a command
   */
  unregister(id: string): boolean {
    const result = this.commands.delete(id);
    if (result) {
      // Remove from recent
      this.recentCommands = this.recentCommands.filter(r => r !== id);
      this.notifyListeners();
    }
    return result;
  }

  /**
   * Get a command by ID
   */
  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  /**
   * Get all commands
   */
  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands by category
   */
  getByCategory(category: string): Command[] {
    return this.getAll().filter(c => c.category === category);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const command of this.commands.values()) {
      if (command.category) {
        categories.add(command.category);
      }
    }
    return Array.from(categories).sort();
  }

  /**
   * Get recent commands
   */
  getRecent(): Command[] {
    return this.recentCommands
      .map(id => this.commands.get(id))
      .filter((c): c is Command => c !== undefined && c.enabled !== false);
  }

  /**
   * Execute a command by ID
   */
  async execute(id: string): Promise<boolean> {
    const command = this.commands.get(id);
    if (!command || command.enabled === false) {
      return false;
    }

    try {
      await command.action();

      // Track recent (if not hidden)
      if (!command.hideFromRecent) {
        this.addToRecent(id);
      }

      return true;
    } catch (error) {
      console.error(`[CommandPalette] Error executing command "${id}":`, error);
      return false;
    }
  }

  /**
   * Add command to recent list
   */
  private addToRecent(id: string): void {
    // Remove if already in list
    this.recentCommands = this.recentCommands.filter(r => r !== id);
    // Add to front
    this.recentCommands.unshift(id);
    // Trim to max
    if (this.recentCommands.length > this.maxRecent) {
      this.recentCommands = this.recentCommands.slice(0, this.maxRecent);
    }
  }

  /**
   * Set maximum recent commands
   */
  setMaxRecent(max: number): void {
    this.maxRecent = max;
    if (this.recentCommands.length > max) {
      this.recentCommands = this.recentCommands.slice(0, max);
    }
  }

  /**
   * Clear recent commands
   */
  clearRecent(): void {
    this.recentCommands = [];
  }

  /**
   * Search commands
   */
  search(query: string, maxResults?: number): FuzzyMatch[] {
    return searchCommands(this.getAll(), query, maxResults);
  }

  /**
   * Enable/disable a command
   */
  setEnabled(id: string, enabled: boolean): void {
    const command = this.commands.get(id);
    if (command) {
      command.enabled = enabled;
      this.notifyListeners();
    }
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
   * Clear all commands
   */
  clear(): void {
    this.commands.clear();
    this.recentCommands = [];
    this.notifyListeners();
  }

  /**
   * Get command count
   */
  get size(): number {
    return this.commands.size;
  }
}

// ============================================================================
// Global Registry
// ============================================================================

let globalRegistry: CommandRegistry | null = null;

/**
 * Get the global command registry
 */
export function getCommandRegistry(): CommandRegistry {
  if (!globalRegistry) {
    globalRegistry = new CommandRegistry();
  }
  return globalRegistry;
}

/**
 * Reset the global registry (for testing)
 */
export function resetCommandRegistry(): void {
  globalRegistry = null;
  resetCommandIdCounter();
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Register a command in the global registry
 */
export function registerCommand(options: CommandOptions): string {
  return getCommandRegistry().register(options);
}

/**
 * Unregister a command from the global registry
 */
export function unregisterCommand(id: string): boolean {
  return getCommandRegistry().unregister(id);
}

/**
 * Execute a command by ID
 */
export function executeCommand(id: string): Promise<boolean> {
  return getCommandRegistry().execute(id);
}

/**
 * Search commands in the global registry
 */
export function searchGlobalCommands(query: string, maxResults?: number): FuzzyMatch[] {
  return getCommandRegistry().search(query, maxResults);
}

// ============================================================================
// Command Palette State
// ============================================================================

/**
 * Create command palette state
 */
export function createCommandPaletteState(options: CommandPaletteOptions = {}): {
  state: () => CommandPaletteState;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  selectFirst: () => void;
  selectLast: () => void;
  executeSelected: () => Promise<boolean>;
} {
  const maxResults = options.maxResults ?? 50;

  const [state, setState] = createSignal<CommandPaletteState>({
    isOpen: false,
    query: '',
    results: [],
    selectedIndex: 0,
    isLoading: false,
  });

  const updateResults = (query: string) => {
    const registry = getCommandRegistry();
    let results: FuzzyMatch[];

    if (!query.trim()) {
      // Show recent commands first, then all commands
      const recent = registry.getRecent();
      const recentIds = new Set(recent.map(r => r.id));
      const others = registry
        .getAll()
        .filter(c => !recentIds.has(c.id) && c.enabled !== false);

      results = [
        ...recent.map(cmd => ({ command: cmd, score: 1000, matches: [] })),
        ...others.slice(0, maxResults - recent.length).map(cmd => ({
          command: cmd,
          score: 0,
          matches: [],
        })),
      ];
    } else {
      results = registry.search(query, maxResults);
    }

    setState(s => ({
      ...s,
      query,
      results,
      selectedIndex: 0,
    }));
  };

  const open = () => {
    updateResults('');
    setState(s => ({ ...s, isOpen: true, query: '', selectedIndex: 0 }));
  };

  const close = () => {
    setState(s => ({ ...s, isOpen: false, query: '', results: [], selectedIndex: 0 }));
  };

  const toggle = () => {
    if (state().isOpen) {
      close();
    } else {
      open();
    }
  };

  const setQuery = (query: string) => {
    updateResults(query);
  };

  const selectNext = () => {
    setState(s => ({
      ...s,
      selectedIndex: Math.min(s.selectedIndex + 1, s.results.length - 1),
    }));
  };

  const selectPrevious = () => {
    setState(s => ({
      ...s,
      selectedIndex: Math.max(s.selectedIndex - 1, 0),
    }));
  };

  const selectFirst = () => {
    setState(s => ({ ...s, selectedIndex: 0 }));
  };

  const selectLast = () => {
    setState(s => ({ ...s, selectedIndex: Math.max(0, s.results.length - 1) }));
  };

  const executeSelected = async (): Promise<boolean> => {
    const { results, selectedIndex } = state();
    if (results.length === 0) return false;

    const selected = results[selectedIndex];
    if (!selected) return false;

    close();

    const registry = getCommandRegistry();
    return registry.execute(selected.command.id);
  };

  // Register the open keybinding
  const openKey = options.openKey ?? 'ctrl+k';
  const keyRegistry = getKeyBindingRegistry();
  keyRegistry.register({
    key: openKey,
    action: toggle,
    description: 'Open Command Palette',
    context: 'global',
    priority: 100, // High priority
  });

  return {
    state,
    open,
    close,
    toggle,
    setQuery,
    selectNext,
    selectPrevious,
    selectFirst,
    selectLast,
    executeSelected,
  };
}

// ============================================================================
// Highlight Helper
// ============================================================================

/**
 * Split text into segments for highlighting matched characters
 */
export function highlightMatches(
  text: string,
  matches: number[]
): Array<{ text: string; highlight: boolean }> {
  if (matches.length === 0) {
    return [{ text, highlight: false }];
  }

  const result: Array<{ text: string; highlight: boolean }> = [];
  const matchSet = new Set(matches);
  let currentSegment = '';
  let currentHighlight = matchSet.has(0);

  for (let i = 0; i < text.length; i++) {
    const isMatch = matchSet.has(i);

    if (isMatch !== currentHighlight) {
      if (currentSegment) {
        result.push({ text: currentSegment, highlight: currentHighlight });
      }
      currentSegment = text[i];
      currentHighlight = isMatch;
    } else {
      currentSegment += text[i];
    }
  }

  if (currentSegment) {
    result.push({ text: currentSegment, highlight: currentHighlight });
  }

  return result;
}

/**
 * Format command for display with optional keybinding
 */
export function formatCommand(command: Command): string {
  let result = command.label;
  if (command.keybinding) {
    result += ` (${formatKeyString(command.keybinding)})`;
  }
  return result;
}

/**
 * Group commands by category
 */
export function groupByCategory(
  commands: Command[]
): Map<string, Command[]> {
  const groups = new Map<string, Command[]>();
  const uncategorized: Command[] = [];

  for (const command of commands) {
    if (command.category) {
      const group = groups.get(command.category) || [];
      group.push(command);
      groups.set(command.category, group);
    } else {
      uncategorized.push(command);
    }
  }

  // Add uncategorized at the end
  if (uncategorized.length > 0) {
    groups.set('', uncategorized);
  }

  return groups;
}
