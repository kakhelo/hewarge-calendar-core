import type { CalendarId, DateValue } from '../index.d.ts';

export type HewargeDatePickerOptions = {
  calendar?: CalendarId;
  /** Visual interface per picker instance. */
  variant?: 'default' | 'calendar-card' | 'calendar-glass';
  locale?: string;
  format?: string;
  /** Legacy/custom Gregorian parsing format. Storage is always canonical YYYY-MM-DD. */
  gregorianFormat?: string;
  /** Existing hidden/input element or CSS selector that receives canonical Gregorian YYYY-MM-DD. */
  storageInput?: HTMLInputElement | string | null;
  /** Create a hidden storage input automatically with this name. */
  storageName?: string | null;
  /** Whether a storage input should be managed automatically. */
  autoStorage?: boolean;
  /** Mobile picker mode. auto uses wheel below 600px. */
  mobileMode?: 'auto' | 'wheel' | 'calendar';
  /** First weekday index: 0=Sunday, 1=Monday, ..., 6=Saturday. Defaults to Saturday (6). */
  weekStart?: number;
  closeOnSelect?: boolean;
  clearable?: boolean;
  todayButton?: boolean;
  keyboard?: boolean;
  inputValue?: boolean;
  direction?: 'both' | 'past' | 'future';
  pastYears?: number | null;
  futureYears?: number | null;
  pastMonths?: number | null;
  futureMonths?: number | null;
  minDate?: { year:number; month:number; day:number } | null;
  maxDate?: { year:number; month:number; day:number } | null;
};

export type ConvertedDate = {
  calendar: string; year: number; month: number; day: number;
  yearMonthDay: string; yearMonthDayPadded: string;
  dayMonthYear: string; dayMonthYearPadded: string;
};
export type HewargeChangeDetail = {
  calendar: string;
  /** Value shown in the visible input, e.g. 16/6/2726. */
  value: string;
  /** Canonical Gregorian value for DB/API/frontend state, always YYYY-MM-DD. */
  storageValue: string;
  /** Alias of storageValue. */
  gregorianValue: string;
  selected: ConvertedDate;
  gregorian: ConvertedDate; jalali: ConvertedDate; kurdish: ConvertedDate; kurdishZayni: ConvertedDate; hijri: ConvertedDate;
};

export declare class HewargeDatePicker {
  constructor(input: HTMLInputElement, options?: HewargeDatePickerOptions);
  input: HTMLInputElement;
  options: Required<HewargeDatePickerOptions>;
  calendar: string;
  value: DateValue;
  isOpen: boolean;
  open(): this;
  close(): this;
  destroy(): void;
  setCalendar(calendar: CalendarId): this;
  select(day: number): void;
  getGregorianValue(): string;
}

export declare function createDatePicker(input: HTMLInputElement, options?: HewargeDatePickerOptions): HewargeDatePicker;
export declare function attachDatePickers(root?: ParentNode, options?: HewargeDatePickerOptions & { selector?: string }): HewargeDatePicker[];
export declare const datePicker: {
  create: typeof createDatePicker;
  attach: typeof attachDatePickers;
  HewargeDatePicker: typeof HewargeDatePicker;
};

/** Options for the UI-independent controller used to build custom or native interfaces. */
export type HewargeDatePickerControllerOptions = Pick<HewargeDatePickerOptions,
  'calendar' | 'locale' | 'format' | 'weekStart' | 'direction' | 'pastYears' | 'futureYears' |
  'pastMonths' | 'futureMonths' | 'minDate' | 'maxDate'> & {
  value?: DateValue | { calendar?: CalendarId; year: number; month: number; day: number };
  initialValue?: DateValue | { calendar?: CalendarId; year: number; month: number; day: number };
  /** Injectable clock useful for deterministic tests and platform integrations. */
  todayProvider?: () => DateValue | { calendar?: CalendarId; year: number; month: number; day: number };
};
export type HewargeDatePickerControllerState = {
  calendar: CalendarId; locale: string; direction: 'ltr' | 'rtl'; title: string;
  value: { year: number; month: number; day: number } | null;
  formattedValue: string; gregorianValue: string | null;
  view: { year: number; month: number }; monthLabel: string; weekStart: number;
  weekdays: string[]; leadingEmptyDays: number;
  days: Array<{ day: number; date: { year: number; month: number; day: number }; selected: boolean; today: boolean; allowed: boolean }>;
  canMovePrevious: boolean; canMoveNext: boolean;
  bounds: { min: { year: number; month: number; day: number } | null; max: { year: number; month: number; day: number } | null };
};
export declare class HewargeDatePickerController {
  constructor(options?: HewargeDatePickerControllerOptions);
  readonly calendar: CalendarId;
  value: DateValue | null;
  view: { year: number; month: number };
  readonly options: HewargeDatePickerControllerOptions;
  getState(): HewargeDatePickerControllerState;
  subscribe(listener: (event: { type: 'change' | 'view' | 'clear'; state: HewargeDatePickerControllerState }) => void): () => boolean;
  isAllowed(date: DateValue | { calendar?: CalendarId; year: number; month: number; day: number }): boolean;
  canMoveMonth(delta: number): boolean;
  setCalendar(calendar: CalendarId): this;
  setDate(date: DateValue | { calendar?: CalendarId; year: number; month: number; day: number }): this;
  select(day: number): this;
  setView(year: number, month: number): this;
  navigate(delta: number): this;
  goToToday(): this;
  clear(): this;
}
export declare function createDatePickerController(options?: HewargeDatePickerControllerOptions): HewargeDatePickerController;

export type HewargeTimePickerOptions = {
  /** Visual time-picker interface. */
  variant?: 'default' | 'analog-clock' | 'ios-wheel';
  /** 12-hour or 24-hour clock. */
  format?: '12' | '24';
  /** IANA time-zone name, for example Asia/Baghdad. */
  timeZone?: string;
  /** Time zones shown in the selector; include the active zone automatically. */
  timeZones?: string[];
  /** Minute increment from 1 to 60. */
  minuteStep?: number;
  showSeconds?: boolean;
  keyboard?: boolean;
  locale?: string;
  direction?: 'ltr' | 'rtl' | 'auto';
  selector?: string;
};

export type HewargeTimeValue = { hour:number; minute:number; second:number };
export type HewargeTimeChangeDetail = HewargeTimeValue & {
  format: '12' | '24'; timeZone: string; value: string;
  dateTime?: { calendar?: CalendarId; year:number; month:number; day:number; hour:number; minute:number; second:number };
  timestamp?: number | null;
  validationError?: string;
};

export declare function formatTime(value: HewargeTimeValue, format?: '12' | '24', showSeconds?: boolean): string;
export declare function parseTime(value: string, format?: '12' | '24'): HewargeTimeValue | null;
export declare class HewargeTimePicker {
  constructor(input: HTMLInputElement, options?: HewargeTimePickerOptions);
  input: HTMLInputElement; options: HewargeTimePickerOptions; value: HewargeTimeValue; timeZone: string; isOpen: boolean;
  open(): this; close(): this; destroy(): void; setTime(value: HewargeTimeValue): this; setVariant(variant: 'default' | 'analog-clock' | 'ios-wheel'): this; setFormat(format: '12' | '24'): this; setShowSeconds(showSeconds: boolean): this; setLocale(locale: string): this; setTimeZone(timeZone: string): this;
  detail(date?: { calendar?: CalendarId; year:number; month:number; day:number }): HewargeTimeChangeDetail;
}
export declare function createTimePicker(input: HTMLInputElement, options?: HewargeTimePickerOptions): HewargeTimePicker;
export declare function attachTimePickers(root?: ParentNode, options?: HewargeTimePickerOptions): HewargeTimePicker[];
export declare const timePicker: { create: typeof createTimePicker; attach: typeof attachTimePickers; HewargeTimePicker: typeof HewargeTimePicker };

export type HewargeDateTimePickerOptions = Omit<HewargeDatePickerOptions, 'format' | 'variant'> & Omit<HewargeTimePickerOptions, 'format' | 'locale' | 'direction' | 'variant'> & {
  /** Visual date-picker interface. */
  variant?: 'default' | 'calendar-card' | 'calendar-glass';
  format?: string;
  /** Visual time-picker interface for the composed picker. */
  timeVariant?: 'default' | 'analog-clock' | 'ios-wheel';
  date?: HewargeDatePickerOptions;
  time?: HewargeTimePickerOptions;
};
export declare class HewargeDateTimePicker {
  constructor(dateInput: HTMLInputElement, timeInput: HTMLInputElement, options?: HewargeDateTimePickerOptions);
  readonly datePicker: HewargeDatePicker; readonly timePicker: HewargeTimePicker; readonly value: HewargeTimeChangeDetail;
  setCalendar(calendar: CalendarId): this; setTimeFormat(format: '12' | '24'): this; setTimeVariant(variant: 'default' | 'analog-clock' | 'ios-wheel'): this; setShowSeconds(showSeconds: boolean): this; setTimeZone(timeZone: string): this; destroy(): void;
}
export declare function createDateTimePicker(dateInput: HTMLInputElement, timeInput: HTMLInputElement, options?: HewargeDateTimePickerOptions): HewargeDateTimePicker;
export declare const dateTimePicker: { create: typeof createDateTimePicker; HewargeDateTimePicker: typeof HewargeDateTimePicker };
