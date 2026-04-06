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
export { useConst } from './use-const.js';

// Memoization hooks
export { useMemo } from './use-memo.js';
export { useComputed } from './use-computed.js';

// Effect hook
export { useEffect } from './use-effect.js';

// Input hook with priority support
export { useInput, useModalInput, useCriticalInput, parseKeypress } from './use-input.js';
export type { InputEvent } from './use-input.js';

// Paste hook
export { usePaste } from './use-paste.js';
export type { PasteHandler, PasteEvent } from './use-paste.js';

// Input handler management (for advanced use cases)
export {
  addInputHandler,
  removeInputHandlerById,
  emitInput,
  clearInputHandlers,
  getInputHandlerCount,
  getInputHandlers,
  // Paste handler management
  addPasteHandler,
  removePasteHandlerById,
  emitPaste,
  clearPasteHandlers,
  getPasteHandlerCount,
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

// Local mouse hook (component-relative coordinates)
export {
  useLocalMouse,
  cleanupLocalMouse,
  type Bounds,
  type BoundsOrGetter,
  type LocalMouseEvent,
  type LocalMouseHandler,
  type UseLocalMouseOptions,
} from './use-local-mouse.js';

// Focus hooks
export {
  useFocus,
  useFocusManager,
  createFocusAdapter,
  FocusZoneManagerAdapter,
} from './use-focus.js';

// App hook and lifecycle
export {
  useApp,
  initializeApp,
  cleanupApp,
  setClearScreen,
  setExternalUpdateIngress,
  type InitAppOptions,
  type ExternalUpdateIngress,
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
export { useTerminalFocus, type TerminalFocusState } from './use-terminal-focus.js';
export { useCompositor } from './use-compositor.js';
export type {
  UseCompositorResult,
  SlideOptions,
  FadeOptions,
  ShimmerOptions,
  SpringMotionOptions,
  RevealOptions,
  CompositorBindProps,
} from './use-compositor.js';

// Layout measurement hook
export { createLayoutRef, useLayoutRef } from './use-layout-ref.js';

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

// Timing hooks
export {
  useInterval,
  cleanupInterval,
  type UseIntervalOptions,
  type UseIntervalReturn,
} from './use-interval.js';

export {
  useTimeout,
  cleanupTimeout,
  type UseTimeoutOptions,
  type UseTimeoutReturn,
} from './use-timeout.js';

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

// Threshold color hook
export {
  useThresholdColor,
  getThresholdColor,
  getThresholdColorName,
} from './use-threshold-color.js';

export type {
  ThresholdRange,
  ThresholdConfig,
  ExtendedThresholdConfig,
} from './use-threshold-color.js';

// Clipboard hook
export { useClipboard } from './use-clipboard.js';
export type { UseClipboardResult } from './use-clipboard.js';

// Image paste hook
export { useImagePaste } from './use-image-paste.js';
export type { ImagePasteEvent, ImagePasteHandler, UseImagePasteOptions } from './use-image-paste.js';

// Clipboard image hint hook
export { useClipboardImageHint } from './use-clipboard-image-hint.js';
export type { UseClipboardImageHintOptions } from './use-clipboard-image-hint.js';

// Inline trigger completion hooks
export { useInlineTrigger, useMultiInlineTrigger } from './use-inline-trigger.js';

// Notification hook
export { useNotification } from './use-notification.js';
export type { UseNotificationResult } from './use-notification.js';

// Subscription hook (external event sources → signals)
export {
  useSubscription,
  cleanupSubscription,
  type UseSubscriptionOptions,
} from './use-subscription.js';

// Async data hook (fetch with lifecycle)
export {
  useAsyncData,
  cleanupAsyncData,
  type UseAsyncDataOptions,
  type UseAsyncDataReturn,
} from './use-async-data.js';

// Reactive format hooks
export {
  useFormatBytes,
  useFormatDuration,
  useFormatRelative,
  useFormatNumber,
  useFormatCompact,
  useFormatPercent,
  useFormatDelta,
} from './use-format.js';
