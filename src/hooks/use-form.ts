/**
 * useForm - Form state management hook
 *
 * @layer Hook
 * @description Manages form state, validation, and submission
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   initialValues: { email: '', password: '' },
 *   validate: (values) => {
 *     const errors: Record<string, string> = {};
 *     if (!values.email) errors.email = 'Email is required';
 *     if (!values.password) errors.password = 'Password is required';
 *     return errors;
 *   },
 *   onSubmit: async (values) => {
 *     await login(values.email, values.password);
 *   },
 * });
 *
 * // In your component:
 * FormField({
 *   label: 'Email',
 *   error: form.errors().email,
 *   children: TextInput({
 *     ...form.field('email'),
 *   }),
 * })
 * ```
 */

import { createSignal } from '../primitives/signal.js';

// =============================================================================
// Types
// =============================================================================

export type FormValues = Record<string, unknown>;
export type FormErrors<T extends FormValues> = Partial<Record<keyof T, string>>;

export interface UseFormOptions<T extends FormValues> {
  /** Initial form values */
  initialValues: T;
  /** Validation function - returns object with field errors */
  validate?: (values: T) => FormErrors<T> | Promise<FormErrors<T>>;
  /** Called on successful submit (after validation passes) */
  onSubmit?: (values: T) => void | Promise<void>;
  /** Called when validation fails */
  onError?: (errors: FormErrors<T>) => void;
  /** Validate on change (default: false) */
  validateOnChange?: boolean;
  /** Validate on blur (default: true) */
  validateOnBlur?: boolean;
}

export interface FieldBinding {
  /** Current field value */
  value: string;
  /** Placeholder (field name) */
  placeholder: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Submit handler (for Enter key) */
  onSubmit?: (value: string) => void;
}

export interface UseFormResult<T extends FormValues> {
  /** Get all form values */
  values: () => T;
  /** Get all form errors */
  errors: () => FormErrors<T>;
  /** Get touched fields */
  touched: () => Partial<Record<keyof T, boolean>>;
  /** Set a single field value */
  setValue: <K extends keyof T>(key: K, value: T[K]) => void;
  /** Set a single field error */
  setError: <K extends keyof T>(key: K, error: string | undefined) => void;
  /** Mark field as touched */
  touch: <K extends keyof T>(key: K) => void;
  /** Check if form is valid (no errors) */
  isValid: () => boolean;
  /** Check if form is dirty (values changed from initial) */
  isDirty: () => boolean;
  /** Check if form is submitting */
  isSubmitting: () => boolean;
  /** Submit the form (runs validation first) */
  submit: () => Promise<void>;
  /** Reset form to initial values */
  reset: () => void;
  /** Validate entire form */
  validate: () => Promise<boolean>;
  /** Validate single field */
  validateField: <K extends keyof T>(key: K) => Promise<boolean>;
  /** Get field binding for TextInput */
  field: <K extends keyof T>(key: K) => FieldBinding;
  /** Get field value */
  getValue: <K extends keyof T>(key: K) => T[K];
  /** Get field error */
  getError: <K extends keyof T>(key: K) => string | undefined;
  /** Check if field was touched */
  isTouched: <K extends keyof T>(key: K) => boolean;
}

// =============================================================================
// Implementation
// =============================================================================

/**
 * useForm - Form state management hook
 *
 * @example
 * ```typescript
 * // Basic usage
 * const form = useForm({
 *   initialValues: { name: '', email: '' },
 *   onSubmit: (values) => console.log(values),
 * });
 *
 * TextInput({ ...form.field('name') })
 * TextInput({ ...form.field('email') })
 * Button({ label: 'Submit', onClick: () => form.submit() })
 *
 * // With validation
 * const form = useForm({
 *   initialValues: { email: '', password: '' },
 *   validate: (values) => {
 *     const errors: Record<string, string> = {};
 *     if (!values.email) errors.email = 'Required';
 *     if (!values.email.includes('@')) errors.email = 'Invalid email';
 *     if (values.password.length < 8) errors.password = 'Min 8 chars';
 *     return errors;
 *   },
 *   onSubmit: async (values) => {
 *     await api.login(values);
 *   },
 * });
 *
 * // Check submission state
 * if (form.isSubmitting()) {
 *   Spinner({ label: 'Submitting...' });
 * }
 *
 * // Reset form
 * Button({ label: 'Reset', onClick: () => form.reset() });
 * ```
 */
export function useForm<T extends FormValues>(
  options: UseFormOptions<T>
): UseFormResult<T> {
  const {
    initialValues,
    validate: validateFn,
    onSubmit,
    onError,
    validateOnChange = false,
    validateOnBlur = true,
  } = options;

  // Deep clone initial values to avoid mutation
  const cloneValues = (values: T): T => JSON.parse(JSON.stringify(values));

  // State signals
  const [values, setValues] = createSignal<T>(cloneValues(initialValues));
  const [errors, setErrors] = createSignal<FormErrors<T>>({});
  const [touched, setTouched] = createSignal<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  // Set a single field value
  const setValue = <K extends keyof T>(key: K, value: T[K]) => {
    setValues({ ...values(), [key]: value } as T);

    // Validate on change if enabled
    if (validateOnChange && validateFn) {
      void validateField(key);
    }
  };

  // Set a single field error
  const setError = <K extends keyof T>(key: K, error: string | undefined) => {
    if (error === undefined) {
      const newErrors = { ...errors() };
      delete newErrors[key];
      setErrors(newErrors);
    } else {
      setErrors({ ...errors(), [key]: error });
    }
  };

  // Mark field as touched
  const touch = <K extends keyof T>(key: K) => {
    setTouched({ ...touched(), [key]: true });

    // Validate on blur if enabled
    if (validateOnBlur && validateFn) {
      void validateField(key);
    }
  };

  // Check if form is valid (no errors)
  const isValid = (): boolean => {
    const currentErrors = errors();
    return Object.keys(currentErrors).length === 0;
  };

  // Check if form is dirty (values differ from initial)
  const isDirty = (): boolean => {
    const current = values();
    for (const key of Object.keys(initialValues) as (keyof T)[]) {
      if (current[key] !== initialValues[key]) {
        return true;
      }
    }
    return false;
  };

  // Validate entire form
  const validate = async (): Promise<boolean> => {
    if (!validateFn) {
      return true;
    }

    const validationErrors = await Promise.resolve(validateFn(values()));
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // Validate single field
  const validateField = async <K extends keyof T>(key: K): Promise<boolean> => {
    if (!validateFn) {
      return true;
    }

    const validationErrors = await Promise.resolve(validateFn(values()));
    const fieldError = validationErrors[key];

    if (fieldError) {
      setErrors({ ...errors(), [key]: fieldError });
      return false;
    } else {
      const newErrors = { ...errors() };
      delete newErrors[key];
      setErrors(newErrors);
      return true;
    }
  };

  // Submit the form
  const submit = async (): Promise<void> => {
    // Mark all fields as touched
    const allTouched = Object.keys(initialValues).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Partial<Record<keyof T, boolean>>
    );
    setTouched(allTouched);

    // Validate
    const formIsValid = await validate();

    if (!formIsValid) {
      onError?.(errors());
      return;
    }

    // Submit
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await Promise.resolve(onSubmit(values()));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Reset form to initial values
  const reset = () => {
    setValues(cloneValues(initialValues));
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  // Get field binding for TextInput
  const field = <K extends keyof T>(key: K): FieldBinding => {
    const currentValue = values()[key];
    const stringValue = currentValue === undefined || currentValue === null
      ? ''
      : String(currentValue);

    return {
      value: stringValue,
      placeholder: String(key),
      onChange: (value: string) => {
        setValue(key, value as T[K]);
      },
      onSubmit: () => {
        touch(key);
      },
    };
  };

  // Get field value
  const getValue = <K extends keyof T>(key: K): T[K] => {
    return values()[key];
  };

  // Get field error
  const getError = <K extends keyof T>(key: K): string | undefined => {
    return errors()[key];
  };

  // Check if field was touched
  const isTouched = <K extends keyof T>(key: K): boolean => {
    return touched()[key] ?? false;
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    touch,
    isValid,
    isDirty,
    isSubmitting,
    submit,
    reset,
    validate,
    validateField,
    field,
    getValue,
    getError,
    isTouched,
  };
}

// =============================================================================
// Utility: createFormValidator
// =============================================================================

export type ValidationRule<T> = (value: T, allValues: FormValues) => string | undefined;

export type FieldValidators<T extends FormValues> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

/**
 * Create a validation function from field validators
 *
 * @example
 * ```typescript
 * const validate = createFormValidator({
 *   email: [
 *     required('Email is required'),
 *     email('Invalid email format'),
 *   ],
 *   password: [
 *     required('Password is required'),
 *     minLength(8, 'Password must be at least 8 characters'),
 *   ],
 * });
 *
 * const form = useForm({ initialValues, validate });
 * ```
 */
export function createFormValidator<T extends FormValues>(
  validators: FieldValidators<T>
): (values: T) => FormErrors<T> {
  return (values: T) => {
    const errors: FormErrors<T> = {};

    for (const key of Object.keys(validators) as (keyof T)[]) {
      const fieldValidators = validators[key];
      if (!fieldValidators) continue;

      const value = values[key];
      for (const validator of fieldValidators) {
        const error = validator(value, values);
        if (error) {
          errors[key] = error;
          break; // Stop at first error for this field
        }
      }
    }

    return errors;
  };
}

// =============================================================================
// Built-in Validators
// =============================================================================

/**
 * Required field validator
 */
export function required(message = 'This field is required'): ValidationRule<unknown> {
  return (value) => {
    if (value === undefined || value === null || value === '') {
      return message;
    }
    return undefined;
  };
}

/**
 * Minimum length validator
 */
export function minLength(
  length: number,
  message?: string
): ValidationRule<string> {
  return (value) => {
    if (typeof value !== 'string' || value.length < length) {
      return message ?? `Must be at least ${length} characters`;
    }
    return undefined;
  };
}

/**
 * Maximum length validator
 */
export function maxLength(
  length: number,
  message?: string
): ValidationRule<string> {
  return (value) => {
    if (typeof value === 'string' && value.length > length) {
      return message ?? `Must be at most ${length} characters`;
    }
    return undefined;
  };
}

/**
 * Email format validator
 */
export function email(message = 'Invalid email format'): ValidationRule<string> {
  return (value) => {
    if (typeof value !== 'string') return undefined;
    if (value === '') return undefined; // Let required handle empty case

    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return message;
    }
    return undefined;
  };
}

/**
 * Pattern (regex) validator
 */
export function pattern(
  regex: RegExp,
  message = 'Invalid format'
): ValidationRule<string> {
  return (value) => {
    if (typeof value !== 'string' || value === '') return undefined;
    if (!regex.test(value)) {
      return message;
    }
    return undefined;
  };
}

/**
 * Minimum value validator (for numbers)
 */
export function min(
  minValue: number,
  message?: string
): ValidationRule<number> {
  return (value) => {
    if (typeof value !== 'number' || value < minValue) {
      return message ?? `Must be at least ${minValue}`;
    }
    return undefined;
  };
}

/**
 * Maximum value validator (for numbers)
 */
export function max(
  maxValue: number,
  message?: string
): ValidationRule<number> {
  return (value) => {
    if (typeof value === 'number' && value > maxValue) {
      return message ?? `Must be at most ${maxValue}`;
    }
    return undefined;
  };
}

/**
 * Match another field validator
 */
export function matchField<T extends FormValues>(
  fieldName: keyof T,
  message?: string
): ValidationRule<unknown> {
  return (value, allValues) => {
    if (value !== allValues[fieldName as string]) {
      return message ?? `Must match ${String(fieldName)}`;
    }
    return undefined;
  };
}

/**
 * Custom validator
 */
export function custom<T>(
  validatorFn: (value: T, allValues: FormValues) => boolean,
  message: string
): ValidationRule<T> {
  return (value, allValues) => {
    if (!validatorFn(value, allValues)) {
      return message;
    }
    return undefined;
  };
}
