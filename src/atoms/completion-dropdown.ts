/**
 * CompletionDropdown - Generic dropdown for TextInput completions
 *
 * @layer Atom
 * @description Renders TextInputCompletionState as a dropdown list
 *
 * Features:
 * - Loading state with spinner
 * - Selected item highlight
 * - Detail text (dimmed, right-aligned)
 * - Icons per item
 * - Scroll indicators (▲/▼)
 * - Error and empty states
 * - Configurable max visible items
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue, BorderStyleName } from '../utils/types.js';
import { getTheme } from '../core/theme.js';
import { getRenderMode } from '../core/capabilities.js';
import { stringWidth, truncateText } from '../utils/text-utils.js';
import { Spinner } from './spinner.js';
import type { TextInputCompletionState, TextInputCompletionItem } from './text-input.js';

// =============================================================================
// Types
// =============================================================================

export interface CompletionDropdownProps<T = unknown> {
  /** Reactive completion state from TextInput */
  state: () => TextInputCompletionState<T> | null;
  /** Maximum visible items before scrolling (default: 8) */
  maxVisible?: number;
  /** Dropdown width in characters */
  width?: number;
  /** Border style (default: 'round') */
  borderStyle?: BorderStyleName;
  /** Border color */
  borderColor?: ColorValue;
  /** Highlight color for selected item (default: theme primary) */
  highlightColor?: ColorValue;
  /** Show icons from completion items */
  showIcons?: boolean;
  /** Message when no results found */
  emptyMessage?: string;
  /** Loading message */
  loadingMessage?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders a dropdown list from TextInput completion state.
 *
 * Place this below your TextInput to show inline completion suggestions.
 * Reads from the completion signal — automatically shows/hides.
 *
 * @example
 * const state = createTextInputState({
 *   completion: createTriggerCompletion({
 *     trigger: '@',
 *     getItems: searchUsers,
 *   }),
 * });
 *
 * Box({ flexDirection: 'column' },
 *   TextInput({ state }),
 *   CompletionDropdown({ state: state.completion }),
 * )
 */
export function CompletionDropdown<T = unknown>(
  props: CompletionDropdownProps<T>,
): VNode | null {
  const completion = props.state();
  if (!completion) return null;

  const theme = getTheme();
  const isAscii = getRenderMode() === 'ascii';
  const {
    maxVisible = 8,
    width,
    borderStyle = 'round',
    borderColor = 'border',
    highlightColor = theme.accents?.info ?? 'cyan',
    showIcons = true,
    emptyMessage = 'No results',
    loadingMessage = 'Searching...',
  } = props;
  if (!Number.isInteger(maxVisible) || maxVisible < 1) {
    throw new RangeError('CompletionDropdown maxVisible must be a positive integer');
  }
  if (width !== undefined && (!Number.isInteger(width) || width < 5)) {
    throw new RangeError('CompletionDropdown width must be an integer of at least 5');
  }

  // Loading state
  if (completion.status === 'loading') {
    return Box(
      { borderStyle, borderColor, width, paddingLeft: 1, paddingRight: 1 },
      Spinner({ text: loadingMessage, style: 'dots' }),
    );
  }

  // Error state
  if (completion.status === 'error') {
    return Box(
      { borderStyle, borderColor, width, paddingLeft: 1, paddingRight: 1 },
      Text({ color: 'destructive' }, completion.error ?? 'Error loading suggestions'),
    );
  }

  // Empty state
  if (completion.items.length === 0) {
    return Box(
      { borderStyle, borderColor, width, paddingLeft: 1, paddingRight: 1 },
      Text({ color: 'mutedForeground', dim: true }, emptyMessage),
    );
  }

  // Calculate visible window
  const items = completion.items;
  const selectedIndex = completion.selectedIndex;
  const totalItems = items.length;
  const visibleCount = Math.min(maxVisible, totalItems);

  // Scroll window to keep selected item visible
  let startIndex = 0;
  if (selectedIndex >= visibleCount) {
    startIndex = Math.min(selectedIndex - visibleCount + 1, totalItems - visibleCount);
  }
  const endIndex = Math.min(startIndex + visibleCount, totalItems);

  const hasMore = totalItems > visibleCount;
  const canScrollUp = startIndex > 0;
  const canScrollDown = endIndex < totalItems;
  const scrollUpIndicator = isAscii ? '^' : '\u25B2'; // ▲
  const scrollDownIndicator = isAscii ? 'v' : '\u25BC'; // ▼

  // Build visible rows
  const rows: VNode[] = [];

  if (hasMore && canScrollUp) {
    rows.push(
      Text({ color: 'mutedForeground', dim: true }, `  ${scrollUpIndicator} ${startIndex} more`),
    );
  }

  for (let i = startIndex; i < endIndex; i++) {
    const item = items[i]!;
    const isSelected = i === selectedIndex;

    rows.push(renderItem(item, isSelected, highlightColor, showIcons, width));
  }

  if (hasMore && canScrollDown) {
    rows.push(
      Text({ color: 'mutedForeground', dim: true }, `  ${scrollDownIndicator} ${totalItems - endIndex} more`),
    );
  }

  return Box(
    {
      flexDirection: 'column',
      borderStyle,
      borderColor,
      width,
      paddingLeft: 1,
      paddingRight: 1,
    },
    ...rows,
  );
}

function renderItem<T>(
  item: TextInputCompletionItem<T>,
  isSelected: boolean,
  highlightColor: ColorValue,
  showIcons: boolean,
  maxWidth?: number,
): VNode {
  const isAscii = getRenderMode() === 'ascii';
  const pointer = isSelected ? (isAscii ? '>' : '\u276F') : ' '; // ❯

  const parts: VNode[] = [];
  const icon = showIcons && item.icon ? `${item.icon} ` : '';
  const prefixWidth = stringWidth(`${pointer} ${icon}`);
  const detailText = item.detail ? ` ${item.detail}` : '';
  const detailWidth = stringWidth(detailText);
  // The outer box consumes two border cells and two padding cells.
  const contentWidth = maxWidth === undefined ? undefined : Math.max(1, maxWidth - 4);
  const labelWidth = contentWidth === undefined
    ? undefined
    : Math.max(1, contentWidth - prefixWidth - detailWidth);
  const label = labelWidth === undefined
    ? item.label
    : truncateText(item.label, labelWidth, {
      position: 'end',
      truncationCharacter: isAscii ? '...' : '…',
    });
  const remainingDetailWidth = contentWidth === undefined
    ? undefined
    : Math.max(0, contentWidth - prefixWidth - stringWidth(label));
  const detail = remainingDetailWidth === undefined
    ? detailText
    : truncateText(detailText, remainingDetailWidth, {
      position: 'end',
      truncationCharacter: isAscii ? '...' : '…',
    });

  // Pointer
  parts.push(Text({ color: isSelected ? highlightColor : undefined }, `${pointer} `));

  if (icon) {
    parts.push(Text({ color: isSelected ? highlightColor : undefined }, icon));
  }

  // Label
  parts.push(
    Text(
      { color: isSelected ? highlightColor : undefined, bold: isSelected },
      label,
    ),
  );

  // Detail (right-aligned, dim)
  if (detail) {
    parts.push(Text({ color: 'mutedForeground', dim: true }, detail));
  }

  return Box({ flexDirection: 'row' }, ...parts);
}
