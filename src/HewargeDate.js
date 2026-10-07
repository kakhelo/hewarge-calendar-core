import { createDate } from './api/DateValue.js';
import { CalendarRegistry } from './api/CalendarRegistry.js';

export const HewargeDate = {
  from: (calendar, year, month, day) => createDate(calendar, year, month, day),
  fromGregorian: (year, month, day) => createDate('gregorian', year, month, day),
  fromJalali: (year, month, day) => createDate('jalali', year, month, day),
  fromKurdish: (year, month, day) => createDate('kurdish', year, month, day),
  fromHijri: (year, month, day) => createDate('hijri', year, month, day),
  fromObject(value) {
    if (!value || typeof value !== 'object') throw new TypeError('Expected a date object.');
    return createDate(value.calendar || 'gregorian', value.year, value.month, value.day);
  },
  fromDate(date = new Date()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new TypeError('Expected a valid JavaScript Date.');
    return createDate('gregorian', date.getFullYear(), date.getMonth() + 1, date.getDate());
  },
  fromUTCDate(date = new Date()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new TypeError('Expected a valid JavaScript Date.');
    return createDate('gregorian', date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  },
  today() { return this.fromDate(new Date()); },
  calendars() { return CalendarRegistry.list(); }
};
