/**
 * Tests for TCSS Style Resolver
 */

import { describe, it, expect } from 'vitest';
import {
  // Specificity
  calculateSpecificity,
  compareSpecificity,
  specificityToNumber,
  specificityToString,
  getSpecificity,
  // Matching
  matchSelector,
  // Inheritance
  isInheritable,
  // StyleSheet
  StyleSheet,
  createStyleSheet,
  // Style application
  resolvedStylesToProps,
  applyStyles,
  // Types
  type Specificity,
  type MatchElement,
} from '../../src/styling/resolver.js';
import { parse, type SelectorList } from '../../src/styling/parser.js';

describe('TCSS Resolver', () => {
  describe('Specificity', () => {
    describe('calculateSpecificity', () => {
      it('should calculate specificity for type selector', () => {
        const spec = getSpecificity('Box');
        expect(spec).toEqual([0, 0, 1]);
      });

      it('should calculate specificity for class selector', () => {
        const spec = getSpecificity('.primary');
        expect(spec).toEqual([0, 1, 0]);
      });

      it('should calculate specificity for ID selector', () => {
        const spec = getSpecificity('#header');
        expect(spec).toEqual([1, 0, 0]);
      });

      it('should calculate specificity for universal selector', () => {
        const spec = getSpecificity('*');
        expect(spec).toEqual([0, 0, 0]);
      });

      it('should calculate specificity for compound selector', () => {
        const spec = getSpecificity('Box.primary');
        expect(spec).toEqual([0, 1, 1]);
      });

      it('should calculate specificity for complex compound', () => {
        const spec = getSpecificity('Box.primary#main');
        expect(spec).toEqual([1, 1, 1]);
      });

      it('should calculate specificity for pseudo-class', () => {
        const spec = getSpecificity('Button:focus');
        expect(spec).toEqual([0, 1, 1]);
      });

      it('should calculate specificity for pseudo-element', () => {
        const spec = getSpecificity('Box::before');
        expect(spec).toEqual([0, 0, 2]);
      });

      it('should calculate specificity for descendant combinator', () => {
        const spec = getSpecificity('Form Input');
        expect(spec).toEqual([0, 0, 2]);
      });

      it('should calculate specificity for child combinator', () => {
        const spec = getSpecificity('Box > Text');
        expect(spec).toEqual([0, 0, 2]);
      });

      it('should calculate specificity for complex selector', () => {
        const spec = getSpecificity('Form.login Input#email:focus');
        // Form = 0,0,1, .login = 0,1,0, Input = 0,0,1, #email = 1,0,0, :focus = 0,1,0
        expect(spec).toEqual([1, 2, 2]);
      });
    });

    describe('compareSpecificity', () => {
      it('should compare equal specificities', () => {
        expect(compareSpecificity([0, 1, 1], [0, 1, 1])).toBe(0);
      });

      it('should compare by ID count first', () => {
        expect(compareSpecificity([1, 0, 0], [0, 10, 10])).toBeGreaterThan(0);
      });

      it('should compare by class count second', () => {
        expect(compareSpecificity([0, 2, 0], [0, 1, 10])).toBeGreaterThan(0);
      });

      it('should compare by type count last', () => {
        expect(compareSpecificity([0, 0, 2], [0, 0, 1])).toBeGreaterThan(0);
      });
    });

    describe('specificityToNumber', () => {
      it('should convert specificity to number', () => {
        expect(specificityToNumber([0, 0, 1])).toBe(1);
        expect(specificityToNumber([0, 1, 0])).toBe(100);
        expect(specificityToNumber([1, 0, 0])).toBe(10000);
        expect(specificityToNumber([1, 2, 3])).toBe(10203);
      });
    });

    describe('specificityToString', () => {
      it('should convert specificity to string', () => {
        expect(specificityToString([0, 0, 1])).toBe('(0, 0, 1)');
        expect(specificityToString([1, 2, 3])).toBe('(1, 2, 3)');
      });
    });
  });

  describe('Selector Matching', () => {
    function getSelectorList(selector: string): SelectorList {
      const { ast } = parse(`${selector} {}`);
      return (ast.rules[0] as any).selectors;
    }

    describe('Type selectors', () => {
      it('should match type selector', () => {
        const element: MatchElement = { type: 'Box' };
        expect(matchSelector(getSelectorList('Box'), element)).toBe(true);
      });

      it('should not match different type', () => {
        const element: MatchElement = { type: 'Text' };
        expect(matchSelector(getSelectorList('Box'), element)).toBe(false);
      });
    });

    describe('Class selectors', () => {
      it('should match class selector', () => {
        const element: MatchElement = { type: 'Box', classes: ['primary'] };
        expect(matchSelector(getSelectorList('.primary'), element)).toBe(true);
      });

      it('should match one of multiple classes', () => {
        const element: MatchElement = { type: 'Box', classes: ['primary', 'large'] };
        expect(matchSelector(getSelectorList('.large'), element)).toBe(true);
      });

      it('should not match missing class', () => {
        const element: MatchElement = { type: 'Box', classes: ['primary'] };
        expect(matchSelector(getSelectorList('.secondary'), element)).toBe(false);
      });
    });

    describe('ID selectors', () => {
      it('should match ID selector', () => {
        const element: MatchElement = { type: 'Box', id: 'header' };
        expect(matchSelector(getSelectorList('#header'), element)).toBe(true);
      });

      it('should not match different ID', () => {
        const element: MatchElement = { type: 'Box', id: 'header' };
        expect(matchSelector(getSelectorList('#footer'), element)).toBe(false);
      });
    });

    describe('Universal selector', () => {
      it('should match any element', () => {
        const element: MatchElement = { type: 'Box' };
        expect(matchSelector(getSelectorList('*'), element)).toBe(true);
      });
    });

    describe('Compound selectors', () => {
      it('should match type + class', () => {
        const element: MatchElement = { type: 'Box', classes: ['primary'] };
        expect(matchSelector(getSelectorList('Box.primary'), element)).toBe(true);
      });

      it('should not match if type wrong', () => {
        const element: MatchElement = { type: 'Text', classes: ['primary'] };
        expect(matchSelector(getSelectorList('Box.primary'), element)).toBe(false);
      });

      it('should not match if class missing', () => {
        const element: MatchElement = { type: 'Box', classes: ['secondary'] };
        expect(matchSelector(getSelectorList('Box.primary'), element)).toBe(false);
      });

      it('should match multiple classes', () => {
        const element: MatchElement = { type: 'Button', classes: ['btn', 'primary'] };
        expect(matchSelector(getSelectorList('.btn.primary'), element)).toBe(true);
      });
    });

    describe('Pseudo-class selectors', () => {
      it('should match pseudo-class', () => {
        const element: MatchElement = { type: 'Button', pseudoClasses: ['focus'] };
        expect(matchSelector(getSelectorList('Button:focus'), element)).toBe(true);
      });

      it('should not match missing pseudo-class', () => {
        const element: MatchElement = { type: 'Button', pseudoClasses: ['hover'] };
        expect(matchSelector(getSelectorList('Button:focus'), element)).toBe(false);
      });
    });

    describe('Descendant combinator', () => {
      it('should match direct child', () => {
        const parent: MatchElement = { type: 'Form' };
        const element: MatchElement = { type: 'Input', parent };

        expect(matchSelector(getSelectorList('Form Input'), element)).toBe(true);
      });

      it('should match deep descendant', () => {
        const grandparent: MatchElement = { type: 'Form' };
        const parent: MatchElement = { type: 'Box', parent: grandparent };
        const element: MatchElement = { type: 'Input', parent };

        expect(matchSelector(getSelectorList('Form Input'), element)).toBe(true);
      });

      it('should not match if ancestor wrong', () => {
        const parent: MatchElement = { type: 'Box' };
        const element: MatchElement = { type: 'Input', parent };

        expect(matchSelector(getSelectorList('Form Input'), element)).toBe(false);
      });
    });

    describe('Child combinator', () => {
      it('should match direct child', () => {
        const parent: MatchElement = { type: 'Box' };
        const element: MatchElement = { type: 'Text', parent };

        expect(matchSelector(getSelectorList('Box > Text'), element)).toBe(true);
      });

      it('should not match grandchild', () => {
        const grandparent: MatchElement = { type: 'Box' };
        const parent: MatchElement = { type: 'Container', parent: grandparent };
        const element: MatchElement = { type: 'Text', parent };

        expect(matchSelector(getSelectorList('Box > Text'), element)).toBe(false);
      });
    });

    describe('Adjacent sibling combinator', () => {
      it('should match immediate sibling', () => {
        const previous: MatchElement = { type: 'Label' };
        const element: MatchElement = { type: 'Input', previousSibling: previous };

        expect(matchSelector(getSelectorList('Label + Input'), element)).toBe(true);
      });

      it('should not match non-immediate sibling', () => {
        const firstSibling: MatchElement = { type: 'Label' };
        const previous: MatchElement = { type: 'Spacer', previousSibling: firstSibling };
        const element: MatchElement = { type: 'Input', previousSibling: previous };

        expect(matchSelector(getSelectorList('Label + Input'), element)).toBe(false);
      });
    });

    describe('General sibling combinator', () => {
      it('should match any previous sibling', () => {
        const firstSibling: MatchElement = { type: 'Label' };
        const previous: MatchElement = { type: 'Spacer', previousSibling: firstSibling };
        const element: MatchElement = { type: 'Input', previousSibling: previous };

        expect(matchSelector(getSelectorList('Label ~ Input'), element)).toBe(true);
      });
    });

    describe('Selector lists', () => {
      it('should match if any selector matches', () => {
        const element: MatchElement = { type: 'Text' };
        expect(matchSelector(getSelectorList('Box, Text, Button'), element)).toBe(true);
      });

      it('should not match if no selector matches', () => {
        const element: MatchElement = { type: 'Input' };
        expect(matchSelector(getSelectorList('Box, Text, Button'), element)).toBe(false);
      });
    });
  });

  describe('Inheritance', () => {
    it('should identify inheritable properties', () => {
      expect(isInheritable('color')).toBe(true);
      expect(isInheritable('font-size')).toBe(true);
      expect(isInheritable('bold')).toBe(true);
    });

    it('should identify non-inheritable properties', () => {
      expect(isInheritable('padding')).toBe(false);
      expect(isInheritable('margin')).toBe(false);
      expect(isInheritable('width')).toBe(false);
    });
  });

  describe('StyleSheet', () => {
    describe('Variable resolution', () => {
      it('should resolve variables in declarations', () => {
        const sheet = createStyleSheet(`
          $primary: blue;
          Box { color: $primary }
        `);

        const styles = sheet.resolveStyles({ type: 'Box' });
        expect(styles.get('color')?.value).toBe('blue');
      });

      it('should resolve chained variables', () => {
        const sheet = createStyleSheet(`
          $base: red;
          $primary: $base;
          Box { color: $primary }
        `);

        const styles = sheet.resolveStyles({ type: 'Box' });
        expect(styles.get('color')?.value).toBe('red');
      });
    });

    describe('Cascade ordering', () => {
      it('should apply later rules over earlier ones', () => {
        const sheet = createStyleSheet(`
          Box { color: red }
          Box { color: blue }
        `);

        const styles = sheet.resolveStyles({ type: 'Box' });
        expect(styles.get('color')?.value).toBe('blue');
      });

      it('should apply higher specificity over lower', () => {
        const sheet = createStyleSheet(`
          Box.primary { color: blue }
          Box { color: red }
        `);

        const styles = sheet.resolveStyles({ type: 'Box', classes: ['primary'] });
        expect(styles.get('color')?.value).toBe('blue');
      });

      it('should respect !important', () => {
        const sheet = createStyleSheet(`
          Box.primary { color: blue }
          Box { color: red !important }
        `);

        const styles = sheet.resolveStyles({ type: 'Box', classes: ['primary'] });
        expect(styles.get('color')?.value).toBe('red');
      });
    });

    describe('Style inheritance', () => {
      it('should inherit inheritable properties', () => {
        const sheet = createStyleSheet(`
          Box { color: red }
        `);

        const parentStyles = sheet.resolveStyles({ type: 'Box' });
        const childStyles = sheet.resolveStyles({ type: 'Text' }, parentStyles);

        expect(childStyles.get('color')?.value).toBe('red');
      });

      it('should not inherit non-inheritable properties', () => {
        const sheet = createStyleSheet(`
          Box { padding: 10 }
        `);

        const parentStyles = sheet.resolveStyles({ type: 'Box' });
        const childStyles = sheet.resolveStyles({ type: 'Text' }, parentStyles);

        expect(childStyles.get('padding')).toBeUndefined();
      });

      it('should override inherited properties', () => {
        const sheet = createStyleSheet(`
          Box { color: red }
          Text { color: blue }
        `);

        const parentStyles = sheet.resolveStyles({ type: 'Box' });
        const childStyles = sheet.resolveStyles({ type: 'Text' }, parentStyles);

        expect(childStyles.get('color')?.value).toBe('blue');
      });
    });

    describe('Media queries', () => {
      it('should apply media query rules when conditions match', () => {
        const sheet = createStyleSheet(`
          Box { padding: 10 }
          @media (min-width: 80) {
            Box { padding: 20 }
          }
        `);

        const styles = sheet.resolveStyles({ type: 'Box' }, undefined, { width: 100 });
        expect(styles.get('padding')?.value).toBe('20');
      });

      it('should not apply media query rules when conditions do not match', () => {
        const sheet = createStyleSheet(`
          Box { padding: 10 }
          @media (min-width: 80) {
            Box { padding: 20 }
          }
        `);

        const styles = sheet.resolveStyles({ type: 'Box' }, undefined, { width: 60 });
        expect(styles.get('padding')?.value).toBe('10');
      });

      it('should apply variables from media queries', () => {
        const sheet = createStyleSheet(`
          $spacing: 10;
          Box { padding: $spacing }
          @media (min-width: 80) {
            $spacing: 20;
          }
        `);

        const styles = sheet.resolveStyles({ type: 'Box' }, undefined, { width: 100 });
        expect(styles.get('padding')?.value).toBe('20');
      });
    });
  });

  describe('Style Props Conversion', () => {
    it('should convert padding properties', () => {
      const sheet = createStyleSheet(`
        Box { padding: 10; padding-top: 5 }
      `);

      const styles = sheet.resolveStyles({ type: 'Box' });
      const props = resolvedStylesToProps(styles);

      expect(props.padding).toBe(10);
      expect(props.paddingTop).toBe(5);
    });

    it('should convert flexbox properties', () => {
      const sheet = createStyleSheet(`
        Box {
          flex-direction: column;
          justify-content: center;
          align-items: stretch;
          flex-grow: 1;
          gap: 5
        }
      `);

      const styles = sheet.resolveStyles({ type: 'Box' });
      const props = resolvedStylesToProps(styles);

      expect(props.flexDirection).toBe('column');
      expect(props.justifyContent).toBe('center');
      expect(props.alignItems).toBe('stretch');
      expect(props.flexGrow).toBe(1);
      expect(props.gap).toBe(5);
    });

    it('should convert text properties', () => {
      const sheet = createStyleSheet(`
        Text {
          color: cyan;
          bold: true;
          italic: true;
          underline: true
        }
      `);

      const styles = sheet.resolveStyles({ type: 'Text' });
      const props = resolvedStylesToProps(styles);

      expect(props.color).toBe('cyan');
      expect(props.bold).toBe(true);
      expect(props.italic).toBe(true);
      expect(props.underline).toBe(true);
    });

    it('should convert dimension properties', () => {
      const sheet = createStyleSheet(`
        Box { width: 50%; height: 100 }
      `);

      const styles = sheet.resolveStyles({ type: 'Box' });
      const props = resolvedStylesToProps(styles);

      expect(props.width).toBe('50%');
      expect(props.height).toBe(100);
    });

    it('should convert border properties', () => {
      const sheet = createStyleSheet(`
        Box {
          border-style: round;
          border-color: cyan
        }
      `);

      const styles = sheet.resolveStyles({ type: 'Box' });
      const props = resolvedStylesToProps(styles);

      expect(props.borderStyle).toBe('round');
      expect(props.borderColor).toBe('cyan');
    });
  });

  describe('applyStyles convenience function', () => {
    it('should apply styles from source string', () => {
      const props = applyStyles(
        'Box { color: red; padding: 10 }',
        { type: 'Box' }
      );

      expect(props.color).toBe('red');
      expect(props.padding).toBe(10);
    });

    it('should apply styles from StyleSheet instance', () => {
      const sheet = createStyleSheet('Box { color: blue }');
      const props = applyStyles(sheet, { type: 'Box' });

      expect(props.color).toBe('blue');
    });
  });
});
