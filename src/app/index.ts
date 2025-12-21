/**
 * App Layer - Application lifecycle and rendering
 *
 * This module provides the main entry point for Reck applications.
 */

// Render loop
export {
  render,
  renderOnce,
  type RenderOptions,
  type ReckInstance,
} from './render-loop.js';

// Re-export lifecycle functions from hooks for convenience
export {
  initializeApp,
  cleanupApp,
  useApp,
  type AppContext,
} from '../hooks/index.js';

// Re-export focus management for app-level control
export {
  useFocusManager,
  createFocusManager,
  type FocusManager,
} from '../hooks/index.js';
