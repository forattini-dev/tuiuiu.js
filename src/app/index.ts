/** Application ownership, rendering and owner-safe lifecycle hooks. */

// Render loop
export {
  render,
  renderOnce,
  type FixedStepOptions,
  type FixedStepUpdate,
  type FocusHost,
  type RenderOptions,
  type ScreenMode,
  type AppHandle,
} from './render-loop.js';

export {
  component,
  type ComponentKey,
  type ComponentKeyProps,
  type StatefulComponent,
  type StatefulComponentWithoutProps,
  type OwnedComponent,
} from './component.js';

export {
  AppSlot,
  createContributionHost,
  defineSlots,
  type AppSlotProps,
  type ContributionHandle,
  type ContributionHost,
  type ContributionHostOptions,
  type ContributionSpec,
  type SlotDefinition,
  type SlotMap,
} from './contributions.js';

export {
  useApp,
  useState,
  useConst,
  useMemo,
  useEffect,
  useSubscription,
  useAsyncData,
  useInterval,
  useTimeout,
  useTerminalSize,
  useTerminalFocus,
  useFps,
  useMouse,
  createLayoutRef,
  useLayoutRef,
  type AppContext,
  type TerminalSize,
  type TerminalFocusState,
  type UseFpsResult,
} from '../hooks/index.js';

export {
  createBackgroundExecutor,
  createWorkerExecutor,
  createBackgroundExecutorPool,
  createThreadBus,
  type BackgroundExecutor,
  type BackgroundExecutorPoolOptions,
  type BackgroundExecutorPoolScheduler,
  type BackgroundTaskHandlers,
  type ThreadBus,
} from '../utils/background-executor.js';

export {
  createNodeFsStorage,
  createNodeFsSyncStorage,
  type NodeFsStorageOptions,
} from './fs-storage.js';

export {
  useCommand,
  useCommandBinding,
  useInteractionMode,
  useInteraction,
  useShortcut,
  type ShortcutOptions,
} from '../hooks/use-command.js';
