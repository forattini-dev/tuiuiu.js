/**
 * Canonical terminal mouse-protocol decoder.
 *
 * Coordinates are normalized to zero-based cells. The parser consumes one
 * event from the beginning of a string and reports its length so callers can
 * safely process batched terminal input.
 */

export type MouseProtocolButton =
  | 'left'
  | 'right'
  | 'middle'
  | 'scroll-up'
  | 'scroll-down'
  | 'none';

export type MouseProtocolAction = 'click' | 'drag' | 'release' | 'move';

export interface MouseProtocolEvent {
  x: number;
  y: number;
  button: MouseProtocolButton;
  action: MouseProtocolAction;
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  };
  pixelX?: number;
  pixelY?: number;
}

export interface MouseProtocolResult {
  event: MouseProtocolEvent;
  length: number;
}

const SGR_PIXEL_MOUSE_RE = /^\x1b\[<(\d+);(\d+);(\d+);(\d+);(\d+)([Mm])/;
const SGR_MOUSE_RE = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])/;
const X10_MOUSE_RE = /^\x1b\[M([\x00-\xff])([\x00-\xff])([\x00-\xff])/;
const URXVT_MOUSE_RE = /^\x1b\[(\d+);(\d+);(\d+)M/;

function parseSafeInteger(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function decodeMouseEvent(
  buttonCode: number,
  x: number,
  y: number,
  isRelease: boolean,
): MouseProtocolEvent | null {
  if (
    !Number.isSafeInteger(buttonCode) ||
    !Number.isSafeInteger(x) ||
    !Number.isSafeInteger(y) ||
    buttonCode < 0 ||
    x < 1 ||
    y < 1
  ) {
    return null;
  }

  const baseButton = buttonCode & 0b11;
  const isMotion = (buttonCode & 0b100000) !== 0;
  const isScroll = (buttonCode & 0b1000000) !== 0;
  let button: MouseProtocolButton;
  let action: MouseProtocolAction;

  if (isScroll) {
    button = (buttonCode & 1) === 0 ? 'scroll-up' : 'scroll-down';
    action = 'click';
  } else {
    if (baseButton === 0) button = 'left';
    else if (baseButton === 1) button = 'middle';
    else if (baseButton === 2) button = 'right';
    else button = 'none';

    if (isMotion && baseButton === 3) {
      action = 'move';
    } else if (isRelease || baseButton === 3) {
      action = 'release';
    } else if (isMotion) {
      action = 'drag';
    } else {
      action = 'click';
    }
  }

  return {
    x: x - 1,
    y: y - 1,
    button,
    action,
    modifiers: {
      shift: (buttonCode & 0b100) !== 0,
      alt: (buttonCode & 0b1000) !== 0,
      ctrl: (buttonCode & 0b10000) !== 0,
    },
  };
}

export function parseMouseProtocol(data: string): MouseProtocolResult | null {
  const pixelMatch = SGR_PIXEL_MOUSE_RE.exec(data);
  if (pixelMatch) {
    const buttonCode = parseSafeInteger(pixelMatch[1]!);
    const pixelX = parseSafeInteger(pixelMatch[2]!);
    const pixelY = parseSafeInteger(pixelMatch[3]!);
    const cellX = parseSafeInteger(pixelMatch[4]!);
    const cellY = parseSafeInteger(pixelMatch[5]!);
    if (
      buttonCode === null ||
      pixelX === null ||
      pixelY === null ||
      cellX === null ||
      cellY === null ||
      pixelX < 0 ||
      pixelY < 0
    ) {
      return null;
    }
    const event = decodeMouseEvent(buttonCode, cellX, cellY, pixelMatch[6] === 'm');
    if (!event) return null;
    event.pixelX = pixelX;
    event.pixelY = pixelY;
    return { event, length: pixelMatch[0].length };
  }

  const sgrMatch = SGR_MOUSE_RE.exec(data);
  if (sgrMatch) {
    const buttonCode = parseSafeInteger(sgrMatch[1]!);
    const x = parseSafeInteger(sgrMatch[2]!);
    const y = parseSafeInteger(sgrMatch[3]!);
    if (buttonCode === null || x === null || y === null) return null;
    const event = decodeMouseEvent(buttonCode, x, y, sgrMatch[4] === 'm');
    return event ? { event, length: sgrMatch[0].length } : null;
  }

  const x10Match = X10_MOUSE_RE.exec(data);
  if (x10Match) {
    const buttonCode = x10Match[1]!.charCodeAt(0) - 32;
    const x = x10Match[2]!.charCodeAt(0) - 32;
    const y = x10Match[3]!.charCodeAt(0) - 32;
    const event = decodeMouseEvent(buttonCode, x, y, false);
    return event ? { event, length: x10Match[0].length } : null;
  }

  const urxvtMatch = URXVT_MOUSE_RE.exec(data);
  if (urxvtMatch) {
    const encodedButton = parseSafeInteger(urxvtMatch[1]!);
    const x = parseSafeInteger(urxvtMatch[2]!);
    const y = parseSafeInteger(urxvtMatch[3]!);
    if (encodedButton === null || x === null || y === null) return null;
    const event = decodeMouseEvent(encodedButton - 32, x, y, false);
    return event ? { event, length: urxvtMatch[0].length } : null;
  }

  return null;
}

export function startsWithMouseProtocol(data: string): boolean {
  return (
    SGR_PIXEL_MOUSE_RE.test(data) ||
    SGR_MOUSE_RE.test(data) ||
    X10_MOUSE_RE.test(data) ||
    URXVT_MOUSE_RE.test(data)
  );
}
