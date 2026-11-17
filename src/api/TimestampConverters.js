import { DateValue } from './DateValue.js';
import { HewargeDate } from '../HewargeDate.js';

const formatterCache = new Map();
const VALID_UNITS = new Map([
  ['milliseconds', 'milliseconds'], ['millisecond', 'milliseconds'], ['ms', 'milliseconds'],
  ['seconds', 'seconds'], ['second', 'seconds'], ['s', 'seconds']
]);

function normalizeUnit(unit = 'milliseconds') {
  const normalized = VALID_UNITS.get(unit);
  if (!normalized) throw new RangeError(`Unsupported timestamp unit: ${unit}`);
  return normalized;
}

function getFormatter(timeZone) {
  if (typeof timeZone !== 'string' || !timeZone.trim()) throw new TypeError('timeZone must be a non-empty IANA time-zone name.');
  if (!formatterCache.has(timeZone)) {
    formatterCache.set(timeZone, new Intl.DateTimeFormat('en-US-u-nu-latn', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }));
  }
  return formatterCache.get(timeZone);
}

function partsAt(epochMilliseconds, formatter) {
  const date = new Date(epochMilliseconds);
  if (Number.isNaN(date.getTime())) throw new RangeError('Timestamp is outside the supported JavaScript Date range.');
  const parts = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second),
    millisecond: date.getUTCMilliseconds()
  };
}

function utcEpoch({ year, month, day, hour, minute, second, millisecond }) {
  const date = new Date(0);
  date.setUTCHours(hour, minute, second, millisecond);
  date.setUTCFullYear(year, month - 1, day);
  const epoch = date.getTime();
  if (Number.isNaN(epoch)) throw new RangeError('Date-time is outside the supported JavaScript Date range.');
  return epoch;
}

function sameDateTime(a, b) {
  return a.year === b.year && a.month === b.month && a.day === b.day &&
    a.hour === b.hour && a.minute === b.minute && a.second === b.second &&
    a.millisecond === b.millisecond;
}

function validateTime(value) {
  const time = {
    hour: value.hour ?? 0,
    minute: value.minute ?? 0,
    second: value.second ?? 0,
    millisecond: value.millisecond ?? 0
  };
  if (!Number.isInteger(time.hour) || time.hour < 0 || time.hour > 23 ||
      !Number.isInteger(time.minute) || time.minute < 0 || time.minute > 59 ||
      !Number.isInteger(time.second) || time.second < 0 || time.second > 59 ||
      !Number.isInteger(time.millisecond) || time.millisecond < 0 || time.millisecond > 999) {
    throw new RangeError('Time must use hour 0-23, minute/second 0-59, and millisecond 0-999.');
  }
  return time;
}

/** Convert an epoch timestamp to calendar date/time fields in a timezone. */
export function timestampToDateTime(timestamp, { unit = 'milliseconds', timeZone = 'UTC', calendar = 'gregorian' } = {}) {
  const normalizedUnit = normalizeUnit(unit);
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) throw new TypeError('timestamp must be a finite number.');
  const epochMilliseconds = Math.trunc(normalizedUnit === 'seconds' ? timestamp * 1000 : timestamp);
  const fields = partsAt(epochMilliseconds, getFormatter(timeZone));
  const date = HewargeDate.fromGregorian(fields.year, fields.month, fields.day).convert(calendar);
  return Object.freeze({
    ...date.toObject(),
    hour: fields.hour,
    minute: fields.minute,
    second: fields.second,
    millisecond: fields.millisecond,
    timeZone,
    date,
    epochMilliseconds,
    timestamp: normalizedUnit === 'seconds' ? epochMilliseconds / 1000 : epochMilliseconds,
    unit: normalizedUnit
  });
}

/** Convert a calendar date/time object to an epoch timestamp in the requested unit. */
export function dateTimeToTimestamp(value, { unit = 'milliseconds', timeZone = 'UTC' } = {}) {
  const normalizedUnit = normalizeUnit(unit);
  const dateValue = value instanceof DateValue
    ? value
    : HewargeDate.from(value?.calendar || 'gregorian', value?.year, value?.month, value?.day);
  const date = dateValue.toGregorian();
  const time = validateTime(value instanceof DateValue ? {} : value);
  const targetLocalEpoch = utcEpoch({ ...date, ...time });
  const formatter = getFormatter(timeZone);
  const offsets = new Set();

  // Sample nearby offsets so both sides of daylight-saving transitions are considered.
  for (let hours = -36; hours <= 36; hours += 6) {
    const sample = targetLocalEpoch + hours * 60 * 60 * 1000;
    try {
      const local = partsAt(sample, formatter);
      offsets.add(utcEpoch(local) - sample);
    } catch {}
  }

  const matches = [...offsets]
    .map(offset => targetLocalEpoch - offset)
    .filter(candidate => {
      try { return sameDateTime(partsAt(candidate, formatter), { ...date, ...time }); }
      catch { return false; }
    })
    .sort((a, b) => a - b);

  if (!matches.length) {
    throw new RangeError('The requested local date-time does not exist in this time zone (possibly a daylight-saving gap).');
  }
  const epochMilliseconds = matches[0];
  return normalizedUnit === 'seconds' ? epochMilliseconds / 1000 : epochMilliseconds;
}