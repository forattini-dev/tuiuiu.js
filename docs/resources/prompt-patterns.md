# Prompt Patterns

Advanced prompt composition patterns built on top of `TextInput`, prompt routing helpers, and background tasks.

## Prompt Command Routing

Slash commands remain application-owned prompt semantics, but the library provides a helper to remove most of the boilerplate:

```typescript
import { createPromptCommandRegistry } from 'tuiuiu.js';

const promptCommands = createPromptCommandRegistry([
  { id: 'help', command: 'help', description: 'List available commands.', usage: '/help' },
  { id: 'clear', command: 'clear', description: 'Reset the transcript.', usage: '/clear' },
  {
    id: 'seed',
    command: 'seed',
    description: 'Seed the prompt with semantic tokens.',
    usage: '/seed <preset>',
    getLiveDiagnostic: (context) => {
      const preset = context.args[0];
      if (!preset) return { level: 'warning', message: 'Preset required.' };
      if (!['planner', 'reviewer'].includes(preset)) {
        return { level: 'error', message: `Unknown preset: ${preset}` };
      }
      return { level: 'info', message: `Preset ready: ${preset}` };
    },
    completeArgs: (context) =>
      ['planner', 'reviewer']
        .filter((item) => item.includes(context.currentArgText))
        .map((item) => ({
          id: item,
          label: item,
          replacement: item,
        })),
  },
]);

const prompt = useTextInputState({
  completion: {
    resolveAnchor: ({ value, cursorPosition }) => {
      const match = value.slice(0, cursorPosition).match(/(?:^|\s)([@#/])([\w./-]*)$/);
      if (!match || match.index === undefined) return null;
      const start = match[0].startsWith(' ') ? match.index + 1 : match.index;
      return { start, end: cursorPosition, query: match[2] ?? '', trigger: match[1] };
    },
    getItems: ({ anchor }) => {
      if (anchor.trigger === '/') {
        return Promise.resolve(
          promptCommands.resolvePromptCompletion(prompt.value(), prompt.cursorPosition())
        ).then((resolved) => resolved?.items.map((command) => ({
          id: command.id,
          label: command.label,
          detail: command.detail,
          replacement: command.replacement,
        })) ?? []);
      }

      return loadPromptSuggestions({ anchor });
    },
  },
  onSubmit: (value) => {
    const command = promptCommands.parse(value);
    if (!command) {
      runNormalPromptFlow(value);
      return;
    }

    switch (command.command.id) {
      case 'help':
        showHelp();
        break;
      case 'clear':
        clearTranscript();
        break;
    }
  },
});

const slashContext = promptCommands.inspectPrompt(prompt.value(), prompt.cursorPosition());
if (slashContext?.status === 'matched') {
  renderSidebarBadge(`${slashContext.invocation}  ${slashContext.usage ?? ''}`.trim());
  if (slashContext.diagnostic) {
    renderStatusLine(`${slashContext.diagnostic.level}: ${slashContext.diagnostic.message}`);
  }
}
```

The helper owns matching and parsing. Your app still owns execution, transcript mutations, worker orchestration, and any PTY or shell behavior.

## Prompt Mode Routing

When one prompt needs multiple submit routes, the library can classify prompt mode by prefix without pushing those semantics into `TextInput`:

```typescript
import { createPromptModeRegistry } from 'tuiuiu.js';

const promptModes = createPromptModeRegistry({
  defaultMode: { id: 'text', label: 'Text' },
  modes: [
    { id: 'command', label: 'Command', prefix: '/' },
    { id: 'shell', label: 'Shell', prefix: '!' },
  ],
});

const mode = promptModes.inspectPrompt(prompt.value());

onSubmit((value) => {
  const resolved = promptModes.inspectPrompt(value.trim());
  switch (resolved.mode.id) {
    case 'command':
      routeSlashCommand(value);
      return;
    case 'shell':
      previewShellCommand(resolved.payload);
      return;
    default:
      runNormalPromptFlow(resolved.payload);
  }
});
```

`inspectPrompt()` is the canonical API. `parse()` is kept as a compatibility alias for older app code.

## Task-Backed Completion Usage

When completion sources need ranking or background work, `getItems` can return a task handle instead of awaiting the result inline:

```typescript
const prompt = useTextInputState({
  completion: {
    resolveAnchor: ({ value, cursorPosition }) => {
      const match = value.slice(0, cursorPosition).match(/(?:^|\s)([@#])([\w./-]*)$/);
      if (!match || match.index === undefined) return null;
      const start = match[0].startsWith(' ') ? match.index + 1 : match.index;
      return { start, end: cursorPosition, query: match[2] ?? '', trigger: match[1] };
    },
    getItems: ({ anchor }) =>
      executor.submit({
        type: 'suggestPromptRefs',
        payload: { trigger: anchor.trigger, query: anchor.query },
      }),
  },
});

const completion = prompt.completion();
// completion?.statusText and completion?.progress are populated from `progress` events
```

When the anchor changes or the completion session closes, the controller cancels the obsolete task automatically and ignores late updates from that stale request.

## Completion Ranking

Completion ranking is opt-in and controller-local. When enabled, accepted items gain frecency weight and rise in later sessions for the same ranking key:

```typescript
const prompt = useTextInputState({
  completion: {
    resolveAnchor,
    getItems: loadPromptSuggestions,
    ranking: {
      getKey: (item, context) => `${context.anchor.trigger ?? ''}:${item.id}`,
    },
  },
});
```

Provider order remains the stable tie-break when items have equal scores or no ranking history. The controller also exposes `getCompletionRankingSnapshot()` and `clearCompletionRanking()` for apps that want to inspect or reset the local in-memory ranking state.

If you want ranking to survive process restarts, add synchronous persistence:

```typescript
import { createNodeFsSyncStorage } from 'tuiuiu.js';

const rankingStorage = createNodeFsSyncStorage({
  dir: './.prompt-state',
});

const prompt = useTextInputState({
  completion: {
    resolveAnchor,
    getItems: loadPromptSuggestions,
    ranking: {
      getKey: (item, context) => `${context.anchor.trigger ?? ''}:${item.id}`,
      persistence: {
        storage: rankingStorage,
        key: 'rich-prompt-ranking',
      },
    },
  },
});
```

Persisted ranking hydrates synchronously when the controller is created, so the first completion session in a new process can already use prior ranking history.

## Background Task Progress Pattern

When prompt state depends on background work, prefer task-scoped events plus the app ingress instead of local timer simulation:

```typescript
const app = useApp();
const executor = createWorkerExecutor(workerModulePath);

const task = executor.submit({
  type: 'analyzePrompt',
  payload: { text: prompt.value(), segments: prompt.segments() },
});

const unsubscribe = task.subscribe((event) => {
  if (event.kind !== 'progress') return;

  app.enqueueExternalUpdate?.(() => {
    setStatus(String((event.payload as { status?: string }).status ?? 'Working'));
    setProgress(Number((event.payload as { progress?: number }).progress ?? 0));
  });
});

const result = await task.result;
unsubscribe();
```

This keeps worker-side progress real, routes UI mutations through the batched ingress, and avoids one render per ad-hoc timer tick.

## Generic Task Bridge

Use `createTaskBridge()` when the domain is not about prompts or UI-specific semantics:

```typescript
import { createTaskBridge } from 'tuiuiu.js';

const taskBridge = createTaskBridge('./workers/background-pipeline.mjs');
const handle = taskBridge.execute('analyze-text', { text: 'heavy payload...' });

handle.subscribe((event) => {
  if (event.kind === 'progress') {
    app.enqueueExternalUpdate?.(() => {
      setProgress(Number((event.payload as { progress?: number }).progress ?? 0));
    });
  }
});

const result = await handle.result;
```

`createTaskBridge` accepts either:
- `createTaskBridge('./workers/file.mjs')`
- `createTaskBridge({ modulePath: './workers/file.mjs', workerName: 'my-worker' })`
- `createTaskBridge(existingBackgroundExecutor)`

Call `taskBridge.destroy()` when the screen/context is done.

## Core vs App-Owned Integration

Library core is responsible for:

- maintaining the canonical text buffer, cursor, and semantic segment ranges
- applying paste transforms before mutation
- tracking anchored completion state and selection
- providing background executors and batched external ingress

Application code is still responsible for:

- deciding what segments mean in the product domain
- providing completion sources and worker handler modules
- subscribing to task events and mapping them into product-specific status/progress state
- orchestrating progress/status copy and final task semantics
- owning PTY sessions, shell processes, remote terminals, or resumable terminal transport

See [examples.md](./examples.md) for the concrete `rich-prompt-workbench` and `shell-session-workbench` references.

## Developer-friendly worker API

Use `createWorkerExecutor` for background CPU work that should not block input/rendering:

```typescript
import { createWorkerExecutor } from 'tuiuiu.js';

const executor = createWorkerExecutor('./workers/app-tasks.mjs', {
  workerName: 'app-task-runner',
});
```

Submit a task and keep the handle lifecycle explicit:

```typescript
const task = executor.submit<{ text: string }, { ok: boolean }>(
  { type: 'analyzeText', payload: { text: '...some text...' } }
);

const unsub = task.subscribe((event) => {
  if (event.kind !== 'progress') return;
  app.enqueueExternalUpdate?.(() => {
    setProgressText(String((event.payload as { status?: string }).status ?? 'working'));
  });
});

const result = await task.result;
if (result.status === 'resolved') {
  setStatus(`ok=${result.value.ok}`);
} else if (result.status === 'rejected') {
  setStatus(`error=${result.error.message}`);
} else {
  setStatus(result.reason ?? 'cancelled');
}

unsub();
```

Abort when the request becomes stale:

```typescript
task.cancel('Input changed');
```

Dispose when the screen or service is torn down:

```typescript
await executor.destroy();
```

Keep these rules in mind:
- Keep UI state updates in `app.enqueueExternalUpdate(...)`.
- Use workers for long or CPU-heavy tasks.
- For tiny, fast handlers, prefer inline execution to avoid overhead.
