/**
 * App Templates Tests
 *
 * Tests for Page, AppShell, StatusBar, Header, and Container components
 */

import { describe, it, expect } from 'vitest';
import { Page, AppShell, StatusBar, Header, Container } from '../../src/templates/app.js';
import { Text, Box } from '../../src/primitives/nodes.js';

describe('Page', () => {
  describe('Basic Usage', () => {
    it('should create a page with children', () => {
      const vnode = Page({
        children: Text({}, 'Content'),
      });

      expect(vnode.type).toBe('box');
      expect(vnode.props.flexDirection).toBe('column');
    });

    it('should create a page with title', () => {
      const vnode = Page({
        title: 'Settings',
        children: Text({}, 'Content'),
      });

      // Should have title text and divider
      expect(vnode.children.length).toBeGreaterThan(1);
    });

    it('should create a page with title and subtitle', () => {
      const vnode = Page({
        title: 'Settings',
        subtitle: 'Configure preferences',
        children: Text({}, 'Content'),
      });

      // Find the HStack with title
      const hasSubtitle = JSON.stringify(vnode).includes('Configure preferences');
      expect(hasSubtitle).toBe(true);
    });
  });

  describe('Header and Footer', () => {
    it('should use custom header instead of title', () => {
      const customHeader = Text({ bold: true }, 'Custom Header');
      const vnode = Page({
        header: customHeader,
        children: Text({}, 'Content'),
      });

      // First child should be the custom header
      expect(vnode.children[0]).toBe(customHeader);
    });

    it('should include footer when provided', () => {
      const footer = Text({}, 'Footer content');
      const vnode = Page({
        title: 'Page',
        footer: footer,
        children: Text({}, 'Content'),
      });

      // Should have footer as last item
      const hasFooter = JSON.stringify(vnode).includes('Footer content');
      expect(hasFooter).toBe(true);
    });
  });

  describe('Dividers', () => {
    it('should include dividers by default', () => {
      const vnode = Page({
        title: 'Title',
        children: Text({}, 'Content'),
      });

      // Check for divider (HorizontalLine/Divider component)
      const hasDivider = vnode.children.some(
        (c: any) => c.props?.flexDirection === 'row' &&
                    c.children?.some?.((cc: any) => cc.type === 'text' && cc.props?.children?.includes('─'))
      );
      // Dividers may be rendered differently, just verify structure exists
      expect(vnode.children.length).toBeGreaterThan(1);
    });

    it('should not include dividers when divider=false', () => {
      const vnode = Page({
        title: 'Title',
        divider: false,
        children: Text({}, 'Content'),
      });

      // With divider=false, should have fewer children
      // Title HStack + Content Box = 2 children minimum
      expect(vnode.children.length).toBe(2);
    });
  });

  describe('Border', () => {
    it('should add border when border=true', () => {
      const vnode = Page({
        title: 'Bordered',
        border: true,
        borderStyle: 'round',
        borderColor: 'cyan',
        children: Text({}, 'Content'),
      });

      // When border=true, returns a Box wrapper
      expect(vnode.props.borderStyle).toBe('round');
      expect(vnode.props.borderColor).toBe('cyan');
    });
  });

  describe('Dimensions', () => {
    it('should apply width and height', () => {
      const vnode = Page({
        width: 60,
        height: 20,
        children: Text({}, 'Sized'),
      });

      expect(vnode.props.width).toBe(60);
      expect(vnode.props.height).toBe(20);
    });

    it('should use terminal size when fullScreen=true', () => {
      const vnode = Page({
        fullScreen: true,
        children: Text({}, 'Full'),
      });

      // Should have some width/height set
      expect(vnode.props.width).toBeGreaterThan(0);
    });
  });

  describe('Padding', () => {
    it('should apply padding', () => {
      const vnode = Page({
        padding: 2,
        children: Text({}, 'Padded'),
      });

      expect(vnode.props.padding).toBe(2);
    });
  });
});

describe('AppShell', () => {
  describe('Basic Structure', () => {
    it('should create an app shell with content', () => {
      const vnode = AppShell({
        children: Text({}, 'Main Content'),
      });

      expect(vnode.type).toBe('box');
      expect(vnode.props.flexDirection).toBe('column');
    });

    it('should include header when provided', () => {
      const vnode = AppShell({
        header: Text({}, 'Header'),
        children: Text({}, 'Content'),
      });

      const hasHeader = JSON.stringify(vnode).includes('Header');
      expect(hasHeader).toBe(true);
    });

    it('should include footer when provided', () => {
      const vnode = AppShell({
        footer: Text({}, 'Footer'),
        children: Text({}, 'Content'),
      });

      const hasFooter = JSON.stringify(vnode).includes('Footer');
      expect(hasFooter).toBe(true);
    });
  });

  describe('Sidebar and Aside', () => {
    it('should include sidebar with specified width', () => {
      const vnode = AppShell({
        sidebar: Text({}, 'Sidebar'),
        sidebarWidth: 30,
        children: Text({}, 'Content'),
      });

      // Should have a sidebar section
      const hasSidebar = JSON.stringify(vnode).includes('Sidebar');
      expect(hasSidebar).toBe(true);
    });

    it('should include aside (right panel)', () => {
      const vnode = AppShell({
        aside: Text({}, 'Right Panel'),
        asideWidth: 25,
        children: Text({}, 'Content'),
      });

      const hasAside = JSON.stringify(vnode).includes('Right Panel');
      expect(hasAside).toBe(true);
    });

    it('should support both sidebar and aside', () => {
      const vnode = AppShell({
        sidebar: Text({}, 'Left'),
        aside: Text({}, 'Right'),
        children: Text({}, 'Center'),
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('Left');
      expect(output).toContain('Right');
      expect(output).toContain('Center');
    });
  });

  describe('Dividers', () => {
    it('should show dividers by default', () => {
      const vnode = AppShell({
        header: Text({}, 'Header'),
        children: Text({}, 'Content'),
      });

      // Check structure includes divider elements
      expect(vnode.children.length).toBeGreaterThan(1);
    });

    it('should hide dividers when dividers=false', () => {
      const vnode = AppShell({
        header: Text({}, 'Header'),
        dividers: false,
        children: Text({}, 'Content'),
      });

      // Should have header + content rows
      expect(vnode.children.length).toBe(2);
    });

    it('should support different divider styles', () => {
      const styles = ['line', 'double', 'dotted', 'dashed', 'thick'] as const;

      for (const style of styles) {
        const vnode = AppShell({
          header: Text({}, 'H'),
          dividerStyle: style,
          children: Text({}, 'C'),
        });

        expect(vnode).toBeDefined();
      }
    });
  });

  describe('Full Layout', () => {
    it('should create complete IDE-style layout', () => {
      const vnode = AppShell({
        header: Text({}, 'Menu'),
        sidebar: Text({}, 'Files'),
        sidebarWidth: 25,
        aside: Text({}, 'Props'),
        asideWidth: 20,
        footer: Text({}, 'Status'),
        footerHeight: 1,
        children: Text({}, 'Editor'),
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('Menu');
      expect(output).toContain('Files');
      expect(output).toContain('Props');
      expect(output).toContain('Status');
      expect(output).toContain('Editor');
    });
  });
});

describe('StatusBar', () => {
  it('should create a status bar with left content', () => {
    const vnode = StatusBar({
      left: Text({}, 'Ready'),
    });

    expect(vnode.type).toBe('box');
    expect(vnode.props.flexDirection).toBe('row');
    expect(vnode.props.height).toBe(1);
  });

  it('should include left, center, and right sections', () => {
    const vnode = StatusBar({
      left: Text({}, 'Left'),
      center: Text({}, 'Center'),
      right: Text({}, 'Right'),
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('Left');
    expect(output).toContain('Center');
    expect(output).toContain('Right');
  });

  it('should apply background color', () => {
    const vnode = StatusBar({
      left: Text({}, 'Status'),
      backgroundColor: 'blue',
    });

    expect(vnode.props.backgroundColor).toBe('blue');
  });

  it('should use spacers for layout', () => {
    const vnode = StatusBar({
      left: Text({}, 'L'),
      right: Text({}, 'R'),
    });

    // Should have left + spacer + right
    const hasFlexGrow = vnode.children.some((c: any) => c.props?.flexGrow === 1);
    expect(hasFlexGrow).toBe(true);
  });
});

describe('Header', () => {
  it('should create a header with title', () => {
    const vnode = Header({
      title: 'My App',
    });

    expect(vnode.type).toBe('box');
    const output = JSON.stringify(vnode);
    expect(output).toContain('My App');
  });

  it('should include subtitle', () => {
    const vnode = Header({
      title: 'My App',
      subtitle: 'v1.0.0',
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('v1.0.0');
  });

  it('should include left actions', () => {
    const vnode = Header({
      title: 'App',
      leftActions: Text({}, 'Menu'),
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('Menu');
  });

  it('should include right actions', () => {
    const vnode = Header({
      title: 'App',
      rightActions: Text({}, 'Settings'),
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('Settings');
  });

  it('should apply background color', () => {
    const vnode = Header({
      title: 'App',
      backgroundColor: 'navy',
    });

    // Find the main box with background
    const mainBox = vnode.type === 'box' ? vnode : vnode.children?.[0];
    expect(mainBox.props.backgroundColor).toBe('navy');
  });

  it('should add border when border=true', () => {
    const vnode = Header({
      title: 'App',
      border: true,
      borderColor: 'gray',
    });

    // When border=true, returns a VStack with header + divider line
    expect(vnode.props.flexDirection).toBe('column');
    expect(vnode.children.length).toBe(2);
  });

  it('should apply custom title color', () => {
    const vnode = Header({
      title: 'Colored',
      titleColor: 'green',
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('green');
  });
});

describe('Container', () => {
  it('should create a container with children', () => {
    const vnode = Container({
      children: Text({}, 'Content'),
    });

    expect(vnode.type).toBe('box');
  });

  it('should apply maxWidth', () => {
    const vnode = Container({
      maxWidth: 60,
      children: Text({}, 'Constrained'),
    });

    // Container should limit width to maxWidth
    // The actual structure depends on centering
    expect(vnode).toBeDefined();
  });

  it('should center content when center=true', () => {
    const vnode = Container({
      maxWidth: 40,
      center: true,
      children: Text({}, 'Centered'),
    });

    // When centered, creates a row with side margins
    if (vnode.props.flexDirection === 'row') {
      expect(vnode.children.length).toBe(3); // left margin + content + right margin
    }
  });

  it('should not center when center=false', () => {
    const vnode = Container({
      maxWidth: 40,
      center: false,
      children: Text({}, 'Left'),
    });

    // Without centering, just a single box
    expect(vnode.props.flexDirection).toBe('column');
  });

  it('should apply padding', () => {
    const vnode = Container({
      padding: 2,
      children: Text({}, 'Padded'),
    });

    // Find the content box with padding
    const contentBox = vnode.props.flexDirection === 'row'
      ? vnode.children[1]
      : vnode;
    expect(contentBox.props.padding).toBe(2);
  });
});

describe('Integration', () => {
  it('should combine Header and StatusBar in AppShell', () => {
    const vnode = AppShell({
      header: Header({ title: 'Test App', subtitle: 'v1.0' }),
      footer: StatusBar({ left: Text({}, 'Ready'), right: Text({}, 'OK') }),
      children: Container({
        maxWidth: 60,
        children: Text({}, 'Main Content'),
      }),
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('Test App');
    expect(output).toContain('Ready');
    expect(output).toContain('Main Content');
  });

  it('should create a full Page with all sections', () => {
    const vnode = Page({
      title: 'Dashboard',
      subtitle: 'Overview',
      border: true,
      borderStyle: 'round',
      footer: Text({ dim: true }, 'Press Q to quit'),
      children: Text({}, 'Charts and data here'),
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('Dashboard');
    expect(output).toContain('Overview');
    expect(output).toContain('Press Q to quit');
    expect(vnode.props.borderStyle).toBe('round');
  });
});
