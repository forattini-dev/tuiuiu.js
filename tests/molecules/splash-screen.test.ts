/**
 * Tests for splash screen utilities.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { VNode } from '../../src/utils/types.js';
import type { PixelGrid } from '../../src/atoms/picture.js';
import {
  createSplashScreen,
  SplashScreen,
  MinimalSplash,
  ProgressSplash,
  ImpactSplashScreen,
  TuiuiuSplash,
} from '../../src/molecules/splash-screen.js';

function findText(node: VNode, content: string): boolean {
  if (node.type === 'text' && String(node.props.children ?? '').includes(content)) {
    return true;
  }
  const children = (node.children || []) as VNode[];
  return children.some((child) => findText(child, content));
}

const simplePixels: PixelGrid = [
  [
    { char: 'A', fg: 'red' },
    { char: 'B', fg: 'green' },
  ],
];

describe('createSplashScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('updates opacity, progress, and dismisses', () => {
    const onComplete = vi.fn();
    const state = createSplashScreen({ duration: 700, fadeInDuration: 100, onComplete });

    const stop = vi.fn();
    state.setAnimatedPicture({ stop } as any);

    expect(state.opacity()).toBe(0);

    vi.advanceTimersByTime(50);
    expect(state.opacity()).toBeGreaterThan(0);

    vi.advanceTimersByTime(80);
    expect(state.frame()).toBeGreaterThan(0);

    vi.advanceTimersByTime(700);

    expect(state.progress()).toBe(100);
    expect(state.isVisible()).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
  });
});

describe('SplashScreen component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('returns null when not visible', () => {
    const state = { isVisible: () => false } as any;
    const node = SplashScreen({ state });
    expect(node).toBeNull();
  });

  it('stores animated picture for colored art', () => {
    const state = createSplashScreen({ duration: 700 });
    const node = SplashScreen({
      state,
      coloredArt: simplePixels,
      animateFadeIn: true,
      loadingType: 'none',
    });

    expect(node).not.toBeNull();
    expect(state.animatedPicture).not.toBeNull();

    state.dismiss();
  });

  it('renders ascii art with progress loading', () => {
    const state = {
      isVisible: () => true,
      frame: () => 0,
      progress: () => 55,
    } as any;

    const node = SplashScreen({
      state,
      asciiArt: 'HELLO',
      subtitle: 'Booting',
      version: '1.2.3',
      loadingType: 'progress',
      loadingMessage: 'Boot',
    }) as VNode;

    expect(findText(node, 'Booting')).toBe(true);
    expect(findText(node, 'v1.2.3')).toBe(true);
    expect(findText(node, 'Boot')).toBe(true);
  });

  it('renders minimal and progress variants', () => {
    const state = {
      isVisible: () => true,
      frame: () => 2,
      progress: () => 70,
    } as any;

    const minimal = MinimalSplash({ state });
    const progress = ProgressSplash({ state });

    expect(minimal).not.toBeNull();
    expect(progress).not.toBeNull();
  });

  it('renders impact splash without logo', () => {
    const state = {
      isVisible: () => true,
      frame: () => 1,
      progress: () => 40,
      setAnimatedPicture: vi.fn(),
    } as any;

    const node = ImpactSplashScreen({
      birdArt: simplePixels,
      showLogo: false,
      loadingType: 'dots',
      loadingMessage: 'Loading',
      state,
    }) as VNode;

    expect(findText(node, 'Loading')).toBe(true);
  });

  it('renders the branded preset', () => {
    const node = TuiuiuSplash({ loadingType: 'none' });
    expect(node).not.toBeNull();
  });
});
