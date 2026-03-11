/**
 * DataRow - Label/value pair display
 *
 * @layer Atom
 * @description Displays key/value pairs with optional status indicator
 */

import { Box, Spacer, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { resolve, type MaybeReactive } from '../utils/resolve.js';
import { truncateEnd } from '../utils/formatters.js';
import { StatusIndicator, type StatusType } from './status-indicator.js';

type DataRowValue = string | number | VNode;

export interface DataRowProps {
  /** Label text shown on the left */
  label: MaybeReactive<string>;
  /** Value shown on the right */
  value: MaybeReactive<DataRowValue>;
  /** Optional fixed label width */
  labelWidth?: MaybeReactive<number>;
  /** Optional label color */
  labelColor?: MaybeReactive<ColorValue>;
  /** Optional value color */
  valueColor?: MaybeReactive<ColorValue>;
  /** Optional semantic status indicator */
  status?: MaybeReactive<StatusType>;
  /** Maximum value width before truncation */
  truncate?: MaybeReactive<number>;
}

function renderValueNode(
  value: DataRowValue,
  color?: ColorValue,
  truncate?: number
): VNode {
  if (typeof value === 'string' || typeof value === 'number') {
    const raw = String(value);
    const content = truncate !== undefined ? truncateEnd(raw, truncate) : raw;
    return Text({ color, wrap: truncate !== undefined ? 'truncate-end' : undefined }, content);
  }

  return value;
}

/**
 * DataRow - left label + right value row.
 *
 * @example
 * DataRow({ label: 'Host', value: 'api.example.com' })
 *
 * @example
 * DataRow({
 *   label: 'Status',
 *   value: () => connection.host(),
 *   status: () => connection.ok() ? 'success' : 'error',
 * })
 */
export function DataRow(props: DataRowProps): VNode {
  const label = resolve(props.label);
  const value = resolve(props.value);
  const labelWidth = props.labelWidth !== undefined ? resolve(props.labelWidth) : undefined;
  const labelColor = props.labelColor !== undefined ? resolve(props.labelColor) : 'muted';
  const valueColor = props.valueColor !== undefined ? resolve(props.valueColor) : undefined;
  const status = props.status !== undefined ? resolve(props.status) : undefined;
  const truncate = props.truncate !== undefined ? resolve(props.truncate) : undefined;

  const labelNode = labelWidth !== undefined
    ? Box({ width: labelWidth }, Text({ color: labelColor, wrap: 'truncate-end' }, label))
    : Text({ color: labelColor }, label);

  return Box(
    {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1,
    },
    labelNode,
    Spacer(),
    status ? StatusIndicator({ status, showDot: true, showIcon: false, size: 'sm' }) : null,
    renderValueNode(value, valueColor, truncate)
  );
}
