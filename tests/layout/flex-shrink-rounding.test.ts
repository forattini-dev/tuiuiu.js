import { describe, expect, it } from 'vitest';
import { ListItem as OwnedListItem } from '../../src/atoms/list-item.js';
import { calculateLayout } from '../../src/core/layout.js';
import { LogViewer as OwnedLogViewer } from '../../src/organisms/scroll-area.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { testComponent } from '../../src/testing/component.js';

const LogViewer = testComponent(OwnedLogViewer);
const ListItem = testComponent(OwnedListItem);

describe('row flexShrink rounding', () => {
  it('assigns a one-column overflow to the wider sibling', () => {
    const node = Box(
      { flexDirection: 'row', width: 30 },
      Box({ width: 1 }, Text({}, '│')),
      Box({ width: 30 }, Text({}, 'content'))
    );

    const layout = calculateLayout(node, 30);

    expect(layout.children[0]?.width).toBe(1);
    expect(layout.children[1]?.width).toBe(29);
  });

  it('preserves a one-column rail beside ListItem', () => {
    const node = Box(
      { flexDirection: 'row', width: 30 },
      Box({ flexDirection: 'column' }, Text({}, '│')),
      Box(
        { flexDirection: 'column' },
        ListItem({ primary: 'Task', status: 'success' })
      )
    );

    const layout = calculateLayout(node, 30);

    expect(layout.children[0]?.width).toBe(1);
    expect(layout.children[1]?.width).toBe(29);
  });

  it('preserves a one-column rail beside LogViewer', () => {
    const node = Box(
      { flexDirection: 'row', width: 30 },
      Box({ flexDirection: 'column' }, Text({}, '│')),
      Box(
        { flexDirection: 'column' },
        LogViewer({
          lines: ['first', 'second', 'third'],
          height: 3,
          autoScroll: false,
        })
      )
    );

    const layout = calculateLayout(node, 30);

    expect(layout.children[0]?.width).toBe(1);
    expect(layout.children[1]?.width).toBe(29);
  });
});
