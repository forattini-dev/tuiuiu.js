import {
  Text,
  render,
  useApp,
  useShortcut,
} from '../../dist/index.js';

const instance = render(() => {
  const app = useApp();
  useShortcut('q', app.exit);
  return Text({}, 'PTY_READY');
}, {
  screen: 'alternate',
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
