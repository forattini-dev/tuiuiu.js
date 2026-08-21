import type { Key } from '../core/hotkeys.js';
import type {
  InputEvent,
  InputHandler,
  InputPriority,
  PasteEvent,
  PasteHandler,
} from '../hooks/types.js';
import { INPUT_PRIORITY_VALUES } from '../hooks/types.js';
import { runWithAppContext } from '../hooks/context.js';
import type { AppContext } from '../hooks/types.js';
import {
  clearInteractionHandlersForTesting,
  createInteractionKeyEvent,
  getInteractionHandlerCountForTesting,
  getInteractionRuntime,
  type Disposable,
} from '../interaction/runtime.js';

const registrations = new Map<number, Disposable>();
let nextRegistrationId = 1;

export interface TestInteractionHandlerOptions {
  priority?: InputPriority;
  stopPropagation?: boolean;
  /** Bind the probe to one rendered/initialized app runtime. */
  app?: AppContext;
}

function inTestRuntime<T>(app: AppContext | undefined, operation: () => T): T {
  return app ? runWithAppContext(app, operation) : operation();
}

export function registerTestKeyHandler(
  handler: InputHandler,
  options: TestInteractionHandlerOptions = {},
): number {
  const id = nextRegistrationId++;
  const registration = inTestRuntime(options.app, () => getInteractionRuntime().registerHandler((event) => {
    if (event.type !== 'key') return false;
    const inputEvent: InputEvent = {
      input: event.key.text,
      key: event.key.native,
      isPasted: false,
      raw: event.key.text,
    };
    const handled = handler(event.key.text, event.key.native, inputEvent);
    return options.stopPropagation === true && Boolean(handled);
  }, { priority: INPUT_PRIORITY_VALUES[options.priority ?? 'normal'] }));
  registrations.set(id, registration);
  return id;
}

export function unregisterTestInteraction(id: number): boolean {
  const registration = registrations.get(id);
  if (!registration) return false;
  registration.dispose();
  registrations.delete(id);
  return true;
}

export function registerTestPasteHandler(
  handler: PasteHandler,
  options: TestInteractionHandlerOptions = {},
): number {
  const id = nextRegistrationId++;
  const registration = inTestRuntime(options.app, () => getInteractionRuntime().registerHandler((event) => {
    if (event.type !== 'paste') return false;
    const paste: PasteEvent = {
      text: event.text,
      isBracketed: event.bracketed,
    };
    const handled = handler(paste);
    return options.stopPropagation === true && Boolean(handled);
  }, { priority: INPUT_PRIORITY_VALUES[options.priority ?? 'normal'] }));
  registrations.set(id, registration);
  return id;
}

export function dispatchTestKey(input: string, key: Key): boolean {
  return getInteractionRuntime().dispatch({
    type: 'key',
    key: createInteractionKeyEvent(input, key),
  }).status === 'handled';
}

export function dispatchTestPaste(event: PasteEvent): boolean;
export function dispatchTestPaste(text: string, bracketed?: boolean): boolean;
export function dispatchTestPaste(
  eventOrText: PasteEvent | string,
  bracketed = true,
): boolean {
  const event = typeof eventOrText === 'string'
    ? { text: eventOrText, isBracketed: bracketed }
    : eventOrText;
  return getInteractionRuntime().dispatch({
    type: 'paste',
    text: event.text,
    bracketed: event.isBracketed,
  }).status === 'handled';
}

export function resetTestInteractions(): void {
  clearInteractionHandlersForTesting();
  registrations.clear();
  nextRegistrationId = 1;
}

export function getTestInteractionHandlerCount(app?: AppContext): number {
  return inTestRuntime(app, getInteractionHandlerCountForTesting);
}
