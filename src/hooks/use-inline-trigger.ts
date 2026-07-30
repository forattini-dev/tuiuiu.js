/**
 * useInlineTrigger - Hook wrapper for trigger-based completions
 *
 * Convenience hook that creates a stable TextInputCompletionOptions
 * from a TriggerConfig, suitable for passing to TextInput.
 *
 * @example
 * function ChatInput() {
 *   const mention = useInlineTrigger({
 *     trigger: '@',
 *     getItems: (q) => searchUsers(q),
 *   });
 *
 *   return TextInput({ completion: mention });
 * }
 */

import {
  getHookState,
  getCurrentHookIndex,
  setHookState,
} from './context.js';
import {
  createTriggerCompletion,
  createMultiTriggerCompletion,
  type TriggerConfig,
} from '../atoms/trigger-completion.js';
import type { TextInputCompletionOptions } from '../atoms/text-input.js';

export type { TriggerConfig, TriggerItem } from '../atoms/trigger-completion.js';

function sameTriggerConfig<T>(
  previous: TriggerConfig<T>,
  next: TriggerConfig<T>,
): boolean {
  const previousPattern = previous.queryPattern;
  const nextPattern = next.queryPattern;
  const samePattern = previousPattern === nextPattern
    || (
      previousPattern !== undefined
      && nextPattern !== undefined
      && previousPattern.source === nextPattern.source
      && previousPattern.flags === nextPattern.flags
    );

  return previous.trigger === next.trigger
    && previous.getItems === next.getItems
    && previous.minChars === next.minChars
    && previous.insertAsSegment === next.insertAsSegment
    && previous.segmentKind === next.segmentKind
    && previous.ranking === next.ranking
    && samePattern;
}

function snapshotTriggerConfig<T>(config: TriggerConfig<T>): TriggerConfig<T> {
  return { ...config };
}

/**
 * Create a stable TextInputCompletionOptions from a trigger config.
 *
 * The completion options are created once and reused across re-renders.
 *
 * @example
 * const mention = useInlineTrigger({
 *   trigger: '@',
 *   getItems: async (query) => {
 *     const users = await fetchUsers(query);
 *     return users.map(u => ({ id: u.id, label: u.name }));
 *   },
 * });
 *
 * return TextInput({ completion: mention });
 */
export function useInlineTrigger<T = unknown>(
  config: TriggerConfig<T>,
): TextInputCompletionOptions<T> {
  const { value: hookData, isNew } = getHookState<{
    completion: TextInputCompletionOptions<T>;
    config: TriggerConfig<T>;
  } | null>(null);

  if (isNew || hookData === null) {
    const completion = createTriggerCompletion(config);
    const data = { completion, config: snapshotTriggerConfig(config) };
    const hookIndex = getCurrentHookIndex();
    setHookState(hookIndex, data);
    return completion;
  }

  if (!sameTriggerConfig(hookData.config, config)) {
    hookData.config = snapshotTriggerConfig(config);
    hookData.completion = createTriggerCompletion(config);
  }

  return hookData.completion;
}

/**
 * Create stable TextInputCompletionOptions from multiple trigger configs.
 *
 * @example
 * const completion = useMultiInlineTrigger([
 *   { trigger: '@', getItems: searchUsers },
 *   { trigger: '#', getItems: searchTags },
 * ]);
 *
 * return TextInput({ completion });
 */
export function useMultiInlineTrigger<T = unknown>(
  configs: TriggerConfig<T>[],
): TextInputCompletionOptions<T> {
  const { value: hookData, isNew } = getHookState<{
    completion: TextInputCompletionOptions<T>;
    configs: TriggerConfig<T>[];
  } | null>(null);

  if (isNew || hookData === null) {
    const completion = createMultiTriggerCompletion(configs);
    const data = {
      completion,
      configs: configs.map(snapshotTriggerConfig),
    };
    const hookIndex = getCurrentHookIndex();
    setHookState(hookIndex, data);
    return completion;
  }

  const configsChanged = hookData.configs.length !== configs.length
    || configs.some((config, index) => {
      const previous = hookData.configs[index];
      return previous === undefined || !sameTriggerConfig(previous, config);
    });

  if (configsChanged) {
    hookData.completion = createMultiTriggerCompletion(configs);
    hookData.configs = configs.map(snapshotTriggerConfig);
  }

  return hookData.completion;
}
