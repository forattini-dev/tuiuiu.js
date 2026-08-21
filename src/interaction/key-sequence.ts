const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  return: 'enter',
  del: 'delete',
  ins: 'insert',
  pgup: 'pageup',
  pgdn: 'pagedown',
  command: 'meta',
  cmd: 'meta',
  option: 'alt',
  control: 'ctrl',
};

export interface KeyChord {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

/** Parse one canonical command chord such as `ctrl+shift+p`. */
export function parseKeyChord(value: string): KeyChord {
  const chord: KeyChord = {
    key: '',
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
  };
  for (const rawPart of value.split('+')) {
    const part = KEY_ALIASES[rawPart.trim().toLowerCase()] ?? rawPart.trim().toLowerCase();
    if (part === 'ctrl') chord.ctrl = true;
    else if (part === 'alt') chord.alt = true;
    else if (part === 'shift') chord.shift = true;
    else if (part === 'meta') chord.meta = true;
    else chord.key = part;
  }
  if (!chord.key) throw new TypeError(`Invalid key chord: "${value}"`);
  return chord;
}

/** Format a chord for shortcut hints without registering any input state. */
export function formatKeyChord(value: string, platform = process.platform): string {
  const chord = parseKeyChord(value);
  const parts: string[] = [];
  if (chord.ctrl) parts.push(platform === 'darwin' ? '⌘' : 'Ctrl');
  if (chord.alt) parts.push(platform === 'darwin' ? '⌥' : 'Alt');
  if (chord.shift) parts.push(platform === 'darwin' ? '⇧' : 'Shift');
  if (chord.meta) parts.push(platform === 'darwin' ? '⌘' : 'Meta');
  const key = chord.key.length === 1
    ? chord.key.toUpperCase()
    : chord.key.charAt(0).toUpperCase() + chord.key.slice(1);
  parts.push(key);
  return platform === 'darwin' ? parts.join('') : parts.join('+');
}

/** Format a sequence such as `g g` or a single chord. */
export function formatKeySequence(keys: string | readonly string[]): string {
  const sequence = Array.isArray(keys) ? keys : [keys];
  return sequence.map((key) => formatKeyChord(key)).join(' ');
}
