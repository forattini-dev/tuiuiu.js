/**
 * Engine Runtime Contracts Example
 *
 * Demonstrates:
 * - committed-frame element queries by explicit ID
 * - programmatic scroll control by ID
 * - inspector metrics/warnings without ANSI parsing
 *
 * Run with: pnpm example programmatic-runtime-contracts
 */

import {
  Box,
  Divider,
  ScrollArea,
  Text,
  render,
  useApp,
  useInteraction,
  useState,
} from '../../src/index.js';
import { getCommittedFrameQueries } from '../../src/core/index.js';
import { getInspectorSnapshot } from '../../src/dev-tools/index.js';

const logLines = Array.from(
  { length: 40 },
  (_, index) => `runtime event #${String(index + 1).padStart(2, '0')}  status=ok`,
);

function RuntimeContractsExample() {
  const app = useApp();
  const [status, setStatus] = useState('Press g, s, j, k, t, b, i or q.');
  const [inspectorLine, setInspectorLine] = useState('Inspector idle.');

  useInteraction((event) => {
    if (event.type !== 'key') return;
    const input = event.key.text;
    const key = event.key.native;
    if (key.escape || input === 'q') {
      app.exit();
      return;
    }

    const queries = getCommittedFrameQueries();

    if (input === 'g') {
      const result = queries?.getElement('log-scroll');
      if (result?.status === 'found' && result.bounds) {
        setStatus(
          `log-scroll bounds: x=${result.bounds.x} y=${result.bounds.y} w=${result.bounds.width} h=${result.bounds.height}`,
        );
      } else {
        setStatus(`log-scroll query status: ${result?.status ?? 'missing-runtime'}`);
      }
      return;
    }

    if (input === 's') {
      const result = queries?.getScrollContainer('log-scroll');
      if (result?.status === 'found' && result.offset && result.maxOffset) {
        setStatus(
          `scroll offset: y=${result.offset.y} / ${result.maxOffset.y}`,
        );
      } else {
        setStatus(`scroll query status: ${result?.status ?? 'missing-runtime'}`);
      }
      return;
    }

    if (input === 'j' || key.downArrow) {
      const result = queries?.getScrollContainer('log-scroll');
      result?.controls?.scrollBy({ y: 1 });
      setStatus('scrollBy({ y: 1 }) applied to log-scroll');
      return;
    }

    if (input === 'k' || key.upArrow) {
      const result = queries?.getScrollContainer('log-scroll');
      result?.controls?.scrollBy({ y: -1 });
      setStatus('scrollBy({ y: -1 }) applied to log-scroll');
      return;
    }

    if (input === 't') {
      const result = queries?.getScrollContainer('log-scroll');
      result?.controls?.scrollToStart();
      setStatus('scrollToStart() applied to log-scroll');
      return;
    }

    if (input === 'b') {
      const result = queries?.getScrollContainer('log-scroll');
      result?.controls?.scrollToEnd();
      setStatus('scrollToEnd() applied to log-scroll');
      return;
    }

    if (input === 'i') {
      const inspector = getInspectorSnapshot();
      if (!inspector) {
        setInspectorLine('Inspector unavailable: no committed frame.');
        return;
      }

      setInspectorLine(
        `frame=${inspector.frame.info.frameId} draw=${inspector.metrics.structural.drawCommandCount} warnings=${inspector.warnings.length}`,
      );
      setStatus('Inspector snapshot captured from committed frame');
    }
  });

  return Box(
    { id: 'runtime-root', flexDirection: 'column', padding: 1, gap: 1, width: 70 },
    Text({ color: 'cyan', bold: true }, 'Engine Runtime Contracts'),
    Text({ color: 'gray' }, 'g=geometry  s=scroll-state  j/k=scrollBy  t=top  b=bottom  i=inspector  q=quit'),
    Divider({}),
    Box(
      { flexDirection: 'column', gap: 1 },
      Text({ color: 'yellow' }, `Status: ${status()}`),
      Text({ color: 'magenta' }, inspectorLine()),
    ),
    Divider({}),
    ScrollArea({
      id: 'log-scroll',
      height: 8,
      width: 66,
      content: logLines,
      showScrollbar: true,
    }),
  );
}

render(RuntimeContractsExample);
