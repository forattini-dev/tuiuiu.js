#!/usr/bin/env node
/**
 * Tuiuiu Player - Modern Terminal Music Player
 *
 * A sleek, modern Winamp-inspired music player with:
 * - Beautiful centered playback controls
 * - Animated spectrum visualizer
 * - Scrollable playlist
 * - Volume and progress controls
 * - Theme switching
 *
 * Run: pnpm tsx examples/tuiuiu-player.ts
 */

import {
  render,
  Box,
  Text,
  Spacer,
  batch,
  useInteraction,
  useApp,
  setTheme,
  useTheme,
  resolveColor,
  useState,
  useEffect,
  useConst,
} from '../src/index.js';
import { Waveform, getNextTheme } from '../src/ui/index.js';
import { orangeTheme } from '../src/themes/index.js';

// Set orange theme as default
setTheme(orangeTheme);
import { useTerminalSize } from '../src/hooks/index.js';
import type { VNode, ColorValue } from '../src/utils/types.js';

// ============================================================================
// Types
// ============================================================================

interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
}

// ============================================================================
// Sample Playlist
// ============================================================================

const PLAYLIST: Track[] = [
  { id: 1, title: 'Neon Dreams', artist: 'Synthwave Collective', album: 'Digital Horizons', duration: 234 },
  { id: 2, title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', duration: 243 },
  { id: 3, title: 'Electric Feel', artist: 'MGMT', album: 'Oracular Spectacular', duration: 229 },
  { id: 4, title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: 200 },
  { id: 5, title: 'Take On Me', artist: 'a-ha', album: 'Hunting High and Low', duration: 225 },
  { id: 6, title: 'Blue Monday', artist: 'New Order', album: 'Power, Corruption & Lies', duration: 442 },
  { id: 7, title: 'Sweet Dreams', artist: 'Eurythmics', album: 'Sweet Dreams', duration: 216 },
  { id: 8, title: 'Africa', artist: 'Toto', album: 'Toto IV', duration: 295 },
  { id: 9, title: 'Everybody Wants to Rule the World', artist: 'Tears for Fears', album: 'Songs from the Big Chair', duration: 251 },
  { id: 10, title: 'Running Up That Hill', artist: 'Kate Bush', album: 'Hounds of Love', duration: 298 },
  { id: 11, title: 'Personal Jesus', artist: 'Depeche Mode', album: 'Violator', duration: 296 },
  { id: 12, title: 'Enjoy the Silence', artist: 'Depeche Mode', album: 'Violator', duration: 256 },
];

// ============================================================================
// Utility Functions
// ============================================================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + '…';
}

// ============================================================================
// Album Cover (Vinyl Disc)
// ============================================================================

function AlbumCover(props: { isPlaying: boolean }): VNode {
  const { isPlaying } = props;
  const discColor: ColorValue = 'primary';
  const borderColor: ColorValue = isPlaying ? 'warning' : 'border';
  const centerColor: ColorValue = isPlaying ? 'warning' : 'muted';

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor,
      paddingX: 1,
    },
    Text({ color: discColor }, '  ██████  '),
    Text({ color: discColor }, '██████████'),
    Box(
      { flexDirection: 'row' },
      Text({ color: discColor }, '███'),
      Text({ color: centerColor, bold: isPlaying }, ' ◉◉ '),
      Text({ color: discColor }, '███')
    ),
    Text({ color: discColor }, '██████████'),
    Text({ color: discColor }, '  ██████  ')
  );
}


// ============================================================================
// Progress Bar
// ============================================================================

function ProgressBar(props: { current: number; total: number; width: number }): VNode {
  const { current, total, width } = props;
  const timeWidth = 10; // "0:00" on each side
  const barWidth = Math.max(10, width - timeWidth - 4);
  const progress = total > 0 ? current / total : 0;
  const filledWidth = Math.floor(progress * barWidth);
  const emptyWidth = barWidth - filledWidth - 1;

  const currentTimeStr = formatTime(current);
  const totalTimeStr = formatTime(total);
  const filledBar = '━'.repeat(Math.max(0, filledWidth));
  const emptyBar = '─'.repeat(Math.max(0, emptyWidth));

  // Single line string for proper centering
  const progressLine = `${currentTimeStr} ${filledBar}●${emptyBar} ${totalTimeStr}`;

  return Text({ color: 'primary' }, progressLine);
}

// ============================================================================
// Volume Bar (Header)
// ============================================================================

function VolumeBar(props: { volume: number; isMuted: boolean; compact?: boolean; width?: number }): VNode {
  const { volume, isMuted, compact = false, width } = props;
  const icon = isMuted ? '🔇' : volume > 66 ? '🔊' : volume > 33 ? '🔉' : '🔈';
  const barWidth = width ?? 8;
  const filled = Math.floor((volume / 100) * barWidth);

  if (compact) {
    // Super compact version - just icon + bar + percentage
    return Box(
      { flexDirection: 'row', alignItems: 'center' },
      Text({ color: isMuted ? 'muted' : 'foreground' }, `${icon} `),
      Text({ color: isMuted ? 'muted' : 'primary' }, '━'.repeat(filled)),
      Text({ color: 'border' }, '─'.repeat(barWidth - filled)),
      Text({ color: isMuted ? 'muted' : 'foreground' }, ` ${volume}%`)
    );
  }

  return Box(
    { flexDirection: 'row', gap: 1, alignItems: 'center' },
    Text({}, icon),
    Text({ color: isMuted ? 'muted' : 'success' }, '█'.repeat(filled)),
    Text({ color: 'border' }, '░'.repeat(barWidth - filled)),
    Text({ color: isMuted ? 'muted' : 'foreground' }, `${volume}%`.padStart(4))
  );
}

// ============================================================================
// Volume Visualizer (using Waveform component)
// ============================================================================

function VolumeVisualizer(props: { volume: number; isMuted: boolean; width?: number }): VNode {
  const { volume, isMuted, width = 24 } = props;

  // Generate sine wave pattern scaled by volume
  const data = Array.from({ length: width }, (_, i) => {
    const wave = Math.sin((i / width) * Math.PI);
    return isMuted ? 0.05 : wave * (volume / 100);
  });

  const color: ColorValue = isMuted ? 'muted' : volume > 80 ? 'error' : volume > 50 ? 'warning' : 'success';

  return Waveform({
    data,
    width,
    height: 6,
    style: 'mirrored',
    color,
    colorHigh: volume > 80 ? 'error' : 'warning',
  });
}

// ============================================================================
// Spectrum Analyzer (Dynamic using Waveform component)
// ============================================================================

function SpectrumAnalyzer(props: {
  data: number[];
  isPlaying: boolean;
  width?: number;
  height?: number;
}): VNode {
  const { data, isPlaying, width = 32 } = props;

  // Block characters from low to high
  const barChars = '▁▂▃▄▅▆▇█';

  // Build colored spectrum line
  const chars: VNode[] = [];
  for (let i = 0; i < width && i < data.length; i++) {
    const value = isPlaying ? (data[i] ?? 0.1) : 0.1;
    // Map value (0-1) to character index (0-7)
    const charIndex = Math.floor(value * (barChars.length - 1));
    const char = barChars[Math.max(0, Math.min(charIndex, barChars.length - 1))];

    // Color based on height: green (low), yellow (mid), orange (high)
    const color = value > 0.7 ? 'warning' : value > 0.4 ? 'success' : 'primary';
    chars.push(Text({ color }, char!));
  }

  return Box(
    { flexDirection: 'row', justifyContent: 'center' },
    ...chars
  );
}

/**
 * Generate simulated spectrum data with musical patterns
 */
function generateSpectrumFrame(bins: number, beat: number): number[] {
  return Array.from({ length: bins }, (_, i) => {
    // Create more dynamic bars that vary significantly
    const bassFreq = Math.sin(beat * 4) * 0.5 + 0.5; // Bass pulse
    const midFreq = Math.sin(beat * 2 + i * 0.3) * 0.4;
    const highFreq = Math.sin(beat * 6 + i * 0.5) * 0.3;
    const random = Math.random() * 0.25;

    // Bass bars (left) should pulse more, highs (right) flicker
    const bassWeight = Math.max(0, 1 - i / (bins * 0.4));
    const value = (bassFreq * bassWeight * 0.6) + midFreq + highFreq + random + 0.3;

    // Clamp to 0.1 - 1.0 range for visible variation
    return Math.max(0.15, Math.min(1, value));
  });
}

// ============================================================================
// Now Playing Info
// ============================================================================

/**
 * Create track info as a single component
 */
function TrackInfo(props: { track: Track | null; isPlaying: boolean; maxWidth: number }): VNode {
  const { track, isPlaying, maxWidth } = props;

  if (!track) {
    return Text({ color: 'mutedForeground' }, '♪ Select a track ♪');
  }

  const frame = Math.floor(Date.now() / 400) % 4;
  const notes = ['♪', '♫', '♬', '♩'];
  const note = isPlaying ? notes[frame] : '♪';

  // Center-pad each line for display
  const centerPad = (s: string) => {
    const truncated = truncate(s, maxWidth);
    const padding = Math.floor((maxWidth - truncated.length) / 2);
    return ' '.repeat(Math.max(0, padding)) + truncated;
  };

  const notesLine = centerPad(`${note} ${note}`);
  const titleLine = centerPad(track.title);
  const artistLine = centerPad(track.artist);
  const albumLine = centerPad(track.album);

  // Return as separate Text elements in a fragment-like structure
  return Box(
    { flexDirection: 'column' },
    Text({ color: isPlaying ? 'success' : 'muted' }, notesLine),
    Text({ color: 'foreground', bold: true }, titleLine),
    Text({ color: 'accent' }, artistLine),
    Text({ color: 'mutedForeground', dim: true }, albumLine)
  );
}

// ============================================================================
// Playlist Item
// ============================================================================

function PlaylistItem(props: {
  track: Track;
  index: number;
  isSelected: boolean;
  isCurrent: boolean;
  isPlaying: boolean;
  width: number;
  onClick?: () => void;
}): VNode {
  const { track, index, isSelected, isCurrent, isPlaying, width, onClick } = props;

  const numWidth = 4;
  const durationWidth = 6;
  const availableWidth = width - numWidth - durationWidth - 8;
  const artistWidth = Math.floor(availableWidth * 0.35);
  const titleWidth = availableWidth - artistWidth;

  const statusIcon = isCurrent ? (isPlaying ? '▶' : '■') : ' ';
  const bgColor: ColorValue | undefined = isSelected ? 'primary' : isCurrent ? 'muted' : undefined;
  const fgColor: ColorValue = isSelected ? 'primaryForeground' : 'foreground';

  const num = `${(index + 1).toString().padStart(2)}`;
  const title = truncate(track.title, titleWidth).padEnd(titleWidth);
  const artist = truncate(track.artist, artistWidth).padEnd(artistWidth);
  const duration = formatTime(track.duration);

  return Box(
    { flexDirection: 'row', backgroundColor: bgColor, paddingX: 1, onClick },
    Text({ color: isSelected ? 'primaryForeground' : 'mutedForeground' }, `${num} `),
    Text({ color: isCurrent && !isSelected ? 'success' : fgColor, bold: isCurrent }, `${statusIcon} `),
    Text({ color: fgColor, bold: isCurrent }, title),
    Text({ color: isSelected ? 'primaryForeground' : 'mutedForeground' }, artist),
    Spacer({}),
    Text({ color: isSelected ? 'primaryForeground' : 'mutedForeground' }, duration)
  );
}

// ============================================================================
// Mirrored Waveform - 7 rows, bars grow from center outward
// ============================================================================
//
//      n4:     ▏      <- level 4 only (top) - uses colorHigh
//      n3:    ▏▏      <- level 3+
//      n2:   ▏▏▏      <- level 2+
// n0 & n1: ─▏▏▏▏      <- center: ─ for level 0, ▏ for 1+
//     n-2:   ▏▏▏      <- level 2+ (mirror)
//     n-3:    ▏▏      <- level 3+ (mirror)
//     n-4:     ▏      <- level 4 only (bottom) - uses colorHigh
//
// Levels: 0 (center line), 1 (center bar), 2 (3 rows), 3 (5 rows), 4 (7 rows)

function AudacityWaveform(props: {
  data: number[];
  width: number;
  height?: number;
  color?: ColorValue;
  colorHigh?: ColorValue;
  isPlaying: boolean;
}): VNode {
  const { data, width, color = 'primary', colorHigh = 'warning', isPlaying } = props;

  // Ensure we have enough data
  const paddedData = data.length >= width
    ? data.slice(0, width)
    : [...data, ...Array(width - data.length).fill(0).map(() => 0.5)];

  const BAR_CHAR = '▏';
  const CENTER_LINE = '─'; // Subtle center reference line
  const HEIGHT = 7;
  const CENTER = 3; // Row index 3 is the center (0-indexed)

  // Pre-calculate levels for each column
  const levels: number[] = paddedData.map(value => {
    if (value < 0.08) return 0;      // Silent/line
    if (value < 0.25) return 1;      // Single bar
    if (value < 0.50) return 2;      // 3 rows
    if (value < 0.75) return 3;      // 5 rows
    return 4;                         // Full height (7 rows)
  });

  const rows: VNode[] = [];

  // Build 7 rows (top to bottom: n4, n3, n2, center, n-2, n-3, n-4)
  for (let row = 0; row < HEIGHT; row++) {
    const distFromCenter = Math.abs(row - CENTER); // 3, 2, 1, 0, 1, 2, 3
    const isEdgeRow = distFromCenter === 3; // Top or bottom row

    // Build segments with color changes for efficiency
    const segments: { text: string; segColor: ColorValue }[] = [];
    let currentText = '';
    let currentColor: ColorValue = color;

    for (let col = 0; col < width; col++) {
      const level = levels[col]!;
      const barReach = level - 1; // -1, 0, 1, 2, 3
      let char: string;
      let charColor: ColorValue;

      if (!isPlaying) {
        // Paused: show center line only
        char = row === CENTER ? CENTER_LINE : ' ';
        charColor = 'border'; // Use border color - always visible
      } else if (level === 0) {
        // Level 0: center line reference
        char = row === CENTER ? CENTER_LINE : ' ';
        charColor = 'border'; // Use border color - always visible
      } else if (distFromCenter <= barReach) {
        // Bar is visible at this row
        char = BAR_CHAR;
        // Use highlight color for peak bars (level 4, edge rows)
        charColor = (level === 4 && isEdgeRow) ? colorHigh : color;
      } else {
        // Empty space
        char = ' ';
        charColor = color;
      }

      // Accumulate same-color characters
      if (charColor === currentColor) {
        currentText += char;
      } else {
        if (currentText) {
          segments.push({ text: currentText, segColor: currentColor });
        }
        currentText = char;
        currentColor = charColor;
      }
    }

    // Push last segment
    if (currentText) {
      segments.push({ text: currentText, segColor: currentColor });
    }

    // Render row with colored segments
    if (segments.length === 1) {
      rows.push(Text({ color: segments[0]!.segColor }, segments[0]!.text));
    } else {
      rows.push(
        Box(
          { flexDirection: 'row' },
          ...segments.map((seg, i) => Text({ key: i.toString(), color: seg.segColor }, seg.text))
        )
      );
    }
  }

  return Box({ flexDirection: 'column' }, ...rows);
}

/**
 * Generate waveform snapshot with realistic audio envelope
 *
 * Features:
 * - Strong edge tapering (start/end are always low)
 * - Random "phrases" of high/low activity with gaps between
 * - Micro-texture within phrases for natural variation
 * - Occasional silence sections
 * - Each call generates completely new data
 */
function generateAudacityWaveform(length: number, isPlaying: boolean, playbackTime: number = 0): number[] {
  // Create fresh array each time
  const data = new Array<number>(length);

  if (!isPlaying) {
    // Paused: flat center line (level 0)
    for (let i = 0; i < length; i++) {
      data[i] = 0;
    }
    return data;
  }

  // === INTRO: First second is silence ===
  if (playbackTime < 1.0) {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 0.05;
    }
    return data;
  }

  // === FADE-IN: 1s to 4s ===
  const fadeProgress = Math.min(1, (playbackTime - 1.0) / 3.0);
  const fadeMult = fadeProgress * (2 - fadeProgress); // easeOutQuad

  // === Generate random "phrase" pattern for this frame ===
  // Each frame has 3-6 random phrases (bursts of activity)
  const numPhrases = 3 + Math.floor(Math.random() * 4); // 3-6 phrases
  const phrases: { center: number; width: number; intensity: number; hasGap: boolean }[] = [];

  for (let p = 0; p < numPhrases; p++) {
    phrases.push({
      center: 0.1 + Math.random() * 0.8, // 0.1-0.9 (avoid edges)
      width: 0.08 + Math.random() * 0.18, // 8-26% of width
      intensity: 0.4 + Math.random() * 0.6, // 0.4-1.0
      hasGap: Math.random() > 0.7, // 30% chance of gap after phrase
    });
  }

  // Sort phrases by center for gap calculation
  phrases.sort((a, b) => a.center - b.center);

  // === Generate each bar ===
  for (let i = 0; i < length; i++) {
    const pos = i / length; // 0 to 1

    // === FORCE CENTER LINE AT EDGES (first/last 10%) ===
    if (pos < 0.10 || pos > 0.90) {
      data[i] = 0; // Force level 0 (center line)
      continue;
    }

    // === CHECK FOR SILENCE GAPS ===
    let inGap = false;
    for (let p = 0; p < phrases.length - 1; p++) {
      const current = phrases[p]!;
      const next = phrases[p + 1]!;
      if (current.hasGap) {
        const gapStart = current.center + current.width;
        const gapEnd = next.center - next.width;
        if (pos > gapStart && pos < gapEnd) {
          inGap = true;
          break;
        }
      }
    }

    if (inGap) {
      // Silence gap - center line
      data[i] = 0;
      continue;
    }

    // === EDGE ENVELOPE: Tapering near the 10% boundaries ===
    const edgeLeft = Math.min(1, (pos - 0.10) * 5); // 0 at 10%, 1 at 30%
    const edgeRight = Math.min(1, (0.90 - pos) * 5); // 1 at 70%, 0 at 90%
    const envelope = Math.min(edgeLeft, edgeRight);

    // === PHRASE CONTRIBUTION ===
    let phraseValue = 0.15; // base minimum (level 1)
    for (const phrase of phrases) {
      const dist = Math.abs(pos - phrase.center);
      if (dist < phrase.width) {
        // Gaussian-like falloff within phrase
        const t = dist / phrase.width;
        const gaussianFalloff = Math.exp(-t * t * 3);
        const contribution = gaussianFalloff * phrase.intensity;
        phraseValue = Math.max(phraseValue, contribution);
      }
    }

    // === MICRO-TEXTURE: Small rapid variations ===
    const microTexture = 0.85 + Math.random() * 0.3;

    // === RANDOM SPIKES: Occasional high peaks ===
    const spike = Math.random() > 0.92 ? 1.3 : 1.0;

    // === COMBINE ALL FACTORS ===
    const raw = envelope * phraseValue * microTexture * spike * fadeMult;

    // Clamp to [0, 1]
    data[i] = Math.max(0, Math.min(1, raw));
  }

  return data;
}

// ============================================================================
// Main Player
// ============================================================================

function TuiuiuPlayer(): VNode {
  const app = useApp();
  const { columns: termWidth, rows: termHeight } = useTerminalSize();
  const theme = useTheme();

  // State - using useState to persist across re-renders
  const [playlist] = useState(PLAYLIST);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [focusedControl, setFocusedControl] = useState(2);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [mode, setMode] = useState<'playlist' | 'controls'>('playlist');

  // Runtime counters
  const [updateRate, setUpdateRate] = useState(0);
  const [renderRate, setRenderRate] = useState(0);
  const runtimeCounters = useConst(() => ({
    renderedFrames: 0,
    renderedSinceLastSample: 0,
  }));
  runtimeCounters.renderedFrames++;
  runtimeCounters.renderedSinceLastSample++;

  // Spectrum analyzer state
  const SPECTRUM_BINS = 32;
  // Initialize with some variation so it looks good immediately
  const [spectrumData, setSpectrumData] = useState<number[]>(
    Array.from({ length: SPECTRUM_BINS }, (_, i) => 0.3 + Math.sin(i * 0.5) * 0.3)
  );
  const [beat, setBeat] = useState(0);

  // Waveform data for Audacity-style visualization - start flat
  const [waveformData, setWaveformData] = useState<number[]>(
    generateAudacityWaveform(60, true, 0) // Start flat (time=0 means fade-in not started)
  );

  // Animated note icon (controlled by signal instead of Date.now())
  const [noteFrame, setNoteFrame] = useState(0);

  const currentTrack = (): Track | null => {
    const tracks = playlist();
    const idx = currentTrackIndex();
    return idx >= 0 && idx < tracks.length ? tracks[idx]! : null;
  };

  // Animation loop - handles both spectrum/waveform animation AND playback timer
  // Using useEffect to persist across re-renders (createEffect would reset on each render)
  useEffect(() => {
    let lastPlaybackTick = Date.now();
    let frameCount = 0;
    let lastFpsUpdate = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const playing = isPlaying();

      // === UPDATE / RENDER RATE COUNTERS ===
      frameCount++;
      if (now - lastFpsUpdate >= 1000) {
        setUpdateRate(frameCount);
        setRenderRate(runtimeCounters.renderedSinceLastSample);
        frameCount = 0;
        runtimeCounters.renderedSinceLastSample = 0;
        lastFpsUpdate = now;
      }

      // === PLAYBACK TIMER + WAVEFORM (every ~100ms) ===
      if (now - lastPlaybackTick >= 100) {
        lastPlaybackTick = now;

        // Update waveform - new snapshot every 0.1s
        const waveWidth = Math.max(20, Math.floor((termWidth * 0.45 - 6) * 0.9));
        setWaveformData(generateAudacityWaveform(waveWidth, playing, currentTime()));

        // Update playback time
        if (playing) {
          const track = currentTrack();
          if (track) {
            // Round to 1 decimal place to avoid floating point drift
            const newTime = Math.round((currentTime() + 0.1) * 10) / 10;

            if (newTime >= track.duration) {
              // Track ended - use batch to update both states atomically
              if (repeatMode() === 'one') {
                setCurrentTime(0);
              } else if (currentTrackIndex() < playlist().length - 1) {
                // Go to next track
                batch(() => {
                  setCurrentTrackIndex((i) => i + 1);
                  setCurrentTime(0);
                });
              } else if (repeatMode() === 'all') {
                // Loop back to first track
                batch(() => {
                  setCurrentTrackIndex(0);
                  setCurrentTime(0);
                });
              } else {
                // Stop at end
                batch(() => {
                  setIsPlaying(false);
                  setCurrentTime(track.duration);
                });
              }
            } else {
              setCurrentTime(newTime);
            }
          }
        }
      }

      // === SPECTRUM ANIMATION (still runs every frame for smooth animation) ===
      setBeat(b => b + 0.15);
      if (playing) {
        setSpectrumData(generateSpectrumFrame(SPECTRUM_BINS, beat()));
        setNoteFrame(f => (f + 1) % 28);
      } else {
        setSpectrumData(Array(SPECTRUM_BINS).fill(0.1));
      }
    }, 16); // ~60Hz nominal update loop

    return () => clearInterval(interval);
  });

  // Input handling
  useInteraction((event) => {
    if (event.type !== 'key') return;
    const input = event.key.text;
    const key = event.key.native;
    if (mode() === 'playlist') {
      if (key.upArrow || input === 'k') {
        setSelectedIndex((i) => Math.max(0, i - 1));
      } else if (key.downArrow || input === 'j') {
        setSelectedIndex((i) => Math.min(playlist().length - 1, i + 1));
      } else if (key.return) {
        batch(() => {
          setCurrentTrackIndex(selectedIndex());
          setCurrentTime(0);
          setIsPlaying(true);
        });
      } else if (key.tab) {
        setMode('controls');
      }
    } else {
      if (key.leftArrow || input === 'h') {
        setFocusedControl((i) => Math.max(0, i - 1));
      } else if (key.rightArrow || input === 'l') {
        setFocusedControl((i) => Math.min(4, i + 1));
      } else if (key.return || input === ' ') {
        const focused = focusedControl();
        if (focused === 0) setIsShuffled((s) => !s);
        else if (focused === 1) batch(() => { setCurrentTrackIndex((i) => Math.max(0, i - 1)); setCurrentTime(0); });
        else if (focused === 2) setIsPlaying((p) => !p);
        else if (focused === 3) batch(() => { setCurrentTrackIndex((i) => Math.min(playlist().length - 1, i + 1)); setCurrentTime(0); });
        else if (focused === 4) setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'));
      } else if (key.tab) {
        setMode('playlist');
      }
    }

    // Global shortcuts
    if (input === ' ' && mode() === 'playlist') setIsPlaying((p) => !p);
    else if (input === '+' || input === '=') setVolume((v) => Math.min(100, v + 5));
    else if (input === '-' || input === '_') setVolume((v) => Math.max(0, v - 5));
    else if (input === 'm') setIsMuted((m) => !m);
    else if (input === 'n') batch(() => { setCurrentTrackIndex((i) => Math.min(playlist().length - 1, i + 1)); setCurrentTime(0); });
    else if (input === 'p') batch(() => { setCurrentTrackIndex((i) => Math.max(0, i - 1)); setCurrentTime(0); });
    else if (input === 's') setIsShuffled((s) => !s);
    else if (input === 'r') setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'));
    else if (input === 't') setTheme(getNextTheme(theme));
    else if (input === 'q' || key.escape) app.exit();
  });

  // Layout dimensions
  const leftColumnWidth = Math.floor(termWidth * 0.45); // 45% for left column
  const rightColumnWidth = termWidth - leftColumnWidth - 6; // Rest for playlist
  const waveformWidth = Math.max(20, Math.floor((leftColumnWidth - 6) * 0.9)); // 90% of inner width

  // Calculate playlist height - should fill available space
  // Header (1) + padding (2) + footer (1) + volume (1) = 5 lines overhead
  const playlistHeight = termHeight - 5;

  const track = currentTrack();

  // Calculate which tracks to show - fill available height
  const playlistVisibleCount = Math.max(5, playlistHeight - 3); // -3 for border + header
  const halfVisible = Math.floor(playlistVisibleCount / 2);
  let visibleStart = Math.max(0, selectedIndex() - halfVisible);
  const visibleEnd = Math.min(playlist().length, visibleStart + playlistVisibleCount);
  if (visibleEnd - visibleStart < playlistVisibleCount) {
    visibleStart = Math.max(0, visibleEnd - playlistVisibleCount);
  }
  const visibleTracks = playlist().slice(visibleStart, visibleEnd);

  // Click handlers
  const handleShuffle = () => setIsShuffled((s) => !s);
  const handlePrev = () => batch(() => { setCurrentTrackIndex((i) => Math.max(0, i - 1)); setCurrentTime(0); });
  const handlePlayPause = () => setIsPlaying((p) => !p);
  const handleNext = () => batch(() => { setCurrentTrackIndex((i) => Math.min(playlist().length - 1, i + 1)); setCurrentTime(0); });
  const handleRepeat = () => setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'));

  return Box(
    { flexDirection: 'column', height: termHeight },

    // Header
    Box(
      { flexDirection: 'row', backgroundColor: 'primary', paddingX: 2 },
      Text({ color: 'primaryForeground', bold: true }, '🎵 TUIUIU PLAYER'),
      Spacer({}),
      Text({ color: 'primaryForeground', dim: true }, `${updateRate()} upd`),
      Text({ color: 'primaryForeground', dim: true }, ` • `),
      Text({ color: 'primaryForeground', dim: true }, `${renderRate()} rnd`),
      Text({ color: 'primaryForeground', dim: true }, ` • `),
      Text({ color: 'primaryForeground', dim: true }, `[${theme.name}]`)
    ),

    // Main content - Two columns
    Box(
      { flexDirection: 'row', paddingX: 1, paddingY: 0, gap: 1, flexGrow: 1 },

      // LEFT COLUMN (bordered)
      Box(
        {
          flexDirection: 'column',
          borderStyle: 'round',
          borderColor: mode() === 'controls' ? 'primary' : 'border',
          paddingX: 1,
          paddingBottom: 1,
          width: leftColumnWidth,
          alignItems: 'center',
        },

        // 1. CD (album cover)
        AlbumCover({ isPlaying: isPlaying() }),

        // 2. Song, Artist, Album
        track ? Text({ color: 'foreground', bold: true }, truncate(track.title, leftColumnWidth - 6)) : null,
        track ? Text({ color: 'accent' }, truncate(track.artist, leftColumnWidth - 6)) : null,
        track ? Text({ color: 'mutedForeground', dim: true }, truncate(track.album, leftColumnWidth - 6)) : null,
        !track ? Text({ color: 'mutedForeground' }, '♪ Select a track ♪') : null,

        // 3. Waveform (80% width) - 7 linhas espelhadas
        AudacityWaveform({
          data: waveformData(),
          width: Math.floor(leftColumnWidth * 0.8),
          color: 'primary',
          colorHigh: 'warning', // Peaks get highlight color
          isPlaying: isPlaying(),
        }),

        // 4. Progress bar
        track ? ProgressBar({ current: currentTime(), total: track.duration, width: leftColumnWidth - 8 }) : null,

        // 5. Controls - simple text (clicks handled by keyboard)
        Text({ color: 'primary', bold: true },
          `◄◄  ${isShuffled() ? '●' : '○'}  ${isPlaying() ? '▐▐' : '►►'}  ${repeatMode() !== 'off' ? '●' : '○'}  ►►`
        )
      ),

      // RIGHT COLUMN: Playlist + Volume below
      Box(
        { flexDirection: 'column', flexGrow: 1 },

        // Playlist card
        Box(
          {
            flexDirection: 'column',
            borderStyle: mode() === 'playlist' ? 'round' : 'single',
            borderColor: mode() === 'playlist' ? 'primary' : 'border',
            flexGrow: 1,
          },

          // Playlist header
          Box(
            { flexDirection: 'row', backgroundColor: 'muted', paddingX: 1 },
            Text({ color: 'foreground', bold: true }, '📋 PLAYLIST'),
            Spacer({}),
            Text({ color: 'mutedForeground' }, `${playlist().length} tracks`)
          ),

          // Playlist items
          ...visibleTracks.map((t, i) => {
            const trackIndex = visibleStart + i;
            return PlaylistItem({
              track: t,
              index: trackIndex,
              isSelected: mode() === 'playlist' && selectedIndex() === trackIndex,
              isCurrent: currentTrackIndex() === trackIndex,
              isPlaying: isPlaying(),
              width: rightColumnWidth - 4,
              onClick: () => batch(() => {
                setCurrentTrackIndex(trackIndex);
                setCurrentTime(0);
                setIsPlaying(true);
              }),
            });
          }),

          // Spacer to push content up
          Spacer({})
        ),

        // Volume bar - right below playlist card
        Box(
          { flexDirection: 'row', paddingX: 1, marginTop: 0 },
          VolumeBar({ volume: volume(), isMuted: isMuted(), compact: true, width: rightColumnWidth - 2 })
        )
      )
    ),

    // Footer
    Box(
      { flexDirection: 'row', backgroundColor: 'muted', paddingX: 1 },
      Text({ color: 'foreground' }, '[Space] Play'),
      Text({ color: 'mutedForeground' }, ' │ '),
      Text({ color: 'foreground' }, '[n/p] Skip'),
      Text({ color: 'mutedForeground' }, ' │ '),
      Text({ color: 'foreground' }, '[+/-] Vol'),
      Text({ color: 'mutedForeground' }, ' │ '),
      Text({ color: 'foreground' }, '[m] Mute'),
      Text({ color: 'mutedForeground' }, ' │ '),
      Text({ color: 'foreground' }, '[Tab] Mode'),
      Text({ color: 'mutedForeground' }, ' │ '),
      Text({ color: 'foreground' }, '[t] Theme'),
      Text({ color: 'mutedForeground' }, ' │ '),
      Text({ color: 'foreground' }, '[q] Quit')
    )
  );
}

// ============================================================================
// Run
// ============================================================================

const { waitUntilExit } = render(TuiuiuPlayer, {
  autoTabNavigation: false,
  screen: 'fullscreen', // Use clear-and-redraw mode instead of incremental (fixes accumulation bug)
  maxFps: 60,
});
await waitUntilExit();
