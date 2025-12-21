/**
 * Programmatic Control Examples Index
 *
 * This module documents patterns for controlling Tuiuiu components
 * programmatically without requiring keyboard focus or user interaction.
 *
 * Examples:
 *
 * 1. scroll-control.ts
 *    - External scroll state management
 *    - API-driven scroll commands (scrollToItem, scrollBy, etc.)
 *    - Timer-based auto-scroll
 *    Run: npx tsx examples/programmatic/scroll-control.ts
 *
 * 2. state-management.ts
 *    - External signal-based state stores
 *    - Multiple components sharing state
 *    - Real-time data updates pattern
 *    Run: npx tsx examples/programmatic/state-management.ts
 *
 * 3. external-triggers.ts
 *    - Timer-based animations
 *    - Command queue pattern
 *    - Event-driven state changes
 *    Run: npx tsx examples/programmatic/external-triggers.ts
 *
 * Key Patterns:
 *
 * ## 1. External State Controller
 *
 * ```typescript
 * import { createSignal } from 'tuiuiu.js';
 *
 * // Create state outside component
 * function createController() {
 *   const [state, setState] = createSignal(initialState);
 *   return {
 *     state,
 *     action1: () => setState(...),
 *     action2: (value) => setState(...),
 *   };
 * }
 *
 * const controller = createController();
 *
 * // Control from anywhere
 * controller.action1();
 * setInterval(() => controller.action2(Date.now()), 1000);
 *
 * // Use in component
 * function MyComponent() {
 *   const state = controller.state();
 *   return Text({}, state.value);
 * }
 * ```
 *
 * ## 2. Command Queue Pattern
 *
 * ```typescript
 * const commands = createSignal<Command[]>([]);
 *
 * // Enqueue from external source
 * websocket.on('command', (cmd) => {
 *   commands.set([...commands.get(), cmd]);
 * });
 *
 * // Process in effect
 * createEffect(() => {
 *   const queue = commands();
 *   if (queue.length > 0) {
 *     processCommand(queue[0]);
 *     commands.set(queue.slice(1));
 *   }
 * });
 * ```
 *
 * ## 3. Animation Controller
 *
 * ```typescript
 * const [frame, setFrame] = createSignal(0);
 * const [isPlaying, setIsPlaying] = createSignal(false);
 *
 * // Controlled externally
 * setInterval(() => {
 *   if (isPlaying()) {
 *     setFrame(f => (f + 1) % frames.length);
 *   }
 * }, 100);
 *
 * // API
 * const controller = {
 *   play: () => setIsPlaying(true),
 *   pause: () => setIsPlaying(false),
 *   getCurrentFrame: () => frames[frame()],
 * };
 * ```
 *
 * ## 4. Batch Updates
 *
 * ```typescript
 * import { batch } from 'tuiuiu.js';
 *
 * // Multiple state updates in single render
 * function processData(data) {
 *   batch(() => {
 *     setMetrics(data.metrics);
 *     setNotifications(data.notifications);
 *     setStatus(data.status);
 *   });
 * }
 * ```
 */

export { };
