/**
 * Animation Documentation
 *
 * Comprehensive guide to Tuiuiu's animation system including
 * pixel art animations, spring physics, and transitions.
 */

import type { ComponentDoc } from '../types.js';

export const animation: ComponentDoc[] = [
  {
    name: 'AnimatedPicture',
    category: 'animation',
    description: `Animated pixel art with 9 built-in effects. Perfect for logos, loading states, alerts, and visual feedback.

**Animation Types:**
- \`pulse\` - Fast brightness oscillation (attention-grabbing)
- \`breathe\` - Slow, smooth breathing (ambient, idle)
- \`blink\` - Hard on/off toggle (warnings)
- \`fadeIn\` - Gradual appearance (splash screens, entry)
- \`fadeOut\` - Gradual disappearance (exit animations)
- \`glow\` - Subtle brightness variation (ambient highlights)
- \`shimmer\` - Wave of brightness across image (loading)
- \`rainbow\` - Cycle through spectrum colors (celebration)
- \`glitch\` - Random distortion (error states, retro)

**Key Features:**
- Runs at ~60fps using setInterval
- Supports 5 easing functions
- Programmatic play/pause/stop control
- Loop or one-shot animations
- Brightness range control (0-1)`,
    props: [
      { name: 'pixels', type: 'PixelGrid', required: true, description: 'Pixel grid to animate (from createPixelGrid or createPixelGridFromColors)' },
      { name: 'animation', type: 'PictureAnimation', required: false, default: "'pulse'", description: 'Animation type: pulse | breathe | blink | fadeIn | fadeOut | glow | shimmer | rainbow | glitch | none' },
      { name: 'duration', type: 'number', required: false, default: '1500', description: 'Animation cycle duration in milliseconds' },
      { name: 'minBrightness', type: 'number', required: false, default: '0.2', description: 'Minimum brightness (0 = black, 1 = full)' },
      { name: 'maxBrightness', type: 'number', required: false, default: '1.0', description: 'Maximum brightness' },
      { name: 'easing', type: 'AnimationEasing', required: false, default: "'sine'", description: 'Easing: linear | ease-in | ease-out | ease-in-out | sine' },
      { name: 'loop', type: 'boolean', required: false, default: 'true', description: 'Loop animation continuously' },
      { name: 'autoPlay', type: 'boolean', required: false, default: 'true', description: 'Start animation automatically' },
      { name: 'onCycleComplete', type: '() => void', required: false, description: 'Callback when animation cycle completes' },
    ],
    examples: [
      `// Pulsing alert icon
const alert = createPixelGridFromColors([
  [null, 'red', null],
  ['red', 'red', 'red'],
  [null, 'red', null],
]);

AnimatedPicture({
  pixels: alert,
  animation: 'pulse',
  duration: 1000,
  minBrightness: 0.3,
})`,
      `// Loading shimmer bar
const bar = createPixelGridFromColors([
  ['cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan'],
]);

AnimatedPicture({
  pixels: bar,
  animation: 'shimmer',
  duration: 1500,
  minBrightness: 0.2,
})`,
      `// Celebration rainbow
AnimatedPicture({
  pixels: starGrid,
  animation: 'rainbow',
  duration: 2000,
})`,
      `// Error glitch effect
AnimatedPicture({
  pixels: errorIcon,
  animation: 'glitch',
  duration: 500,
})`,
    ],
    relatedComponents: ['createAnimatedPicture', 'ColoredPicture', 'createPixelGrid'],
  },
  {
    name: 'createAnimatedPicture',
    category: 'animation',
    description: `Create an animation controller for programmatic control over pixel art animations.

**Returns an object with:**
- \`play()\` - Start animation
- \`pause()\` - Pause at current frame
- \`stop()\` - Stop and reset to initial state
- \`setAnimation(type)\` - Change animation type
- \`setBrightness(value)\` - Manual brightness (0-1)
- \`pixels()\` - Get current processed PixelGrid
- \`isPlaying()\` - Check if animation is running
- \`progress()\` - Get animation progress (0-1)
- \`brightness()\` - Get current brightness value

**Important Notes:**
- For fadeIn, brightness starts at minBrightness
- For fadeOut, brightness starts at maxBrightness
- When loop=false, animation stops after one cycle
- Call stop() on cleanup to prevent memory leaks`,
    props: [
      { name: 'pixels', type: 'PixelGrid', required: true, description: 'Source pixel grid' },
      { name: 'animation', type: 'PictureAnimation', required: false, default: "'pulse'", description: 'Initial animation type' },
      { name: 'duration', type: 'number', required: false, default: '1500', description: 'Cycle duration in ms' },
      { name: 'minBrightness', type: 'number', required: false, default: '0.2', description: 'Minimum brightness' },
      { name: 'maxBrightness', type: 'number', required: false, default: '1.0', description: 'Maximum brightness' },
      { name: 'easing', type: 'AnimationEasing', required: false, default: "'sine'", description: 'Easing function' },
      { name: 'loop', type: 'boolean', required: false, default: 'true', description: 'Loop animation' },
      { name: 'autoPlay', type: 'boolean', required: false, default: 'true', description: 'Start automatically' },
      { name: 'onCycleComplete', type: '() => void', required: false, description: 'Called each cycle' },
    ],
    examples: [
      `// Basic usage
const anim = createAnimatedPicture({
  pixels: myGrid,
  animation: 'breathe',
  duration: 3000,
});

// In render loop
ColoredPicture({ pixels: anim.pixels() })`,
      `// Manual control
const anim = createAnimatedPicture({
  pixels: logo,
  animation: 'pulse',
  autoPlay: false,
});

// Start when needed
anim.play();

// Pause on blur
anim.pause();

// Change animation
anim.setAnimation('shimmer');

// Stop on cleanup
anim.stop();`,
      `// Splash screen fade-in
const splash = createAnimatedPicture({
  pixels: logo,
  animation: 'fadeIn',
  duration: 800,
  minBrightness: 0.3,
  maxBrightness: 1.0,
  loop: false,
  easing: 'ease-out',
  onCycleComplete: () => {
    // Switch to main app
    showMainContent();
  },
});`,
    ],
    relatedComponents: ['AnimatedPicture', 'ColoredPicture'],
  },
  {
    name: 'SplashScreen',
    category: 'animation',
    description: `Animated splash/loading screen with built-in fade-in animation support.

**Features:**
- Fade-in animation for colored pixel art
- Loading indicators (spinner, progress, dots)
- Auto-dismiss with duration
- BigText or ASCII art support
- Centered layout with subtitle/version`,
    props: [
      { name: 'title', type: 'string', required: false, description: 'Main title (uses BigText)' },
      { name: 'subtitle', type: 'string', required: false, description: 'Subtitle text' },
      { name: 'coloredArt', type: 'PixelGrid', required: false, description: 'Colored pixel art (overrides title)' },
      { name: 'fadeInDuration', type: 'number', required: false, default: '800', description: 'Fade-in duration in ms' },
      { name: 'fadeInStartBrightness', type: 'number', required: false, default: '0.3', description: 'Starting brightness (0-1)' },
      { name: 'animateFadeIn', type: 'boolean', required: false, default: 'true', description: 'Enable fade-in animation' },
      { name: 'duration', type: 'number', required: false, default: '700', description: 'Auto-dismiss after ms (min 700)' },
      { name: 'loadingType', type: "'spinner' | 'progress' | 'dots' | 'none'", required: false, default: "'spinner'", description: 'Loading indicator type' },
      { name: 'version', type: 'string', required: false, description: 'Version to display' },
      { name: 'onComplete', type: '() => void', required: false, description: 'Called when splash completes' },
    ],
    examples: [
      `// Basic splash with fade-in
const splash = createSplashScreen({
  duration: 2000,
  onComplete: () => showApp(),
});

SplashScreen({
  title: 'My App',
  subtitle: 'Loading...',
  state: splash,
})`,
      `// Colored art with fade-in
ImpactSplashScreen({
  birdArt: TUIUIU_BIRD_COLORED,
  fadeInDuration: 800,
  fadeInStartBrightness: 0.3,
  subtitle: 'Terminal UI Framework',
  version: '1.0.0',
  loadingType: 'spinner',
})`,
    ],
    relatedComponents: ['AnimatedPicture', 'createAnimatedPicture', 'BigText'],
  },
  {
    name: 'useAnimation',
    category: 'animation',
    description: `Frame-based animation hook. Runs at ~60fps with easing support.

**Returns:**
- \`start()\` - Start animation
- \`stop()\` - Cancel animation
- \`pause()\` - Pause at current progress
- \`resume()\` - Resume from paused state
- \`isRunning()\` - Check if running
- \`progress()\` - Current progress (0-1)`,
    props: [
      { name: 'duration', type: 'number', required: true, description: 'Animation duration in ms' },
      { name: 'easing', type: 'string | (t: number) => number', required: false, default: "'linear'", description: 'Easing function' },
      { name: 'onFrame', type: '(progress: number) => void', required: true, description: 'Called each frame with progress 0-1' },
      { name: 'onComplete', type: '() => void', required: false, description: 'Called when animation completes' },
      { name: 'onCancel', type: '() => void', required: false, description: 'Called when animation is cancelled' },
    ],
    examples: [
      `// Animate counter
const anim = useAnimation({
  duration: 500,
  easing: 'ease-out',
  onFrame: (p) => setCount(Math.round(p * 100)),
  onComplete: () => console.log('Done!'),
});

anim.start();`,
      `// Custom easing
useAnimation({
  duration: 300,
  easing: (t) => t * t * t,  // cubic ease-in
  onFrame: (p) => setValue(p),
});`,
    ],
    relatedComponents: ['useTransition', 'createSpring'],
  },
  {
    name: 'createSpring',
    category: 'animation',
    description: `Physics-based spring animation. More natural than easing for interactions.

**Parameters:**
- \`stiffness\` - Higher = faster oscillation (default: 170)
- \`damping\` - Higher = less bouncy (default: 26)
- \`mass\` - Higher = more inertia (default: 1)

**Returns:**
- \`start(from, to, onFrame, onComplete)\` - Start spring
- \`stop()\` - Cancel
- \`setTarget(value)\` - Change target mid-animation`,
    props: [
      { name: 'stiffness', type: 'number', required: false, default: '170', description: 'Spring stiffness' },
      { name: 'damping', type: 'number', required: false, default: '26', description: 'Damping factor' },
      { name: 'mass', type: 'number', required: false, default: '1', description: 'Mass' },
      { name: 'threshold', type: 'number', required: false, default: '0.01', description: 'Velocity threshold to stop' },
    ],
    examples: [
      `// Bouncy button
const spring = createSpring({
  stiffness: 180,
  damping: 12,
});

spring.start(0, 100, (value) => setWidth(value));`,
      `// Change target mid-animation
spring.setTarget(150);`,
    ],
    relatedComponents: ['createHarmonicaSpring', 'useAnimation'],
  },
  {
    name: 'createHarmonicaSpring',
    category: 'animation',
    description: `Intuitive frequency/damping spring model (inspired by Charm's Harmonica).

**Parameters:**
- \`frequency\` - Higher = snappier (7-15 for UI)
- \`damping\` - 0=bouncy, 1=critical, >1=overdamped

**Guidelines:**
| Use Case | Frequency | Damping |
|----------|-----------|---------|
| Subtle UI | 7 | 0.75 |
| Snappy buttons | 10 | 0.85 |
| Bouncy elements | 8 | 0.5 |
| Smooth scroll | 5 | 0.9 |`,
    props: [
      { name: 'fps', type: 'number', required: false, default: '60', description: 'Target frame rate' },
      { name: 'frequency', type: 'number', required: false, default: '7', description: 'Oscillation frequency' },
      { name: 'damping', type: 'number', required: false, default: '0.75', description: 'Damping ratio' },
    ],
    examples: [
      `// Snappy button press
const spring = createHarmonicaSpring({
  frequency: 10,
  damping: 0.85,
});

spring.start(1, 0.9, setScale, onPress);`,
      `// Bouncy element
const bouncy = createHarmonicaSpring({
  frequency: 8,
  damping: 0.5,
});

bouncy.start(0, 100, setOffset);
bouncy.impulse(50);  // Add velocity`,
    ],
    relatedComponents: ['createSpring', 'useAnimation'],
  },
  {
    name: 'useTransition',
    category: 'animation',
    description: `Manage enter/exit animations for showing/hiding components.

**States:** entering | entered | exiting | exited

**Effects:** fade | slide-up | slide-down | slide-left | slide-right | scale | none`,
    props: [
      { name: 'show', type: 'boolean', required: true, description: 'Whether component should be visible' },
      { name: 'enter', type: 'TransitionEffect', required: false, default: "'fade'", description: 'Enter animation' },
      { name: 'exit', type: 'TransitionEffect', required: false, default: "'fade'", description: 'Exit animation' },
      { name: 'duration', type: 'number', required: false, default: '200', description: 'Animation duration in ms' },
      { name: 'easing', type: 'string', required: false, default: "'ease-out'", description: 'Easing function' },
      { name: 'onEnterComplete', type: '() => void', required: false, description: 'Called when enter completes' },
      { name: 'onExitComplete', type: '() => void', required: false, description: 'Called when exit completes' },
    ],
    examples: [
      `// Fade-in modal
function Modal({ visible }) {
  const { state, progress, shouldRender } = useTransition({
    show: visible,
    enter: 'fade',
    exit: 'fade',
    duration: 300,
  });

  if (!shouldRender()) return null;

  return Box(
    { opacity: progress() },
    Text({}, 'Modal Content')
  );
}`,
    ],
    relatedComponents: ['useAnimation', 'createSwipeTransition'],
  },
];

/**
 * Animation timing recommendations
 */
export const animationTimingGuide = `
## Animation Timing Guidelines

| Animation Type | Recommended Duration | Notes |
|----------------|---------------------|-------|
| **Pixel Art Effects** | | |
| pulse | 1000-2000ms | Fast attention-grabbing |
| breathe | 3000-5000ms | Slow, ambient |
| blink | 500-1000ms | Quick on/off |
| fadeIn/fadeOut | 500-1000ms | Entry/exit |
| shimmer | 1000-2000ms | Loading indicator |
| rainbow | 2000-4000ms | Celebration |
| glitch | 300-800ms | Error, retro |
| **UI Transitions** | | |
| Button press | 100-200ms | Snappy feedback |
| Modal enter | 200-300ms | Not too slow |
| Page transition | 300-500ms | Smooth navigation |
| Toast notification | 150-200ms | Quick appear |
| **Spring Settings** | | |
| Subtle UI | freq: 7, damp: 0.75 | Most common |
| Snappy buttons | freq: 10, damp: 0.85 | Responsive |
| Bouncy elements | freq: 8, damp: 0.5 | Playful |

## Brightness Guidelines

| Use Case | Min Brightness | Max Brightness |
|----------|---------------|----------------|
| Subtle glow | 0.7 | 1.0 |
| Normal pulse | 0.3-0.5 | 1.0 |
| Strong blink | 0.1 | 1.0 |
| Fade in/out | 0.2-0.4 | 1.0 |
| Shimmer | 0.3 | 1.0 |

## Performance Tips

1. **Stop animations on cleanup** - Prevent memory leaks
2. **Use \`autoPlay: false\`** - Start only when visible
3. **Keep durations short** - 150-400ms for UI
4. **Prefer springs for interactions** - More natural feel
5. **AnimatedPicture runs at ~60fps** - Efficient but be mindful
`;
