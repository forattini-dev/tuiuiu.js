import {
  getInteractionRuntime,
  type BindingRegistration,
  type CommandBinding,
  type CommandDefinition,
  type CommandRegistration,
  type Disposable,
  type InteractionEvent,
  type InteractionLease,
  type InteractionRuntime,
} from './runtime.js';

export interface InteractionTargetOptions {
  id: string;
  mode?: string;
  exclusive?: boolean;
  runtime?: InteractionRuntime;
}

export interface TargetCommandHandle extends Disposable {
  readonly command: CommandRegistration;
  readonly bindings: readonly BindingRegistration[];
}

export interface InteractionTarget extends Disposable {
  readonly id: string;
  readonly mode: string;
  readonly focused: boolean;
  focus(): void;
  blur(): void;
  command(
    definition: CommandDefinition,
    bindings?: string | readonly string[] | readonly (string | readonly string[])[],
  ): TargetCommandHandle;
  handle(
    handler: (event: InteractionEvent) => boolean | void,
    priority?: number,
  ): Disposable;
}

function requireName(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} must be a non-empty string`);
  return normalized;
}

export function createInteractionTarget(
  options: InteractionTargetOptions,
): InteractionTarget {
  const runtime = options.runtime ?? getInteractionRuntime();
  const id = requireName(options.id, 'Interaction target id');
  const mode = requireName(options.mode ?? 'control', 'Interaction target mode');
  const owned = new Set<Disposable>();
  let lease: InteractionLease | null = null;
  let disposed = false;

  const assertActive = () => {
    if (disposed) throw new Error(`InteractionTarget has been disposed: ${id}`);
  };

  const target: InteractionTarget = {
    id,
    mode,
    get focused() {
      return lease !== null && !lease.disposed;
    },
    get disposed() {
      return disposed;
    },
    focus() {
      assertActive();
      lease?.dispose();
      lease = runtime.enter({
        mode,
        target: id,
        exclusive: options.exclusive ?? false,
      });
    },
    blur() {
      lease?.dispose();
      lease = null;
    },
    command(definition, bindings = []) {
      assertActive();
      const command = runtime.registerCommand(definition);
      const inputs = typeof bindings === 'string'
        ? [bindings]
        : bindings.length > 0 && typeof bindings[0] === 'string'
          ? [bindings as readonly string[]]
          : bindings as readonly (string | readonly string[])[];
      const registrations = inputs.map((keys) => runtime.bind({
        command: definition.id,
        keys,
        mode,
        target: id,
      } satisfies CommandBinding));
      let handleDisposed = false;
      const handle: TargetCommandHandle = {
        command,
        bindings: registrations,
        get disposed() {
          return handleDisposed;
        },
        dispose() {
          if (handleDisposed) return;
          handleDisposed = true;
          for (const binding of registrations) binding.dispose();
          command.dispose();
          owned.delete(handle);
        },
      };
      owned.add(handle);
      return handle;
    },
    handle(handler, priority) {
      assertActive();
      const registration = runtime.registerHandler(handler, { mode, target: id, priority });
      let handleDisposed = false;
      const handle: Disposable = {
        get disposed() {
          return handleDisposed;
        },
        dispose() {
          if (handleDisposed) return;
          handleDisposed = true;
          registration.dispose();
          owned.delete(handle);
        },
      };
      owned.add(handle);
      return handle;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      target.blur();
      for (const registration of [...owned].reverse()) registration.dispose();
      owned.clear();
    },
  };
  return target;
}
