/**
 * Demo: Global Tick System
 *
 * Mostra como usar o sistema de tick global para sincronizar
 * múltiplas animações sem criar múltiplos setIntervals.
 *
 * Benefícios:
 * - Um único timer para todas as animações
 * - Animações sincronizadas entre componentes
 * - Fácil de pausar/resumir globalmente
 * - Storybook pode controlar externamente
 */
import { render } from '../src/app/render-loop.js';
import { Box, Text } from '../src/primitives/nodes.js';
import { Divider } from '../src/primitives/divider.js';
import { useApp, useInput } from '../src/hooks/index.js';
import {
  startTick,
  stopTick,
  getTick,
  getFrame,
  getFrameItem,
  oscillate,
  isTickRunning,
  setTickRate,
} from '../src/core/tick.js';

// Frames de spinner
const DOTS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const BARS = ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█', '▉', '▊', '▋', '▌', '▍', '▎', '▏'];
const CLOCK = ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'];
const BOUNCING = '⠁⠂⠄⡀⢀⠠⠐⠈'.split('');

// Cores para gradiente
const COLORS = ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta'] as const;

function AnimatedSpinner({ frames, label, speed = 1 }: { frames: string[]; label: string; speed?: number }) {
  const frame = getFrameItem(frames, speed);
  return Box({ flexDirection: 'row', gap: 1 },
    Text({ color: 'cyan' }, frame),
    Text({ dim: true }, label)
  );
}

function PulsingBar({ width = 20 }: { width?: number }) {
  const pos = oscillate(width, 2);
  const bar = '─'.repeat(pos) + '●' + '─'.repeat(width - pos);
  return Text({ color: 'green' }, bar);
}

function TickInfo() {
  const tick = getTick();
  const running = isTickRunning();
  const color = getFrameItem(COLORS, 3);

  return Box({ flexDirection: 'column' },
    Text({ color, bold: true }, `Tick: ${tick}`),
    Text({ color: running ? 'green' : 'red' }, running ? '▶ Running' : '⏸ Paused')
  );
}

function App() {
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      stopTick();
      exit();
    }
    if (input === ' ') {
      if (isTickRunning()) {
        stopTick();
      } else {
        startTick();
      }
    }
    if (input === '+') setTickRate(50);
    if (input === '-') setTickRate(200);
    if (input === '0') setTickRate(100);
  });

  return Box({ flexDirection: 'column', padding: 1 },
    Text({ bold: true, color: 'cyan' }, '🎯 Global Tick Demo'),
    Text({ dim: true }, 'Todas as animações compartilham o mesmo timer'),
    Text({}),

    Divider({ title: 'Spinners', color: 'yellow' }),
    AnimatedSpinner({ frames: DOTS, label: 'Dots (speed 1)', speed: 1 }),
    AnimatedSpinner({ frames: BARS, label: 'Bars (speed 2)', speed: 2 }),
    AnimatedSpinner({ frames: CLOCK, label: 'Clock (speed 3)', speed: 3 }),
    AnimatedSpinner({ frames: BOUNCING, label: 'Bouncing (speed 1)', speed: 1 }),
    Text({}),

    Divider({ title: 'Oscilações', color: 'yellow' }),
    PulsingBar({ width: 30 }),
    Text({}),

    Divider({ title: 'Status', color: 'yellow' }),
    TickInfo(),
    Text({}),

    Text({ dim: true }, '[Space] Pause/Resume  [+/-] Speed  [Q] Quit')
  );
}

// Inicia o tick global
startTick(100);

render(App);
