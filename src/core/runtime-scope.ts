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

export function destroyRuntimeScope(scope: RuntimeScope): void {
  unregisterRuntimeScope(scope);
  scope.resources.clear();
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
  getRuntimeScope(explicitScope).resources.delete(key);
}

/** Reset the compatibility scope used by standalone tests and utilities. */
export function resetDefaultRuntimeScope(): void {
  defaultRuntimeScope.resources.clear();
}
