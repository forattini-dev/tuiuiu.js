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
    const data = { completion, config };
    const hookIndex = getCurrentHookIndex();
    setHookState(hookIndex, data);
    return completion;
  }

  // Update getItems if config reference changed (allows dynamic item sources)
  if (hookData.config.getItems !== config.getItems) {
    hookData.config = config;
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
    configCount: number;
  } | null>(null);

  if (isNew || hookData === null) {
    const completion = createMultiTriggerCompletion(configs);
    const data = { completion, configCount: configs.length };
    const hookIndex = getCurrentHookIndex();
    setHookState(hookIndex, data);
    return completion;
  }

  // Recreate if number of triggers changed
  if (hookData.configCount !== configs.length) {
    hookData.completion = createMultiTriggerCompletion(configs);
    hookData.configCount = configs.length;
  }

  return hookData.completion;
}
