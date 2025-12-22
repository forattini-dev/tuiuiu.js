/**
 * Tests for Screen Manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ScreenManager,
  createScreenManager,
  createScreen,
  getScreenManager,
  resetScreenManager,
  resetScreenIdCounter,
  pushScreen,
  popScreen,
  replaceScreen,
  goBack,
  useScreen,
  useScreenState,
  type Screen,
  type ScreenManagerOptions,
} from '../../src/core/screen.js';

// Simple component for testing
const TestComponent = () => null;
const HomeScreen = () => null;
const SettingsScreen = () => null;
const ProfileScreen = () => null;

describe('Screen Manager', () => {
  beforeEach(() => {
    resetScreenManager();
    resetScreenIdCounter();
  });

  describe('createScreen', () => {
    it('should create a screen with auto-generated ID', () => {
      const screen = createScreen(TestComponent);

      expect(screen.id).toBe('screen-1');
      expect(screen.component).toBe(TestComponent);
    });

    it('should create screen with options', () => {
      const screen = createScreen(TestComponent, {
        title: 'Test Screen',
        subtitle: 'A test',
        keepAlive: true,
        showBack: true,
      });

      expect(screen.title).toBe('Test Screen');
      expect(screen.subtitle).toBe('A test');
      expect(screen.keepAlive).toBe(true);
      expect(screen.showBack).toBe(true);
    });

    it('should generate unique IDs', () => {
      const screen1 = createScreen(TestComponent);
      const screen2 = createScreen(TestComponent);
      const screen3 = createScreen(TestComponent);

      expect(screen1.id).toBe('screen-1');
      expect(screen2.id).toBe('screen-2');
      expect(screen3.id).toBe('screen-3');
    });
  });

  describe('ScreenManager construction', () => {
    it('should create empty manager by default', () => {
      const manager = createScreenManager();

      expect(manager.current).toBeNull();
      expect(manager.stackSize).toBe(0);
      expect(manager.canGoBack).toBe(false);
    });

    it('should initialize with initial screen', async () => {
      const homeScreen = createScreen(HomeScreen, { title: 'Home' });
      const manager = createScreenManager({
        initialScreen: homeScreen,
        transitionDuration: 0,
      });

      // Wait for push to complete (transitionDuration: 0 resolves immediately)
      await Promise.resolve();

      expect(manager.current?.id).toBe(homeScreen.id);
      expect(manager.stackSize).toBe(1);
    });
  });

  describe('Navigation - push', () => {
    it('should push a new screen', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const screen = createScreen(HomeScreen);

      const result = await manager.push(screen);

      expect(result).toBe(true);
      expect(manager.current?.id).toBe(screen.id);
      expect(manager.stackSize).toBe(1);
    });

    it('should push multiple screens', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const home = createScreen(HomeScreen);
      const settings = createScreen(SettingsScreen);
      const profile = createScreen(ProfileScreen);

      await manager.push(home);
      await manager.push(settings);
      await manager.push(profile);

      expect(manager.stackSize).toBe(3);
      expect(manager.current?.id).toBe(profile.id);
      expect(manager.canGoBack).toBe(true);
    });

    it('should respect maxStackSize', async () => {
      const manager = createScreenManager({
        transitionDuration: 0,
        maxStackSize: 2,
      });

      await manager.push(createScreen(HomeScreen));
      await manager.push(createScreen(SettingsScreen));
      await manager.push(createScreen(ProfileScreen));

      expect(manager.stackSize).toBe(2);
    });
  });

  describe('Navigation - pop', () => {
    it('should pop the current screen', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const home = createScreen(HomeScreen);
      const settings = createScreen(SettingsScreen);

      await manager.push(home);
      await manager.push(settings);

      expect(manager.current?.id).toBe(settings.id);

      const result = await manager.pop();

      expect(result).toBe(true);
      expect(manager.current?.id).toBe(home.id);
      expect(manager.stackSize).toBe(1);
    });

    it('should not pop if only one screen', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      await manager.push(createScreen(HomeScreen));

      const result = await manager.pop();

      expect(result).toBe(false);
      expect(manager.stackSize).toBe(1);
    });

    it('should not pop if stack is empty', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });

      const result = await manager.pop();

      expect(result).toBe(false);
    });
  });

  describe('Navigation - replace', () => {
    it('should replace the current screen', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const home = createScreen(HomeScreen);
      const settings = createScreen(SettingsScreen);

      await manager.push(home);
      await manager.replace(settings);

      expect(manager.current?.id).toBe(settings.id);
      expect(manager.stackSize).toBe(1);
    });
  });

  describe('Navigation - popToRoot', () => {
    it('should pop to root screen', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const home = createScreen(HomeScreen);

      await manager.push(home);
      await manager.push(createScreen(SettingsScreen));
      await manager.push(createScreen(ProfileScreen));

      expect(manager.stackSize).toBe(3);

      const result = await manager.popToRoot();

      expect(result).toBe(true);
      expect(manager.current?.id).toBe(home.id);
      expect(manager.stackSize).toBe(1);
    });
  });

  describe('Navigation - popTo', () => {
    it('should pop to specific screen by ID', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const home = createScreen(HomeScreen);
      const settings = createScreen(SettingsScreen);

      await manager.push(home);
      await manager.push(settings);
      await manager.push(createScreen(ProfileScreen));

      const result = await manager.popTo(settings.id);

      expect(result).toBe(true);
      expect(manager.current?.id).toBe(settings.id);
      expect(manager.stackSize).toBe(2);
    });

    it('should return false if screen not in stack', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      await manager.push(createScreen(HomeScreen));

      const result = await manager.popTo('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('Navigation - reset', () => {
    it('should clear stack and push new screen', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });

      await manager.push(createScreen(HomeScreen));
      await manager.push(createScreen(SettingsScreen));
      await manager.push(createScreen(ProfileScreen));

      const newScreen = createScreen(TestComponent);
      await manager.reset(newScreen);

      expect(manager.stackSize).toBe(1);
      expect(manager.current?.id).toBe(newScreen.id);
    });
  });

  describe('Lifecycle events', () => {
    it('should call onEnter when screen becomes active', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const onEnter = vi.fn();

      const screen = createScreen(HomeScreen, { onEnter });
      await manager.push(screen);

      expect(onEnter).toHaveBeenCalledTimes(1);
    });

    it('should call onExit when screen becomes inactive', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const onExit = vi.fn();

      const home = createScreen(HomeScreen, { onExit });
      const settings = createScreen(SettingsScreen);

      await manager.push(home);
      await manager.push(settings);

      expect(onExit).toHaveBeenCalledTimes(1);
    });

    it('should respect onBeforeExit guard', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const onBeforeExit = vi.fn().mockReturnValue(false);

      const home = createScreen(HomeScreen, { onBeforeExit });
      const settings = createScreen(SettingsScreen);

      await manager.push(home);
      const result = await manager.push(settings);

      expect(result).toBe(false);
      expect(manager.current?.id).toBe(home.id);
    });

    it('should respect onBeforeEnter guard', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const onBeforeEnter = vi.fn().mockReturnValue(false);

      const home = createScreen(HomeScreen);
      const settings = createScreen(SettingsScreen, { onBeforeEnter });

      await manager.push(home);
      const result = await manager.push(settings);

      expect(result).toBe(false);
      expect(manager.current?.id).toBe(home.id);
    });
  });

  describe('Back navigation', () => {
    it('should handle goBack', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });

      await manager.push(createScreen(HomeScreen));
      await manager.push(createScreen(SettingsScreen));

      const result = await manager.goBack();

      expect(result).toBe(true);
      expect(manager.stackSize).toBe(1);
    });

    it('should call custom onBack handler', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const onBack = vi.fn().mockReturnValue(true);

      const home = createScreen(HomeScreen);
      const settings = createScreen(SettingsScreen, { onBack });

      await manager.push(home);
      await manager.push(settings);

      const result = await manager.goBack();

      expect(result).toBe(true);
      expect(onBack).toHaveBeenCalled();
      expect(manager.stackSize).toBe(2); // Custom handler returned true, so no pop
    });

    it('should handle escape key when escapeGoesBack is true', async () => {
      const manager = createScreenManager({
        transitionDuration: 0,
        escapeGoesBack: true,
      });

      await manager.push(createScreen(HomeScreen));
      await manager.push(createScreen(SettingsScreen));

      const result = manager.handleEscape();

      expect(result).toBe(true);
    });

    it('should not handle escape key when escapeGoesBack is false', async () => {
      const manager = createScreenManager({
        transitionDuration: 0,
        escapeGoesBack: false,
      });

      await manager.push(createScreen(HomeScreen));
      await manager.push(createScreen(SettingsScreen));

      const result = manager.handleEscape();

      expect(result).toBe(false);
    });
  });

  describe('Screen state', () => {
    it('should set and get screen state', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      await manager.push(createScreen(HomeScreen));

      manager.setScreenState({ count: 5, name: 'test' });

      const state = manager.getScreenState();
      expect(state?.count).toBe(5);
      expect(state?.name).toBe('test');
    });

    it('should merge state updates', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      await manager.push(createScreen(HomeScreen));

      manager.setScreenState({ count: 5 });
      manager.setScreenState({ name: 'test' });

      const state = manager.getScreenState();
      expect(state?.count).toBe(5);
      expect(state?.name).toBe('test');
    });
  });

  describe('Events', () => {
    it('should emit navigate event', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const handler = vi.fn();
      manager.on('navigate', handler);

      const screen = createScreen(HomeScreen);
      await manager.push(screen);

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0];
      // EventEmitter wraps data in a TuiEvent with 'data' property
      const data = event.data ?? event;
      expect(data.from).toBeNull();
      expect(data.to).toBe(screen);
      expect(data.direction).toBe('forward');
    });

    it('should emit screenEnter and screenExit events', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const enterHandler = vi.fn();
      const exitHandler = vi.fn();

      manager.on('screenEnter', enterHandler);
      manager.on('screenExit', exitHandler);

      const home = createScreen(HomeScreen);
      const settings = createScreen(SettingsScreen);

      await manager.push(home);
      await manager.push(settings);

      expect(enterHandler).toHaveBeenCalledTimes(2);
      expect(exitHandler).toHaveBeenCalledTimes(1);
    });

    it('should emit navigateCancelled when guard returns false', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const handler = vi.fn();
      manager.on('navigateCancelled', handler);

      const home = createScreen(HomeScreen, {
        onBeforeExit: () => false,
      });
      const settings = createScreen(SettingsScreen);

      await manager.push(home);
      await manager.push(settings);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Utility methods', () => {
    it('should check if screen is in stack', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const home = createScreen(HomeScreen);

      await manager.push(home);

      expect(manager.hasScreen(home.id)).toBe(true);
      expect(manager.hasScreen('nonexistent')).toBe(false);
    });

    it('should get screen by ID', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const home = createScreen(HomeScreen, { title: 'Home' });

      await manager.push(home);

      const found = manager.getScreen(home.id);
      expect(found?.title).toBe('Home');
    });

    it('should get state snapshot', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const home = createScreen(HomeScreen);

      await manager.push(home);

      const state = manager.getState();
      expect(state.current?.id).toBe(home.id);
      expect(state.stack.length).toBe(1);
      expect(state.transitioning).toBe(false);
    });
  });

  describe('Global screen manager', () => {
    it('should provide global instance', () => {
      const manager1 = getScreenManager();
      const manager2 = getScreenManager();

      expect(manager1).toBe(manager2);
    });

    it('should reset global instance', () => {
      const manager1 = getScreenManager();
      resetScreenManager();
      const manager2 = getScreenManager();

      expect(manager1).not.toBe(manager2);
    });

    it('should provide convenience navigation functions', async () => {
      resetScreenManager();

      const home = createScreen(HomeScreen);
      const settings = createScreen(SettingsScreen);

      await pushScreen(home);
      expect(getScreenManager().stackSize).toBe(1);

      await pushScreen(settings);
      expect(getScreenManager().stackSize).toBe(2);

      await popScreen();
      expect(getScreenManager().stackSize).toBe(1);
    });
  });

  describe('useScreen hook', () => {
    it('should return screen manager state', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const home = createScreen(HomeScreen);

      await manager.push(home);

      const screen = useScreen(manager);

      expect(screen.current?.id).toBe(home.id);
      expect(screen.canGoBack).toBe(false);
      expect(screen.transitioning).toBe(false);
    });

    it('should provide navigation methods', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      const screen = useScreen(manager);

      await screen.push(createScreen(HomeScreen));
      await screen.push(createScreen(SettingsScreen));

      expect(manager.stackSize).toBe(2);

      await screen.pop();
      expect(manager.stackSize).toBe(1);
    });
  });

  describe('useScreenState hook', () => {
    it('should get and set screen state', async () => {
      const manager = createScreenManager({ transitionDuration: 0 });
      await manager.push(createScreen(HomeScreen));

      const [state, setState] = useScreenState(manager);

      expect(state).toBeUndefined();

      setState({ count: 10 });

      const [newState] = useScreenState(manager);
      expect(newState?.count).toBe(10);
    });
  });

  describe('Transition blocking', () => {
    it('should block navigation during transition', async () => {
      const manager = createScreenManager({ transitionDuration: 100 });

      // Start a push
      const pushPromise = manager.push(createScreen(HomeScreen));

      // Try to push again immediately
      const secondPush = manager.push(createScreen(SettingsScreen));

      // Second push should fail because first is still transitioning
      const result = await secondPush;
      expect(result).toBe(false);

      // Wait for first to complete
      await pushPromise;
      expect(manager.stackSize).toBe(1);
    });
  });
});
