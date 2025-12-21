/**
 * Collapsible - Expandable/collapsible sections
 *
 * Features:
 * - Expandable content sections
 * - Title with toggle indicator
 * - Keyboard toggle (space/enter)
 * - Custom icons
 * - Nested collapsibles
 */

import { Box, Text } from '../../primitives/nodes.js';
import type { VNode, ColorValue } from '../../utils/types.js';
import { createSignal } from '../../primitives/signal.js';
import { useInput } from '../../hooks/index.js';
import { getChars, getRenderMode } from '../../core/capabilities.js';

// =============================================================================
// Types
// =============================================================================

export interface CollapsibleOptions {
  /** Section title (required for Collapsible component) */
  title?: string;
  /** Initial expanded state */
  initialExpanded?: boolean;
  /** Title icon (when collapsed) */
  collapsedIcon?: string;
  /** Title icon (when expanded) */
  expandedIcon?: string;
  /** Title color */
  titleColor?: ColorValue;
  /** Indent content */
  indent?: number;
  /** Is disabled */
  disabled?: boolean;
  /** Callbacks */
  onToggle?: (expanded: boolean) => void;
  /** Is active */
  isActive?: boolean;
}

export interface CollapsibleState {
  expanded: () => boolean;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
  setExpanded: (expanded: boolean) => void;
}

// =============================================================================
// State Factory
// =============================================================================

/**
 * Create a Collapsible state manager
 */
export function createCollapsible(options: CollapsibleOptions = {}): CollapsibleState {
  const { initialExpanded = false, onToggle } = options;

  const [expanded, setExpandedSignal] = createSignal(initialExpanded);

  const toggle = () => {
    setExpandedSignal((v) => {
      const newValue = !v;
      onToggle?.(newValue);
      return newValue;
    });
  };

  const expand = () => {
    if (!expanded()) {
      setExpandedSignal(true);
      onToggle?.(true);
    }
  };

  const collapse = () => {
    if (expanded()) {
      setExpandedSignal(false);
      onToggle?.(false);
    }
  };

  const setExpanded = (value: boolean) => {
    if (expanded() !== value) {
      setExpandedSignal(value);
      onToggle?.(value);
    }
  };

  return { expanded, toggle, expand, collapse, setExpanded };
}

// =============================================================================
// Component
// =============================================================================

export interface CollapsibleProps extends CollapsibleOptions {
  /** Pre-created state */
  state?: CollapsibleState;
  /** Content when expanded */
  children: VNode | VNode[];
}

/**
 * Collapsible - Expandable content section
 *
 * @example
 * Collapsible({
 *   title: 'Advanced Options',
 *   children: Box({}, Text({}, 'Hidden content here'))
 * })
 *
 * @example
 * // With custom icons
 * Collapsible({
 *   title: 'Details',
 *   collapsedIcon: '📁',
 *   expandedIcon: '📂',
 *   children: detailsContent
 * })
 */
export function Collapsible(props: CollapsibleProps): VNode {
  const {
    title,
    collapsedIcon,
    expandedIcon,
    titleColor = 'white',
    indent = 2,
    disabled = false,
    isActive = true,
    children,
    state: externalState,
  } = props;

  const state = externalState || createCollapsible(props);
  const chars = getChars();
  const isAscii = getRenderMode() === 'ascii';

  // Setup keyboard handling
  useInput(
    (input, key) => {
      if (disabled) return;

      if (input === ' ' || key.return) {
        state.toggle();
      } else if (key.leftArrow || input === 'h') {
        state.collapse();
      } else if (key.rightArrow || input === 'l') {
        state.expand();
      }
    },
    { isActive }
  );

  const isExpanded = state.expanded();

  // Determine icon
  let icon: string;
  if (isExpanded) {
    icon = expandedIcon ?? (isAscii ? 'v' : chars.expand.expanded);
  } else {
    icon = collapsedIcon ?? (isAscii ? '>' : chars.expand.collapsed);
  }

  // Header
  const header = Box(
    { flexDirection: 'row', gap: 1 },
    Text({ color: titleColor, dim: disabled }, icon),
    Text({ color: titleColor, bold: true, dim: disabled }, title || 'Untitled')
  );

  // Content (only shown when expanded)
  const content = isExpanded
    ? Box(
        { marginLeft: indent, marginTop: 1 },
        ...(Array.isArray(children) ? children : [children])
      )
    : null;

  return Box(
    { flexDirection: 'column' },
    header,
    content
  );
}

// =============================================================================
// Accordion - Multiple collapsibles with single-open behavior
// =============================================================================

export interface AccordionSection {
  /** Unique key */
  key: string;
  /** Section title */
  title: string;
  /** Section content */
  content: VNode | (() => VNode);
  /** Section icon */
  icon?: string;
  /** Disabled state */
  disabled?: boolean;
}

export interface AccordionOptions {
  /** Accordion sections */
  sections: AccordionSection[];
  /** Initially expanded key */
  initialExpanded?: string;
  /** Allow multiple sections open */
  multiple?: boolean;
  /** Section gap */
  gap?: number;
  /** Title color */
  titleColor?: ColorValue;
  /** Active color */
  activeColor?: ColorValue;
  /** Callbacks */
  onChange?: (expanded: string[]) => void;
  /** Is active */
  isActive?: boolean;
}

export interface AccordionState {
  expanded: () => Set<string>;
  focusIndex: () => number;
  toggle: (key: string) => void;
  expand: (key: string) => void;
  collapse: (key: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  movePrev: () => void;
  moveNext: () => void;
  toggleFocused: () => void;
}

/**
 * Create an Accordion state manager
 */
export function createAccordion(options: AccordionOptions): AccordionState {
  const { sections, initialExpanded, multiple = false, onChange } = options;

  const [expanded, setExpanded] = createSignal<Set<string>>(
    new Set(initialExpanded ? [initialExpanded] : [])
  );
  const [focusIndex, setFocusIndex] = createSignal(0);

  const toggle = (key: string) => {
    setExpanded((exp) => {
      const newExp = new Set(exp);
      if (newExp.has(key)) {
        newExp.delete(key);
      } else {
        if (!multiple) {
          newExp.clear();
        }
        newExp.add(key);
      }
      onChange?.([...newExp]);
      return newExp;
    });
  };

  const expand = (key: string) => {
    setExpanded((exp) => {
      const newExp = multiple ? new Set(exp) : new Set<string>();
      newExp.add(key);
      onChange?.([...newExp]);
      return newExp;
    });
  };

  const collapse = (key: string) => {
    setExpanded((exp) => {
      const newExp = new Set(exp);
      newExp.delete(key);
      onChange?.([...newExp]);
      return newExp;
    });
  };

  const expandAll = () => {
    if (multiple) {
      const allKeys = sections.filter((s) => !s.disabled).map((s) => s.key);
      setExpanded(new Set(allKeys));
      onChange?.(allKeys);
    }
  };

  const collapseAll = () => {
    setExpanded(new Set());
    onChange?.([]);
  };

  const movePrev = () => {
    setFocusIndex((i) => {
      let newIndex = i - 1;
      while (newIndex >= 0 && sections[newIndex]?.disabled) {
        newIndex--;
      }
      return newIndex >= 0 ? newIndex : i;
    });
  };

  const moveNext = () => {
    setFocusIndex((i) => {
      let newIndex = i + 1;
      while (newIndex < sections.length && sections[newIndex]?.disabled) {
        newIndex++;
      }
      return newIndex < sections.length ? newIndex : i;
    });
  };

  const toggleFocused = () => {
    const section = sections[focusIndex()];
    if (section && !section.disabled) {
      toggle(section.key);
    }
  };

  return {
    expanded,
    focusIndex,
    toggle,
    expand,
    collapse,
    expandAll,
    collapseAll,
    movePrev,
    moveNext,
    toggleFocused,
  };
}

export interface AccordionProps extends AccordionOptions {
  /** Pre-created state */
  state?: AccordionState;
}

/**
 * Accordion - Multiple collapsible sections
 *
 * @example
 * Accordion({
 *   sections: [
 *     { key: 'general', title: 'General', content: generalContent },
 *     { key: 'advanced', title: 'Advanced', content: advancedContent },
 *   ],
 * })
 */
export function Accordion(props: AccordionProps): VNode {
  const {
    sections,
    gap = 0,
    titleColor = 'white',
    activeColor = 'cyan',
    isActive = true,
    state: externalState,
  } = props;

  const state = externalState || createAccordion(props);
  const chars = getChars();
  const isAscii = getRenderMode() === 'ascii';

  // Setup keyboard handling
  useInput(
    (input, key) => {
      if (key.upArrow || input === 'k') state.movePrev();
      else if (key.downArrow || input === 'j') state.moveNext();
      else if (input === ' ' || key.return) state.toggleFocused();
      else if (input === 'e') state.expandAll();
      else if (input === 'c') state.collapseAll();
    },
    { isActive }
  );

  const expandedSet = state.expanded();
  const focusIdx = state.focusIndex();

  const sectionNodes = sections.map((section, i) => {
    const isExpanded = expandedSet.has(section.key);
    const isFocused = i === focusIdx;

    const icon = isExpanded
      ? (isAscii ? 'v' : chars.expand.expanded)
      : (isAscii ? '>' : chars.expand.collapsed);

    const headerColor = isFocused
      ? activeColor
      : section.disabled
        ? 'gray'
        : titleColor;

    // Header
    const header = Box(
      { flexDirection: 'row', gap: 1 },
      Text({ color: headerColor }, section.icon ?? icon),
      Text({ color: headerColor, bold: isFocused, dim: section.disabled }, section.title)
    );

    // Content
    const content = isExpanded
      ? Box(
          { marginLeft: 2, marginTop: 1 },
          typeof section.content === 'function' ? section.content() : section.content
        )
      : null;

    return Box(
      { flexDirection: 'column' },
      header,
      content
    );
  });

  return Box(
    { flexDirection: 'column', gap },
    ...sectionNodes
  );
}

// =============================================================================
// Details - Simple expandable details (HTML-like)
// =============================================================================

export interface DetailsProps {
  /** Summary text (always visible) */
  summary: string;
  /** Content when expanded */
  children: VNode | VNode[];
  /** Initial state */
  open?: boolean;
  /** Summary icon */
  icon?: string;
}

/**
 * Details - Simple expandable section (like HTML <details>)
 *
 * @example
 * Details({
 *   summary: 'Click to see more',
 *   children: Text({}, 'Hidden details here')
 * })
 */
export function Details(props: DetailsProps): VNode {
  const { summary, children, open = false, icon } = props;

  return Collapsible({
    title: summary,
    initialExpanded: open,
    collapsedIcon: icon,
    expandedIcon: icon,
    children: Array.isArray(children) ? Box({}, ...children) : children,
  });
}

// =============================================================================
// ExpandableText - Text that expands when clicked
// =============================================================================

export interface ExpandableTextProps {
  /** Full text content */
  text: string;
  /** Max visible lines when collapsed */
  maxLines?: number;
  /** "Show more" label */
  showMoreLabel?: string;
  /** "Show less" label */
  showLessLabel?: string;
  /** Text color */
  color?: ColorValue;
}

/**
 * ExpandableText - Long text with show more/less
 */
export function ExpandableText(props: ExpandableTextProps): VNode {
  const {
    text,
    maxLines = 3,
    showMoreLabel = 'Show more',
    showLessLabel = 'Show less',
    color = 'white',
  } = props;

  const [expanded, setExpanded] = createSignal(false);

  const lines = text.split('\n');
  const needsTruncation = lines.length > maxLines;

  useInput(
    (input, key) => {
      if (input === ' ' || key.return) {
        setExpanded((v) => !v);
      }
    },
    { isActive: needsTruncation }
  );

  if (!needsTruncation) {
    return Text({ color }, text);
  }

  const isExpanded = expanded();
  const displayText = isExpanded
    ? text
    : lines.slice(0, maxLines).join('\n');

  const toggleLabel = isExpanded ? showLessLabel : showMoreLabel;

  return Box(
    { flexDirection: 'column' },
    Text({ color }, displayText),
    Text({ color: 'cyan', dim: !isExpanded }, `[${toggleLabel}]`)
  );
}
