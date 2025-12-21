/**
 * Event System Example
 *
 * Showcases the DOM-like event system:
 * - Event bubbling and capturing
 * - Event delegation
 * - Custom events
 * - Event composition
 * - Async event helpers
 *
 * Run with: npx tsx examples/17-event-system.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useInput,
  useApp,
  EventEmitter,
  createEvent,
  getEventBus,
  delegate,
  combineHandlers,
  throttleHandler,
  debounceHandler,
  Divider,
  setTheme,
  darkTheme,
} from '../src/index.js';

// Apply dark theme
setTheme(darkTheme);

type DemoType = 'bubbling' | 'delegation' | 'custom' | 'composition';

function EventSystemDemo() {
  const app = useApp();
  const [activeDemo, setActiveDemo] = useState<DemoType>('bubbling');
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [delegatedTarget, setDelegatedTarget] = useState<string | null>(null);
  const [customEventData, setCustomEventData] = useState<any>(null);
  const [throttledCount, setThrottledCount] = useState(0);
  const [debouncedCount, setDebouncedCount] = useState(0);
  const [rawCount, setRawCount] = useState(0);

  // Event emitter for demos
  const [emitter] = useState(() => new EventEmitter());

  // Add event to log
  const logEvent = (message: string) => {
    setEventLog(prev => [...prev.slice(-7), `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      app.exit();
    }
    if (input === '1') setActiveDemo('bubbling');
    if (input === '2') setActiveDemo('delegation');
    if (input === '3') setActiveDemo('custom');
    if (input === '4') setActiveDemo('composition');

    // Demo-specific inputs
    if (activeDemo() === 'bubbling') {
      if (input === 'c') {
        // Simulate click on child
        const event = createEvent('click', { target: 'child' });
        emitter().emit('click', event);
        logEvent('Clicked on CHILD element');
      }
      if (input === 'p') {
        // Simulate click on parent
        const event = createEvent('click', { target: 'parent' });
        emitter().emit('click', event);
        logEvent('Clicked on PARENT element');
      }
    }

    if (activeDemo() === 'delegation') {
      if (input === 'a') {
        setDelegatedTarget('item-a');
        logEvent('Delegated: Selected Item A');
      }
      if (input === 'b') {
        setDelegatedTarget('item-b');
        logEvent('Delegated: Selected Item B');
      }
      if (input === 'd') {
        setDelegatedTarget('item-c');
        logEvent('Delegated: Selected Item C');
      }
    }

    if (activeDemo() === 'custom') {
      if (input === 'e') {
        const data = {
          type: 'userAction',
          payload: { action: 'submit', timestamp: Date.now() },
        };
        setCustomEventData(data);
        logEvent(`Custom event emitted: ${JSON.stringify(data.payload)}`);
      }
      if (input === 'r') {
        setCustomEventData(null);
        logEvent('Custom event data reset');
      }
    }

    if (activeDemo() === 'composition') {
      // Demonstrate throttle vs debounce vs raw
      setRawCount(c => c + 1);
      logEvent(`Raw count: ${rawCount() + 1}`);
    }
  });

  // Setup event handlers for bubbling demo
  useState(() => {
    // Parent handler (bubble phase)
    emitter().on('click', (event) => {
      if (event.phase === 'bubble') {
        logEvent(`PARENT received bubbled event from: ${event.data?.target}`);
      }
    }, { phase: 'bubble' });

    // Child handler (capture phase)
    emitter().on('click', (event) => {
      if (event.phase === 'capture') {
        logEvent(`CHILD captured event`);
      }
    }, { phase: 'capture' });

    return () => {
      emitter().removeAllListeners();
    };
  });

  // Throttled and debounced handlers for composition demo
  useState(() => {
    const throttled = throttleHandler(() => {
      setThrottledCount(c => c + 1);
    }, 500);

    const debounced = debounceHandler(() => {
      setDebouncedCount(c => c + 1);
    }, 500);

    // Call on each render when in composition demo
    if (activeDemo() === 'composition') {
      throttled();
      debounced();
    }
  });

  const renderDemo = () => {
    switch (activeDemo()) {
      case 'bubbling':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Event Bubbling & Capturing'),
          Text({ color: 'gray', marginBottom: 1 },
            'Events propagate through capture phase (down) then bubble phase (up)'),

          // Visual representation of DOM tree
          Box(
            { flexDirection: 'column', marginBottom: 1, padding: 1, borderStyle: 'single', borderColor: 'gray' },
            Text({ color: 'white' }, '  Document (root)'),
            Text({ color: 'gray' }, '  │'),
            Text({ color: 'yellow' }, '  └─ [P]ARENT element'),
            Text({ color: 'gray' }, '     │'),
            Text({ color: 'green' }, '     └─ [C]HILD element'),
          ),

          Text({ color: 'gray', marginBottom: 1 }, 'Event Flow:'),
          Box(
            { flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: 'cyan' },
            Text({ color: 'blue' }, '1. CAPTURE PHASE: Document → Parent → Child'),
            Text({ color: 'gray' }, '   (Event travels DOWN the tree)'),
            Text({ color: 'magenta', marginTop: 1 }, '2. BUBBLE PHASE: Child → Parent → Document'),
            Text({ color: 'gray' }, '   (Event travels UP the tree)'),
          ),

          Text({ color: 'gray', dim: true, marginTop: 1 }, 'Press [C] to click child, [P] to click parent')
        );

      case 'delegation':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'magenta', bold: true, marginBottom: 1 }, 'Event Delegation'),
          Text({ color: 'gray', marginBottom: 1 },
            'Single handler on parent handles events for all children'),

          Box(
            { flexDirection: 'column', marginBottom: 1 },
            Text({ color: 'white', marginBottom: 1 }, 'Delegated List (one handler):'),
            Box(
              { flexDirection: 'column', padding: 1, borderStyle: 'single', borderColor: 'gray' },
              Box(
                {},
                Text({ color: delegatedTarget() === 'item-a' ? 'green' : 'gray' },
                  delegatedTarget() === 'item-a' ? '● ' : '○ '),
                Text({ color: delegatedTarget() === 'item-a' ? 'green' : 'white' }, '[A] Item A')
              ),
              Box(
                {},
                Text({ color: delegatedTarget() === 'item-b' ? 'green' : 'gray' },
                  delegatedTarget() === 'item-b' ? '● ' : '○ '),
                Text({ color: delegatedTarget() === 'item-b' ? 'green' : 'white' }, '[B] Item B')
              ),
              Box(
                {},
                Text({ color: delegatedTarget() === 'item-c' ? 'green' : 'gray' },
                  delegatedTarget() === 'item-c' ? '● ' : '○ '),
                Text({ color: delegatedTarget() === 'item-c' ? 'green' : 'white' }, '[D] Item C')
              )
            )
          ),

          Text({ color: 'gray' }, 'Benefits:'),
          Text({ color: 'gray', dim: true }, '  • Fewer event listeners (memory efficient)'),
          Text({ color: 'gray', dim: true }, '  • Works with dynamically added elements'),
          Text({ color: 'gray', dim: true }, '  • Centralized event handling logic'),

          Text({ color: 'gray', dim: true, marginTop: 1 }, 'Press [A], [B], or [D] to select items')
        );

      case 'custom':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'green', bold: true, marginBottom: 1 }, 'Custom Events'),
          Text({ color: 'gray', marginBottom: 1 },
            'Create and emit custom events with arbitrary data'),

          Box(
            { flexDirection: 'column', marginBottom: 1 },
            Text({ color: 'white', marginBottom: 1 }, 'Event Data:'),
            Box(
              { padding: 1, borderStyle: 'single', borderColor: customEventData() ? 'green' : 'gray' },
              customEventData()
                ? Box(
                    { flexDirection: 'column' },
                    Text({ color: 'white' }, `Type: ${customEventData().type}`),
                    Text({ color: 'green' }, `Action: ${customEventData().payload.action}`),
                    Text({ color: 'gray' }, `Timestamp: ${new Date(customEventData().payload.timestamp).toISOString()}`)
                  )
                : Text({ color: 'gray', dim: true }, 'No event data - press [E] to emit')
            )
          ),

          Text({ color: 'gray' }, 'Custom Event Usage:'),
          Box(
            { padding: 1, borderStyle: 'round', borderColor: 'gray' },
            Text({ color: 'white' }, `const event = createEvent('userAction', {`),
            Text({ color: 'gray' }, `  target: 'form',`),
            Text({ color: 'gray' }, `  data: { action: 'submit' }`),
            Text({ color: 'white' }, `});`),
            Text({ color: 'white' }, `emitter.emit('userAction', event);`)
          ),

          Text({ color: 'gray', dim: true, marginTop: 1 }, 'Press [E] to emit event, [R] to reset')
        );

      case 'composition':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'yellow', bold: true, marginBottom: 1 }, 'Event Handler Composition'),
          Text({ color: 'gray', marginBottom: 1 },
            'Combine, throttle, and debounce event handlers'),

          Box(
            { flexDirection: 'column', marginBottom: 1 },
            Text({ color: 'white', marginBottom: 1 }, 'Handler Comparison (press any key repeatedly):'),

            Box(
              { flexDirection: 'row', gap: 2, marginBottom: 1 },
              Box(
                { flexDirection: 'column', padding: 1, borderStyle: 'single', borderColor: 'red' },
                Text({ color: 'red', bold: true }, 'Raw Handler'),
                Text({ color: 'white' }, `Count: ${rawCount()}`),
                Text({ color: 'gray', dim: true }, 'Fires every time')
              ),
              Box(
                { flexDirection: 'column', padding: 1, borderStyle: 'single', borderColor: 'yellow' },
                Text({ color: 'yellow', bold: true }, 'Throttled (500ms)'),
                Text({ color: 'white' }, `Count: ${throttledCount()}`),
                Text({ color: 'gray', dim: true }, 'Max once per 500ms')
              ),
              Box(
                { flexDirection: 'column', padding: 1, borderStyle: 'single', borderColor: 'green' },
                Text({ color: 'green', bold: true }, 'Debounced (500ms)'),
                Text({ color: 'white' }, `Count: ${debouncedCount()}`),
                Text({ color: 'gray', dim: true }, 'After 500ms silence')
              )
            ),

            Text({ color: 'gray' }, 'Use cases:'),
            Text({ color: 'gray', dim: true }, '  • Throttle: Scroll events, resize, mouse move'),
            Text({ color: 'gray', dim: true }, '  • Debounce: Search input, form validation'),
            Text({ color: 'gray', dim: true }, '  • Combine: Multiple handlers for same event')
          )
        );

      default:
        return Text({}, 'Select a demo');
    }
  };

  return Box(
    {
      flexDirection: 'column',
      padding: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    },
    // Header
    Box(
      { marginBottom: 1 },
      Text({ color: 'cyan', bold: true }, ' Event System Demo ')
    ),

    // Navigation
    Box(
      { marginBottom: 1 },
      Text({ color: activeDemo() === 'bubbling' ? 'cyan' : 'gray' }, '[1] Bubbling  '),
      Text({ color: activeDemo() === 'delegation' ? 'magenta' : 'gray' }, '[2] Delegation  '),
      Text({ color: activeDemo() === 'custom' ? 'green' : 'gray' }, '[3] Custom  '),
      Text({ color: activeDemo() === 'composition' ? 'yellow' : 'gray' }, '[4] Composition')
    ),

    Divider({}),

    // Demo content
    Box({ marginTop: 1, minHeight: 14 }, renderDemo()),

    // Event log
    Divider({ title: 'Event Log' }),
    Box(
      { flexDirection: 'column', height: 8, padding: 1, borderStyle: 'single', borderColor: 'gray' },
      ...eventLog().map((log, i) =>
        Text({ color: i === eventLog().length - 1 ? 'white' : 'gray', dim: i < eventLog().length - 1 }, log)
      ),
      eventLog().length === 0 && Text({ color: 'gray', dim: true }, 'No events logged yet')
    ),

    // Footer
    Box(
      { marginTop: 1 },
      Text({ color: 'gray', dim: true }, '[1-4] Switch demo  [Q] Exit')
    )
  );
}

// Run the demo
const { waitUntilExit } = render(EventSystemDemo);
await waitUntilExit();
