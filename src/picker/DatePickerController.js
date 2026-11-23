import { HewargeDate, CalendarRegistry } from '../index.js';
import { formatDate } from './HewargeDatePicker.js';

const DEFAULTS = {
  calendar: 'kurdish',
  locale: null,
  format: 'YYYY/MM/DD',
  weekStart: 6,
  direction: 'both',
  pastYears: null,
  futureYears: null,
  pastMonths: null,
  futureMonths: null,
  minDate: null,
  maxDate: null
};

const WEEKDAYS = {
  kurdish: ['یە', 'دو', 'سێ', 'چو', 'پێ', 'هە', 'شە'],
  'kurdish-zayni': ['یە', 'دو', 'سێ', 'چو', 'پێ', 'هە', 'شە'],
  jalali: ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'],
  hijri: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
  gregorian: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
};

const MESSAGES = {
  kurdish: { title: 'کوردی', direction: 'rtl' },
  'kurdish-zayni': { title: 'کوردی زاینی', direction: 'rtl' },
  jalali: { title: 'تقویم شمسی', direction: 'rtl' },
  hijri: { title: 'التقويم الهجري', direction: 'rtl' },
  gregorian: { title: 'Gregorian calendar', direction: 'ltr' }
};

function monthStart(calendar, year, month) {
  return HewargeDate.from(calendar, year, month, 1);
}

function monthName(calendar, month, locale) {
  const year = calendar === 'jalali' ? 1405 : calendar === 'kurdish' ? 2726 : calendar === 'hijri' ? 1448 : calendar === 'kurdish-zayni' ? 2026 : 2026;
  const resolvedLocale = locale || (calendar === 'jalali' ? 'fa' : calendar === 'hijri' ? 'ar' : calendar === 'gregorian' ? 'en' : 'ku-SO');
  return formatDate(monthStart(calendar, year, month), 'MMMM', { calendar, locale: resolvedLocale });
}

function asDate(calendar, value) {
  if (!value) return null;
  if (typeof value.convert === 'function' && typeof value.toObjectDate === 'function') return value.convert(calendar);
  if (typeof value !== 'object' || value.year == null || value.month == null || value.day == null) {
    throw new TypeError('A date value must include year, month and day.');
  }
  if (value.calendar && value.calendar !== calendar) {
    return HewargeDate.from(value.calendar, Number(value.year), Number(value.month), Number(value.day)).convert(calendar);
  }
  return HewargeDate.from(calendar, Number(value.year), Number(value.month), Number(value.day));
}

/** UI-independent date selection and calendar state for custom web or native interfaces. */
export class HewargeDatePickerController {
  constructor(options = {}) {
    this.options = { ...DEFAULTS, ...options };
    this.calendar = CalendarRegistry.get(this.options.calendar).id;
    const weekStart = Number(this.options.weekStart);
    this.options.weekStart = Number.isFinite(weekStart) ? ((Math.trunc(weekStart) % 7) + 7) % 7 : DEFAULTS.weekStart;
    this._listeners = new Set();
    this._todayProvider = typeof options.todayProvider === 'function' ? options.todayProvider : () => HewargeDate.today();
    this.value = asDate(this.calendar, options.value ?? options.initialValue) || this.todayValue();
    this.view = { year: this.value.year, month: this.value.month };
    if (!this.isAllowed(this.value)) throw new RangeError('The initial date is outside the configured range.');
  }

  todayValue() {
    const today = this._todayProvider();
    return asDate(this.calendar, today);
  }

  dateFromConfig(raw) {
    return asDate(this.calendar, raw);
  }

  bounds() {
    const today = this.todayValue();
    let min = this.dateFromConfig(this.options.minDate);
    let max = this.dateFromConfig(this.options.maxDate);
    if (this.options.direction === 'past') max ||= today;
    if (this.options.direction === 'future') min ||= today;
    if (Number.isFinite(this.options.pastYears)) min = today.add({ months: -Math.abs(this.options.pastYears) * 12 });
    if (Number.isFinite(this.options.futureYears)) max = today.add({ months: Math.abs(this.options.futureYears) * 12 });
    if (Number.isFinite(this.options.pastMonths)) min = today.add({ months: -Math.abs(this.options.pastMonths) });
    if (Number.isFinite(this.options.futureMonths)) max = today.add({ months: Math.abs(this.options.futureMonths) });
    return { min, max };
  }

  isAllowed(raw) {
    const date = asDate(this.calendar, raw);
    if (!date) return false;
    const { min, max } = this.bounds();
    return !(min && date.isBefore(min)) && !(max && date.isAfter(max));
  }

  canMoveMonth(delta) {
    const candidate = monthStart(this.calendar, this.view.year, this.view.month).add({ months: delta });
    const last = candidate.add({ days: candidate.daysInMonth - 1 });
    const { min, max } = this.bounds();
    return !(min && last.isBefore(min)) && !(max && candidate.isAfter(max));
  }

  subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('A listener function is required.');
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify(type) {
    const event = { type, state: this.getState() };
    for (const listener of this._listeners) listener(event);
    return this;
  }

  setCalendar(calendar) {
    const nextCalendar = CalendarRegistry.get(calendar).id;
    const nextValue = this.value ? this.value.convert(nextCalendar) : null;
    const previousCalendar = this.calendar;
    this.calendar = nextCalendar;
    if (nextValue && !this.isAllowed(nextValue)) {
      this.calendar = previousCalendar;
      throw new RangeError('The selected date is outside the configured range in the requested calendar.');
    }
    this.value = nextValue;
    if (nextValue) this.view = { year: nextValue.year, month: nextValue.month };
    return this._notify('change');
  }

  setDate(value) {
    const next = asDate(this.calendar, value);
    if (!this.isAllowed(next)) throw new RangeError('The selected date is outside the configured range.');
    this.value = next;
    this.view = { year: next.year, month: next.month };
    return this._notify('change');
  }

  select(day) {
    const next = HewargeDate.from(this.calendar, this.view.year, this.view.month, Number(day));
    return this.setDate(next);
  }

  setView(year, month) {
    const next = monthStart(this.calendar, Number(year), Number(month));
    const { min, max } = this.bounds();
    const end = next.add({ days: next.daysInMonth - 1 });
    if ((min && end.isBefore(min)) || (max && next.isAfter(max))) throw new RangeError('The requested month is outside the configured range.');
    this.view = { year: next.year, month: next.month };
    return this._notify('view');
  }

  navigate(delta) {
    if (!Number.isInteger(delta)) throw new TypeError('Month delta must be an integer.');
    if (!this.canMoveMonth(delta)) return this;
    const next = monthStart(this.calendar, this.view.year, this.view.month).add({ months: delta });
    return this.setView(next.year, next.month);
  }

  goToToday() {
    const today = this.todayValue();
    if (!this.isAllowed(today)) throw new RangeError('Today is outside the configured range.');
    return this.setDate(today);
  }

  clear() {
    this.value = null;
    return this._notify('clear');
  }

  getState() {
    const first = monthStart(this.calendar, this.view.year, this.view.month);
    const today = this.todayValue();
    const offset = ((first.dayOfWeek - this.options.weekStart) + 7) % 7;
    const weekdays = WEEKDAYS[this.calendar] || WEEKDAYS.gregorian;
    const locale = this.options.locale || (this.calendar === 'jalali' ? 'fa' : this.calendar === 'hijri' ? 'ar' : this.calendar === 'gregorian' ? 'en' : 'ku-SO');
    const days = Array.from({ length: first.daysInMonth }, (_, index) => {
      const date = HewargeDate.from(this.calendar, this.view.year, this.view.month, index + 1);
      return { day: index + 1, date: date.toObjectDate(), selected: Boolean(this.value?.isSame(date)), today: date.isSame(today), allowed: this.isAllowed(date) };
    });
    const bounds = this.bounds();
    const gregorian = this.value?.toGregorian() || null;
    return {
      calendar: this.calendar,
      locale,
      direction: MESSAGES[this.calendar]?.direction || 'ltr',
      title: MESSAGES[this.calendar]?.title || 'Calendar',
      value: this.value?.toObjectDate() || null,
      formattedValue: this.value ? formatDate(this.value, this.options.format, { ...this.options, calendar: this.calendar, locale }) : '',
      gregorianValue: gregorian ? `${String(gregorian.year).padStart(4, '0')}-${String(gregorian.month).padStart(2, '0')}-${String(gregorian.day).padStart(2, '0')}` : null,
      view: { ...this.view },
      monthLabel: monthName(this.calendar, this.view.month, locale),
      weekStart: this.options.weekStart,
      weekdays: Array.from({ length: 7 }, (_, index) => weekdays[(index + this.options.weekStart) % 7]),
      leadingEmptyDays: offset,
      days,
      canMovePrevious: this.canMoveMonth(-1),
      canMoveNext: this.canMoveMonth(1),
      bounds: { min: bounds.min?.toObjectDate() || null, max: bounds.max?.toObjectDate() || null }
    };
  }
}

export function createDatePickerController(options = {}) {
  return new HewargeDatePickerController(options);
}
