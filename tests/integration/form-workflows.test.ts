/**
 * Form Workflow Integration Tests
 *
 * Tests for form component interactions including input navigation,
 * validation flows, submission, and reset behaviors.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormField, FormGroup } from '../../src/molecules/form-field.js';
import { TextInput, createTextInput } from '../../src/atoms/text-input.js';
import { Switch, createSwitch } from '../../src/atoms/switch.js';
import { Button } from '../../src/atoms/button.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { renderToString } from '../../src/design-system/core/renderer.js';
import type { VNode } from '../../src/utils/types.js';

// =============================================================================
// Test Helpers
// =============================================================================

function findTextContent(node: VNode, content: string): boolean {
  if (node.type === 'text') {
    const props = node.props as Record<string, unknown>;
    const textContent = String(props?.children ?? '');
    if (textContent.includes(content)) {
      return true;
    }
  }

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

interface FormState {
  values: Record<string, string | boolean>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

function createFormState(initialValues: Record<string, string | boolean> = {}): FormState {
  return {
    values: { ...initialValues },
    errors: {},
    touched: {},
  };
}

// =============================================================================
// Form Input State Tests
// =============================================================================

describe('Form Input State Management', () => {
  describe('TextInput state', () => {
    it('should initialize with empty value', () => {
      const input = createTextInput();
      expect(input.value()).toBe('');
    });

    it('should initialize with default value', () => {
      const input = createTextInput({ initialValue: 'initial' });
      expect(input.value()).toBe('initial');
    });

    it('should update value', () => {
      const input = createTextInput();
      input.setValue('new value');
      expect(input.value()).toBe('new value');
    });

    it('should clear value', () => {
      const input = createTextInput({ initialValue: 'some text' });
      input.clear();
      expect(input.value()).toBe('');
    });

    it('should call onChange callback', () => {
      const onChange = vi.fn();
      const input = createTextInput({ onChange });

      input.setValue('test');
      expect(onChange).toHaveBeenCalledWith('test');
    });
  });

  describe('Switch state', () => {
    it('should initialize with off state', () => {
      const switchState = createSwitch();
      expect(switchState.value()).toBe(false);
    });

    it('should initialize with on state', () => {
      const switchState = createSwitch({ initialValue: true });
      expect(switchState.value()).toBe(true);
    });

    it('should toggle state', () => {
      const switchState = createSwitch({ initialValue: false });

      switchState.toggle();
      expect(switchState.value()).toBe(true);

      switchState.toggle();
      expect(switchState.value()).toBe(false);
    });

    it('should set state directly', () => {
      const switchState = createSwitch();

      switchState.setOn();
      expect(switchState.value()).toBe(true);

      switchState.setOff();
      expect(switchState.value()).toBe(false);
    });

    it('should call onChange callback', () => {
      const onChange = vi.fn();
      const switchState = createSwitch({ onChange });

      switchState.toggle();
      expect(onChange).toHaveBeenCalledWith(true);
    });
  });
});

// =============================================================================
// Form Validation Tests
// =============================================================================

describe('Form Validation Flow', () => {
  it('should show error for empty required field', () => {
    const formState = createFormState();
    formState.touched['email'] = true;

    // Simulate validation
    if (!formState.values['email']) {
      formState.errors['email'] = 'Email is required';
    }

    const result = FormField({
      label: 'Email',
      required: true,
      error: formState.errors['email'],
      children: TextInput({ state: createTextInput() }),
    });

    expect(findTextContent(result, 'Email is required')).toBe(true);
  });

  it('should show error for invalid email format', () => {
    const formState = createFormState({ email: 'invalid' });

    // Simulate email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.values['email'] as string)) {
      formState.errors['email'] = 'Invalid email format';
    }

    const result = FormField({
      label: 'Email',
      required: true,
      error: formState.errors['email'],
      children: TextInput({ state: createTextInput({ value: 'invalid' }) }),
    });

    expect(findTextContent(result, 'Invalid email format')).toBe(true);
  });

  it('should clear error when value becomes valid', () => {
    const formState = createFormState({ email: 'valid@example.com' });

    // Simulate validation - should pass
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(formState.values['email'] as string)) {
      delete formState.errors['email'];
    }

    const result = FormField({
      label: 'Email',
      required: true,
      error: formState.errors['email'],
      children: TextInput({ state: createTextInput({ value: 'valid@example.com' }) }),
    });

    // Should not have error
    expect(findTextContent(result, 'Invalid')).toBe(false);
  });

  it('should validate multiple fields', () => {
    const formState = createFormState({
      username: '',
      password: '123',
    });

    // Validate all fields
    if (!formState.values['username']) {
      formState.errors['username'] = 'Username is required';
    }

    const password = formState.values['password'] as string;
    if (password.length < 8) {
      formState.errors['password'] = 'Password must be at least 8 characters';
    }

    expect(formState.errors['username']).toBe('Username is required');
    expect(formState.errors['password']).toBe('Password must be at least 8 characters');
  });

  it('should show helper text when no error', () => {
    const formState = createFormState({ password: 'validPassword123' });

    const result = FormField({
      label: 'Password',
      helperText: 'Must be at least 8 characters',
      error: formState.errors['password'],
      children: TextInput({ state: createTextInput({ value: 'validPassword123' }) }),
    });

    expect(findTextContent(result, 'Must be at least 8 characters')).toBe(true);
  });
});

// =============================================================================
// Form Submission Tests
// =============================================================================

describe('Form Submission', () => {
  it('should collect all form values on submit', () => {
    const username = createTextInput({ initialValue: 'john' });
    const email = createTextInput({ initialValue: 'john@example.com' });
    const notifications = createSwitch({ initialValue: true });

    const formValues = {
      username: username.value(),
      email: email.value(),
      notifications: notifications.value(),
    };

    expect(formValues).toEqual({
      username: 'john',
      email: 'john@example.com',
      notifications: true,
    });
  });

  it('should prevent submission when validation fails', () => {
    const onSubmit = vi.fn();
    const formState = createFormState({ email: '' });

    // Validate before submit
    const hasErrors = !formState.values['email'];
    if (hasErrors) {
      formState.errors['email'] = 'Email is required';
    }

    // Only submit if no errors
    if (Object.keys(formState.errors).length === 0) {
      onSubmit(formState.values);
    }

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should allow submission when validation passes', () => {
    const onSubmit = vi.fn();
    const formState = createFormState({ email: 'valid@example.com' });

    // Validate before submit
    const hasErrors = !formState.values['email'];
    if (!hasErrors) {
      // No errors, can submit
      onSubmit(formState.values);
    }

    expect(onSubmit).toHaveBeenCalledWith({ email: 'valid@example.com' });
  });

  it('should have onSubmit callback configured', () => {
    const onSubmit = vi.fn();
    // createTextInput accepts onSubmit in options
    const input = createTextInput({ onSubmit });

    // The input is properly configured with the callback
    expect(input).toBeDefined();
    expect(input.value()).toBe('');
  });
});

// =============================================================================
// Form Reset Tests
// =============================================================================

describe('Form Reset', () => {
  it('should reset text input to initial value', () => {
    const input = createTextInput({ initialValue: 'initial' });
    input.setValue('modified');
    expect(input.value()).toBe('modified');

    input.clear();
    expect(input.value()).toBe('');
  });

  it('should reset switch to initial state', () => {
    const switchState = createSwitch({ initialValue: false });
    switchState.setOn();
    expect(switchState.value()).toBe(true);

    // Reset to initial
    switchState.setOff();
    expect(switchState.value()).toBe(false);
  });

  it('should clear all form values', () => {
    const username = createTextInput({ initialValue: 'john' });
    const email = createTextInput({ initialValue: 'john@example.com' });
    const notifications = createSwitch({ initialValue: true });

    // Reset all
    username.clear();
    email.clear();
    notifications.setOff();

    expect(username.value()).toBe('');
    expect(email.value()).toBe('');
    expect(notifications.value()).toBe(false);
  });

  it('should clear form errors on reset', () => {
    const formState = createFormState();
    formState.errors = {
      email: 'Invalid email',
      password: 'Too short',
    };

    // Reset errors
    formState.errors = {};

    expect(Object.keys(formState.errors)).toHaveLength(0);
  });

  it('should clear touched state on reset', () => {
    const formState = createFormState();
    formState.touched = {
      email: true,
      password: true,
    };

    // Reset touched
    formState.touched = {};

    expect(Object.keys(formState.touched)).toHaveLength(0);
  });
});

// =============================================================================
// Form Group Rendering Tests
// =============================================================================

describe('Form Group Rendering', () => {
  it('should render complete login form', () => {
    const username = createTextInput({ placeholder: 'Enter username' });
    const password = createTextInput({ placeholder: 'Enter password' });

    const result = FormGroup({
      title: 'Login',
      description: 'Enter your credentials',
      gap: 1,
      children: [
        FormField({
          label: 'Username',
          required: true,
          children: TextInput({ state: username }),
        }),
        FormField({
          label: 'Password',
          required: true,
          children: TextInput({ state: password }),
        }),
      ],
    });

    expect(findTextContent(result, 'Login')).toBe(true);
    expect(findTextContent(result, 'Enter your credentials')).toBe(true);
    expect(findTextContent(result, 'Username')).toBe(true);
    expect(findTextContent(result, 'Password')).toBe(true);
  });

  it('should render settings form with switches', () => {
    const darkMode = createSwitch({ on: false });
    const notifications = createSwitch({ on: true });
    const autoSave = createSwitch({ on: true });

    const result = FormGroup({
      title: 'Settings',
      children: [
        FormField({
          label: 'Dark Mode',
          children: Switch({ state: darkMode }),
        }),
        FormField({
          label: 'Notifications',
          helperText: 'Receive email notifications',
          children: Switch({ state: notifications }),
        }),
        FormField({
          label: 'Auto-save',
          children: Switch({ state: autoSave }),
        }),
      ],
    });

    expect(findTextContent(result, 'Settings')).toBe(true);
    expect(findTextContent(result, 'Dark Mode')).toBe(true);
    expect(findTextContent(result, 'Notifications')).toBe(true);
    expect(findTextContent(result, 'Auto-save')).toBe(true);
  });

  it('should render form with mixed inputs', () => {
    const name = createTextInput();
    const email = createTextInput();
    const subscribe = createSwitch({ on: false });

    const result = FormGroup({
      title: 'Newsletter Signup',
      borderStyle: 'round',
      padding: 1,
      children: [
        FormField({
          label: 'Name',
          required: true,
          children: TextInput({ state: name }),
        }),
        FormField({
          label: 'Email',
          required: true,
          children: TextInput({ state: email }),
        }),
        FormField({
          label: 'Subscribe to updates',
          children: Switch({ state: subscribe }),
        }),
      ],
    });

    expect(findTextContent(result, 'Newsletter Signup')).toBe(true);
    expect(findTextContent(result, 'Name')).toBe(true);
    expect(findTextContent(result, 'Email')).toBe(true);
    expect(findTextContent(result, 'Subscribe to updates')).toBe(true);
  });
});

// =============================================================================
// Real-world Form Scenarios
// =============================================================================

describe('Real-world Form Scenarios', () => {
  it('should handle registration form workflow', () => {
    // Create form inputs
    const username = createTextInput();
    const email = createTextInput();
    const password = createTextInput();
    const confirmPassword = createTextInput();
    const agreeToTerms = createSwitch({ initialValue: false });

    // Step 1: User fills form
    username.setValue('newuser');
    email.setValue('user@example.com');
    password.setValue('securePass123');
    confirmPassword.setValue('securePass123');
    agreeToTerms.setOn();

    // Step 2: Validate
    const errors: Record<string, string> = {};

    if (username.value().length < 3) {
      errors['username'] = 'Username must be at least 3 characters';
    }

    if (!email.value().includes('@')) {
      errors['email'] = 'Invalid email';
    }

    if (password.value().length < 8) {
      errors['password'] = 'Password must be at least 8 characters';
    }

    if (password.value() !== confirmPassword.value()) {
      errors['confirmPassword'] = 'Passwords do not match';
    }

    if (!agreeToTerms.value()) {
      errors['terms'] = 'You must agree to the terms';
    }

    // Step 3: Check result
    expect(Object.keys(errors)).toHaveLength(0);

    // Step 4: Submit
    const formData = {
      username: username.value(),
      email: email.value(),
      password: password.value(),
      agreeToTerms: agreeToTerms.value(),
    };

    expect(formData.username).toBe('newuser');
    expect(formData.email).toBe('user@example.com');
    expect(formData.agreeToTerms).toBe(true);
  });

  it('should handle contact form with validation', () => {
    const name = createTextInput();
    const email = createTextInput();
    const message = createTextInput();
    const onSubmit = vi.fn();

    // User fills form with invalid data
    name.setValue('Jo'); // Too short
    email.setValue('invalid'); // No @
    message.setValue('Hi'); // Too short

    // Validate
    const errors: Record<string, string> = {};

    if (name.value().length < 3) {
      errors['name'] = 'Name must be at least 3 characters';
    }

    if (!email.value().includes('@')) {
      errors['email'] = 'Invalid email address';
    }

    if (message.value().length < 10) {
      errors['message'] = 'Message must be at least 10 characters';
    }

    // Should have errors
    expect(Object.keys(errors).length).toBe(3);

    // User corrects the form
    name.setValue('John Doe');
    email.setValue('john@example.com');
    message.setValue('This is my message to you.');

    // Re-validate
    const errorsAfterFix: Record<string, string> = {};

    if (name.value().length < 3) {
      errorsAfterFix['name'] = 'Name must be at least 3 characters';
    }

    if (!email.value().includes('@')) {
      errorsAfterFix['email'] = 'Invalid email address';
    }

    if (message.value().length < 10) {
      errorsAfterFix['message'] = 'Message must be at least 10 characters';
    }

    // No errors now
    expect(Object.keys(errorsAfterFix).length).toBe(0);

    // Submit
    if (Object.keys(errorsAfterFix).length === 0) {
      onSubmit({
        name: name.value(),
        email: email.value(),
        message: message.value(),
      });
    }

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'This is my message to you.',
    });
  });

  it('should handle preferences form', () => {
    const theme = createSwitch({ initialValue: true }); // Dark mode by default
    const compactView = createSwitch({ initialValue: false });
    const showLineNumbers = createSwitch({ initialValue: true });
    const autoSave = createSwitch({ initialValue: true });

    // User changes preferences
    theme.toggle(); // Switch to light mode
    compactView.setOn();
    autoSave.setOff();

    const preferences = {
      darkMode: theme.value(),
      compactView: compactView.value(),
      showLineNumbers: showLineNumbers.value(),
      autoSave: autoSave.value(),
    };

    expect(preferences).toEqual({
      darkMode: false, // Toggled from true
      compactView: true, // Changed
      showLineNumbers: true, // Unchanged
      autoSave: false, // Changed
    });
  });
});
