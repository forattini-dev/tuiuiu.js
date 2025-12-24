import { describe, it, expect, vi } from 'vitest';
import {
  createMCPLogger,
  nullLogger,
  createProgressReporter,
  createResourceNotifier,
  type MCPLogNotification,
} from '../../src/mcp/logging.js';

describe('MCP Logging', () => {
  describe('createMCPLogger', () => {
    it('should create logger with all methods', () => {
      const logger = createMCPLogger(null);

      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.notice).toBe('function');
      expect(typeof logger.warning).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.critical).toBe('function');
      expect(typeof logger.alert).toBe('function');
      expect(typeof logger.emergency).toBe('function');
      expect(typeof logger.toolCall).toBe('function');
      expect(typeof logger.toolResult).toBe('function');
      expect(typeof logger.promptGet).toBe('function');
      expect(typeof logger.resourceRead).toBe('function');
      expect(typeof logger.sessionStart).toBe('function');
      expect(typeof logger.sessionEnd).toBe('function');
    });

    it('should not call sender when disabled', () => {
      const sender = vi.fn();
      const logger = createMCPLogger(sender, { enabled: false });

      logger.info('test message');

      expect(sender).not.toHaveBeenCalled();
    });

    it('should not call sender when sender is null', () => {
      const logger = createMCPLogger(null);

      // Should not throw
      logger.info('test message');
      logger.error('error message');
    });

    it('should call sender with correct format', () => {
      const sender = vi.fn();
      const logger = createMCPLogger(sender, { name: 'test-logger' });

      logger.info('test message');

      expect(sender).toHaveBeenCalledTimes(1);
      const call = sender.mock.calls[0][0] as MCPLogNotification;

      expect(call.jsonrpc).toBe('2.0');
      expect(call.method).toBe('notifications/message');
      expect(call.params.level).toBe('info');
      expect(call.params.logger).toBe('test-logger');
      expect(call.params.data).toMatchObject({
        message: 'test message',
      });
    });

    it('should include context data when provided', () => {
      const sender = vi.fn();
      const logger = createMCPLogger(sender);

      logger.info('test message', { key: 'value' });

      const call = sender.mock.calls[0][0] as MCPLogNotification;
      expect(call.params.data).toMatchObject({
        message: 'test message',
        context: { key: 'value' },
      });
    });

    it('should respect minLevel setting', () => {
      const sender = vi.fn();
      const logger = createMCPLogger(sender, { minLevel: 'warning' });

      logger.debug('debug message');
      logger.info('info message');
      logger.warning('warning message');
      logger.error('error message');

      expect(sender).toHaveBeenCalledTimes(2); // warning + error
    });

    it('should log toolCall correctly', () => {
      const sender = vi.fn();
      const logger = createMCPLogger(sender);

      logger.toolCall('tuiuiu_get_component', { name: 'Box' });

      const call = sender.mock.calls[0][0] as MCPLogNotification;
      expect(call.params.level).toBe('info');
      expect(call.params.data).toMatchObject({
        message: 'Tool called: tuiuiu_get_component',
        context: { arguments: { name: 'Box' } },
      });
    });

    it('should log toolResult correctly', () => {
      const sender = vi.fn();
      const logger = createMCPLogger(sender);

      logger.toolResult('tuiuiu_get_component', true, 50);

      const call = sender.mock.calls[0][0] as MCPLogNotification;
      expect(call.params.data).toMatchObject({
        message: 'Tool completed: tuiuiu_get_component',
        context: { success: true, duration: '50ms' },
      });
    });

    it('should log promptGet correctly', () => {
      const sender = vi.fn();
      const logger = createMCPLogger(sender);

      logger.promptGet('create_dashboard', { metrics: 'cpu' });

      const call = sender.mock.calls[0][0] as MCPLogNotification;
      expect(call.params.data).toMatchObject({
        message: 'Prompt retrieved: create_dashboard',
      });
    });

    it('should log resourceRead correctly', () => {
      const sender = vi.fn();
      const logger = createMCPLogger(sender);

      logger.resourceRead('tuiuiu://component/Box');

      const call = sender.mock.calls[0][0] as MCPLogNotification;
      expect(call.params.data).toMatchObject({
        message: 'Resource read: tuiuiu://component/Box',
      });
    });
  });

  describe('nullLogger', () => {
    it('should have all methods', () => {
      expect(typeof nullLogger.debug).toBe('function');
      expect(typeof nullLogger.info).toBe('function');
      expect(typeof nullLogger.error).toBe('function');
    });

    it('should not throw when called', () => {
      nullLogger.debug('test');
      nullLogger.info('test');
      nullLogger.error('test');
      nullLogger.toolCall('test');
      nullLogger.sessionStart();
    });
  });

  describe('createProgressReporter', () => {
    it('should return noop reporter when sender is null', () => {
      const reporter = createProgressReporter(null, 'token-1');

      // Should not throw
      reporter.update(50, 100, 'Processing...');
      reporter.complete('Done');
    });

    it('should send progress notifications', () => {
      const sender = vi.fn();
      const reporter = createProgressReporter(sender, 'token-1');

      reporter.update(50, 100, 'Processing...');

      expect(sender).toHaveBeenCalledWith({
        method: 'notifications/progress',
        params: {
          progressToken: 'token-1',
          progress: 50,
          total: 100,
          message: 'Processing...',
        },
      });
    });

    it('should send complete notification', () => {
      const sender = vi.fn();
      const reporter = createProgressReporter(sender, 'token-1');

      reporter.complete('All done');

      expect(sender).toHaveBeenCalledWith({
        method: 'notifications/progress',
        params: {
          progressToken: 'token-1',
          progress: 1,
          total: 1,
          message: 'All done',
        },
      });
    });
  });

  describe('createResourceNotifier', () => {
    it('should return noop notifier when sender is null', () => {
      const notifier = createResourceNotifier(null);

      // Should not throw
      notifier.updated('tuiuiu://component/Box');
      notifier.listChanged();
    });

    it('should send updated notification', () => {
      const sender = vi.fn();
      const notifier = createResourceNotifier(sender);

      notifier.updated('tuiuiu://component/Box');

      expect(sender).toHaveBeenCalledWith({
        method: 'notifications/resources/updated',
        params: { uri: 'tuiuiu://component/Box' },
      });
    });

    it('should send listChanged notification', () => {
      const sender = vi.fn();
      const notifier = createResourceNotifier(sender);

      notifier.listChanged();

      expect(sender).toHaveBeenCalledWith({
        method: 'notifications/resources/list_changed',
        params: {},
      });
    });
  });
});
