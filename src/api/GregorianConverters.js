import { HewargeDate } from '../HewargeDate.js';

/**
 * Parse a Gregorian database value into a Hewarge Gregorian date.
 * Supported inputs: YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY (when explicitly configured),
 * {year, month, day}, or a JavaScript Date.
 */
export function parseGregorianDate(input, format = 'YYYY-MM-DD') {
  if (input instanceof Date) return HewargeDate.fromDate(input);
  if (input && typeof input === 'object' && input.year != null && input.month != null && input.day != null) {
    return HewargeDate.fromGregorian(Number(input.year), Number(input.month), Number(input.day));
  }
  if (typeof input !== 'string') throw new TypeError('Expected a Gregorian date string, object, or Date.');
  const raw = input.trim();
  const parts = format.split(/(YYYY|MM|DD|M|D)/).filter(Boolean);
  const tokens = parts.filter(x => /^(YYYY|MM|DD|M|D)$/.test(x));
  const fields = { YYYY: 'year', MM: 'month', M: 'month', DD: 'day', D: 'day' };
  const source = parts.map(part => {
    if (fields[part]) return part === 'YYYY' ? '(-?\\d{1,6})' : '(\\d{1,2})';
    return part.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
  }).join('');
  const match = raw.match(new RegExp(`^${source}$`));
  if (!match || tokens.length < 3) throw new RangeError(`Invalid Gregorian date: ${input}`);
  const value = {};
  tokens.forEach((token, i) => { value[fields[token]] = Number(match[i + 1]); });
  return HewargeDate.fromGregorian(value.year, value.month, value.day);
}

function result(date, calendar) {
  const value = date[`to${calendar[0].toUpperCase()}${calendar.slice(1)}`]();
  const yearMonthDay = `${value.year}/${value.month}/${value.day}`;
  const yearMonthDayPadded = `${String(value.year).padStart(4, '0')}/${String(value.month).padStart(2, '0')}/${String(value.day).padStart(2, '0')}`;
  const dayMonthYear = `${value.day}/${value.month}/${value.year}`;
  const dayMonthYearPadded = `${String(value.day).padStart(2, '0')}/${String(value.month).padStart(2, '0')}/${String(value.year).padStart(4, '0')}`;
  return Object.freeze({
    year: value.year,
    month: value.month,
    day: value.day,
    value,
    yearMonthDay,
    yearMonthDayPadded,
    dayMonthYear,
    dayMonthYearPadded,
    calendar
  });
}

export function gregorianToKurdish(input, format = 'YYYY-MM-DD') {
  return result(parseGregorianDate(input, format), 'kurdish');
}
export function gregorianToJalali(input, format = 'YYYY-MM-DD') {
  return result(parseGregorianDate(input, format), 'jalali');
}
export function gregorianToHijri(input, format = 'YYYY-MM-DD') {
  return result(parseGregorianDate(input, format), 'hijri');
}

export function formatGregorianDate(input, pattern = 'YYYY-MM-DD') {
  const date = parseGregorianDate(input);
  return pattern.replaceAll('YYYY', String(date.year).padStart(4, '0'))
    .replaceAll('MM', String(date.month).padStart(2, '0'))
    .replaceAll('DD', String(date.day).padStart(2, '0'))
    .replaceAll('M', String(date.month))
    .replaceAll('D', String(date.day));
}
