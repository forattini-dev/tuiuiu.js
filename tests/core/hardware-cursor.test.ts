import { describe, expect, it, vi } from 'vitest';
import { createDeltaRenderer } from '../../src/core/delta-render.js';
import { createFrameSnapshot } from '../../src/core/frame.js';
import { CursorAnchor, Box, Text } from '../../src/primitives/nodes.js';
import { TextInput } from '../../src/atoms/text-input.js';
import { renderTestComponent } from '../../src/testing/component.js';

function createStdout(columns = 20, rows = 5) {
  return {
    columns,
    rows,
    isTTY: true,
    write: vi.fn(() => true),
  };
}

describe('hardware cursor and IME anchoring', () => {
  it('resolves an anchor after wide CJK cells in terminal columns', () => {
    const frame = createFrameSnapshot(
      Box({ flexDirection: 'row' }, Text({}, '你a'), CursorAnchor()),
      { width: 20, height: 5 },
    );

    expect(frame.cursorAnchor).toEqual({ x: 3, y: 0 });
  });

  it('anchors an active TextInput and omits the anchor when inactive', () => {
    const active = renderTestComponent(() => TextInput({
      initialValue: '你a',
      borderStyle: 'none',
      prompt: '',
      width: 20,
    }));
    const inactive = renderTestComponent(() => TextInput({
      initialValue: '你a',
      borderStyle: 'none',
      prompt: '',
      width: 20,
      isActive: false,
    }));

    expect(createFrameSnapshot(active, { width: 20, height: 5 }).cursorAnchor)
      .toEqual({ x: 4, y: 0 });
    expect(createFrameSnapshot(inactive, { width: 20, height: 5 }).cursorAnchor)
      .toBeNull();
  });

  it('positions a hidden hardware cursor so IME windows track the input', () => {
    const stdout = createStdout();
    const renderer = createDeltaRenderer({
      stdout: stdout as unknown as NodeJS.WriteStream,
      useDelta: true,
    });

    renderer.render(Box({ flexDirection: 'row' }, Text({}, '你'), CursorAnchor()));
    const output = (stdout.write.mock.calls as unknown as Array<[unknown]>)
      .map(([chunk]) => String(chunk)).join('');

    expect(output).toContain('\x1b[1;3H');
    expect(output).toContain('\x1b[?25l');
  });

  it('shows the hardware cursor only when explicitly requested', () => {
    const stdout = createStdout();
    const renderer = createDeltaRenderer({
      stdout: stdout as unknown as NodeJS.WriteStream,
      showHardwareCursor: true,
    });

    renderer.render(Box({ flexDirection: 'row' }, Text({}, '你'), CursorAnchor()));
    const output = (stdout.write.mock.calls as unknown as Array<[unknown]>)
      .map(([chunk]) => String(chunk)).join('');

    expect(output).toContain('\x1b[1;3H');
    expect(output).toContain('\x1b[?25h');
  });
});
