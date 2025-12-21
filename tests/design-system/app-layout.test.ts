/**
 * Tests for Design System App Layout Components
 */

import { describe, it, expect } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import { Text, Box } from '../../src/primitives/index.js';
import { Page, AppShell, StatusBar, Header, Container } from '../../src/design-system/layout/app.js';

describe('App Layout Components', () => {
  describe('Page', () => {
    it('should render page with content', () => {
      const node = Page({
        children: Text({}, 'Page Content'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Page Content');
    });

    it('should render page with title', () => {
      const node = Page({
        title: 'My Page',
        divider: false,
        children: Text({}, 'Content'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('My Page');
    });

    it('should render page with subtitle', () => {
      const node = Page({
        title: 'Title',
        subtitle: 'Description here',
        divider: false,
        children: Text({}, 'Content'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Description');
    });

    it('should render page with border', () => {
      const node = Page({
        border: true,
        children: Text({}, 'Bordered'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('─');
    });

    it('should render page with custom border style', () => {
      const styles = ['single', 'double', 'round', 'bold'] as const;
      for (const borderStyle of styles) {
        const node = Page({
          border: true,
          borderStyle,
          children: Text({}, 'Content'),
        });
        const output = renderToString(node, 80);
        expect(output).toBeDefined();
      }
    });

    it('should render page with footer', () => {
      const node = Page({
        divider: false,
        children: Text({}, 'Main'),
        footer: Text({}, 'Footer Text'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Footer Text');
    });

    it('should render page with custom header', () => {
      const node = Page({
        divider: false,
        header: Text({}, 'Custom Header'),
        children: Text({}, 'Body'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Custom Header');
    });

    it('should apply padding', () => {
      const node = Page({
        padding: 2,
        children: Text({}, 'Padded'),
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should apply fixed dimensions', () => {
      const node = Page({
        width: 40,
        height: 10,
        children: Text({}, 'Fixed'),
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should apply fullScreen mode', () => {
      const node = Page({
        fullScreen: true,
        children: Text({}, 'Full'),
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should apply title color', () => {
      const node = Page({
        title: 'Colored',
        titleColor: 'green',
        divider: false,
        children: Text({}, 'Content'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Colored');
    });

    it('should apply border color', () => {
      const node = Page({
        border: true,
        borderColor: 'cyan',
        children: Text({}, 'Content'),
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });
  });

  describe('AppShell', () => {
    it('should render main content', () => {
      const node = AppShell({
        dividers: false,
        children: Text({}, 'Main Content'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Main Content');
    });

    it('should render with sidebar', () => {
      const node = AppShell({
        sidebar: Text({}, 'Sidebar'),
        dividers: false,
        children: Text({}, 'Main'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Sidebar');
      expect(output).toContain('Main');
    });

    it('should render with header', () => {
      const node = AppShell({
        header: Text({}, 'App Header'),
        dividers: false,
        children: Text({}, 'Main'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('App Header');
    });

    it('should render with footer', () => {
      const node = AppShell({
        footer: Text({}, 'Status Footer'),
        dividers: false,
        children: Text({}, 'Main'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Status Footer');
    });

    it('should render with aside', () => {
      const node = AppShell({
        dividers: false,
        children: Text({}, 'Main'),
        aside: Text({}, 'Right Panel'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Right Panel');
    });

    it('should apply sidebar width', () => {
      const node = AppShell({
        sidebar: Text({}, 'Side'),
        sidebarWidth: 20,
        dividers: false,
        children: Text({}, 'Main'),
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render full layout', () => {
      const node = AppShell({
        header: Text({}, 'Header'),
        sidebar: Text({}, 'Sidebar'),
        dividers: false,
        aside: Text({}, 'Right'),
        footer: Text({}, 'Footer'),
        children: Text({}, 'Main'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Header');
      expect(output).toContain('Main');
      expect(output).toContain('Footer');
    });

    it('should apply dividers', () => {
      const node = AppShell({
        sidebar: Text({}, 'Side'),
        dividers: true,
        children: Text({}, 'Main'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('│');
    });
  });

  describe('StatusBar', () => {
    it('should render left content', () => {
      const node = StatusBar({
        left: Text({}, 'Left'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Left');
    });

    it('should render center content', () => {
      const node = StatusBar({
        center: Text({}, 'Center'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Center');
    });

    it('should render right content', () => {
      const node = StatusBar({
        right: Text({}, 'Right'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Right');
    });

    it('should render all sections', () => {
      const node = StatusBar({
        left: Text({}, 'L'),
        center: Text({}, 'C'),
        right: Text({}, 'R'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('L');
      expect(output).toContain('C');
      expect(output).toContain('R');
    });

    it('should apply background color', () => {
      const node = StatusBar({
        left: Text({}, 'Status'),
        backgroundColor: 'blue',
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should apply text color', () => {
      const node = StatusBar({
        left: Text({}, 'Status'),
        color: 'white',
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should apply separator', () => {
      const node = StatusBar({
        left: Text({}, 'A'),
        right: Text({}, 'B'),
        separator: ' | ',
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });
  });

  describe('Header', () => {
    it('should render title', () => {
      const node = Header({
        title: 'App Title',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('App Title');
    });

    it('should render subtitle', () => {
      const node = Header({
        title: 'Title',
        subtitle: 'Subtitle text',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Subtitle');
    });

    it('should render left actions', () => {
      const node = Header({
        title: 'App',
        leftActions: Text({}, '[Back]'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('[Back]');
    });

    it('should render right actions', () => {
      const node = Header({
        title: 'App',
        rightActions: Text({}, '[Menu]'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('[Menu]');
    });

    it('should apply title color', () => {
      const node = Header({
        title: 'Colored',
        titleColor: 'magenta',
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should apply border', () => {
      const node = Header({
        title: 'Bordered',
        border: true,
      });
      const output = renderToString(node, 80);
      expect(output).toContain('─');
    });

    it('should apply border color', () => {
      const node = Header({
        title: 'Test',
        border: true,
        borderColor: 'yellow',
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });
  });

  describe('Container', () => {
    it('should render children', () => {
      const node = Container({
        children: Text({}, 'Container Content'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Container Content');
    });

    it('should apply max width', () => {
      const node = Container({
        maxWidth: 40,
        children: Text({}, 'Limited'),
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should center content', () => {
      const node = Container({
        center: true,
        children: Text({}, 'Centered'),
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should apply padding', () => {
      const node = Container({
        padding: 2,
        children: Text({}, 'Padded'),
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });
  });
});
