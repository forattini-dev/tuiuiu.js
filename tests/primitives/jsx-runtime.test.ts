import { describe, expect, it } from 'vitest';
import { Box, Text } from '../../src/primitives/nodes.js';
import { renderOnce } from '../../src/app/render-loop.js';
import { Fragment, jsx, jsxs } from '../../src/jsx-runtime.js';

describe('JSX runtime', () => {
  it('renders intrinsic terminal elements', () => {
    const tree = jsxs('box', {
      flexDirection: 'column',
      children: [
        jsx('text', { children: 'hello' }),
        jsx('newline', {}),
        jsx('text', { children: 42 }),
      ],
    });

    const output = renderOnce(tree);
    expect(output).toContain('hello');
    expect(output).toContain('42');
  });

  it('calls existing functional components with children in props', () => {
    const tree = jsx(Box, {
      children: jsx(Text, { color: 'green', children: 'component' }),
    });

    expect(renderOnce(tree)).toContain('component');
  });

  it('supports fragments and custom components', () => {
    const Status = ({ label }: { label: string }) => Text({}, label);
    const tree = jsx(Fragment, {
      children: [
        jsx(Status, { label: 'ready' }),
        jsx('text', { children: 'done' }),
      ],
    });

    const output = renderOnce(tree);
    expect(output).toContain('ready');
    expect(output).toContain('done');
  });

  it('preserves JSX keys on the resulting node', () => {
    expect(jsx('box', {}, 'row-1').props.key).toBe('row-1');
  });

  it('rejects nested VNodes inside text intrinsics', () => {
    expect(() => jsx('text', {
      children: jsx('text', { children: 'nested' }),
    })).toThrow('<text> only accepts text and number children');
  });
});
