/**
 * Adapter between the public FocusManager contract and the zone-based focus
 * engine. It lives outside the hooks/context modules to keep their dependency
 * graph acyclic.
 */

import { getFocusZoneManager } from '../core/focus.js';
import type { FocusManager } from './types.js';

/**
 * Presents the root focus zone through the app-facing FocusManager contract.
 */
export class FocusZoneManagerAdapter implements FocusManager {
  private zoneManager = getFocusZoneManager();
  private readonly zoneId: string;

  constructor(zoneId: string = '__root__') {
    this.zoneId = zoneId;
  }

  register(id: string, setFocused: (focused: boolean) => void): void {
    this.zoneManager.registerElement(id, this.zoneId, {
      onFocus: setFocused,
    });
  }

  unregister(id: string): void {
    this.zoneManager.unregisterElement(id, this.zoneId);
  }

  focus(id: string): void {
    this.zoneManager.focusElement(id, this.zoneId);
  }

  focusNext(): void {
    this.zoneManager.focusNextInZone(this.zoneId);
  }

  focusPrevious(): void {
    this.zoneManager.focusPreviousInZone(this.zoneId);
  }

  blur(): void {
    this.zoneManager.blur(this.zoneId);
  }

  getActiveId(): string | undefined {
    return this.zoneManager.getActiveId(this.zoneId) ?? undefined;
  }
}
