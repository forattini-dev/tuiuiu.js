import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AppSlot,
  createContributionHost,
  defineSlots,
} from '../../src/app/contributions.js';
import { beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { useEffect } from '../../src/hooks/use-effect.js';
import { Text } from '../../src/primitives/nodes.js';

type Slots = {
  header: { title: string };
  footer: { active: boolean };
};

function renderPass(render: () => void): void {
  beginRender('component');
  try {
    render();
  } finally {
    endRender();
  }
}

describe('ContributionHost', () => {
  afterEach(() => resetHookState());

  it('orders typed contributions and updates through the owning handle', () => {
    defineSlots<Slots>();
    const host = createContributionHost<Slots>();
    host.register({ id: 'later', slot: 'header', order: 20, render: ({ title }) => Text({}, `${title}:later`) });
    const first = host.register({ id: 'first', slot: 'header', order: 10, render: ({ title }) => Text({}, `${title}:first`) });

    let nodes: ReturnType<typeof AppSlot<Slots, 'header'>> = [];
    renderPass(() => {
      nodes = AppSlot({ host, name: 'header', context: { title: 'Build' } });
    });
    expect(nodes.map((node) => node.props.children)).toEqual(['Build:first', 'Build:later']);

    first.update({ id: 'first', slot: 'header', order: 30, render: ({ title }) => Text({}, `${title}:updated`) });
    renderPass(() => {
      nodes = AppSlot({ host, name: 'header', context: { title: 'Build' } });
    });
    expect(nodes.map((node) => node.props.children)).toEqual(['Build:later', 'Build:updated']);
  });

  it('rejects duplicate identities and disposes registrations exactly', () => {
    const host = createContributionHost<Slots>();
    const handle = host.register({ id: 'status', slot: 'footer', render: () => Text({}, 'one') });
    expect(() => host.register({ id: 'status', slot: 'footer', render: () => Text({}, 'two') }))
      .toThrow(/already registered/);
    handle.dispose();
    handle.dispose();
    expect(handle.disposed).toBe(true);
  });

  it('disposes hook resources when a contribution is removed', () => {
    const disposed = vi.fn();
    const host = createContributionHost<Slots>();
    const handle = host.register({
      id: 'status',
      slot: 'footer',
      render: () => {
        useEffect(() => disposed);
        return Text({}, 'status');
      },
    });
    renderPass(() => { AppSlot({ host, name: 'footer', context: { active: true } }); });
    handle.dispose();
    renderPass(() => { AppSlot({ host, name: 'footer', context: { active: true } }); });
    expect(disposed).toHaveBeenCalledOnce();
  });
});
