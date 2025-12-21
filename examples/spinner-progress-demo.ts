/**
 * Demo: Spinner + ProgressBar com controle de estado
 *
 * Mostra como usar componentes reativos com useState/useEffect
 */
import { render } from '../src/app/render-loop.js';
import { Box, Text } from '../src/primitives/nodes.js';
import { Spinner } from '../src/atoms/spinner.js';
import { ProgressBar } from '../src/atoms/progress-bar.js';
import { useState, useEffect, useApp } from '../src/hooks/index.js';

function App() {
  const { exit } = useApp();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + 10;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => exit(), 800);
          return 100;
        }
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const done = progress() >= 100;

  return Box({ flexDirection: 'column', padding: 1 },
    Text({ bold: true, color: 'cyan' }, '🚀 Demo: Spinner + ProgressBar'),
    Text({}),

    // Spinner animado
    Spinner({
      style: 'dots',
      text: done ? 'Concluído!' : 'Processando arquivos...',
      color: done ? 'green' : 'yellow',
      isActive: !done
    }),

    Text({}),

    // ProgressBar com gradiente de cor
    ProgressBar({
      value: progress(),
      max: 100,
      width: 40,
      style: 'smooth',
      color: progress() < 30 ? 'red' : progress() < 70 ? 'yellow' : 'green',
      label: 'Download:'
    }),

    Text({}),
    Text({ dim: true }, done ? '✓ Download completo!' : progress() + '% concluído')
  );
}

render(App);
