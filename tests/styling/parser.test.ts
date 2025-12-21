/**
 * Tests for TCSS Parser
 */

import { describe, it, expect } from 'vitest';
import {
  Parser,
  parse,
  parseStrict,
  stringifySelector,
  stringifyValue,
  type Stylesheet,
  type Rule,
  type Declaration,
  type Value,
  type VariableDefinition,
  type ImportRule,
  type MediaRule,
  type CompoundSelector,
  type ComplexSelector,
  type SimpleSelector,
} from '../../src/styling/parser.js';

describe('TCSS Parser', () => {
  describe('Basic rules', () => {
    it('should parse a simple type selector rule', () => {
      const { ast, errors } = parse('Box { color: red }');

      expect(errors).toHaveLength(0);
      expect(ast.rules).toHaveLength(1);

      const rule = ast.rules[0] as Rule;
      expect(rule.type).toBe('rule');
      expect(rule.declarations).toHaveLength(1);
      expect(rule.declarations[0].property).toBe('color');
      expect(rule.declarations[0].values[0].value).toBe('red');
    });

    it('should parse multiple declarations', () => {
      const { ast, errors } = parse(`
        Box {
          color: red;
          padding: 10;
          margin: 5;
        }
      `);

      expect(errors).toHaveLength(0);
      const rule = ast.rules[0] as Rule;
      expect(rule.declarations).toHaveLength(3);
      expect(rule.declarations[0].property).toBe('color');
      expect(rule.declarations[1].property).toBe('padding');
      expect(rule.declarations[2].property).toBe('margin');
    });

    it('should parse multiple rules', () => {
      const { ast, errors } = parse(`
        Box { color: red }
        Text { bold: true }
      `);

      expect(errors).toHaveLength(0);
      expect(ast.rules).toHaveLength(2);
    });
  });

  describe('Selectors', () => {
    describe('Type selectors', () => {
      it('should parse type selector', () => {
        const { ast } = parse('Box { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as CompoundSelector;

        expect(selector.selectors).toHaveLength(1);
        expect(selector.selectors[0].selectorType).toBe('type');
        expect(selector.selectors[0].name).toBe('Box');
      });
    });

    describe('Class selectors', () => {
      it('should parse class selector', () => {
        const { ast } = parse('.primary { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as CompoundSelector;

        expect(selector.selectors).toHaveLength(1);
        expect(selector.selectors[0].selectorType).toBe('class');
        expect(selector.selectors[0].name).toBe('primary');
      });

      it('should parse multiple class selectors', () => {
        const { ast } = parse('.btn.primary.large { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as CompoundSelector;

        expect(selector.selectors).toHaveLength(3);
        expect(selector.selectors[0].name).toBe('btn');
        expect(selector.selectors[1].name).toBe('primary');
        expect(selector.selectors[2].name).toBe('large');
      });
    });

    describe('ID selectors', () => {
      it('should parse ID selector', () => {
        const { ast } = parse('#header { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as CompoundSelector;

        expect(selector.selectors).toHaveLength(1);
        expect(selector.selectors[0].selectorType).toBe('id');
        expect(selector.selectors[0].name).toBe('header');
      });
    });

    describe('Universal selector', () => {
      it('should parse universal selector', () => {
        const { ast } = parse('* { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as CompoundSelector;

        expect(selector.selectors).toHaveLength(1);
        expect(selector.selectors[0].selectorType).toBe('universal');
        expect(selector.selectors[0].name).toBe('*');
      });
    });

    describe('Compound selectors', () => {
      it('should parse type with class', () => {
        const { ast } = parse('Box.primary { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as CompoundSelector;

        expect(selector.selectors).toHaveLength(2);
        expect(selector.selectors[0].selectorType).toBe('type');
        expect(selector.selectors[0].name).toBe('Box');
        expect(selector.selectors[1].selectorType).toBe('class');
        expect(selector.selectors[1].name).toBe('primary');
      });

      it('should parse type with ID', () => {
        const { ast } = parse('Box#main { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as CompoundSelector;

        expect(selector.selectors).toHaveLength(2);
        expect(selector.selectors[0].name).toBe('Box');
        expect(selector.selectors[1].selectorType).toBe('id');
        expect(selector.selectors[1].name).toBe('main');
      });

      it('should parse type with class and ID', () => {
        const { ast } = parse('Box.primary#main { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as CompoundSelector;

        expect(selector.selectors).toHaveLength(3);
      });
    });

    describe('Pseudo-classes', () => {
      it('should parse pseudo-class', () => {
        const { ast } = parse('Button:focus { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as CompoundSelector;

        expect(selector.selectors).toHaveLength(2);
        expect(selector.selectors[1].selectorType).toBe('pseudo-class');
        expect(selector.selectors[1].name).toBe('focus');
      });

      it('should parse multiple pseudo-classes', () => {
        const { ast } = parse('Button:hover:active { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as CompoundSelector;

        expect(selector.selectors).toHaveLength(3);
        expect(selector.selectors[1].name).toBe('hover');
        expect(selector.selectors[2].name).toBe('active');
      });

      it('should parse pseudo-class with argument', () => {
        const { ast } = parse('List:nth-child(2n+1) { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as CompoundSelector;

        expect(selector.selectors[1].selectorType).toBe('pseudo-class');
        expect(selector.selectors[1].name).toBe('nth-child');
        expect(selector.selectors[1].argument).toBe('2n + 1');
      });

      it('should parse :not() pseudo-class', () => {
        const { ast } = parse('Box:not(.hidden) { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as CompoundSelector;

        expect(selector.selectors[1].name).toBe('not');
        expect(selector.selectors[1].argument).toBe('. hidden');
      });
    });

    describe('Pseudo-elements', () => {
      it('should parse pseudo-element', () => {
        const { ast } = parse('Box::before { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as CompoundSelector;

        expect(selector.selectors).toHaveLength(2);
        expect(selector.selectors[1].selectorType).toBe('pseudo-element');
        expect(selector.selectors[1].name).toBe('before');
      });
    });

    describe('Combinator selectors', () => {
      it('should parse descendant combinator', () => {
        const { ast } = parse('Form Input { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as ComplexSelector;

        expect(selector.type).toBe('complex-selector');
        expect(selector.combinator).toBe('descendant');
        expect(stringifySelector(selector)).toBe('Form Input');
      });

      it('should parse child combinator', () => {
        const { ast } = parse('Box > Text { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as ComplexSelector;

        expect(selector.type).toBe('complex-selector');
        expect(selector.combinator).toBe('child');
        expect(stringifySelector(selector)).toBe('Box > Text');
      });

      it('should parse adjacent sibling combinator', () => {
        const { ast } = parse('Label + Input { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as ComplexSelector;

        expect(selector.combinator).toBe('adjacent');
        expect(stringifySelector(selector)).toBe('Label + Input');
      });

      it('should parse general sibling combinator', () => {
        const { ast } = parse('Label ~ Input { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as ComplexSelector;

        expect(selector.combinator).toBe('sibling');
        expect(stringifySelector(selector)).toBe('Label ~ Input');
      });

      it('should parse chained combinators', () => {
        const { ast } = parse('Form > Box Input { }');
        const rule = ast.rules[0] as Rule;
        const selector = rule.selectors.selectors[0] as ComplexSelector;

        expect(stringifySelector(selector)).toBe('Form > Box Input');
      });
    });

    describe('Selector lists', () => {
      it('should parse comma-separated selectors', () => {
        const { ast } = parse('Box, Text, Button { }');
        const rule = ast.rules[0] as Rule;

        expect(rule.selectors.selectors).toHaveLength(3);
      });

      it('should parse complex selector lists', () => {
        const { ast } = parse('Box.primary, Text.secondary:hover, #main { }');
        const rule = ast.rules[0] as Rule;

        expect(rule.selectors.selectors).toHaveLength(3);
      });
    });
  });

  describe('Values', () => {
    it('should parse keyword values', () => {
      const { ast } = parse('Box { display: flex }');
      const rule = ast.rules[0] as Rule;
      const value = rule.declarations[0].values[0];

      expect(value.valueType).toBe('keyword');
      expect(value.value).toBe('flex');
    });

    it('should parse number values', () => {
      const { ast } = parse('Box { padding: 10 }');
      const rule = ast.rules[0] as Rule;
      const value = rule.declarations[0].values[0];

      expect(value.valueType).toBe('number');
      expect(value.value).toBe('10');
    });

    it('should parse dimension values', () => {
      const { ast } = parse('Box { width: 100px }');
      const rule = ast.rules[0] as Rule;
      const value = rule.declarations[0].values[0];

      expect(value.valueType).toBe('dimension');
      expect(value.value).toBe('100');
      expect(value.unit).toBe('px');
    });

    it('should parse percentage values', () => {
      const { ast } = parse('Box { width: 50% }');
      const rule = ast.rules[0] as Rule;
      const value = rule.declarations[0].values[0];

      expect(value.valueType).toBe('percentage');
      expect(value.value).toBe('50');
      expect(value.unit).toBe('%');
    });

    it('should parse hex color values', () => {
      const { ast } = parse('Box { color: #fff }');
      const rule = ast.rules[0] as Rule;
      const value = rule.declarations[0].values[0];

      expect(value.valueType).toBe('color');
      expect(value.value).toBe('#fff');
    });

    it('should parse string values', () => {
      const { ast } = parse('Box { content: "hello" }');
      const rule = ast.rules[0] as Rule;
      const value = rule.declarations[0].values[0];

      expect(value.valueType).toBe('string');
      expect(value.value).toBe('hello');
    });

    it('should parse variable references', () => {
      const { ast } = parse('Box { color: $primary }');
      const rule = ast.rules[0] as Rule;
      const value = rule.declarations[0].values[0];

      expect(value.valueType).toBe('variable');
      expect(value.value).toBe('$primary');
    });

    it('should parse function values', () => {
      const { ast } = parse('Box { color: rgb(255, 0, 0) }');
      const rule = ast.rules[0] as Rule;
      const value = rule.declarations[0].values[0];

      expect(value.valueType).toBe('function');
      expect(value.value).toBe('rgb');
      expect(value.arguments).toHaveLength(3);
    });

    it('should parse multiple values', () => {
      const { ast } = parse('Box { padding: 1 2 3 4 }');
      const rule = ast.rules[0] as Rule;

      expect(rule.declarations[0].values).toHaveLength(4);
    });

    it('should parse !important', () => {
      const { ast } = parse('Box { color: red !important }');
      const rule = ast.rules[0] as Rule;

      expect(rule.declarations[0].important).toBe(true);
    });
  });

  describe('Variables', () => {
    it('should parse variable definition', () => {
      const { ast } = parse('$primary: #007bff;');
      const varDef = ast.rules[0] as VariableDefinition;

      expect(varDef.type).toBe('variable-definition');
      expect(varDef.name).toBe('$primary');
      expect(varDef.values[0].valueType).toBe('color');
    });

    it('should parse multiple variable definitions', () => {
      const { ast } = parse(`
        $primary: blue;
        $secondary: green;
        $spacing: 10px;
      `);

      expect(ast.rules).toHaveLength(3);
      expect((ast.rules[0] as VariableDefinition).name).toBe('$primary');
      expect((ast.rules[1] as VariableDefinition).name).toBe('$secondary');
      expect((ast.rules[2] as VariableDefinition).name).toBe('$spacing');
    });

    it('should parse variable with function value', () => {
      const { ast } = parse('$bg: linear-gradient(to-right, red, blue);');
      const varDef = ast.rules[0] as VariableDefinition;

      expect(varDef.values[0].valueType).toBe('function');
    });
  });

  describe('@import', () => {
    it('should parse @import rule', () => {
      const { ast } = parse('@import "theme.tcss";');
      const importRule = ast.rules[0] as ImportRule;

      expect(importRule.type).toBe('import');
      expect(importRule.path).toBe('theme.tcss');
    });

    it('should parse @import without semicolon', () => {
      const { ast } = parse('@import "theme.tcss"');
      const importRule = ast.rules[0] as ImportRule;

      expect(importRule.path).toBe('theme.tcss');
    });

    it('should parse multiple imports', () => {
      const { ast } = parse(`
        @import "reset.tcss";
        @import "theme.tcss";
        @import "components.tcss";
      `);

      expect(ast.rules).toHaveLength(3);
      expect((ast.rules[0] as ImportRule).path).toBe('reset.tcss');
    });
  });

  describe('@media', () => {
    it('should parse @media rule', () => {
      const { ast } = parse('@media (min-width: 80) { Box { padding: 2 } }');
      const media = ast.rules[0] as MediaRule;

      expect(media.type).toBe('media');
      expect(media.conditions).toHaveLength(1);
      expect(media.conditions[0].feature).toBe('min-width');
      expect(media.rules).toHaveLength(1);
    });

    it('should parse @media with multiple conditions', () => {
      const { ast } = parse('@media (min-width: 80) and (color-scheme: dark) { Box { } }');
      const media = ast.rules[0] as MediaRule;

      expect(media.conditions).toHaveLength(2);
      expect(media.conditions[0].feature).toBe('min-width');
      expect(media.conditions[1].feature).toBe('color-scheme');
    });

    it('should parse @media with multiple rules', () => {
      const { ast } = parse(`
        @media (min-width: 80) {
          Box { padding: 2 }
          Text { color: white }
        }
      `);
      const media = ast.rules[0] as MediaRule;

      expect(media.rules).toHaveLength(2);
    });

    it('should parse @media with variables', () => {
      const { ast } = parse(`
        @media (min-width: 80) {
          $spacing: 20;
          Box { padding: $spacing }
        }
      `);
      const media = ast.rules[0] as MediaRule;

      expect(media.rules).toHaveLength(2);
      expect(media.rules[0].type).toBe('variable-definition');
      expect(media.rules[1].type).toBe('rule');
    });
  });

  describe('Complex stylesheets', () => {
    it('should parse a complete stylesheet', () => {
      const { ast, errors } = parse(`
        /* Theme variables */
        $primary: #007bff;
        $bg: #1a1a1a;
        $spacing: 10px;

        @import "reset.tcss";

        /* Base styles */
        * {
          margin: 0;
          padding: 0;
        }

        Box {
          background: $bg;
          padding: $spacing;
        }

        Box.primary {
          color: $primary;
        }

        Button:focus {
          border-color: $primary !important;
        }

        Form > Input {
          width: 100%;
        }

        @media (min-width: 80) {
          Box {
            padding: 20;
          }
        }
      `);

      expect(errors).toHaveLength(0);
      expect(ast.rules.length).toBeGreaterThan(5);
    });

    it('should handle nested pseudo-classes with combinators', () => {
      const { ast, errors } = parse(`
        Form Input:focus,
        Form Select:focus {
          border-color: cyan;
        }
      `);

      expect(errors).toHaveLength(0);
      const rule = ast.rules[0] as Rule;
      expect(rule.selectors.selectors).toHaveLength(2);
    });
  });

  describe('Error handling', () => {
    it('should report error for missing opening brace', () => {
      const { errors } = parse('Box color: red }');

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should report error for missing closing brace', () => {
      const { errors } = parse('Box { color: red');

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should report error for missing colon', () => {
      const { errors } = parse('Box { color red }');

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should recover from errors in tolerant mode', () => {
      const { ast, errors } = parse(`
        Box { color }
        Text { padding: 10 }
      `);

      expect(errors.length).toBeGreaterThan(0);
      // Should still parse the valid rule
      expect(ast.rules.length).toBeGreaterThanOrEqual(1);
    });

    it('should throw in strict mode', () => {
      expect(() => parseStrict('Box { color }')).toThrow();
    });
  });

  describe('stringifySelector', () => {
    it('should stringify type selector', () => {
      const { ast } = parse('Box { }');
      const rule = ast.rules[0] as Rule;
      const selector = rule.selectors.selectors[0] as CompoundSelector;

      expect(stringifySelector(selector)).toBe('Box');
    });

    it('should stringify class selector', () => {
      const { ast } = parse('.primary { }');
      const rule = ast.rules[0] as Rule;
      const selector = rule.selectors.selectors[0] as CompoundSelector;

      expect(stringifySelector(selector)).toBe('.primary');
    });

    it('should stringify compound selector', () => {
      const { ast } = parse('Box.primary#main { }');
      const rule = ast.rules[0] as Rule;
      const selector = rule.selectors.selectors[0] as CompoundSelector;

      expect(stringifySelector(selector)).toBe('Box.primary#main');
    });

    it('should stringify complex selector', () => {
      const { ast } = parse('Form > Box Input.text:focus { }');
      const rule = ast.rules[0] as Rule;
      const selector = rule.selectors.selectors[0] as ComplexSelector;

      expect(stringifySelector(selector)).toBe('Form > Box Input.text:focus');
    });
  });

  describe('stringifyValue', () => {
    it('should stringify keyword value', () => {
      const { ast } = parse('Box { display: flex }');
      const rule = ast.rules[0] as Rule;
      const value = rule.declarations[0].values[0];

      expect(stringifyValue(value)).toBe('flex');
    });

    it('should stringify dimension value', () => {
      const { ast } = parse('Box { width: 100px }');
      const rule = ast.rules[0] as Rule;
      const value = rule.declarations[0].values[0];

      expect(stringifyValue(value)).toBe('100px');
    });

    it('should stringify function value', () => {
      const { ast } = parse('Box { color: rgb(255, 0, 0) }');
      const rule = ast.rules[0] as Rule;
      const value = rule.declarations[0].values[0];

      expect(stringifyValue(value)).toBe('rgb(255, 0, 0)');
    });

    it('should stringify string value', () => {
      const { ast } = parse('Box { content: "hello" }');
      const rule = ast.rules[0] as Rule;
      const value = rule.declarations[0].values[0];

      expect(stringifyValue(value)).toBe('"hello"');
    });
  });

  describe('Line and column tracking', () => {
    it('should track line numbers', () => {
      const { ast } = parse(`Box { }
Text { }`);

      const rule1 = ast.rules[0] as Rule;
      const rule2 = ast.rules[1] as Rule;

      expect(rule1.line).toBe(1);
      expect(rule2.line).toBe(2);
    });

    it('should track column numbers', () => {
      const { ast } = parse('   Box { color: red }');
      const rule = ast.rules[0] as Rule;

      expect(rule.column).toBe(4); // "Box" starts at column 4
    });
  });
});
