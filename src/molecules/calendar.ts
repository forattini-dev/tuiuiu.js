/**
 * Calendar - Month view calendar component
 *
 * @layer Molecule
 * @description Interactive calendar with date selection and navigation
 *
 * Features:
 * - Month view with weeks
 * - Date selection (single and range)
 * - Keyboard navigation
 * - Event markers
 * - Custom date styling
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { createSignal, createMemo } from '../primitives/signal.js';
import { useInput } from '../hooks/index.js';
import { useConst } from '../hooks/use-const.js';
import { useFactoryState } from '../hooks/factory-state.js';
import { getRenderMode } from '../core/capabilities.js';
import { getTheme, getContrastColor } from '../core/theme.js';
import { component, type ComponentKeyProps } from '../app/component.js';

// =============================================================================
// Types
// =============================================================================

export interface CalendarEvent {
  /** Event date (YYYY-MM-DD) */
  date: string;
  /** Event label */
  label?: string;
  /** Event color */
  color?: ColorValue;
}

export interface CalendarOptions {
  /** Initial date (defaults to today) */
  initialDate?: Date;
  /** Selected dates */
  selectedDates?: Date[];
  /** Events to mark */
  events?: CalendarEvent[];
  /** Selection mode */
  selectionMode?: 'none' | 'single' | 'range' | 'multiple';
  /** First day of week (0 = Sunday, 1 = Monday) */
  firstDayOfWeek?: 0 | 1;
  /** Min selectable date */
  minDate?: Date;
  /** Max selectable date */
  maxDate?: Date;
  /** Disabled dates */
  disabledDates?: Date[];
  /** Show week numbers */
  showWeekNumbers?: boolean;
  /** Colors */
  colorToday?: ColorValue;
  colorSelected?: ColorValue;
  colorEvent?: ColorValue;
  colorWeekend?: ColorValue;
  colorHeader?: ColorValue;
  /** Cell width (default: 4) */
  cellWidth?: number;
  /** Callbacks */
  onDateSelect?: (date: Date) => void;
  onMonthChange?: (year: number, month: number) => void;
  /** Is active */
  isActive?: boolean;
}

export interface CalendarState {
  cursorDate: () => Date;
  viewDate: () => Date;
  selectedDates: () => Date[];
  rangeStart: () => Date | null;
  // Navigation
  moveDay: (delta: number) => void;
  moveWeek: (delta: number) => void;
  moveMonth: (delta: number) => void;
  moveYear: (delta: number) => void;
  goToToday: () => void;
  // Selection
  selectCursor: () => void;
  clearSelection: () => void;
  // View
  getMonthDays: () => CalendarDay[];
  updateOptions: (options: CalendarOptions) => void;
}

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  isWeekend: boolean;
  isDisabled: boolean;
  events: CalendarEvent[];
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if two dates are the same day
 */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Check if date is between two dates (inclusive)
 */
function isBetween(date: Date, start: Date, end: Date): boolean {
  const d = date.getTime();
  const s = Math.min(start.getTime(), end.getTime());
  const e = Math.max(start.getTime(), end.getTime());
  return d >= s && d <= e;
}

/**
 * Get first day of month
 */
function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/**
 * Get last day of month
 */
function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

/**
 * Get week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get month name
 */
function getMonthName(month: number): string {
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return names[month] || '';
}

/**
 * Get short weekday names
 */
function getWeekdayNames(firstDay: 0 | 1): string[] {
  const names = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  if (firstDay === 1) {
    return [...names.slice(1), names[0]!];
  }
  return names;
}

// =============================================================================
// State Factory
// =============================================================================

/**
 * Create a Calendar state manager
 */
export function createCalendar(options: CalendarOptions = {}): CalendarState {
  const {
    initialDate = new Date(),
    selectedDates: initialSelected = [],
  } = options;
  let runtimeOptions = options;

  const [cursorDate, setCursorDate] = createSignal(initialDate);
  const [viewDate, setViewDate] = createSignal(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );
  const [selectedDates, setSelectedDates] = createSignal<Date[]>(initialSelected);
  const [rangeStart, setRangeStart] = createSignal<Date | null>(null);

  const today = new Date();

  // Check if date is disabled
  const isDateDisabled = (date: Date): boolean => {
    const minDate = runtimeOptions.minDate;
    const maxDate = runtimeOptions.maxDate;
    const disabledDates = runtimeOptions.disabledDates ?? [];
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return disabledDates.some((d) => isSameDay(d, date));
  };

  // Navigation
  const moveDay = (delta: number) => {
    setCursorDate((d) => {
      const newDate = new Date(d);
      newDate.setDate(newDate.getDate() + delta);

      // Update view if needed
      if (
        newDate.getMonth() !== viewDate().getMonth() ||
        newDate.getFullYear() !== viewDate().getFullYear()
      ) {
        setViewDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
        runtimeOptions.onMonthChange?.(newDate.getFullYear(), newDate.getMonth());
      }

      return newDate;
    });
  };

  const moveWeek = (delta: number) => {
    moveDay(delta * 7);
  };

  const moveMonth = (delta: number) => {
    setViewDate((d) => {
      const newDate = new Date(d.getFullYear(), d.getMonth() + delta, 1);
      runtimeOptions.onMonthChange?.(newDate.getFullYear(), newDate.getMonth());
      return newDate;
    });
    setCursorDate((d) => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  const moveYear = (delta: number) => {
    setViewDate((d) => {
      const newDate = new Date(d.getFullYear() + delta, d.getMonth(), 1);
      runtimeOptions.onMonthChange?.(newDate.getFullYear(), newDate.getMonth());
      return newDate;
    });
    setCursorDate((d) => {
      const newDate = new Date(d);
      newDate.setFullYear(newDate.getFullYear() + delta);
      return newDate;
    });
  };

  const goToToday = () => {
    const now = new Date();
    setCursorDate(now);
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    runtimeOptions.onMonthChange?.(now.getFullYear(), now.getMonth());
  };

  // Selection
  const selectCursor = () => {
    const cursor = cursorDate();
    if (isDateDisabled(cursor)) return;

    const selectionMode = runtimeOptions.selectionMode ?? 'single';
    if (selectionMode === 'none') return;

    if (selectionMode === 'single') {
      setSelectedDates([cursor]);
      runtimeOptions.onDateSelect?.(cursor);
    } else if (selectionMode === 'multiple') {
      setSelectedDates((prev) => {
        const exists = prev.some((d) => isSameDay(d, cursor));
        if (exists) {
          return prev.filter((d) => !isSameDay(d, cursor));
        }
        const newDates = [...prev, cursor];
        runtimeOptions.onDateSelect?.(cursor);
        return newDates;
      });
    } else if (selectionMode === 'range') {
      const start = rangeStart();
      if (!start) {
        setRangeStart(cursor);
        setSelectedDates([cursor]);
      } else {
        // Complete range
        const dates: Date[] = [];
        const startTime = Math.min(start.getTime(), cursor.getTime());
        const endTime = Math.max(start.getTime(), cursor.getTime());
        for (let t = startTime; t <= endTime; t += 86400000) {
          dates.push(new Date(t));
        }
        setSelectedDates(dates);
        setRangeStart(null);
        runtimeOptions.onDateSelect?.(cursor);
      }
    }
  };

  const clearSelection = () => {
    setSelectedDates([]);
    setRangeStart(null);
  };

  // Generate month days grid
  const getMonthDays = (): CalendarDay[] => {
    const view = viewDate();
    const year = view.getFullYear();
    const month = view.getMonth();
    const events = runtimeOptions.events ?? [];
    const firstDayOfWeek = runtimeOptions.firstDayOfWeek ?? 0;

    const firstDay = getFirstDayOfMonth(year, month);
    const lastDay = getLastDayOfMonth(year, month);

    // Adjust for first day of week
    let startOffset = firstDay.getDay() - firstDayOfWeek;
    if (startOffset < 0) startOffset += 7;

    const days: CalendarDay[] = [];
    const cursor = cursorDate();
    const selected = selectedDates();
    const range = rangeStart();

    // Previous month days
    const prevMonth = new Date(year, month - 1, 1);
    const prevLastDay = getLastDayOfMonth(year, month - 1).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevLastDay - i);
      days.push({
        date,
        dayOfMonth: date.getDate(),
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
        isSelected: selected.some((d) => isSameDay(d, date)),
        isRangeStart: range ? isSameDay(range, date) : false,
        isRangeEnd: false,
        isInRange: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isDisabled: isDateDisabled(date),
        events: events.filter((e) => e.date === formatDate(date)),
      });
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const isInRange =
        range && cursor
          ? isBetween(date, range, cursor) && !isSameDay(date, range) && !isSameDay(date, cursor)
          : false;

      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
        isSelected: selected.some((d) => isSameDay(d, date)),
        isRangeStart: range ? isSameDay(range, date) : false,
        isRangeEnd: range && cursor ? isSameDay(cursor, date) : false,
        isInRange,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isDisabled: isDateDisabled(date),
        events: events.filter((e) => e.date === formatDate(date)),
      });
    }

    // Next month days (fill to 6 weeks = 42 days)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        dayOfMonth: i,
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
        isSelected: selected.some((d) => isSameDay(d, date)),
        isRangeStart: false,
        isRangeEnd: false,
        isInRange: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isDisabled: isDateDisabled(date),
        events: events.filter((e) => e.date === formatDate(date)),
      });
    }

    return days;
  };

  return {
    cursorDate,
    viewDate,
    selectedDates,
    rangeStart,
    moveDay,
    moveWeek,
    moveMonth,
    moveYear,
    goToToday,
    selectCursor,
    clearSelection,
    getMonthDays,
    updateOptions: (nextOptions: CalendarOptions) => {
      runtimeOptions = nextOptions;
    },
  };
}

export function useCalendarState(options: CalendarOptions = {}) {
  const state = useConst(() => createCalendar(options));
  state.updateOptions(options);
  return state;
}

// =============================================================================
// Component
// =============================================================================

export interface CalendarProps extends CalendarOptions, ComponentKeyProps {
  /** Pre-created state */
  state?: CalendarState;
}

/**
 * Calendar - Month view calendar
 *
 * @example
 * // Basic calendar
 * Calendar({
 *   onDateSelect: (date) => console.log(date),
 * })
 *
 * @example
 * // With events
 * Calendar({
 *   events: [
 *     { date: '2024-03-15', label: 'Meeting', color: 'blue' },
 *     { date: '2024-03-20', label: 'Deadline', color: 'red' },
 *   ],
 *   selectionMode: 'range',
 * })
 */
function renderCalendar(props: CalendarProps): VNode {
  const {
    firstDayOfWeek = 0,
    showWeekNumbers = false,
    colorToday = 'success',
    colorSelected = 'primary',
    colorEvent = 'warning',
    colorWeekend = 'mutedForeground',
    colorHeader = 'accent',
    cellWidth = 4,
    isActive = true,
    state: externalState,
  } = props;

  const state = useFactoryState(externalState, props, createCalendar);
  const isAscii = getRenderMode() === 'ascii';
  const theme = getTheme();

  // Setup keyboard handling
  useInput(
    (input, key) => {
      if (key.leftArrow || input === 'h') {
        state.moveDay(-1);
      } else if (key.rightArrow || input === 'l') {
        state.moveDay(1);
      } else if (key.upArrow || input === 'k') {
        state.moveWeek(-1);
      } else if (key.downArrow || input === 'j') {
        state.moveWeek(1);
      } else if (input === 'H' || input === '<') {
        state.moveMonth(-1);
      } else if (input === 'L' || input === '>') {
        state.moveMonth(1);
      } else if (input === 'K') {
        state.moveYear(-1);
      } else if (input === 'J') {
        state.moveYear(1);
      } else if (key.return || input === ' ') {
        state.selectCursor();
      } else if (input === 't') {
        state.goToToday();
      } else if (key.escape) {
        state.clearSelection();
      }
    },
    { isActive }
  );

  const view = state.viewDate();
  const cursor = state.cursorDate();
  const days = state.getMonthDays();
  const weekdays = getWeekdayNames(firstDayOfWeek);

  // Header
  const header = Box(
    { flexDirection: 'row', justifyContent: 'center', marginBottom: 1 },
    Text({ color: colorHeader, bold: true }, `${getMonthName(view.getMonth())} ${view.getFullYear()}`)
  );

  // Weekday header
  const weekdayNodes = weekdays.map((wd) =>
    Box(
      { width: cellWidth, justifyContent: 'center' },
      Text({ color: 'mutedForeground', bold: true }, wd)
    )
  );

  if (showWeekNumbers) {
    weekdayNodes.unshift(Box({ width: 3 }, Text({ color: 'mutedForeground', dim: true }, 'Wk')));
  }

  const weekdayHeader = Box({ flexDirection: 'row', marginBottom: 1 }, ...weekdayNodes);

  // Build weeks
  const weeks: VNode[] = [];
  for (let w = 0; w < 6; w++) {
    const weekDays = days.slice(w * 7, (w + 1) * 7);
    if (weekDays.length === 0) break;

    const weekCells: VNode[] = [];

    // Week number
    if (showWeekNumbers) {
      const weekNum = getWeekNumber(weekDays[0]!.date);
      weekCells.push(
        Box({ width: 3 }, Text({ color: 'mutedForeground', dim: true }, String(weekNum)))
      );
    }

    // Day cells
    for (const day of weekDays) {
      const isCursor = isSameDay(day.date, cursor);

      // Determine cell color
      let color: ColorValue = 'foreground';
      let dim = false;
      let bold = false;
      let bgColor: ColorValue | undefined;

      if (day.isDisabled) {
        color = 'mutedForeground';
        dim = true;
      } else if (day.isSelected || day.isRangeStart || day.isRangeEnd) {
        bgColor = colorSelected;
        color = getContrastColor(colorSelected as string);
        bold = true;
      } else if (day.isInRange) {
        color = colorSelected;
        dim = true;
      } else if (day.isToday) {
        color = colorToday;
        bold = true;
      } else if (!day.isCurrentMonth) {
        color = 'mutedForeground';
        dim = true;
      } else if (day.isWeekend) {
        color = colorWeekend;
      }

      // Event indicator
      let eventIndicator = '';
      if (day.events.length > 0) {
        eventIndicator = isAscii ? '*' : '•';
      }

      // Cursor styling
      if (isCursor) {
        bold = true;
        if (!bgColor) {
          // Use theme-based cursor colors
          bgColor = theme.foreground.primary;
          color = getContrastColor(bgColor);
        }
      }

      const dayStr = String(day.dayOfMonth).padStart(2, ' ');
      const trailingSpaces = ' '.repeat(
        Math.max(0, cellWidth - 1 - dayStr.length - eventIndicator.length),
      );

      weekCells.push(
        Box(
          {
            width: cellWidth,
            flexDirection: 'row',
            justifyContent: 'center',
            backgroundColor: bgColor,
          },
          Text({ color, bold, dim, backgroundColor: bgColor }, dayStr),
          eventIndicator
            ? Text(
                {
                  color: day.isDisabled ? color : colorEvent,
                  bold: true,
                  dim,
                  backgroundColor: bgColor,
                  'aria-label': day.events.map(event => event.label).join(', '),
                },
                eventIndicator,
              )
            : null,
          trailingSpaces ? Text({ backgroundColor: bgColor }, trailingSpaces) : null,
        )
      );
    }

    weeks.push(Box({ flexDirection: 'row' }, ...weekCells));
  }

  // Footer with navigation hints
  const footer = Box(
    { marginTop: 1 },
    Text(
      { color: 'mutedForeground', dim: true },
      isAscii
        ? 'hjkl: nav  <>: month  Enter: select  t: today'
        : '←↓↑→: nav  ⇧←⇧→: month  ↵: select  t: today'
    )
  );

  return Box(
    { flexDirection: 'column' },
    header,
    weekdayHeader,
    ...weeks,
    footer
  );
}

// =============================================================================
// MiniCalendar (compact version)
// =============================================================================

export interface MiniCalendarOptions extends Omit<CalendarOptions, 'showWeekNumbers'>, ComponentKeyProps {
  /** Show navigation arrows */
  showNavigation?: boolean;
}

/**
 * MiniCalendar - Compact calendar widget
 */
function renderMiniCalendar(props: MiniCalendarOptions): VNode {
  const { showNavigation = true, ...rest } = props;

  return Calendar({
    ...rest,
    showWeekNumbers: false,
    cellWidth: 3,
  });
}

// =============================================================================
// DatePicker (Calendar + Input)
// =============================================================================

export interface DatePickerOptions extends CalendarOptions {
  /** Date format for display */
  format?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Input width */
  inputWidth?: number;
  /** Show calendar below input */
  dropdownPosition?: 'below' | 'above';
}

export interface DatePickerState extends CalendarState {
  isOpen: () => boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  formattedValue: () => string;
  updateOptions: (options: DatePickerOptions) => void;
}

/**
 * Create a DatePicker state manager
 */
export function createDatePicker(options: DatePickerOptions = {}): DatePickerState {
  const calendarState = createCalendar(options);
  const [isOpen, setIsOpen] = createSignal(false);
  let runtimeOptions = options;
  const [optionsVersion, setOptionsVersion] = createSignal(0);

  const formattedValue = createMemo(() => {
    optionsVersion();
    const dates = calendarState.selectedDates();
    if (dates.length === 0) return '';

    const format = runtimeOptions.format ?? 'YYYY-MM-DD';
    const formatSelectedDate = (date: Date): string => format
      .replace(/YYYY/g, String(date.getFullYear()).padStart(4, '0'))
      .replace(/MM/g, String(date.getMonth() + 1).padStart(2, '0'))
      .replace(/DD/g, String(date.getDate()).padStart(2, '0'));
    if (dates.length === 1) {
      return formatSelectedDate(dates[0]!);
    }

    // Range
    const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
    return `${formatSelectedDate(sorted[0]!)} - ${formatSelectedDate(sorted[sorted.length - 1]!)}`;
  });

  return {
    ...calendarState,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((v) => !v),
    formattedValue,
    updateOptions: (nextOptions: DatePickerOptions) => {
      runtimeOptions = nextOptions;
      calendarState.updateOptions(nextOptions);
      setOptionsVersion((version) => version + 1);
    },
  };
}

export interface DatePickerProps extends DatePickerOptions, ComponentKeyProps {
  /** Pre-created state */
  state?: DatePickerState;
}

export function useDatePickerState(options: DatePickerOptions = {}) {
  const state = useConst(() => createDatePicker(options));
  state.updateOptions(options);
  return state;
}

/**
 * DatePicker - Calendar with input field
 */
function renderDatePicker(props: DatePickerProps): VNode {
  const {
    placeholder = 'Select date...',
    inputWidth = 20,
    isActive = true,
    state: externalState,
    ...rest
  } = props;

  const state = useFactoryState(externalState, props, createDatePicker);

  // Setup keyboard handling
  useInput(
    (_input, key) => {
      if (key.return && !state.isOpen()) {
        state.open();
      } else if (key.escape && state.isOpen()) {
        state.close();
      } else if (state.isOpen()) {
        if (key.leftArrow) state.moveDay(-1);
        else if (key.rightArrow) state.moveDay(1);
        else if (key.upArrow) state.moveWeek(-1);
        else if (key.downArrow) state.moveWeek(1);
        else if (key.return) {
          state.selectCursor();
          state.close();
        }
      }
    },
    { isActive }
  );

  const value = state.formattedValue();
  const isOpen = state.isOpen();

  // Input display
  const inputNode = Box(
    {
      width: inputWidth,
      borderStyle: 'single',
      borderColor: isOpen ? 'primary' : 'border',
      paddingX: 1,
    },
    Text({ color: value ? 'foreground' : 'mutedForeground', dim: !value }, value || placeholder)
  );

  // Calendar dropdown
  let calendarNode: VNode | null = null;
  if (isOpen) {
    calendarNode = Box(
      { marginTop: 1 },
      Calendar({ ...rest, state, isActive })
    );
  }

  return Box(
    { flexDirection: 'column' },
    inputNode,
    calendarNode
  );
}

export const Calendar = component<CalendarProps, VNode>('Calendar', renderCalendar);
export const MiniCalendar = component<MiniCalendarOptions, VNode>('MiniCalendar', renderMiniCalendar);
export const DatePicker = component<DatePickerProps, VNode>('DatePicker', renderDatePicker);
