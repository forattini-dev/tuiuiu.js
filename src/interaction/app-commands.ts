import type { Disposable, InteractionRuntime } from './runtime.js';

export interface AppCommandCapabilities {
  exit: () => void;
  focusNext: () => void;
  focusPrevious: () => void;
  blurFocus: () => void;
  hasFocus: () => boolean;
  isExitEnabled: () => boolean;
  isFocusNavigationEnabled: () => boolean;
}

export function installAppCommands(
  runtime: InteractionRuntime,
  capabilities: AppCommandCapabilities,
): Disposable {
  const registrations: Disposable[] = [
    runtime.registerCommand({
      id: 'app.exit',
      title: 'Exit application',
      category: 'Application',
      enabled: capabilities.isExitEnabled,
      run: capabilities.exit,
    }),
    runtime.bind({ command: 'app.exit', keys: 'ctrl+c' }),
    runtime.registerCommand({
      id: 'focus.next',
      title: 'Focus next element',
      category: 'Focus',
      enabled: capabilities.isFocusNavigationEnabled,
      run: capabilities.focusNext,
    }),
    runtime.bind({ command: 'focus.next', keys: 'tab' }),
    runtime.registerCommand({
      id: 'focus.previous',
      title: 'Focus previous element',
      category: 'Focus',
      enabled: capabilities.isFocusNavigationEnabled,
      run: capabilities.focusPrevious,
    }),
    runtime.bind({ command: 'focus.previous', keys: 'shift+tab' }),
    runtime.registerCommand({
      id: 'focus.blur',
      title: 'Clear focus',
      category: 'Focus',
      enabled: () => capabilities.isFocusNavigationEnabled() && capabilities.hasFocus(),
      run: capabilities.blurFocus,
    }),
    runtime.bind({ command: 'focus.blur', keys: 'escape' }),
  ];
  let disposed = false;
  return {
    get disposed() {
      return disposed;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const registration of [...registrations].reverse()) registration.dispose();
    },
  };
}
