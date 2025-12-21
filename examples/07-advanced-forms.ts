/**
 * Advanced Forms Example
 *
 * Showcases form components:
 * - MultiSelect
 * - Autocomplete
 * - RadioGroup
 * - Switch
 * - Slider
 * - RangeSlider
 *
 * Run with: npx tsx examples/07-advanced-forms.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useInput,
  useApp,
  MultiSelect,
  Autocomplete,
  RadioGroup,
  Switch,
  Slider,
  RangeSlider,
  Divider,
  setTheme,
  darkTheme,
} from '../src/index.js';

// Apply dark theme
setTheme(darkTheme);

type FormStep = 'interests' | 'search' | 'options' | 'settings' | 'range' | 'done';

function AdvancedFormsDemo() {
  const app = useApp();
  const [step, setStep] = useState<FormStep>('interests');
  const [interests, setInterests] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [theme, setThemeChoice] = useState<string>('dark');
  const [notifications, setNotifications] = useState(true);
  const [volume, setVolume] = useState(50);
  const [priceRange, setPriceRange] = useState<[number, number]>([100, 500]);

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      app.exit();
    }
  });

  const interestItems = [
    { label: 'Technology', value: 'tech' },
    { label: 'Sports', value: 'sports' },
    { label: 'Music', value: 'music' },
    { label: 'Travel', value: 'travel' },
    { label: 'Food & Cooking', value: 'food' },
    { label: 'Gaming', value: 'gaming' },
    { label: 'Art & Design', value: 'art' },
    { label: 'Science', value: 'science' },
  ];

  const cities = [
    { label: 'New York, USA', value: 'nyc' },
    { label: 'London, UK', value: 'london' },
    { label: 'Tokyo, Japan', value: 'tokyo' },
    { label: 'Paris, France', value: 'paris' },
    { label: 'Sydney, Australia', value: 'sydney' },
    { label: 'Berlin, Germany', value: 'berlin' },
    { label: 'Toronto, Canada', value: 'toronto' },
    { label: 'Singapore', value: 'singapore' },
    { label: 'Dubai, UAE', value: 'dubai' },
    { label: 'Sao Paulo, Brazil', value: 'saopaulo' },
  ];

  const themeOptions = [
    { label: 'Dark Mode', value: 'dark' },
    { label: 'Light Mode', value: 'light' },
    { label: 'System Default', value: 'system' },
  ];

  const renderStep = () => {
    switch (step()) {
      case 'interests':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Step 1: Select Your Interests'),
          Text({ color: 'gray', marginBottom: 1 }, 'Use arrows to navigate, space to select, enter to confirm'),
          MultiSelect({
            items: interestItems,
            selected: interests(),
            maxSelected: 4,
            fuzzySearch: true,
            onSubmit: (selected) => {
              setInterests(selected);
              setStep('search');
            },
          })
        );

      case 'search':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Step 2: Search for Your City'),
          Text({ color: 'gray', marginBottom: 1 }, 'Type to search, use arrows to select'),
          Autocomplete({
            items: cities,
            placeholder: 'Type a city name...',
            onSelect: (item) => {
              setSelectedCity(item.label);
              setStep('options');
            },
          })
        );

      case 'options':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Step 3: Choose Your Theme'),
          Text({ color: 'gray', marginBottom: 1 }, 'Use arrows to select, enter to confirm'),
          RadioGroup({
            options: themeOptions,
            selected: theme(),
            onChange: (value) => {
              setThemeChoice(value);
            },
            onSubmit: () => {
              setStep('settings');
            },
          })
        );

      case 'settings':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Step 4: Configure Settings'),
          Box(
            { flexDirection: 'row', marginBottom: 1 },
            Text({}, 'Notifications: '),
            Switch({
              value: notifications(),
              onChange: (val) => setNotifications(val),
            })
          ),
          Box(
            { flexDirection: 'column', marginTop: 1 },
            Text({}, `Volume: ${volume()}%`),
            Slider({
              value: volume(),
              min: 0,
              max: 100,
              step: 5,
              width: 30,
              onChange: (val) => setVolume(val),
              onSubmit: () => setStep('range'),
            })
          ),
          Text({ color: 'gray', dim: true, marginTop: 1 }, 'Use arrows to adjust, enter to continue')
        );

      case 'range':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Step 5: Set Price Range'),
          Text({}, `Range: $${priceRange()[0]} - $${priceRange()[1]}`),
          RangeSlider({
            value: priceRange(),
            min: 0,
            max: 1000,
            step: 50,
            width: 40,
            onChange: (range) => setPriceRange(range),
            onSubmit: () => setStep('done'),
          }),
          Text({ color: 'gray', dim: true, marginTop: 1 }, 'Tab to switch thumbs, arrows to adjust')
        );

      case 'done':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'green', bold: true, marginBottom: 1 }, 'Form Complete!'),
          Divider({}),
          Text({ marginTop: 1 }, `Interests: ${interests().join(', ') || 'None'}`),
          Text({}, `City: ${selectedCity || 'Not selected'}`),
          Text({}, `Theme: ${theme()}`),
          Text({}, `Notifications: ${notifications() ? 'Enabled' : 'Disabled'}`),
          Text({}, `Volume: ${volume()}%`),
          Text({}, `Price Range: $${priceRange()[0]} - $${priceRange()[1]}`),
          Divider({}),
          Text({ color: 'gray', dim: true, marginTop: 1 }, 'Press Q or ESC to exit')
        );
    }
  };

  // Progress indicator
  const steps: FormStep[] = ['interests', 'search', 'options', 'settings', 'range', 'done'];
  const currentIndex = steps.indexOf(step());

  return Box(
    {
      flexDirection: 'column',
      padding: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    },
    // Header with progress
    Box(
      { marginBottom: 1 },
      Text({ color: 'cyan', bold: true }, ' Advanced Forms Demo '),
      Text({ color: 'gray' }, ` (${currentIndex + 1}/${steps.length})`)
    ),

    // Progress bar
    Box(
      { marginBottom: 1 },
      ...steps.map((s, i) =>
        Text(
          {
            color: i <= currentIndex ? 'cyan' : 'gray',
            dim: i > currentIndex,
          },
          i <= currentIndex ? '●' : '○'
        )
      )
    ),

    Divider({}),

    // Current step content
    Box({ marginTop: 1, minHeight: 10 }, renderStep())
  );
}

// Run the demo
const { waitUntilExit } = render(AdvancedFormsDemo);
await waitUntilExit();
