/**
 * Notification Hook
 *
 * Sends terminal notifications via OSC 9/99/777 depending on terminal support.
 * Falls back gracefully (no-op) when not supported.
 *
 *
 */

import { getCapabilities } from '../core/capabilities.js';
import { getNotificationSequence } from '../core/progressive.js';
import { getAppContext } from './context.js';

export interface UseNotificationResult {
  /** Send a terminal notification */
  notify: (title: string, body?: string) => void;
  /** Whether notifications are supported by the terminal */
  supported: boolean;
}

/**
 * Hook for sending terminal notifications.
 *
 * @example
 * ```typescript
 * function App() {
 *   const { notify, supported } = useNotification();
 *   useHotkeys('n', () => notify('Build Complete', 'All tests passed'));
 *   return Text({}, supported ? 'Press N to notify' : 'Notifications not supported');
 * }
 * ```
 */
export function useNotification(): UseNotificationResult {
  const caps = getCapabilities();
  const supported = !!caps.notifications;

  function notify(title: string, body?: string): void {
    const seq = getNotificationSequence(title, body, caps);
    if (seq) {
      (getAppContext()?.stdout ?? process.stdout).write(seq);
    }
  }

  return { notify, supported };
}
