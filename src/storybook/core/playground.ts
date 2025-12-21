/**
 * Storybook Playground Engine
 *
 * Handles live editing of component props:
 * - Control value management
 * - Type-based editors
 * - Code generation
 * - Undo/redo history
 */

import { createSignal, batch } from '../../core/signal.js';
import type { Story, ControlDefinition, ControlType } from '../types.js';

export interface PlaygroundState {
  /** Current control values */
  values: Record<string, any>;
  /** Default control values */
  defaults: Record<string, any>;
  /** Control definitions from story */
  controls: Record<string, ControlDefinition>;
  /** Which control is currently focused */
  focusedControlIndex: number;
  /** Edit history for undo/redo */
  history: Array<Record<string, any>>;
  /** Current history position */
  historyIndex: number;
  /** Is editing mode active */
  isEditing: boolean;
}

export interface Playground {
  // State
  state: () => PlaygroundState;
  controlKeys: () => string[];
  focusedControl: () => { key: string; control: ControlDefinition } | null;

  // Value management
  getValue: (key: string) => any;
  setValue: (key: string, value: any) => void;
  resetValue: (key: string) => void;
  resetAll: () => void;

  // Incremental value changes
  increment: (key: string, step?: number) => void;
  decrement: (key: string, step?: number) => void;
  toggle: (key: string) => void;
  cycleOption: (key: string, direction?: 1 | -1) => void;

  // Control navigation
  nextControl: () => void;
  prevControl: () => void;
  focusControl: (index: number) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Code generation
  generateCode: () => string;
  generateImport: (componentName: string) => string;

  // Load story
  loadStory: (story: Story) => void;

  // Editing mode
  startEditing: () => void;
  stopEditing: () => void;
}

export interface PlaygroundOptions {
  /** Initial story to load */
  story?: Story;
  /** Maximum history entries */
  maxHistory?: number;
}

/**
 * Create a playground for live prop editing
 */
export function createPlayground(options: PlaygroundOptions = {}): Playground {
  const { story, maxHistory = 50 } = options;

  // Initialize state
  const initialValues = story
    ? Object.fromEntries(
        Object.entries(story.controls || {}).map(([key, control]) => [
          key,
          control.defaultValue,
        ])
      )
    : {};

  const [state, setState] = createSignal<PlaygroundState>({
    values: { ...initialValues },
    defaults: { ...initialValues },
    controls: story?.controls ?? {},
    focusedControlIndex: 0,
    history: [{ ...initialValues }],
    historyIndex: 0,
    isEditing: false,
  });

  // Computed: control keys
  const controlKeys = (): string[] => Object.keys(state().controls);

  // Computed: focused control
  const focusedControl = (): { key: string; control: ControlDefinition } | null => {
    const s = state();
    const keys = controlKeys();
    if (keys.length === 0 || s.focusedControlIndex < 0 || s.focusedControlIndex >= keys.length) {
      return null;
    }
    const key = keys[s.focusedControlIndex];
    return { key, control: s.controls[key] };
  };

  // Push to history
  const pushHistory = (values: Record<string, any>) => {
    setState((s) => {
      const newHistory = s.history.slice(0, s.historyIndex + 1);
      newHistory.push({ ...values });

      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      }

      return {
        ...s,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  };

  // Value management
  const getValue = (key: string): any => state().values[key];

  const setValue = (key: string, value: any): void => {
    setState((s) => {
      const newValues = { ...s.values, [key]: value };
      pushHistory(newValues);
      return { ...s, values: newValues };
    });
  };

  const resetValue = (key: string): void => {
    setState((s) => {
      const newValues = { ...s.values, [key]: s.defaults[key] };
      pushHistory(newValues);
      return { ...s, values: newValues };
    });
  };

  const resetAll = (): void => {
    setState((s) => {
      const newValues = { ...s.defaults };
      pushHistory(newValues);
      return { ...s, values: newValues };
    });
  };

  // Incremental changes
  const increment = (key: string, step?: number): void => {
    const s = state();
    const control = s.controls[key];
    if (!control) return;

    if (control.type === 'number' || control.type === 'range') {
      const currentValue = s.values[key] ?? control.defaultValue ?? 0;
      const stepSize = step ?? control.step ?? 1;
      const max = control.max ?? Infinity;
      const newValue = Math.min(max, currentValue + stepSize);
      setValue(key, newValue);
    }
  };

  const decrement = (key: string, step?: number): void => {
    const s = state();
    const control = s.controls[key];
    if (!control) return;

    if (control.type === 'number' || control.type === 'range') {
      const currentValue = s.values[key] ?? control.defaultValue ?? 0;
      const stepSize = step ?? control.step ?? 1;
      const min = control.min ?? -Infinity;
      const newValue = Math.max(min, currentValue - stepSize);
      setValue(key, newValue);
    }
  };

  const toggle = (key: string): void => {
    const s = state();
    const control = s.controls[key];
    if (!control || control.type !== 'boolean') return;

    const currentValue = s.values[key] ?? control.defaultValue ?? false;
    setValue(key, !currentValue);
  };

  const cycleOption = (key: string, direction: 1 | -1 = 1): void => {
    const s = state();
    const control = s.controls[key];
    if (!control) return;

    if (control.type === 'select' && control.options) {
      const currentValue = s.values[key] ?? control.defaultValue;
      const currentIndex = control.options.indexOf(currentValue);
      const newIndex =
        (currentIndex + direction + control.options.length) % control.options.length;
      setValue(key, control.options[newIndex]);
    } else if (control.type === 'color') {
      // Cycle through common colors
      const colors = ['white', 'gray', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan'];
      const currentValue = s.values[key] ?? control.defaultValue;
      const currentIndex = colors.indexOf(currentValue);
      const newIndex = (currentIndex + direction + colors.length) % colors.length;
      setValue(key, colors[newIndex]);
    }
  };

  // Control navigation
  const nextControl = (): void => {
    setState((s) => {
      const keys = Object.keys(s.controls);
      if (keys.length === 0) return s;
      return {
        ...s,
        focusedControlIndex: (s.focusedControlIndex + 1) % keys.length,
      };
    });
  };

  const prevControl = (): void => {
    setState((s) => {
      const keys = Object.keys(s.controls);
      if (keys.length === 0) return s;
      return {
        ...s,
        focusedControlIndex: (s.focusedControlIndex - 1 + keys.length) % keys.length,
      };
    });
  };

  const focusControl = (index: number): void => {
    setState((s) => {
      const keys = Object.keys(s.controls);
      if (index < 0 || index >= keys.length) return s;
      return { ...s, focusedControlIndex: index };
    });
  };

  // History
  const undo = (): void => {
    setState((s) => {
      if (s.historyIndex <= 0) return s;
      const newIndex = s.historyIndex - 1;
      return {
        ...s,
        historyIndex: newIndex,
        values: { ...s.history[newIndex] },
      };
    });
  };

  const redo = (): void => {
    setState((s) => {
      if (s.historyIndex >= s.history.length - 1) return s;
      const newIndex = s.historyIndex + 1;
      return {
        ...s,
        historyIndex: newIndex,
        values: { ...s.history[newIndex] },
      };
    });
  };

  const canUndo = (): boolean => state().historyIndex > 0;
  const canRedo = (): boolean => state().historyIndex < state().history.length - 1;

  // Code generation
  const generateCode = (): string => {
    const s = state();
    const props: string[] = [];

    for (const [key, control] of Object.entries(s.controls)) {
      const value = s.values[key];
      const defaultValue = s.defaults[key];

      // Only include non-default values
      if (value === defaultValue) continue;

      props.push(formatProp(key, value, control.type));
    }

    if (props.length === 0) {
      return '{}';
    }

    return `{\n  ${props.join(',\n  ')}\n}`;
  };

  const generateImport = (componentName: string): string => {
    return `import { ${componentName} } from 'tuiuiu.js';`;
  };

  // Format prop value for code generation
  function formatProp(key: string, value: any, type: ControlType): string {
    switch (type) {
      case 'boolean':
        return `${key}: ${value}`;
      case 'text':
        return `${key}: "${escapeString(value)}"`;
      case 'color':
        return `${key}: '${value}'`;
      case 'number':
      case 'range':
        return `${key}: ${value}`;
      case 'select':
        return `${key}: '${value}'`;
      default:
        return `${key}: ${JSON.stringify(value)}`;
    }
  }

  function escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
  }

  // Load story
  const loadStory = (story: Story): void => {
    const newValues = Object.fromEntries(
      Object.entries(story.controls || {}).map(([key, control]) => [
        key,
        control.defaultValue,
      ])
    );

    batch(() => {
      setState({
        values: { ...newValues },
        defaults: { ...newValues },
        controls: story.controls || {},
        focusedControlIndex: 0,
        history: [{ ...newValues }],
        historyIndex: 0,
        isEditing: false,
      });
    });
  };

  // Editing mode
  const startEditing = (): void => {
    setState((s) => ({ ...s, isEditing: true }));
  };

  const stopEditing = (): void => {
    setState((s) => ({ ...s, isEditing: false }));
  };

  return {
    state,
    controlKeys,
    focusedControl,
    getValue,
    setValue,
    resetValue,
    resetAll,
    increment,
    decrement,
    toggle,
    cycleOption,
    nextControl,
    prevControl,
    focusControl,
    undo,
    redo,
    canUndo,
    canRedo,
    generateCode,
    generateImport,
    loadStory,
    startEditing,
    stopEditing,
  };
}

/**
 * Get editor type recommendation for a control type
 */
export function getEditorType(controlType: ControlType): string {
  switch (controlType) {
    case 'boolean':
      return 'switch';
    case 'number':
      return 'number-input';
    case 'range':
      return 'slider';
    case 'select':
      return 'dropdown';
    case 'color':
      return 'color-picker';
    case 'text':
      return 'text-input';
    default:
      return 'generic';
  }
}

/**
 * Validate a value against its control definition
 */
export function validateValue(value: any, control: ControlDefinition): boolean {
  switch (control.type) {
    case 'boolean':
      return typeof value === 'boolean';
    case 'number':
    case 'range':
      if (typeof value !== 'number') return false;
      if (control.min !== undefined && value < control.min) return false;
      if (control.max !== undefined && value > control.max) return false;
      return true;
    case 'select':
      return control.options?.includes(value) ?? true;
    case 'color':
      return typeof value === 'string';
    case 'text':
      return typeof value === 'string';
    default:
      return true;
  }
}
