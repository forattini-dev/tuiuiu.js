/**
 * Tree Tests
 *
 * Tests for hierarchical Tree component with navigation and selection
 */

import { describe, it, expect, vi } from 'vitest';
import { createTree, Tree, type TreeNode } from '../../src/molecules/tree.js';

// Sample tree data
const sampleTree: TreeNode[] = [
  {
    id: 'root1',
    label: 'Documents',
    children: [
      { id: 'doc1', label: 'Resume.pdf' },
      { id: 'doc2', label: 'Cover Letter.docx' },
      {
        id: 'work',
        label: 'Work',
        children: [
          { id: 'project1', label: 'Project A' },
          { id: 'project2', label: 'Project B' },
        ],
      },
    ],
  },
  {
    id: 'root2',
    label: 'Pictures',
    children: [
      { id: 'pic1', label: 'vacation.jpg' },
      { id: 'pic2', label: 'family.png' },
    ],
  },
  {
    id: 'root3',
    label: 'Empty Folder',
    children: [],
  },
];

describe('createTree', () => {
  describe('Initialization', () => {
    it('should create a tree with initial state', () => {
      const tree = createTree({ nodes: sampleTree });

      expect(tree.cursorIndex()).toBe(0);
      expect(tree.expanded().size).toBe(0);
      expect(tree.selected().size).toBe(0);
    });

    it('should respect initialExpanded', () => {
      const tree = createTree({
        nodes: sampleTree,
        initialExpanded: ['root1', 'work'],
      });

      expect(tree.expanded().has('root1')).toBe(true);
      expect(tree.expanded().has('work')).toBe(true);
      expect(tree.expanded().has('root2')).toBe(false);
    });

    it('should respect initialSelected', () => {
      const tree = createTree({
        nodes: sampleTree,
        initialSelected: ['doc1', 'doc2'],
      });

      expect(tree.selected().has('doc1')).toBe(true);
      expect(tree.selected().has('doc2')).toBe(true);
    });
  });

  describe('Flattening', () => {
    it('should flatten tree correctly when collapsed', () => {
      const tree = createTree({ nodes: sampleTree });
      const flat = tree.flatNodes();

      // Only root nodes visible when all collapsed
      expect(flat.length).toBe(3);
      expect(flat[0].node.label).toBe('Documents');
      expect(flat[1].node.label).toBe('Pictures');
      expect(flat[2].node.label).toBe('Empty Folder');
    });

    it('should flatten tree correctly when expanded', () => {
      const tree = createTree({
        nodes: sampleTree,
        initialExpanded: ['root1'],
      });
      const flat = tree.flatNodes();

      // root1 + its 3 children + root2 + root3
      expect(flat.length).toBe(6);
      expect(flat[0].node.label).toBe('Documents');
      expect(flat[1].node.label).toBe('Resume.pdf');
      expect(flat[2].node.label).toBe('Cover Letter.docx');
      expect(flat[3].node.label).toBe('Work');
    });

    it('should handle nested expansion', () => {
      const tree = createTree({
        nodes: sampleTree,
        initialExpanded: ['root1', 'work'],
      });
      const flat = tree.flatNodes();

      // Documents, Resume, Cover Letter, Work, Project A, Project B, Pictures, Empty
      expect(flat.length).toBe(8);
      expect(flat[4].node.label).toBe('Project A');
      expect(flat[5].node.label).toBe('Project B');
    });
  });

  describe('Navigation', () => {
    it('should move cursor down', () => {
      const tree = createTree({ nodes: sampleTree });

      expect(tree.cursorIndex()).toBe(0);
      tree.moveDown();
      expect(tree.cursorIndex()).toBe(1);
      tree.moveDown();
      expect(tree.cursorIndex()).toBe(2);
    });

    it('should move cursor up', () => {
      const tree = createTree({ nodes: sampleTree });

      tree.moveDown();
      tree.moveDown();
      expect(tree.cursorIndex()).toBe(2);

      tree.moveUp();
      expect(tree.cursorIndex()).toBe(1);
    });

    it('should not move above first item', () => {
      const tree = createTree({ nodes: sampleTree });

      tree.moveUp();
      tree.moveUp();
      expect(tree.cursorIndex()).toBe(0);
    });

    it('should not move below last item', () => {
      const tree = createTree({ nodes: sampleTree });

      for (let i = 0; i < 10; i++) tree.moveDown();
      expect(tree.cursorIndex()).toBe(2); // Only 3 items visible
    });

    it('should move to specific node by id', () => {
      const tree = createTree({
        nodes: sampleTree,
        initialExpanded: ['root1'],
      });

      tree.moveTo('doc2');
      expect(tree.cursorIndex()).toBe(2); // Cover Letter.docx
    });

    it('should get current node', () => {
      const tree = createTree({
        nodes: sampleTree,
        initialExpanded: ['root1'],
      });

      tree.moveDown();
      const current = tree.getCurrentNode();
      expect(current?.label).toBe('Resume.pdf');
    });
  });

  describe('Expansion', () => {
    it('should expand a node', () => {
      const tree = createTree({ nodes: sampleTree });

      expect(tree.expanded().has('root1')).toBe(false);
      tree.expand('root1');
      expect(tree.expanded().has('root1')).toBe(true);
    });

    it('should collapse a node', () => {
      const tree = createTree({
        nodes: sampleTree,
        initialExpanded: ['root1'],
      });

      expect(tree.expanded().has('root1')).toBe(true);
      tree.collapse('root1');
      expect(tree.expanded().has('root1')).toBe(false);
    });

    it('should toggle expansion', () => {
      const tree = createTree({ nodes: sampleTree });

      tree.toggle('root1');
      expect(tree.expanded().has('root1')).toBe(true);

      tree.toggle('root1');
      expect(tree.expanded().has('root1')).toBe(false);
    });

    it('should toggle current node', () => {
      const tree = createTree({ nodes: sampleTree });

      // First node is Documents which has children
      tree.toggleCurrent();
      expect(tree.expanded().has('root1')).toBe(true);
    });

    it('should expand all nodes', () => {
      const tree = createTree({ nodes: sampleTree });

      tree.expandAll();

      expect(tree.expanded().has('root1')).toBe(true);
      expect(tree.expanded().has('root2')).toBe(true);
      expect(tree.expanded().has('work')).toBe(true);
    });

    it('should collapse all nodes', () => {
      const tree = createTree({
        nodes: sampleTree,
        initialExpanded: ['root1', 'root2', 'work'],
      });

      tree.collapseAll();

      expect(tree.expanded().size).toBe(0);
    });

    it('should call onExpand callback', () => {
      const onExpand = vi.fn();
      const tree = createTree({
        nodes: sampleTree,
        onExpand,
      });

      tree.expand('root1');
      expect(onExpand).toHaveBeenCalledWith(expect.objectContaining({ id: 'root1' }));
    });

    it('should call onCollapse callback', () => {
      const onCollapse = vi.fn();
      const tree = createTree({
        nodes: sampleTree,
        initialExpanded: ['root1'],
        onCollapse,
      });

      tree.collapse('root1');
      expect(onCollapse).toHaveBeenCalledWith(expect.objectContaining({ id: 'root1' }));
    });
  });

  describe('Selection', () => {
    it('should select a node', () => {
      const tree = createTree({ nodes: sampleTree });

      tree.select('root1');
      expect(tree.selected().has('root1')).toBe(true);
    });

    it('should deselect a node', () => {
      const tree = createTree({
        nodes: sampleTree,
        initialSelected: ['root1'],
      });

      tree.deselect('root1');
      expect(tree.selected().has('root1')).toBe(false);
    });

    it('should toggle selection', () => {
      const tree = createTree({ nodes: sampleTree });

      tree.toggleSelect('root1');
      expect(tree.selected().has('root1')).toBe(true);

      tree.toggleSelect('root1');
      expect(tree.selected().has('root1')).toBe(false);
    });

    it('should toggle select current node', () => {
      const tree = createTree({ nodes: sampleTree });

      tree.toggleSelectCurrent();
      expect(tree.selected().has('root1')).toBe(true);
    });

    it('should call onSelect callback', () => {
      const onSelect = vi.fn();
      const tree = createTree({
        nodes: sampleTree,
        onSelect,
      });

      tree.select('root1');
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'root1' }));
    });

    it('should handle single selection mode', () => {
      const tree = createTree({
        nodes: sampleTree,
        selectionMode: 'single',
      });

      tree.select('root1');
      tree.select('root2');

      // In single mode, only the last selected should be selected
      expect(tree.selected().has('root2')).toBe(true);
      expect(tree.selected().size).toBe(1);
    });

    it('should handle multiple selection mode', () => {
      const tree = createTree({
        nodes: sampleTree,
        selectionMode: 'multiple',
      });

      tree.select('root1');
      tree.select('root2');

      expect(tree.selected().has('root1')).toBe(true);
      expect(tree.selected().has('root2')).toBe(true);
      expect(tree.selected().size).toBe(2);
    });
  });

  describe('Max Depth', () => {
    it('should respect maxDepth when flattening', () => {
      const tree = createTree({
        nodes: sampleTree,
        initialExpanded: ['root1', 'work'],
        maxDepth: 1,
      });

      const flat = tree.flatNodes();

      // Should show root1, doc1, doc2, work (but not work's children), root2, root3
      const hasDeepChild = flat.some((f) => f.node.id === 'project1');
      expect(hasDeepChild).toBe(false);
    });
  });

  describe('Node Properties', () => {
    it('should track node depth', () => {
      const tree = createTree({
        nodes: sampleTree,
        initialExpanded: ['root1', 'work'],
      });
      const flat = tree.flatNodes();

      expect(flat[0].depth).toBe(0); // Documents
      expect(flat[1].depth).toBe(1); // Resume.pdf
      expect(flat[4].depth).toBe(2); // Project A
    });

    it('should track isLast correctly', () => {
      const tree = createTree({
        nodes: sampleTree,
        initialExpanded: ['root1'],
      });
      const flat = tree.flatNodes();

      // Work is the last child of Documents
      const workNode = flat.find((f) => f.node.id === 'work');
      expect(workNode?.isLast).toBe(true);

      // Resume.pdf is not the last
      const resumeNode = flat.find((f) => f.node.id === 'doc1');
      expect(resumeNode?.isLast).toBe(false);
    });

    it('should track hasChildren correctly', () => {
      const tree = createTree({
        nodes: sampleTree,
        initialExpanded: ['root1'],
      });
      const flat = tree.flatNodes();

      // Documents has children
      expect(flat[0].hasChildren).toBe(true);

      // Resume.pdf has no children
      const resumeNode = flat.find((f) => f.node.id === 'doc1');
      expect(resumeNode?.hasChildren).toBe(false);

      // Empty Folder has children array but empty
      const emptyFolder = flat.find((f) => f.node.id === 'root3');
      expect(emptyFolder?.hasChildren).toBe(false);
    });
  });
});

describe('Tree Component', () => {
  it('should create a tree component', () => {
    const vnode = Tree({
      nodes: sampleTree,
    });

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should render with custom colors', () => {
    const vnode = Tree({
      nodes: sampleTree,
      activeColor: 'cyan',
      guideColor: 'gray',
    });

    expect(vnode).toBeDefined();
  });
});

describe('Tree rendering options', () => {
  it('should render tree with guides', () => {
    const vnode = Tree({
      nodes: sampleTree,
      initialExpanded: ['root1'],
      showGuides: true,
    });

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should render tree without guides', () => {
    const vnode = Tree({
      nodes: sampleTree,
      initialExpanded: ['root1'],
      showGuides: false,
    });

    expect(vnode).toBeDefined();
  });

  it('should render tree with custom indent size', () => {
    const vnode = Tree({
      nodes: sampleTree,
      initialExpanded: ['root1'],
      indentSize: 4,
    });

    expect(vnode).toBeDefined();
  });
});

describe('Edge Cases', () => {
  it('should handle empty tree', () => {
    const tree = createTree({ nodes: [] });

    expect(tree.flatNodes().length).toBe(0);
    expect(tree.getCurrentNode()).toBeUndefined();
  });

  it('should handle single node tree', () => {
    const tree = createTree({
      nodes: [{ id: 'only', label: 'Only Node' }],
    });

    expect(tree.flatNodes().length).toBe(1);
    tree.moveDown();
    expect(tree.cursorIndex()).toBe(0); // Can't move past
  });

  it('should handle deeply nested tree', () => {
    const deepTree: TreeNode[] = [
      {
        id: 'l1',
        label: 'Level 1',
        children: [
          {
            id: 'l2',
            label: 'Level 2',
            children: [
              {
                id: 'l3',
                label: 'Level 3',
                children: [
                  {
                    id: 'l4',
                    label: 'Level 4',
                    children: [{ id: 'l5', label: 'Level 5' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const tree = createTree({
      nodes: deepTree,
      initialExpanded: ['l1', 'l2', 'l3', 'l4'],
    });

    expect(tree.flatNodes().length).toBe(5);

    const deepest = tree.flatNodes().find((f) => f.node.id === 'l5');
    expect(deepest?.depth).toBe(4);
  });

  it('should handle nodes with data', () => {
    const tree = createTree({
      nodes: [
        { id: 'n1', label: 'Node', data: { value: 42 } },
      ],
    });

    const node = tree.getCurrentNode();
    expect(node?.data).toEqual({ value: 42 });
  });

  it('should handle disabled nodes', () => {
    const tree = createTree({
      nodes: [
        { id: 'n1', label: 'Disabled', disabled: true },
        { id: 'n2', label: 'Enabled', disabled: false },
      ],
    });

    const flat = tree.flatNodes();
    expect(flat[0].node.disabled).toBe(true);
    expect(flat[1].node.disabled).toBe(false);
  });
});
