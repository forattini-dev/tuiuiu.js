/** Curated everyday surface for Tuiuiu v2. */

export { getVersion, getVersionSync, getVersionInfo, formatVersionInfo } from './version.js';
export type { VersionInfo } from './version.js';

export {
  render,
  renderOnce,
  component,
  AppSlot,
  defineSlots,
} from './app/index.js';
export type {
  AppHandle,
  FocusHost,
  RenderOptions,
  ScreenMode,
  FixedStepOptions,
  FixedStepUpdate,
  ComponentKey,
  ComponentKeyProps,
  StatefulComponent,
  StatefulComponentWithoutProps,
  OwnedComponent,
  ContributionHandle,
  ContributionHost,
  ContributionSpec,
  SlotDefinition,
  SlotMap,
} from './app/index.js';

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
} from './primitives/nodes.js';
export {
  createSignal,
  createEffect,
  createMemo,
  batch,
  untrack,
  onCleanup,
} from './primitives/signal.js';

export { useState } from './hooks/use-state.js';
export { useConst } from './hooks/use-const.js';
export { useMemo } from './hooks/use-memo.js';
export { useEffect } from './hooks/use-effect.js';
export { useApp } from './hooks/use-app.js';
export { useTerminalSize } from './hooks/use-terminal-size.js';
export { createLayoutRef, useLayoutRef } from './hooks/use-layout-ref.js';
export { useInterval } from './hooks/use-interval.js';
export { useTimeout } from './hooks/use-timeout.js';
export {
  useCommand,
  useCommandBinding,
  useInteractionMode,
  useInteraction,
  useShortcut,
} from './hooks/use-command.js';

export {
  Button,
  IconButton,
  TextInput,
  Divider,
  Spinner,
  ProgressBar,
  Badge,
  Panel,
  DataRow,
  Digits,
  Gauge,
  ListItem,
  Sparkline,
  StatusIndicator,
  Table,
  RadioGroup,
  Switch,
  Slider,
  ScrollArea,
  Select,
  MultiSelect,
  Menu,
  Tabs,
  Modal,
  openModal,
  ScrollList,
  VStack,
  HStack,
  Center,
  AppShell,
} from './ui/index.js';

export {
  setTheme,
  useTheme,
  getTheme,
  resolveColor,
  darkTheme,
  lightTheme,
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
export type { AppContext } from './hooks/types.js';
export type { TerminalSize } from './hooks/use-terminal-size.js';
export type { Theme, ThemeMode } from './core/theme.js';
