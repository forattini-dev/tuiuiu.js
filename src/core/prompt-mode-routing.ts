export interface PromptModeDefinition {
  id: string;
  label?: string;
  description?: string;
  prefix?: string;
  trimPayload?: boolean;
}

export interface PromptModeResolved {
  mode: PromptModeDefinition;
  value: string;
  prefix: string | null;
  payload: string;
  isExplicit: boolean;
}

export interface PromptModeRegistry {
  getAll: () => PromptModeDefinition[];
  getDefault: () => PromptModeDefinition;
  /** Canonical prompt-mode inspection path for both live UI and submit-time routing. */
  inspectPrompt: (value: string) => PromptModeResolved;
  /** Compatibility alias for inspectPrompt(). Prefer inspectPrompt() in new code. */
  parse: (value: string) => PromptModeResolved;
}

export interface PromptModeRegistryOptions {
  defaultMode: PromptModeDefinition;
  modes?: readonly PromptModeDefinition[];
}

function normalizeMode(mode: PromptModeDefinition): PromptModeDefinition {
  return {
    ...mode,
    prefix: mode.prefix && mode.prefix.length > 0 ? mode.prefix : undefined,
    trimPayload: mode.trimPayload ?? true,
  };
}

function resolvePromptMode(
  value: string,
  defaultMode: PromptModeDefinition,
  modes: readonly PromptModeDefinition[]
): PromptModeResolved {
  for (const mode of modes) {
    if (!mode.prefix || !value.startsWith(mode.prefix)) {
      continue;
    }

    const remainder = value.slice(mode.prefix.length);
    return {
      mode,
      value,
      prefix: mode.prefix,
      payload: mode.trimPayload === false ? remainder : remainder.trimStart(),
      isExplicit: true,
    };
  }

  return {
    mode: defaultMode,
    value,
    prefix: null,
    payload: defaultMode.trimPayload === false ? value : value.trim(),
    isExplicit: false,
  };
}

export function createPromptModeRegistry(
  options: PromptModeRegistryOptions
): PromptModeRegistry {
  const defaultMode = normalizeMode(options.defaultMode);
  const modes = (options.modes ?? []).map((mode) => normalizeMode(mode));
  const resolve = (value: string) => resolvePromptMode(value, defaultMode, modes);

  return {
    getAll: () => [
      defaultMode,
      ...modes.map((mode) => ({ ...mode })),
    ],
    getDefault: () => ({ ...defaultMode }),
    inspectPrompt: resolve,
    parse: resolve,
  };
}
