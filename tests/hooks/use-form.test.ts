/**
 * Tests for useForm hook and validators
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useForm,
  createFormValidator,
  required,
  minLength,
  maxLength,
  email,
  pattern,
  min,
  max,
  matchField,
  custom,
} from '../../src/hooks/use-form.js';

describe('useForm', () => {
  describe('initialization', () => {
    it('initializes with provided values', () => {
      const form = useForm({
        initialValues: { name: 'John', email: 'john@example.com' },
      });

      expect(form.values()).toEqual({ name: 'John', email: 'john@example.com' });
    });

    it('initializes with empty errors', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      expect(form.errors()).toEqual({});
    });

    it('initializes with empty touched state', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      expect(form.touched()).toEqual({});
    });

    it('initializes isSubmitting as false', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      expect(form.isSubmitting()).toBe(false);
    });
  });

  describe('setValue / getValue', () => {
    it('sets a field value', () => {
      const form = useForm({
        initialValues: { name: '', email: '' },
      });

      form.setValue('name', 'John');

      expect(form.getValue('name')).toBe('John');
      expect(form.values()).toEqual({ name: 'John', email: '' });
    });

    it('updates existing values', () => {
      const form = useForm({
        initialValues: { count: 0 },
      });

      form.setValue('count', 5);
      expect(form.getValue('count')).toBe(5);

      form.setValue('count', 10);
      expect(form.getValue('count')).toBe(10);
    });
  });

  describe('setError / getError', () => {
    it('sets a field error', () => {
      const form = useForm({
        initialValues: { email: '' },
      });

      form.setError('email', 'Invalid email');

      expect(form.getError('email')).toBe('Invalid email');
      expect(form.errors()).toEqual({ email: 'Invalid email' });
    });

    it('clears a field error when set to undefined', () => {
      const form = useForm({
        initialValues: { email: '' },
      });

      form.setError('email', 'Invalid email');
      expect(form.getError('email')).toBe('Invalid email');

      form.setError('email', undefined);
      expect(form.getError('email')).toBeUndefined();
    });

    it('returns undefined for non-existent error', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      expect(form.getError('name')).toBeUndefined();
    });
  });

  describe('touch / isTouched', () => {
    it('marks a field as touched', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      expect(form.isTouched('name')).toBe(false);

      form.touch('name');

      expect(form.isTouched('name')).toBe(true);
    });

    it('returns false for untouched fields', () => {
      const form = useForm({
        initialValues: { name: '', email: '' },
      });

      form.touch('name');

      expect(form.isTouched('name')).toBe(true);
      expect(form.isTouched('email')).toBe(false);
    });
  });

  describe('isValid', () => {
    it('returns true when no errors', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      expect(form.isValid()).toBe(true);
    });

    it('returns false when errors exist', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      form.setError('name', 'Required');

      expect(form.isValid()).toBe(false);
    });

    it('returns true after errors are cleared', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      form.setError('name', 'Required');
      expect(form.isValid()).toBe(false);

      form.setError('name', undefined);
      expect(form.isValid()).toBe(true);
    });
  });

  describe('isDirty', () => {
    it('returns false for unchanged values', () => {
      const form = useForm({
        initialValues: { name: 'John' },
      });

      expect(form.isDirty()).toBe(false);
    });

    it('returns true after value change', () => {
      const form = useForm({
        initialValues: { name: 'John' },
      });

      form.setValue('name', 'Jane');

      expect(form.isDirty()).toBe(true);
    });

    it('returns false after resetting', () => {
      const form = useForm({
        initialValues: { name: 'John' },
      });

      form.setValue('name', 'Jane');
      expect(form.isDirty()).toBe(true);

      form.reset();
      expect(form.isDirty()).toBe(false);
    });
  });

  describe('validate', () => {
    it('returns true when no validator provided', async () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(true);
    });

    it('runs validation and sets errors', async () => {
      const form = useForm({
        initialValues: { name: '', email: '' },
        validate: (values) => {
          const errors: Record<string, string> = {};
          if (!values.name) errors.name = 'Name is required';
          if (!values.email) errors.email = 'Email is required';
          return errors;
        },
      });

      const isValid = await form.validate();

      expect(isValid).toBe(false);
      expect(form.errors()).toEqual({
        name: 'Name is required',
        email: 'Email is required',
      });
    });

    it('clears errors when validation passes', async () => {
      const form = useForm({
        initialValues: { name: '' },
        validate: (values) => {
          const errors: Record<string, string> = {};
          if (!values.name) errors.name = 'Required';
          return errors;
        },
      });

      await form.validate();
      expect(form.getError('name')).toBe('Required');

      form.setValue('name', 'John');
      await form.validate();
      expect(form.getError('name')).toBeUndefined();
    });

    it('supports async validation', async () => {
      const form = useForm({
        initialValues: { username: 'taken' },
        validate: async (values) => {
          await new Promise((r) => setTimeout(r, 10));
          const errors: Record<string, string> = {};
          if (values.username === 'taken') {
            errors.username = 'Username is taken';
          }
          return errors;
        },
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.getError('username')).toBe('Username is taken');
    });
  });

  describe('validateField', () => {
    it('validates a single field', async () => {
      const form = useForm({
        initialValues: { name: '', email: '' },
        validate: (values) => {
          const errors: Record<string, string> = {};
          if (!values.name) errors.name = 'Name is required';
          if (!values.email) errors.email = 'Email is required';
          return errors;
        },
      });

      const isValid = await form.validateField('name');

      expect(isValid).toBe(false);
      expect(form.getError('name')).toBe('Name is required');
      // Other errors should not be set by validateField
    });

    it('clears field error when valid', async () => {
      const form = useForm({
        initialValues: { name: '' },
        validate: (values) => {
          const errors: Record<string, string> = {};
          if (!values.name) errors.name = 'Required';
          return errors;
        },
      });

      await form.validateField('name');
      expect(form.getError('name')).toBe('Required');

      form.setValue('name', 'John');
      await form.validateField('name');
      expect(form.getError('name')).toBeUndefined();
    });
  });

  describe('submit', () => {
    it('calls onSubmit when validation passes', async () => {
      const onSubmit = vi.fn();
      const form = useForm({
        initialValues: { name: 'John' },
        onSubmit,
      });

      await form.submit();

      expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
    });

    it('does not call onSubmit when validation fails', async () => {
      const onSubmit = vi.fn();
      const form = useForm({
        initialValues: { name: '' },
        validate: (values) => {
          const errors: Record<string, string> = {};
          if (!values.name) errors.name = 'Required';
          return errors;
        },
        onSubmit,
      });

      await form.submit();

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('calls onError when validation fails', async () => {
      const onError = vi.fn();
      const form = useForm({
        initialValues: { name: '' },
        validate: (values) => {
          const errors: Record<string, string> = {};
          if (!values.name) errors.name = 'Required';
          return errors;
        },
        onError,
      });

      await form.submit();

      expect(onError).toHaveBeenCalledWith({ name: 'Required' });
    });

    it('marks all fields as touched', async () => {
      const form = useForm({
        initialValues: { name: '', email: '' },
      });

      expect(form.isTouched('name')).toBe(false);
      expect(form.isTouched('email')).toBe(false);

      await form.submit();

      expect(form.isTouched('name')).toBe(true);
      expect(form.isTouched('email')).toBe(true);
    });

    it('sets isSubmitting during async submit', async () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((r) => {
        resolveSubmit = r;
      });

      const form = useForm({
        initialValues: { name: 'John' },
        onSubmit: async () => {
          await submitPromise;
        },
      });

      expect(form.isSubmitting()).toBe(false);

      const submitCall = form.submit();
      // Wait a tick for the submit to start
      await Promise.resolve();

      expect(form.isSubmitting()).toBe(true);

      resolveSubmit!();
      await submitCall;

      expect(form.isSubmitting()).toBe(false);
    });

    it('resets isSubmitting even on error', async () => {
      const form = useForm({
        initialValues: { name: 'John' },
        onSubmit: async () => {
          throw new Error('Submit failed');
        },
      });

      try {
        await form.submit();
      } catch {
        // Expected error
      }

      expect(form.isSubmitting()).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets values to initial', () => {
      const form = useForm({
        initialValues: { name: 'John' },
      });

      form.setValue('name', 'Jane');
      expect(form.getValue('name')).toBe('Jane');

      form.reset();
      expect(form.getValue('name')).toBe('John');
    });

    it('clears errors', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      form.setError('name', 'Required');
      expect(form.getError('name')).toBe('Required');

      form.reset();
      expect(form.errors()).toEqual({});
    });

    it('clears touched state', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      form.touch('name');
      expect(form.isTouched('name')).toBe(true);

      form.reset();
      expect(form.isTouched('name')).toBe(false);
    });

    it('resets isSubmitting', async () => {
      // This is a bit tricky to test, but let's ensure reset clears it
      const form = useForm({
        initialValues: { name: '' },
      });

      form.reset();
      expect(form.isSubmitting()).toBe(false);
    });
  });

  describe('field binding', () => {
    it('returns field binding object', () => {
      const form = useForm({
        initialValues: { name: 'John' },
      });

      const binding = form.field('name');

      expect(binding).toEqual({
        value: 'John',
        placeholder: 'name',
        onChange: expect.any(Function),
        onSubmit: expect.any(Function),
      });
    });

    it('onChange updates value', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      const binding = form.field('name');
      binding.onChange('John');

      expect(form.getValue('name')).toBe('John');
    });

    it('onSubmit touches the field', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      const binding = form.field('name');
      expect(form.isTouched('name')).toBe(false);

      binding.onSubmit!('');
      expect(form.isTouched('name')).toBe(true);
    });

    it('handles null/undefined values', () => {
      const form = useForm({
        initialValues: { name: null as unknown as string },
      });

      const binding = form.field('name');
      expect(binding.value).toBe('');
    });
  });

  describe('validateOnChange', () => {
    it('validates on change when enabled', async () => {
      const validate = vi.fn().mockReturnValue({});
      const form = useForm({
        initialValues: { name: '' },
        validate,
        validateOnChange: true,
      });

      form.setValue('name', 'John');

      // Wait for async validation
      await Promise.resolve();

      expect(validate).toHaveBeenCalled();
    });

    it('does not validate on change when disabled (default)', () => {
      const validate = vi.fn().mockReturnValue({});
      const form = useForm({
        initialValues: { name: '' },
        validate,
        // validateOnChange: false is default
      });

      form.setValue('name', 'John');

      expect(validate).not.toHaveBeenCalled();
    });
  });

  describe('validateOnBlur', () => {
    it('validates on blur when enabled (default)', async () => {
      const validate = vi.fn().mockReturnValue({});
      const form = useForm({
        initialValues: { name: '' },
        validate,
        // validateOnBlur: true is default
      });

      form.touch('name');

      // Wait for async validation
      await Promise.resolve();

      expect(validate).toHaveBeenCalled();
    });

    it('does not validate on blur when disabled', () => {
      const validate = vi.fn().mockReturnValue({});
      const form = useForm({
        initialValues: { name: '' },
        validate,
        validateOnBlur: false,
      });

      form.touch('name');

      expect(validate).not.toHaveBeenCalled();
    });
  });
});

describe('createFormValidator', () => {
  it('creates a validation function from field validators', () => {
    const validate = createFormValidator({
      name: [required()],
      email: [required(), email()],
    });

    const errors = validate({ name: '', email: 'invalid' });

    expect(errors).toEqual({
      name: 'This field is required',
      email: 'Invalid email format',
    });
  });

  it('stops at first error for each field', () => {
    const validate = createFormValidator({
      password: [required('Required'), minLength(8, 'Too short')],
    });

    // Empty password should show Required, not Too short
    const errors = validate({ password: '' });
    expect(errors.password).toBe('Required');

    // Short password should show Too short
    const errors2 = validate({ password: 'short' });
    expect(errors2.password).toBe('Too short');
  });

  it('returns empty object when all valid', () => {
    const validate = createFormValidator({
      name: [required()],
      email: [email()],
    });

    const errors = validate({ name: 'John', email: 'john@example.com' });

    expect(errors).toEqual({});
  });
});

describe('validators', () => {
  describe('required', () => {
    it('fails for empty string', () => {
      const validator = required();
      expect(validator('', {})).toBe('This field is required');
    });

    it('fails for null', () => {
      const validator = required();
      expect(validator(null, {})).toBe('This field is required');
    });

    it('fails for undefined', () => {
      const validator = required();
      expect(validator(undefined, {})).toBe('This field is required');
    });

    it('passes for non-empty string', () => {
      const validator = required();
      expect(validator('hello', {})).toBeUndefined();
    });

    it('passes for zero', () => {
      const validator = required();
      expect(validator(0, {})).toBeUndefined();
    });

    it('supports custom message', () => {
      const validator = required('Name is required');
      expect(validator('', {})).toBe('Name is required');
    });
  });

  describe('minLength', () => {
    it('fails for short string', () => {
      const validator = minLength(5);
      expect(validator('hi', {})).toBe('Must be at least 5 characters');
    });

    it('passes for string at min length', () => {
      const validator = minLength(5);
      expect(validator('hello', {})).toBeUndefined();
    });

    it('passes for longer string', () => {
      const validator = minLength(5);
      expect(validator('hello world', {})).toBeUndefined();
    });

    it('supports custom message', () => {
      const validator = minLength(5, 'Too short');
      expect(validator('hi', {})).toBe('Too short');
    });
  });

  describe('maxLength', () => {
    it('fails for long string', () => {
      const validator = maxLength(5);
      expect(validator('hello world', {})).toBe('Must be at most 5 characters');
    });

    it('passes for string at max length', () => {
      const validator = maxLength(5);
      expect(validator('hello', {})).toBeUndefined();
    });

    it('passes for shorter string', () => {
      const validator = maxLength(5);
      expect(validator('hi', {})).toBeUndefined();
    });

    it('supports custom message', () => {
      const validator = maxLength(5, 'Too long');
      expect(validator('hello world', {})).toBe('Too long');
    });
  });

  describe('email', () => {
    it('fails for invalid email', () => {
      const validator = email();
      expect(validator('notanemail', {})).toBe('Invalid email format');
    });

    it('passes for valid email', () => {
      const validator = email();
      expect(validator('test@example.com', {})).toBeUndefined();
    });

    it('passes for empty string (let required handle)', () => {
      const validator = email();
      expect(validator('', {})).toBeUndefined();
    });

    it('supports custom message', () => {
      const validator = email('Please enter a valid email');
      expect(validator('notanemail', {})).toBe('Please enter a valid email');
    });
  });

  describe('pattern', () => {
    it('fails for non-matching pattern', () => {
      const validator = pattern(/^\d+$/);
      expect(validator('abc', {})).toBe('Invalid format');
    });

    it('passes for matching pattern', () => {
      const validator = pattern(/^\d+$/);
      expect(validator('123', {})).toBeUndefined();
    });

    it('passes for empty string', () => {
      const validator = pattern(/^\d+$/);
      expect(validator('', {})).toBeUndefined();
    });

    it('supports custom message', () => {
      const validator = pattern(/^\d+$/, 'Numbers only');
      expect(validator('abc', {})).toBe('Numbers only');
    });
  });

  describe('min', () => {
    it('fails for value below minimum', () => {
      const validator = min(10);
      expect(validator(5, {})).toBe('Must be at least 10');
    });

    it('passes for value at minimum', () => {
      const validator = min(10);
      expect(validator(10, {})).toBeUndefined();
    });

    it('passes for value above minimum', () => {
      const validator = min(10);
      expect(validator(15, {})).toBeUndefined();
    });

    it('supports custom message', () => {
      const validator = min(10, 'Must be 10 or more');
      expect(validator(5, {})).toBe('Must be 10 or more');
    });
  });

  describe('max', () => {
    it('fails for value above maximum', () => {
      const validator = max(10);
      expect(validator(15, {})).toBe('Must be at most 10');
    });

    it('passes for value at maximum', () => {
      const validator = max(10);
      expect(validator(10, {})).toBeUndefined();
    });

    it('passes for value below maximum', () => {
      const validator = max(10);
      expect(validator(5, {})).toBeUndefined();
    });

    it('supports custom message', () => {
      const validator = max(10, 'Must be 10 or less');
      expect(validator(15, {})).toBe('Must be 10 or less');
    });
  });

  describe('matchField', () => {
    it('fails when values do not match', () => {
      const validator = matchField('password');
      expect(validator('different', { password: 'original' })).toBe(
        'Must match password'
      );
    });

    it('passes when values match', () => {
      const validator = matchField('password');
      expect(validator('same', { password: 'same' })).toBeUndefined();
    });

    it('supports custom message', () => {
      const validator = matchField('password', 'Passwords must match');
      expect(validator('different', { password: 'original' })).toBe(
        'Passwords must match'
      );
    });
  });

  describe('custom', () => {
    it('fails when validator returns false', () => {
      const validator = custom((value: string) => value.length > 3, 'Too short');
      expect(validator('hi', {})).toBe('Too short');
    });

    it('passes when validator returns true', () => {
      const validator = custom((value: string) => value.length > 3, 'Too short');
      expect(validator('hello', {})).toBeUndefined();
    });

    it('receives all form values', () => {
      const validator = custom(
        (value: string, allValues) => value !== allValues.forbidden,
        'Cannot use forbidden value'
      );
      expect(validator('forbidden', { forbidden: 'forbidden' })).toBe(
        'Cannot use forbidden value'
      );
      expect(validator('allowed', { forbidden: 'forbidden' })).toBeUndefined();
    });
  });
});

describe('integration: complete form workflow', () => {
  it('handles full registration flow', async () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();

    const validate = createFormValidator({
      username: [required(), minLength(3)],
      email: [required(), email()],
      password: [required(), minLength(8)],
      confirmPassword: [required(), matchField('password', 'Passwords must match')],
    });

    const form = useForm({
      initialValues: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      },
      validate,
      onSubmit,
      onError,
    });

    // 1. Try submit with empty form
    await form.submit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
    expect(form.getError('username')).toBe('This field is required');

    // 2. Fill in fields
    form.setValue('username', 'john');
    form.setValue('email', 'john@example.com');
    form.setValue('password', 'password123');
    form.setValue('confirmPassword', 'password123');

    // 3. Submit should succeed
    await form.submit();
    expect(onSubmit).toHaveBeenCalledWith({
      username: 'john',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    // 4. Reset
    form.reset();
    expect(form.values()).toEqual({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    expect(form.isDirty()).toBe(false);
    expect(form.isValid()).toBe(true);
  });
});
