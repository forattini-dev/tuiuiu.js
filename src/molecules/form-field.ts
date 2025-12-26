/**
 * FormField - Label + Input + Error wrapper
 *
 * @layer Molecule
 * @description Wraps any input component with label and error display
 *
 * @example
 * ```typescript
 * FormField({
 *   label: 'Email',
 *   required: true,
 *   error: emailError(),
 *   children: TextInput({ state: emailInput }),
 * })
 * ```
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode } from '../utils/types.js';
import { getTheme } from '../core/theme.js';

export interface FormFieldProps {
  /** Field label */
  label: string;
  /** Is field required (shows asterisk) */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Helper text (shown when no error) */
  helperText?: string;
  /** Label color */
  labelColor?: string;
  /** Error color */
  errorColor?: string;
  /** Input component(s) */
  children: VNode | VNode[];
  /** Gap between label and input */
  gap?: number;
  /** Full width */
  fullWidth?: boolean;
  /** Layout direction */
  direction?: 'vertical' | 'horizontal';
  /** Label width (for horizontal layout) */
  labelWidth?: number;
}

/**
 * FormField - Wraps input with label and error display
 *
 * @example
 * ```typescript
 * // Basic usage
 * FormField({
 *   label: 'Username',
 *   required: true,
 *   error: usernameError(),
 *   children: TextInput({ state: usernameInput }),
 * })
 *
 * // Horizontal layout
 * FormField({
 *   label: 'Email',
 *   direction: 'horizontal',
 *   labelWidth: 15,
 *   children: TextInput({ state: emailInput }),
 * })
 *
 * // With helper text
 * FormField({
 *   label: 'Password',
 *   helperText: 'Must be at least 8 characters',
 *   children: PasswordInput({ state: passwordInput }),
 * })
 * ```
 */
export function FormField(props: FormFieldProps): VNode {
  const theme = getTheme();
  const {
    label,
    required = false,
    error,
    helperText,
    labelColor = theme.foreground.primary,
    errorColor = theme.accents.critical,
    children,
    gap = 0,
    fullWidth = false,
    direction = 'vertical',
    labelWidth,
  } = props;

  const hasError = Boolean(error);
  const showHelper = !hasError && helperText;

  // Label row with optional required indicator
  const labelNode = Box(
    {
      flexDirection: 'row',
      width: direction === 'horizontal' ? labelWidth : undefined,
      marginBottom: direction === 'vertical' ? gap : 0,
      marginRight: direction === 'horizontal' ? gap : 0,
    },
    Text({ color: labelColor }, label),
    required ? Text({ color: errorColor }, ' *') : null
  );

  // Input slot
  const inputSlot = Box(
    {
      flexDirection: 'column',
      flexGrow: fullWidth ? 1 : 0,
    },
    ...(Array.isArray(children) ? children : [children])
  );

  // Error or helper text
  const messageNode = hasError
    ? Box({ marginTop: gap }, Text({ color: errorColor }, error!))
    : showHelper
      ? Box({ marginTop: gap }, Text({ color: theme.foreground.muted, dim: true }, helperText!))
      : null;

  if (direction === 'horizontal') {
    return Box(
      {
        flexDirection: 'column',
        flexGrow: fullWidth ? 1 : 0,
      },
      Box(
        { flexDirection: 'row', alignItems: 'center' },
        labelNode,
        inputSlot
      ),
      messageNode
    );
  }

  // Vertical layout (default)
  return Box(
    {
      flexDirection: 'column',
      flexGrow: fullWidth ? 1 : 0,
    },
    labelNode,
    inputSlot,
    messageNode
  );
}

// =============================================================================
// Form Group - Multiple fields together
// =============================================================================

export interface FormGroupProps {
  /** Form title */
  title?: string;
  /** Form description */
  description?: string;
  /** Form fields */
  children: VNode | VNode[];
  /** Gap between fields */
  gap?: number;
  /** Border style */
  borderStyle?: 'none' | 'single' | 'round' | 'double';
  /** Padding */
  padding?: number;
}

/**
 * FormGroup - Groups multiple form fields together
 *
 * @example
 * ```typescript
 * FormGroup({
 *   title: 'Account Settings',
 *   description: 'Update your account information',
 *   gap: 1,
 *   children: [
 *     FormField({ label: 'Name', children: TextInput({ ... }) }),
 *     FormField({ label: 'Email', children: TextInput({ ... }) }),
 *   ],
 * })
 * ```
 */
export function FormGroup(props: FormGroupProps): VNode {
  const theme = getTheme();
  const {
    title,
    description,
    children,
    gap = 1,
    borderStyle = 'none',
    padding = 0,
  } = props;

  const childArray = Array.isArray(children) ? children : [children];

  // Add gap between children
  const spacedChildren: VNode[] = [];
  for (let i = 0; i < childArray.length; i++) {
    spacedChildren.push(childArray[i]!);
    if (i < childArray.length - 1 && gap > 0) {
      spacedChildren.push(Box({ height: gap }));
    }
  }

  return Box(
    {
      flexDirection: 'column',
      borderStyle,
      borderColor: theme.foreground.muted,
      padding,
    },
    title
      ? Box({ marginBottom: description ? 0 : gap }, Text({ color: theme.foreground.primary, bold: true }, title))
      : null,
    description
      ? Box({ marginBottom: gap }, Text({ color: theme.foreground.muted, dim: true }, description))
      : null,
    ...spacedChildren
  );
}
