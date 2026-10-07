import type { CalendarId, DateValue } from '../index.d.ts';

export type HewargeDatePickerOptions = {
  calendar?: CalendarId;
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
  gregorian: ConvertedDate; jalali: ConvertedDate; kurdish: ConvertedDate; hijri: ConvertedDate;
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
