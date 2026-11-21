import { HewargeDate } from '../HewargeDate.js';
import { DateValue, createDate } from '../api/DateValue.js';
import { CalendarRegistry } from '../api/CalendarRegistry.js';
import { normalizeTimeZone } from '../api/TimestampConverters.js';
import { resolveLocale } from './locales.js';
import { convertNumerals } from './numbering.js';
import { tokenizeFormat } from './tokenizer.js';
import { DATE_FORMAT_PRESETS, TIME_FORMAT_PRESETS, DATETIME_FORMAT_PRESETS } from './presets.js';

const compiledFormats = new Map();

export function resolvePreset(format, category) {
  if (typeof format !== 'string') return format;
  const map = category === 'time' ? TIME_FORMAT_PRESETS : category === 'dateTime' ? DATETIME_FORMAT_PRESETS : DATE_FORMAT_PRESETS;
  return map[format] || format;
}

export function compileFormat(format) {
  if (!compiledFormats.has(format)) compiledFormats.set(format, tokenizeFormat(format));
  return compiledFormats.get(format);
}

export function resolveDate(value, calendar = 'gregorian') {
  if (value instanceof DateValue) {
    if (value.calendar === calendar) return value;
    return value.convert(calendar);
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new RangeError('Invalid input date.');
    return HewargeDate.fromUTCDate(value).convert(calendar);
  }
  if (value && typeof value === 'object' && value.year != null && value.month != null && value.day != null) {
    return createDate(value.calendar || calendar, Number(value.year), Number(value.month), Number(value.day)).convert(calendar);
  }
  throw new TypeError('date must be a DateValue, JavaScript Date, or {year, month, day} object.');
}

function pad(value, length) { return String(value).padStart(length, '0'); }

function monthNames(date, locale, calendar) {
  const localeData = resolveLocale(locale, calendar);
  if (calendar === 'kurdish') {
    if (String(locale).toLowerCase().startsWith('ku-kmr')) return localeData.months;
    if (CalendarRegistry.get(calendar).months) return CalendarRegistry.get(calendar).months;
  }
  if (calendar === 'kurdish-zayni') {
    if (String(locale).toLowerCase().startsWith('ku-kmr')) return localeData.months;
    return CalendarRegistry.get(calendar).months;
  }
  if (calendar === 'jalali' && String(locale).toLowerCase().startsWith('fa')) return localeData.months;
  if (calendar === 'hijri') return localeData.months;
  return localeData.months;
}

function isoWeek(date) {
  const greg = date.convert('gregorian');
  const d = new Date(Date.UTC(greg.year, greg.month - 1, greg.day));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function isoWeekYear(date) {
  const greg = date.convert('gregorian');
  const d = new Date(Date.UTC(greg.year, greg.month - 1, greg.day));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return d.getUTCFullYear();
}

function calendarWeek(date, weekStart = 1) {
  const start = resolveDate(date.startOf('year'), date.calendar);
  const startWeekday = ((start.dayOfWeek - weekStart + 7) % 7);
  return Math.floor((date.dayOfYear - 1 + startWeekday) / 7) + 1;
}

function abbreviate(name, locale, narrow = false) {
  return name;
}

export function formatDate(date, format = 'YYYY-MM-DD', options = {}) {
  if (typeof format !== 'string' || format.length === 0) throw new TypeError('format must be a non-empty string.');
  format = resolvePreset(format, 'date');
  const calendar = options.calendar || (date?.calendar) || 'gregorian';
  const locale = options.locale || (calendar === 'jalali' ? 'fa' : calendar === 'hijri' ? 'ar' : calendar === 'gregorian' ? 'en' : 'ku-SO');
  const numbering = options.numberingSystem || (resolveLocale(locale, calendar).fallbackNumerals === 'fa' ? 'fa' : 'latn');
  const value = resolveDate(date, calendar);
  const localeData = resolveLocale(locale, calendar);
  const names = monthNames(value, locale, calendar);
  const parts = compileFormat(format);
  const output = parts.map(part => {
    if (part.type === 'literal') return part.value;
    const token = part.value;
    let result;
    switch(token) {
      case 'Y': case 'YY': case 'YYYY': result = token === 'Y' ? String(value.year) : token === 'YY' ? pad(value.year % 100, 2) : pad(value.year, 4); break;
      case 'M': case 'MM': result = token === 'M' ? String(value.month) : pad(value.month, 2); break;
      case 'MMM': result = abbreviate(names[value.month - 1] || '', locale); break;
      case 'MMMM': result = names[value.month - 1] || String(value.month); break;
      case 'MMMMM': { const name=names[value.month-1] || String(value.month); result=[...name][0] || name; break; }
      case 'D': case 'DD': result = token === 'D' ? String(value.day) : pad(value.day, 2); break;
      case 'DDD': result=String(value.dayOfYear); break;
      case 'DDDD': result=pad(value.dayOfYear,3); break;
      case 'd': { const greg=value.convert('gregorian'); const js=new Date(Date.UTC(greg.year,greg.month-1,greg.day)); const weekday=js.getUTCDay(); result=String((weekday+6)%7+1); break; }
      case 'dd': { const greg=value.convert('gregorian'); const js=new Date(Date.UTC(greg.year,greg.month-1,greg.day)); const weekday=js.getUTCDay(); result=(localeData.weekdays[weekday]||'').slice(0,2); break; }
      case 'ddd': { const greg=value.convert('gregorian'); const js=new Date(Date.UTC(greg.year,greg.month-1,greg.day)); const weekday=js.getUTCDay(); result=localeData.weekdaysAbbrev[weekday] || localeData.weekdays[weekday] || ''; break; }
      case 'dddd': { const greg=value.convert('gregorian'); const js=new Date(Date.UTC(greg.year,greg.month-1,greg.day)); const weekday=js.getUTCDay(); result=localeData.weekdays[weekday] || ''; break; }
      case 'w': result=String(calendarWeek(value, options.weekStart)); break;
      case 'ww': result=pad(calendarWeek(value, options.weekStart),2); break;
      case 'W': result=String(isoWeek(value)); break;
      case 'WW': result=pad(isoWeek(value),2); break;
      default: throw new RangeError(`Unsupported date token: ${token}`);
    }
    return convertNumerals(result, numbering);
  }).join('');
  return output;
}
