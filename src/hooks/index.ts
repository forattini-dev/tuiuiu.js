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
} from './types.js';

// State hook
export { useState } from './use-state.js';

// Effect hook
export { useEffect } from './use-effect.js';

// Input hook
export { useInput, parseKeypress } from './use-input.js';

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
  FocusManagerImpl,
} from './use-focus.js';

// App hook and lifecycle
export {
  useApp,
  initializeApp,
  cleanupApp,
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

// Navigation (Kyma-inspired linked list navigation)
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
