/**
 * Router - Route-based navigation for TUI applications
 *
 * Provides URL-like routing with parameters, nested routes, navigation guards,
 * and history management. Integrates with the Screen Manager for transitions.
 */

import { createSignal } from '../primitives/signal.js';
import { EventEmitter } from './events.js';
import {
  getDefaultRuntimeResource,
  getRuntimeResource,
  getRuntimeScope,
} from './runtime-scope.js';
import type { ScreenComponent } from './screen.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Route parameters extracted from path
 */
export type RouteParams = Record<string, string>;

/**
 * Query parameters from navigation
 */
export type QueryParams = Record<string, string | string[]>;

/**
 * Route location object
 */
export interface RouteLocation {
  /** Full path including params */
  path: string;
  /** Route name (if named) */
  name?: string;
  /** Extracted route parameters */
  params: RouteParams;
  /** Query parameters */
  query: QueryParams;
  /** Hash fragment */
  hash: string;
  /** Full path with query and hash */
  fullPath: string;
  /** Matched route definition */
  matched: MatchedRoute[];
}

/**
 * Navigation target
 */
export interface NavigationTarget {
  /** Navigate by path */
  path?: string;
  /** Navigate by name */
  name?: string;
  /** Route parameters */
  params?: RouteParams;
  /** Query parameters */
  query?: QueryParams;
  /** Hash fragment */
  hash?: string;
  /** Replace current history entry instead of push */
  replace?: boolean;
}

/**
 * Route definition
 */
export interface RouteDefinition {
  /** Route path pattern (e.g., '/users/:id') */
  path: string;
  /** Optional route name for programmatic navigation */
  name?: string;
  /** Component to render */
  component: ScreenComponent;
  /** Nested child routes */
  children?: RouteDefinition[];
  /** Route meta information */
  meta?: Record<string, unknown>;
  /** Navigation guard: called before entering route */
  beforeEnter?: NavigationGuard;
  /** Redirect to another path */
  redirect?: string | NavigationTarget;
  /** Component props factory */
  props?: boolean | Record<string, unknown> | ((route: RouteLocation) => Record<string, unknown>);
}

/**
 * Matched route with resolved component
 */
export interface MatchedRoute {
  /** Original route definition */
  route: RouteDefinition;
  /** Route parameters for this segment */
  params: RouteParams;
  /** Full path to this route */
  path: string;
}

/**
 * Navigation guard function
 * Returns true to allow, false to cancel, or NavigationTarget to redirect
 */
export type NavigationGuard = (
  to: RouteLocation,
  from: RouteLocation | null
) => boolean | NavigationTarget | void | Promise<boolean | NavigationTarget | void>;

/**
 * Navigation result
 */
export interface NavigationResult {
  /** Whether navigation succeeded */
  success: boolean;
  /** Error if navigation failed */
  error?: string;
  /** Redirect target if redirected */
  redirected?: RouteLocation;
}

/**
 * Router options
 */
export interface RouterOptions {
  /** Route definitions */
  routes: RouteDefinition[];
  /** Initial path (default: '/') */
  initialPath?: string;
  /** Global navigation guard */
  beforeEach?: NavigationGuard;
  /** After navigation hook */
  afterEach?: (to: RouteLocation, from: RouteLocation | null) => void;
  /** Whether to use hash mode (default: false) */
  hashMode?: boolean;
}

/**
 * History entry
 */
export interface HistoryEntry {
  location: RouteLocation;
  timestamp: number;
}

/**
 * Router events
 */
export interface RouterEvents {
  navigate: { from: RouteLocation | null; to: RouteLocation };
  error: { error: string; target: NavigationTarget };
  beforeNavigate: { from: RouteLocation | null; to: RouteLocation };
  afterNavigate: { from: RouteLocation | null; to: RouteLocation };
}

// =============================================================================
// Path Utilities
// =============================================================================

/**
 * Parse path pattern into segments
 */
export function parsePathPattern(pattern: string): PathSegment[] {
  const segments: PathSegment[] = [];
  const parts = pattern.split('/').filter(Boolean);

  for (const part of parts) {
    if (part.startsWith(':')) {
      // Parameter segment
      const name = part.slice(1);
      const isOptional = name.endsWith('?');
      segments.push({
        type: 'param',
        name: isOptional ? name.slice(0, -1) : name,
        optional: isOptional,
      });
    } else if (part === '*') {
      // Wildcard segment
      segments.push({ type: 'wildcard' });
    } else {
      // Static segment
      segments.push({ type: 'static', value: part });
    }
  }

  return segments;
}

/**
 * Path segment types
 */
export type PathSegment =
  | { type: 'static'; value: string }
  | { type: 'param'; name: string; optional?: boolean }
  | { type: 'wildcard' };

/**
 * Match a path against a pattern
 */
export function matchPath(
  path: string,
  pattern: string
): { matched: boolean; params: RouteParams } {
  const pathParts = path.split('/').filter(Boolean);
  const segments = parsePathPattern(pattern);

  const params: RouteParams = {};
  let pathIndex = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const pathPart = pathParts[pathIndex];

    if (segment.type === 'static') {
      if (pathPart !== segment.value) {
        return { matched: false, params: {} };
      }
      pathIndex++;
    } else if (segment.type === 'param') {
      if (pathPart === undefined) {
        if (!segment.optional) {
          return { matched: false, params: {} };
        }
      } else {
        params[segment.name] = decodePathPart(pathPart);
        pathIndex++;
      }
    } else if (segment.type === 'wildcard') {
      // Consume all remaining path parts
      params['*'] = pathParts.slice(pathIndex).map(decodePathPart).join('/');
      pathIndex = pathParts.length;
    }
  }

  // Check if we consumed all path parts
  if (pathIndex !== pathParts.length) {
    return { matched: false, params: {} };
  }

  return { matched: true, params };
}

/**
 * Build a path from pattern and params
 */
export function buildPath(pattern: string, params: RouteParams = {}): string {
  const segments = parsePathPattern(pattern);
  const parts: string[] = [];

  for (const segment of segments) {
    if (segment.type === 'static') {
      parts.push(segment.value);
    } else if (segment.type === 'param') {
      const value = params[segment.name];
      if (value !== undefined) {
        parts.push(encodeURIComponent(value));
      } else if (!segment.optional) {
        throw new Error(`Missing required param: ${segment.name}`);
      }
    } else if (segment.type === 'wildcard') {
      const value = params['*'];
      if (value) {
        parts.push(value.split('/').map(encodeURIComponent).join('/'));
      }
    }
  }

  return '/' + parts.join('/');
}

/**
 * Parse query string into object
 */
export function parseQuery(queryString: string): QueryParams {
  const query: QueryParams = {};
  const params = new URLSearchParams(queryString);

  for (const [key, value] of params.entries()) {
    const existing = query[key];
    if (existing !== undefined) {
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        query[key] = [existing, value];
      }
    } else {
      query[key] = value;
    }
  }

  return query;
}

/**
 * Build query string from object
 */
export function buildQuery(query: QueryParams): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        params.append(key, v);
      }
    } else {
      params.set(key, value);
    }
  }

  const str = params.toString();
  return str ? `?${str}` : '';
}

/**
 * Parse a full path into components
 */
export function parsePath(fullPath: string): {
  path: string;
  query: QueryParams;
  hash: string;
} {
  let path = fullPath;
  let hash = '';
  let queryString = '';

  // Extract hash
  const hashIndex = path.indexOf('#');
  if (hashIndex !== -1) {
    hash = path.slice(hashIndex + 1);
    path = path.slice(0, hashIndex);
  }

  // Extract query
  const queryIndex = path.indexOf('?');
  if (queryIndex !== -1) {
    queryString = path.slice(queryIndex + 1);
    path = path.slice(0, queryIndex);
  }

  return {
    path: path || '/',
    query: parseQuery(queryString),
    hash,
  };
}

/**
 * Normalize path (ensure leading slash, remove trailing)
 */
export function normalizePath(path: string): string {
  path = path.trim();
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return path;
}

function decodePathPart(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function joinRoutePath(parentPath: string, routePath: string): string {
  if (!parentPath) {
    return normalizePath(routePath || '/');
  }

  const parent = parentPath === '/' ? '' : parentPath.replace(/\/+$/u, '');
  const child = routePath.replace(/^\/+/u, '');
  return normalizePath(`${parent}/${child}`);
}

// =============================================================================
// Router Class
// =============================================================================

/**
 * Router - Manages route-based navigation
 *
 * @example
 * ```typescript
 * const router = createRouter({
 *   routes: [
 *     { path: '/', component: HomeScreen },
 *     { path: '/users', component: UserList },
 *     { path: '/users/:id', component: UserDetail },
 *     {
 *       path: '/settings',
 *       component: Settings,
 *       children: [
 *         { path: 'profile', component: ProfileSettings },
 *         { path: 'account', component: AccountSettings },
 *       ],
 *     },
 *   ],
 * });
 *
 * // Navigate
 * await router.push('/users/123');
 * await router.push({ name: 'user', params: { id: '456' } });
 *
 * // Go back
 * router.back();
 * ```
 */
export class Router extends EventEmitter<RouterEvents> {
  private routes: RouteDefinition[];
  private routesByName: Map<string, RouteDefinition>;
  private beforeEachGuard?: NavigationGuard;
  private afterEachHook?: (to: RouteLocation, from: RouteLocation | null) => void;
  private hashMode: boolean;

  private _currentRoute = createSignal<RouteLocation | null>(null);
  private _isNavigating = createSignal(false);

  private history: HistoryEntry[] = [];
  private historyIndex = -1;
  private maxHistorySize = 50;
  /** Settles after the optional initial navigation has completed. */
  readonly ready: Promise<NavigationResult>;

  constructor(options: RouterOptions) {
    super();
    this.routes = options.routes;
    this.routesByName = new Map();
    this.beforeEachGuard = options.beforeEach;
    this.afterEachHook = options.afterEach;
    this.hashMode = options.hashMode ?? false;

    // Build name index
    this.indexRoutes(this.routes);

    // Navigate to initial path
    this.ready = options.initialPath
      ? this.replace(options.initialPath).catch(error => {
          const message = error instanceof Error ? error.message : String(error);
          this.emit('error', {
            error: message,
            target: { path: options.initialPath },
          });
          return { success: false, error: message };
        })
      : Promise.resolve({ success: true });
  }

  clone(): Router {
    const cloneRoutes = (routes: RouteDefinition[]): RouteDefinition[] =>
      routes.map(route => ({
        ...route,
        children: route.children ? cloneRoutes(route.children) : undefined,
      }));
    const clone = new Router({
      routes: cloneRoutes(this.routes),
      beforeEach: this.beforeEachGuard,
      afterEach: this.afterEachHook,
      hashMode: this.hashMode,
    });
    const cloneLocation = (location: RouteLocation): RouteLocation =>
      clone.resolve({
        path: location.path,
        query: { ...location.query },
        hash: location.hash,
      }) ?? {
        ...location,
        params: { ...location.params },
        query: { ...location.query },
        matched: [...location.matched],
      };

    clone.history = this.history.map(entry => ({
      ...entry,
      location: cloneLocation(entry.location),
    }));
    clone.historyIndex = this.historyIndex;
    clone.maxHistorySize = this.maxHistorySize;
    if (this.currentRoute) {
      clone._currentRoute[1](cloneLocation(this.currentRoute));
    }
    return clone;
  }

  /**
   * Index routes by name for fast lookup
   */
  private indexRoutes(routes: RouteDefinition[], parentPath = ''): void {
    const pending: Array<[string, RouteDefinition]> = [];

    const collect = (definitions: RouteDefinition[], basePath: string): void => {
      for (const route of definitions) {
        const fullPath = joinRoutePath(basePath, route.path);
        if (route.name) {
          pending.push([route.name, { ...route, path: fullPath }]);
        }
        if (route.children) {
          collect(route.children, fullPath);
        }
      }
    };

    collect(routes, parentPath);

    const newNames = new Set<string>();
    for (const [name] of pending) {
      if (this.routesByName.has(name) || newNames.has(name)) {
        throw new Error(`Duplicate route name: ${name}`);
      }
      newNames.add(name);
    }

    for (const [name, route] of pending) {
      this.routesByName.set(name, route);
    }
  }

  /**
   * Get current route
   */
  get currentRoute(): RouteLocation | null {
    return this._currentRoute[0]();
  }

  /**
   * Get current route signal
   */
  get route() {
    return this._currentRoute[0];
  }

  /**
   * Check if navigation is in progress
   */
  get isNavigating(): boolean {
    return this._isNavigating[0]();
  }

  /**
   * Check if can go back in history
   */
  get canGoBack(): boolean {
    return this.historyIndex > 0;
  }

  /**
   * Check if can go forward in history
   */
  get canGoForward(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Get history stack
   */
  getHistory(): HistoryEntry[] {
    return [...this.history];
  }

  /**
   * Get current history index
   */
  getHistoryIndex(): number {
    return this.historyIndex;
  }

  /**
   * Find matching routes for a path
   */
  private findRoutes(
    path: string,
    routes: RouteDefinition[] = this.routes,
    parentPath = ''
  ): MatchedRoute[] {
    for (const route of routes) {
      const fullPattern = joinRoutePath(parentPath, route.path);
      const { matched, params } = matchPath(path, fullPattern);

      if (matched) {
        const matchedRoute: MatchedRoute = {
          route,
          params,
          path: fullPattern,
        };

        // If route has children, try to match child routes
        if (route.children && route.children.length > 0) {
          // Try to match against children
          const childMatches = this.findRoutes(path, route.children, fullPattern);
          if (childMatches.length > 0) {
            return [matchedRoute, ...childMatches];
          }
        }

        return [matchedRoute];
      }

      // Check if path starts with this pattern (for nested routes)
      const segments = parsePathPattern(fullPattern);
      const pathParts = path.split('/').filter(Boolean);

      if (route.children && pathParts.length > segments.length) {
        // Path might match a child route
        const childMatches = this.findRoutes(path, route.children, fullPattern);
        if (childMatches.length > 0) {
          // Build parent params
          let pathIndex = 0;
          const parentParams: RouteParams = {};
          for (const segment of segments) {
            if (segment.type === 'param' && pathParts[pathIndex]) {
              parentParams[segment.name] = decodePathPart(pathParts[pathIndex]!);
            }
            if (segment.type !== 'param' || !segment.optional || pathParts[pathIndex]) {
              pathIndex++;
            }
          }

          return [
            { route, params: parentParams, path: fullPattern },
            ...childMatches,
          ];
        }
      }
    }

    return [];
  }

  /**
   * Resolve navigation target to location
   */
  private resolveTarget(target: NavigationTarget | string): RouteLocation | null {
    if (typeof target === 'string') {
      const parsed = parsePath(target);
      target = {
        path: parsed.path,
        query: parsed.query,
        hash: parsed.hash,
      };
    }

    let path: string;
    const params = target.params || {};
    let query = target.query || {};
    let hash = target.hash || '';

    if (target.name) {
      const route = this.routesByName.get(target.name);
      if (!route) {
        return null;
      }
      path = buildPath(route.path, params);
    } else if (target.path) {
      const parsed = parsePath(target.path);
      path = normalizePath(parsed.path);
      query = { ...parsed.query, ...target.query };
      hash = target.hash ?? parsed.hash;
    } else {
      return null;
    }

    const matched = this.findRoutes(path);
    if (matched.length === 0) {
      return null;
    }

    // Merge all params from matched routes
    const allParams: RouteParams = {};
    for (const m of matched) {
      Object.assign(allParams, m.params);
    }
    Object.assign(allParams, params);

    const matchedName = matched[matched.length - 1]?.route.name;

    return {
      path,
      name: target.name ?? matchedName,
      params: allParams,
      query,
      hash,
      fullPath: path + buildQuery(query) + (hash ? `#${hash}` : ''),
      matched,
    };
  }

  /**
   * Execute navigation with guards
   */
  private async navigate(
    target: NavigationTarget | string,
    addToHistory: boolean
  ): Promise<NavigationResult> {
    if (this._isNavigating[0]()) {
      return { success: false, error: 'Navigation already in progress' };
    }

    this._isNavigating[1](true);

    try {
      const location = this.resolveTarget(target);
      if (!location) {
        const targetStr = typeof target === 'string' ? target : JSON.stringify(target);
        this.emit('error', { error: `Route not found: ${targetStr}`, target: typeof target === 'string' ? { path: target } : target });
        return { success: false, error: 'Route not found' };
      }

      const from = this._currentRoute[0]();

      // Emit before navigate
      this.emit('beforeNavigate', { from, to: location });

      // Check for redirect
      const lastMatched = location.matched[location.matched.length - 1];
      if (lastMatched?.route.redirect) {
        const redirect = lastMatched.route.redirect;
        this._isNavigating[1](false);
        return addToHistory ? this.push(redirect) : this.replace(redirect);
      }

      // Run global beforeEach guard
      if (this.beforeEachGuard) {
        const result = await this.beforeEachGuard(location, from);
        if (result === false) {
          return { success: false, error: 'Navigation cancelled by guard' };
        }
        if (result && typeof result === 'object') {
          this._isNavigating[1](false);
          return addToHistory ? this.push(result) : this.replace(result);
        }
      }

      // Run route-specific beforeEnter guards
      for (const matched of location.matched) {
        if (matched.route.beforeEnter) {
          const result = await matched.route.beforeEnter(location, from);
          if (result === false) {
            return { success: false, error: 'Navigation cancelled by route guard' };
          }
          if (result && typeof result === 'object') {
            this._isNavigating[1](false);
            return addToHistory ? this.push(result) : this.replace(result);
          }
        }
      }

      // Update current route
      this._currentRoute[1](location);

      // Update history
      if (addToHistory) {
        // Remove any forward history when navigating
        this.history = this.history.slice(0, this.historyIndex + 1);

        this.history.push({
          location,
          timestamp: Date.now(),
        });

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
          this.history = this.history.slice(-this.maxHistorySize);
        }

        this.historyIndex = this.history.length - 1;
      }

      // Emit navigate event
      this.emit('navigate', { from, to: location });

      // Run afterEach hook
      if (this.afterEachHook) {
        this.afterEachHook(location, from);
      }

      // Emit after navigate
      this.emit('afterNavigate', { from, to: location });

      return { success: true };
    } finally {
      this._isNavigating[1](false);
    }
  }

  /**
   * Navigate to a new route (push to history)
   */
  async push(target: NavigationTarget | string): Promise<NavigationResult> {
    if (typeof target !== 'string' && target.replace) {
      const { replace: _replace, ...replacement } = target;
      return this.replace(replacement);
    }
    return this.navigate(target, true);
  }

  /**
   * Replace current route (no history entry)
   */
  async replace(target: NavigationTarget | string): Promise<NavigationResult> {
    const result = await this.navigate(target, false);

    if (result.success && this.history.length > 0) {
      // Update current history entry
      const location = this._currentRoute[0]()!;
      this.history[this.historyIndex] = {
        location,
        timestamp: Date.now(),
      };
    } else if (result.success) {
      // First navigation
      const location = this._currentRoute[0]()!;
      this.history.push({
        location,
        timestamp: Date.now(),
      });
      this.historyIndex = 0;
    }

    return result;
  }

  /**
   * Go back in history
   */
  async back(): Promise<NavigationResult> {
    if (!this.canGoBack) {
      return { success: false, error: 'Cannot go back' };
    }

    return this.navigateHistory(this.historyIndex - 1);
  }

  /**
   * Go forward in history
   */
  async forward(): Promise<NavigationResult> {
    if (!this.canGoForward) {
      return { success: false, error: 'Cannot go forward' };
    }

    return this.navigateHistory(this.historyIndex + 1);
  }

  /**
   * Go to specific history index
   */
  async go(delta: number): Promise<NavigationResult> {
    if (!Number.isSafeInteger(delta)) {
      return { success: false, error: 'History delta must be a safe integer' };
    }

    const targetIndex = this.historyIndex + delta;

    if (targetIndex < 0 || targetIndex >= this.history.length) {
      return { success: false, error: 'Invalid history index' };
    }

    return this.navigateHistory(targetIndex);
  }

  private async navigateHistory(targetIndex: number): Promise<NavigationResult> {
    if (this._isNavigating[0]()) {
      return { success: false, error: 'Navigation already in progress' };
    }

    const entry = this.history[targetIndex];
    if (!entry) {
      return { success: false, error: 'Invalid history index' };
    }

    this._isNavigating[1](true);
    try {
      const location = entry.location;
      const from = this._currentRoute[0]();

      this.emit('beforeNavigate', { from, to: location });

      if (this.beforeEachGuard) {
        const result = await this.beforeEachGuard(location, from);
        if (result === false) {
          return { success: false, error: 'Navigation cancelled by guard' };
        }
        if (result && typeof result === 'object') {
          this._isNavigating[1](false);
          return this.push(result);
        }
      }

      for (const matched of location.matched) {
        if (!matched.route.beforeEnter) continue;
        const result = await matched.route.beforeEnter(location, from);
        if (result === false) {
          return { success: false, error: 'Navigation cancelled by route guard' };
        }
        if (result && typeof result === 'object') {
          this._isNavigating[1](false);
          return this.push(result);
        }
      }

      this.historyIndex = targetIndex;
      this._currentRoute[1](location);
      this.emit('navigate', { from, to: location });
      this.afterEachHook?.(location, from);
      this.emit('afterNavigate', { from, to: location });

      return { success: true };
    } finally {
      this._isNavigating[1](false);
    }
  }

  /**
   * Get all route definitions
   */
  getRoutes(): RouteDefinition[] {
    return [...this.routes];
  }

  /**
   * Add a route dynamically
   */
  addRoute(route: RouteDefinition, parentName?: string): void {
    if (parentName) {
      const parent = this.findRouteDefinitionByName(this.routes, parentName);
      const indexedParent = this.routesByName.get(parentName);
      if (!parent || !indexedParent) {
        throw new Error(`Parent route not found: ${parentName}`);
      }
      parent.children ??= [];
      parent.children.push(route);
      try {
        this.indexRoutes([route], indexedParent.path);
      } catch (error) {
        parent.children.pop();
        throw error;
      }
    } else {
      this.routes.push(route);
      try {
        this.indexRoutes([route]);
      } catch (error) {
        this.routes.pop();
        throw error;
      }
    }
  }

  /**
   * Remove a route by name
   */
  removeRoute(name: string): boolean {
    if (!this.routesByName.has(name)) return false;

    // Remove from routes array by name
    const removeByName = (routes: RouteDefinition[]): boolean => {
      for (let i = 0; i < routes.length; i++) {
        if (routes[i]!.name === name) {
          const [removed] = routes.splice(i, 1);
          if (removed) {
            this.removeRouteNames(removed);
          }
          return true;
        }
        if (routes[i]!.children && removeByName(routes[i]!.children!)) {
          return true;
        }
      }
      return false;
    };

    return removeByName(this.routes);
  }

  private findRouteDefinitionByName(
    routes: RouteDefinition[],
    name: string
  ): RouteDefinition | undefined {
    for (const route of routes) {
      if (route.name === name) return route;
      if (route.children) {
        const match = this.findRouteDefinitionByName(route.children, name);
        if (match) return match;
      }
    }
    return undefined;
  }

  private removeRouteNames(route: RouteDefinition): void {
    if (route.name) {
      this.routesByName.delete(route.name);
    }
    for (const child of route.children ?? []) {
      this.removeRouteNames(child);
    }
  }

  /**
   * Check if a route with name exists
   */
  hasRoute(name: string): boolean {
    return this.routesByName.has(name);
  }

  /**
   * Resolve a route by name
   */
  resolve(target: NavigationTarget | string): RouteLocation | null {
    return this.resolveTarget(target);
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new router instance
 */
export function createRouter(options: RouterOptions): Router {
  return new Router(options);
}

// =============================================================================
// Runtime Router Instance
// =============================================================================

interface RouterRuntimeState {
  router: Router | null;
}

const ROUTER_STATE = Symbol('tuiuiu.router-state');

function getRouterState(): RouterRuntimeState {
  const scope = getRuntimeScope();
  return getRuntimeResource(ROUTER_STATE, () => ({
    router: scope.id === 0
      ? null
      : getDefaultRuntimeResource<RouterRuntimeState>(
          ROUTER_STATE,
          () => ({ router: null }),
        ).router?.clone() ?? null,
  }));
}

/**
 * Get the current runtime router instance
 */
export function getRouter(): Router | null {
  return getRouterState().router;
}

/**
 * Set the current runtime router instance
 */
export function setRouter(router: Router): void {
  getRouterState().router = router;
}

/**
 * Reset the current runtime router
 */
export function resetRouter(): void {
  getRouterState().router = null;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * useRoute - Get current route information
 *
 * @example
 * ```typescript
 * function UserProfile() {
 *   const route = useRoute();
 *
 *   return Box({},
 *     Text({}, `User ID: ${route().params.id}`),
 *     Text({}, `Query: ${JSON.stringify(route().query)}`)
 *   );
 * }
 * ```
 */
export function useRoute(router?: Router): () => RouteLocation | null {
  const r = router ?? getRouter();
  if (!r) {
    throw new Error('No router provided and no runtime router set');
  }
  return r.route;
}

/**
 * useNavigate - Get navigation functions
 *
 * @example
 * ```typescript
 * function NavButtons() {
 *   const { push, back, canGoBack } = useNavigate();
 *
 *   return Box({},
 *     Button({ onPress: () => back(), disabled: !canGoBack() }, 'Back'),
 *     Button({ onPress: () => push('/settings') }, 'Settings')
 *   );
 * }
 * ```
 */
export function useNavigate(router?: Router): {
  push: (target: NavigationTarget | string) => Promise<NavigationResult>;
  replace: (target: NavigationTarget | string) => Promise<NavigationResult>;
  back: () => Promise<NavigationResult>;
  forward: () => Promise<NavigationResult>;
  go: (delta: number) => Promise<NavigationResult>;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
} {
  const r = router ?? getRouter();
  if (!r) {
    throw new Error('No router provided and no runtime router set');
  }

  return {
    push: (target) => r.push(target),
    replace: (target) => r.replace(target),
    back: () => r.back(),
    forward: () => r.forward(),
    go: (delta) => r.go(delta),
    canGoBack: () => r.canGoBack,
    canGoForward: () => r.canGoForward,
  };
}

/**
 * useParams - Get current route parameters
 */
export function useParams(router?: Router): () => RouteParams {
  const route = useRoute(router);
  return () => route()?.params ?? {};
}

/**
 * useQuery - Get current query parameters
 */
export function useQuery(router?: Router): () => QueryParams {
  const route = useRoute(router);
  return () => route()?.query ?? {};
}

/**
 * useRouteMatch - Check if current route matches pattern
 */
export function useRouteMatch(
  pattern: string,
  router?: Router
): () => { matched: boolean; params: RouteParams } {
  const route = useRoute(router);

  return () => {
    const current = route();
    if (!current) {
      return { matched: false, params: {} };
    }
    return matchPath(current.path, pattern);
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a route guard that requires authentication
 */
export function createAuthGuard(
  isAuthenticated: () => boolean,
  loginPath = '/login'
): NavigationGuard {
  return (to) => {
    if (!isAuthenticated()) {
      return { path: loginPath, query: { redirect: to.fullPath } };
    }
    return true;
  };
}

/**
 * Create a route guard that checks role/permission
 */
export function createRoleGuard(
  hasRole: (role: string) => boolean,
  forbiddenPath = '/forbidden'
): (requiredRole: string) => NavigationGuard {
  return (requiredRole: string) => {
    return (_to) => {
      if (!hasRole(requiredRole)) {
        return { path: forbiddenPath };
      }
      return true;
    };
  };
}

/**
 * Combine multiple guards into one
 */
export function combineGuards(...guards: NavigationGuard[]): NavigationGuard {
  return async (to, from) => {
    for (const guard of guards) {
      const result = await guard(to, from);
      if (result === false || (result && typeof result === 'object')) {
        return result;
      }
    }
    return true;
  };
}
