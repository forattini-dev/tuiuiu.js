#!/usr/bin/env node
/**
 * Tuiuiu Storybook CLI
 *
 * Usage:
 *   npx tuiuiu storybook
 *   pnpm storybook
 */

import { runStorybook } from './app.js';

runStorybook().catch((err) => {
  console.error('Storybook error:', err);
  process.exit(1);
});
