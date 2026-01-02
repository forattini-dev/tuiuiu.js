/**
 * Format Utilities
 *
 * @description Pure formatting functions for common display patterns
 *
 * All functions are pure (no side effects) and work with both
 * static values and can be wrapped with createMemo for reactive usage.
 */

// =============================================================================
// Byte Formatting
// =============================================================================

const BYTE_UNITS_SHORT = ['B', 'K', 'M', 'G', 'T', 'P'];
const BYTE_UNITS_FULL = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

/**
 * Format bytes as human-readable string
 *
 * @param bytes - Number of bytes
 * @param format - 'short' for "1.5K" or 'full' for "1.5 KiB"
 * @returns Formatted string
 *
 * @example
 * ```typescript
 * formatBytes(1024)           // "1 KiB"
 * formatBytes(1536, 'short')  // "1.5K"
 * formatBytes(1536, 'full')   // "1.5 KiB"
 * formatBytes(0)              // "0 B"
 * ```
 */
export function formatBytes(bytes: number, format: 'short' | 'full' = 'full'): string {
  if (bytes === 0) return format === 'short' ? '0B' : '0 B';
  if (!Number.isFinite(bytes)) return format === 'short' ? '∞' : '∞ B';

  const isNegative = bytes < 0;
  const absBytes = Math.abs(bytes);
  const units = format === 'short' ? BYTE_UNITS_SHORT : BYTE_UNITS_FULL;
  const separator = format === 'short' ? '' : ' ';

  let unitIndex = 0;
  let value = absBytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  // Format with appropriate precision
  const formatted = unitIndex === 0
    ? value.toString()
    : value < 10
      ? value.toFixed(2)
      : value < 100
        ? value.toFixed(1)
        : value.toFixed(0);

  const prefix = isNegative ? '-' : '';
  return `${prefix}${formatted}${separator}${units[unitIndex]}`;
}

// =============================================================================
// Duration Formatting
// =============================================================================

/**
 * Format seconds as human-readable duration
 *
 * @param seconds - Duration in seconds
 * @param format - 'long' for "1h 30m 45s" or 'short' for "1:30:45"
 * @returns Formatted duration string
 *
 * @example
 * ```typescript
 * formatDuration(90)            // "1m 30s"
 * formatDuration(90, 'short')   // "1:30"
 * formatDuration(3661)          // "1h 1m 1s"
 * formatDuration(3661, 'short') // "1:01:01"
 * formatDuration(86400)         // "1d 0h 0m"
 * ```
 */
export function formatDuration(seconds: number, format: 'long' | 'short' = 'long'): string {
  if (!Number.isFinite(seconds) || seconds < 0) return format === 'short' ? '0:00' : '0s';

  const totalSeconds = Math.floor(seconds);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (format === 'short') {
    if (days > 0) {
      return `${days}d ${hours}:${pad(minutes)}:${pad(secs)}`;
    }
    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(secs)}`;
    }
    return `${minutes}:${pad(secs)}`;
  }

  // Long format
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// =============================================================================
// Relative Time Formatting
// =============================================================================

const TIME_UNITS: [number, string, string][] = [
  [60, 'second', 'seconds'],
  [60, 'minute', 'minutes'],
  [24, 'hour', 'hours'],
  [30, 'day', 'days'],
  [12, 'month', 'months'],
  [Infinity, 'year', 'years'],
];

/**
 * Format timestamp as relative time
 *
 * @param timestamp - Date, timestamp in ms, or seconds
 * @param now - Reference time (defaults to Date.now())
 * @returns Relative time string like "5 minutes ago" or "in 2 hours"
 *
 * @example
 * ```typescript
 * formatRelative(Date.now() - 60000)     // "1 minute ago"
 * formatRelative(Date.now() - 3600000)   // "1 hour ago"
 * formatRelative(Date.now() + 120000)    // "in 2 minutes"
 * formatRelative(Date.now())             // "just now"
 * ```
 */
export function formatRelative(timestamp: Date | number, now: number = Date.now()): string {
  const time = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  // Handle if timestamp is in seconds instead of milliseconds
  const normalizedTime = time < 1e12 ? time * 1000 : time;

  const diffMs = now - normalizedTime;
  const isFuture = diffMs < 0;
  let diff = Math.abs(Math.floor(diffMs / 1000)); // seconds

  if (diff < 5) return 'just now';

  for (const [divisor, singular, plural] of TIME_UNITS) {
    if (diff < divisor) {
      const unit = diff === 1 ? singular : plural;
      return isFuture ? `in ${diff} ${unit}` : `${diff} ${unit} ago`;
    }
    diff = Math.floor(diff / divisor);
  }

  // Fallback (shouldn't reach)
  return isFuture ? 'in the future' : 'a long time ago';
}

// =============================================================================
// Number Formatting
// =============================================================================

/**
 * Format number with thousand separators
 *
 * @param n - Number to format
 * @param separator - Separator character (default: ',')
 * @returns Formatted number string
 *
 * @example
 * ```typescript
 * formatNumber(1234567)      // "1,234,567"
 * formatNumber(1234.56)      // "1,234.56"
 * formatNumber(1234, '.')    // "1.234"
 * ```
 */
export function formatNumber(n: number, separator = ','): string {
  if (!Number.isFinite(n)) return n.toString();

  const parts = n.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return parts.join('.');
}

/**
 * Format large numbers compactly
 *
 * @param n - Number to format
 * @param decimals - Decimal places (default: 1)
 * @returns Compact string like "1.2M" or "500K"
 *
 * @example
 * ```typescript
 * formatCompact(1234567)   // "1.2M"
 * formatCompact(500000)    // "500K"
 * formatCompact(999)       // "999"
 * formatCompact(1000)      // "1K"
 * ```
 */
export function formatCompact(n: number, decimals = 1): string {
  if (!Number.isFinite(n)) return n.toString();

  const absN = Math.abs(n);
  const sign = n < 0 ? '-' : '';

  if (absN < 1000) return sign + absN.toString();
  if (absN < 1_000_000) return sign + (absN / 1000).toFixed(decimals).replace(/\.0+$/, '') + 'K';
  if (absN < 1_000_000_000) return sign + (absN / 1_000_000).toFixed(decimals).replace(/\.0+$/, '') + 'M';
  if (absN < 1_000_000_000_000) return sign + (absN / 1_000_000_000).toFixed(decimals).replace(/\.0+$/, '') + 'B';
  return sign + (absN / 1_000_000_000_000).toFixed(decimals).replace(/\.0+$/, '') + 'T';
}

/**
 * Format decimal as percentage
 *
 * @param n - Decimal number (0.156 = 15.6%)
 * @param decimals - Decimal places (default: 1)
 * @returns Percentage string like "15.6%"
 *
 * @example
 * ```typescript
 * formatPercent(0.156)       // "15.6%"
 * formatPercent(0.5)         // "50%"
 * formatPercent(1.234, 2)    // "123.40%"
 * formatPercent(0.001, 0)    // "0%"
 * ```
 */
export function formatPercent(n: number, decimals = 1): string {
  if (!Number.isFinite(n)) return '—';
  const percent = n * 100;
  const formatted = percent.toFixed(decimals);
  // Remove trailing zeros if no decimals specified
  return formatted.replace(/\.0+$/, '') + '%';
}

/**
 * Format a delta/change value with sign
 *
 * @param delta - Change value (can be negative)
 * @param decimals - Decimal places (default: 1)
 * @returns String like "+12.5%" or "-3.2%"
 *
 * @example
 * ```typescript
 * formatDelta(12.5)    // "+12.5%"
 * formatDelta(-3.2)    // "-3.2%"
 * formatDelta(0)       // "0%"
 * ```
 */
export function formatDelta(delta: number, decimals = 1): string {
  if (!Number.isFinite(delta)) return '—';
  if (delta === 0) return '0%';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(decimals).replace(/\.0+$/, '')}%`;
}

// =============================================================================
// String Truncation
// =============================================================================

/**
 * Truncate string in the middle with ellipsis
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length including ellipsis
 * @param ellipsis - Ellipsis string (default: '...')
 * @returns Truncated string like "very...me.txt"
 *
 * @example
 * ```typescript
 * truncateMiddle('very-long-filename.txt', 15)  // "very-l...me.txt"
 * truncateMiddle('short.txt', 15)               // "short.txt"
 * truncateMiddle('a', 5)                        // "a"
 * ```
 */
export function truncateMiddle(str: string, maxLength: number, ellipsis = '...'): string {
  if (str.length <= maxLength) return str;
  if (maxLength <= ellipsis.length) return str.slice(0, maxLength);

  const availableLength = maxLength - ellipsis.length;
  const frontLength = Math.ceil(availableLength / 2);
  const backLength = Math.floor(availableLength / 2);

  return str.slice(0, frontLength) + ellipsis + str.slice(-backLength);
}

/**
 * Truncate string at the end with ellipsis
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length including ellipsis
 * @param ellipsis - Ellipsis string (default: '...')
 * @returns Truncated string like "very long..."
 *
 * @example
 * ```typescript
 * truncateEnd('very long filename', 12)  // "very long..."
 * truncateEnd('short', 12)               // "short"
 * ```
 */
export function truncateEnd(str: string, maxLength: number, ellipsis = '...'): string {
  if (str.length <= maxLength) return str;
  if (maxLength <= ellipsis.length) return str.slice(0, maxLength);
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}
