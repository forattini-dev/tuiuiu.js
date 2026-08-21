import { useConst } from './use-const.js';

type UpdatableFactoryState<TOptions> = {
  updateOptions?: (options: TOptions) => void;
};

/**
 * Reuses a factory-backed controller in its ComponentOwner. Standalone callers
 * use the corresponding `createX()` factory directly.
 */
export function useFactoryState<TOptions, TState extends UpdatableFactoryState<TOptions>>(
  externalState: TState | undefined,
  options: TOptions,
  createState: (options: TOptions) => TState
): TState {
  if (externalState) {
    externalState.updateOptions?.(options);
    return externalState;
  }

  const state = useConst(() => createState(options));
  state.updateOptions?.(options);
  return state;
}
