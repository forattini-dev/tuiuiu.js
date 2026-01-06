# Waveform

Audio visualization component for displaying waveforms, spectrum analyzers, and equalizer-style visualizations.

<div align="center">

![Player Demo](../../recordings/examples/demo-player.gif)

*Tuiuiu Player with Waveform visualization*

</div>

## Overview

The Waveform component provides multiple visualization styles for audio data, from classic equalizer bars to oscilloscope displays. Perfect for music players, audio processing tools, and real-time monitoring dashboards.

## Import

```typescript
import {
  Waveform,
  WaveformBuffer,
  createWaveformBuffer,
  generateWaveformData,
  generateSpectrumData,
} from 'tuiuiu.js'
```

## Basic Usage

```typescript
// Simple equalizer bars
Waveform({
  data: [0.3, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8, 0.2],
  width: 40,
  height: 8,
  style: 'bars',
  color: 'success',
})
```

## Visualization Styles

### Bars (Equalizer)

Classic vertical bar visualization like an audio equalizer.

```typescript
Waveform({
  data: audioLevels,
  width: 40,
  height: 8,
  style: 'bars',
  color: 'success',
  colorHigh: 'warning',
  showPeaks: true,
  peakColor: 'error',
})
```

### Mirrored (SoundCloud-style)

Symmetrical waveform that grows from the center, like SoundCloud.

```typescript
Waveform({
  data: waveformData,
  width: 60,
  height: 10,
  style: 'mirrored',
  color: 'primary',
  colorHigh: 'info',
})
```

### Spectrum Analyzer

Frequency spectrum with color gradient from low to high frequencies.

```typescript
Waveform({
  data: fftData,
  width: 32,
  height: 8,
  style: 'spectrum',
  color: 'cyan',
  colorHigh: 'magenta',
})
```

### Waveform (Centered Line)

Traditional audio waveform with amplitude displayed around a center line.

```typescript
Waveform({
  data: audioSamples,
  width: 50,
  height: 8,
  style: 'waveform',
  color: 'primary',
})
```

### Oscilloscope

Continuous line plot like an oscilloscope display.

```typescript
Waveform({
  data: signalData,
  width: 50,
  height: 10,
  style: 'oscilloscope',
  color: 'success',
})
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `number[]` | required | Amplitude data (0-1 range or auto-normalized) |
| `width` | `number` | `40` | Width in characters |
| `height` | `number` | `8` | Height in rows |
| `style` | `WaveformStyle` | `'bars'` | Visualization style |
| `color` | `ColorValue` | `'success'` | Primary color for bars/waveform |
| `colorHigh` | `ColorValue` | - | Secondary color for gradient (top of bars) |
| `background` | `ColorValue` | - | Background color for empty space |
| `showPeaks` | `boolean` | `false` | Show peak indicators |
| `peakColor` | `ColorValue` | `'error'` | Peak indicator color |
| `min` | `number` | auto | Minimum value for normalization |
| `max` | `number` | auto | Maximum value for normalization |
| `barGap` | `number` | `0` | Gap between bars (bars style only) |
| `fillChar` | `string` | - | Custom fill character |
| `emptyChar` | `string` | - | Custom empty character |
| `border` | `boolean` | `false` | Show border around visualization |
| `borderColor` | `ColorValue` | `'border'` | Border color |

### WaveformStyle

```typescript
type WaveformStyle = 'bars' | 'waveform' | 'mirrored' | 'spectrum' | 'oscilloscope';
```

## WaveformBuffer

For real-time audio visualization, use `WaveformBuffer` to maintain smoothed data with peak detection.

```typescript
// Create buffer
const buffer = createWaveformBuffer({
  bins: 32,       // Number of frequency bins
  smoothing: 0.8, // Smoothing factor (0-1)
  peakDecay: 0.95 // Peak decay rate
});

// In your animation loop
function updateVisualization(audioData: number[]) {
  buffer.update(audioData);

  // Render with current data
  Waveform({
    data: buffer.data(),
    width: 32,
    height: 8,
    showPeaks: true,
  });
}
```

### WaveformBuffer Methods

| Method | Return | Description |
|--------|--------|-------------|
| `update(data)` | `void` | Update with new audio data |
| `data()` | `number[]` | Get current smoothed data |
| `peaks()` | `number[]` | Get peak values |
| `history()` | `number[]` | Get historical data for waveform display |
| `resetPeaks()` | `void` | Reset peak values |
| `clear()` | `void` | Clear all data |
| `toVNode(options)` | `VNode` | Create Waveform component with current data |

## Utility Functions

### generateWaveformData

Generate test/demo waveform data.

```typescript
const data = generateWaveformData(100, {
  frequency: 0.1,  // Base frequency
  noise: 0.2,      // Random noise (0-1)
  amplitude: 0.8,  // Amplitude (0-1)
});
```

### generateSpectrumData

Generate spectrum-like data with frequency falloff.

```typescript
const spectrum = generateSpectrumData(32, {
  peakBin: 8,      // Peak frequency bin
  spread: 10,      // Spread of the peak
  variation: 0.3,  // Random variation
});
```

## Examples

### Music Player Equalizer

```typescript
function PlayerEqualizer() {
  const buffer = createWaveformBuffer({ bins: 16, smoothing: 0.7 });

  useInterval(() => {
    // Simulate audio data (replace with real FFT data)
    const fakeAudio = generateSpectrumData(16, {
      peakBin: Math.floor(Math.random() * 8),
      variation: 0.4,
    });
    buffer.update(fakeAudio);
  }, 50);

  return Box(
    { borderStyle: 'round', padding: 1 },
    Waveform({
      data: buffer.data(),
      width: 32,
      height: 6,
      style: 'bars',
      color: 'success',
      colorHigh: 'warning',
      showPeaks: true,
    })
  );
}
```

### Real-time Audio Meter

```typescript
function AudioMeter() {
  const [levels, setLevels] = useState<number[]>([]);

  useInterval(() => {
    // Get audio levels from Web Audio API
    const newLevels = getAudioLevels();
    setLevels(newLevels);
  }, 16); // ~60fps

  return Waveform({
    data: levels(),
    width: 60,
    height: 10,
    style: 'mirrored',
    color: 'primary',
    colorHigh: 'info',
  });
}
```

### Spectrum Analyzer Dashboard

```typescript
function SpectrumDashboard() {
  return Box(
    { flexDirection: 'column', gap: 1 },
    Text({ bold: true }, 'Frequency Spectrum'),
    Waveform({
      data: fftData,
      width: 64,
      height: 8,
      style: 'spectrum',
      border: true,
    }),
    Box(
      { flexDirection: 'row', justifyContent: 'space-between' },
      Text({ color: 'muted' }, '20Hz'),
      Text({ color: 'muted' }, '1kHz'),
      Text({ color: 'muted' }, '20kHz'),
    )
  );
}
```

## Related

- [Sparkline](/components/viz/sparkline.md) - Inline mini charts
- [ProgressBar](/components/atoms/progress-bar.md) - Linear progress indicators
- [useInterval](/hooks/use-interval.md) - Timer hook for animations
