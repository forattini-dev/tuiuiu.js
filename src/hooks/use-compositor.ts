import { createSpring, useAnimation, type EasingName } from '../core/animation.js';
import type {
  CompositorBindingMetadata,
  CompositorDirection,
  CompositorTransform,
} from '../core/compositor.js';
import { useConst } from './use-const.js';
import { useEffect } from './use-effect.js';
import { useState } from './use-state.js';

export interface CompositorBindProps {
  __compositor?: CompositorBindingMetadata;
}

export interface SlideOptions {
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  duration?: number;
  easing?: EasingName;
}

export interface FadeOptions {
  from?: number;
  to?: number;
  duration?: number;
  easing?: EasingName;
}

export interface ScaleOptions {
  from?: number;
  to?: number;
  duration?: number;
  easing?: EasingName;
}

export interface ShimmerOptions {
  span?: number;
  duration?: number;
  loop?: boolean;
  easing?: EasingName;
}

export interface SpringMotionOptions {
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
  threshold?: number;
}

export interface RevealOptions {
  direction: CompositorDirection;
  from?: number;
  to?: number;
  duration?: number;
  easing?: EasingName;
}

interface TransformEntry {
  id: string;
  transform: CompositorTransform;
}

export interface UseCompositorResult {
  bind: <P extends Record<string, any>>(props: P) => P & { __compositor: CompositorBindingMetadata };
  slide: (options?: SlideOptions) => () => void;
  fade: (options?: FadeOptions) => () => void;
  scale: (options?: ScaleOptions) => () => void;
  shimmer: (options?: ShimmerOptions) => () => void;
  spring: (options?: SpringMotionOptions) => () => void;
  reveal: (options: RevealOptions) => () => void;
  clear: () => void;
}

let nextCompositorKey = 1;
let nextTransformId = 1;

function createTransformId(prefix: string): string {
  return `${prefix}-${nextTransformId++}`;
}

export function useCompositor(): UseCompositorResult {
  const key = useConst(() => `comp-${nextCompositorKey++}`);
  const [entries, setEntries] = useState<TransformEntry[]>([]);
  const cleanupMap = useConst(() => new Map<string, () => void>());

  const stopRegisteredCleanup = (id: string) => {
    const cleanup = cleanupMap.get(id);
    cleanup?.();
    cleanupMap.delete(id);
  };

  const removeEntry = (id: string) => {
    setEntries((previous) => previous.filter((entry) => entry.id !== id));
  };

  const upsertEntry = (id: string, transform: CompositorTransform) => {
    setEntries((previous) => {
      const index = previous.findIndex((entry) => entry.id === id);
      if (index === -1) {
        return [...previous, { id, transform }];
      }

      const next = previous.slice();
      next[index] = { id, transform };
      return next;
    });
  };

  const registerAnimatedTransform = (
    id: string,
    setup: (update: (transform: CompositorTransform) => void, finish: () => void) => () => void,
  ): (() => void) => {
    stopRegisteredCleanup(id);
    const cleanup = setup(
      (transform) => upsertEntry(id, transform),
      () => cleanupMap.delete(id),
    );
    cleanupMap.set(id, cleanup);

    return () => {
      stopRegisteredCleanup(id);
      removeEntry(id);
    };
  };

  const slide = (options: SlideOptions = {}): (() => void) => {
    const {
      fromX = 0,
      fromY = 0,
      toX = 0,
      toY = 0,
      duration = 180,
      easing = 'ease-out',
    } = options;
    const id = createTransformId('slide');

    return registerAnimatedTransform(id, (update, finish) => {
      const animation = useAnimation({
        duration,
        easing,
        onFrame: (progress) => {
          update({
            kind: 'slide',
            offsetX: fromX + (toX - fromX) * progress,
            offsetY: fromY + (toY - fromY) * progress,
          });
        },
        onComplete: finish,
      });

      animation.start();
      return () => animation.stop();
    });
  };

  const fade = (options: FadeOptions = {}): (() => void) => {
    const {
      from = 0,
      to = 1,
      duration = 180,
      easing = 'ease-out',
    } = options;
    const id = createTransformId('fade');

    return registerAnimatedTransform(id, (update, finish) => {
      const animation = useAnimation({
        duration,
        easing,
        onFrame: (progress) => {
          update({
            kind: 'fade',
            opacity: from + (to - from) * progress,
          });
        },
        onComplete: finish,
      });

      animation.start();
      return () => animation.stop();
    });
  };

  const scale = (options: ScaleOptions = {}): (() => void) => {
    const {
      from = 0.9,
      to = 1,
      duration = 180,
      easing = 'ease-out',
    } = options;
    const id = createTransformId('scale');

    return registerAnimatedTransform(id, (update, finish) => {
      const animation = useAnimation({
        duration,
        easing,
        onFrame: (progress) => {
          update({
            kind: 'scale',
            scale: from + (to - from) * progress,
          });
        },
        onComplete: finish,
      });

      animation.start();
      return () => animation.stop();
    });
  };

  const shimmer = (options: ShimmerOptions = {}): (() => void) => {
    const {
      span = 0.35,
      duration = 450,
      loop = true,
      easing = 'linear',
    } = options;
    const id = createTransformId('shimmer');

    return registerAnimatedTransform(id, (update, finish) => {
      let cancelled = false;
      let activeAnimation: ReturnType<typeof useAnimation> | null = null;

      const startCycle = () => {
        activeAnimation = useAnimation({
          duration,
          easing,
          onFrame: (progress) => {
            update({
              kind: 'shimmer',
              phase: progress,
              span,
            });
          },
          onComplete: () => {
            if (cancelled || !loop) {
              finish();
              return;
            }

            startCycle();
          },
        });
        activeAnimation.start();
      };

      startCycle();

      return () => {
        cancelled = true;
        activeAnimation?.stop();
      };
    });
  };

  const spring = (options: SpringMotionOptions = {}): (() => void) => {
    const {
      fromX = 0,
      fromY = 0,
      toX = 0,
      toY = 0,
      stiffness,
      damping,
      mass,
      threshold,
    } = options;
    const id = createTransformId('spring');

    return registerAnimatedTransform(id, (update, finish) => {
      let currentX = fromX;
      let currentY = fromY;
      let remaining = 2;
      const maybeFinish = () => {
        remaining--;
        if (remaining <= 0) {
          finish();
        }
      };

      const xSpring = createSpring({ stiffness, damping, mass, threshold });
      const ySpring = createSpring({ stiffness, damping, mass, threshold });

      const emit = () => {
        update({
          kind: 'spring',
          offsetX: currentX,
          offsetY: currentY,
        });
      };

      emit();
      xSpring.start(fromX, toX, (value) => {
        currentX = value;
        emit();
      }, maybeFinish);
      ySpring.start(fromY, toY, (value) => {
        currentY = value;
        emit();
      }, maybeFinish);

      return () => {
        xSpring.stop();
        ySpring.stop();
      };
    });
  };

  const reveal = (options: RevealOptions): (() => void) => {
    const {
      direction,
      from = 0,
      to = 1,
      duration = 180,
      easing = 'ease-out',
    } = options;
    const id = createTransformId('reveal');

    return registerAnimatedTransform(id, (update, finish) => {
      const animation = useAnimation({
        duration,
        easing,
        onFrame: (progress) => {
          update({
            kind: 'reveal',
            direction,
            progress: from + (to - from) * progress,
          });
        },
        onComplete: finish,
      });

      animation.start();
      return () => animation.stop();
    });
  };

  const clear = () => {
    for (const cleanup of cleanupMap.values()) {
      cleanup();
    }
    cleanupMap.clear();
    setEntries([]);
  };

  useEffect(() => {
    return () => {
      clear();
    };
  });

  const bind = <P extends Record<string, any>>(props: P): P & { __compositor: CompositorBindingMetadata } => ({
    ...props,
    __compositor: {
      key,
      transforms: entries().map((entry) => entry.transform),
    },
  });

  return {
    bind,
    slide,
    fade,
    scale,
    shimmer,
    spring,
    reveal,
    clear,
  };
}
