/**
 * Hooks module exports
 */

// Types
export type {
  Key,
  InputHandler,
  AppContext,
  FocusOptions,
  FocusResult,
  FocusManager,
  InputPriority,
  UseInputOptions,
  InputHandlerEntry,
} from './types.js';

export { INPUT_PRIORITY_VALUES } from './types.js';

// State hook
export { useState } from './use-state.js';

// Effect hook
export { useEffect } from './use-effect.js';

// Input hook with priority support
export { useInput, useModalInput, useCriticalInput, parseKeypress } from './use-input.js';

// Input handler management (for advanced use cases)
export {
  addInputHandler,
  removeInputHandler,
  removeInputHandlerById,
  emitInput,
  clearInputHandlers,
  getInputHandlerCount,
  getInputHandlers,
} from './context.js';

// Mouse hook
export {
  useMouse,
  parseMouseEvent,
  isMouseEvent,
  enableMouseTracking,
  disableMouseTracking,
  forceDisableMouseTracking,
  isMouseTrackingEnabled,
} from './use-mouse.js';
export type { MouseEvent, MouseHandler, MouseButton, MouseAction, MouseOptions } from './use-mouse.js';

// Focus hooks
export {
  useFocus,
  useFocusManager,
  createFocusManager,
  createFocusAdapter,
  FocusManagerImpl,
  FocusZoneManagerAdapter,
} from './use-focus.js';

// App hook and lifecycle
export {
  useApp,
  initializeApp,
  cleanupApp,
  setClearScreen,
  type InitAppOptions,
} from './use-app.js';

// Focus context (Context API-based focus management)
export {
  FocusContext,
  useFocusContext,
  useFocusContextRequired,
  hasFocusContext,
  createFocusManagerInstance,
} from './focus-context.js';

// Navigation (linked list navigation)
export {
  createLinkedNavigation,
  useNavigation,
  createWizard,
  createPagination,
} from './use-navigation.js';

export type {
  LinkedNode,
  NavigationState,
  NavigationOptions,
  WizardStep,
  WizardState,
  PageInfo,
  PaginationState,
} from './use-navigation.js';

// Terminal hook
export { useTerminalSize, type TerminalSize } from './use-terminal-size.js';

// Hotkeys
export {
  useHotkeys,
  parseHotkey,
  parseHotkeys,
  matchesHotkey,
  formatHotkey,
  formatHotkeyPlatform,
  registerHotkey,
  triggerHotkey,
  getRegisteredHotkeys,
  getHotkeyScope,
  setHotkeyScope,
  pushHotkeyScope,
  popHotkeyScope,
  getHotkeyScopeDepth,
  resetHotkeyScope,
  isMac,
} from './use-hotkeys.js';

export type {
  HotkeyBinding,
  HotkeyOptions,
  HotkeyHandler,
} from './use-hotkeys.js';

// State Cleanup Hooks
export {
  useThemeOverride,
  useHotkeyScope,
  useCurrentHotkeyScope,
} from './use-state-cleanup.js';

// FPS tracking hook
export { useFps, type UseFpsResult } from './use-fps.js';

// Form hook
export {
  useForm,
  createFormValidator,
  // Built-in validators
  required,
  minLength,
  maxLength,
  email,
  pattern,
  min,
  max,
  matchField,
  custom,
} from './use-form.js';

export type {
  FormValues,
  FormErrors,
  UseFormOptions,
  UseFormResult,
  FieldBinding,
  ValidationRule,
  FieldValidators,
} from './use-form.js';
