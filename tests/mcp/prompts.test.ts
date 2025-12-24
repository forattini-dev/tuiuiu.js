import { describe, it, expect } from 'vitest';
import { prompts, getPromptResult } from '../../src/mcp/prompts.js';

describe('MCP Prompts', () => {
  describe('prompts list', () => {
    it('should have all expected prompts', () => {
      const promptNames = prompts.map(p => p.name);

      // Creation prompts
      expect(promptNames).toContain('create_dashboard');
      expect(promptNames).toContain('create_form');
      expect(promptNames).toContain('create_cli_app');
      expect(promptNames).toContain('create_file_browser');
      expect(promptNames).toContain('create_data_table');
      expect(promptNames).toContain('create_wizard');

      // Migration prompts
      expect(promptNames).toContain('migrate_from_ink');
      expect(promptNames).toContain('migrate_from_blessed');

      // Debug prompts
      expect(promptNames).toContain('debug_layout');
      expect(promptNames).toContain('debug_signals');
      expect(promptNames).toContain('optimize_performance');

      // Learning prompts
      expect(promptNames).toContain('explain_component');
      expect(promptNames).toContain('compare_patterns');

      // Theme prompts
      expect(promptNames).toContain('create_theme');

      // Game prompts
      expect(promptNames).toContain('create_game');
    });

    it('should have valid prompt structure', () => {
      for (const prompt of prompts) {
        expect(prompt.name).toBeDefined();
        expect(typeof prompt.name).toBe('string');
        expect(prompt.description).toBeDefined();
        expect(typeof prompt.description).toBe('string');

        if (prompt.arguments) {
          for (const arg of prompt.arguments) {
            expect(arg.name).toBeDefined();
            expect(arg.description).toBeDefined();
            expect(typeof arg.required).toBe('boolean');
          }
        }
      }
    });
  });

  describe('getPromptResult', () => {
    it('should return null for unknown prompt', () => {
      const result = getPromptResult('unknown_prompt', {});
      expect(result).toBeNull();
    });

    it('should return result for create_dashboard', () => {
      const result = getPromptResult('create_dashboard', {
        metrics: 'cpu,memory,disk',
        style: 'minimal',
      });

      expect(result).not.toBeNull();
      expect(result!.description).toContain('minimal');
      expect(result!.description).toContain('cpu,memory,disk');
      expect(result!.messages).toHaveLength(1);
      expect(result!.messages[0].role).toBe('user');
      expect(result!.messages[0].content.type).toBe('text');
      expect(result!.messages[0].content.text).toContain('cpu');
      expect(result!.messages[0].content.text).toContain('memory');
      expect(result!.messages[0].content.text).toContain('disk');
    });

    it('should return result for create_form with fields', () => {
      const result = getPromptResult('create_form', {
        fields: 'name:text,email:email,role:select',
        validation: 'yes',
      });

      expect(result).not.toBeNull();
      expect(result!.messages[0].content.text).toContain('name');
      expect(result!.messages[0].content.text).toContain('email');
      expect(result!.messages[0].content.text).toContain('role');
      expect(result!.messages[0].content.text).toContain('validation');
    });

    it('should return result for migrate_from_ink', () => {
      const result = getPromptResult('migrate_from_ink', {
        code: 'const App = () => <Box><Text>Hello</Text></Box>',
      });

      expect(result).not.toBeNull();
      expect(result!.messages[0].content.text).toContain('Hello');
      expect(result!.messages[0].content.text).toContain('JSX');
      expect(result!.messages[0].content.text).toContain('Tuiuiu');
    });

    it('should return result for create_game', () => {
      const result = getPromptResult('create_game', {
        type: 'snake',
      });

      expect(result).not.toBeNull();
      expect(result!.messages[0].content.text).toContain('SNAKE');
      expect(result!.messages[0].content.text).toContain('Grid-based movement');
    });

    it('should return result for debug_layout', () => {
      const result = getPromptResult('debug_layout', {
        code: 'Box({ flexDirection: "row" })',
        issue: 'Elements not aligned',
      });

      expect(result).not.toBeNull();
      expect(result!.messages[0].content.text).toContain('Elements not aligned');
      expect(result!.messages[0].content.text).toContain('flexDirection');
    });

    it('should return result for explain_component', () => {
      const result = getPromptResult('explain_component', {
        component: 'Box',
      });

      expect(result).not.toBeNull();
      expect(result!.messages[0].content.text).toContain('Box');
      expect(result!.messages[0].content.text).toContain('Purpose');
      expect(result!.messages[0].content.text).toContain('Best Practices');
    });

    it('should return result for create_theme', () => {
      const result = getPromptResult('create_theme', {
        primary_color: '#6366f1',
        style: 'dark',
        name: 'myTheme',
      });

      expect(result).not.toBeNull();
      expect(result!.messages[0].content.text).toContain('#6366f1');
      expect(result!.messages[0].content.text).toContain('dark');
      expect(result!.messages[0].content.text).toContain('myTheme');
    });
  });
});
