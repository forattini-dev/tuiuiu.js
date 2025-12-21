/**
 * Tests for Design System Overlay Components
 */

import { describe, it, expect } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import { Text, Box } from '../../src/primitives/index.js';
import { Modal, Toast, AlertBox, ConfirmDialog, createModal, createConfirmDialog } from '../../src/design-system/overlays/modal.js';

describe('Overlay Components', () => {
  describe('Modal', () => {
    it('should render modal with title', () => {
      const node = Modal({
        title: 'Test Modal',
        content: Text({}, 'Modal content'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Test Modal');
      expect(output).toContain('Modal content');
    });

    it('should render without title', () => {
      const node = Modal({
        content: Text({}, 'No title'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('No title');
    });

    it('should apply size small', () => {
      const node = Modal({
        title: 'Small',
        content: Text({}, 'Content'),
        size: 'small',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Small');
    });

    it('should apply size medium', () => {
      const node = Modal({
        title: 'Medium',
        content: Text({}, 'Content'),
        size: 'medium',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Medium');
    });

    it('should apply size large', () => {
      const node = Modal({
        title: 'Large',
        content: Text({}, 'Content'),
        size: 'large',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Large');
    });

    it('should apply fullscreen', () => {
      const node = Modal({
        title: 'Fullscreen',
        content: Text({}, 'Content'),
        size: 'fullscreen',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Fullscreen');
    });

    it('should render with border', () => {
      const node = Modal({
        title: 'Border',
        content: Text({}, 'Content'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('─');
    });

    it('should apply custom border style', () => {
      const node = Modal({
        title: 'Custom',
        content: Text({}, 'Content'),
        borderStyle: 'double',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('═');
    });

    it('should apply border color', () => {
      const node = Modal({
        title: 'Color',
        content: Text({}, 'Content'),
        borderColor: 'cyan',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[36m'); // Cyan
    });

    it('should show footer', () => {
      const node = Modal({
        title: 'Footer',
        content: Text({}, 'Content'),
        footer: Text({}, 'Footer text'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Footer text');
    });

    it('should show hint', () => {
      const node = Modal({
        title: 'Hint',
        content: Text({}, 'Content'),
        hint: 'Press ESC to close',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Press ESC');
    });

    it('should render box content', () => {
      const node = Modal({
        title: 'Box',
        content: Box(
          { flexDirection: 'column' },
          Text({}, 'Line 1'),
          Text({}, 'Line 2')
        ),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Line 1');
      expect(output).toContain('Line 2');
    });
  });

  describe('Toast', () => {
    it('should render success toast', () => {
      const node = Toast({ type: 'success', message: 'Success message' });
      const output = renderToString(node, 80);
      expect(output).toContain('Success message');
      expect(output).toContain('✓'); // Success icon
    });

    it('should render error toast', () => {
      const node = Toast({ type: 'error', message: 'Error message' });
      const output = renderToString(node, 80);
      expect(output).toContain('Error message');
      expect(output).toContain('✗'); // Error icon
    });

    it('should render warning toast', () => {
      const node = Toast({ type: 'warning', message: 'Warning message' });
      const output = renderToString(node, 80);
      expect(output).toContain('Warning message');
      expect(output).toContain('⚠'); // Warning icon
    });

    it('should render info toast', () => {
      const node = Toast({ type: 'info', message: 'Info message' });
      const output = renderToString(node, 80);
      expect(output).toContain('Info message');
      expect(output).toContain('ℹ'); // Info icon
    });
  });

  describe('AlertBox', () => {
    it('should render with title and message', () => {
      const node = AlertBox({
        title: 'Alert Title',
        message: 'Alert message here',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Alert Title');
      expect(output).toContain('Alert message');
    });

    it('should render success type', () => {
      const node = AlertBox({
        type: 'success',
        title: 'Success',
        message: 'Operation completed',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Success');
    });

    it('should render error type', () => {
      const node = AlertBox({
        type: 'error',
        title: 'Error',
        message: 'Something failed',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Error');
    });

    it('should render warning type', () => {
      const node = AlertBox({
        type: 'warning',
        title: 'Warning',
        message: 'Be careful',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Warning');
    });

    it('should render info type', () => {
      const node = AlertBox({
        type: 'info',
        title: 'Info',
        message: 'For your information',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Info');
    });

    it('should render without title', () => {
      const node = AlertBox({
        message: 'Just a message',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Just a message');
    });
  });

  describe('ConfirmDialog', () => {
    it('should render confirm dialog', () => {
      const node = ConfirmDialog({
        title: 'Confirm',
        message: 'Are you sure?',
        confirmText: 'Yes',
        cancelText: 'No',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Confirm');
      expect(output).toContain('Are you sure?');
      expect(output).toContain('Yes');
      expect(output).toContain('No');
    });

    it('should show custom labels', () => {
      const node = ConfirmDialog({
        title: 'Delete',
        message: 'Delete file?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Delete');
      expect(output).toContain('Cancel');
    });

    it('should highlight selected option', () => {
      const node = ConfirmDialog({
        title: 'Confirm',
        message: 'Proceed?',
        confirmText: 'OK',
        cancelText: 'Cancel',
        selected: 1,
      });
      const output = renderToString(node, 80);
      expect(output).toContain('OK');
    });
  });

  describe('createModal', () => {
    it('should create modal state', () => {
      const state = createModal();
      expect(state.isOpen).toBe(false);
    });

    it('should open modal', () => {
      const state = createModal();
      state.open();
      expect(state.isOpen).toBe(true);
    });

    it('should close modal', () => {
      const state = createModal();
      state.open();
      state.close();
      expect(state.isOpen).toBe(false);
    });

    it('should toggle modal', () => {
      const state = createModal();
      state.toggle();
      expect(state.isOpen).toBe(true);
      state.toggle();
      expect(state.isOpen).toBe(false);
    });
  });

  describe('createConfirmDialog', () => {
    it('should create confirm dialog state', () => {
      const state = createConfirmDialog({
        title: 'Test',
        message: 'Test message',
      });
      expect(state.selected).toBe(0);
    });

    it('should toggle selection', () => {
      const state = createConfirmDialog({
        title: 'Test',
        message: 'Test message',
      });
      state.toggle();
      expect(state.selected).toBe(1);
      state.toggle();
      expect(state.selected).toBe(0);
    });

    it('should select confirm', () => {
      const state = createConfirmDialog({
        title: 'Test',
        message: 'Test message',
      });
      state.selectConfirm();
      expect(state.selected).toBe(1);
    });

    it('should select cancel', () => {
      const state = createConfirmDialog({
        title: 'Test',
        message: 'Test message',
      });
      state.selectConfirm();
      state.selectCancel();
      expect(state.selected).toBe(0);
    });

    it('should get props', () => {
      const state = createConfirmDialog({
        title: 'Test',
        message: 'Test message',
      });
      expect(state.props.title).toBe('Test');
      expect(state.props.message).toBe('Test message');
    });
  });
});
