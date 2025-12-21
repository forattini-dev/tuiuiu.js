/**
 * Splash Screen - Animated loading/intro screen
 *
 * Features:
 * - Fade-in animation
 * - Logo display (text or ASCII art)
 * - Colored ASCII art support (via Picture component)
 * - Loading indicator (spinner or progress)
 * - Auto-dismiss with callback
 * - Customizable colors and timing
 */

import { Box, Text } from '../../primitives/nodes.js';
import { createSignal, createEffect } from '../../primitives/signal.js';
import { Spinner, type SpinnerStyle } from '../../design-system/feedback/spinner.js';
import { ProgressBar } from '../../design-system/feedback/progress-bar.js';
import { BigText, type BigTextFont } from './big-text.js';
import { ColoredPicture, type PixelGrid } from '../media/picture.js';
import type { VNode, ColorValue } from '../../utils/types.js';

// Re-export useful types and functions from Picture for convenience
export { parseColoredBBCode, type PixelGrid } from '../media/picture.js';

// =============================================================================
// Types
// =============================================================================

export interface SplashScreenOptions {
  /** Main title text */
  title?: string;
  /** Subtitle or tagline */
  subtitle?: string;
  /** ASCII art to display (overrides title BigText) */
  asciiArt?: string;
  /** BigText font for title */
  font?: BigTextFont;
  /** Primary color */
  color?: ColorValue;
  /** Secondary color for subtitle/spinner */
  secondaryColor?: ColorValue;
  /** Loading indicator type */
  loadingType?: 'spinner' | 'progress' | 'dots' | 'none';
  /** Spinner style (if loadingType is 'spinner') */
  spinnerStyle?: SpinnerStyle;
  /** Loading message */
  loadingMessage?: string;
  /** Auto-dismiss after ms (0 = manual) */
  duration?: number;
  /** Fade-in duration in ms */
  fadeInDuration?: number;
  /** Callback when splash completes */
  onComplete?: () => void;
  /** Show version */
  version?: string;
}

export interface SplashScreenState {
  /** Current opacity (0-1) for fade effect */
  opacity: () => number;
  /** Current progress (0-100) for progress bar */
  progress: () => number;
  /** Set progress manually */
  setProgress: (value: number) => void;
  /** Whether splash is visible */
  isVisible: () => boolean;
  /** Dismiss the splash screen */
  dismiss: () => void;
  /** Current frame for animations */
  frame: () => number;
}

// =============================================================================
// State Factory
// =============================================================================

/** Minimum duration in ms (0.7s) */
const MIN_DURATION = 700;

/**
 * Create splash screen state
 */
export function createSplashScreen(options: SplashScreenOptions = {}): SplashScreenState {
  const {
    duration = MIN_DURATION,
    fadeInDuration = 500,
    onComplete,
  } = options;

  // Ensure minimum duration
  const effectiveDuration = Math.max(duration, MIN_DURATION);

  const [opacity, setOpacity] = createSignal(0);
  const [progress, setProgress] = createSignal(0);
  const [isVisible, setIsVisible] = createSignal(true);
  const [frame, setFrame] = createSignal(0);

  let fadeInTimer: NodeJS.Timeout | null = null;
  let dismissTimer: NodeJS.Timeout | null = null;
  let frameTimer: NodeJS.Timeout | null = null;

  // Fade-in animation
  const fadeSteps = Math.max(1, Math.floor(fadeInDuration / 50));
  let currentStep = 0;

  fadeInTimer = setInterval(() => {
    currentStep++;
    setOpacity(Math.min(1, currentStep / fadeSteps));
    if (currentStep >= fadeSteps && fadeInTimer) {
      clearInterval(fadeInTimer);
      fadeInTimer = null;
    }
  }, 50);

  // Frame counter for spinner
  frameTimer = setInterval(() => {
    setFrame((f) => f + 1);
  }, 80);

  // Auto-dismiss
  if (effectiveDuration > 0) {
    // Auto-progress
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        const newProgress = p + (100 / (effectiveDuration / 50));
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return newProgress;
      });
    }, 50);

    dismissTimer = setTimeout(() => {
      dismiss();
    }, effectiveDuration);
  }

  function dismiss() {
    if (fadeInTimer) clearInterval(fadeInTimer);
    if (dismissTimer) clearTimeout(dismissTimer);
    if (frameTimer) clearInterval(frameTimer);
    setIsVisible(false);
    onComplete?.();
  }

  return {
    opacity,
    progress,
    setProgress,
    isVisible,
    dismiss,
    frame,
  };
}

// =============================================================================
// Component
// =============================================================================

export interface SplashScreenProps extends SplashScreenOptions {
  /** State from createSplashScreen */
  state?: SplashScreenState;
  /** Width (defaults to terminal width for fullscreen) */
  width?: number | string;
  /** Height (defaults to terminal height for fullscreen) */
  height?: number | string;
  /** Colored pixel grid (overrides asciiArt and title) - use parseColoredBBCode() */
  coloredArt?: PixelGrid;
}

/**
 * Splash Screen Component
 *
 * Layout:
 * - Image + subtitle centered both horizontally and vertically
 * - Loading indicator at the bottom with 1 line gap from terminal edge
 */
export function SplashScreen(props: SplashScreenProps): VNode | null {
  const {
    title = 'TUIUIU',
    subtitle,
    asciiArt,
    coloredArt,
    font = 'block',
    color = 'cyan',
    secondaryColor = 'gray',
    loadingType = 'spinner',
    spinnerStyle = 'dots',
    loadingMessage = 'Loading...',
    version,
    state,
    width,
    height,
  } = props;

  // Use provided state or create a simple visible state
  const isVisible = state?.isVisible?.() ?? true;
  const frame = state?.frame?.() ?? 0;
  const progress = state?.progress?.() ?? 0;

  if (!isVisible) return null;

  // Build center content (image + subtitle + version)
  // All elements need width: '100%' to allow justifyContent: 'center' to work
  const centerContent: VNode[] = [];

  // Colored pixel grid (highest priority)
  if (coloredArt) {
    centerContent.push(
      Box({ justifyContent: 'center', width: '100%' },
        ColoredPicture({ pixels: coloredArt })
      )
    );
  // ASCII art (second priority)
  } else if (asciiArt) {
    centerContent.push(
      Box({ justifyContent: 'center', width: '100%' },
        Text({ color }, asciiArt)
      )
    );
  // BigText title (fallback)
  } else {
    centerContent.push(
      Box({ justifyContent: 'center', width: '100%' },
        BigText({ text: title, font, color })
      )
    );
  }

  // Subtitle (1 line gap below image)
  if (subtitle) {
    centerContent.push(
      Box({ justifyContent: 'center', marginTop: 1, width: '100%' },
        Text({ color: secondaryColor }, subtitle)
      )
    );
  }

  // Version (below subtitle, on separate line)
  if (version) {
    centerContent.push(
      Box({ justifyContent: 'center', width: '100%' },
        Text({ color: secondaryColor, dim: true }, `v${version}`)
      )
    );
  }

  // Build loading indicator
  let loadingNode: VNode | null = null;
  if (loadingType === 'spinner') {
    loadingNode = Box(
      { justifyContent: 'center', alignItems: 'center', gap: 1 },
      Spinner({ style: spinnerStyle, color }),
      Text({ color: secondaryColor }, loadingMessage)
    );
  } else if (loadingType === 'progress') {
    loadingNode = Box(
      { flexDirection: 'column', alignItems: 'center', gap: 1, width: 40 },
      ProgressBar({
        value: progress,
        width: 30,
        showPercentage: true,
        color,
      }),
      Text({ color: secondaryColor }, loadingMessage)
    );
  } else if (loadingType === 'dots') {
    const dots = '.'.repeat((frame % 4));
    loadingNode = Box(
      { justifyContent: 'center' },
      Text({ color: secondaryColor }, `${loadingMessage}${dots}`)
    );
  }

  // Get terminal dimensions for fullscreen
  const termWidth = process.stdout.columns || 80;
  const termHeight = process.stdout.rows || 24;

  // Layout strategy:
  // - Top spacer (flexGrow: 1) pushes content down
  // - Center content (image + subtitle)
  // - Bottom spacer (flexGrow: 1) pushes content up
  // - Loading fixed at bottom
  // The two spacers with equal flexGrow center the content vertically
  return Box(
    {
      flexDirection: 'column',
      width: width ?? termWidth,
      height: height ?? termHeight,
    },
    // Top spacer
    Box({ flexGrow: 1 }),
    // Center content (image + subtitle) - each child handles its own centering
    Box(
      {
        flexDirection: 'column',
        width: '100%',
      },
      ...centerContent
    ),
    // Bottom spacer
    Box({ flexGrow: 1 }),
    // Loading at bottom with 1 line gap from terminal edge
    loadingNode
      ? Box(
          { justifyContent: 'center', width: '100%', marginBottom: 1 },
          loadingNode
        )
      : Box({})
  );
}

// =============================================================================
// Preset Splash Screens
// =============================================================================

/**
 * Tuiuiu branded splash screen
 */
export function TuiuiuSplash(props: Omit<SplashScreenProps, 'title' | 'asciiArt'> = {}): VNode | null {
  const TUIUIU_LOGO = `
████████╗██╗   ██╗██╗██╗   ██╗██╗██╗   ██╗
╚══██╔══╝██║   ██║██║██║   ██║██║██║   ██║
   ██║   ██║   ██║██║██║   ██║██║██║   ██║
   ██║   ██║   ██║██║██║   ██║██║██║   ██║
   ██║   ╚██████╔╝██║╚██████╔╝██║╚██████╔╝
  ╚═╝    ╚═════╝ ╚═╝ ╚═════╝ ╚═╝ ╚═════╝
`.trim();

  return SplashScreen({
    asciiArt: TUIUIU_LOGO,
    subtitle: 'Zero-dependency Terminal UI',
    color: 'cyan',
    secondaryColor: 'gray',
    loadingType: 'spinner',
    spinnerStyle: 'dots',
    loadingMessage: 'Initializing...',
    ...props,
  });
}

/**
 * Minimal splash screen
 */
export function MinimalSplash(props: SplashScreenProps): VNode | null {
  return SplashScreen({
    font: 'small',
    loadingType: 'dots',
    secondaryColor: 'gray',
    ...props,
  });
}

/**
 * Progress splash screen
 */
export function ProgressSplash(props: SplashScreenProps): VNode | null {
  return SplashScreen({
    loadingType: 'progress',
    ...props,
  });
}
