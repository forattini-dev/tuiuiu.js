import { afterAll, afterEach } from 'vitest';
import { setRenderMode } from '../src/core/capabilities';
import { removeExitHandlers } from '../src/utils/cursor';
import { removeMouseExitHandlers } from '../src/hooks/use-mouse';
import { resetHookState } from '../src/hooks/context';

// Force unicode mode for all tests to ensure consistent snapshots/expectations
setRenderMode('unicode');

// Increase max listeners to avoid warnings during test runs
// Vitest, its plugins, and our modules all register process listeners
process.setMaxListeners(100);

// Test-only component adapters keep owners alive for interaction assertions.
afterEach(() => resetHookState());

// Clean up process listeners after all tests complete
afterAll(() => {
  removeExitHandlers();
  removeMouseExitHandlers();
});
