/**
 * SearchBar Component
 *
 * Quick search for components. Hidden by default, toggled with F2.
 * Shows results with full path: "Category > Component"
 */

import { Box, Text } from '../../primitives/nodes.js';
import { getTheme } from '../../core/theme.js';
import type { VNode } from '../../utils/types.js';
import type { Story } from '../types.js';

// =============================================================================
// Types
// =============================================================================

export interface SearchResult {
  story: Story;
  path: string;
  matchScore: number;
}

export interface SearchBarProps {
  query: string;
  results: SearchResult[];
  selectedIndex: number;
  isVisible: boolean;
  onQueryChange?: (query: string) => void;
}

// =============================================================================
// Search Algorithm
// =============================================================================

/**
 * Calculate match score for sorting results
 * Higher score = better match
 */
function calculateMatchScore(story: Story, query: string): number {
  const nameLower = story.name.toLowerCase();
  const catLower = story.category.toLowerCase();

  let score = 0;

  // Exact name match = highest score
  if (nameLower === query) score += 100;
  // Name starts with query
  else if (nameLower.startsWith(query)) score += 50;
  // Name contains query
  else if (nameLower.includes(query)) score += 25;

  // Category match bonus
  if (catLower.includes(query)) score += 10;

  return score;
}

/**
 * Search stories by query
 */
export function searchStories(stories: Story[], query: string): SearchResult[] {
  if (!query.trim()) return [];

  const normalized = query.toLowerCase().trim();

  return stories
    .filter(s =>
      s.name.toLowerCase().includes(normalized) ||
      s.category.toLowerCase().includes(normalized)
    )
    .map(s => ({
      story: s,
      path: `${s.category} > ${s.name}`,
      matchScore: calculateMatchScore(s, normalized),
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 8); // Limit to 8 results
}

// =============================================================================
// Component
// =============================================================================

/**
 * SearchBar component with results dropdown
 */
export function SearchBar({
  query,
  results,
  selectedIndex,
  isVisible,
}: SearchBarProps): VNode | null {
  if (!isVisible) return null;

  const theme = getTheme();
  const termWidth = process.stdout.columns || 80;

  // Input field visual
  const inputWidth = Math.min(40, termWidth - 20);
  const cursorChar = '▎';
  const displayQuery = query + cursorChar;
  const inputPadding = Math.max(0, inputWidth - displayQuery.length);

  const children: VNode[] = [
    // Search input row
    Box(
      { flexDirection: 'row', paddingX: 1 },
      Text({ color: theme.accents.info }, '🔍 '),
      Text({ color: theme.foreground.muted }, 'Search: '),
      Box(
        {
          borderStyle: 'single',
          borderColor: theme.palette.primary[500],
          paddingX: 1,
        },
        Text({ color: theme.foreground.primary }, query),
        Text({ color: theme.palette.primary[500], bold: true }, cursorChar),
        Text({}, ' '.repeat(inputPadding)),
      ),
      Text({ color: theme.foreground.muted, dim: true }, '  (Esc to close)'),
    ),
  ];

  // Results
  if (results.length > 0) {
    children.push(
      Box(
        { flexDirection: 'column', paddingX: 3, marginTop: 1 },
        ...results.map((result, idx) => {
          const isSelected = idx === selectedIndex;
          const [category, name] = result.path.split(' > ');

          return Box(
            { flexDirection: 'row' },
            Text({ color: isSelected ? theme.palette.primary[500] : theme.foreground.muted },
              isSelected ? '▸ ' : '  '
            ),
            Text({
              color: isSelected ? theme.foreground.muted : theme.foreground.muted,
              dim: !isSelected,
            }, `${category} > `),
            Text({
              color: isSelected ? theme.palette.primary[500] : theme.foreground.primary,
              bold: isSelected,
              inverse: isSelected,
            }, isSelected ? ` ${name} ` : name),
          );
        }),
      ),
    );
  } else if (query.trim()) {
    children.push(
      Box(
        { paddingX: 3, marginTop: 1 },
        Text({ color: theme.foreground.muted, dim: true }, 'No results found'),
      ),
    );
  }

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'single',
      borderColor: theme.palette.primary[500],
      marginX: 1,
    },
    ...children,
  );
}
