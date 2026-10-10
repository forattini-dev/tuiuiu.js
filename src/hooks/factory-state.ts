import { useConst } from './use-const.js';
import { registerHookCleanup } from './context.js';
import { allowInternalSignalCreationDuringRender } from '../core/dev-warnings.js';

type UpdatableFactoryState<TOptions> = {
  updateOptions?: (options: TOptions) => void;
};

/**
 * Reuses a factory-backed controller in its ComponentOwner. Standalone callers
 * use the corresponding `createX()` factory directly.
 * Always occupies one hook slot, even with external state. The internal draft
 * is created lazily and retained if a caller temporarily supplies external state.
 * Optional cleanup belongs only to that internal draft, never external controllers.
 */
export function useFactoryState<TOptions, TState extends UpdatableFactoryState<TOptions>>(
  externalState: TState | undefined,
  options: TOptions,
  createState: (options: TOptions) => TState,
  disposeState?: (state: TState) => void,
): TState {
  const holder = useConst(() => {
    let owned: TState | undefined;
    if (disposeState) registerHookCleanup(() => { if (owned) disposeState(owned); });
    return {
      get(nextOptions: TOptions): TState {
        owned ??= allowInternalSignalCreationDuringRender(() => createState(nextOptions));
        return owned;
      },
    };
  });
  const state = externalState ?? holder.get(options);
  state.updateOptions?.(options);
  return state;
}
