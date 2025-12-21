/**
 * Tests for primitives/context.ts - Context API for state sharing
 */

import { describe, it, expect } from 'vitest';
import {
  createContext,
  useContext,
  hasContext,
  type Context,
} from '../../src/primitives/context.js';
import { createSignal, createEffect } from '../../src/primitives/signal.js';

describe('primitives/context', () => {
  describe('createContext', () => {
    it('creates context with default value', () => {
      const ctx = createContext('default');

      expect(ctx._defaultValue).toBe('default');
      expect(ctx._currentValue).toBe('default');
      expect(ctx._stack).toEqual([]);
    });

    it('creates context with object value', () => {
      const defaultValue = { theme: 'dark', locale: 'en' };
      const ctx = createContext(defaultValue);

      expect(ctx._currentValue).toBe(defaultValue);
      expect(ctx._currentValue.theme).toBe('dark');
    });

    it('creates context with null value', () => {
      const ctx = createContext<string | null>(null);

      expect(ctx._defaultValue).toBeNull();
      expect(ctx._currentValue).toBeNull();
    });

    it('has Provider function', () => {
      const ctx = createContext('default');

      expect(typeof ctx.Provider).toBe('function');
    });
  });

  describe('useContext', () => {
    it('returns default value when no Provider', () => {
      const ctx = createContext('default-theme');

      const value = useContext(ctx);

      expect(value).toBe('default-theme');
    });

    it('returns current value from context', () => {
      const ctx = createContext('initial');
      ctx._currentValue = 'updated';

      const value = useContext(ctx);

      expect(value).toBe('updated');
    });

    it('works with complex types', () => {
      interface User {
        id: number;
        name: string;
      }
      const defaultUser: User = { id: 0, name: 'Guest' };
      const ctx = createContext<User>(defaultUser);

      const user = useContext(ctx);

      expect(user.id).toBe(0);
      expect(user.name).toBe('Guest');
    });
  });

  describe('Provider', () => {
    it('updates current value when called', () => {
      const ctx = createContext('default');

      expect(ctx._currentValue).toBe('default');

      // Call Provider - it updates _currentValue
      ctx.Provider({ value: 'provided' });

      // After Provider called, value is updated
      expect(ctx._currentValue).toBe('provided');
    });

    it('pushes previous value to stack', () => {
      const ctx = createContext('default');

      expect(ctx._stack.length).toBe(0);

      ctx.Provider({ value: 'level1' });

      expect(ctx._stack.length).toBe(1);
      expect(ctx._stack[0]).toBe('default');
    });

    it('returns a VNode wrapper', () => {
      const ctx = createContext('default');

      const result = ctx.Provider({ value: 'test' });

      expect(result).toBeDefined();
      expect(result?.type).toBe('box');
      expect((result?.props as any)?.__contextProvider).toBe(true);
    });

    it('includes children in wrapper', () => {
      const ctx = createContext('default');

      const child = { type: 'text' as const, props: {}, children: ['Hello'] };
      const result = ctx.Provider({ value: 'test', children: child });

      expect(result?.children).toContain(child);
    });

    it('handles array children', () => {
      const ctx = createContext('default');

      const children = [
        { type: 'text' as const, props: {}, children: ['A'] },
        { type: 'text' as const, props: {}, children: ['B'] },
      ];
      const result = ctx.Provider({ value: 'test', children });

      expect(result?.children?.length).toBe(2);
    });

    it('handles rest children arguments', () => {
      const ctx = createContext('default');

      const child1 = { type: 'text' as const, props: {}, children: ['A'] };
      const child2 = { type: 'text' as const, props: {}, children: ['B'] };
      const result = ctx.Provider({ value: 'test' }, child1, child2);

      expect(result?.children?.length).toBe(2);
    });

    it('combines props.children and rest children', () => {
      const ctx = createContext('default');

      const propsChild = { type: 'text' as const, props: {}, children: ['props'] };
      const restChild = { type: 'text' as const, props: {}, children: ['rest'] };
      const result = ctx.Provider({ value: 'test', children: propsChild }, restChild);

      expect(result?.children?.length).toBe(2);
    });
  });

  describe('nested Providers', () => {
    it('inner Provider overrides outer value', () => {
      const ctx = createContext('default');

      // Outer Provider
      ctx.Provider({ value: 'outer' });
      expect(ctx._currentValue).toBe('outer');
      expect(ctx._stack).toEqual(['default']);

      // Inner Provider
      ctx.Provider({ value: 'inner' });
      expect(ctx._currentValue).toBe('inner');
      expect(ctx._stack).toEqual(['default', 'outer']);

      // useContext should return inner value
      expect(useContext(ctx)).toBe('inner');
    });

    it('restore function pops stack correctly', () => {
      const ctx = createContext('default');

      // Create nested structure
      const outer = ctx.Provider({ value: 'outer' });
      const inner = ctx.Provider({ value: 'inner' });

      expect(ctx._currentValue).toBe('inner');
      expect(ctx._stack.length).toBe(2);

      // Simulate inner restore
      const innerRestore = (inner?.props as any)?.__contextRestore;
      innerRestore?.();

      expect(ctx._currentValue).toBe('outer');
      expect(ctx._stack.length).toBe(1);

      // Simulate outer restore
      const outerRestore = (outer?.props as any)?.__contextRestore;
      outerRestore?.();

      expect(ctx._currentValue).toBe('default');
      expect(ctx._stack.length).toBe(0);
    });

    it('restore falls back to default when stack is empty', () => {
      const ctx = createContext('default');

      // Provider without proper stack setup
      const vnode = ctx.Provider({ value: 'test' });

      // Clear stack to simulate edge case
      ctx._stack.length = 0;
      ctx._currentValue = 'test';

      // Call restore
      const restore = (vnode?.props as any)?.__contextRestore;
      restore?.();

      expect(ctx._currentValue).toBe('default');
    });
  });

  describe('hasContext', () => {
    it('returns false when using default value and no providers', () => {
      const ctx = createContext('default');

      expect(hasContext(ctx)).toBe(false);
    });

    it('returns true when inside a Provider', () => {
      const ctx = createContext('default');

      ctx.Provider({ value: 'provided' });

      expect(hasContext(ctx)).toBe(true);
    });

    it('returns true when value differs from default', () => {
      const ctx = createContext('default');
      ctx._currentValue = 'changed';

      expect(hasContext(ctx)).toBe(true);
    });

    it('returns true when stack has entries', () => {
      const ctx = createContext('default');
      ctx._stack.push('something');

      expect(hasContext(ctx)).toBe(true);
    });
  });

  describe('integration with signals', () => {
    it('context can hold signal accessors', () => {
      const [count, setCount] = createSignal(0);

      interface CountContext {
        count: () => number;
        setCount: (v: number | ((prev: number) => number)) => void;
      }

      const ctx = createContext<CountContext>({
        count: () => 0,
        setCount: () => {},
      });

      // Provide real signal
      ctx.Provider({
        value: { count, setCount },
      });

      // Get context value
      const { count: getCount, setCount: updateCount } = useContext(ctx);

      expect(getCount()).toBe(0);

      updateCount(5);
      expect(getCount()).toBe(5);
    });

    it('effects react to signal changes in context', () => {
      const [value, setValue] = createSignal('initial');
      const ctx = createContext<() => string>(value);

      ctx.Provider({ value });

      let observed = '';
      createEffect(() => {
        const getter = useContext(ctx);
        observed = getter();
      });

      expect(observed).toBe('initial');

      setValue('updated');
      expect(observed).toBe('updated');
    });
  });

  describe('real-world patterns', () => {
    it('theme context pattern', () => {
      type Theme = 'light' | 'dark';
      const ThemeContext = createContext<Theme>('light');

      // App provides dark theme
      ThemeContext.Provider({ value: 'dark' });

      // Component reads theme
      const theme = useContext(ThemeContext);
      expect(theme).toBe('dark');
    });

    it('user context pattern', () => {
      interface User {
        id: string;
        name: string;
        isAdmin: boolean;
      }

      const UserContext = createContext<User | null>(null);

      // Before login
      expect(useContext(UserContext)).toBeNull();
      expect(hasContext(UserContext)).toBe(false);

      // After login
      UserContext.Provider({
        value: { id: '123', name: 'John', isAdmin: false },
      });

      const user = useContext(UserContext);
      expect(user?.name).toBe('John');
      expect(hasContext(UserContext)).toBe(true);
    });

    it('multiple contexts work independently', () => {
      const ThemeContext = createContext('light');
      const LocaleContext = createContext('en');

      ThemeContext.Provider({ value: 'dark' });
      LocaleContext.Provider({ value: 'pt-BR' });

      expect(useContext(ThemeContext)).toBe('dark');
      expect(useContext(LocaleContext)).toBe('pt-BR');

      // Changing one doesn't affect the other
      ThemeContext._currentValue = 'light';
      expect(useContext(ThemeContext)).toBe('light');
      expect(useContext(LocaleContext)).toBe('pt-BR');
    });

    it('context with functions', () => {
      interface Actions {
        increment: () => void;
        decrement: () => void;
        reset: () => void;
      }

      const ActionsContext = createContext<Actions | null>(null);

      let counter = 0;
      const actions: Actions = {
        increment: () => counter++,
        decrement: () => counter--,
        reset: () => (counter = 0),
      };

      ActionsContext.Provider({ value: actions });

      const ctx = useContext(ActionsContext);
      ctx?.increment();
      ctx?.increment();
      ctx?.increment();

      expect(counter).toBe(3);

      ctx?.reset();
      expect(counter).toBe(0);
    });
  });
});
