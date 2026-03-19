const AGENTS = [
  { id: 'planner', label: 'planner', detail: 'Breaks requests into execution steps.' },
  { id: 'reviewer', label: 'reviewer', detail: 'Looks for regressions and missing tests.' },
  { id: 'shipper', label: 'shipper', detail: 'Focuses on narrowing to a production-ready change.' },
  { id: 'research', label: 'research', detail: 'Collects context before implementation.' },
];

const FILES = [
  { id: 'render-loop', label: 'src/app/render-loop.ts', detail: 'Render scheduler and backpressure handling.' },
  { id: 'text-input', label: 'src/atoms/text-input.ts', detail: 'Structured prompt editing controller.' },
  { id: 'use-app', label: 'src/hooks/use-app.ts', detail: 'App context, input ownership, external ingress.' },
  { id: 'background-executor', label: 'src/utils/background-executor.ts', detail: 'Inline and worker-thread task execution.' },
  { id: 'forms-docs', label: 'docs/components/forms.md', detail: 'Public form-component guidance.' },
];

const ANALYZE_PROGRESS_UPDATES = [
  { progress: 12, status: 'Scanning prompt context' },
  { progress: 34, status: 'Normalizing semantic tokens' },
  { progress: 62, status: 'Ranking background work' },
  { progress: 86, status: 'Preparing implementation outline' },
];

function sleep(delayMs, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error('Aborted'));
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, delayMs);

    const onAbort = () => {
      cleanup();
      reject(signal?.reason ?? new Error('Aborted'));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      signal?.removeEventListener?.('abort', onAbort);
    };

    signal?.addEventListener?.('abort', onAbort, { once: true });
  });
}

function matches(query, value) {
  return value.toLowerCase().includes(query.toLowerCase());
}

function summarizeSegments(segments) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return 'No semantic tokens attached.';
  }

  return segments
    .map((segment) => `${segment.kind}:${segment.displayText}`)
    .join(', ');
}

export const backgroundTaskHandlers = {
  async suggestPromptRefs(payload, signal, reporter) {
    const trigger = payload?.trigger ?? '@';
    const query = String(payload?.query ?? '').trim();

    reporter.emit('progress', {
      progress: 20,
      status: 'Scanning completion source',
    });
    await sleep(45, signal);
    reporter.emit('progress', {
      progress: 68,
      status: 'Ranking completion matches',
    });
    await sleep(45, signal);

    const source = trigger === '#' ? FILES : AGENTS;
    const items = source
      .filter((entry) => query.length === 0 || matches(query, entry.label))
      .slice(0, 6)
      .map((entry) => ({
        id: entry.id,
        label: trigger === '#' ? entry.label : entry.label,
        detail: entry.detail,
        replacement: {
          kind: trigger === '#' ? 'file' : 'mention',
          displayText: `${trigger}${entry.label}`,
          payload: trigger === '#'
            ? { path: entry.label }
            : { agent: entry.label },
        },
      }));

    return items;
  },

  async analyzePrompt(payload, signal, reporter) {
    const text = String(payload?.text ?? '');
    const segments = Array.isArray(payload?.segments) ? payload.segments : [];

    for (const update of ANALYZE_PROGRESS_UPDATES) {
      reporter.emit('progress', update);
      await sleep(140, signal);
    }

    const actions = [];
    if (text.includes('terminal')) actions.push('trace render-loop and input ownership');
    if (text.includes('worker')) actions.push('compare inline executor with worker-thread executor');
    if (text.includes('paste')) actions.push('inspect the paste transform path and token payload');
    if (segments.some((segment) => segment.kind === 'file')) actions.push('open referenced files before coding');
    if (segments.some((segment) => segment.kind === 'mention')) actions.push('route work according to the mentioned role');
    if (actions.length === 0) actions.push('turn the request into a concrete implementation checklist');

    return {
      headline: 'Reference prompt processed',
      summary: `Prompt length ${text.length} chars. ${segments.length} semantic token(s).`,
      segmentSummary: summarizeSegments(segments),
      actions,
    };
  },
};

export default backgroundTaskHandlers;
