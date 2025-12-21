/**
 * Storybook Registry
 *
 * Handles story registration, discovery, and organization:
 * - Register individual stories
 * - Group stories by category
 * - Validate story structure
 * - Generate story metadata
 */

import type { Story, StoryCategory, ControlDefinition } from '../types.js';
import type { VNode } from '../../utils/types.js';

export interface StoryConfig {
  name: string;
  category: string;
  description?: string;
  controls?: Record<string, ControlDefinition>;
  render: (props: Record<string, any>, frame?: number) => VNode;
  /** Tags for filtering/search */
  tags?: string[];
  /** Source code for display */
  source?: string;
  /** Related stories */
  relatedStories?: string[];
  /** Animation settings */
  animation?: {
    enabled: boolean;
    interval?: number;
    pausable?: boolean;
  };
}

export interface RegistryStats {
  totalStories: number;
  totalCategories: number;
  storiesPerCategory: Record<string, number>;
  tags: string[];
}

export interface Registry {
  // Registration
  register: (config: StoryConfig) => void;
  registerMany: (configs: StoryConfig[]) => void;

  // Query
  getStory: (category: string, name: string) => Story | null;
  getCategory: (name: string) => StoryCategory | null;
  getCategories: () => StoryCategory[];
  getAllStories: () => Story[];
  searchStories: (query: string) => Story[];
  getStoriesByTag: (tag: string) => Story[];

  // Metadata
  getStats: () => RegistryStats;
  getTags: () => string[];

  // Utilities
  clear: () => void;
  hasStory: (category: string, name: string) => boolean;
}

/**
 * Create a story registry
 */
export function createRegistry(): Registry {
  const stories: Map<string, Story> = new Map();
  const categories: Map<string, StoryCategory> = new Map();
  const storyTags: Map<string, Set<string>> = new Map(); // story key -> tags
  const tagIndex: Map<string, Set<string>> = new Map(); // tag -> story keys

  // Helper to create story key
  const storyKey = (category: string, name: string): string => `${category}::${name}`;

  // Helper to parse story key
  const parseKey = (key: string): { category: string; name: string } => {
    const [category, name] = key.split('::');
    return { category, name };
  };

  const register = (config: StoryConfig): void => {
    const { name, category, description, controls = {}, render, tags = [], animation } = config;

    // Validate required fields
    if (!name || !category || !render) {
      throw new Error(`Story registration requires name, category, and render function`);
    }

    const story: Story = {
      name,
      category,
      description,
      controls,
      render,
      animation,
    };

    const key = storyKey(category, name);

    // Store story
    stories.set(key, story);

    // Update category
    if (!categories.has(category)) {
      categories.set(category, { name: category, stories: [] });
    }
    const cat = categories.get(category)!;

    // Check if story already exists in category
    const existingIndex = cat.stories.findIndex((s) => s.name === name);
    if (existingIndex >= 0) {
      cat.stories[existingIndex] = story;
    } else {
      cat.stories.push(story);
    }

    // Update tags
    storyTags.set(key, new Set(tags));
    for (const tag of tags) {
      if (!tagIndex.has(tag)) {
        tagIndex.set(tag, new Set());
      }
      tagIndex.get(tag)!.add(key);
    }
  };

  const registerMany = (configs: StoryConfig[]): void => {
    for (const config of configs) {
      register(config);
    }
  };

  const getStory = (category: string, name: string): Story | null => {
    return stories.get(storyKey(category, name)) ?? null;
  };

  const getCategory = (name: string): StoryCategory | null => {
    return categories.get(name) ?? null;
  };

  const getCategories = (): StoryCategory[] => {
    return Array.from(categories.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const getAllStories = (): Story[] => {
    return Array.from(stories.values());
  };

  const searchStories = (query: string): Story[] => {
    if (!query.trim()) return getAllStories();

    const lowerQuery = query.toLowerCase();
    return getAllStories().filter(
      (story) =>
        story.name.toLowerCase().includes(lowerQuery) ||
        story.description?.toLowerCase().includes(lowerQuery) ||
        story.category.toLowerCase().includes(lowerQuery)
    );
  };

  const getStoriesByTag = (tag: string): Story[] => {
    const keys = tagIndex.get(tag);
    if (!keys) return [];
    return Array.from(keys)
      .map((key) => stories.get(key))
      .filter((s): s is Story => s !== undefined);
  };

  const getStats = (): RegistryStats => {
    const storiesPerCategory: Record<string, number> = {};
    for (const [name, cat] of categories) {
      storiesPerCategory[name] = cat.stories.length;
    }

    return {
      totalStories: stories.size,
      totalCategories: categories.size,
      storiesPerCategory,
      tags: getTags(),
    };
  };

  const getTags = (): string[] => {
    return Array.from(tagIndex.keys()).sort();
  };

  const clear = (): void => {
    stories.clear();
    categories.clear();
    storyTags.clear();
    tagIndex.clear();
  };

  const hasStory = (category: string, name: string): boolean => {
    return stories.has(storyKey(category, name));
  };

  return {
    register,
    registerMany,
    getStory,
    getCategory,
    getCategories,
    getAllStories,
    searchStories,
    getStoriesByTag,
    getStats,
    getTags,
    clear,
    hasStory,
  };
}

/**
 * Default control definitions for common prop types
 */
export const defaultControls = {
  boolean: (label: string, defaultValue = false): ControlDefinition => ({
    type: 'boolean',
    label,
    defaultValue,
  }),

  text: (label: string, defaultValue = ''): ControlDefinition => ({
    type: 'text',
    label,
    defaultValue,
  }),

  number: (
    label: string,
    defaultValue = 0,
    options?: { min?: number; max?: number; step?: number }
  ): ControlDefinition => ({
    type: 'number',
    label,
    defaultValue,
    ...options,
  }),

  range: (
    label: string,
    defaultValue = 50,
    min = 0,
    max = 100,
    step = 1
  ): ControlDefinition => ({
    type: 'range',
    label,
    defaultValue,
    min,
    max,
    step,
  }),

  select: (label: string, options: string[], defaultValue?: string): ControlDefinition => ({
    type: 'select',
    label,
    defaultValue: defaultValue ?? options[0],
    options,
  }),

  color: (label: string, defaultValue = 'white'): ControlDefinition => ({
    type: 'color',
    label,
    defaultValue,
  }),
};

/**
 * Story builder for fluent API
 */
export function story(name: string) {
  const config: Partial<StoryConfig> = { name };

  const builder = {
    category(cat: string) {
      config.category = cat;
      return builder;
    },

    description(desc: string) {
      config.description = desc;
      return builder;
    },

    controls(ctrls: Record<string, ControlDefinition>) {
      config.controls = ctrls;
      return builder;
    },

    tags(...t: string[]) {
      config.tags = t;
      return builder;
    },

    source(src: string) {
      config.source = src;
      return builder;
    },

    /**
     * Mark story as animated (will re-render periodically)
     * @param interval - Animation interval in ms (default: 100)
     * @param pausable - Allow pausing with space key (default: true)
     */
    animated(interval = 100, pausable = true) {
      config.animation = {
        enabled: true,
        interval,
        pausable,
      };
      return builder;
    },

    render(fn: (props: Record<string, any>, frame?: number) => VNode) {
      config.render = fn;
      return config as StoryConfig;
    },
  };

  return builder;
}
