/**
 * Per-render runtime scope.
 *
 * Tuiuiu historically kept hook and renderer state in module-level
 * singletons. A runtime scope provides a small dependency container that can
 * be selected while an app evaluates, handles input, or renders a frame.
 *
 * The default scope preserves standalone utility and hook tests. Registered
 * app scopes are selected automatically only when exactly one app exists;
 * concurrent apps must execute through runInRuntimeScope(), which prevents an
 * arbitrary app from receiving another app's state.
 */

import { AsyncLocalStorage } from 'node:async_hooks';

export interface RuntimeScope {
  readonly id: number;
  readonly resources: Map<symbol, unknown>;
}

/** Optional cleanup contract for stateful resources owned by a runtime. */
export const RUNTIME_RESOURCE_DISPOSE = Symbol('tuiuiu.runtime-resource-dispose');

export interface RuntimeDisposable {
  [RUNTIME_RESOURCE_DISPOSE](): void;
}

const runtimeStorage = new AsyncLocalStorage<RuntimeScope>();
const registeredScopes = new Set<RuntimeScope>();
let nextRuntimeScopeId = 1;

const defaultRuntimeScope: RuntimeScope = {
  id: 0,
  resources: new Map(),
};

export function createRuntimeScope(): RuntimeScope {
  const scope: RuntimeScope = {
    id: nextRuntimeScopeId++,
    resources: new Map(),
  };
  registeredScopes.add(scope);
  return scope;
}

export function unregisterRuntimeScope(scope: RuntimeScope): void {
  registeredScopes.delete(scope);
}

function disposeRuntimeResource(resource: unknown): void {
  if (
    resource !== null &&
    typeof resource === 'object' &&
    RUNTIME_RESOURCE_DISPOSE in resource
  ) {
    try {
      (resource as RuntimeDisposable)[RUNTIME_RESOURCE_DISPOSE]();
    } catch (error) {
      console.error('[tuiuiu] Error while disposing a runtime resource:', error);
    }
  }
}

function disposeRuntimeResources(scope: RuntimeScope): void {
  const resources = [...scope.resources.values()].reverse();
  scope.resources.clear();

  for (const resource of resources) {
    disposeRuntimeResource(resource);
  }
}

export function destroyRuntimeScope(scope: RuntimeScope): void {
  unregisterRuntimeScope(scope);
  disposeRuntimeResources(scope);
}

export function runInRuntimeScope<T>(scope: RuntimeScope, callback: () => T): T {
  return runtimeStorage.run(scope, callback);
}

export function bindRuntimeScope<TArgs extends unknown[], TResult>(
  scope: RuntimeScope,
  callback: (...args: TArgs) => TResult,
): (...args: TArgs) => TResult {
  return (...args) => runInRuntimeScope(scope, () => callback(...args));
}

export function getActiveRuntimeScope(): RuntimeScope | null {
  return runtimeStorage.getStore() ?? null;
}

/**
 * Resolve the runtime for a context-sensitive operation.
 *
 * With multiple registered apps and no active scope, falling back to one of
 * them would leak state. The isolated default scope is therefore returned.
 */
export function getRuntimeScope(explicit?: RuntimeScope): RuntimeScope {
  if (explicit) return explicit;
  const active = getActiveRuntimeScope();
  if (active) return active;
  if (registeredScopes.size === 1) {
    return registeredScopes.values().next().value ?? defaultRuntimeScope;
  }
  return defaultRuntimeScope;
}

export function getRegisteredRuntimeScopes(): readonly RuntimeScope[] {
  return [...registeredScopes];
}

export function getDefaultRuntimeScope(): RuntimeScope {
  return defaultRuntimeScope;
}

export function getRuntimeResource<T>(
  key: symbol,
  create: () => T,
  explicitScope?: RuntimeScope,
): T {
  const scope = getRuntimeScope(explicitScope);
  if (!scope.resources.has(key)) {
    scope.resources.set(key, create());
  }
  return scope.resources.get(key) as T;
}

/**
 * Access the process default inherited by newly-created app resources.
 *
 * Stateful modules should copy values from this resource when an app scope is
 * initialized, then mutate only their own copy.
 */
export function getDefaultRuntimeResource<T>(
  key: symbol,
  create: () => T,
): T {
  if (!defaultRuntimeScope.resources.has(key)) {
    defaultRuntimeScope.resources.set(key, create());
  }
  return defaultRuntimeScope.resources.get(key) as T;
}

export function peekRuntimeResource<T>(
  key: symbol,
  explicitScope?: RuntimeScope,
): T | undefined {
  return getRuntimeScope(explicitScope).resources.get(key) as T | undefined;
}

export function deleteRuntimeResource(
  key: symbol,
  explicitScope?: RuntimeScope,
): void {
  const scope = getRuntimeScope(explicitScope);
  const resource = scope.resources.get(key);
  scope.resources.delete(key);
  disposeRuntimeResource(resource);
}

/** Reset the default scope used by standalone tests and utilities. */
export function resetDefaultRuntimeScope(): void {
  disposeRuntimeResources(defaultRuntimeScope);
}
