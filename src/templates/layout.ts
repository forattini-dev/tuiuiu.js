/**
 * Layout Primitives - Terminal-first layout helpers
 */

import { Box, Text, normalizeChildren } from '../primitives/nodes.js';
import type { BoxStyle, ColorValue, TuiChild, TuiNode, VNode } from '../utils/types.js';

export interface ScreenProps extends BoxStyle {
  children?: TuiNode;
}

export function Screen(props: ScreenProps = {}, ...children: TuiChild[]): VNode {
  const { width, height, children: propsChildren, ...rest } = props;

  // Fallback to props.children if variadic children empty
  const resolvedChildren = children.length > 0 ? children : normalizeChildren(propsChildren);

  return Box(
    {
      flexDirection: 'column',
      alignItems: 'stretch',
      width: width ?? 'fill',
      height: height ?? 'fill',
      ...rest,
    },
    ...resolvedChildren
  );
}

export interface MainProps extends BoxStyle {
  children?: TuiNode;
}

export function Main(props: MainProps = {}, ...children: TuiChild[]): VNode {
  const { height, children: propsChildren, ...rest } = props;

  // Fallback to props.children if variadic children empty
  const resolvedChildren = children.length > 0 ? children : normalizeChildren(propsChildren);

  return Box(
    {
      flexDirection: 'column',
      alignItems: 'stretch',
      height: height ?? 'fill',
      ...rest,
    },
    ...resolvedChildren
  );
}

export interface FooterProps extends BoxStyle {
  children?: TuiNode;
}

export function Footer(props: FooterProps = {}, ...children: TuiChild[]): VNode {
  const { height, children: propsChildren, ...rest } = props;

  // Fallback to props.children if variadic children empty
  const resolvedChildren = children.length > 0 ? children : normalizeChildren(propsChildren);

  return Box(
    {
      flexDirection: 'row',
      alignItems: 'center',
      height: height ?? 'auto',
      ...rest,
    },
    ...resolvedChildren
  );
}

export interface SidebarProps extends BoxStyle {
  children?: TuiNode;
}

export function Sidebar(props: SidebarProps = {}, ...children: TuiChild[]): VNode {
  const { width, height, children: propsChildren, ...rest } = props;

  // Fallback to props.children if variadic children empty
  const resolvedChildren = children.length > 0 ? children : normalizeChildren(propsChildren);

  return Box(
    {
      flexDirection: 'column',
      alignItems: 'stretch',
      width: width ?? 'auto',
      height: height ?? 'fill',
      ...rest,
    },
    ...resolvedChildren
  );
}

export interface PanelProps extends BoxStyle {
  title?: string;
  titleColor?: ColorValue;
  children?: TuiNode;
}

export function Panel(props: PanelProps = {}, ...children: TuiChild[]): VNode {
  const {
    title,
    titleColor = 'mutedForeground',
    borderStyle = 'round',
    borderColor = 'muted',
    padding = 1,
    children: propsChildren,
    ...rest
  } = props;

  // Fallback to props.children if variadic children empty
  const resolvedChildren = children.length > 0 ? children : normalizeChildren(propsChildren);

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
    ...resolvedChildren
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
