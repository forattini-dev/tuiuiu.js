import type { Key } from '../core/hotkeys.js';
import {
  getRuntimeResource,
  RUNTIME_RESOURCE_DISPOSE,
  type RuntimeScope,
} from '../core/runtime-scope.js';

export type InteractionEvent =
  | {
      type: 'key';
      key: InteractionKeyEvent;
    }
  | {
      type: 'paste';
      text: string;
      bracketed: boolean;
    }
  | {
      type: 'command';
      source?: string;
    };

export interface InteractionKeyModifiers {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

export interface InteractionKeyEvent {
  /** Canonical key name (`arrowup`, `enter`, `a`, ...). */
  name: string;
  /** Text produced by the key, empty for non-text keys. */
  text: string;
  modifiers: InteractionKeyModifiers;
  phase: 'press' | 'repeat' | 'release';
  /** Terminal-parser payload used only by low-level text-control adapters. */
  readonly native: Key;
}

export interface CommandContext {
  event: InteractionEvent;
  mode: string;
  target?: string;
  runtime: InteractionRuntime;
}

export interface CommandDefinition {
  id: string;
  title: string;
  description?: string;
  category?: string;
  enabled?: () => boolean;
  run: (context: CommandContext) => void | Promise<void>;
}

export interface CommandBinding {
  command: string;
  /** One key chord or an ordered key sequence. */
  keys: string | readonly string[];
  mode?: string;
  target?: string;
  priority?: number;
  when?: () => boolean;
}

export interface InteractionHandlerOptions {
  mode?: string;
  target?: string;
  priority?: number;
}

export interface InteractionModeOptions {
  mode: string;
  target?: string;
  exclusive?: boolean;
}

export interface Disposable {
  readonly disposed: boolean;
  dispose(): void;
}

export interface CommandRegistration extends Disposable {
  update(definition: CommandDefinition): void;
}

export interface BindingRegistration extends Disposable {
  update(binding: CommandBinding): void;
}

export interface InteractionLease extends Disposable {
  readonly id: number;
  readonly mode: string;
  readonly target?: string;
  readonly exclusive: boolean;
}

export type InteractionDispatchResult =
  | { status: 'handled'; command?: string }
  | { status: 'blocked' }
  | { status: 'unhandled' };

export interface InteractionConflict {
  mode: string;
  target?: string;
  key: string;
  priority: number;
  commands: string[];
}

export interface InteractionSnapshot {
  mode: string;
  target?: string;
  exclusive: boolean;
  modes: Array<{
    id: number;
    mode: string;
    target?: string;
    exclusive: boolean;
  }>;
  commands: CommandDefinition[];
  bindings: Array<CommandBinding & { id: number }>;
  conflicts: InteractionConflict[];
}

export interface InteractionRuntimeOptions {
  onCommandError?: (error: unknown, command: CommandDefinition) => void;
  warnOnConflict?: boolean;
  /** Maximum delay between chords in a sequence (default: 1000ms). */
  sequenceTimeoutMs?: number;
}

export interface InteractionRuntime extends Disposable {
  registerCommand(definition: CommandDefinition): CommandRegistration;
  bind(binding: CommandBinding): BindingRegistration;
  registerHandler(
    handler: (event: InteractionEvent) => boolean | void,
    options?: InteractionHandlerOptions,
  ): Disposable;
  enter(options: InteractionModeOptions): InteractionLease;
  execute(commandId: string, event?: InteractionEvent): InteractionDispatchResult;
  dispatch(event: InteractionEvent): InteractionDispatchResult;
  inspect(): InteractionSnapshot;
  subscribe(listener: (snapshot: InteractionSnapshot) => void): () => void;
}

interface ModeEntry {
  id: number;
  mode: string;
  target?: string;
  exclusive: boolean;
  order: number;
}

interface BindingEntry extends Omit<CommandBinding, 'keys'> {
  id: number;
  keys: string[];
  order: number;
}

interface HandlerEntry extends InteractionHandlerOptions {
  id: number;
  order: number;
  handler: (event: InteractionEvent) => boolean | void;
}

interface RankedBinding {
  entry: BindingEntry;
  modeRank: number;
  targetRank: number;
}

interface RankedHandler {
  entry: HandlerEntry;
  modeRank: number;
  targetRank: number;
}

const INTERACTION_RUNTIME = Symbol('tuiuiu.interaction-runtime');
const INTERACTION_TESTING = Symbol('tuiuiu.interaction-testing');

interface InteractionTestingControls {
  clearHandlers(): void;
  handlerCount(): number;
}

function requireName(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} must be a non-empty string`);
  return normalized;
}

function normalizeKeyName(value: string): string {
  const aliases: Record<string, string> = {
    esc: 'escape',
    return: 'enter',
    space: ' ',
    up: 'arrowup',
    down: 'arrowdown',
    left: 'arrowleft',
    right: 'arrowright',
    pgup: 'pageup',
    pgdn: 'pagedown',
    del: 'delete',
  };
  const normalized = value.trim().toLowerCase();
  return aliases[normalized] ?? normalized;
}

interface ParsedChord {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

function parseChord(value: string): ParsedChord {
  const chord: ParsedChord = {
    key: '',
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
  };

  for (const part of value.split('+').map((item) => item.trim().toLowerCase())) {
    if (part === 'ctrl' || part === 'control') chord.ctrl = true;
    else if (part === 'alt' || part === 'option') chord.alt = true;
    else if (part === 'shift') chord.shift = true;
    else if (part === 'meta' || part === 'cmd' || part === 'command') chord.meta = true;
    else chord.key = normalizeKeyName(part);
  }

  if (!chord.key) throw new TypeError(`Invalid key binding: "${value}"`);
  return chord;
}

function keyName(input: string, key: Key): string {
  if (key.upArrow) return 'arrowup';
  if (key.downArrow) return 'arrowdown';
  if (key.leftArrow) return 'arrowleft';
  if (key.rightArrow) return 'arrowright';
  if (key.pageUp) return 'pageup';
  if (key.pageDown) return 'pagedown';
  if (key.home) return 'home';
  if (key.end) return 'end';
  if (key.insert) return 'insert';
  if (key.return) return 'enter';
  if (key.escape) return 'escape';
  if (key.tab) return 'tab';
  if (key.backspace) return 'backspace';
  if (key.delete) return 'delete';
  if (key.clear) return 'clear';
  for (let index = 1; index <= 12; index++) {
    if (key[`f${index}` as keyof Key]) return `f${index}`;
  }
  if (key.ctrl && input.length === 1) {
    const code = input.charCodeAt(0);
    if (code >= 1 && code <= 26) return String.fromCharCode(code + 96);
  }
  return normalizeKeyName(input);
}

export function createInteractionKeyEvent(input: string, key: Key): InteractionKeyEvent {
  return {
    name: keyName(input, key),
    text: input,
    modifiers: {
      ctrl: Boolean(key.ctrl),
      alt: Boolean(key.option || (key.meta && !key.option)),
      shift: Boolean(key.shift),
      meta: Boolean(key.meta && !key.option),
    },
    phase: key.eventType ?? 'press',
    native: key,
  };
}

function matchesChord(event: InteractionEvent, value: string): boolean {
  if (event.type !== 'key') return false;
  const chord = parseChord(value);
  return chord.key === event.key.name
    && chord.ctrl === event.key.modifiers.ctrl
    && chord.shift === event.key.modifiers.shift
    && chord.alt === event.key.modifiers.alt
    && chord.meta === event.key.modifiers.meta;
}

function makeDisposable(dispose: () => void): Disposable {
  let isDisposed = false;
  return {
    get disposed() {
      return isDisposed;
    },
    dispose() {
      if (isDisposed) return;
      isDisposed = true;
      dispose();
    },
  };
}

function normalizeBinding(binding: CommandBinding): Omit<BindingEntry, 'id' | 'order'> {
  const command = requireName(binding.command, 'Binding command');
  const keys = (Array.isArray(binding.keys) ? binding.keys : [binding.keys])
    .map((key) => requireName(key, 'Binding key'));
  keys.forEach(parseChord);
  if (keys.length === 0) throw new TypeError('Binding keys must not be empty');
  return {
    ...binding,
    command,
    keys,
  };
}

export function createInteractionRuntime(
  options: InteractionRuntimeOptions = {},
): InteractionRuntime {
  const commands = new Map<string, CommandDefinition>();
  const bindings = new Map<number, BindingEntry>();
  const handlers = new Map<number, HandlerEntry>();
  const modes = new Map<number, ModeEntry>();
  const warnedConflicts = new Set<string>();
  const listeners = new Set<(snapshot: InteractionSnapshot) => void>();
  let nextId = 1;
  let nextOrder = 1;
  let isDisposed = false;
  let pendingSequence: Array<Extract<InteractionEvent, { type: 'key' }>> = [];
  let sequenceTimer: ReturnType<typeof setTimeout> | null = null;

  const clearSequence = () => {
    pendingSequence = [];
    if (sequenceTimer) clearTimeout(sequenceTimer);
    sequenceTimer = null;
  };

  const armSequenceTimeout = () => {
    if (sequenceTimer) clearTimeout(sequenceTimer);
    const timeout = options.sequenceTimeoutMs ?? 1000;
    if (!Number.isFinite(timeout) || timeout < 0) {
      throw new RangeError('sequenceTimeoutMs must be a finite non-negative number');
    }
    sequenceTimer = setTimeout(clearSequence, timeout);
    sequenceTimer.unref?.();
  };

  const assertActive = () => {
    if (isDisposed) throw new Error('InteractionRuntime has been disposed');
  };

  const runCommand = (
    command: CommandDefinition,
    event: InteractionEvent,
    active: ModeEntry,
  ): InteractionDispatchResult => {
    if (command.enabled?.() === false) return { status: 'unhandled' };
    try {
      const result = command.run({
        event,
        mode: active.mode,
        target: active.target,
        runtime,
      });
      if (result && typeof result.then === 'function') {
        void result.catch((error) => {
          if (options.onCommandError) options.onCommandError(error, command);
          else console.error(`[tuiuiu] Command failed: ${command.id}`, error);
        });
      }
    } catch (error) {
      if (options.onCommandError) options.onCommandError(error, command);
      else console.error(`[tuiuiu] Command failed: ${command.id}`, error);
    }
    return { status: 'handled', command: command.id };
  };

  const activeMode = (): ModeEntry => {
    const current = [...modes.values()].sort((left, right) => right.order - left.order)[0];
    return current ?? {
      id: 0,
      mode: 'global',
      exclusive: false,
      order: 0,
    };
  };

  const rankBinding = (entry: BindingEntry, active: ModeEntry): RankedBinding | null => {
    const mode = entry.mode ?? 'global';
    const modeRank = mode === active.mode ? 2 : mode === 'global' && !active.exclusive ? 1 : 0;
    if (modeRank === 0) return null;
    const targetRank = entry.target === active.target ? (entry.target === undefined ? 1 : 2) : 0;
    if (entry.target !== undefined && targetRank === 0) return null;
    return { entry, modeRank, targetRank };
  };

  const rankHandler = (entry: HandlerEntry, active: ModeEntry): RankedHandler | null => {
    const mode = entry.mode ?? 'global';
    const modeRank = mode === active.mode ? 2 : mode === 'global' && !active.exclusive ? 1 : 0;
    if (modeRank === 0) return null;
    const targetRank = entry.target === active.target ? (entry.target === undefined ? 1 : 2) : 0;
    if (entry.target !== undefined && targetRank === 0) return null;
    return { entry, modeRank, targetRank };
  };

  const compareRanked = <T extends { entry: { priority?: number; order: number }; modeRank: number; targetRank: number }>(
    left: T,
    right: T,
  ) => right.modeRank - left.modeRank
    || right.targetRank - left.targetRank
    || (right.entry.priority ?? 0) - (left.entry.priority ?? 0)
    || right.entry.order - left.entry.order;

  const conflicts = (): InteractionConflict[] => {
    const grouped = new Map<string, BindingEntry[]>();
    for (const entry of bindings.values()) {
      const sequence = entry.keys.join(' ');
      const groupKey = `${entry.mode ?? 'global'}\u0000${entry.target ?? ''}\u0000${entry.priority ?? 0}\u0000${sequence}`;
      grouped.set(groupKey, [...(grouped.get(groupKey) ?? []), entry]);
    }
    return [...grouped.entries()].flatMap(([groupKey, entries]) => {
      if (entries.length < 2) return [];
      const [mode, target, priority, key] = groupKey.split('\u0000');
      return [{
        mode: mode!,
        target: target || undefined,
        key: key!,
        priority: Number(priority),
        commands: entries.map((entry) => entry.command),
      }];
    });
  };

  const snapshot = (): InteractionSnapshot => {
    const active = activeMode();
    return {
      mode: active.mode,
      target: active.target,
      exclusive: active.exclusive,
      modes: [...modes.values()]
        .sort((left, right) => left.order - right.order)
        .map(({ id, mode, target, exclusive }) => ({
          id,
          mode,
          target,
          exclusive,
        })),
      commands: [...commands.values()].map((command) => ({ ...command })),
      bindings: [...bindings.values()].map(({ id, command, keys, mode, target, priority, when }) => ({
        id,
        command,
        keys: [...keys],
        mode,
        target,
        priority,
        when,
      })),
      conflicts: conflicts(),
    };
  };

  const notify = () => {
    const next = snapshot();
    for (const listener of [...listeners]) listener(next);
  };

  const runtime: InteractionRuntime = {
    get disposed() {
      return isDisposed;
    },
    dispose() {
      if (isDisposed) return;
      isDisposed = true;
      commands.clear();
      bindings.clear();
      handlers.clear();
      modes.clear();
      warnedConflicts.clear();
      listeners.clear();
      clearSequence();
    },
    registerCommand(definition) {
      assertActive();
      const id = requireName(definition.id, 'Command id');
      requireName(definition.title, 'Command title');
      if (commands.has(id)) throw new Error(`Command already registered: ${id}`);
      const stored = { ...definition, id };
      commands.set(id, stored);
      notify();
      let isRegistrationDisposed = false;
      return {
        get disposed() {
          return isRegistrationDisposed;
        },
        update(nextDefinition) {
          assertActive();
          if (isRegistrationDisposed) throw new Error('Command registration has been disposed');
          const nextId = requireName(nextDefinition.id, 'Command id');
          requireName(nextDefinition.title, 'Command title');
          if (nextId !== id) throw new Error('Command id cannot change during registration');
          commands.set(id, { ...nextDefinition, id });
          notify();
        },
        dispose() {
          if (isRegistrationDisposed) return;
          isRegistrationDisposed = true;
          commands.delete(id);
          notify();
        },
      };
    },
    bind(binding) {
      assertActive();
      const id = nextId++;
      bindings.set(id, {
        ...normalizeBinding(binding),
        id,
        order: nextOrder++,
      });
      notify();
      if (options.warnOnConflict !== false && process.env.NODE_ENV !== 'production') {
        for (const conflict of conflicts()) {
          const key = `${conflict.mode}:${conflict.target ?? ''}:${conflict.priority}:${conflict.key}`;
          if (warnedConflicts.has(key)) continue;
          warnedConflicts.add(key);
          console.warn(
            `[tuiuiu] Interaction binding conflict for ${conflict.key} in ${conflict.mode}: ${conflict.commands.join(', ')}`,
          );
        }
      }
      let isRegistrationDisposed = false;
      return {
        get disposed() {
          return isRegistrationDisposed;
        },
        update(nextBinding) {
          assertActive();
          if (isRegistrationDisposed) throw new Error('Binding registration has been disposed');
          const current = bindings.get(id);
          if (!current) throw new Error('Binding registration is no longer active');
          bindings.set(id, {
            ...normalizeBinding(nextBinding),
            id,
            order: current.order,
          });
          notify();
        },
        dispose() {
          if (isRegistrationDisposed) return;
          isRegistrationDisposed = true;
          bindings.delete(id);
          notify();
        },
      };
    },
    registerHandler(handler, handlerOptions = {}) {
      assertActive();
      const id = nextId++;
      handlers.set(id, {
        ...handlerOptions,
        id,
        order: nextOrder++,
        handler,
      });
      return makeDisposable(() => handlers.delete(id));
    },
    enter(modeOptions) {
      assertActive();
      const id = nextId++;
      const entry: ModeEntry = {
        id,
        mode: requireName(modeOptions.mode, 'Interaction mode'),
        target: modeOptions.target,
        exclusive: modeOptions.exclusive ?? false,
        order: nextOrder++,
      };
      modes.set(id, entry);
      clearSequence();
      notify();
      let isLeaseDisposed = false;
      return {
        id,
        mode: entry.mode,
        target: entry.target,
        exclusive: entry.exclusive,
        get disposed() {
          return isLeaseDisposed;
        },
        dispose() {
          if (isLeaseDisposed) return;
          isLeaseDisposed = true;
          modes.delete(id);
          clearSequence();
          notify();
        },
      };
    },
    execute(commandId, event = { type: 'command' }) {
      assertActive();
      const command = commands.get(requireName(commandId, 'Command id'));
      return command ? runCommand(command, event, activeMode()) : { status: 'unhandled' };
    },
    dispatch(event) {
      assertActive();
      const active = activeMode();
      if (event.type === 'key') {
        const resolveSequence = (
          prior: Array<Extract<InteractionEvent, { type: 'key' }>>,
        ): InteractionDispatchResult | null => {
          const events = [...prior, event];
          const prefixes = [...bindings.values()]
            .filter((entry) => entry.when?.() ?? true)
            .filter((entry) => {
              const command = commands.get(entry.command);
              return Boolean(command && command.enabled?.() !== false);
            })
            .filter((entry) => entry.keys.length >= events.length)
            .filter((entry) => events.every((candidate, index) => (
              matchesChord(candidate, entry.keys[index]!)
            )))
            .flatMap((entry) => {
              const ranked = rankBinding(entry, active);
              return ranked ? [ranked] : [];
            })
            .sort(compareRanked);

          const exact = prefixes.filter((candidate) => candidate.entry.keys.length === events.length);
          for (const candidate of exact) {
            const command = commands.get(candidate.entry.command);
            if (!command || command.enabled?.() === false) continue;
            clearSequence();
            return runCommand(command, event, active);
          }

          if (prefixes.length > 0) {
            pendingSequence = events;
            armSequenceTimeout();
            return { status: 'handled' };
          }
          return null;
        };

        const sequenceResult = resolveSequence(pendingSequence);
        if (sequenceResult) return sequenceResult;
        if (pendingSequence.length > 0) {
          clearSequence();
          const freshResult = resolveSequence([]);
          if (freshResult) return freshResult;
        }
      }

      const raw = [...handlers.values()]
        .flatMap((entry) => {
          const ranked = rankHandler(entry, active);
          return ranked ? [ranked] : [];
        })
        .sort(compareRanked);
      for (const candidate of raw) {
        try {
          if (candidate.entry.handler(event)) return { status: 'handled' };
        } catch (error) {
          console.error('[tuiuiu] Interaction handler failed:', error);
        }
      }

      return active.exclusive
        ? { status: 'blocked' }
        : { status: 'unhandled' };
    },
    inspect() {
      assertActive();
      return snapshot();
    },
    subscribe(listener) {
      assertActive();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  Object.assign(runtime, {
    [RUNTIME_RESOURCE_DISPOSE]: () => runtime.dispose(),
    [INTERACTION_TESTING]: {
      clearHandlers() {
        handlers.clear();
      },
      handlerCount() {
        return handlers.size;
      },
    } satisfies InteractionTestingControls,
  });
  return runtime;
}

/** @internal Test entry-point support; deliberately absent from `./interaction`. */
export function clearInteractionHandlersForTesting(): void {
  const controls = (getInteractionRuntime() as InteractionRuntime & {
    [INTERACTION_TESTING]: InteractionTestingControls;
  })[INTERACTION_TESTING];
  controls.clearHandlers();
}

/** @internal Test entry-point support; deliberately absent from `./interaction`. */
export function getInteractionHandlerCountForTesting(): number {
  const controls = (getInteractionRuntime() as InteractionRuntime & {
    [INTERACTION_TESTING]: InteractionTestingControls;
  })[INTERACTION_TESTING];
  return controls.handlerCount();
}

export function getInteractionRuntime(scope?: RuntimeScope): InteractionRuntime {
  return getRuntimeResource(
    INTERACTION_RUNTIME,
    createInteractionRuntime,
    scope,
  );
}

export function dispatchInteractionEvent(
  event: InteractionEvent,
): InteractionDispatchResult {
  return getInteractionRuntime().dispatch(event);
}
