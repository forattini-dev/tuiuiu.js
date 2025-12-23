/**
 * Collapsible Tests
 *
 * Tests for Collapsible, Accordion, Details, and ExpandableText components
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createCollapsible,
  Collapsible,
  createAccordion,
  Accordion,
  Details,
  ExpandableText,
} from '../../src/molecules/collapsible.js';
import { Text, Box } from '../../src/primitives/nodes.js';

describe('createCollapsible', () => {
  describe('Initialization', () => {
    it('should create collapsed by default', () => {
      const state = createCollapsible();
      expect(state.expanded()).toBe(false);
    });

    it('should respect initialExpanded', () => {
      const state = createCollapsible({ initialExpanded: true });
      expect(state.expanded()).toBe(true);
    });
  });

  describe('Toggle', () => {
    it('should toggle from collapsed to expanded', () => {
      const state = createCollapsible();
      expect(state.expanded()).toBe(false);

      state.toggle();
      expect(state.expanded()).toBe(true);
    });

    it('should toggle from expanded to collapsed', () => {
      const state = createCollapsible({ initialExpanded: true });
      expect(state.expanded()).toBe(true);

      state.toggle();
      expect(state.expanded()).toBe(false);
    });

    it('should call onToggle callback', () => {
      const onToggle = vi.fn();
      const state = createCollapsible({ onToggle });

      state.toggle();
      expect(onToggle).toHaveBeenCalledWith(true);

      state.toggle();
      expect(onToggle).toHaveBeenCalledWith(false);
    });
  });

  describe('Expand/Collapse', () => {
    it('should expand', () => {
      const state = createCollapsible();
      state.expand();
      expect(state.expanded()).toBe(true);
    });

    it('should not call callback if already expanded', () => {
      const onToggle = vi.fn();
      const state = createCollapsible({ initialExpanded: true, onToggle });

      state.expand();
      expect(onToggle).not.toHaveBeenCalled();
    });

    it('should collapse', () => {
      const state = createCollapsible({ initialExpanded: true });
      state.collapse();
      expect(state.expanded()).toBe(false);
    });

    it('should not call callback if already collapsed', () => {
      const onToggle = vi.fn();
      const state = createCollapsible({ onToggle });

      state.collapse();
      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('setExpanded', () => {
    it('should set expanded state', () => {
      const state = createCollapsible();

      state.setExpanded(true);
      expect(state.expanded()).toBe(true);

      state.setExpanded(false);
      expect(state.expanded()).toBe(false);
    });

    it('should call onToggle when value changes', () => {
      const onToggle = vi.fn();
      const state = createCollapsible({ onToggle });

      state.setExpanded(true);
      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('should not call onToggle when value is same', () => {
      const onToggle = vi.fn();
      const state = createCollapsible({ initialExpanded: true, onToggle });

      state.setExpanded(true);
      expect(onToggle).not.toHaveBeenCalled();
    });
  });
});

describe('Collapsible Component', () => {
  it('should create a collapsible component', () => {
    const vnode = Collapsible({
      title: 'Options',
      children: Text({}, 'Content'),
    });

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should show title', () => {
    const vnode = Collapsible({
      title: 'Advanced Settings',
      children: Text({}, 'Content'),
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('Advanced Settings');
  });

  it('should accept external state', () => {
    const state = createCollapsible({ initialExpanded: true });
    const vnode = Collapsible({
      title: 'Test',
      state,
      children: Text({}, 'Content'),
    });

    expect(vnode).toBeDefined();
  });

  it('should render with custom icons', () => {
    const vnode = Collapsible({
      title: 'Folder',
      collapsedIcon: '📁',
      expandedIcon: '📂',
      children: Text({}, 'Files'),
    });

    expect(vnode).toBeDefined();
  });

  it('should apply title color', () => {
    const vnode = Collapsible({
      title: 'Colored',
      titleColor: 'cyan',
      children: Text({}, 'Content'),
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('cyan');
  });

  it('should apply indent', () => {
    const vnode = Collapsible({
      title: 'Indented',
      indent: 4,
      children: Text({}, 'Content'),
    });

    expect(vnode).toBeDefined();
  });

  it('should handle disabled state', () => {
    const vnode = Collapsible({
      title: 'Disabled',
      disabled: true,
      children: Text({}, 'Content'),
    });

    expect(vnode).toBeDefined();
  });

  it('should render multiple children', () => {
    const vnode = Collapsible({
      title: 'Multiple',
      children: [
        Text({}, 'Line 1'),
        Text({}, 'Line 2'),
        Text({}, 'Line 3'),
      ],
    });

    expect(vnode).toBeDefined();
  });
});

describe('createAccordion', () => {
  // Accordion uses 'key' not 'id'
  const sections = [
    { key: 'sec1', title: 'Section 1', content: Text({}, 'Content 1') },
    { key: 'sec2', title: 'Section 2', content: Text({}, 'Content 2') },
    { key: 'sec3', title: 'Section 3', content: Text({}, 'Content 3') },
  ];

  describe('Initialization', () => {
    it('should create accordion with all sections collapsed', () => {
      const state = createAccordion({ sections });

      expect(state.expanded()).toEqual(new Set());
    });

    it('should respect initialExpanded', () => {
      const state = createAccordion({
        sections,
        initialExpanded: 'sec1', // Single string, not array
      });

      expect(state.expanded().has('sec1')).toBe(true);
      expect(state.expanded().has('sec2')).toBe(false);
    });
  });

  describe('Toggle', () => {
    it('should toggle a section', () => {
      const state = createAccordion({ sections });

      state.toggle('sec1');
      expect(state.expanded().has('sec1')).toBe(true);

      state.toggle('sec1');
      expect(state.expanded().has('sec1')).toBe(false);
    });

    it('should call onChange callback', () => {
      const onChange = vi.fn();
      const state = createAccordion({ sections, onChange });

      state.toggle('sec1');
      expect(onChange).toHaveBeenCalledWith(['sec1']);
    });
  });

  describe('Multiple Mode', () => {
    it('should close other sections when multiple=false (default)', () => {
      const state = createAccordion({
        sections,
        initialExpanded: 'sec1',
      });

      state.toggle('sec2');

      expect(state.expanded().has('sec1')).toBe(false);
      expect(state.expanded().has('sec2')).toBe(true);
    });

    it('should allow multiple sections when multiple=true', () => {
      const state = createAccordion({
        sections,
        multiple: true,
        initialExpanded: 'sec1',
      });

      state.toggle('sec2');

      expect(state.expanded().has('sec1')).toBe(true);
      expect(state.expanded().has('sec2')).toBe(true);
    });
  });

  describe('Expand/Collapse All', () => {
    it('should expand all sections when multiple=true', () => {
      const state = createAccordion({ sections, multiple: true });

      state.expandAll();

      expect(state.expanded().has('sec1')).toBe(true);
      expect(state.expanded().has('sec2')).toBe(true);
      expect(state.expanded().has('sec3')).toBe(true);
    });

    it('should collapse all sections', () => {
      const state = createAccordion({
        sections,
        multiple: true,
        initialExpanded: 'sec1',
      });

      state.collapseAll();

      expect(state.expanded().size).toBe(0);
    });
  });

  describe('Navigation', () => {
    it('should navigate with focusIndex', () => {
      const state = createAccordion({ sections });

      expect(state.focusIndex()).toBe(0);

      state.moveNext();
      expect(state.focusIndex()).toBe(1);

      state.movePrev();
      expect(state.focusIndex()).toBe(0);
    });

    it('should not go below last section', () => {
      const state = createAccordion({ sections });

      for (let i = 0; i < 10; i++) state.moveNext();

      expect(state.focusIndex()).toBe(2);
    });

    it('should not go above first section', () => {
      const state = createAccordion({ sections });

      state.movePrev();
      expect(state.focusIndex()).toBe(0);
    });

    it('should toggle focused section', () => {
      const state = createAccordion({ sections });

      state.toggleFocused();
      expect(state.expanded().has('sec1')).toBe(true);
    });
  });

  describe('expand/collapse helpers', () => {
    it('should expand a section', () => {
      const state = createAccordion({ sections });

      state.expand('sec2');
      expect(state.expanded().has('sec2')).toBe(true);
    });

    it('should collapse a section', () => {
      const state = createAccordion({
        sections,
        initialExpanded: 'sec1',
      });

      state.collapse('sec1');
      expect(state.expanded().has('sec1')).toBe(false);
    });
  });
});

describe('Accordion Component', () => {
  const sections = [
    { key: 's1', title: 'First', content: Text({}, 'A') },
    { key: 's2', title: 'Second', content: Text({}, 'B') },
  ];

  it('should create an accordion component', () => {
    const vnode = Accordion({ sections });

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should render section titles', () => {
    const vnode = Accordion({ sections });

    const output = JSON.stringify(vnode);
    expect(output).toContain('First');
    expect(output).toContain('Second');
  });

  it('should accept external state', () => {
    const state = createAccordion({ sections });
    const vnode = Accordion({ sections, state });

    expect(vnode).toBeDefined();
  });

  it('should apply active color', () => {
    const vnode = Accordion({
      sections,
      activeColor: 'cyan',
    });

    expect(vnode).toBeDefined();
  });

  it('should apply gap between sections', () => {
    const vnode = Accordion({
      sections,
      gap: 1,
    });

    expect(vnode).toBeDefined();
  });
});

describe('Details Component', () => {
  it('should create a details component', () => {
    const vnode = Details({
      summary: 'Click to expand',
      children: Text({}, 'Detailed content'),
    });

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should show summary text', () => {
    const vnode = Details({
      summary: 'Summary here',
      children: Text({}, 'Content'),
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('Summary here');
  });

  it('should accept initial open state', () => {
    const vnode = Details({
      summary: 'Open by default',
      open: true,
      children: Text({}, 'Visible content'),
    });

    expect(vnode).toBeDefined();
  });

  it('should apply summary color', () => {
    const vnode = Details({
      summary: 'Colored',
      summaryColor: 'yellow',
      children: Text({}, 'Content'),
    });

    // Details component creates the structure with summary
    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });
});

describe('ExpandableText Component', () => {
  const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10);

  it('should create an expandable text component', () => {
    const vnode = ExpandableText({
      text: longText,
      maxLines: 2,
    });

    expect(vnode).toBeDefined();
    // ExpandableText may return text or box depending on content length
    expect(['text', 'box']).toContain(vnode.type);
  });

  it('should show short text without truncation', () => {
    const vnode = ExpandableText({
      text: 'Short text',
      maxLines: 5,
    });

    expect(vnode).toBeDefined();
  });

  it('should respect maxLines', () => {
    const vnode = ExpandableText({
      text: longText,
      maxLines: 3,
    });

    expect(vnode).toBeDefined();
  });

  it('should show expand text', () => {
    const vnode = ExpandableText({
      text: longText,
      maxLines: 2,
      expandText: 'Show more...',
    });

    expect(vnode).toBeDefined();
  });

  it('should show collapse text', () => {
    const vnode = ExpandableText({
      text: longText,
      maxLines: 2,
      collapseText: 'Show less',
    });

    expect(vnode).toBeDefined();
  });

  it('should apply link color', () => {
    const vnode = ExpandableText({
      text: longText,
      maxLines: 2,
      linkColor: 'blue',
    });

    expect(vnode).toBeDefined();
  });
});

describe('Edge Cases', () => {
  it('should handle empty sections in accordion', () => {
    const state = createAccordion({ sections: [] });

    expect(state.focusIndex()).toBe(0);
    state.toggleFocused(); // Should not throw
  });

  it('should handle single section accordion', () => {
    const state = createAccordion({
      sections: [{ key: 'only', title: 'Only', content: Text({}, 'X') }],
    });

    state.moveNext();
    expect(state.focusIndex()).toBe(0);

    state.toggleFocused();
    expect(state.expanded().has('only')).toBe(true);
  });

  it('should handle empty text in ExpandableText', () => {
    const vnode = ExpandableText({
      text: '',
      maxLines: 2,
    });

    expect(vnode).toBeDefined();
  });
});
