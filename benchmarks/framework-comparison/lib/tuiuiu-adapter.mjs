import {
  ROW_COUNT,
  footerLine,
  headerLine,
  workerLine,
} from './scenario.mjs';

export function createTuiuiuAdapterFactory({
  Box,
  Text,
  createSignal,
  render,
}) {
  return function createAdapter({ scenario, stdout, stdin }) {
    const staticRows = Array.from(
      { length: ROW_COUNT },
      (_, index) => Text({}, workerLine(index, 0, 'localized')),
    );
    let instance;
    let setTick;

    function view(tick) {
      const rows = scenario === 'localized'
        ? staticRows
        : Array.from(
            { length: ROW_COUNT },
            (_, index) => Text({}, workerLine(index, tick, scenario)),
          );

      return Box(
        { flexDirection: 'column', width: 'fill' },
        Text({}, headerLine(tick)),
        ...rows,
        Text({}, footerLine(tick, scenario)),
      );
    }

    return {
      async mount() {
        const [tick, updateTick] = createSignal(0);
        setTick = updateTick;
        instance = render(
          () => view(tick()),
          {
            stdout,
            stdin,
            autoTabNavigation: false,
            clearOnStart: false,
            alternateScreen: false,
            exitOnCtrlC: false,
            fullHeight: false,
            maxFps: 0,
            showCursor: true,
            useDeltaRenderer: true,
          },
        );
      },

      async flush() {},

      async update(tick) {
        const writesBeforeUpdate = stdout.writeCount;
        setTick(tick);
        await stdout.waitForWriteAfter(writesBeforeUpdate);
      },

      async burst(startTick, iterations) {
        const writesBeforeBurst = stdout.writeCount;
        for (let offset = 0; offset < iterations; offset += 1) {
          setTick(startTick + offset);
        }
        await stdout.waitForWriteAfter(writesBeforeBurst);
      },

      async unmount() {
        instance.unmount();
        await instance.waitUntilExit();
      },
    };
  };
}
