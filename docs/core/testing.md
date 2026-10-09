# Testing real applications

`createTestHarness()` from `tuiuiu.js/testing` mounts the production renderer
with isolated input/output streams. It uses the normal component owners,
interaction runtime, terminal input parser, layout, frame commit and
presentation backend. It does not serialize VNodes into markup.

```ts
import { Text } from 'tuiuiu.js';
import { useConst, useShortcut } from 'tuiuiu.js/app';
import { createSignal } from 'tuiuiu.js';
import { createTestHarness } from 'tuiuiu.js/testing';

const harness = createTestHarness({ columns: 30, rows: 4 });
try {
  harness.render(() => {
    const [count, setCount] = useConst(() => createSignal(0));
    useShortcut('a', () => setCount(count() + 1));
    return Text({}, `Count: ${count()}`);
  });

  harness.events.keyPress('a');
  await harness.flush();
  console.assert(harness.getScreenString().includes('Count: 1'));

  harness.events.resize(50, 6);
  await harness.flush();
  console.assert(harness.getFrame()?.info.viewport.width === 50);
} finally {
  harness.cleanup();
}
```

`render()` returns the initial visible output. Calling it again unmounts the
previous application and mounts a replacement. To preserve component state,
update signals, send input or use `harness.app?.invalidate()` and then
`await harness.flush()` instead of calling `render()` again.

`getFrame()` returns only this harness's committed production frame, including
layout, draw commands, queries and the physical cursor anchor. Cell positions
and supported SGR colors/styles are available through
`harness.terminal.getCell(x, y)`. Wide glyphs occupy a leading cell and an empty
continuation cell; combining marks remain part of their grapheme.

The default presentation is fullscreen/delta, with no FPS throttle or process
exit on Ctrl+C. `renderOptions` selects the normal renderer options, such as
`useDeltaRenderer: false`, hardware cursor presentation and the interaction
sequence policy. The harness always owns its streams and disables process exit.

`flush()` requests an urgent frame and drains render microtasks until two
consecutive passes commit no new frame. It is bounded (50 passes by default)
and fails if rendering does not settle. It does not advance timers or wait for
worker/network IO. For timed behavior, advance your test runner's fake timers,
or await the application's async work, before flushing. It is not a general
"all async work is complete" assertion.

Enable `enableMouse` and `enableBracketedPaste` when simulating those protocols.
Input goes through the same parser as a terminal. The simulator is a testing
surface for Tuiuiu's output, not a complete VT emulator: graphics payloads and
arbitrary external programs require dedicated protocol/PTY tests.

`reset()` unmounts and clears the screen while preserving configured input
protocols. `cleanup()` unmounts and clears it; repeated cleanup is safe. Always
clean up mounted harnesses to release application-owned effects and resources.
