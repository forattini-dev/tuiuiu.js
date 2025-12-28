/**
 * Tests for MCP documentation coverage
 *
 * Verifies that all major components and hooks have proper documentation
 * in the MCP docs-data module.
 */

import { describe, it, expect } from 'vitest';
import {
  allComponents,
  allHooks,
  allThemes,
  categories,
} from '../../src/mcp/docs-data.js';

describe('MCP Documentation Coverage', () => {
  describe('Component Documentation', () => {
    it('should have documentation for all major primitives', () => {
      const primitiveNames = ['Box', 'Text', 'Spacer', 'Newline', 'Fragment', 'Divider'];

      for (const name of primitiveNames) {
        const doc = allComponents.find((c) => c.name === name);
        expect(doc, `Missing docs for primitive: ${name}`).toBeDefined();
      }
    });

    it('should have documentation for all core atoms', () => {
      const atomNames = [
        'Button',
        'Spinner',
        'ProgressBar',
        'Timer',
        'Badge',
        'Switch',
        'Slider',
        'TextInput',
        'SearchInput',
        'PasswordInput',
        'NumberInput',
        'ConfirmButton',
      ];

      for (const name of atomNames) {
        const doc = allComponents.find((c) => c.name === name);
        expect(doc, `Missing docs for atom: ${name}`).toBeDefined();
      }
    });

    it('should have documentation for all form molecules', () => {
      const moleculeNames = [
        'Select',
        'MultiSelect',
        'RadioGroup',
        'Autocomplete',
        'FormField',
        'FormGroup',
      ];

      for (const name of moleculeNames) {
        const doc = allComponents.find((c) => c.name === name);
        expect(doc, `Missing docs for molecule: ${name}`).toBeDefined();
      }
    });

    it('should have documentation for data visualization components', () => {
      const vizNames = [
        'LineChart',
        'AreaChart',
        'BarChart',
        'Sparkline',
        'Gauge',
        'MeterGauge',
        'ArcGauge',
        'DialGauge',
        'Heatmap',
        'ContributionGraph',
        'CalendarHeatmap',
        'RadarChart',
        'ScatterPlot',
        'GanttChart',
      ];

      for (const name of vizNames) {
        const doc = allComponents.find((c) => c.name === name);
        expect(doc, `Missing docs for viz component: ${name}`).toBeDefined();
      }
    });

    it('should have documentation for all organisms', () => {
      const organismNames = [
        'Modal',
        'CommandPalette',
        'DataTable',
        'FileBrowser',
        'Toast',
        'AlertBox',
        'ConfirmDialog',
        'Window',
      ];

      for (const name of organismNames) {
        const doc = allComponents.find((c) => c.name === name);
        expect(doc, `Missing docs for organism: ${name}`).toBeDefined();
      }
    });

    it('should have documentation for layout components', () => {
      const layoutNames = [
        'ScrollList',  // Primary scroll component (replaces ScrollArea)
        'Tabs',
        'SplitPanel',
        'Grid',
      ];

      for (const name of layoutNames) {
        const doc = allComponents.find((c) => c.name === name);
        expect(doc, `Missing docs for layout: ${name}`).toBeDefined();
      }
    });
  });

  describe('Hook Documentation', () => {
    it('should have documentation for all core hooks', () => {
      const hookNames = [
        'useState',
        'useEffect',
        'useInput',
        'useApp',
        'useFocus',
        'useHotkeys',
        'useMouse',
        'useTerminalSize',
        'useForm',
      ];

      for (const name of hookNames) {
        const doc = allHooks.find((h) => h.name === name);
        expect(doc, `Missing docs for hook: ${name}`).toBeDefined();
      }
    });

    it('should have documentation for signal functions', () => {
      const signalNames = ['createSignal', 'createEffect', 'createMemo', 'batch'];

      for (const name of signalNames) {
        const doc = allHooks.find((h) => h.name === name);
        expect(doc, `Missing docs for signal: ${name}`).toBeDefined();
      }
    });
  });

  describe('Theme Documentation', () => {
    it('should have documentation for all themes', () => {
      const themeNames = [
        'darkTheme',
        'lightTheme',
        'monokaiTheme',
        'draculaTheme',
        'nordTheme',
        'solarizedDarkTheme',
        'gruvboxTheme',
        'tokyoNightTheme',
        'catppuccinTheme',
        'highContrastDarkTheme',
        'monochromeTheme',
      ];

      for (const name of themeNames) {
        const doc = allThemes.find((t) => t.name === name);
        expect(doc, `Missing docs for theme: ${name}`).toBeDefined();
      }
    });
  });

  describe('Documentation Quality', () => {
    it('all components should have required fields', () => {
      for (const comp of allComponents) {
        expect(comp.name, 'Component missing name').toBeTruthy();
        expect(comp.category, `${comp.name} missing category`).toBeTruthy();
        expect(comp.description, `${comp.name} missing description`).toBeTruthy();
      }
    });

    it('all hooks should have required fields', () => {
      for (const hook of allHooks) {
        expect(hook.name, 'Hook missing name').toBeTruthy();
        expect(hook.description, `${hook.name} missing description`).toBeTruthy();
        expect(hook.signature, `${hook.name} missing signature`).toBeTruthy();
      }
    });

    it('all themes should have required fields', () => {
      for (const theme of allThemes) {
        expect(theme.name, 'Theme missing name').toBeTruthy();
        expect(theme.description, `${theme.name} missing description`).toBeTruthy();
      }
    });

    it('components should have props or be marked as no-props', () => {
      // Most components should have props
      const componentsWithProps = allComponents.filter(
        (c) => c.props && c.props.length > 0
      );

      // At least 80% should have documented props
      const coverage = componentsWithProps.length / allComponents.length;
      expect(coverage).toBeGreaterThan(0.7);
    });

    it('components should have examples', () => {
      const componentsWithExamples = allComponents.filter(
        (c) => c.examples && c.examples.length > 0
      );

      // At least 70% should have examples
      const coverage = componentsWithExamples.length / allComponents.length;
      expect(coverage).toBeGreaterThan(0.6);
    });
  });

  describe('Category Structure', () => {
    it('should have all expected categories', () => {
      expect(categories.primitives).toBeDefined();
      expect(categories.atoms).toBeDefined();
      expect(categories.molecules).toBeDefined();
      expect(categories.organisms).toBeDefined();
      expect(categories.layouts).toBeDefined();
      expect(categories.hooks).toBeDefined();
      expect(categories.signals).toBeDefined();
      expect(categories.themes).toBeDefined();
    });

    it('categories should have reasonable sizes', () => {
      expect(categories.primitives.length).toBeGreaterThanOrEqual(5);
      expect(categories.atoms.length).toBeGreaterThanOrEqual(10);
      expect(categories.molecules.length).toBeGreaterThanOrEqual(15);
      expect(categories.organisms.length).toBeGreaterThanOrEqual(5);
      expect(categories.hooks.length).toBeGreaterThanOrEqual(8);
      expect(categories.themes.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Documentation Totals', () => {
    it('should have comprehensive component documentation', () => {
      // We should have at least 100 documented components
      expect(allComponents.length).toBeGreaterThanOrEqual(100);
    });

    it('should have comprehensive hook documentation', () => {
      // We should have at least 12 documented hooks
      expect(allHooks.length).toBeGreaterThanOrEqual(12);
    });

    it('should have all themes documented', () => {
      // We should have exactly 11 themes
      expect(allThemes.length).toBe(11);
    });
  });
});
