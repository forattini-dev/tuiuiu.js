# useForm

Form state management with validation, submission handling, and field binding.

## Basic Usage

```typescript
import { useForm, FormField, TextInput, Button } from 'tuiuiu.js'

function LoginForm() {
  const form = useForm({
    initialValues: { email: '', password: '' },
    onSubmit: async (values) => {
      await login(values)
    },
  })

  return Box({ flexDirection: 'column', gap: 1 },
    FormField({
      label: 'Email',
      error: form.errors().email,
      children: TextInput({ ...form.field('email') }),
    }),
    FormField({
      label: 'Password',
      error: form.errors().password,
      children: TextInput({ ...form.field('password'), mask: '*' }),
    }),
    Button({
      label: 'Login',
      loading: form.isSubmitting(),
      onClick: () => form.submit(),
    }),
  )
}
```

## With Validation

```typescript
import { useForm, required, email, minLength } from 'tuiuiu.js'

const form = useForm({
  initialValues: {
    email: '',
    password: '',
    confirmPassword: '',
  },
  validate: (values) => {
    const errors = {}
    if (!values.email) errors.email = 'Required'
    if (!values.email.includes('@')) errors.email = 'Invalid email'
    if (!values.password) errors.password = 'Required'
    if (values.password.length < 8) errors.password = 'Min 8 characters'
    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords must match'
    }
    return errors
  },
  onSubmit: handleSubmit,
})
```

## Built-in Validators

```typescript
import {
  createFormValidator,
  required,
  email,
  minLength,
  maxLength,
  min,
  max,
  pattern,
  matchField,
  custom,
} from 'tuiuiu.js'

// Compose validators
const validate = createFormValidator({
  username: [required(), minLength(3), maxLength(20)],
  email: [required(), email()],
  age: [required(), min(18), max(120)],
  password: [required(), minLength(8)],
  confirmPassword: [required(), matchField('password', 'Passwords must match')],
  website: [pattern(/^https?:\/\//, 'Must be a valid URL')],
  customField: [custom((value) => value === 'valid' ? null : 'Invalid')],
})

const form = useForm({
  initialValues: { /* ... */ },
  validate,
  onSubmit: handleSubmit,
})
```

## Form State

```typescript
const form = useForm({ initialValues: { name: '', email: '' } })

// Read current values
const values = form.values()  // { name: '', email: '' }

// Read validation errors
const errors = form.errors()  // { email: 'Required' } or {}

// Read touched fields (have been focused)
const touched = form.touched()  // { name: true, email: false }

// Check form validity
if (form.isValid()) { /* all fields valid */ }

// Check if form has changes
if (form.isDirty()) { /* values differ from initial */ }

// Check if submitting
if (form.isSubmitting()) { /* submit in progress */ }
```

## Setting Values

```typescript
// Set single field
form.setValue('name', 'John')

// Set error manually
form.setError('email', 'Already taken')

// Reset to initial values
form.reset()

// Submit the form
await form.submit()
```

## Field Binding

The `field()` method returns props for TextInput:

```typescript
// Get binding for a field
const emailProps = form.field('email')
// Returns: { value, onChange, onFocus, onBlur }

// Use in TextInput
TextInput({ ...form.field('email') })
```

## Options

```typescript
interface UseFormOptions<T> {
  initialValues: T                    // Required: initial form values
  validate?: (values: T) => FormErrors<T>  // Validation function
  onSubmit?: (values: T) => void | Promise<void>  // Submit handler
  onError?: (errors: FormErrors<T>) => void  // Error handler
  validateOnChange?: boolean          // Validate on value change (default: false)
  validateOnBlur?: boolean            // Validate on blur (default: true)
}
```

## Return Value

```typescript
interface UseFormResult<T> {
  // Accessors (Signals)
  values: () => T
  errors: () => FormErrors<T>
  touched: () => Record<keyof T, boolean>

  // State checks
  isValid: () => boolean
  isDirty: () => boolean
  isSubmitting: () => boolean

  // Actions
  setValue: (key: keyof T, value: any) => void
  setError: (key: keyof T, error: string) => void
  submit: () => Promise<void>
  reset: () => void

  // Field binding
  field: (key: keyof T) => FieldProps
}
```

## Validation Timing

```typescript
// Validate only on blur (default)
const form = useForm({
  initialValues: { email: '' },
  validate: validateFn,
  validateOnBlur: true,   // default
  validateOnChange: false, // default
})

// Validate on every change
const form = useForm({
  initialValues: { email: '' },
  validate: validateFn,
  validateOnChange: true,
})
```

## Error Handling

```typescript
const form = useForm({
  initialValues: { email: '' },
  validate: validateFn,
  onSubmit: async (values) => {
    try {
      await api.submit(values)
    } catch (err) {
      // Set server-side errors
      form.setError('email', err.message)
    }
  },
  onError: (errors) => {
    // Called when validation fails on submit
    console.log('Validation failed:', errors)
  },
})
```

## Complete Example

```typescript
function RegistrationForm() {
  const validate = createFormValidator({
    username: [required(), minLength(3)],
    email: [required(), email()],
    password: [required(), minLength(8)],
    confirmPassword: [required(), matchField('password')],
  })

  const form = useForm({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate,
    onSubmit: async (values) => {
      await api.register(values)
      showToast('Registration successful!')
    },
    onError: () => {
      showToast('Please fix the errors', 'error')
    },
  })

  return Box({ flexDirection: 'column', gap: 1, padding: 2 },
    Text({ bold: true, marginBottom: 1 }, 'Create Account'),

    FormField({
      label: 'Username',
      required: true,
      error: form.errors().username,
      children: TextInput({ ...form.field('username') }),
    }),

    FormField({
      label: 'Email',
      required: true,
      error: form.errors().email,
      children: TextInput({ ...form.field('email') }),
    }),

    FormField({
      label: 'Password',
      required: true,
      error: form.errors().password,
      helperText: 'Minimum 8 characters',
      children: TextInput({ ...form.field('password'), mask: '*' }),
    }),

    FormField({
      label: 'Confirm Password',
      required: true,
      error: form.errors().confirmPassword,
      children: TextInput({ ...form.field('confirmPassword'), mask: '*' }),
    }),

    Box({ flexDirection: 'row', gap: 1, marginTop: 1 },
      Button({
        label: 'Cancel',
        variant: 'ghost',
        onClick: () => form.reset(),
        disabled: form.isSubmitting(),
      }),
      Button({
        label: form.isSubmitting() ? 'Registering...' : 'Register',
        variant: 'solid',
        color: 'success',
        loading: form.isSubmitting(),
        disabled: !form.isValid(),
        onClick: () => form.submit(),
      }),
    ),
  )
}
```

## Related

- [FormField](/components/forms.md) - Form field wrapper
- [TextInput](/components/forms.md) - Text input component
- [Button](/components/atoms/button.md) - Button component
- [useState](/hooks/use-state.md) - Basic state management
