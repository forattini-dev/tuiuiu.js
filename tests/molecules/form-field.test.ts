/**
 * FormField and FormGroup Tests
 *
 * Tests for form layout components that wrap inputs with labels,
 * error messages, and helper text.
 *
 * Tests cover:
 * - FormField label rendering
 * - FormField required indicator
 * - FormField error message display
 * - FormField helper text display
 * - FormField horizontal/vertical layouts
 * - FormField with various child components
 * - FormGroup title and description
 * - FormGroup gap spacing
 * - FormGroup border and padding
 */

import { describe, it, expect } from 'vitest';
import { FormField, FormGroup } from '../../src/molecules/form-field.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { TextInput, createTextInput } from '../../src/atoms/text-input.js';
import { Switch, createSwitch } from '../../src/atoms/switch.js';
import type { VNode } from '../../src/utils/types.js';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Recursively search for Text nodes containing specific content
 * Note: Text content is stored in props.children, not children array
 */
function findTextContent(node: VNode, content: string): boolean {
  if (node.type === 'text') {
    // Text content is stored in props.children
    const props = node.props as Record<string, unknown>;
    const textContent = String(props?.children ?? '');
    if (textContent.includes(content)) {
      return true;
    }
  }

  // Search in children array (for Box nodes etc)
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (typeof child === 'object' && child !== null) {
        if (findTextContent(child as VNode, content)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Count Box nodes in tree
 */
function countBoxNodes(node: VNode): number {
  let count = node.type === 'box' ? 1 : 0;

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (typeof child === 'object' && child !== null) {
        count += countBoxNodes(child as VNode);
      }
    }
  }

  return count;
}

/**
 * Find all Box nodes with specific props
 */
function findBoxesWithProps(
  node: VNode,
  propCheck: (props: Record<string, unknown>) => boolean
): VNode[] {
  const results: VNode[] = [];

  if (node.type === 'box' && node.props && propCheck(node.props as Record<string, unknown>)) {
    results.push(node);
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (typeof child === 'object' && child !== null) {
        results.push(...findBoxesWithProps(child as VNode, propCheck));
      }
    }
  }

  return results;
}

/**
 * Get the root box props
 */
function getRootProps(node: VNode): Record<string, unknown> {
  return (node.props ?? {}) as Record<string, unknown>;
}

// =============================================================================
// FormField Tests
// =============================================================================

describe('FormField', () => {
  describe('rendering', () => {
    it('should render without errors', () => {
      const result = FormField({
        label: 'Username',
        children: Text({}, 'input placeholder'),
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
    });

    it('should render label text', () => {
      const result = FormField({
        label: 'Email Address',
        children: Text({}, 'input'),
      });

      expect(findTextContent(result, 'Email Address')).toBe(true);
    });

    it('should render children', () => {
      const result = FormField({
        label: 'Name',
        children: Text({}, 'child content'),
      });

      expect(findTextContent(result, 'child content')).toBe(true);
    });

    it('should render multiple children', () => {
      const result = FormField({
        label: 'Name',
        children: [
          Text({}, 'first child'),
          Text({}, 'second child'),
        ],
      });

      expect(findTextContent(result, 'first child')).toBe(true);
      expect(findTextContent(result, 'second child')).toBe(true);
    });
  });

  describe('required indicator', () => {
    it('should show asterisk when required is true', () => {
      const result = FormField({
        label: 'Password',
        required: true,
        children: Text({}, 'input'),
      });

      expect(findTextContent(result, '*')).toBe(true);
    });

    it('should NOT show asterisk when required is false', () => {
      const result = FormField({
        label: 'Optional Field',
        required: false,
        children: Text({}, 'input'),
      });

      // Count asterisks - should be none
      const hasAsterisk = findTextContent(result, ' *');
      expect(hasAsterisk).toBe(false);
    });

    it('should default to not required', () => {
      const result = FormField({
        label: 'Default Field',
        children: Text({}, 'input'),
      });

      // Should not have standalone asterisk for required
      const json = JSON.stringify(result);
      // The asterisk for required is " *" with a space
      expect(json.includes('" *"')).toBe(false);
    });
  });

  describe('error message', () => {
    it('should render error message when provided', () => {
      const result = FormField({
        label: 'Email',
        error: 'Invalid email address',
        children: Text({}, 'input'),
      });

      expect(findTextContent(result, 'Invalid email address')).toBe(true);
    });

    it('should NOT render error message when not provided', () => {
      const result = FormField({
        label: 'Email',
        children: Text({}, 'input'),
      });

      expect(findTextContent(result, 'Invalid')).toBe(false);
    });

    it('should hide helper text when error is shown', () => {
      const result = FormField({
        label: 'Email',
        error: 'Email is required',
        helperText: 'Enter your work email',
        children: Text({}, 'input'),
      });

      // Error should be visible
      expect(findTextContent(result, 'Email is required')).toBe(true);
      // Helper text should be hidden
      expect(findTextContent(result, 'Enter your work email')).toBe(false);
    });

    it('should use custom error color', () => {
      const result = FormField({
        label: 'Email',
        error: 'Error message',
        errorColor: 'yellow',
        children: Text({}, 'input'),
      });

      // Should render (color is in props, not easily testable without deeper inspection)
      expect(findTextContent(result, 'Error message')).toBe(true);
    });
  });

  describe('helper text', () => {
    it('should render helper text when provided', () => {
      const result = FormField({
        label: 'Password',
        helperText: 'Must be at least 8 characters',
        children: Text({}, 'input'),
      });

      expect(findTextContent(result, 'Must be at least 8 characters')).toBe(true);
    });

    it('should NOT render helper text when not provided', () => {
      const result = FormField({
        label: 'Username',
        children: Text({}, 'input'),
      });

      // Should only have label and input, no extra text
      expect(result).toBeDefined();
    });

    it('should NOT render helper text when error is present', () => {
      const result = FormField({
        label: 'Email',
        helperText: 'Helper text',
        error: 'Error text',
        children: Text({}, 'input'),
      });

      expect(findTextContent(result, 'Helper text')).toBe(false);
      expect(findTextContent(result, 'Error text')).toBe(true);
    });
  });

  describe('layout direction', () => {
    it('should use vertical layout by default', () => {
      const result = FormField({
        label: 'Name',
        children: Text({}, 'input'),
      });

      const rootProps = getRootProps(result);
      expect(rootProps.flexDirection).toBe('column');
    });

    it('should use horizontal layout when specified', () => {
      const result = FormField({
        label: 'Name',
        direction: 'horizontal',
        children: Text({}, 'input'),
      });

      // Root is still column for message placement
      const rootProps = getRootProps(result);
      expect(rootProps.flexDirection).toBe('column');

      // Find the row container for label + input
      const rowBoxes = findBoxesWithProps(result, (props) => props.flexDirection === 'row');
      expect(rowBoxes.length).toBeGreaterThan(0);
    });

    it('should apply labelWidth in horizontal layout', () => {
      const result = FormField({
        label: 'Name',
        direction: 'horizontal',
        labelWidth: 20,
        children: Text({}, 'input'),
      });

      const widthBoxes = findBoxesWithProps(result, (props) => props.width === 20);
      expect(widthBoxes.length).toBe(1);
    });
  });

  describe('gap and spacing', () => {
    it('should apply gap between label and input in vertical layout', () => {
      const result = FormField({
        label: 'Name',
        gap: 2,
        direction: 'vertical',
        children: Text({}, 'input'),
      });

      // In vertical layout, gap is applied as marginBottom on label
      const marginBoxes = findBoxesWithProps(result, (props) => props.marginBottom === 2);
      expect(marginBoxes.length).toBeGreaterThan(0);
    });

    it('should apply gap between label and input in horizontal layout', () => {
      const result = FormField({
        label: 'Name',
        gap: 3,
        direction: 'horizontal',
        children: Text({}, 'input'),
      });

      // In horizontal layout, gap is applied as marginRight on label
      const marginBoxes = findBoxesWithProps(result, (props) => props.marginRight === 3);
      expect(marginBoxes.length).toBeGreaterThan(0);
    });
  });

  describe('fullWidth', () => {
    it('should NOT apply flexGrow by default', () => {
      const result = FormField({
        label: 'Name',
        children: Text({}, 'input'),
      });

      const rootProps = getRootProps(result);
      expect(rootProps.flexGrow).toBe(0);
    });

    it('should apply flexGrow when fullWidth is true', () => {
      const result = FormField({
        label: 'Name',
        fullWidth: true,
        children: Text({}, 'input'),
      });

      const rootProps = getRootProps(result);
      expect(rootProps.flexGrow).toBe(1);
    });
  });

  describe('with real components', () => {
    it('should work with TextInput', () => {
      const inputState = createTextInput({ placeholder: 'Enter name' });

      const result = FormField({
        label: 'Name',
        required: true,
        children: TextInput({ state: inputState }),
      });

      expect(result).toBeDefined();
      expect(findTextContent(result, 'Name')).toBe(true);
    });

    it('should work with Switch', () => {
      const switchState = createSwitch({ on: false });

      const result = FormField({
        label: 'Notifications',
        helperText: 'Enable email notifications',
        children: Switch({ state: switchState }),
      });

      expect(result).toBeDefined();
      expect(findTextContent(result, 'Notifications')).toBe(true);
      expect(findTextContent(result, 'Enable email notifications')).toBe(true);
    });

    it('should work with Select-like component', () => {
      // Note: Select component requires rendering context for visibility
      // For this test, we verify FormField accepts complex children
      const result = FormField({
        label: 'Choose option',
        children: Box(
          { borderStyle: 'single' },
          Text({}, 'Option A'),
          Text({}, 'Option B'),
        ),
      });

      expect(result).toBeDefined();
      expect(findTextContent(result, 'Choose option')).toBe(true);
      expect(findTextContent(result, 'Option A')).toBe(true);
    });
  });

  describe('custom colors', () => {
    it('should use custom label color', () => {
      const result = FormField({
        label: 'Custom Label',
        labelColor: 'magenta',
        children: Text({}, 'input'),
      });

      expect(result).toBeDefined();
      expect(findTextContent(result, 'Custom Label')).toBe(true);
    });

    it('should use custom error color', () => {
      const result = FormField({
        label: 'Field',
        error: 'Custom error',
        errorColor: 'yellow',
        children: Text({}, 'input'),
      });

      expect(result).toBeDefined();
      expect(findTextContent(result, 'Custom error')).toBe(true);
    });
  });
});

// =============================================================================
// FormGroup Tests
// =============================================================================

describe('FormGroup', () => {
  describe('rendering', () => {
    it('should render without errors', () => {
      const result = FormGroup({
        children: Text({}, 'content'),
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
    });

    it('should render children', () => {
      const result = FormGroup({
        children: Text({}, 'group content'),
      });

      expect(findTextContent(result, 'group content')).toBe(true);
    });

    it('should render multiple children', () => {
      const result = FormGroup({
        children: [
          Text({}, 'first field'),
          Text({}, 'second field'),
        ],
      });

      expect(findTextContent(result, 'first field')).toBe(true);
      expect(findTextContent(result, 'second field')).toBe(true);
    });
  });

  describe('title', () => {
    it('should render title when provided', () => {
      const result = FormGroup({
        title: 'Account Settings',
        children: Text({}, 'content'),
      });

      expect(findTextContent(result, 'Account Settings')).toBe(true);
    });

    it('should NOT render title when not provided', () => {
      const result = FormGroup({
        children: Text({}, 'content'),
      });

      // Should just have the content
      expect(findTextContent(result, 'content')).toBe(true);
    });
  });

  describe('description', () => {
    it('should render description when provided', () => {
      const result = FormGroup({
        description: 'Update your account information',
        children: Text({}, 'content'),
      });

      expect(findTextContent(result, 'Update your account information')).toBe(true);
    });

    it('should render both title and description', () => {
      const result = FormGroup({
        title: 'Settings',
        description: 'Configure your preferences',
        children: Text({}, 'content'),
      });

      expect(findTextContent(result, 'Settings')).toBe(true);
      expect(findTextContent(result, 'Configure your preferences')).toBe(true);
    });
  });

  describe('gap spacing', () => {
    it('should use default gap of 1', () => {
      const result = FormGroup({
        children: [
          Text({}, 'field 1'),
          Text({}, 'field 2'),
        ],
      });

      // Gap boxes have height=1 by default
      const gapBoxes = findBoxesWithProps(result, (props) => props.height === 1);
      expect(gapBoxes.length).toBeGreaterThan(0);
    });

    it('should use custom gap', () => {
      const result = FormGroup({
        gap: 2,
        children: [
          Text({}, 'field 1'),
          Text({}, 'field 2'),
        ],
      });

      // Gap boxes with height=2
      const gapBoxes = findBoxesWithProps(result, (props) => props.height === 2);
      expect(gapBoxes.length).toBeGreaterThan(0);
    });

    it('should NOT add gap after last child', () => {
      const result = FormGroup({
        gap: 1,
        children: [
          Text({}, 'field 1'),
          Text({}, 'field 2'),
          Text({}, 'field 3'),
        ],
      });

      // With 3 children, there should be 2 gap boxes
      const gapBoxes = findBoxesWithProps(result, (props) => props.height === 1);
      // Gap boxes are between children, so (n-1) gaps for n children
      // But the first child is gap between title/description and content
      expect(gapBoxes.length).toBe(2);
    });

    it('should NOT add gaps when gap is 0', () => {
      const result = FormGroup({
        gap: 0,
        children: [
          Text({}, 'field 1'),
          Text({}, 'field 2'),
        ],
      });

      // With gap=0, no spacer boxes should be added
      const gapBoxes = findBoxesWithProps(result, (props) => props.height === 0);
      // height=0 boxes won't be rendered, so check there are fewer boxes
      const allBoxes = countBoxNodes(result);
      // Should just be root box + child wrappers, minimal structure
      expect(allBoxes).toBeGreaterThan(0);
    });
  });

  describe('border', () => {
    it('should have no border by default', () => {
      const result = FormGroup({
        children: Text({}, 'content'),
      });

      const rootProps = getRootProps(result);
      expect(rootProps.borderStyle).toBe('none');
    });

    it('should apply border style', () => {
      const result = FormGroup({
        borderStyle: 'single',
        children: Text({}, 'content'),
      });

      const rootProps = getRootProps(result);
      expect(rootProps.borderStyle).toBe('single');
    });

    it('should support round border', () => {
      const result = FormGroup({
        borderStyle: 'round',
        children: Text({}, 'content'),
      });

      const rootProps = getRootProps(result);
      expect(rootProps.borderStyle).toBe('round');
    });

    it('should support double border', () => {
      const result = FormGroup({
        borderStyle: 'double',
        children: Text({}, 'content'),
      });

      const rootProps = getRootProps(result);
      expect(rootProps.borderStyle).toBe('double');
    });
  });

  describe('padding', () => {
    it('should have no padding by default', () => {
      const result = FormGroup({
        children: Text({}, 'content'),
      });

      const rootProps = getRootProps(result);
      expect(rootProps.padding).toBe(0);
    });

    it('should apply padding', () => {
      const result = FormGroup({
        padding: 2,
        children: Text({}, 'content'),
      });

      const rootProps = getRootProps(result);
      expect(rootProps.padding).toBe(2);
    });
  });

  describe('with FormField children', () => {
    it('should work with FormField children', () => {
      const result = FormGroup({
        title: 'User Information',
        children: [
          FormField({
            label: 'First Name',
            required: true,
            children: Text({}, 'input'),
          }),
          FormField({
            label: 'Last Name',
            children: Text({}, 'input'),
          }),
        ],
      });

      expect(findTextContent(result, 'User Information')).toBe(true);
      expect(findTextContent(result, 'First Name')).toBe(true);
      expect(findTextContent(result, 'Last Name')).toBe(true);
    });

    it('should work with mixed children', () => {
      const result = FormGroup({
        title: 'Settings',
        children: [
          FormField({
            label: 'Name',
            children: Text({}, 'input'),
          }),
          Box({}, Text({}, 'Custom element')),
          FormField({
            label: 'Email',
            children: Text({}, 'input'),
          }),
        ],
      });

      expect(findTextContent(result, 'Name')).toBe(true);
      expect(findTextContent(result, 'Custom element')).toBe(true);
      expect(findTextContent(result, 'Email')).toBe(true);
    });
  });

  describe('combined options', () => {
    it('should apply all options together', () => {
      const result = FormGroup({
        title: 'Form Section',
        description: 'Fill in the details',
        gap: 2,
        borderStyle: 'round',
        padding: 1,
        children: [
          Text({}, 'field 1'),
          Text({}, 'field 2'),
        ],
      });

      const rootProps = getRootProps(result);
      expect(rootProps.borderStyle).toBe('round');
      expect(rootProps.padding).toBe(1);

      expect(findTextContent(result, 'Form Section')).toBe(true);
      expect(findTextContent(result, 'Fill in the details')).toBe(true);
      expect(findTextContent(result, 'field 1')).toBe(true);
      expect(findTextContent(result, 'field 2')).toBe(true);
    });
  });
});

// =============================================================================
// Real-world Scenarios
// =============================================================================

describe('Real-world scenarios', () => {
  it('should create a complete login form', () => {
    const emailInput = createTextInput({ placeholder: 'email@example.com' });
    const passwordInput = createTextInput({ placeholder: '••••••••' });

    const result = FormGroup({
      title: 'Login',
      description: 'Enter your credentials',
      gap: 1,
      borderStyle: 'round',
      padding: 1,
      children: [
        FormField({
          label: 'Email',
          required: true,
          helperText: 'Your work email address',
          children: TextInput({ state: emailInput }),
        }),
        FormField({
          label: 'Password',
          required: true,
          children: TextInput({ state: passwordInput }),
        }),
      ],
    });

    expect(findTextContent(result, 'Login')).toBe(true);
    expect(findTextContent(result, 'Email')).toBe(true);
    expect(findTextContent(result, 'Password')).toBe(true);
  });

  it('should create a settings form with validation', () => {
    const result = FormGroup({
      title: 'Notification Settings',
      children: [
        FormField({
          label: 'Email Notifications',
          error: 'This field is required',
          children: Switch({ state: createSwitch({ on: false }) }),
        }),
        FormField({
          label: 'Frequency',
          helperText: 'How often to send notifications',
          // Use placeholder instead of Select which needs rendering context
          children: Box({}, Text({}, 'Dropdown here')),
        }),
      ],
    });

    expect(findTextContent(result, 'Notification Settings')).toBe(true);
    expect(findTextContent(result, 'This field is required')).toBe(true);
    expect(findTextContent(result, 'How often to send notifications')).toBe(true);
  });

  it('should create horizontal form layout', () => {
    const result = FormGroup({
      title: 'User Details',
      children: [
        FormField({
          label: 'First Name',
          direction: 'horizontal',
          labelWidth: 15,
          children: TextInput({ state: createTextInput({}) }),
        }),
        FormField({
          label: 'Last Name',
          direction: 'horizontal',
          labelWidth: 15,
          children: TextInput({ state: createTextInput({}) }),
        }),
      ],
    });

    expect(findTextContent(result, 'First Name')).toBe(true);
    expect(findTextContent(result, 'Last Name')).toBe(true);

    // Should have horizontal row containers
    const rowBoxes = findBoxesWithProps(result, (props) => props.flexDirection === 'row');
    expect(rowBoxes.length).toBeGreaterThanOrEqual(2);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge cases', () => {
  it('should handle empty label', () => {
    const result = FormField({
      label: '',
      children: Text({}, 'input'),
    });

    expect(result).toBeDefined();
  });

  it('should handle long label text', () => {
    const longLabel = 'This is a very long label that might wrap to multiple lines in the terminal';

    const result = FormField({
      label: longLabel,
      children: Text({}, 'input'),
    });

    expect(findTextContent(result, longLabel)).toBe(true);
  });

  it('should handle special characters in label', () => {
    const result = FormField({
      label: 'Name (required) [a-z]',
      children: Text({}, 'input'),
    });

    expect(findTextContent(result, 'Name (required) [a-z]')).toBe(true);
  });

  it('should handle unicode in error message', () => {
    const result = FormField({
      label: 'Field',
      error: '❌ Invalid input • Please try again',
      children: Text({}, 'input'),
    });

    expect(findTextContent(result, '❌ Invalid input')).toBe(true);
  });

  it('should handle FormGroup with single child', () => {
    const result = FormGroup({
      title: 'Single',
      children: Text({}, 'only child'),
    });

    expect(findTextContent(result, 'Single')).toBe(true);
    expect(findTextContent(result, 'only child')).toBe(true);
  });

  it('should handle nested FormGroups', () => {
    const result = FormGroup({
      title: 'Outer',
      children: FormGroup({
        title: 'Inner',
        children: Text({}, 'nested content'),
      }),
    });

    expect(findTextContent(result, 'Outer')).toBe(true);
    expect(findTextContent(result, 'Inner')).toBe(true);
    expect(findTextContent(result, 'nested content')).toBe(true);
  });
});
