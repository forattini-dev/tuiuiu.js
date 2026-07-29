/**
 * Rich Prompt Workbench
 *
 * Reference example for the structured prompt foundation:
 * - semantic segments in TextInput
 * - async completions backed by a worker thread
 * - progressive background status updates batched through the app ingress
 *
 * What this example does not do:
 * - own a PTY or shell session
 * - emulate a terminal inside the library
 * - prescribe product-specific prompt semantics
 *
 * Run with: pnpm example rich-prompt-workbench
 */

import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

import {
  render,
  Box,
  Divider,
  ProgressBar,
  Spinner,
  Text,
  TextInput,
  createPromptCommandRegistry,
  createPromptModeRegistry,
  createNodeFsSyncStorage,
  createTaskBridge,
  useApp,
  useConst,
  useEffect,
  useInput,
  useState,
  useTerminalSize,
  useTextInputState,
  type PromptCommandArgumentCompletionContext,
  type SyncStorageAdapter,
  type PromptCommandDefinition,
  type PromptCommandLiveContext,
  type PromptModeResolved,
  type TextInputCompletionAnchor,
  type TextInputSegment,
  type VNode,
} from '../src/index.js';

type Activity = {
  id: number;
  role: 'system' | 'user' | 'assistant';
  title: string;
  body: string;
};

type WorkerAnalysis = {
  headline: string;
  summary: string;
  segmentSummary: string;
  actions: string[];
};

type WorkerProgressPayload = {
  progress?: number;
  status?: string;
};

const workerModulePath = fileURLToPath(new URL('./_shared/rich-prompt-worker.mjs', import.meta.url));
const SAMPLE_PASTE = `Terminal feedback should stay immediate even when the app is indexing a codebase. The prompt should keep semantic references compact and avoid flooding the screen with raw pasted text.`;
const DEFAULT_RANKING_STORAGE = createNodeFsSyncStorage({
  dir: './.tuiuiu-data/examples/rich-prompt-workbench',
});
const DEFAULT_RANKING_STORAGE_KEY = 'completion-ranking';
const DEFAULT_HISTORY_STORAGE_KEY = 'prompt-history';
const SEED_PRESETS = [
  {
    id: 'planner',
    label: 'planner',
    detail: 'Planner agent token plus render-loop file.',
  },
  {
    id: 'reviewer',
    label: 'reviewer',
    detail: 'Reviewer agent token plus text-input file.',
  },
  {
    id: 'render-loop',
    label: 'render-loop',
    detail: 'Only the render-loop file token.',
  },
] as const;
const SEED_PRESET_IDS = new Set(SEED_PRESETS.map((preset) => preset.id));
const PROMPT_MODES = {
  defaultMode: {
    id: 'text',
    label: 'Text',
    description: 'Default worker-backed prompt flow.',
  },
  modes: [
    {
      id: 'command',
      label: 'Command',
      description: 'Slash command routing.',
      prefix: '/',
    },
    {
      id: 'shell',
      label: 'Shell',
      description: 'Shell-style preview route.',
      prefix: '!',
    },
  ],
} as const;
const SLASH_COMMANDS: PromptCommandDefinition[] = [
  {
    id: 'help',
    command: 'help',
    description: 'List available slash commands.',
    usage: '/help',
  },
  {
    id: 'clear',
    command: 'clear',
    description: 'Reset the transcript to the intro card.',
    usage: '/clear',
  },
  {
    id: 'tokens',
    command: 'tokens',
    description: 'Describe the current semantic tokens.',
    usage: '/tokens',
  },
  {
    id: 'seed',
    command: 'seed',
    description: 'Insert a file token and planner mention into the prompt.',
    usage: '/seed <preset>',
    getLiveDiagnostic: (context) => {
      const preset = context.args[0];
      if (!preset) {
        return {
          level: 'warning',
          message: 'Preset required.',
        };
      }

      if (!SEED_PRESET_IDS.has(preset as (typeof SEED_PRESETS)[number]['id'])) {
        return {
          level: 'error',
          message: `Unknown preset: ${preset}`,
        };
      }

      return {
        level: 'info',
        message: `Preset ready: ${preset}`,
      };
    },
    completeArgs: (context: PromptCommandArgumentCompletionContext) =>
      SEED_PRESETS
        .filter((preset) =>
          context.currentArgText.length === 0
          || preset.id.includes(context.currentArgText.toLowerCase())
        )
        .map((preset) => ({
          id: preset.id,
          label: preset.label,
          detail: preset.detail,
          replacement: preset.label,
        })),
  },
];

let nextActivityId = 1;

export interface RichPromptWorkbenchProps {
  rankingStorage?: SyncStorageAdapter;
  rankingStorageKey?: string;
  historyStorage?: SyncStorageAdapter;
  historyStorageKey?: string;
}

const SEEDED_PROMPT_HISTORY: Array<{ value: string; segments: TextInputSegment[] }> = [
  {
    value: '@research',
    segments: [
      {
        id: 'seed-history-research',
        kind: 'mention',
        start: 0,
        end: 9,
        displayText: '@research',
        payload: { agent: 'research' },
      },
    ],
  },
  {
    value: '#src/atoms/text-input.ts',
    segments: [
      {
        id: 'seed-history-text-input',
        kind: 'file',
        start: 0,
        end: 25,
        displayText: '#src/atoms/text-input.ts',
        payload: { path: 'src/atoms/text-input.ts' },
      },
    ],
  },
];

function resolvePromptAnchor(value: string, cursorPosition: number): TextInputCompletionAnchor | null {
  const prefix = value.slice(0, cursorPosition);
  const match = prefix.match(/(?:^|\s)([@#/])([a-zA-Z0-9._/-]*)$/);
  if (!match || match.index === undefined) {
    return null;
  }

  const raw = match[0];
  const start = raw.startsWith(' ') ? match.index + 1 : match.index;

  return {
    start,
    end: cursorPosition,
    query: match[2] ?? '',
    trigger: match[1],
  };
}

function buildSeedPreset(
  preset: string,
  prompt: ReturnType<typeof useTextInputState>
): string {
  prompt.clear();

  if (preset === 'planner') {
    prompt.insertSegment({
      kind: 'mention',
      displayText: '@planner',
      payload: { agent: 'planner' },
    });
    prompt.insertSegment({
      kind: 'file',
      displayText: '#src/app/render-loop.ts',
      payload: { path: 'src/app/render-loop.ts' },
    });
    return 'Inserted @planner and #src/app/render-loop.ts into the prompt buffer.';
  }

  if (preset === 'reviewer') {
    prompt.insertSegment({
      kind: 'mention',
      displayText: '@reviewer',
      payload: { agent: 'reviewer' },
    });
    prompt.insertSegment({
      kind: 'file',
      displayText: '#src/atoms/text-input.ts',
      payload: { path: 'src/atoms/text-input.ts' },
    });
    return 'Inserted @reviewer and #src/atoms/text-input.ts into the prompt buffer.';
  }

  prompt.insertSegment({
    kind: 'file',
    displayText: '#src/app/render-loop.ts',
    payload: { path: 'src/app/render-loop.ts' },
  });
  return 'Inserted #src/app/render-loop.ts into the prompt buffer.';
}

function describeSegment(segment: TextInputSegment): string {
  if (segment.kind === 'file' && segment.payload && typeof segment.payload === 'object' && 'path' in segment.payload) {
    return String((segment.payload as { path: string }).path);
  }
  if (segment.kind === 'mention' && segment.payload && typeof segment.payload === 'object' && 'agent' in segment.payload) {
    return String((segment.payload as { agent: string }).agent);
  }
  if (segment.kind === 'paste' && segment.payload && typeof segment.payload === 'object' && 'summary' in segment.payload) {
    return String((segment.payload as { summary: string }).summary);
  }
  return segment.displayText;
}

function ActivityCard(entry: Activity): VNode {
  const color =
    entry.role === 'assistant' ? 'cyan'
      : entry.role === 'user' ? 'green'
      : 'yellow';

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: color,
      paddingX: 1,
      paddingY: 0,
      marginBottom: 1,
    },
    Text({ color, bold: true }, entry.title),
    Text({}, entry.body),
  );
}

function TokenList(props: { segments: TextInputSegment[] }): VNode {
  if (props.segments.length === 0) {
    return Text({ color: 'gray', dim: true }, 'No semantic tokens in the prompt yet.');
  }

  return Box(
    { flexDirection: 'column', gap: 1 as any },
    ...props.segments.map((segment) =>
      Box(
        {
          flexDirection: 'column',
          borderStyle: 'round',
          borderColor: segment.kind === 'file' ? 'cyan' : segment.kind === 'mention' ? 'green' : 'yellow',
          paddingX: 1,
        },
        Text({ bold: true }, `${segment.displayText}  (${segment.kind})`),
        Text({ color: 'gray', dim: true }, describeSegment(segment))
      )
    )
  );
}

function CompletionPanel(props: {
  completion: ReturnType<ReturnType<typeof useTextInputState>['completion']>;
}): VNode {
  const completion = props.completion;
  if (!completion) {
    return Box(
      { flexDirection: 'column' },
      Text({ color: 'gray', dim: true }, 'Type `/` for commands, `@` for roles, or `#` for file completions.'),
      Text({ color: 'gray', dim: true }, 'Tab accepts, Up/Down changes the active suggestion.'),
      Text({ color: 'gray', dim: true }, '`/seed` supports argument completions like `planner` or `reviewer`.'),
      Text({ color: 'gray', dim: true }, 'Accepted suggestions float upward through persisted frecency ranking.'),
    );
  }

  const headerColor = completion.status === 'error'
    ? 'red'
    : completion.status === 'loading'
      ? 'yellow'
      : 'cyan';

  return Box(
    { flexDirection: 'column' },
    Text({ color: headerColor, bold: true }, `${completion.status.toUpperCase()}  query="${completion.query}"`),
    completion.status === 'loading' && (completion.statusText || typeof completion.progress === 'number')
      ? Text(
          { color: 'gray', dim: true },
          `${completion.statusText ?? 'Resolving completion'}${typeof completion.progress === 'number' ? `  ${completion.progress}%` : ''}`
        )
      : null,
    ...(completion.items.length === 0
      ? [Text({ color: 'gray', dim: true }, completion.status === 'loading' ? 'Waiting for worker results...' : 'No results for this anchor.')]
      : completion.items.slice(0, 5).map((item, index) =>
        Text(
          {
            color: completion.selectedIndex === index ? 'white' : 'gray',
            backgroundColor: completion.selectedIndex === index ? 'cyan' : undefined,
          },
          `${completion.selectedIndex === index ? '>' : ' '} ${item.label}${item.detail ? `  ${item.detail}` : ''}`
        )
      )),
    completion.error ? Text({ color: 'red' }, completion.error) : null
  );
}

function SlashContextPanel(props: {
  context: PromptCommandLiveContext | null;
}): VNode {
  const context = props.context;
  if (!context) {
    return Box(
      { flexDirection: 'column' },
      Text({ color: 'gray', dim: true }, 'No active slash command at the cursor.'),
      Text({ color: 'gray', dim: true }, 'Type `/` to inspect a command while editing.'),
    );
  }

  if (context.status === 'unresolved') {
    return Box(
      { flexDirection: 'column' },
      Text({ color: 'red', bold: true }, 'UNRESOLVED COMMAND'),
      Text({}, `token: ${context.invocation}`),
      Text({ color: 'gray', dim: true }, `query: ${context.query || '(empty)'}`),
      Text({ color: 'gray', dim: true }, 'Keep typing or use completion to resolve a registered command.'),
    );
  }

  return Box(
    { flexDirection: 'column' },
    Text(
      { color: context.target === 'argument' ? 'green' : 'cyan', bold: true },
      `${context.target === 'argument' ? 'EDITING ARGUMENTS' : 'ACTIVE COMMAND'}  /${context.command.command}`
    ),
    context.command.description
      ? Text({ color: 'gray', dim: true }, context.command.description)
      : null,
    context.usage
      ? Text({}, `usage: ${context.usage}`)
      : null,
    context.diagnostic
      ? Text(
          {
            color:
              context.diagnostic.level === 'error'
                ? 'red'
                : context.diagnostic.level === 'warning'
                  ? 'yellow'
                  : 'green',
          },
          `${context.diagnostic.level}: ${context.diagnostic.message}`
        )
      : null,
    Text({}, `query: ${context.query || '(empty)'}`),
    context.target === 'argument'
      ? Text({}, `current arg: ${context.currentArgText || '(empty)'}`)
      : Text({}, `mode: command token`),
    context.argsText
      ? Text({ color: 'gray', dim: true }, `args: ${context.argsText}`)
      : Text({ color: 'gray', dim: true }, 'args: none'),
  );
}

function PromptModePanel(props: {
  mode: PromptModeResolved;
}): VNode {
  const mode = props.mode;
  const color =
    mode.mode.id === 'shell'
      ? 'magenta'
      : mode.mode.id === 'command'
        ? 'cyan'
        : 'green';

  return Box(
    { flexDirection: 'column' },
    Text({ color, bold: true }, `MODE  ${mode.mode.label ?? mode.mode.id}`),
    mode.mode.description
      ? Text({ color: 'gray', dim: true }, mode.mode.description)
      : null,
    Text({}, `explicit: ${mode.isExplicit ? 'yes' : 'no'}`),
    Text({}, `prefix: ${mode.prefix ?? '(none)'}`),
    Text({ color: 'gray', dim: true }, `payload: ${mode.payload || '(empty)'}`),
  );
}

export function RichPromptWorkbench(props: RichPromptWorkbenchProps = {}): VNode {
  const app = useApp();
  const { columns } = useTerminalSize();
  const rankingStorage = props.rankingStorage ?? DEFAULT_RANKING_STORAGE;
  const rankingStorageKey = props.rankingStorageKey ?? DEFAULT_RANKING_STORAGE_KEY;
  const historyStorage = props.historyStorage ?? rankingStorage;
  const historyStorageKey = props.historyStorageKey ?? DEFAULT_HISTORY_STORAGE_KEY;
  const promptModes = useConst(() => createPromptModeRegistry(PROMPT_MODES));
  const promptCommands = useConst(() => createPromptCommandRegistry(SLASH_COMMANDS));
  const taskBridge = useConst(() =>
    createTaskBridge({
      modulePath: workerModulePath,
      workerName: 'tuiuiu-rich-prompt',
    })
  );
  const runtime = useConst(() => ({
    resetTimer: null as ReturnType<typeof setTimeout> | null,
    currentTask: null as ReturnType<typeof taskBridge.submit<{ text: string; segments: TextInputSegment[] }, WorkerAnalysis>> | null,
    currentTaskSubscription: null as (() => void) | null,
  }));

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: nextActivityId++,
      role: 'system',
      title: 'Structured prompt workbench',
      body: 'Use /help for slash commands, !git status for shell-style routing, @mentions, #files, Up/Down prompt memory, or F2 to inject a summarized paste token. Enter runs the active prompt mode.',
    },
  ]);
  const [status, setStatus] = useState('Idle');
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  const appendActivity = (activity: Omit<Activity, 'id'>) => {
    setActivities((items) => [
      ...items,
      {
        id: nextActivityId++,
        ...activity,
      },
    ]);
  };

  const prompt = useTextInputState({
    placeholder: 'Describe the task. Try /help, !git status, @planner, or #src/app/render-loop.ts',
    multiline: true,
    wordWrap: true,
    autoGrow: true,
    maxLines: 6,
    history: SEEDED_PROMPT_HISTORY,
    historyPersistence: {
      storage: historyStorage,
      key: historyStorageKey,
      limit: 12,
    },
    transformPaste: ({ text }) => {
      if (text.length < 72 && !text.includes('\n')) {
        return undefined;
      }

      const compactSummary = `${text.length} chars of pasted context`;
      return {
        parts: [
          { type: 'text', text: 'Review ' },
          {
            type: 'segment',
            segment: {
              kind: 'paste',
              displayText: `[paste:${text.length}c]`,
              payload: {
                text,
                summary: compactSummary,
              },
            },
          },
        ],
      };
    },
    completion: {
      resolveAnchor: ({ value, cursorPosition }) => {
        const slashContext = promptCommands.getCompletionContext(value, cursorPosition);
        if (slashContext) {
          return {
            start: slashContext.replaceRange.start,
            end: slashContext.replaceRange.end,
            query: slashContext.query,
            trigger: '/',
          };
        }

        return resolvePromptAnchor(value, cursorPosition);
      },
      getItems: ({ anchor }) => {
        if (anchor.trigger === '/') {
          return Promise.resolve(
            promptCommands.resolvePromptCompletion(prompt.value(), prompt.cursorPosition())
          ).then((resolved) =>
            resolved?.items.map((command) => ({
              id: command.id,
              label: command.label,
              detail: command.detail,
              replacement: command.replacement,
            })) ?? []
          );
        }

        return taskBridge.submit<
          { trigger?: string; query: string },
          Array<{ id: string; label: string; detail?: string; replacement: { kind: string; displayText: string; payload?: Record<string, string> } }>
        >({
          type: 'suggestPromptRefs',
          payload: {
            trigger: anchor.trigger,
            query: anchor.query,
          },
        });
      },
      ranking: {
        getKey: (item, context) => `${context.anchor.trigger ?? ''}:${item.id}`,
        persistence: {
          storage: rankingStorage,
          key: rankingStorageKey,
        },
      },
    },
    onSubmit: async (value) => {
      if (busy() || !value.trim()) {
        return;
      }

      const currentSegments = prompt.segments();
      const trimmedValue = value.trim();
      const promptMode = promptModes.inspectPrompt(trimmedValue);

      if (promptMode.mode.id === 'command') {
        appendActivity({
          role: 'user',
          title: 'Slash command',
          body: trimmedValue,
        });

        const slashCommand = promptCommands.parse(trimmedValue);
        if (!slashCommand) {
          appendActivity({
            role: 'system',
            title: 'Unknown slash command',
            body: `Unknown command: ${trimmedValue}. Use /help to inspect supported commands.`,
          });
          setStatus('Unknown slash command');
          setProgress(0);
          prompt.clear();
          return;
        }

        switch (slashCommand.command.id) {
          case 'help':
            appendActivity({
              role: 'system',
              title: 'Available slash commands',
              body: '/help • /clear • /tokens • /seed',
            });
            setStatus('Slash command: help');
            setProgress(0);
            prompt.clear();
            return;
          case 'clear':
            setActivities((items) => [
              items[0]!,
              {
                id: nextActivityId++,
                role: 'system',
                title: 'Transcript cleared',
                body: 'Slash command `/clear` reset the workbench transcript.',
              },
            ]);
            setStatus('Slash command: clear');
            setProgress(0);
            prompt.clear();
            return;
          case 'tokens':
            appendActivity({
              role: 'system',
              title: 'Semantic token summary',
              body: currentSegments.length === 0
                ? 'No semantic tokens are attached to the current prompt.'
                : currentSegments.map((segment) => `${segment.kind}:${segment.displayText}`).join(' • '),
            });
            setStatus('Slash command: tokens');
            setProgress(0);
            prompt.clear();
            return;
          case 'seed':
            {
              const preset = slashCommand.argsText || 'planner';
              const summary = buildSeedPreset(preset, prompt);
              appendActivity({
                role: 'system',
                title: 'Prompt seeded',
                body: summary,
              });
              setStatus(`Slash command: seed ${preset}`);
              setProgress(0);
              return;
            }
        }
      }

      if (promptMode.mode.id === 'shell') {
        appendActivity({
          role: 'user',
          title: 'Shell prompt',
          body: trimmedValue,
        });

        if (!promptMode.payload) {
          appendActivity({
            role: 'system',
            title: 'Shell mode preview',
            body: 'Shell mode expects a command after `!`.',
          });
          setStatus('Shell mode: missing command');
          setProgress(0);
          prompt.clear();
          return;
        }

        appendActivity({
          role: 'system',
          title: 'Shell mode preview',
          body: `Would run: ${promptMode.payload}`,
        });
        setStatus(`Shell mode: ${promptMode.payload}`);
        setProgress(0);
        prompt.clear();
        return;
      }

      appendActivity({
        role: 'user',
        title: 'User prompt',
        body: value,
      });
      setBusy(true);
      setProgress(0);
      setStatus('Queueing background task');

      if (runtime.resetTimer) clearTimeout(runtime.resetTimer);
      if (runtime.currentTaskSubscription) {
        runtime.currentTaskSubscription();
        runtime.currentTaskSubscription = null;
      }

      const task = taskBridge.submit<
        { text: string; segments: TextInputSegment[] },
        WorkerAnalysis
      >({
        type: 'analyzePrompt',
        payload: {
          text: value,
          segments: currentSegments,
        },
      });
      runtime.currentTask = task;
      runtime.currentTaskSubscription = task.subscribe((event) => {
        if (event.kind !== 'progress') {
          return;
        }

        const payload = event.payload as WorkerProgressPayload;
        app.enqueueExternalUpdate?.(() => {
          if (typeof payload.progress === 'number') {
            setProgress(payload.progress);
          }
          if (typeof payload.status === 'string') {
            setStatus(payload.status);
          }
        });
      });

      const result = await task.result;
      runtime.currentTask = null;
      if (runtime.currentTaskSubscription) {
        runtime.currentTaskSubscription();
        runtime.currentTaskSubscription = null;
      }

      app.enqueueExternalUpdate?.(() => {
        if (result.status === 'resolved') {
          setActivities((items) => [
            ...items,
            {
              id: nextActivityId++,
              role: 'assistant',
              title: result.value.headline,
              body: `${result.value.summary}\n${result.value.segmentSummary}\nNext: ${result.value.actions.join(' • ')}`,
            },
          ]);
          setStatus('Worker pass complete');
          setProgress(100);
          prompt.clear();
        } else if (result.status === 'cancelled') {
          setActivities((items) => [
            ...items,
            {
              id: nextActivityId++,
              role: 'system',
              title: 'Background task cancelled',
              body: result.reason ?? 'Cancelled',
            },
          ]);
          setStatus('Background task cancelled');
          setProgress(0);
        } else {
          setActivities((items) => [
            ...items,
            {
              id: nextActivityId++,
              role: 'system',
              title: 'Background task failed',
              body: result.error.message,
            },
          ]);
          setStatus(result.error.message);
          setProgress(0);
        }
        setBusy(false);
      });

      runtime.resetTimer = setTimeout(() => {
        app.enqueueExternalUpdate?.(() => {
          if (!busy()) {
            setProgress(0);
            setStatus('Idle');
          }
        });
      }, 900);
    },
  });

  useEffect(() => {
    return () => {
      if (runtime.resetTimer) clearTimeout(runtime.resetTimer);
      if (runtime.currentTaskSubscription) {
        runtime.currentTaskSubscription();
        runtime.currentTaskSubscription = null;
      }
      void taskBridge.destroy();
    };
  });

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      app.exit();
      return true;
    }

    if (key.f2) {
      prompt.paste(SAMPLE_PASTE);
      setActivities((items) => [
        ...items,
        {
          id: nextActivityId++,
          role: 'system',
          title: 'Paste transformed',
          body: 'Inserted a compact paste token instead of flooding the buffer with raw text.',
        },
      ]);
      return true;
    }

    if (key.f3) {
      prompt.insertSegment({
        kind: 'file',
        displayText: '#src/app/render-loop.ts',
        payload: { path: 'src/app/render-loop.ts' },
      });
      return true;
    }

    if (key.f4) {
      prompt.insertSegment({
        kind: 'mention',
        displayText: '@planner',
        payload: { agent: 'planner' },
      });
      return true;
    }

    if ((key.escape || (key.ctrl && input === 'x')) && busy()) {
      runtime.currentTask?.cancel('Cancelled from the prompt');
      setStatus('Cancelling background task');
      return true;
    }

    if (key.ctrl && input === 'l') {
      runtime.currentTask?.cancel('Reset workbench');
      if (runtime.currentTaskSubscription) {
        runtime.currentTaskSubscription();
        runtime.currentTaskSubscription = null;
      }
      runtime.currentTask = null;
      prompt.clear();
      setActivities((items) => items.slice(0, 1));
      setProgress(0);
      setStatus('Idle');
      setBusy(false);
      return true;
    }

    return false;
  }, { priority: 'critical', stopPropagation: true });

  const sidebarWidth = Math.max(36, Math.min(44, Math.floor(columns * 0.34)));
  const transcriptWidth = Math.max(40, columns - sidebarWidth - 7);
  const completion = prompt.completion();
  const promptMode = promptModes.inspectPrompt(prompt.value());
  const slashContext = promptCommands.inspectPrompt(prompt.value(), prompt.cursorPosition());

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, 'Rich Prompt Workbench'),
    Text({ color: 'gray', dim: true }, 'Core owns structured input, completion anchors, and worker contracts. App code still owns prompt semantics, task orchestration, and PTY decisions.'),
    Divider(),
    Box(
      {
        flexDirection: 'row',
        gap: 1 as any,
        alignItems: 'flex-start' as any,
      },
      Box(
        {
          flexDirection: 'column',
          width: transcriptWidth,
          borderStyle: 'round',
          borderColor: 'cyan',
          paddingX: 1,
        },
        Text({ color: 'cyan', bold: true }, 'Transcript'),
        ...activities().slice(-6).map((entry) => ActivityCard(entry))
      ),
      Box(
        {
          flexDirection: 'column',
          width: sidebarWidth,
          borderStyle: 'round',
          borderColor: 'gray',
          paddingX: 1,
        },
        Text({ color: 'yellow', bold: true }, 'Slash Context'),
        SlashContextPanel({ context: slashContext }),
        Divider(),
        Text({ color: 'yellow', bold: true }, 'Semantic Tokens'),
        TokenList({ segments: prompt.segments() }),
        Divider(),
        Text({ color: 'yellow', bold: true }, 'Prompt Mode'),
        PromptModePanel({ mode: promptMode }),
        Divider(),
        Text({ color: 'yellow', bold: true }, 'Async Completions'),
        CompletionPanel({ completion }),
        Divider(),
        Text({ color: 'yellow', bold: true }, 'Runtime'),
        Text({}, `executor: worker_threads`),
        Text({}, `busy: ${busy() ? 'yes' : 'no'}`),
        Text({}, `task active: ${runtime.currentTask ? 'yes' : 'no'}`),
        Text({}, `external queue pending: ${app.hasPendingExternalUpdates?.() ? 'yes' : 'no'}`),
        Text({}, 'prompt history: persisted'),
        Text({}, 'ranking memory: persisted'),
        Text({ color: 'gray', dim: true }, '/help /clear /tokens /seed <preset>'),
        Text({ color: 'gray', dim: true }, '!git status  !pnpm test'),
        Text({ color: 'gray', dim: true }, 'seed presets: planner reviewer render-loop'),
        Text({ color: 'gray', dim: true }, 'F2 paste sample  F3 file token  F4 mention token'),
        Text({ color: 'gray', dim: true }, 'Up/Down prompt memory  Esc cancel task'),
        Text({ color: 'gray', dim: true }, 'Tab accept completion'),
        Text({ color: 'gray', dim: true }, 'Ctrl+L reset  Ctrl+C exit'),
      ),
    ),
    Divider(),
    TextInput({
      state: prompt,
      borderStyle: 'round',
      fullWidth: true,
      prompt: '>',
      focusedBorderColor: busy() ? 'yellow' : 'cyan',
    }),
    Box(
      { flexDirection: 'column', marginTop: 1 },
      Box(
        { flexDirection: 'row' },
        busy() ? Spinner({ style: 'dots', color: 'yellow' }) : Text({ color: 'green' }, '•'),
        Text({ color: busy() ? 'yellow' : 'gray' }, ` ${busy() ? 'Working' : 'Ready'}  ${status()}`)
      ),
      ProgressBar({
        value: progress(),
        max: 100,
        width: Math.max(20, columns - 6),
        showPercentage: true,
        color: busy() ? 'yellow' : 'cyan',
      }),
    ),
  );
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }

  return import.meta.url === pathToFileURL(entry).href;
}

if (isMainModule()) {
  const { waitUntilExit } = render(() => RichPromptWorkbench(), {
    fullHeight: true,
    maxFps: 30,
  });
  await waitUntilExit();
}
