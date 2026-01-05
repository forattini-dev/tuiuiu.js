/**
 * Layout Primitives - Terminal-first layout helpers
 */

import { Box, Text } from '../primitives/nodes.js';
import type { BoxStyle, ColorValue, ReckChild, ReckNode, VNode } from '../utils/types.js';

export interface ScreenProps extends BoxStyle {
  children?: ReckNode;
}

export function Screen(props: ScreenProps = {}, ...children: ReckChild[]): VNode {
  const { width, height, children: propsChildren, ...rest } = props;
  const termWidth = process.stdout.columns || 80;
  const termHeight = process.stdout.rows || 24;

  // Fallback to props.children if variadic children empty
  const resolvedChildren = children.length > 0
    ? children
    : (propsChildren ? (Array.isArray(propsChildren) ? propsChildren : [propsChildren]) : []);

  return Box(
    {
      flexDirection: 'column',
      alignItems: 'stretch',
      width: width ?? termWidth,
      height: height ?? termHeight,
      ...rest,
    },
    ...resolvedChildren
  );
}

export interface MainProps extends BoxStyle {
  children?: ReckNode;
}

export function Main(props: MainProps = {}, ...children: ReckChild[]): VNode {
  const { height, children: propsChildren, ...rest } = props;

  // Fallback to props.children if variadic children empty
  const resolvedChildren = children.length > 0
    ? children
    : (propsChildren ? (Array.isArray(propsChildren) ? propsChildren : [propsChildren]) : []);

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
  children?: ReckNode;
}

export function Footer(props: FooterProps = {}, ...children: ReckChild[]): VNode {
  const { height, children: propsChildren, ...rest } = props;

  // Fallback to props.children if variadic children empty
  const resolvedChildren = children.length > 0
    ? children
    : (propsChildren ? (Array.isArray(propsChildren) ? propsChildren : [propsChildren]) : []);

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
  children?: ReckNode;
}

export function Sidebar(props: SidebarProps = {}, ...children: ReckChild[]): VNode {
  const { width, height, children: propsChildren, ...rest } = props;

  // Fallback to props.children if variadic children empty
  const resolvedChildren = children.length > 0
    ? children
    : (propsChildren ? (Array.isArray(propsChildren) ? propsChildren : [propsChildren]) : []);

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
  children?: ReckNode;
}

export function Panel(props: PanelProps = {}, ...children: ReckChild[]): VNode {
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
  const resolvedChildren = children.length > 0
    ? children
    : (propsChildren ? (Array.isArray(propsChildren) ? propsChildren : [propsChildren]) : []);

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
export const screen = (...children: ReckChild[]): VNode => Screen({}, ...children);

/** Main without props - just pass children */
export const main = (...children: ReckChild[]): VNode => Main({}, ...children);

/** Footer without props - just pass children */
export const footer = (...children: ReckChild[]): VNode => Footer({}, ...children);

/** Sidebar without props - just pass children */
export const sidebar = (...children: ReckChild[]): VNode => Sidebar({}, ...children);
