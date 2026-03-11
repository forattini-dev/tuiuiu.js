import { fingerprintValue } from './structural-fingerprint.js';
import { getMotionRuntimeState } from './motion-runtime.js';
import type {
  Bounds,
  DrawBoxCommand,
  DrawCommand,
  DrawTerminalImageCommand,
  DrawTextCommand,
} from './frame.js';

export type CompositorDirection = 'left' | 'right' | 'up' | 'down';

export interface SlideTransform {
  kind: 'slide';
  offsetX: number;
  offsetY: number;
}

export interface FadeTransform {
  kind: 'fade';
  opacity: number;
}

export interface ShimmerTransform {
  kind: 'shimmer';
  phase: number;
  span?: number;
}

export interface RevealTransform {
  kind: 'reveal';
  direction: CompositorDirection;
  progress: number;
}

export interface SpringTransform {
  kind: 'spring';
  offsetX: number;
  offsetY: number;
}

export type CompositorTransform =
  | SlideTransform
  | FadeTransform
  | ShimmerTransform
  | RevealTransform
  | SpringTransform;

export interface CompositorBindingMetadata {
  key: string;
  transforms: CompositorTransform[];
}

export interface BoundCompositorMetadata extends CompositorBindingMetadata {
  bounds: Bounds;
}

type TransformMap = ReadonlyMap<string, BoundCompositorMetadata>;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

export function isCompositorBindingMetadata(value: unknown): value is CompositorBindingMetadata {
  return !!(
    value &&
    typeof value === 'object' &&
    'key' in value &&
    typeof (value as CompositorBindingMetadata).key === 'string' &&
    Array.isArray((value as CompositorBindingMetadata).transforms)
  );
}

export function fingerprintCompositorBinding(
  binding: CompositorBindingMetadata | null | undefined,
): string | null {
  if (!binding) {
    return null;
  }

  return fingerprintValue({
    key: binding.key,
    transforms: binding.transforms,
  });
}

function cloneCommand<T extends DrawCommand>(command: T): T {
  if (command.type === 'text') {
    return {
      ...command,
      style: { ...command.style },
      compositorKeys: command.compositorKeys ? [...command.compositorKeys] : undefined,
    };
  }

  return {
    ...command,
    compositorKeys: command.compositorKeys ? [...command.compositorKeys] : undefined,
  };
}

function applySlide<T extends DrawCommand>(
  command: T,
  transform: SlideTransform | SpringTransform,
): T {
  const next = cloneCommand(command);
  next.x += Math.round(transform.offsetX);
  next.y += Math.round(transform.offsetY);
  return next;
}

function applyFade(command: DrawCommand, transform: FadeTransform): DrawCommand | null {
  const opacity = clamp01(transform.opacity);
  if (opacity <= 0) {
    return null;
  }

  if (command.type !== 'text') {
    return command;
  }

  if (opacity >= 0.67) {
    return command;
  }

  const next = cloneCommand(command);
  next.style = {
    ...next.style,
    dim: true,
    bold: opacity >= 0.4 ? next.style.bold : false,
  };
  return next;
}

function commandIntersectsBand(command: DrawCommand, bounds: Bounds, start: number, end: number): boolean {
  const commandStart = command.x;
  const commandEnd = command.type === 'text'
    ? command.x + Math.max(1, command.maxWidth)
    : command.x + Math.max(1, command.width);

  return commandEnd > start && commandStart < end && command.y >= bounds.y && command.y < bounds.y + bounds.height;
}

function applyShimmer(
  command: DrawCommand,
  transform: ShimmerTransform,
  bounds: Bounds,
): DrawCommand {
  if (command.type !== 'text') {
    return command;
  }

  const span = clamp01(transform.span ?? 0.35);
  const start = bounds.x + Math.round((bounds.width + Math.max(1, bounds.width * span)) * clamp01(transform.phase)) - Math.round(bounds.width * span);
  const end = start + Math.max(1, Math.round(bounds.width * span));

  if (!commandIntersectsBand(command, bounds, start, end)) {
    return command;
  }

  const next = cloneCommand(command);
  next.style = {
    ...next.style,
    bold: true,
    inverse: true,
  };
  return next;
}

function applyReveal(command: DrawCommand, transform: RevealTransform, bounds: Bounds): DrawCommand | null {
  const progress = clamp01(transform.progress);
  if (progress <= 0) {
    return null;
  }
  if (progress >= 1) {
    return command;
  }

  const next = cloneCommand(command);

  if (transform.direction === 'left' || transform.direction === 'right') {
    const visibleWidth = Math.max(0, Math.round(bounds.width * progress));
    if (visibleWidth <= 0) {
      return null;
    }

    const clipStart = transform.direction === 'left'
      ? bounds.x
      : bounds.x + bounds.width - visibleWidth;
    const clipEnd = clipStart + visibleWidth;

    if (next.type === 'text') {
      const textStart = next.x;
      const textEnd = next.x + Math.max(1, next.maxWidth);
      const visibleStart = Math.max(textStart, clipStart);
      const visibleEnd = Math.min(textEnd, clipEnd);
      if (visibleEnd <= visibleStart) {
        return null;
      }

      const trimLeft = Math.max(0, visibleStart - textStart);
      const trimRight = Math.max(0, textEnd - visibleEnd);
      next.text = next.text.slice(trimLeft, next.text.length - trimRight);
      next.x = visibleStart;
      next.maxWidth = Math.max(0, visibleEnd - visibleStart);
      return next.maxWidth > 0 && next.text.length > 0 ? next : null;
    }

    const commandStart = next.x;
    const commandEnd = next.x + Math.max(1, next.width);
    const visibleStart = Math.max(commandStart, clipStart);
    const visibleEnd = Math.min(commandEnd, clipEnd);
    if (visibleEnd <= visibleStart) {
      return null;
    }

    next.x = visibleStart;
    next.width = Math.max(0, visibleEnd - visibleStart);
    return next.width > 0 ? next : null;
  }

  const visibleHeight = Math.max(0, Math.round(bounds.height * progress));
  if (visibleHeight <= 0) {
    return null;
  }

  const clipStart = transform.direction === 'up'
    ? bounds.y
    : bounds.y + bounds.height - visibleHeight;
  const clipEnd = clipStart + visibleHeight;

  if (next.type === 'text') {
    return next.y >= clipStart && next.y < clipEnd ? next : null;
  }

  const commandStart = next.y;
  const commandEnd = next.y + Math.max(1, next.height);
  const visibleStart = Math.max(commandStart, clipStart);
  const visibleEnd = Math.min(commandEnd, clipEnd);
  if (visibleEnd <= visibleStart) {
    return null;
  }

  next.y = visibleStart;
  next.height = Math.max(0, visibleEnd - visibleStart);
  return next.height > 0 ? next : null;
}

function applyTransformsToCommand(
  command: DrawCommand,
  transforms: readonly CompositorTransform[],
  bounds: Bounds,
): DrawCommand | null {
  const tier = getMotionRuntimeState().qualityTier;
  let current: DrawCommand | null = command;

  for (const transform of transforms) {
    if (!current) {
      return null;
    }

    if (tier === 'skip') {
      if (transform.kind === 'fade' && clamp01(transform.opacity) <= 0) {
        return null;
      }
      if (transform.kind === 'reveal' && clamp01(transform.progress) <= 0) {
        return null;
      }
      continue;
    }

    if (tier === 'reduced' && transform.kind === 'shimmer') {
      continue;
    }

    switch (transform.kind) {
      case 'slide':
      case 'spring':
        current = applySlide(current, transform);
        break;
      case 'fade':
        current = applyFade(current, transform);
        break;
      case 'shimmer':
        current = applyShimmer(current, transform, bounds);
        break;
      case 'reveal':
        current = applyReveal(current, transform, bounds);
        break;
    }
  }

  return current;
}

export function applyCompositor(
  commands: readonly DrawCommand[],
  bindings: TransformMap,
): DrawCommand[] {
  if (commands.length === 0 || bindings.size === 0) {
    return [...commands];
  }

  const output: DrawCommand[] = [];

  for (const command of commands) {
    const keys = command.compositorKeys;
    if (!keys || keys.length === 0) {
      output.push(command);
      continue;
    }

    let current: DrawCommand | null = command;
    for (const key of keys) {
      if (!current) {
        break;
      }
      const binding = bindings.get(key);
      if (!binding || binding.transforms.length === 0) {
        continue;
      }

      current = applyTransformsToCommand(current, binding.transforms, binding.bounds);
    }

    if (current) {
      output.push(current);
    }
  }

  return output;
}
