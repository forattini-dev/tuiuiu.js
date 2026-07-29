/**
 * Optional automatic JSX runtime.
 *
 * Configure TypeScript with:
 *   "jsx": "react-jsx",
 *   "jsxImportSource": "tuiuiu.js"
 */

import {
  Box,
  Fragment as NodeFragment,
  Newline,
  Spacer,
  Text,
} from './primitives/nodes.js';
import type {
  BoxProps,
  NewlineProps,
  SpacerProps,
  TextProps,
  TuiChild,
  TuiNode,
  VNode,
} from './utils/types.js';

export type JSXComponent<Props = Record<string, unknown>> = (
  props: Props & { children?: TuiNode },
) => VNode | null;

type JSXType = keyof JSX.IntrinsicElements | JSXComponent<any>;
type JSXProps = Record<string, unknown> & { children?: TuiNode };

function asChildren(children: TuiNode | undefined): TuiChild[] {
  if (children === undefined) {
    return [];
  }
  return Array.isArray(children) ? children : [children];
}

function renderIntrinsic(type: keyof JSX.IntrinsicElements, props: JSXProps): VNode {
  const { children, ...rest } = props;

  switch (type) {
    case 'box':
      return Box(rest as BoxProps, ...asChildren(children));
    case 'text': {
      const textChildren = asChildren(children);
      if (textChildren.some((child) =>
        child !== null &&
        child !== undefined &&
        typeof child !== 'string' &&
        typeof child !== 'number' &&
        typeof child !== 'boolean'
      )) {
        throw new TypeError('[tuiuiu/jsx] <text> only accepts text and number children');
      }
      return Text(
        rest as TextProps,
        ...textChildren
          .filter((child): child is string | number =>
            typeof child === 'string' || typeof child === 'number'
          ),
      );
    }
    case 'spacer':
      return Spacer(rest as SpacerProps);
    case 'newline':
      return Newline(rest as NewlineProps);
    case 'fragment':
      return NodeFragment(...asChildren(children));
    default:
      throw new TypeError(`[tuiuiu/jsx] Unknown intrinsic element: ${String(type)}`);
  }
}

export function jsx(type: JSXType, rawProps: JSXProps | null, key?: string): VNode {
  const props: JSXProps = rawProps ? { ...rawProps } : {};
  if (key !== undefined) {
    props.key = key;
  }

  if (typeof type === 'function') {
    return type(props) ?? NodeFragment();
  }

  return renderIntrinsic(type, props);
}

export const jsxs = jsx;

export function Fragment(props: { children?: TuiNode }): VNode {
  return NodeFragment(...asChildren(props.children));
}

export namespace JSX {
  export type Element = VNode;
  export type ElementType = keyof IntrinsicElements | JSXComponent<any>;

  export interface ElementChildrenAttribute {
    children: {};
  }

  export interface IntrinsicAttributes {
    key?: string | number;
  }

  export interface IntrinsicElements {
    box: BoxProps;
    text: TextProps;
    spacer: SpacerProps;
    newline: NewlineProps;
    fragment: { children?: TuiNode };
  }
}
