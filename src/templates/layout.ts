/**
 * Layout Primitives - Terminal-first layout helpers
 */

import { Box, Text } from '../primitives/nodes.js';
import type { BoxStyle, ColorValue, TuiChild, VNode } from '../utils/types.js';

export interface ScreenProps extends BoxStyle {}

export function Screen(props: ScreenProps = {}, ...children: TuiChild[]): VNode {
  const { width, height, ...rest } = props;

  return Box(
    {
      flexDirection: 'column',
      alignItems: 'stretch',
      width: width ?? 'fill',
      height: height ?? 'fill',
      ...rest,
    },
    ...children
  );
}

export interface MainProps extends BoxStyle {}

export function Main(props: MainProps = {}, ...children: TuiChild[]): VNode {
  const { height, ...rest } = props;

  return Box(
    {
      flexDirection: 'column',
      alignItems: 'stretch',
      height: height ?? 'fill',
      ...rest,
    },
    ...children
  );
}

export interface FooterProps extends BoxStyle {}

export function Footer(props: FooterProps = {}, ...children: TuiChild[]): VNode {
  const { height, ...rest } = props;

  return Box(
    {
      flexDirection: 'row',
      alignItems: 'center',
      height: height ?? 'auto',
      ...rest,
    },
    ...children
  );
}

export interface SidebarProps extends BoxStyle {}

export function Sidebar(props: SidebarProps = {}, ...children: TuiChild[]): VNode {
  const { width, height, ...rest } = props;

  return Box(
    {
      flexDirection: 'column',
      alignItems: 'stretch',
      width: width ?? 'auto',
      height: height ?? 'fill',
      ...rest,
    },
    ...children
  );
}

export interface PanelProps extends BoxStyle {
  title?: string;
  titleColor?: ColorValue;
}

export function Panel(props: PanelProps = {}, ...children: TuiChild[]): VNode {
  const {
    title,
    titleColor = 'mutedForeground',
    borderStyle = 'round',
    borderColor = 'muted',
    padding = 1,
    ...rest
  } = props;

  return Box(
    {
      flexDirection: 'column',
      alignItems: 'stretch',
      borderStyle,
      borderColor,
      padding,
      ...rest,
    },
    title
      ? Box(
          { marginBottom: 1 },
          Text({ color: titleColor, dim: true }, title)
        )
      : null,
    ...children
  );
}

// =============================================================================
// Shorthand Helpers (no props required)
// =============================================================================

/** Screen without props - just pass children */
export const screen = (...children: TuiChild[]): VNode => Screen({}, ...children);

/** Main without props - just pass children */
export const main = (...children: TuiChild[]): VNode => Main({}, ...children);

/** Footer without props - just pass children */
export const footer = (...children: TuiChild[]): VNode => Footer({}, ...children);

/** Sidebar without props - just pass children */
export const sidebar = (...children: TuiChild[]): VNode => Sidebar({}, ...children);
