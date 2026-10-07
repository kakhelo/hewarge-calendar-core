import test from 'node:test';
import assert from 'node:assert/strict';
import { HewargeDate, gregorianToKurdish, gregorianToJalali, gregorianToHijri, formatGregorianDate } from '../src/index.js';

test('Gregorian conversion helpers return structured and joined values', () => {
  const input = '2026-09-07';
  const k = gregorianToKurdish(input);
  const j = gregorianToJalali(input);
  const h = gregorianToHijri(input);
  assert.deepEqual({year:k.year, month:k.month, day:k.day}, {year:2726, month:6, day:16});
  assert.equal(k.dayMonthYear, '16/6/2726');
  assert.equal(k.dayMonthYearPadded, '16/06/2726');
  assert.equal(k.yearMonthDay, '2726/6/16');
  assert.deepEqual({year:j.year, month:j.month, day:j.day}, {year:1405, month:6, day:16});
  assert.equal(typeof h.year, 'number');
});

test('Gregorian input can be used directly from a database Date object', () => {
  const k = gregorianToKurdish({year:2026, month:9, day:7});
  assert.equal(k.dayMonthYear, '16/6/2726');
  const j = gregorianToJalali(new Date(2026, 8, 7));
  assert.deepEqual({year:j.year, month:j.month, day:j.day}, {year:1405, month:6, day:16});
});

test('formatGregorianDate keeps storage Gregorian', () => {
  assert.equal(formatGregorianDate('2026-09-07'), '2026-09-07');
  assert.equal(formatGregorianDate('2026-09-07', 'DD/MM/YYYY'), '07/09/2026');
});

test('DateValue JSON is no longer used by the picker contract', () => {
  const d = HewargeDate.fromGregorian(2026,9,7);
  assert.equal(d.toGregorian().year, 2026);
});
