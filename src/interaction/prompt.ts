import {
  getRuntimeResource,
  getActiveRuntimeScope,
  getRegisteredRuntimeScopes,
  RUNTIME_RESOURCE_DISPOSE,
  type RuntimeScope,
} from '../core/runtime-scope.js';
import type { Disposable } from './runtime.js';

export type PromptValidation = boolean | string;
export type PromptValidationResult = PromptValidation | Promise<PromptValidation>;

export interface PromptBaseRequest {
  message: string;
}

export interface PromptInputRequest extends PromptBaseRequest {
  kind: 'input' | 'password';
  default?: string;
  placeholder?: string;
  mask?: string;
  validate?: (value: string) => PromptValidationResult;
  transform?: (value: string) => string;
}

export interface PromptConfirmRequest extends PromptBaseRequest {
  kind: 'confirm';
  default?: boolean;
}

export interface PromptSelectRequest<T extends string = string> extends PromptBaseRequest {
  kind: 'select' | 'autocomplete';
  choices: readonly T[];
  default?: T;
  minInput?: number;
  maxSuggestions?: number;
  filter?: (input: string, choice: T) => boolean;
}

export interface PromptCheckboxRequest<T extends string = string> extends PromptBaseRequest {
  kind: 'checkbox';
  choices: readonly T[];
  default?: readonly T[];
  min?: number;
  max?: number;
  validate?: (values: T[]) => PromptValidationResult;
}

export interface PromptNumberRequest extends PromptBaseRequest {
  kind: 'number';
  default?: number;
  min?: number;
  max?: number;
  integer?: boolean;
  validate?: (value: number) => PromptValidationResult;
}

export type PromptRequest<T extends string = string> =
  | PromptInputRequest
  | PromptConfirmRequest
  | PromptSelectRequest<T>
  | PromptCheckboxRequest<T>
  | PromptNumberRequest;

export interface PromptControls<TResult> {
  readonly signal: AbortSignal;
  resolve(value: TResult): void;
  reject(error: unknown): void;
}

export interface PromptRenderer {
  present<TResult>(
    request: PromptRequest<any>,
    controls: PromptControls<TResult>,
  ): void | (() => void);
}

export interface PromptHost extends Disposable {
  readonly available: boolean;
  readonly busy: boolean;
  setRenderer(renderer: PromptRenderer): Disposable;
  request<TResult>(request: PromptRequest<any>): Promise<TResult>;
  input(message: string, options?: Omit<PromptInputRequest, 'kind' | 'message'>): Promise<string>;
  password(message: string, options?: Omit<PromptInputRequest, 'kind' | 'message'>): Promise<string>;
  confirm(message: string, options?: Omit<PromptConfirmRequest, 'kind' | 'message'>): Promise<boolean>;
  select<T extends string>(
    message: string,
    choices: readonly T[],
    options?: Omit<PromptSelectRequest<T>, 'kind' | 'message' | 'choices'>,
  ): Promise<T>;
  checkbox<T extends string>(
    message: string,
    choices: readonly T[],
    options?: Omit<PromptCheckboxRequest<T>, 'kind' | 'message' | 'choices'>,
  ): Promise<T[]>;
  autocomplete<T extends string>(
    message: string,
    choices: readonly T[],
    options?: Omit<PromptSelectRequest<T>, 'kind' | 'message' | 'choices'>,
  ): Promise<T>;
  number(message: string, options?: Omit<PromptNumberRequest, 'kind' | 'message'>): Promise<number>;
}

export class PromptCancelledError extends Error {
  readonly code = 'PROMPT_CANCELLED';

  constructor(message = 'Prompt cancelled') {
    super(message);
    this.name = 'PromptCancelledError';
  }
}

export class PromptBusyError extends Error {
  readonly code = 'PROMPT_BUSY';

  constructor() {
    super('Another prompt is already active');
    this.name = 'PromptBusyError';
  }
}

export class PromptHostUnavailableError extends Error {
  readonly code = 'PROMPT_HOST_UNAVAILABLE';

  constructor() {
    super('No prompt renderer is installed in the active runtime');
    this.name = 'PromptHostUnavailableError';
  }
}

export class PromptHostAmbiguousError extends Error {
  readonly code = 'PROMPT_HOST_AMBIGUOUS';

  constructor() {
    super('Multiple app runtimes are active; call the prompt inside an app runtime scope');
    this.name = 'PromptHostAmbiguousError';
  }
}

export class PromptNonInteractiveError extends Error {
  readonly code = 'PROMPT_NON_INTERACTIVE';

  constructor() {
    super('A non-interactive prompt requires an explicit default');
    this.name = 'PromptNonInteractiveError';
  }
}

const PROMPT_HOST = Symbol('tuiuiu.prompt-host');

export function createPromptHost(): PromptHost {
  let renderer: PromptRenderer | null = null;
  let rendererOwner = 0;
  let nextOwner = 1;
  let activeAbort: AbortController | null = null;
  let activeReject: ((error: unknown) => void) | null = null;
  let isDisposed = false;

  const host: PromptHost = {
    get disposed() {
      return isDisposed;
    },
    get available() {
      return renderer !== null && !isDisposed;
    },
    get busy() {
      return activeAbort !== null;
    },
    setRenderer(nextRenderer) {
      if (isDisposed) throw new Error('PromptHost has been disposed');
      if (renderer) throw new Error('A prompt renderer is already installed');
      const owner = nextOwner++;
      renderer = nextRenderer;
      rendererOwner = owner;
      let registrationDisposed = false;
      return {
        get disposed() {
          return registrationDisposed;
        },
        dispose() {
          if (registrationDisposed) return;
          registrationDisposed = true;
          if (rendererOwner !== owner) return;
          renderer = null;
          rendererOwner = 0;
          activeReject?.(new PromptCancelledError('Prompt renderer was removed'));
        },
      };
    },
    request<TResult>(request: PromptRequest<any>): Promise<TResult> {
      if (isDisposed || !renderer) return Promise.reject(new PromptHostUnavailableError());
      if (activeAbort) return Promise.reject(new PromptBusyError());
      const activeRenderer = renderer;
      const abort = new AbortController();
      activeAbort = abort;
      return new Promise<TResult>((resolve, reject) => {
        let settled = false;
        let cleanup: (() => void) | undefined;
        const finish = (callback: () => void) => {
          if (settled) return;
          settled = true;
          activeAbort = null;
          activeReject = null;
          abort.abort();
          try {
            cleanup?.();
          } finally {
            callback();
          }
        };
        activeReject = (error) => finish(() => reject(error));
        try {
          const presented = activeRenderer.present<TResult>(request, {
            signal: abort.signal,
            resolve: (value) => finish(() => resolve(value)),
            reject: (error) => finish(() => reject(error)),
          });
          cleanup = typeof presented === 'function' ? presented : undefined;
          if (settled) cleanup?.();
        } catch (error) {
          finish(() => reject(error));
        }
      });
    },
    input(message, options = {}) {
      return host.request<string>({ kind: 'input', message, ...options });
    },
    password(message, options = {}) {
      return host.request<string>({ kind: 'password', message, ...options });
    },
    confirm(message, options = {}) {
      return host.request<boolean>({ kind: 'confirm', message, ...options });
    },
    select<T extends string>(message: string, choices: readonly T[], options = {}) {
      return host.request<T>({ kind: 'select', message, choices, ...options } as PromptSelectRequest<T>);
    },
    checkbox<T extends string>(message: string, choices: readonly T[], options = {}) {
      return host.request<T[]>({ kind: 'checkbox', message, choices, ...options } as PromptCheckboxRequest<T>);
    },
    autocomplete<T extends string>(message: string, choices: readonly T[], options = {}) {
      return host.request<T>({ kind: 'autocomplete', message, choices, ...options } as PromptSelectRequest<T>);
    },
    number(message, options = {}) {
      return host.request<number>({ kind: 'number', message, ...options });
    },
    dispose() {
      if (isDisposed) return;
      isDisposed = true;
      activeReject?.(new PromptCancelledError('Prompt host was disposed'));
      renderer = null;
      rendererOwner = 0;
    },
  };

  Object.assign(host, {
    [RUNTIME_RESOURCE_DISPOSE]: () => host.dispose(),
  });
  return host;
}

export function getPromptHost(scope?: RuntimeScope): PromptHost {
  if (!scope && !getActiveRuntimeScope() && getRegisteredRuntimeScopes().length > 1) {
    throw new PromptHostAmbiguousError();
  }
  return getRuntimeResource(PROMPT_HOST, createPromptHost, scope);
}
