import { describe, it, expect } from 'vitest';
import {
  getPromptCompletions,
  getResourceCompletions,
  getToolCompletions,
} from '../../src/mcp/completions.js';

describe('MCP Completions', () => {
  describe('getPromptCompletions', () => {
    it('should return empty array for unknown prompt', () => {
      const result = getPromptCompletions('unknown', 'arg', '');
      expect(result.values).toEqual([]);
    });

    it('should return style completions for create_dashboard', () => {
      const result = getPromptCompletions('create_dashboard', 'style', '');

      expect(result.values).toContain('minimal');
      expect(result.values).toContain('detailed');
      expect(result.values).toContain('gaming');
    });

    it('should return metrics completions for create_dashboard', () => {
      const result = getPromptCompletions('create_dashboard', 'metrics', '');

      expect(result.values).toContain('cpu');
      expect(result.values).toContain('memory');
      expect(result.values).toContain('disk');
    });

    it('should filter completions by prefix', () => {
      const result = getPromptCompletions('create_dashboard', 'metrics', 'me');

      expect(result.values).toContain('memory');
      expect(result.values).not.toContain('cpu');
    });

    it('should return field completions for create_form', () => {
      const result = getPromptCompletions('create_form', 'fields', '');

      expect(result.values).toContain('name:text');
      expect(result.values).toContain('email:email');
      expect(result.values).toContain('role:select');
    });

    it('should return game type completions for create_game', () => {
      const result = getPromptCompletions('create_game', 'type', '');

      expect(result.values).toContain('snake');
      expect(result.values).toContain('tetris');
      expect(result.values).toContain('pong');
      expect(result.values).toContain('roguelike');
    });

    it('should return theme style completions for create_theme', () => {
      const result = getPromptCompletions('create_theme', 'style', '');

      expect(result.values).toContain('dark');
      expect(result.values).toContain('light');
      expect(result.values).toContain('high-contrast');
    });

    it('should return command completions for create_cli_app', () => {
      const result = getPromptCompletions('create_cli_app', 'commands', '');

      expect(result.values).toContain('init');
      expect(result.values).toContain('build');
      expect(result.values).toContain('deploy');
    });

    it('should include total and hasMore for large result sets', () => {
      const result = getPromptCompletions('create_cli_app', 'commands', '');

      expect(result.total).toBeDefined();
      expect(typeof result.hasMore).toBe('boolean');
    });
  });

  describe('getResourceCompletions', () => {
    it('should return component names for component template', () => {
      const result = getResourceCompletions(
        'tuiuiu://component/{name}',
        'name',
        ''
      );

      expect(result.values.length).toBeGreaterThan(0);
      // Returns first 10 alphabetically, Box and Text may not be in first 10
      expect(result.total).toBeGreaterThan(0);
    });

    it('should filter component names by prefix', () => {
      const result = getResourceCompletions(
        'tuiuiu://component/{name}',
        'name',
        'bu'
      );

      expect(result.values).toContain('Button');
      expect(result.values).not.toContain('Box');
    });

    it('should return hook names for hook template', () => {
      const result = getResourceCompletions(
        'tuiuiu://hook/{name}',
        'name',
        ''
      );

      expect(result.values.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should find useState when filtering', () => {
      const result = getResourceCompletions(
        'tuiuiu://hook/{name}',
        'name',
        'use'
      );

      expect(result.values).toContain('useState');
    });

    it('should return category names for category template', () => {
      const result = getResourceCompletions(
        'tuiuiu://category/{category}',
        'category',
        ''
      );

      expect(result.values).toContain('atoms');
      expect(result.values).toContain('molecules');
      expect(result.values).toContain('organisms');
    });

    it('should return example ids for example template', () => {
      const result = getResourceCompletions(
        'tuiuiu://example/{id}',
        'id',
        ''
      );

      expect(result.values).toContain('counter');
      expect(result.values).toContain('dashboard');
      expect(result.values).toContain('form');
    });

    it('should return guide topics for guide template', () => {
      const result = getResourceCompletions(
        'tuiuiu://guide/{topic}',
        'topic',
        ''
      );

      expect(result.values).toContain('getting-started');
      expect(result.values).toContain('signals');
      expect(result.values).toContain('layout');
    });
  });

  describe('getToolCompletions', () => {
    it('should return category completions for tuiuiu_list_components', () => {
      const result = getToolCompletions(
        'tuiuiu_list_components',
        'category',
        ''
      );

      expect(result.values).toContain('atoms');
      expect(result.values).toContain('molecules');
      expect(result.values).toContain('organisms');
    });

    it('should return component names for tuiuiu_get_component', () => {
      const result = getToolCompletions(
        'tuiuiu_get_component',
        'name',
        ''
      );

      expect(result.values.length).toBeGreaterThan(0);
      expect(result.values).toContain('Box');
    });

    it('should return hook names for tuiuiu_get_hook', () => {
      const result = getToolCompletions(
        'tuiuiu_get_hook',
        'name',
        ''
      );

      expect(result.values.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should find useState when filtering for tuiuiu_get_hook', () => {
      const result = getToolCompletions(
        'tuiuiu_get_hook',
        'name',
        'use'
      );

      expect(result.values).toContain('useState');
    });

    it('should return pattern completions for tuiuiu_quickstart', () => {
      const result = getToolCompletions(
        'tuiuiu_quickstart',
        'pattern',
        ''
      );

      expect(result.values).toContain('header');
      expect(result.values).toContain('dashboard');
      expect(result.values).toContain('form');
    });

    it('should filter by prefix', () => {
      const result = getToolCompletions(
        'tuiuiu_get_component',
        'name',
        'sp'
      );

      expect(result.values).toContain('Spinner');
      expect(result.values).toContain('Sparkline');
      expect(result.values).not.toContain('Box');
    });
  });
});
