/**
 * External Triggers Example
 *
 * Demonstrates triggering UI actions from external events:
 * - Timer-based animations and updates
 * - Event-driven state changes
 * - External command queue
 * - Simulated API callbacks
 *
 * Run with: npx tsx examples/programmatic/external-triggers.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useInput,
  useApp,
  createSignal,
  createEffect,
  batch,
  setTheme,
  darkTheme,
  Divider,
} from '../../src/index.js';

setTheme(darkTheme);

/**
 * Command Queue - Process external commands
 */
type Command =
  | { type: 'navigate'; target: string }
  | { type: 'notify'; message: string; level: 'info' | 'warn' | 'error' }
  | { type: 'update'; key: string; value: any }
  | { type: 'toggle'; key: string }
  | { type: 'animate'; animation: string };

function createCommandQueue() {
  const [commands, setCommands] = createSignal<Command[]>([]);
  const [processing, setProcessing] = createSignal(false);
  const [lastCommand, setLastCommand] = createSignal<Command | null>(null);

  return {
    commands,
    processing,
    lastCommand,

    // Enqueue a command
    push(command: Command) {
      setCommands((c) => [...c, command]);
    },

    // Process next command
    process(): Command | null {
      let cmd: Command | null = null;
      setCommands((c) => {
        if (c.length === 0) return c;
        [cmd, ...c] = c;
        return c;
      });
      if (cmd) {
        setLastCommand(cmd);
      }
      return cmd;
    },

    // Clear all commands
    clear() {
      setCommands([]);
    },

    // Get queue size
    size() {
      return commands().length;
    },
  };
}

/**
 * Animation Controller - Timer-based animations
 */
function createAnimationController() {
  const [frame, setFrame] = createSignal(0);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [animation, setAnimation] = createSignal<string>('spinner');

  const animations: Record<string, string[]> = {
    spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    dots: ['   ', '.  ', '.. ', '...', '.. ', '.  '],
    bounce: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
    pulse: ['○', '◔', '◑', '◕', '●', '◕', '◑', '◔'],
    wave: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▂'],
    bar: ['[          ]', '[=         ]', '[==        ]', '[===       ]', '[====      ]', '[=====     ]', '[======    ]', '[=======   ]', '[========  ]', '[========= ]', '[==========]'],
  };

  return {
    frame,
    isPlaying,
    animation,

    // Get current frame character
    getCurrentFrame() {
      const anim = animations[animation()] || animations.spinner;
      return anim[frame() % anim.length];
    },

    // Animation control
    play() {
      setIsPlaying(true);
    },

    pause() {
      setIsPlaying(false);
    },

    toggle() {
      setIsPlaying((p) => !p);
    },

    reset() {
      setFrame(0);
    },

    // Set animation type
    setAnimation(name: string) {
      if (animations[name]) {
        batch(() => {
          setAnimation(name);
          setFrame(0);
        });
      }
    },

    // Manual frame advance
    nextFrame() {
      const anim = animations[animation()] || animations.spinner;
      setFrame((f) => (f + 1) % anim.length);
    },

    // Get available animations
    getAnimations() {
      return Object.keys(animations);
    },
  };
}

/**
 * External Event Emitter - Simulate external events
 */
function createEventEmitter() {
  const [events, setEvents] = createSignal<Array<{ id: number; type: string; data: any; time: Date }>>([]);
  let eventId = 0;

  return {
    events,

    emit(type: string, data: any = {}) {
      const event = {
        id: ++eventId,
        type,
        data,
        time: new Date(),
      };
      setEvents((e) => [...e.slice(-9), event]); // Keep last 10
      return event;
    },

    clear() {
      setEvents([]);
    },

    getLatest() {
      const e = events();
      return e.length > 0 ? e[e.length - 1] : null;
    },
  };
}

// Create controllers OUTSIDE component
const commandQueue = createCommandQueue();
const animController = createAnimationController();
const eventEmitter = createEventEmitter();

// Simulate external events (WebSocket, API callbacks, etc.)
function startExternalSimulation() {
  // Animation tick
  const animInterval = setInterval(() => {
    if (animController.isPlaying()) {
      animController.nextFrame();
    }
  }, 100);

  // Random external events
  const eventInterval = setInterval(() => {
    const eventTypes = ['data:received', 'user:action', 'system:update', 'api:response'];
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    eventEmitter.emit(randomType, { value: Math.floor(Math.random() * 100) });
  }, 2000);

  // Command processing
  const commandInterval = setInterval(() => {
    if (commandQueue.size() > 0) {
      const cmd = commandQueue.process();
      if (cmd) {
        eventEmitter.emit('command:processed', cmd);
      }
    }
  }, 500);

  return () => {
    clearInterval(animInterval);
    clearInterval(eventInterval);
    clearInterval(commandInterval);
  };
}

function ExternalTriggersDemo() {
  const app = useApp();
  const [activePanel, setActivePanel] = useState<'queue' | 'events' | 'animation'>('animation');

  // Start simulation
  createEffect(() => {
    const cleanup = startExternalSimulation();
    return cleanup;
  });

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      app.exit();
    }

    // Panel navigation
    if (input === '1') setActivePanel('animation');
    if (input === '2') setActivePanel('queue');
    if (input === '3') setActivePanel('events');

    // Animation controls
    if (input === 'p') animController.toggle();
    if (input === 'r') animController.reset();

    // Cycle animations
    if (key.leftArrow || key.rightArrow) {
      const anims = animController.getAnimations();
      const current = anims.indexOf(animController.animation());
      const next = key.rightArrow
        ? (current + 1) % anims.length
        : (current - 1 + anims.length) % anims.length;
      animController.setAnimation(anims[next]);
    }

    // Queue commands
    if (input === 'n') {
      commandQueue.push({ type: 'notify', message: `Manual notification #${Date.now() % 1000}`, level: 'info' });
    }
    if (input === 'u') {
      commandQueue.push({ type: 'update', key: 'counter', value: Math.floor(Math.random() * 100) });
    }
    if (input === 't') {
      commandQueue.push({ type: 'toggle', key: 'enabled' });
    }
    if (input === 'c') {
      commandQueue.clear();
      eventEmitter.clear();
    }
  });

  const renderAnimationPanel = () => {
    const anims = animController.getAnimations();
    const currentAnim = animController.animation();

    return Box(
      { flexDirection: 'column' },
      Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Animation Controller'),

      // Current animation display
      Box(
        { marginBottom: 1, justifyContent: 'center' },
        Text({ color: 'yellow', bold: true }, `  ${animController.getCurrentFrame()}  `)
      ),

      // Animation selector
      Box(
        { marginBottom: 1 },
        Text({ color: 'gray' }, 'Animation: '),
        ...anims.map((name) =>
          Text(
            { color: name === currentAnim ? 'cyan' : 'gray', bold: name === currentAnim },
            name === currentAnim ? ` [${name}] ` : ` ${name} `
          )
        )
      ),

      // Status
      Box(
        {},
        Text({ color: 'gray' }, 'Status: '),
        Text(
          { color: animController.isPlaying() ? 'green' : 'yellow' },
          animController.isPlaying() ? '▶ Playing' : '⏸ Paused'
        ),
        Text({ color: 'gray' }, ` | Frame: ${animController.frame()}`)
      ),

      // Controls hint
      Box(
        { marginTop: 1 },
        Text({ color: 'gray', dim: true }, '[P] Play/Pause  [R] Reset  [←→] Change animation')
      )
    );
  };

  const renderQueuePanel = () => {
    const commands = commandQueue.commands();
    const last = commandQueue.lastCommand();

    return Box(
      { flexDirection: 'column' },
      Text({ color: 'yellow', bold: true, marginBottom: 1 }, 'Command Queue'),

      // Queue status
      Box(
        { marginBottom: 1 },
        Text({ color: 'gray' }, 'Pending: '),
        Text({ color: commands.length > 0 ? 'cyan' : 'gray' }, `${commands.length} commands`),
        Text({ color: 'gray' }, ' | Processing: '),
        Text({ color: commandQueue.processing() ? 'green' : 'gray' }, commandQueue.processing() ? 'Yes' : 'No')
      ),

      // Last processed
      last && Box(
        { marginBottom: 1 },
        Text({ color: 'gray' }, 'Last: '),
        Text({ color: 'green' }, JSON.stringify(last))
      ),

      // Queue items
      Box(
        { flexDirection: 'column', borderStyle: 'single', borderColor: 'gray', padding: 1, height: 6 },
        commands.length === 0
          ? Text({ color: 'gray', dim: true }, 'Queue is empty')
          : commands.slice(0, 5).map((cmd, i) =>
              Box(
                { key: `cmd-${i}` },
                Text({ color: 'cyan' }, `${i + 1}. `),
                Text({ color: 'white' }, cmd.type),
                Text({ color: 'gray' }, `: ${JSON.stringify(cmd).slice(0, 40)}...`)
              )
            )
      ),

      // Controls
      Box(
        { marginTop: 1 },
        Text({ color: 'gray', dim: true }, '[N] Add notify  [U] Add update  [T] Add toggle  [C] Clear')
      )
    );
  };

  const renderEventsPanel = () => {
    const events = eventEmitter.events();

    return Box(
      { flexDirection: 'column' },
      Text({ color: 'green', bold: true, marginBottom: 1 }, 'Event Stream'),

      // Event count
      Box(
        { marginBottom: 1 },
        Text({ color: 'gray' }, 'Events received: '),
        Text({ color: 'cyan' }, `${events.length}`)
      ),

      // Event list
      Box(
        { flexDirection: 'column', borderStyle: 'single', borderColor: 'gray', padding: 1, height: 8 },
        events.length === 0
          ? Text({ color: 'gray', dim: true }, 'No events yet')
          : events.slice(-8).map((evt) => {
              const colors: Record<string, string> = {
                'data:received': 'cyan',
                'user:action': 'yellow',
                'system:update': 'green',
                'api:response': 'magenta',
                'command:processed': 'blue',
              };
              return Box(
                { key: `evt-${evt.id}` },
                Text({ color: 'gray' }, `[${evt.time.toLocaleTimeString()}] `),
                Text({ color: (colors[evt.type] || 'white') as any }, evt.type),
                Text({ color: 'gray', dim: true }, ` ${JSON.stringify(evt.data).slice(0, 30)}`)
              );
            })
      ),

      // Info
      Box(
        { marginTop: 1 },
        Text({ color: 'gray', dim: true }, 'Events are generated automatically every 2 seconds')
      )
    );
  };

  return Box(
    { flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: 'cyan' },
    // Header
    Box(
      { marginBottom: 1 },
      Text({ color: 'cyan', bold: true }, ' External Triggers Demo ')
    ),

    // Tab navigation
    Box(
      { marginBottom: 1 },
      Text(
        { color: activePanel() === 'animation' ? 'cyan' : 'gray', bold: activePanel() === 'animation' },
        '[1] Animation  '
      ),
      Text(
        { color: activePanel() === 'queue' ? 'yellow' : 'gray', bold: activePanel() === 'queue' },
        '[2] Command Queue  '
      ),
      Text(
        { color: activePanel() === 'events' ? 'green' : 'gray', bold: activePanel() === 'events' },
        '[3] Events'
      )
    ),

    Divider({}),

    // Active panel content
    Box(
      { marginTop: 1 },
      activePanel() === 'animation' ? renderAnimationPanel() :
      activePanel() === 'queue' ? renderQueuePanel() :
      renderEventsPanel()
    ),

    // API hint
    Box(
      { marginTop: 2, borderStyle: 'single', borderColor: 'yellow', padding: 1 },
      Box(
        { flexDirection: 'column' },
        Text({ color: 'yellow', bold: true }, 'Programmatic API:'),
        Text({ color: 'gray' }, 'commandQueue.push({ type: "notify", message: "Hello" })'),
        Text({ color: 'gray' }, 'animController.setAnimation("pulse")'),
        Text({ color: 'gray' }, 'eventEmitter.emit("custom:event", { data: 123 })')
      )
    ),

    // Footer
    Box(
      { marginTop: 1 },
      Text({ color: 'gray', dim: true }, '[Q] Exit')
    )
  );
}

// Run the demo
const { waitUntilExit } = render(ExternalTriggersDemo);
await waitUntilExit();
