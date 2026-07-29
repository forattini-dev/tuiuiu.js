import {
  Text,
  renderAlternateScreen,
  useApp,
  useInput,
} from '../../dist/minimal.js';

const instance = renderAlternateScreen(() => {
  const app = useApp();
  useInput((input) => {
    if (input === 'q') {
      app.exit();
    }
  });
  return Text({}, 'PTY_READY');
}, {
  exitProcess: false,
  maxFps: 0,
  showCursor: false,
});

const timeout = setTimeout(() => {
  instance.unmount();
}, 5_000);

await instance.waitUntilExit();
clearTimeout(timeout);
process.stdout.write('PTY_CLEAN_EXIT\n');
