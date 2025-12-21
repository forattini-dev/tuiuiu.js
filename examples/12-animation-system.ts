/**
 * Animation System Example
 *
 * Showcases animation capabilities:
 * - Spring physics animations
 * - Harmonica-style springs
 * - Easing functions
 * - Composite transitions
 * - Real-time animation controls
 *
 * Run with: npx tsx examples/12-animation-system.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useEffect,
  useInput,
  useApp,
  createSpring,
  createHarmonicaSpring,
  easingFunctions,
  Divider,
  setTheme,
  darkTheme,
  ProgressBar,
} from '../src/index.js';

// Apply dark theme
setTheme(darkTheme);

type AnimationType = 'spring' | 'harmonica' | 'easing' | 'bounce';

function AnimationDemo() {
  const app = useApp();
  const [activeDemo, setActiveDemo] = useState<AnimationType>('spring');

  // Spring animation state
  const [springValue, setSpringValue] = useState(0);
  const [springTarget, setSpringTarget] = useState(100);
  const [springRunning, setSpringRunning] = useState(false);

  // Harmonica spring state
  const [harmonicaValue, setHarmonicaValue] = useState(0);
  const [harmonicaRunning, setHarmonicaRunning] = useState(false);

  // Easing animation state
  const [easingProgress, setEasingProgress] = useState(0);
  const [selectedEasing, setSelectedEasing] = useState<keyof typeof easingFunctions>('easeInOutCubic');
  const [easingRunning, setEasingRunning] = useState(false);

  // Bounce animation state
  const [bounceY, setBounceY] = useState(0);
  const [bounceRunning, setBounceRunning] = useState(false);

  // Spring animation effect
  useEffect(() => {
    if (!springRunning()) return;

    const spring = createSpring({
      from: springValue(),
      to: springTarget(),
      stiffness: 120,
      damping: 14,
      mass: 1,
      onUpdate: (value) => setSpringValue(value),
      onComplete: () => setSpringRunning(false),
    });

    spring.start();
    return () => spring.stop();
  });

  // Harmonica spring effect
  useEffect(() => {
    if (!harmonicaRunning()) return;

    const spring = createHarmonicaSpring({
      from: harmonicaValue(),
      to: harmonicaValue() > 50 ? 0 : 100,
      frequency: 3,
      damping: 0.5,
      onUpdate: (value) => setHarmonicaValue(value),
      onComplete: () => setHarmonicaRunning(false),
    });

    spring.start();
    return () => spring.stop();
  });

  // Easing animation effect
  useEffect(() => {
    if (!easingRunning()) return;

    const startTime = Date.now();
    const duration = 2000;
    const easeFn = easingFunctions[selectedEasing()];

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeFn(t);
      setEasingProgress(eased * 100);

      if (t < 1) {
        setTimeout(animate, 16);
      } else {
        setEasingRunning(false);
      }
    };

    animate();
  });

  // Bounce animation effect
  useEffect(() => {
    if (!bounceRunning()) return;

    const spring = createSpring({
      from: 0,
      to: 8,
      stiffness: 200,
      damping: 10,
      mass: 0.8,
      onUpdate: (value) => setBounceY(Math.abs(value)),
      onComplete: () => {
        setBounceY(0);
        setBounceRunning(false);
      },
    });

    spring.start();
    return () => spring.stop();
  });

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      app.exit();
    }
    if (input === '1') setActiveDemo('spring');
    if (input === '2') setActiveDemo('harmonica');
    if (input === '3') setActiveDemo('easing');
    if (input === '4') setActiveDemo('bounce');

    // Demo-specific controls
    if (input === ' ') {
      switch (activeDemo()) {
        case 'spring':
          setSpringTarget(springTarget() === 100 ? 0 : 100);
          setSpringRunning(true);
          break;
        case 'harmonica':
          setHarmonicaRunning(true);
          break;
        case 'easing':
          setEasingProgress(0);
          setEasingRunning(true);
          break;
        case 'bounce':
          setBounceRunning(true);
          break;
      }
    }

    // Cycle through easing functions
    if (input === 'e' && activeDemo() === 'easing') {
      const easings = Object.keys(easingFunctions) as (keyof typeof easingFunctions)[];
      const currentIndex = easings.indexOf(selectedEasing());
      const nextIndex = (currentIndex + 1) % easings.length;
      setSelectedEasing(easings[nextIndex]);
    }
  });

  // Create a visual bar representation
  const renderBar = (value: number, maxWidth: number, char = '█', color = 'cyan') => {
    const width = Math.round((value / 100) * maxWidth);
    const bar = char.repeat(Math.max(0, width));
    const empty = '░'.repeat(Math.max(0, maxWidth - width));
    return Text({ color }, bar + Text({ color: 'gray' }, empty).props.children);
  };

  const renderDemo = () => {
    switch (activeDemo()) {
      case 'spring':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Spring Physics Animation'),
          Text({ color: 'gray', marginBottom: 1 },
            'Realistic spring motion with stiffness=120, damping=14'),
          Box(
            { marginBottom: 1 },
            Text({ color: 'white' }, `Value: ${springValue().toFixed(1)}%`)
          ),
          Box(
            { marginBottom: 1 },
            ProgressBar({
              value: springValue(),
              total: 100,
              width: 40,
              showPercentage: true,
              color: 'cyan',
            })
          ),
          Box(
            { height: 3, alignItems: 'center' },
            Text({ color: 'yellow' }, ' '.repeat(Math.round(springValue() / 100 * 38)) + '●')
          ),
          Text({ color: 'gray', dim: true, marginTop: 1 },
            `Target: ${springTarget()}% | Running: ${springRunning() ? 'Yes' : 'No'}`)
        );

      case 'harmonica':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'magenta', bold: true, marginBottom: 1 }, 'Harmonica-Style Spring'),
          Text({ color: 'gray', marginBottom: 1 },
            'Musical spring with frequency=3Hz, damping=0.5'),
          Box(
            { marginBottom: 1 },
            Text({ color: 'white' }, `Value: ${harmonicaValue().toFixed(1)}%`)
          ),
          Box(
            { marginBottom: 1 },
            ProgressBar({
              value: harmonicaValue(),
              total: 100,
              width: 40,
              showPercentage: true,
              color: 'magenta',
            })
          ),
          // Oscillating visual
          Box(
            { height: 5, flexDirection: 'column' },
            ...Array.from({ length: 5 }, (_, i) => {
              const center = 20;
              const amplitude = (harmonicaValue() / 100) * 15;
              const phase = (i / 4) * Math.PI;
              const offset = Math.sin(phase) * amplitude;
              return Text(
                { color: 'magenta' },
                ' '.repeat(Math.round(center + offset)) + '●'
              );
            })
          ),
          Text({ color: 'gray', dim: true, marginTop: 1 },
            `Running: ${harmonicaRunning() ? 'Yes' : 'No'}`)
        );

      case 'easing':
        const easingNames: (keyof typeof easingFunctions)[] = [
          'linear', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad',
          'easeInCubic', 'easeOutCubic', 'easeInOutCubic',
          'easeInElastic', 'easeOutElastic', 'easeOutBounce'
        ];

        return Box(
          { flexDirection: 'column' },
          Text({ color: 'green', bold: true, marginBottom: 1 }, 'Easing Functions'),
          Text({ color: 'gray', marginBottom: 1 },
            `Current: ${selectedEasing()} | Press [E] to cycle`),
          Box(
            { marginBottom: 1 },
            Text({ color: 'white' }, `Progress: ${easingProgress().toFixed(1)}%`)
          ),
          Box(
            { marginBottom: 1 },
            ProgressBar({
              value: easingProgress(),
              total: 100,
              width: 40,
              showPercentage: true,
              color: 'green',
            })
          ),
          // Show easing curve preview
          Box(
            { flexDirection: 'column', marginTop: 1 },
            Text({ color: 'gray' }, 'Available easings:'),
            Box(
              { flexDirection: 'row', flexWrap: 'wrap', width: 50 },
              ...easingNames.map(name =>
                Text(
                  {
                    color: name === selectedEasing() ? 'green' : 'gray',
                    marginRight: 1
                  },
                  name === selectedEasing() ? `[${name}]` : name
                )
              )
            )
          )
        );

      case 'bounce':
        const ballY = Math.round(bounceY());
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'yellow', bold: true, marginBottom: 1 }, 'Bounce Animation'),
          Text({ color: 'gray', marginBottom: 1 },
            'Spring-based bounce with elastic rebound'),
          Box(
            { height: 10, flexDirection: 'column' },
            ...Array.from({ length: 9 }, (_, i) => {
              const row = 8 - i;
              const showBall = row === ballY;
              return Box(
                { height: 1 },
                Text({ color: 'gray' }, '│'),
                Text({ color: showBall ? 'yellow' : 'gray' },
                  showBall ? ' ●' : '  ')
              );
            }),
            Box(
              {},
              Text({ color: 'gray' }, '└' + '─'.repeat(20))
            )
          ),
          Text({ color: 'gray', dim: true, marginTop: 1 },
            `Height: ${ballY} | Running: ${bounceRunning() ? 'Yes' : 'No'}`)
        );

      default:
        return Text({}, 'Select a demo');
    }
  };

  return Box(
    {
      flexDirection: 'column',
      padding: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    },
    // Header
    Box(
      { marginBottom: 1 },
      Text({ color: 'cyan', bold: true }, ' Animation System Demo ')
    ),

    // Navigation
    Box(
      { marginBottom: 1 },
      Text({ color: activeDemo() === 'spring' ? 'cyan' : 'gray' }, '[1] Spring  '),
      Text({ color: activeDemo() === 'harmonica' ? 'magenta' : 'gray' }, '[2] Harmonica  '),
      Text({ color: activeDemo() === 'easing' ? 'green' : 'gray' }, '[3] Easing  '),
      Text({ color: activeDemo() === 'bounce' ? 'yellow' : 'gray' }, '[4] Bounce')
    ),

    Divider({}),

    // Demo content
    Box({ marginTop: 1, minHeight: 15 }, renderDemo()),

    // Footer
    Box(
      { marginTop: 1 },
      Text({ color: 'gray', dim: true }, '[SPACE] Animate  [1-4] Switch demo  [Q] Exit')
    )
  );
}

// Run the demo
const { waitUntilExit } = render(AnimationDemo);
await waitUntilExit();
