/**
 * Reactive Format Hooks
 *
 * @description Reactive wrappers for format utilities.
 * These hooks return memoized signals that update when inputs change.
 *
 * @example
 * ```typescript
 * // Auto-updating byte display
 * const [fileSize, setFileSize] = createSignal(1024)
 * const formattedSize = useFormatBytes(() => fileSize())
 * // formattedSize() === "1 KiB"
 *
 * // Auto-updating relative time (updates every minute!)
 * const uploadedAt = useFormatRelative(() => file.uploadedAt)
 * // uploadedAt() automatically changes from "1 minute ago" to "2 minutes ago"
 * ```
 */

import { createSignal, createMemo } from '../primitives/signal.js';
import { useInterval } from './use-interval.js';
import { resolve, type MaybeReactive } from '../utils/resolve.js';
import {
  formatBytes,
  formatDuration,
  formatRelative,
  formatNumber,
  formatCompact,
  formatPercent,
  formatDelta,
} from '../utils/formatters.js';

// =============================================================================
// Reactive Format Hooks
// =============================================================================

/**
 * Reactive bytes formatter
 *
 * @param bytes - Number or signal returning bytes
 * @param format - 'short' or 'full' (default: 'full')
 * @returns Signal returning formatted string
 *
 * @example
 * ```typescript
 * const [size, setSize] = createSignal(1024)
 * const formatted = useFormatBytes(() => size())
 * // formatted() === "1 KiB"
 *
 * setSize(2048)
 * // formatted() === "2 KiB"
 * ```
 */
export function useFormatBytes(
  bytes: MaybeReactive<number>,
  format: 'short' | 'full' = 'full'
): () => string {
  return createMemo(() => formatBytes(resolve(bytes), format));
}

/**
 * Reactive duration formatter
 *
 * @param seconds - Number or signal returning seconds
 * @param format - 'short' or 'long' (default: 'long')
 * @returns Signal returning formatted string
 *
 * @example
 * ```typescript
 * const [elapsed, setElapsed] = createSignal(90)
 * const formatted = useFormatDuration(() => elapsed())
 * // formatted() === "1m 30s"
 * ```
 */
export function useFormatDuration(
  seconds: MaybeReactive<number>,
  format: 'short' | 'long' = 'long'
): () => string {
  return createMemo(() => formatDuration(resolve(seconds), format));
}

/**
 * Reactive relative time formatter with auto-update
 *
 * This hook automatically updates the displayed time at regular intervals,
 * so "1 minute ago" becomes "2 minutes ago" without manual intervention.
 *
 * @param timestamp - Date, ms timestamp, or signal returning either
 * @param updateInterval - How often to update in ms (default: 60000 = 1 minute)
 * @returns Signal returning formatted relative time
 *
 * @example
 * ```typescript
 * // Basic usage - updates every minute
 * const createdAt = useFormatRelative(() => message.createdAt)
 *
 * // Faster updates for real-time feel
 * const lastSeen = useFormatRelative(() => user.lastSeen, 10000) // every 10s
 *
 * // Static timestamp
 * const uploadTime = useFormatRelative(file.uploadedAt)
 * ```
 */
export function useFormatRelative(
  timestamp: MaybeReactive<Date | number>,
  updateInterval = 60000
): () => string {
  // Track current time for relative calculation
  const [now, setNow] = createSignal(Date.now());

  // Auto-update current time
  useInterval(() => {
    setNow(Date.now());
  }, updateInterval);

  return createMemo(() => {
    const ts = resolve(timestamp);
    return formatRelative(ts, now());
  });
}

/**
 * Reactive number formatter with thousand separators
 *
 * @param n - Number or signal
 * @param separator - Separator character (default: ',')
 * @returns Signal returning formatted string
 *
 * @example
 * ```typescript
 * const [count, setCount] = createSignal(1234567)
 * const formatted = useFormatNumber(() => count())
 * // formatted() === "1,234,567"
 * ```
 */
export function useFormatNumber(
  n: MaybeReactive<number>,
  separator = ','
): () => string {
  return createMemo(() => formatNumber(resolve(n), separator));
}

/**
 * Reactive compact number formatter
 *
 * @param n - Number or signal
 * @param decimals - Decimal places (default: 1)
 * @returns Signal returning formatted string like "1.2M"
 *
 * @example
 * ```typescript
 * const [users, setUsers] = createSignal(1500000)
 * const formatted = useFormatCompact(() => users())
 * // formatted() === "1.5M"
 * ```
 */
export function useFormatCompact(
  n: MaybeReactive<number>,
  decimals = 1
): () => string {
  return createMemo(() => formatCompact(resolve(n), decimals));
}

/**
 * Reactive percentage formatter
 *
 * @param n - Decimal number or signal (0.156 = 15.6%)
 * @param decimals - Decimal places (default: 1)
 * @returns Signal returning percentage string
 *
 * @example
 * ```typescript
 * const [progress, setProgress] = createSignal(0.45)
 * const formatted = useFormatPercent(() => progress())
 * // formatted() === "45%"
 * ```
 */
export function useFormatPercent(
  n: MaybeReactive<number>,
  decimals = 1
): () => string {
  return createMemo(() => formatPercent(resolve(n), decimals));
}

/**
 * Reactive delta/change formatter
 *
 * @param delta - Change value or signal
 * @param decimals - Decimal places (default: 1)
 * @returns Signal returning delta string like "+12.5%" or "-3.2%"
 *
 * @example
 * ```typescript
 * const [change, setChange] = createSignal(12.5)
 * const formatted = useFormatDelta(() => change())
 * // formatted() === "+12.5%"
 * ```
 */
export function useFormatDelta(
  delta: MaybeReactive<number>,
  decimals = 1
): () => string {
  return createMemo(() => formatDelta(resolve(delta), decimals));
}
