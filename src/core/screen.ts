/**
 * Screen Manager
 *
 * Provides navigation between screens with stack-based history,
 * lifecycle events, and caching support.
 */

import { createSignal, batch } from '../primitives/signal.js';
import { EventEmitter } from './events.js';

/**
 * Internal signal accessor type for storing signal getters/setters
 */
interface SignalAccessor<T> {
  get: () => T;
  set: (value: T | ((prev: T) => T)) => void;
}

// =============================================================================
// Types
// =============================================================================

/**
 * Screen component function
 */
export type ScreenComponent<P = unknown> = (props: P) => unknown;

/**
 * Screen definition
 */
export interface Screen<P = unknown> {
  /** Unique screen identifier */
  id: string;
  /** Screen component */
  component: ScreenComponent<P>;
  /** Screen title (for title bar) */
  title?: string;
  /** Screen subtitle */
  subtitle?: string;
  /** Props to pass to component */
  props?: P;
  /** Whether to keep screen cached when navigated away */
  keepAlive?: boolean;
  /** Whether to show back button */
  showBack?: boolean;
  /** Custom back handler */
  onBack?: () => boolean | void;
  /** Lifecycle: called when screen becomes active */
  onEnter?: () => void;
  /** Lifecycle: called when screen becomes inactive */
  onExit?: () => void;
  /** Lifecycle: called when screen is about to enter */
  onBeforeEnter?: () => boolean | Promise<boolean>;
  /** Lifecycle: called when screen is about to exit */
  onBeforeExit?: () => boolean | Promise<boolean>;
}

/**
 * Screen stack entry (screen with its cached state)
 */
export interface ScreenStackEntry<P = unknown> {
  screen: Screen<P>;
  /** Cached render output (if keepAlive) */
  cachedOutput?: unknown;
  /** Screen state data */
  state?: Record<string, unknown>;
  /** Entry timestamp */
  enteredAt: number;
}

/**
 * Screen transition direction
 */
export type TransitionDirection = 'forward' | 'back' | 'replace' | 'none';

/**
 * Screen navigation event data
 */
export interface ScreenNavigationEvent {
  from: Screen | null;
  to: Screen;
  direction: TransitionDirection;
}

/**
 * Screen manager options
 */
export interface ScreenManagerOptions {
  /** Initial screen */
  initialScreen?: Screen;
  /** Default keep-alive behavior */
  defaultKeepAlive?: boolean;
  /** Enable back navigation with Escape key */
  escapeGoesBack?: boolean;
  /** Maximum stack size (0 = unlimited) */
  maxStackSize?: number;
  /** Transition duration in ms */
  transitionDuration?: number;
}

/**
 * Screen manager state
 */
export interface ScreenManagerState {
  /** Current active screen */
  current: Screen | null;
  /** Stack of screens */
  stack: ScreenStackEntry[];
  /** Whether a transition is in progress */
  transitioning: boolean;
  /** Current transition direction */
  transitionDirection: TransitionDirection;
}

// =============================================================================
// Screen Manager Events
// =============================================================================

export interface ScreenManagerEvents {
  /** Emitted before navigation starts */
  'beforeNavigate': ScreenNavigationEvent;
  /** Emitted after navigation completes */
  'navigate': ScreenNavigationEvent;
  /** Emitted when navigation is cancelled */
  'navigateCancelled': { from: Screen | null; to: Screen };
  /** Emitted when a screen enters */
  'screenEnter': { screen: Screen };
  /** Emitted when a screen exits */
  'screenExit': { screen: Screen };
  /** Emitted when stack changes */
  'stackChange': { stack: ScreenStackEntry[] };
}

// =============================================================================
// Screen Manager Class
// =============================================================================

let screenIdCounter = 0;

/**
 * Reset screen ID counter (for testing)
 */
export function resetScreenIdCounter(): void {
  screenIdCounter = 0;
}

/**
 * Generate a unique screen ID
 */
export function generateScreenId(): string {
  return `screen-${++screenIdCounter}`;
}

/**
 * Screen Manager
 */
export class ScreenManager extends EventEmitter {
  private options: Required<ScreenManagerOptions>;
  private stack: ScreenStackEntry[] = [];
  private currentIndex: number = -1;
  private transitioning: boolean = false;
  private transitionDirection: TransitionDirection = 'none';

  // Signals for reactive updates
  private _current: SignalAccessor<Screen | null>;
  private _stack: SignalAccessor<ScreenStackEntry[]>;
  private _transitioning: SignalAccessor<boolean>;
  private _transitionDirection: SignalAccessor<TransitionDirection>;

  constructor(options: ScreenManagerOptions = {}) {
    super();

    this.options = {
      initialScreen: options.initialScreen ?? undefined as unknown as Screen,
      defaultKeepAlive: options.defaultKeepAlive ?? false,
      escapeGoesBack: options.escapeGoesBack ?? true,
      maxStackSize: options.maxStackSize ?? 0,
      transitionDuration: options.transitionDuration ?? 300,
    };

    // Initialize signals
    const [current, setCurrent] = createSignal<Screen | null>(null);
    const [stack, setStack] = createSignal<ScreenStackEntry[]>([]);
    const [transitioning, setTransitioning] = createSignal(false);
    const [transitionDirection, setTransitionDirection] = createSignal<TransitionDirection>('none');

    this._current = { get: current, set: setCurrent };
    this._stack = { get: stack, set: setStack };
    this._transitioning = { get: transitioning, set: setTransitioning };
    this._transitionDirection = { get: transitionDirection, set: setTransitionDirection };

    // Push initial screen if provided
    if (this.options.initialScreen) {
      this.push(this.options.initialScreen);
    }
  }

  // ===========================================================================
  // Getters
  // ===========================================================================

  /**
   * Get current screen (reactive)
   */
  get current(): Screen | null {
    return this._current.get();
  }

  /**
   * Get screen stack (reactive)
   */
  get screenStack(): ScreenStackEntry[] {
    return this._stack.get();
  }

  /**
   * Check if transitioning (reactive)
   */
  get isTransitioning(): boolean {
    return this._transitioning.get();
  }

  /**
   * Get current transition direction (reactive)
   */
  get currentTransitionDirection(): TransitionDirection {
    return this._transitionDirection.get();
  }

  /**
   * Check if we can go back
   */
  get canGoBack(): boolean {
    return this.stack.length > 1;
  }

  /**
   * Get stack size
   */
  get stackSize(): number {
    return this.stack.length;
  }

  // ===========================================================================
  // Navigation Methods
  // ===========================================================================

  /**
   * Push a new screen onto the stack
   */
  async push(screen: Screen, options?: { animate?: boolean }): Promise<boolean> {
    return this.navigate(screen, 'forward', options);
  }

  /**
   * Pop the current screen and go back
   */
  async pop(options?: { animate?: boolean }): Promise<boolean> {
    if (this.stack.length <= 1) {
      return false;
    }

    const previousEntry = this.stack[this.stack.length - 2];
    if (!previousEntry) {
      return false;
    }

    return this.navigate(previousEntry.screen, 'back', options);
  }

  /**
   * Replace the current screen
   */
  async replace(screen: Screen, options?: { animate?: boolean }): Promise<boolean> {
    return this.navigate(screen, 'replace', options);
  }

  /**
   * Navigate to a screen
   */
  private async navigate(
    screen: Screen,
    direction: TransitionDirection,
    options?: { animate?: boolean }
  ): Promise<boolean> {
    if (this.transitioning) {
      return false;
    }

    const fromScreen = this.current;
    const event: ScreenNavigationEvent = {
      from: fromScreen,
      to: screen,
      direction,
    };

    // Emit beforeNavigate
    this.emit('beforeNavigate', event);

    // Check onBeforeExit guard
    if (fromScreen?.onBeforeExit) {
      const canExit = await fromScreen.onBeforeExit();
      if (canExit === false) {
        this.emit('navigateCancelled', { from: fromScreen, to: screen });
        return false;
      }
    }

    // Check onBeforeEnter guard
    if (screen.onBeforeEnter) {
      const canEnter = await screen.onBeforeEnter();
      if (canEnter === false) {
        this.emit('navigateCancelled', { from: fromScreen, to: screen });
        return false;
      }
    }

    // Start transition
    this.transitioning = true;
    this.transitionDirection = direction;

    batch(() => {
      this._transitioning.set(true);
      this._transitionDirection.set(direction);
    });

    // Call exit lifecycle
    if (fromScreen) {
      fromScreen.onExit?.();
      this.emit('screenExit', { screen: fromScreen });
    }

    // Update stack based on direction
    this.updateStack(screen, direction);

    // Update signals
    batch(() => {
      this._current.set(screen);
      this._stack.set([...this.stack]);
    });

    // Call enter lifecycle
    screen.onEnter?.();
    this.emit('screenEnter', { screen });

    // End transition after duration
    const animate = options?.animate ?? true;
    const duration = animate ? this.options.transitionDuration : 0;

    await this.delay(duration);

    this.transitioning = false;
    this.transitionDirection = 'none';

    batch(() => {
      this._transitioning.set(false);
      this._transitionDirection.set('none');
    });

    // Emit navigate
    this.emit('navigate', event);
    this.emit('stackChange', { stack: this.stack });

    return true;
  }

  private updateStack(screen: Screen, direction: TransitionDirection): void {
    const keepAlive = screen.keepAlive ?? this.options.defaultKeepAlive;

    switch (direction) {
      case 'forward': {
        // Push new entry
        const entry: ScreenStackEntry = {
          screen,
          enteredAt: Date.now(),
        };
        this.stack.push(entry);
        this.currentIndex = this.stack.length - 1;

        // Trim stack if needed
        if (this.options.maxStackSize > 0 && this.stack.length > this.options.maxStackSize) {
          this.stack.shift();
          this.currentIndex = this.stack.length - 1;
        }
        break;
      }

      case 'back': {
        // Pop current, go to previous
        const popped = this.stack.pop();

        // Clear cached output if not keep-alive
        if (popped && !popped.screen.keepAlive && !this.options.defaultKeepAlive) {
          popped.cachedOutput = undefined;
        }

        this.currentIndex = this.stack.length - 1;
        break;
      }

      case 'replace': {
        // Replace current entry
        if (this.stack.length > 0) {
          this.stack[this.stack.length - 1] = {
            screen,
            enteredAt: Date.now(),
          };
        } else {
          this.stack.push({
            screen,
            enteredAt: Date.now(),
          });
        }
        this.currentIndex = this.stack.length - 1;
        break;
      }

      case 'none': {
        // Just push the screen (used by reset)
        this.stack.push({
          screen,
          enteredAt: Date.now(),
        });
        this.currentIndex = this.stack.length - 1;
        break;
      }
    }
  }

  private delay(ms: number): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Go back to previous screen (convenience method for back button/escape)
   */
  async goBack(): Promise<boolean> {
    const current = this.current;
    if (!current) return false;

    // Check if screen has custom back handler
    if (current.onBack) {
      const handled = current.onBack();
      if (handled === true) {
        return true; // Screen handled the back itself
      }
    }

    return this.pop();
  }

  /**
   * Go back to the root screen
   */
  async popToRoot(options?: { animate?: boolean }): Promise<boolean> {
    if (this.stack.length <= 1) {
      return false;
    }

    const rootEntry = this.stack[0];
    if (!rootEntry) return false;

    // Navigate handles stack manipulation, so save the target and let navigate do the work
    // But we need to pop down to just the root first
    const fromScreen = this.current;

    // Clear intermediate screens
    while (this.stack.length > 1) {
      const popped = this.stack.pop();
      if (popped) {
        popped.screen.onExit?.();
      }
    }
    this.currentIndex = 0;

    // Update signals for the remaining stack
    batch(() => {
      this._current.set(rootEntry.screen);
      this._stack.set([...this.stack]);
    });

    // Call lifecycle
    rootEntry.screen.onEnter?.();

    // Emit events
    const event: ScreenNavigationEvent = {
      from: fromScreen,
      to: rootEntry.screen,
      direction: 'back',
    };
    this.emit('navigate', event);
    this.emit('stackChange', { stack: this.stack });

    return true;
  }

  /**
   * Navigate to a specific screen in the stack by ID
   */
  async popTo(screenId: string, options?: { animate?: boolean }): Promise<boolean> {
    const index = this.stack.findIndex(e => e.screen.id === screenId);
    if (index === -1 || index >= this.stack.length - 1) {
      return false;
    }

    const targetEntry = this.stack[index];
    if (!targetEntry) return false;

    const fromScreen = this.current;

    // Pop screens until we reach the target
    while (this.stack.length > index + 1) {
      const popped = this.stack.pop();
      if (popped) {
        popped.screen.onExit?.();
      }
    }
    this.currentIndex = index;

    // Update signals
    batch(() => {
      this._current.set(targetEntry.screen);
      this._stack.set([...this.stack]);
    });

    // Call lifecycle
    targetEntry.screen.onEnter?.();

    // Emit events
    const event: ScreenNavigationEvent = {
      from: fromScreen,
      to: targetEntry.screen,
      direction: 'back',
    };
    this.emit('navigate', event);
    this.emit('stackChange', { stack: this.stack });

    return true;
  }

  /**
   * Clear the entire stack and start fresh
   */
  async reset(screen: Screen, options?: { animate?: boolean }): Promise<boolean> {
    const fromScreen = this.current;

    // Clear all screens, calling exit lifecycle
    for (const entry of this.stack) {
      entry.screen.onExit?.();
    }

    this.stack = [];
    this.currentIndex = -1;

    // Push the new screen
    return this.navigate(screen, 'none', options);
  }

  // ===========================================================================
  // Screen State Management
  // ===========================================================================

  /**
   * Get the current screen's cached state
   */
  getScreenState(): Record<string, unknown> | undefined {
    const entry = this.stack[this.currentIndex];
    return entry?.state;
  }

  /**
   * Set state for the current screen
   */
  setScreenState(state: Record<string, unknown>): void {
    const entry = this.stack[this.currentIndex];
    if (entry) {
      entry.state = { ...entry.state, ...state };
    }
  }

  /**
   * Cache the current screen's output
   */
  cacheScreenOutput(output: unknown): void {
    const entry = this.stack[this.currentIndex];
    if (entry && (entry.screen.keepAlive || this.options.defaultKeepAlive)) {
      entry.cachedOutput = output;
    }
  }

  /**
   * Get cached output for current screen
   */
  getCachedOutput(): unknown | undefined {
    const entry = this.stack[this.currentIndex];
    return entry?.cachedOutput;
  }

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  /**
   * Handle escape key press (for back navigation)
   */
  handleEscape(): boolean {
    if (!this.options.escapeGoesBack) {
      return false;
    }

    if (this.canGoBack) {
      this.goBack();
      return true;
    }

    return false;
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  /**
   * Check if a screen is in the stack
   */
  hasScreen(screenId: string): boolean {
    return this.stack.some(e => e.screen.id === screenId);
  }

  /**
   * Get a screen from the stack by ID
   */
  getScreen(screenId: string): Screen | undefined {
    const entry = this.stack.find(e => e.screen.id === screenId);
    return entry?.screen;
  }

  /**
   * Get the current state snapshot
   */
  getState(): ScreenManagerState {
    return {
      current: this.current,
      stack: [...this.stack],
      transitioning: this.transitioning,
      transitionDirection: this.transitionDirection,
    };
  }
}

// =============================================================================
// Global Screen Manager
// =============================================================================

let globalScreenManager: ScreenManager | null = null;

/**
 * Get the global screen manager
 */
export function getScreenManager(): ScreenManager {
  if (!globalScreenManager) {
    globalScreenManager = new ScreenManager();
  }
  return globalScreenManager;
}

/**
 * Reset the global screen manager (for testing)
 */
export function resetScreenManager(): void {
  globalScreenManager = null;
}

/**
 * Create a new screen manager
 */
export function createScreenManager(options?: ScreenManagerOptions): ScreenManager {
  return new ScreenManager(options);
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Create a screen definition
 */
export function createScreen<P = unknown>(
  component: ScreenComponent<P>,
  options?: Omit<Screen<P>, 'id' | 'component'>
): Screen<P> {
  return {
    id: generateScreenId(),
    component,
    ...options,
  };
}

/**
 * Push a screen to the global manager
 */
export async function pushScreen(screen: Screen): Promise<boolean> {
  return getScreenManager().push(screen);
}

/**
 * Pop the current screen from the global manager
 */
export async function popScreen(): Promise<boolean> {
  return getScreenManager().pop();
}

/**
 * Replace the current screen in the global manager
 */
export async function replaceScreen(screen: Screen): Promise<boolean> {
  return getScreenManager().replace(screen);
}

/**
 * Go back in the global manager
 */
export async function goBack(): Promise<boolean> {
  return getScreenManager().goBack();
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook result for useScreen
 */
export interface UseScreenResult {
  /** Current screen */
  current: Screen | null;
  /** Whether transitioning */
  transitioning: boolean;
  /** Transition direction */
  transitionDirection: TransitionDirection;
  /** Can go back */
  canGoBack: boolean;
  /** Push a new screen */
  push: (screen: Screen) => Promise<boolean>;
  /** Pop current screen */
  pop: () => Promise<boolean>;
  /** Replace current screen */
  replace: (screen: Screen) => Promise<boolean>;
  /** Go back */
  goBack: () => Promise<boolean>;
}

/**
 * Hook for accessing screen manager in components
 */
export function useScreen(manager?: ScreenManager): UseScreenResult {
  const mgr = manager ?? getScreenManager();

  return {
    get current() {
      return mgr.current;
    },
    get transitioning() {
      return mgr.isTransitioning;
    },
    get transitionDirection() {
      return mgr.currentTransitionDirection;
    },
    get canGoBack() {
      return mgr.canGoBack;
    },
    push: (screen: Screen) => mgr.push(screen),
    pop: () => mgr.pop(),
    replace: (screen: Screen) => mgr.replace(screen),
    goBack: () => mgr.goBack(),
  };
}

/**
 * Hook for managing screen state
 */
export function useScreenState<T extends Record<string, unknown>>(
  manager?: ScreenManager
): [T | undefined, (state: Partial<T>) => void] {
  const mgr = manager ?? getScreenManager();

  const getState = () => mgr.getScreenState() as T | undefined;
  const setState = (state: Partial<T>) => {
    mgr.setScreenState(state as Record<string, unknown>);
  };

  return [getState(), setState];
}
