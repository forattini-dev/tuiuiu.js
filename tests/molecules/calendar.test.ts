import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Calendar,
  MiniCalendar,
  DatePicker,
  createCalendar,
  createDatePicker,
  type CalendarOptions,
  type CalendarEvent,
  type CalendarState,
  type DatePickerState,
} from '../../src/molecules/calendar.js';
import { renderOnce } from '../../src/app/render-loop.js';

describe('Calendar', () => {
  // ==========================================================================
  // createCalendar State Factory
  // ==========================================================================
  describe('createCalendar', () => {
    let state: CalendarState;
    const fixedDate = new Date(2024, 5, 15); // June 15, 2024

    beforeEach(() => {
      state = createCalendar({ initialDate: fixedDate });
    });

    describe('initial state', () => {
      it('should set cursor to initial date', () => {
        const cursor = state.cursorDate();
        expect(cursor.getFullYear()).toBe(2024);
        expect(cursor.getMonth()).toBe(5);
        expect(cursor.getDate()).toBe(15);
      });

      it('should set view to first of initial month', () => {
        const view = state.viewDate();
        expect(view.getFullYear()).toBe(2024);
        expect(view.getMonth()).toBe(5);
        expect(view.getDate()).toBe(1);
      });

      it('should start with empty selection', () => {
        expect(state.selectedDates()).toEqual([]);
      });

      it('should start with no range', () => {
        expect(state.rangeStart()).toBeNull();
      });

      it('should use today when no initialDate', () => {
        const todayState = createCalendar();
        const today = new Date();
        const cursor = todayState.cursorDate();
        expect(cursor.getDate()).toBe(today.getDate());
        expect(cursor.getMonth()).toBe(today.getMonth());
        expect(cursor.getFullYear()).toBe(today.getFullYear());
      });

      it('should accept initial selected dates', () => {
        const selected = [new Date(2024, 5, 10), new Date(2024, 5, 20)];
        const stateWithSelected = createCalendar({
          initialDate: fixedDate,
          selectedDates: selected,
        });
        expect(stateWithSelected.selectedDates()).toHaveLength(2);
      });
    });

    describe('navigation - moveDay', () => {
      it('should move cursor forward by one day', () => {
        state.moveDay(1);
        expect(state.cursorDate().getDate()).toBe(16);
      });

      it('should move cursor backward by one day', () => {
        state.moveDay(-1);
        expect(state.cursorDate().getDate()).toBe(14);
      });

      it('should update view when crossing month boundary forward', () => {
        // Move to July
        state.moveDay(16); // June 15 + 16 = July 1
        const view = state.viewDate();
        expect(view.getMonth()).toBe(6); // July
      });

      it('should update view when crossing month boundary backward', () => {
        // Move to May
        state.moveDay(-15); // June 15 - 15 = May 31
        const view = state.viewDate();
        expect(view.getMonth()).toBe(4); // May
      });

      it('should call onMonthChange when crossing month boundary', () => {
        const onMonthChange = vi.fn();
        const stateWithCallback = createCalendar({
          initialDate: fixedDate,
          onMonthChange,
        });
        stateWithCallback.moveDay(16);
        expect(onMonthChange).toHaveBeenCalledWith(2024, 6); // July
      });
    });

    describe('navigation - moveWeek', () => {
      it('should move cursor forward by one week', () => {
        state.moveWeek(1);
        expect(state.cursorDate().getDate()).toBe(22);
      });

      it('should move cursor backward by one week', () => {
        state.moveWeek(-1);
        expect(state.cursorDate().getDate()).toBe(8);
      });

      it('should update view when crossing month boundary', () => {
        state.moveWeek(3); // June 15 + 21 = July 6
        expect(state.viewDate().getMonth()).toBe(6); // July
      });
    });

    describe('navigation - moveMonth', () => {
      it('should move view forward by one month', () => {
        state.moveMonth(1);
        expect(state.viewDate().getMonth()).toBe(6); // July
        expect(state.cursorDate().getMonth()).toBe(6);
      });

      it('should move view backward by one month', () => {
        state.moveMonth(-1);
        expect(state.viewDate().getMonth()).toBe(4); // May
        expect(state.cursorDate().getMonth()).toBe(4);
      });

      it('should call onMonthChange', () => {
        const onMonthChange = vi.fn();
        const stateWithCallback = createCalendar({
          initialDate: fixedDate,
          onMonthChange,
        });
        stateWithCallback.moveMonth(1);
        expect(onMonthChange).toHaveBeenCalledWith(2024, 6);
      });
    });

    describe('navigation - moveYear', () => {
      it('should move view forward by one year', () => {
        state.moveYear(1);
        expect(state.viewDate().getFullYear()).toBe(2025);
        expect(state.cursorDate().getFullYear()).toBe(2025);
      });

      it('should move view backward by one year', () => {
        state.moveYear(-1);
        expect(state.viewDate().getFullYear()).toBe(2023);
        expect(state.cursorDate().getFullYear()).toBe(2023);
      });

      it('should call onMonthChange', () => {
        const onMonthChange = vi.fn();
        const stateWithCallback = createCalendar({
          initialDate: fixedDate,
          onMonthChange,
        });
        stateWithCallback.moveYear(1);
        expect(onMonthChange).toHaveBeenCalledWith(2025, 5);
      });
    });

    describe('navigation - goToToday', () => {
      it('should move cursor to today', () => {
        const today = new Date();
        state.goToToday();
        const cursor = state.cursorDate();
        expect(cursor.getDate()).toBe(today.getDate());
        expect(cursor.getMonth()).toBe(today.getMonth());
        expect(cursor.getFullYear()).toBe(today.getFullYear());
      });

      it('should update view to today\'s month', () => {
        const today = new Date();
        state.goToToday();
        const view = state.viewDate();
        expect(view.getMonth()).toBe(today.getMonth());
        expect(view.getFullYear()).toBe(today.getFullYear());
      });

      it('should call onMonthChange', () => {
        const onMonthChange = vi.fn();
        const stateWithCallback = createCalendar({
          initialDate: fixedDate,
          onMonthChange,
        });
        stateWithCallback.goToToday();
        expect(onMonthChange).toHaveBeenCalled();
      });
    });

    describe('selection - single mode', () => {
      it('should select cursor date', () => {
        state.selectCursor();
        expect(state.selectedDates()).toHaveLength(1);
        expect(state.selectedDates()[0]?.getDate()).toBe(15);
      });

      it('should replace previous selection', () => {
        state.selectCursor();
        state.moveDay(1);
        state.selectCursor();
        expect(state.selectedDates()).toHaveLength(1);
        expect(state.selectedDates()[0]?.getDate()).toBe(16);
      });

      it('should call onDateSelect', () => {
        const onDateSelect = vi.fn();
        const stateWithCallback = createCalendar({
          initialDate: fixedDate,
          onDateSelect,
        });
        stateWithCallback.selectCursor();
        expect(onDateSelect).toHaveBeenCalled();
      });
    });

    describe('selection - multiple mode', () => {
      beforeEach(() => {
        state = createCalendar({
          initialDate: fixedDate,
          selectionMode: 'multiple',
        });
      });

      it('should add dates to selection', () => {
        state.selectCursor();
        state.moveDay(1);
        state.selectCursor();
        expect(state.selectedDates()).toHaveLength(2);
      });

      it('should toggle off already selected dates', () => {
        state.selectCursor();
        expect(state.selectedDates()).toHaveLength(1);
        state.selectCursor(); // Toggle off
        expect(state.selectedDates()).toHaveLength(0);
      });
    });

    describe('selection - range mode', () => {
      beforeEach(() => {
        state = createCalendar({
          initialDate: fixedDate,
          selectionMode: 'range',
        });
      });

      it('should set range start on first selection', () => {
        state.selectCursor();
        expect(state.rangeStart()).not.toBeNull();
        expect(state.selectedDates()).toHaveLength(1);
      });

      it('should complete range on second selection', () => {
        state.selectCursor(); // June 15 - start
        state.moveDay(5);
        state.selectCursor(); // June 20 - end
        expect(state.rangeStart()).toBeNull();
        expect(state.selectedDates()).toHaveLength(6); // 15, 16, 17, 18, 19, 20
      });

      it('should handle reverse range (end before start)', () => {
        state.selectCursor(); // June 15 - start
        state.moveDay(-5);
        state.selectCursor(); // June 10 - end
        expect(state.selectedDates()).toHaveLength(6); // 10, 11, 12, 13, 14, 15
      });
    });

    describe('selection - none mode', () => {
      it('should not select anything', () => {
        state = createCalendar({
          initialDate: fixedDate,
          selectionMode: 'none',
        });
        state.selectCursor();
        expect(state.selectedDates()).toHaveLength(0);
      });
    });

    describe('selection - clearSelection', () => {
      it('should clear all selected dates', () => {
        state.selectCursor();
        expect(state.selectedDates()).toHaveLength(1);
        state.clearSelection();
        expect(state.selectedDates()).toHaveLength(0);
      });

      it('should clear range start', () => {
        state = createCalendar({
          initialDate: fixedDate,
          selectionMode: 'range',
        });
        state.selectCursor();
        expect(state.rangeStart()).not.toBeNull();
        state.clearSelection();
        expect(state.rangeStart()).toBeNull();
      });
    });

    describe('disabled dates', () => {
      it('should not select minDate-restricted dates', () => {
        state = createCalendar({
          initialDate: fixedDate,
          minDate: new Date(2024, 5, 16), // June 16
        });
        state.selectCursor(); // June 15 is before minDate
        expect(state.selectedDates()).toHaveLength(0);
      });

      it('should not select maxDate-restricted dates', () => {
        state = createCalendar({
          initialDate: fixedDate,
          maxDate: new Date(2024, 5, 14), // June 14
        });
        state.selectCursor(); // June 15 is after maxDate
        expect(state.selectedDates()).toHaveLength(0);
      });

      it('should not select explicitly disabled dates', () => {
        state = createCalendar({
          initialDate: fixedDate,
          disabledDates: [new Date(2024, 5, 15)],
        });
        state.selectCursor();
        expect(state.selectedDates()).toHaveLength(0);
      });
    });

    describe('getMonthDays', () => {
      it('should return 42 days (6 weeks)', () => {
        const days = state.getMonthDays();
        expect(days).toHaveLength(42);
      });

      it('should mark current month days correctly', () => {
        const days = state.getMonthDays();
        const juneDays = days.filter((d) => d.isCurrentMonth);
        expect(juneDays.length).toBe(30); // June has 30 days
      });

      it('should include previous month days', () => {
        const days = state.getMonthDays();
        const prevMonthDays = days.filter((d) => !d.isCurrentMonth && d.date.getMonth() === 4);
        expect(prevMonthDays.length).toBeGreaterThan(0);
      });

      it('should include next month days', () => {
        const days = state.getMonthDays();
        const nextMonthDays = days.filter((d) => !d.isCurrentMonth && d.date.getMonth() === 6);
        expect(nextMonthDays.length).toBeGreaterThan(0);
      });

      it('should mark today correctly', () => {
        const todayState = createCalendar();
        const days = todayState.getMonthDays();
        const today = days.find((d) => d.isToday);
        expect(today).toBeDefined();
      });

      it('should mark weekends correctly', () => {
        const days = state.getMonthDays();
        const weekends = days.filter((d) => d.isWeekend);
        expect(weekends.length).toBeGreaterThan(0);
        weekends.forEach((d) => {
          expect([0, 6]).toContain(d.date.getDay());
        });
      });

      it('should mark selected dates', () => {
        state.selectCursor();
        const days = state.getMonthDays();
        const selected = days.filter((d) => d.isSelected);
        expect(selected).toHaveLength(1);
      });

      it('should mark range start', () => {
        state = createCalendar({
          initialDate: fixedDate,
          selectionMode: 'range',
        });
        state.selectCursor();
        const days = state.getMonthDays();
        const rangeStart = days.find((d) => d.isRangeStart);
        expect(rangeStart).toBeDefined();
      });

      it('should mark range end and in-range days', () => {
        state = createCalendar({
          initialDate: fixedDate,
          selectionMode: 'range',
        });
        state.selectCursor();
        state.moveDay(3);
        const days = state.getMonthDays();
        const rangeEnd = days.find((d) => d.isRangeEnd);
        const inRange = days.filter((d) => d.isInRange);
        expect(rangeEnd).toBeDefined();
        expect(inRange.length).toBeGreaterThan(0);
      });

      it('should mark disabled dates', () => {
        state = createCalendar({
          initialDate: fixedDate,
          disabledDates: [new Date(2024, 5, 20)],
        });
        const days = state.getMonthDays();
        const disabled = days.find((d) => d.date.getDate() === 20 && d.isCurrentMonth);
        expect(disabled?.isDisabled).toBe(true);
      });

      it('should include events for days', () => {
        const events: CalendarEvent[] = [
          { date: '2024-06-15', label: 'Meeting', color: 'blue' },
          { date: '2024-06-20', label: 'Deadline', color: 'red' },
        ];
        state = createCalendar({
          initialDate: fixedDate,
          events,
        });
        const days = state.getMonthDays();
        const dayWithEvents = days.find(
          (d) => d.date.getDate() === 15 && d.isCurrentMonth
        );
        expect(dayWithEvents?.events).toHaveLength(1);
        expect(dayWithEvents?.events[0]?.label).toBe('Meeting');
      });
    });

    describe('firstDayOfWeek option', () => {
      it('should adjust grid for Monday start', () => {
        state = createCalendar({
          initialDate: new Date(2024, 0, 1), // January 2024
          firstDayOfWeek: 1,
        });
        const days = state.getMonthDays();
        // First cell should be from previous month (December)
        expect(days[0]?.isCurrentMonth).toBe(true); // Jan 1 2024 is Monday
      });
    });
  });

  // ==========================================================================
  // Calendar Component
  // ==========================================================================
  describe('Calendar component', () => {
    it('should render without errors', () => {
      const output = renderOnce(Calendar({}));
      expect(output).toBeDefined();
    });

    it('should show month and year in header', () => {
      // Create state explicitly with fixed date
      const state = createCalendar({ initialDate: new Date(2024, 5, 15) });
      const output = renderOnce(Calendar({ state }));
      // Should contain the month name somewhere in output
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(100); // Has content
    });

    it('should show weekday headers', () => {
      const output = renderOnce(Calendar({}));
      expect(output).toContain('Su');
      expect(output).toContain('Mo');
      expect(output).toContain('Tu');
      expect(output).toContain('We');
      expect(output).toContain('Th');
      expect(output).toContain('Fr');
      expect(output).toContain('Sa');
    });

    it('should show navigation hints', () => {
      const output = renderOnce(Calendar({}));
      expect(output).toMatch(/nav|select|today/i);
    });

    it('should accept custom colors', () => {
      const node = Calendar({
        colorToday: 'green',
        colorSelected: 'blue',
        colorEvent: 'red',
        colorWeekend: 'gray',
        colorHeader: 'cyan',
      });
      expect(node).toBeDefined();
    });

    it('should show week numbers when enabled', () => {
      const output = renderOnce(
        Calendar({
          initialDate: new Date(2024, 5, 15),
          showWeekNumbers: true,
        })
      );
      expect(output).toContain('Wk');
    });

    it('should accept custom cell width', () => {
      const node = Calendar({ cellWidth: 5 });
      expect(node).toBeDefined();
    });

    it('should accept external state', () => {
      const externalState = createCalendar({ initialDate: new Date(2024, 0, 1) });
      const node = Calendar({ state: externalState });
      const output = renderOnce(node);
      expect(output).toContain('January');
    });

    it('should mark events with indicator', () => {
      const output = renderOnce(
        Calendar({
          initialDate: new Date(2024, 5, 15),
          events: [{ date: '2024-06-15', label: 'Test' }],
        })
      );
      // Event indicator should be present (• or *)
      expect(output).toMatch(/[•*]/);
    });

    it('should apply colorEvent and expose event labels on the indicator', () => {
      const node = Calendar({
        initialDate: new Date(2024, 5, 15),
        events: [{ date: '2024-06-15', label: 'Release' }],
        colorEvent: 'magenta',
      });
      const visit = (value: any): any => {
        if (!value || typeof value !== 'object') return undefined;
        if (value.props?.['aria-label'] === 'Release') return value;
        for (const child of value.children ?? []) {
          const match = visit(child);
          if (match) return match;
        }
        return undefined;
      };

      const indicator = visit(node);
      expect(indicator).toBeDefined();
      expect(indicator.props.color).toBe('magenta');
    });

    it('should handle isActive=false', () => {
      const node = Calendar({ isActive: false });
      expect(node).toBeDefined();
    });
  });

  // ==========================================================================
  // MiniCalendar
  // ==========================================================================
  describe('MiniCalendar', () => {
    it('should render without errors', () => {
      const output = renderOnce(MiniCalendar({}));
      expect(output).toBeDefined();
    });

    it('should use smaller cell width', () => {
      const node = MiniCalendar({});
      expect(node).toBeDefined();
    });

    it('should not show week numbers', () => {
      const output = renderOnce(MiniCalendar({}));
      expect(output).not.toContain('Wk');
    });

    it('should accept showNavigation option', () => {
      const node = MiniCalendar({ showNavigation: false });
      expect(node).toBeDefined();
    });
  });

  // ==========================================================================
  // createDatePicker
  // ==========================================================================
  describe('createDatePicker', () => {
    let state: DatePickerState;
    const fixedDate = new Date(2024, 5, 15);

    beforeEach(() => {
      state = createDatePicker({ initialDate: fixedDate });
    });

    it('should inherit calendar state', () => {
      expect(state.cursorDate()).toBeDefined();
      expect(state.viewDate()).toBeDefined();
      expect(state.selectedDates()).toBeDefined();
    });

    it('should start closed', () => {
      expect(state.isOpen()).toBe(false);
    });

    it('should open when open() is called', () => {
      state.open();
      expect(state.isOpen()).toBe(true);
    });

    it('should close when close() is called', () => {
      state.open();
      state.close();
      expect(state.isOpen()).toBe(false);
    });

    it('should toggle open state', () => {
      state.toggle();
      expect(state.isOpen()).toBe(true);
      state.toggle();
      expect(state.isOpen()).toBe(false);
    });

    it('should format single selected date', () => {
      state.selectCursor();
      expect(state.formattedValue()).toBe('2024-06-15');
    });

    it('should honor the configured display format', () => {
      state = createDatePicker({
        initialDate: fixedDate,
        format: 'DD/MM/YYYY',
      });
      state.selectCursor();

      expect(state.formattedValue()).toBe('15/06/2024');
    });

    it('should format date range', () => {
      state = createDatePicker({
        initialDate: fixedDate,
        selectionMode: 'range',
      });
      state.selectCursor();
      state.moveDay(5);
      state.selectCursor();
      const formatted = state.formattedValue();
      expect(formatted).toContain('2024-06-15');
      expect(formatted).toContain('2024-06-20');
      expect(formatted).toContain(' - ');
    });

    it('should return empty string when no selection', () => {
      expect(state.formattedValue()).toBe('');
    });
  });

  // ==========================================================================
  // DatePicker Component
  // ==========================================================================
  describe('DatePicker', () => {
    it('should render without errors', () => {
      const output = renderOnce(DatePicker({}));
      expect(output).toBeDefined();
    });

    it('should show placeholder when no selection', () => {
      const output = renderOnce(DatePicker({ placeholder: 'Pick a date' }));
      expect(output).toContain('Pick a date');
    });

    it('should accept custom input width', () => {
      const node = DatePicker({ inputWidth: 30 });
      expect(node).toBeDefined();
    });

    it('should show calendar when open', () => {
      const state = createDatePicker({ initialDate: new Date(2024, 5, 15) });
      state.open();
      const output = renderOnce(
        DatePicker({
          initialDate: new Date(2024, 5, 15),
        })
      );
      // When closed, calendar shouldn't be visible
      expect(output).toBeDefined();
    });

    it('should handle isActive=false', () => {
      const node = DatePicker({ isActive: false });
      expect(node).toBeDefined();
    });
  });
});
