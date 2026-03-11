/**
 * Layout primitive tests
 */

import { describe, it, expect } from 'vitest';
import { calculateLayout } from '../../src/core/layout.js';
import { createFrameSnapshot } from '../../src/core/frame.js';
import { renderFrameToString } from '../../src/core/renderer.js';
import { createGradientImage } from '../../src/core/graphics.js';
import { TerminalImage } from '../../src/atoms/terminal-image.js';
import { Text } from '../../src/primitives/nodes.js';
import { Screen, Main, Footer, Sidebar, Panel, Header, screen, main, footer, sidebar, header } from '../../src/templates/index.js';

describe('layout primitives', () => {
  it('applies default props for primitives', () => {
    const screenNode = Screen({});
    const headerNode = Header({});
    const mainNode = Main({});
    const footerNode = Footer({});
    const sidebarNode = Sidebar({});
    const panelNode = Panel({});

    const termWidth = process.stdout.columns || 80;
    const termHeight = process.stdout.rows || 24;

    expect(screenNode.props.width).toBe(termWidth);
    expect(screenNode.props.height).toBe(termHeight);
    expect(headerNode.props.height).toBe('auto');
    expect(headerNode.props.width).toBe('fill');
    expect(mainNode.props.height).toBe('fill');
    expect(footerNode.props.height).toBe('auto');
    expect(sidebarNode.props.height).toBe('fill');
    expect(sidebarNode.props.width).toBe('auto');
    expect(panelNode.props.borderStyle).toBe('round');
  });

  it('fills remaining space in a screen layout', () => {
    const node = Screen(
      { width: 30, height: 10 },
      Header({}, Text({}, 'Header')),
      Main({}, Text({}, 'Body')),
      Footer({}, Text({}, 'Footer'))
    );

    const layout = calculateLayout(node, 30, 10);
    expect(layout.children[0].height).toBe(1);
    expect(layout.children[1].height).toBe(8);
    expect(layout.children[2].height).toBe(1);
  });

  it('shorthand helpers work without props', () => {
    // Test that lowercase helpers produce same result as uppercase with empty props
    const node = screen(
      header(Text({}, 'Title')),
      main(Text({}, 'Content')),
      footer(Text({}, 'Status'))
    );

    expect(node.props.flexDirection).toBe('column');
    expect(node.children.length).toBe(3);
    expect(node.children[0].props.flexDirection).toBe('row'); // header
    expect(node.children[1].props.height).toBe('fill'); // main
    expect(node.children[2].props.height).toBe('auto'); // footer
  });

  it('supports props.children as fallback for variadic children', () => {
    // Test that children can be passed via props (for React-like patterns)
    const content = Text({}, 'Content');

    const screenNode = Screen({ children: content });
    const mainNode = Main({ children: content });
    const footerNode = Footer({ children: content });
    const sidebarNode = Sidebar({ children: content });
    const panelNode = Panel({ children: content });
    const headerNode = Header({ children: content });

    // All should have the content as a child
    expect(screenNode.children.length).toBe(1);
    expect(mainNode.children.length).toBe(1);
    expect(footerNode.children.length).toBe(1);
    expect(sidebarNode.children.length).toBe(1);
    expect(panelNode.children.length).toBe(1); // Panel may have title box too
    expect(headerNode.children.length).toBe(1);
  });

  it('prefers variadic children over props.children', () => {
    const propsChild = Text({}, 'Props');
    const variadicChild = Text({}, 'Variadic');

    // When both are provided, variadic wins
    const node = Screen({ children: propsChild }, variadicChild);

    expect(node.children.length).toBe(1);
    expect(node.children[0]).toBe(variadicChild);
  });

  it('renders TerminalImage inside Panel as a normal container child', () => {
    const node = Panel(
      { title: 'Image', width: 40, height: 14 },
      TerminalImage({
        source: createGradientImage(32, 16),
        protocol: 'kitty',
        flexGrow: 1,
        width: 'fill',
        height: 'fill',
      }),
    );

    const frame = createFrameSnapshot(node, { width: 40, height: 20 });
    const output = renderFrameToString(frame);

    expect(frame.drawCommands.some((command) => command.type === 'terminal-image')).toBe(true);
    expect(frame.reservedRegions).toHaveLength(1);
    expect(output).toContain('\x1b_Ga=T');
  });
});
