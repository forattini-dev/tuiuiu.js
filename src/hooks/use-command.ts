import {
  getCurrentHookIndex,
  getHookState,
  getHookStateByIndex,
  registerHookCleanup,
  setHookState,
} from './context.js';
import {
  getInteractionRuntime,
  type BindingRegistration,
  type CommandBinding,
  type CommandDefinition,
  type CommandRegistration,
  type InteractionLease,
  type InteractionModeOptions,
  type InteractionEvent,
  type InteractionHandlerOptions,
  type Disposable,
} from '../interaction/runtime.js';

interface CommandHookState {
  definition: CommandDefinition;
  command: CommandRegistration;
}

interface BindingHookState {
  signature: string;
  binding: BindingRegistration | null;
}

interface ModeHookState {
  signature: string;
  lease: InteractionLease | null;
}

interface ShortcutHookState {
  definition: CommandDefinition;
  command: CommandRegistration;
  signature: string;
  bindings: BindingRegistration[];
}

interface InteractionHookState {
  handler: (event: InteractionEvent) => boolean | void;
  registration: Disposable | null;
  signature: string;
}

export interface ShortcutOptions {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  mode?: string;
  target?: string;
  priority?: number;
  isActive?: boolean;
}

function bindingSignature(binding: CommandBinding): string {
  return JSON.stringify({
    command: binding.command,
    keys: Array.isArray(binding.keys) ? binding.keys : [binding.keys],
    mode: binding.mode,
    target: binding.target,
    priority: binding.priority,
  });
}

function modeSignature(options: InteractionModeOptions): string {
  return JSON.stringify(options);
}

export function useCommand(definition: CommandDefinition): void {
  const { value, isNew } = getHookState<CommandHookState | null>(null);
  const hookIndex = getCurrentHookIndex();
  if (isNew || value === null) {
    const data = {
      definition,
      command: null as unknown as CommandRegistration,
    };
    setHookState(hookIndex, data);
    data.command = getInteractionRuntime().registerCommand({
      ...definition,
      enabled: () => {
        const current = getHookStateByIndex(hookIndex) as CommandHookState | null;
        return current?.definition.enabled?.() ?? true;
      },
      run: (context) => {
        const current = getHookStateByIndex(hookIndex) as CommandHookState | null;
        return current?.definition.run(context);
      },
    });
    registerHookCleanup(() => data.command.dispose(), hookIndex);
    return;
  }

  if (value.definition.id !== definition.id) {
    throw new Error('useCommand id must remain stable across renders');
  }
  value.definition = definition;
  value.command.update({
    ...definition,
    enabled: () => {
      const current = getHookStateByIndex(hookIndex) as CommandHookState | null;
      return current?.definition.enabled?.() ?? true;
    },
    run: (context) => {
      const current = getHookStateByIndex(hookIndex) as CommandHookState | null;
      return current?.definition.run(context);
    },
  });
}

export function useCommandBinding(binding: CommandBinding, isActive = true): void {
  const { value, isNew } = getHookState<BindingHookState | null>(null);
  const hookIndex = getCurrentHookIndex();
  const signature = bindingSignature(binding);
  if (isNew || value === null) {
    const data = {
      signature,
      binding: isActive
        ? getInteractionRuntime().bind(binding)
        : null,
    };
    setHookState(hookIndex, data);
    registerHookCleanup(() => data.binding?.dispose(), hookIndex);
    return;
  }

  const shouldRegister = isActive && value.binding === null;
  const shouldDispose = !isActive && value.binding !== null;
  if (!shouldRegister && !shouldDispose && value.binding) {
    value.binding.update(binding);
    value.signature = signature;
    return;
  }
  value.binding?.dispose();
  value.signature = signature;
  value.binding = shouldRegister
    ? getInteractionRuntime().bind(binding)
    : null;
}

export function useInteractionMode(
  options: InteractionModeOptions,
  isActive = true,
): InteractionLease | null {
  const { value, isNew } = getHookState<ModeHookState | null>(null);
  const hookIndex = getCurrentHookIndex();
  const signature = modeSignature(options);
  if (isNew || value === null) {
    const data = {
      signature,
      lease: isActive ? getInteractionRuntime().enter(options) : null,
    };
    setHookState(hookIndex, data);
    registerHookCleanup(() => data.lease?.dispose(), hookIndex);
    return data.lease;
  }

  if (isActive && (!value.lease || value.lease.disposed || value.signature !== signature)) {
    value.lease?.dispose();
    value.signature = signature;
    value.lease = getInteractionRuntime().enter(options);
  } else if (!isActive && value.lease) {
    value.lease.dispose();
    value.lease = null;
  }
  return value.lease;
}

/**
 * Concise semantic shortcut for local actions. It creates one owned command
 * plus exact InteractionRuntime registrations.
 */
export function useShortcut(
  keys: string | readonly string[],
  handler: () => void | Promise<void>,
  options: ShortcutOptions = {},
): void {
  const { value, isNew } = getHookState<ShortcutHookState | null>(null);
  const hookSlot = getCurrentHookIndex();
  const alternatives = typeof keys === 'string' ? [keys] : [...keys];
  if (alternatives.length === 0) throw new TypeError('useShortcut requires at least one key');
  const id = options.id ?? `shortcut:${hookSlot.scope.id}:${hookSlot.id}`;
  const definition: CommandDefinition = {
    id,
    title: options.title ?? alternatives.join(' / '),
    description: options.description,
    category: options.category,
    run: handler,
  };
  const signature = JSON.stringify({
    alternatives,
    mode: options.mode,
    target: options.target,
    priority: options.priority,
    active: options.isActive ?? true,
  });

  const bindAll = () => (options.isActive ?? true)
    ? alternatives.map((key) => getInteractionRuntime().bind({
        command: id,
        keys: key,
        mode: options.mode,
        target: options.target,
        priority: options.priority,
      }))
    : [];

  if (isNew || value === null) {
    const command = getInteractionRuntime().registerCommand(definition);
    const state: ShortcutHookState = {
      definition,
      command,
      signature,
      bindings: bindAll(),
    };
    setHookState(hookSlot, state);
    registerHookCleanup(() => {
      for (const binding of state.bindings) binding.dispose();
      state.command.dispose();
    }, hookSlot);
    return;
  }

  if (value.definition.id !== id) {
    throw new Error('useShortcut id must remain stable across renders');
  }
  value.definition = definition;
  value.command.update(definition);
  if (value.signature !== signature) {
    for (const binding of value.bindings) binding.dispose();
    value.bindings = bindAll();
    value.signature = signature;
  }
}

/** Owner-safe access to normalized events for text editors and protocol tools. */
export function useInteraction(
  handler: (event: InteractionEvent) => boolean | void,
  options: InteractionHandlerOptions = {},
  isActive = true,
): void {
  const { value, isNew } = getHookState<InteractionHookState | null>(null);
  const hookSlot = getCurrentHookIndex();
  const signature = JSON.stringify(options);
  const register = (state: InteractionHookState) => getInteractionRuntime().registerHandler(
    (event) => state.handler(event),
    options,
  );
  if (isNew || value === null) {
    const state: InteractionHookState = { handler, registration: null, signature };
    if (isActive) state.registration = register(state);
    setHookState(hookSlot, state);
    registerHookCleanup(() => state.registration?.dispose(), hookSlot);
    return;
  }
  value.handler = handler;
  if (!isActive || value.signature !== signature) {
    value.registration?.dispose();
    value.registration = null;
  }
  value.signature = signature;
  if (isActive && !value.registration) value.registration = register(value);
}
