import { describe, expect, it } from 'vitest';

import {
  createContext,
  hasContext,
  useContext,
  withContext,
} from '../../src/primitives/context.js';
import { Text } from '../../src/primitives/nodes.js';
import { createSignal } from '../../src/primitives/signal.js';

describe('tree-scoped Context', () => {
  it('returns the default outside a Provider', () => {
    const context = createContext('default');

    expect(useContext(context)).toBe('default');
    expect(hasContext(context)).toBe(false);
    expect(context._stack).toEqual([]);
  });

  it('evaluates render-function descendants inside the Provider scope', () => {
    const context = createContext('default');
    let observed = '';
    let active = false;

    const node = context.Provider(
      { value: 'provided' },
      () => {
        observed = useContext(context);
        active = hasContext(context);
        return Text({}, observed);
      },
    );

    expect(observed).toBe('provided');
    expect(active).toBe(true);
    expect(node.children[0]?.props.children).toBe('provided');
    expect(useContext(context)).toBe('default');
    expect(hasContext(context)).toBe(false);
  });

  it('uses the nearest nested Provider and restores the outer value', () => {
    const context = createContext('default');
    const observations: string[] = [];

    context.Provider(
      { value: 'outer' },
      () => {
        observations.push(useContext(context));
        const inner = context.Provider(
          { value: 'inner' },
          () => {
            observations.push(useContext(context));
            return Text({}, 'inner child');
          },
        );
        observations.push(useContext(context));
        return inner;
      },
    );

    expect(observations).toEqual(['outer', 'inner', 'outer']);
    expect(useContext(context)).toBe('default');
    expect(context._stack).toEqual([]);
  });

  it('restores context when a descendant throws', () => {
    const context = createContext('default');

    expect(() => context.Provider(
      { value: 'temporary' },
      () => {
        expect(useContext(context)).toBe('temporary');
        throw new Error('child failed');
      },
    )).toThrow('child failed');

    expect(useContext(context)).toBe('default');
    expect(context._stack).toEqual([]);
  });

  it('supports props children, arrays, eager VNodes, and empty results', () => {
    const context = createContext('default');
    const eager = Text({}, 'eager');
    const node = context.Provider({
      value: 'provided',
      children: [
        eager,
        () => Text({}, useContext(context)),
        () => null,
        () => [Text({}, 'A'), Text({}, 'B')],
      ],
    });

    expect(node.children).toHaveLength(4);
    expect(node.children[0]).toBe(eager);
    expect(node.children[1]?.props.children).toBe('provided');
  });

  it('provides an explicit withContext helper for non-layout work', () => {
    const context = createContext({ role: 'guest' });

    const role = withContext(
      context,
      { role: 'admin' },
      () => {
        expect(hasContext(context)).toBe(true);
        return useContext(context).role;
      },
    );

    expect(role).toBe('admin');
    expect(useContext(context)).toEqual({ role: 'guest' });
  });

  it('can provide signal accessors without leaking the provider value', () => {
    const [count, setCount] = createSignal(0);
    const context = createContext<{
      count: () => number;
      increment: () => void;
    } | null>(null);

    context.Provider(
      { value: { count, increment: () => setCount(value => value + 1) } },
      () => {
        const value = useContext(context)!;
        value.increment();
        value.increment();
        expect(value.count()).toBe(2);
        return Text({}, String(value.count()));
      },
    );

    expect(useContext(context)).toBeNull();
    expect(count()).toBe(2);
  });

  it('keeps separate contexts independent', () => {
    const theme = createContext('light');
    const locale = createContext('en');
    const observations: string[] = [];

    theme.Provider(
      { value: 'dark' },
      () => locale.Provider(
        { value: 'pt-BR' },
        () => {
          observations.push(useContext(theme), useContext(locale));
          return Text({}, 'child');
        },
      ),
    );

    expect(observations).toEqual(['dark', 'pt-BR']);
    expect(useContext(theme)).toBe('light');
    expect(useContext(locale)).toBe('en');
  });
});
