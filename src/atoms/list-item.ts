/**
 * ListItem - Standardized list row
 *
 * @layer Atom
 * @description Reusable list item with icon, primary/secondary text and trailing content
 */

import { Box, Spacer, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { getTheme } from '../core/theme.js';
import { resolve, type MaybeReactive } from '../utils/resolve.js';
import { StatusIndicator, type StatusType } from './status-indicator.js';
import { component, type ComponentKeyProps } from '../app/component.js';

type ListItemContent = string | number | VNode;

export interface ListItemProps extends ComponentKeyProps {
  /** Main content */
  primary: MaybeReactive<ListItemContent>;
  /** Secondary description */
  secondary?: MaybeReactive<ListItemContent>;
  /** Leading icon */
  icon?: MaybeReactive<ListItemContent>;
  /** Trailing content */
  trailing?: MaybeReactive<ListItemContent>;
  /** Semantic status indicator */
  status?: MaybeReactive<StatusType>;
  /** Selected state */
  selected?: MaybeReactive<boolean>;
  /** Disabled state */
  disabled?: MaybeReactive<boolean>;
  /** Indentation level */
  indent?: MaybeReactive<number>;
}

function renderListItemContent(
  value: ListItemContent,
  options: {
    color?: ColorValue;
    dim?: boolean;
    bold?: boolean;
  } = {}
): VNode {
  if (typeof value === 'string' || typeof value === 'number') {
    return Text(
      {
        color: options.color,
        dim: options.dim,
        bold: options.bold,
        wrap: 'truncate-end',
      },
      value
    );
  }

  return value;
}

/**
 * ListItem - composable row for file browsers, menus and activity feeds.
 */
function renderListItem(props: ListItemProps): VNode {
  const theme = getTheme();

  const primary = resolve(props.primary);
  const secondary = props.secondary !== undefined ? resolve(props.secondary) : undefined;
  const icon = props.icon !== undefined ? resolve(props.icon) : undefined;
  const trailing = props.trailing !== undefined ? resolve(props.trailing) : undefined;
  const status = props.status !== undefined ? resolve(props.status) : undefined;
  const selected = props.selected !== undefined ? resolve(props.selected) : false;
  const disabled = props.disabled !== undefined ? resolve(props.disabled) : false;
  const indent = props.indent !== undefined ? resolve(props.indent) : 0;

  const backgroundColor = selected ? theme.states.selected.bg : undefined;
  const primaryColor = disabled
    ? theme.states.disabled.fg
    : selected
      ? theme.states.selected.fg
      : theme.foreground.primary;
  const secondaryColor = disabled
    ? theme.states.disabled.fg
    : selected
      ? theme.states.selected.fg
      : theme.foreground.muted;

  return Box(
    {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1,
      paddingLeft: indent * 2,
      backgroundColor,
    },
    icon ? renderListItemContent(icon, { color: primaryColor, dim: disabled }) : null,
    Box(
      {
        flexDirection: 'column',
        flexGrow: 1,
      },
      renderListItemContent(primary, { color: primaryColor, dim: disabled, bold: selected && !disabled }),
      secondary ? renderListItemContent(secondary, { color: secondaryColor, dim: true }) : null
    ),
    Spacer(),
    trailing ? renderListItemContent(trailing, { color: primaryColor, dim: disabled }) : null,
    status ? StatusIndicator({ status, showDot: true, showIcon: false, size: 'sm' }) : null
  );
}

export const ListItem = component<ListItemProps, VNode>('ListItem', renderListItem);
