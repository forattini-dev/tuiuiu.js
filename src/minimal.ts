/**
 * Compact entry point for the common application runtime.
 *
 * It intentionally excludes component catalogs, MCP, Storybook, styling
 * parsers, and experimental APIs. Import richer components from their
 * dedicated subpaths as the application grows.
 */

export {
  render,
  renderInline,
  renderFullscreen,
  renderAlternateScreen,
  renderOnce,
  type FixedStepOptions,
  type FixedStepUpdate,
  type RenderOptions,
  type ScreenMode,
  type TuiInstance,
} from './app/render-loop.js';

export {
  Box,
  Text,
  Spacer,
  Newline,
  Fragment,
  When,
  Each,
  Static,
  Transform,
  type StaticProps,
  type TransformProps,
} from './primitives/nodes.js';

export {
  createSignal,
  createEffect,
  createMemo,
  batch,
  untrack,
  onCleanup,
  type EffectOptions,
  type EffectScheduler,
} from './primitives/signal.js';

export { useState } from './hooks/use-state.js';
export { useEffect } from './hooks/use-effect.js';
export {
  useInput,
  useModalInput,
  useCriticalInput,
  type Key,
  type InputHandler,
  type InputEvent,
  type InputPriority,
  type UseInputOptions,
} from './hooks/use-input.js';
export { useApp, type AppContext } from './hooks/use-app.js';
export {
  useHotkeys,
  type HotkeyBinding,
  type HotkeyHandler,
  type HotkeyOptions,
} from './hooks/use-hotkeys.js';
export {
  useInterval,
  type UseIntervalOptions,
  type UseIntervalReturn,
} from './hooks/use-interval.js';
export {
  useTimeout,
  type UseTimeoutOptions,
  type UseTimeoutReturn,
} from './hooks/use-timeout.js';
export {
  useTerminalSize,
  type TerminalSize,
} from './hooks/use-terminal-size.js';

export {
  setTheme,
  useTheme,
  getTheme,
  resolveColor,
  darkTheme,
  lightTheme,
  type Theme,
  type ThemeMode,
} from './core/theme.js';

export type {
  AccessibilityProps,
  BoxProps,
  ColorValue,
  LayoutRect,
  LayoutRef,
  MouseEventData,
  MouseEventHandler,
  MouseEventProps,
  TextProps,
  TuiChild,
  TuiNode,
  VNode,
} from './utils/types.js';
