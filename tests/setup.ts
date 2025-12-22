import { setRenderMode } from '../src/core/capabilities';

// Force unicode mode for all tests to ensure consistent snapshots/expectations
setRenderMode('unicode');

// Increase max listeners to avoid false warnings during test runs
// Vitest, its plugins, and our modules all register process listeners
// This is not a memory leak - just multiple legitimate listeners
process.setMaxListeners(50);
