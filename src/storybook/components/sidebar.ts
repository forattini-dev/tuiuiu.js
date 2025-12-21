/**
 * Storybook Sidebar Component
 *
 * A tree navigation component for browsing categories and stories:
 * - Expandable/collapsible categories
 * - Story selection with highlighting
 * - Keyboard navigation support
 * - Search filtering
 */

import { Box, Text, Spacer } from '../../primitives/nodes.js';
import type { VNode } from '../../utils/types.js';
import type { Story, StoryCategory } from '../types.js';
import type { Navigator, FocusArea } from '../core/navigator.js';

export interface SidebarProps {
  navigator: Navigator;
  width?: number;
  isFocused?: boolean;
}

/**
 * Render a category header
 */
function CategoryHeader(props: {
  category: StoryCategory;
  isExpanded: boolean;
  isSelected: boolean;
}): VNode {
  const { category, isExpanded, isSelected } = props;
  const icon = isExpanded ? '▼' : '▶';

  return Box(
    { paddingX: 1 },
    Text(
      {
        color: isSelected ? 'cyan' : 'white',
        bold: isSelected,
      },
      `${icon} ${category.name}`
    ),
    Text({ color: 'gray', dim: true }, ` (${category.stories.length})`)
  );
}

/**
 * Render a story item
 */
function StoryItem(props: {
  story: Story;
  isSelected: boolean;
  indent?: number;
}): VNode {
  const { story, isSelected, indent = 2 } = props;
  const prefix = isSelected ? '●' : '○';
  const padding = ' '.repeat(indent);

  return Box(
    { paddingX: 1 },
    Text(
      {
        color: isSelected ? 'cyan' : 'gray',
        bold: isSelected,
      },
      `${padding}${prefix} ${story.name}`
    )
  );
}

/**
 * Render search input display
 */
function SearchBar(props: { query: string; isFocused: boolean }): VNode {
  const { query, isFocused } = props;

  return Box(
    {
      borderStyle: 'single',
      borderColor: isFocused ? 'cyan' : 'gray',
      paddingX: 1,
      marginBottom: 1,
    },
    Text({ color: 'gray' }, '/ '),
    query
      ? Text({ color: 'white' }, query)
      : Text({ color: 'gray', dim: true }, 'Search...')
  );
}

/**
 * Render the sidebar tree
 */
export function Sidebar(props: SidebarProps): VNode {
  const { navigator, width = 30, isFocused = false } = props;
  const state = navigator.state();
  const categories = navigator.filteredCategories();

  const items: VNode[] = [];

  // Search bar
  items.push(SearchBar({ query: state.searchQuery, isFocused }));

  // Categories and stories
  let categoryIndex = 0;
  for (const category of categories) {
    // Find original category index for selection check
    const originalCategoryIndex = state.categories.findIndex(
      (c) => c.name === category.name
    );
    const isCategorySelected =
      state.currentCategoryIndex === originalCategoryIndex;
    const isExpanded = state.expandedCategories.has(category.name);

    // Category header
    items.push(
      Box(
        {},
        CategoryHeader({
          category,
          isExpanded,
          isSelected: isCategorySelected && state.currentStoryIndex === -1,
        })
      )
    );

    // Stories (if expanded) with virtual scroll
    if (isExpanded) {
      const maxVisible = 15;
      const totalStories = category.stories.length;
      const currentStoryIdx = isCategorySelected ? state.currentStoryIndex : 0;

      // Calculate visible window
      let startIdx = 0;
      let endIdx = Math.min(maxVisible, totalStories);

      if (totalStories > maxVisible && currentStoryIdx >= 0) {
        const halfWindow = Math.floor(maxVisible / 2);
        startIdx = Math.max(0, currentStoryIdx - halfWindow);
        endIdx = Math.min(totalStories, startIdx + maxVisible);

        if (endIdx === totalStories) {
          startIdx = Math.max(0, totalStories - maxVisible);
        }
      }

      // Scroll up indicator
      if (startIdx > 0) {
        items.push(
          Box(
            { paddingX: 1 },
            Text({ color: 'gray', dim: true }, `    ▲ ${startIdx} more`)
          )
        );
      }

      // Visible stories
      for (let storyIdx = startIdx; storyIdx < endIdx; storyIdx++) {
        const story = category.stories[storyIdx];
        const isStorySelected =
          isCategorySelected && state.currentStoryIndex === storyIdx;

        items.push(
          Box(
            {},
            StoryItem({
              story,
              isSelected: isStorySelected,
            })
          )
        );
      }

      // Scroll down indicator
      if (endIdx < totalStories) {
        items.push(
          Box(
            { paddingX: 1 },
            Text({ color: 'gray', dim: true }, `    ▼ ${totalStories - endIdx} more`)
          )
        );
      }
    }

    categoryIndex++;
  }

  // Empty state
  if (categories.length === 0) {
    items.push(
      Box(
        { padding: 1 },
        Text({ color: 'gray', dim: true }, 'No stories found')
      )
    );
  }

  return Box(
    {
      flexDirection: 'column',
      width,
      borderStyle: 'single',
      borderColor: isFocused ? 'cyan' : 'gray',
    },
    // Header
    Box(
      {
        borderStyle: 'single',
        borderColor: isFocused ? 'cyan' : 'gray',
        paddingX: 1,
      },
      Text({ color: isFocused ? 'cyan' : 'white', bold: true }, 'Stories')
    ),
    // Content
    Box({ flexDirection: 'column', padding: 1 }, ...items),
    // Footer with stats
    Box(
      {
        borderStyle: 'single',
        borderColor: 'gray',
        paddingX: 1,
      },
      Text(
        { color: 'gray', dim: true },
        `${state.categories.length} categories`
      )
    )
  );
}

/**
 * Render a compact sidebar (just category names)
 */
export function CompactSidebar(props: SidebarProps): VNode {
  const { navigator, width = 20, isFocused = false } = props;
  const state = navigator.state();
  const categories = navigator.filteredCategories();

  return Box(
    {
      flexDirection: 'column',
      width,
      borderStyle: 'single',
      borderColor: isFocused ? 'cyan' : 'gray',
    },
    // Categories
    ...categories.map((category, idx) => {
      const originalIdx = state.categories.findIndex(
        (c) => c.name === category.name
      );
      const isSelected = state.currentCategoryIndex === originalIdx;

      return Box(
        {
          paddingX: 1,
          backgroundColor: isSelected ? 'blue' : undefined,
        },
        Text(
          {
            color: isSelected ? 'white' : 'gray',
            bold: isSelected,
          },
          category.name
        )
      );
    })
  );
}

/**
 * Render keyboard shortcuts help
 */
export function SidebarHelp(): VNode {
  const shortcuts = [
    { key: 'j/k', desc: 'Navigate' },
    { key: 'h/l', desc: 'Collapse/Expand' },
    { key: '/', desc: 'Search' },
    { key: 'Tab', desc: 'Switch panel' },
    { key: 'Enter', desc: 'Select' },
  ];

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'single',
      borderColor: 'gray',
      padding: 1,
    },
    Box(
      { marginBottom: 1 },
      Text({ color: 'white', bold: true }, 'Navigation')
    ),
    ...shortcuts.map(({ key, desc }) =>
      Box(
        {},
        Text({ color: 'cyan' }, `[${key}]`),
        Text({ color: 'gray' }, ` ${desc}`)
      )
    )
  );
}
