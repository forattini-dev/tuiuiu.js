/**
 * Tuiuiu MCP Completions
 *
 * Provides argument completions for MCP tools to help AI assistants
 * provide better suggestions when calling tools.
 */

import {
  allComponents,
  allHooks,
  allThemes,
  categories,
} from './docs-data.js';

// =============================================================================
// Types
// =============================================================================

export interface MCPCompletionRef {
  type: 'ref/prompt' | 'ref/resource';
  name?: string;
  uri?: string;
}

export interface MCPCompletionArgument {
  name: string;
  value: string;
}

export interface MCPCompletionRequest {
  ref: MCPCompletionRef;
  argument: MCPCompletionArgument;
}

export interface MCPCompletionResult {
  values: string[];
  total?: number;
  hasMore?: boolean;
}

// =============================================================================
// Completion Handlers
// =============================================================================

/**
 * Get completions for a prompt argument
 */
export function getPromptCompletions(
  promptName: string,
  argName: string,
  argValue: string
): MCPCompletionResult {
  const lowerValue = argValue.toLowerCase();

  switch (promptName) {
    case 'create_dashboard':
      if (argName === 'style') {
        return filterCompletions(['minimal', 'detailed', 'gaming'], lowerValue);
      }
      if (argName === 'metrics') {
        return filterCompletions([
          'cpu', 'memory', 'disk', 'network',
          'requests', 'errors', 'latency', 'throughput',
          'users', 'sessions', 'events', 'revenue',
        ], lowerValue);
      }
      break;

    case 'create_form':
      if (argName === 'fields') {
        return filterCompletions([
          'name:text', 'email:email', 'password:password',
          'role:select', 'active:checkbox', 'bio:textarea',
          'phone:text', 'age:number', 'website:url',
        ], lowerValue);
      }
      if (argName === 'validation') {
        return filterCompletions(['yes', 'no'], lowerValue);
      }
      break;

    case 'create_cli_app':
      if (argName === 'commands') {
        return filterCompletions([
          'init', 'build', 'deploy', 'status', 'logs',
          'config', 'version', 'help', 'update', 'clean',
          'test', 'lint', 'format', 'publish', 'install',
        ], lowerValue);
      }
      break;

    case 'create_file_browser':
      if (argName === 'features') {
        return filterCompletions([
          'preview', 'search', 'delete', 'rename',
          'hidden', 'permissions', 'size', 'modified',
        ], lowerValue);
      }
      break;

    case 'create_data_table':
      if (argName === 'features') {
        return filterCompletions([
          'sort', 'filter', 'paginate', 'select',
          'edit', 'delete', 'export', 'resize',
        ], lowerValue);
      }
      break;

    case 'explain_component':
      if (argName === 'component') {
        return filterCompletions(
          allComponents.map(c => c.name),
          lowerValue
        );
      }
      break;

    case 'compare_patterns':
      if (argName === 'pattern') {
        return filterCompletions([
          'state management', 'form handling', 'routing',
          'data fetching', 'error handling', 'layout',
          'theming', 'animations', 'input handling',
        ], lowerValue);
      }
      break;

    case 'create_theme':
      if (argName === 'style') {
        return filterCompletions([
          'dark', 'light', 'high-contrast', 'monochrome',
        ], lowerValue);
      }
      break;

    case 'create_game':
      if (argName === 'type') {
        return filterCompletions([
          'snake', 'tetris', 'pong', 'roguelike',
          'breakout', 'asteroids', 'minesweeper', 'custom',
        ], lowerValue);
      }
      break;
  }

  return { values: [] };
}

/**
 * Get completions for a resource URI
 */
export function getResourceCompletions(
  uriTemplate: string,
  argName: string,
  argValue: string
): MCPCompletionResult {
  const lowerValue = argValue.toLowerCase();

  // Component names
  if (uriTemplate.includes('{name}') && uriTemplate.includes('component')) {
    return filterCompletions(
      allComponents.map(c => c.name),
      lowerValue
    );
  }

  // Hook names
  if (uriTemplate.includes('{name}') && uriTemplate.includes('hook')) {
    return filterCompletions(
      allHooks.map(h => h.name),
      lowerValue
    );
  }

  // Theme names
  if (uriTemplate.includes('{name}') && uriTemplate.includes('theme')) {
    return filterCompletions(
      allThemes.map(t => t.name),
      lowerValue
    );
  }

  // Categories
  if (uriTemplate.includes('{category}')) {
    return filterCompletions(Object.keys(categories), lowerValue);
  }

  // Examples
  if (uriTemplate.includes('{id}') && uriTemplate.includes('example')) {
    return filterCompletions([
      'counter', 'dashboard', 'form', 'file-browser',
      'data-table', 'command-palette', 'wizard', 'game-snake',
    ], lowerValue);
  }

  // Guides
  if (uriTemplate.includes('{topic}')) {
    return filterCompletions([
      'getting-started', 'custom-themes', 'migration-ink',
      'migration-blessed', 'signals', 'layout',
      'input-handling', 'animations',
    ], lowerValue);
  }

  return { values: [] };
}

/**
 * Get completions for tool arguments
 */
export function getToolCompletions(
  toolName: string,
  argName: string,
  argValue: string
): MCPCompletionResult {
  const lowerValue = argValue.toLowerCase();

  switch (toolName) {
    case 'tuiuiu_list_components':
      if (argName === 'category') {
        return filterCompletions(Object.keys(categories), lowerValue);
      }
      break;

    case 'tuiuiu_get_component':
      if (argName === 'name') {
        return filterCompletions(
          allComponents.map(c => c.name),
          lowerValue
        );
      }
      break;

    case 'tuiuiu_get_hook':
      if (argName === 'name') {
        return filterCompletions(
          allHooks.map(h => h.name),
          lowerValue
        );
      }
      break;

    case 'tuiuiu_quickstart':
      if (argName === 'pattern') {
        return filterCompletions([
          'header', 'status', 'dashboard', 'form',
          'game', 'theme', 'navigation', 'modal',
        ], lowerValue);
      }
      break;
  }

  return { values: [] };
}

// =============================================================================
// Helpers
// =============================================================================

function filterCompletions(
  options: string[],
  prefix: string,
  limit = 10
): MCPCompletionResult {
  const filtered = options.filter(opt =>
    opt.toLowerCase().startsWith(prefix) ||
    opt.toLowerCase().includes(prefix)
  );

  // Sort: exact prefix matches first, then contains matches
  filtered.sort((a, b) => {
    const aStarts = a.toLowerCase().startsWith(prefix);
    const bStarts = b.toLowerCase().startsWith(prefix);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.localeCompare(b);
  });

  return {
    values: filtered.slice(0, limit),
    total: filtered.length,
    hasMore: filtered.length > limit,
  };
}
