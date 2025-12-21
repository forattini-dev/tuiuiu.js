/**
 * Storybook Navigator
 *
 * Manages navigation state for the storybook:
 * - Category/story selection
 * - View modes (preview, playground, comparatives, docs)
 * - Search and filtering
 * - Focus management between panels
 */

import { createSignal, batch } from '../../core/signal.js';
import type { Story, StoryCategory } from '../types.js';

export type ViewMode = 'preview' | 'playground' | 'comparatives' | 'docs';
export type FocusArea = 'sidebar' | 'preview' | 'controls';

export interface NavigatorState {
  // Navigation
  categories: StoryCategory[];
  currentCategoryIndex: number;
  currentStoryIndex: number;
  expandedCategories: Set<string>;

  // View mode
  viewMode: ViewMode;

  // Focus
  focusArea: FocusArea;

  // Search
  searchQuery: string;
  searchResults: Story[];

  // History
  history: Array<{ categoryIndex: number; storyIndex: number }>;
  historyIndex: number;
}

export interface Navigator {
  // State accessors
  state: () => NavigatorState;
  currentCategory: () => StoryCategory | null;
  currentStory: () => Story | null;
  filteredCategories: () => StoryCategory[];

  // Navigation
  selectCategory: (index: number) => void;
  selectStory: (categoryIndex: number, storyIndex: number) => void;
  nextStory: () => void;
  prevStory: () => void;
  nextCategory: () => void;
  prevCategory: () => void;
  toggleCategory: (categoryName: string) => void;

  // View modes
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;

  // Focus
  setFocusArea: (area: FocusArea) => void;
  cycleFocus: () => void;

  // Search
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;

  // History
  goBack: () => void;
  goForward: () => void;

  // Utilities
  findStoryByName: (name: string) => { categoryIndex: number; storyIndex: number } | null;
  getStoryPath: () => string;
}

export interface NavigatorOptions {
  categories: StoryCategory[];
  initialCategoryIndex?: number;
  initialStoryIndex?: number;
  initialViewMode?: ViewMode;
}

/**
 * Create a navigator for storybook navigation
 */
export function createNavigator(options: NavigatorOptions): Navigator {
  const {
    categories,
    initialCategoryIndex = 0,
    initialStoryIndex = 0,
    initialViewMode = 'preview',
  } = options;

  // Initialize expanded categories (all expanded by default)
  const initialExpanded = new Set(categories.map((c) => c.name));

  const [state, setState] = createSignal<NavigatorState>({
    categories,
    currentCategoryIndex: initialCategoryIndex,
    currentStoryIndex: initialStoryIndex,
    expandedCategories: initialExpanded,
    viewMode: initialViewMode,
    focusArea: 'sidebar',
    searchQuery: '',
    searchResults: [],
    history: [{ categoryIndex: initialCategoryIndex, storyIndex: initialStoryIndex }],
    historyIndex: 0,
  });

  // Computed: current category
  const currentCategory = (): StoryCategory | null => {
    const s = state();
    return s.categories[s.currentCategoryIndex] ?? null;
  };

  // Computed: current story
  const currentStory = (): Story | null => {
    const category = currentCategory();
    if (!category) return null;
    return category.stories[state().currentStoryIndex] ?? null;
  };

  // Computed: filtered categories based on search
  const filteredCategories = (): StoryCategory[] => {
    const s = state();
    if (!s.searchQuery.trim()) return s.categories;

    const query = s.searchQuery.toLowerCase();
    return s.categories
      .map((category) => ({
        ...category,
        stories: category.stories.filter(
          (story) =>
            story.name.toLowerCase().includes(query) ||
            story.description?.toLowerCase().includes(query) ||
            category.name.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.stories.length > 0);
  };

  // Add to history
  const pushHistory = (categoryIndex: number, storyIndex: number) => {
    setState((s) => {
      const newHistory = s.history.slice(0, s.historyIndex + 1);
      newHistory.push({ categoryIndex, storyIndex });
      return {
        ...s,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  };

  // Navigation methods
  const selectCategory = (index: number) => {
    setState((s) => {
      if (index < 0 || index >= s.categories.length) return s;
      pushHistory(index, 0);
      return {
        ...s,
        currentCategoryIndex: index,
        currentStoryIndex: 0,
      };
    });
  };

  const selectStory = (categoryIndex: number, storyIndex: number) => {
    setState((s) => {
      if (categoryIndex < 0 || categoryIndex >= s.categories.length) return s;
      const category = s.categories[categoryIndex];
      if (storyIndex < 0 || storyIndex >= category.stories.length) return s;

      pushHistory(categoryIndex, storyIndex);
      return {
        ...s,
        currentCategoryIndex: categoryIndex,
        currentStoryIndex: storyIndex,
      };
    });
  };

  const nextStory = () => {
    setState((s) => {
      const category = s.categories[s.currentCategoryIndex];
      if (!category) return s;

      let newStoryIndex = s.currentStoryIndex + 1;
      let newCategoryIndex = s.currentCategoryIndex;

      if (newStoryIndex >= category.stories.length) {
        // Move to next category
        newCategoryIndex = (s.currentCategoryIndex + 1) % s.categories.length;
        newStoryIndex = 0;
      }

      pushHistory(newCategoryIndex, newStoryIndex);
      return {
        ...s,
        currentCategoryIndex: newCategoryIndex,
        currentStoryIndex: newStoryIndex,
      };
    });
  };

  const prevStory = () => {
    setState((s) => {
      let newStoryIndex = s.currentStoryIndex - 1;
      let newCategoryIndex = s.currentCategoryIndex;

      if (newStoryIndex < 0) {
        // Move to previous category
        newCategoryIndex =
          (s.currentCategoryIndex - 1 + s.categories.length) % s.categories.length;
        const prevCategory = s.categories[newCategoryIndex];
        newStoryIndex = prevCategory ? prevCategory.stories.length - 1 : 0;
      }

      pushHistory(newCategoryIndex, newStoryIndex);
      return {
        ...s,
        currentCategoryIndex: newCategoryIndex,
        currentStoryIndex: newStoryIndex,
      };
    });
  };

  const nextCategory = () => {
    setState((s) => {
      const newIndex = (s.currentCategoryIndex + 1) % s.categories.length;
      pushHistory(newIndex, 0);
      return {
        ...s,
        currentCategoryIndex: newIndex,
        currentStoryIndex: 0,
      };
    });
  };

  const prevCategory = () => {
    setState((s) => {
      const newIndex = (s.currentCategoryIndex - 1 + s.categories.length) % s.categories.length;
      pushHistory(newIndex, 0);
      return {
        ...s,
        currentCategoryIndex: newIndex,
        currentStoryIndex: 0,
      };
    });
  };

  const toggleCategory = (categoryName: string) => {
    setState((s) => {
      const newExpanded = new Set(s.expandedCategories);
      if (newExpanded.has(categoryName)) {
        newExpanded.delete(categoryName);
      } else {
        newExpanded.add(categoryName);
      }
      return { ...s, expandedCategories: newExpanded };
    });
  };

  // View mode methods
  const setViewMode = (mode: ViewMode) => {
    setState((s) => ({ ...s, viewMode: mode }));
  };

  const toggleViewMode = () => {
    const modes: ViewMode[] = ['preview', 'playground', 'comparatives', 'docs'];
    setState((s) => {
      const currentIndex = modes.indexOf(s.viewMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      return { ...s, viewMode: modes[nextIndex] };
    });
  };

  // Focus methods
  const setFocusArea = (area: FocusArea) => {
    setState((s) => ({ ...s, focusArea: area }));
  };

  const cycleFocus = () => {
    const areas: FocusArea[] = ['sidebar', 'preview', 'controls'];
    setState((s) => {
      const currentIndex = areas.indexOf(s.focusArea);
      const nextIndex = (currentIndex + 1) % areas.length;
      return { ...s, focusArea: areas[nextIndex] };
    });
  };

  // Search methods
  const setSearchQuery = (query: string) => {
    setState((s) => {
      const searchQuery = query;
      const filtered = filteredCategories();
      const searchResults = filtered.flatMap((c) => c.stories);
      return { ...s, searchQuery, searchResults };
    });
  };

  const clearSearch = () => {
    setState((s) => ({ ...s, searchQuery: '', searchResults: [] }));
  };

  // History methods
  const goBack = () => {
    setState((s) => {
      if (s.historyIndex <= 0) return s;
      const newIndex = s.historyIndex - 1;
      const entry = s.history[newIndex];
      return {
        ...s,
        historyIndex: newIndex,
        currentCategoryIndex: entry.categoryIndex,
        currentStoryIndex: entry.storyIndex,
      };
    });
  };

  const goForward = () => {
    setState((s) => {
      if (s.historyIndex >= s.history.length - 1) return s;
      const newIndex = s.historyIndex + 1;
      const entry = s.history[newIndex];
      return {
        ...s,
        historyIndex: newIndex,
        currentCategoryIndex: entry.categoryIndex,
        currentStoryIndex: entry.storyIndex,
      };
    });
  };

  // Utility methods
  const findStoryByName = (
    name: string
  ): { categoryIndex: number; storyIndex: number } | null => {
    const s = state();
    for (let ci = 0; ci < s.categories.length; ci++) {
      const category = s.categories[ci];
      for (let si = 0; si < category.stories.length; si++) {
        if (category.stories[si].name.toLowerCase() === name.toLowerCase()) {
          return { categoryIndex: ci, storyIndex: si };
        }
      }
    }
    return null;
  };

  const getStoryPath = (): string => {
    const category = currentCategory();
    const story = currentStory();
    if (!category || !story) return '';
    return `${category.name}/${story.name}`;
  };

  return {
    state,
    currentCategory,
    currentStory,
    filteredCategories,
    selectCategory,
    selectStory,
    nextStory,
    prevStory,
    nextCategory,
    prevCategory,
    toggleCategory,
    setViewMode,
    toggleViewMode,
    setFocusArea,
    cycleFocus,
    setSearchQuery,
    clearSearch,
    goBack,
    goForward,
    findStoryByName,
    getStoryPath,
  };
}
