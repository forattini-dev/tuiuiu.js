/**
 * Example 02: Async Loading
 *
 * Demonstrates:
 * - useState for managing loading states
 * - useEffect for side effects
 * - Async operations with setTimeout/fetch simulation
 * - Spinner and ProgressBar components
 *
 * Run: pnpm tsx examples/02-async-loading.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useEffect,
  useInput,
  useApp,
  createSpinner,
  renderSpinner,
  createProgressBar,
  renderProgressBar,
  type VNode,
} from '../src/index.js';

interface DataItem {
  id: number;
  name: string;
  status: 'pending' | 'completed';
}

// Create spinner and progress bar OUTSIDE the component so they persist
const spinner = createSpinner({
  style: 'dots',
  text: 'Loading data...',
  color: 'cyan',
});

const progressBar = createProgressBar({
  max: 100,  // Maximum value for progress (was incorrectly 'total')
  style: 'blocks',
  showPercentage: true,
  showEta: true,
  color: 'green',
  width: 40,
});

function AsyncDemo(): VNode {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DataItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { exit } = useApp();

  // Start/stop spinner based on loading state
  useEffect(() => {
    if (loading()) {
      spinner.start();
    } else {
      spinner.stop();
    }
    return () => spinner.stop();
  });

  // Simulate async data fetch
  const fetchData = () => {
    setLoading(true);
    setError(null);
    setData([]);
    progressBar.reset();

    // Simulate progress updates
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += 10;
      progressBar.setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        setLoading(false);

        // Simulate fetched data
        setData([
          { id: 1, name: 'Task Alpha', status: 'completed' },
          { id: 2, name: 'Task Beta', status: 'completed' },
          { id: 3, name: 'Task Gamma', status: 'pending' },
          { id: 4, name: 'Task Delta', status: 'completed' },
        ]);
      }
    }, 200);
  };

  // Simulate failing async operation
  const fetchWithError = () => {
    setLoading(true);
    setError(null);
    setData([]);
    progressBar.reset();

    setTimeout(() => {
      setLoading(false);
      setError('Network error: Connection timeout');
    }, 1500);
  };

  useInput((char, key) => {
    if (char === 'f' && !loading()) {
      fetchData();
    }
    if (char === 'e' && !loading()) {
      fetchWithError();
    }
    if (char === 'c') {
      setData([]);
      progressBar.reset();
      setError(null);
    }
    if (key.escape || (key.ctrl && char === 'c')) {
      exit();
    }
  });

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, '⚡ Async Loading Example'),
    Text({}),

    // Loading state
    loading()
      ? Box(
          { flexDirection: 'column' },
          renderSpinner(spinner),
          Text({}),
          renderProgressBar(progressBar)
        )
      : null,

    // Error state
    error()
      ? Box(
          { borderStyle: 'round', borderColor: 'red', padding: 1 },
          Text({ color: 'red', bold: true }, '❌ Error: '),
          Text({ color: 'red' }, error()!)
        )
      : null,

    // Data display
    data().length > 0
      ? Box(
          { flexDirection: 'column', marginTop: 1 },
          Text({ color: 'green', bold: true }, `✅ Loaded ${data().length} items:`),
          ...data().map((item) =>
            Text(
              { color: item.status === 'completed' ? 'green' : 'yellow' },
              `   ${item.status === 'completed' ? '✓' : '○'} ${item.name}`
            )
          ),
          Text({})
        )
      : null,

    // Instructions (always at bottom)
    Text({ color: 'gray', dim: true }, 'f: fetch data  e: simulate error  c: clear  ESC: quit')
  );
}

const { waitUntilExit } = render(() => AsyncDemo());
await waitUntilExit();
