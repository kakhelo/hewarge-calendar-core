import { CalendarRegistry } from './CalendarRegistry.js';
import { InvalidDateError, InvalidOperationError } from './errors.js';

const assertDateValue = value => {
  if (!(value instanceof DateValue)) throw new TypeError('Expected a Hewarge DateValue.');
};

export class DateValue {
  constructor(engine, year, month, day, jdn) {
    this.calendar = engine.id;
    this.year = year;
    this.month = month;
    this.day = day;
    this._jdn = jdn;
    Object.freeze(this);
  }

  get engine() { return CalendarRegistry.get(this.calendar); }
  get daysInMonth() { return this.engine.daysInMonth(this.year, this.month); }
  get dayOfYear() { return this._jdn - this.engine.toJdn(this.year, 1, 1) + 1; }
  get dayOfWeek() { return (this._jdn + 1) % 7; } // Sunday=0 ... Saturday=6
  get isLeapYear() { return this.engine.isLeapYear(this.year); }

  toJdn() { return this._jdn; }
  toObject() { return { calendar: this.calendar, year: this.year, month: this.month, day: this.day }; }
  toObjectDate() { return { year: this.year, month: this.month, day: this.day }; }
  toJSON() { return this.toObject(); }
  toGregorian() { return this.convert('gregorian').toObjectDate(); }
  toJalali() { return this.convert('jalali').toObjectDate(); }
  toKurdish() { return this.convert('kurdish').toObjectDate(); }
  toHijri() { return this.convert('hijri').toObjectDate(); }

  convert(name) {
    const engine = CalendarRegistry.get(name);
    const value = engine.fromJdn(this._jdn);
    return new DateValue(engine, value.year, value.month, value.day, this._jdn);
  }

  with({ year = this.year, month = this.month, day = this.day } = {}) {
    return createDate(this.calendar, year, month, day);
  }

  add({ years = 0, months = 0, weeks = 0, days = 0 } = {}) {
    if (![years, months, weeks, days].every(Number.isFinite)) throw new InvalidOperationError('Date amounts must be finite numbers.');
    if (![years, months, weeks, days].every(Number.isInteger)) throw new InvalidOperationError('Date amounts must be integers.');
    const engine = this.engine;
    let year = this.year + years;
    let monthIndex = this.month - 1 + months;
    year += Math.floor(monthIndex / 12);
    monthIndex = ((monthIndex % 12) + 12) % 12;
    const month = monthIndex + 1;
    const day = Math.min(this.day, engine.daysInMonth(year, month));
    const base = createDate(this.calendar, year, month, day);
    const totalDays = days + weeks * 7;
    return totalDays === 0 ? base : base.addDays(totalDays);
  }

  addDays(days) {
    if (!Number.isInteger(days)) throw new InvalidOperationError('Days must be an integer.');
    const engine = this.engine;
    const jdn = this._jdn + days;
    const value = engine.fromJdn(jdn);
    return new DateValue(engine, value.year, value.month, value.day, jdn);
  }

  subtract(amount = {}) {
    return this.add({
      years: -(amount.years || 0),
      months: -(amount.months || 0),
      weeks: -(amount.weeks || 0),
      days: -(amount.days || 0)
    });
  }

  difference(other, unit = 'days') {
    assertDateValue(other);
    const days = other.toJdn() - this.toJdn();
    if (unit === 'days') return days;
    if (unit === 'weeks') return days / 7;
    if (unit === 'months') return this._calendarMonthDifference(other);
    if (unit === 'years') return this._calendarYearDifference(other);
    throw new InvalidOperationError(`Unsupported difference unit: ${unit}`);
  }

  _calendarMonthDifference(other) {
    const target = other.convert(this.calendar);
    let months = (target.year - this.year) * 12 + (target.month - this.month);
    let candidate = this.add({ months });
    if (daysSign(candidate, target) > 0) months--;
    else {
      const next = this.add({ months: months + 1 });
      if (daysSign(next, target) <= 0) months++;
    }
    return months;
  }

  _calendarYearDifference(other) {
    const target = other.convert(this.calendar);
    let years = target.year - this.year;
    let candidate = this.add({ years });
    if (daysSign(candidate, target) > 0) years--;
    else {
      const next = this.add({ years: years + 1 });
      if (daysSign(next, target) <= 0) years++;
    }
    return years;
  }

  startOf(unit) {
    const e = this.engine;
    if (unit === 'day') return this;
    if (unit === 'month') return createDate(this.calendar, this.year, this.month, 1);
    if (unit === 'year') return createDate(this.calendar, this.year, 1, 1);
    throw new InvalidOperationError(`Unsupported startOf unit: ${unit}`);
  }

  endOf(unit) {
    const e = this.engine;
    if (unit === 'day') return this;
    if (unit === 'month') return createDate(this.calendar, this.year, this.month, e.daysInMonth(this.year, this.month));
    if (unit === 'year') return createDate(this.calendar, this.year, 12, e.daysInMonth(this.year, 12));
    throw new InvalidOperationError(`Unsupported endOf unit: ${unit}`);
  }

  isBefore(other) { assertDateValue(other); return this._jdn < other._jdn; }
  isAfter(other) { assertDateValue(other); return this._jdn > other._jdn; }
  isSame(other) { assertDateValue(other); return this._jdn === other._jdn; }
  equals(other) { return other instanceof DateValue && this._jdn === other._jdn; }

  format(pattern = 'YYYY-MM-DD') {
    const month = String(this.month).padStart(2, '0');
    const day = String(this.day).padStart(2, '0');
    return pattern
      .replaceAll('YYYY', String(this.year).padStart(4, '0'))
      .replaceAll('MM', month)
      .replaceAll('DD', day)
      .replaceAll('M', String(this.month))
      .replaceAll('D', String(this.day));
  }

  toString() { return this.format(); }
}

function daysSign(a, b) {
  const diff = a.toJdn() - b.toJdn();
  return Math.sign(diff);
}

export function createDate(name, year, month, day) {
  const engine = CalendarRegistry.get(name);
  if (!engine.isValidDate(year, month, day)) throw new InvalidDateError(name, year, month, day);
  return new DateValue(engine, year, month, day, engine.toJdn(year, month, day));
}
