/**
 * Runtime-scoped configuration for progressive terminal features.
 *
 * This module deliberately does not import the capabilities detector at
 * runtime. Keeping configuration state below both `capabilities` and the
 * progressive escape-sequence facade prevents an ESM initialization cycle.
 */

import type { TerminalCapabilities } from './capabilities.js';
import {
  getDefaultRuntimeResource,
  getRuntimeResource,
  getRuntimeScope,
  type RuntimeScope,
} from './runtime-scope.js';

interface ProgressiveRuntimeState {
  nerdFontsEnabled: boolean;
  hyperlinksEnabled: boolean;
  progressiveVersion: number;
  capabilityOverrides: Partial<TerminalCapabilities> | null;
}

const PROGRESSIVE_RUNTIME_STATE = Symbol('tuiuiu.progressive-runtime-state');

function createDefaultProgressiveRuntimeState(): ProgressiveRuntimeState {
  return {
    nerdFontsEnabled: false,
    hyperlinksEnabled: true,
    progressiveVersion: 0,
    capabilityOverrides: null,
  };
}

function createProgressiveRuntimeState(scope: RuntimeScope): ProgressiveRuntimeState {
  if (scope.id === 0) return createDefaultProgressiveRuntimeState();
  const defaults = getDefaultRuntimeResource(
    PROGRESSIVE_RUNTIME_STATE,
    createDefaultProgressiveRuntimeState,
  );
  return {
    nerdFontsEnabled: defaults.nerdFontsEnabled,
    hyperlinksEnabled: defaults.hyperlinksEnabled,
    progressiveVersion: defaults.progressiveVersion,
    capabilityOverrides: defaults.capabilityOverrides
      ? { ...defaults.capabilityOverrides }
      : null,
  };
}

function getProgressiveRuntimeState(): ProgressiveRuntimeState {
  const scope = getRuntimeScope();
  return getRuntimeResource(
    PROGRESSIVE_RUNTIME_STATE,
    () => createProgressiveRuntimeState(scope),
    scope,
  );
}

/** Enable or disable Nerd Fonts support. */
export function setNerdFonts(enabled: boolean): void {
  const state = getProgressiveRuntimeState();
  state.nerdFontsEnabled = enabled;
  state.progressiveVersion++;
}

/** Check explicit opt-in as well as the supported environment flags. */
export function hasNerdFonts(): boolean {
  return (
    getProgressiveRuntimeState().nerdFontsEnabled ||
    process.env.NERD_FONT === '1' ||
    process.env.NERD_FONTS === '1'
  );
}

/** Enable or disable OSC 8 hyperlink emission globally. */
export function setHyperlinksEnabled(enabled: boolean): void {
  const state = getProgressiveRuntimeState();
  state.hyperlinksEnabled = enabled;
  state.progressiveVersion++;
}

/** Check whether hyperlink emission is enabled. */
export function areHyperlinksEnabled(): boolean {
  return getProgressiveRuntimeState().hyperlinksEnabled;
}

/** Configure capability overrides and optional hyperlink behavior. */
export function configureProgressive(options: {
  overrides?: Partial<TerminalCapabilities>;
  hyperlinks?: boolean;
}): void {
  const state = getProgressiveRuntimeState();
  state.capabilityOverrides = options.overrides ?? null;
  if (options.hyperlinks !== undefined) {
    state.hyperlinksEnabled = options.hyperlinks;
  }
  state.progressiveVersion++;
}

/** Return configured capability overrides, if any. */
export function getProgressiveOverrides(): Partial<TerminalCapabilities> | null {
  return getProgressiveRuntimeState().capabilityOverrides;
}

/** Return the configuration version used to invalidate capability caches. */
export function getProgressiveVersion(): number {
  return getProgressiveRuntimeState().progressiveVersion;
}

/** Reset progressive configuration to its defaults. */
export function resetProgressive(): void {
  const state = getProgressiveRuntimeState();
  state.capabilityOverrides = null;
  state.nerdFontsEnabled = false;
  state.hyperlinksEnabled = true;
  state.progressiveVersion++;
}
