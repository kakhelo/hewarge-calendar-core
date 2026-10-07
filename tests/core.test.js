import test from 'node:test';
import assert from 'node:assert/strict';
import { HewargeDate, CalendarRegistry } from '../src/index.js';

test('Gregorian/Jalali/Kurdish roundtrip', () => {
  const g = HewargeDate.fromGregorian(2026, 9, 7);
  assert.deepEqual(g.toJalali(), {year:1405,month:6,day:16});
  assert.deepEqual(g.toKurdish(), {year:2726,month:6,day:16});
  assert.deepEqual(g.convert('kurdish').toGregorian(), {year:2026,month:9,day:7});
});

test('date operations remain immutable', () => {
  const d=HewargeDate.fromKurdish(2726,6,16);
  assert.deepEqual(d.add({days:7}).toKurdish(), {year:2726,month:6,day:23});
  assert.deepEqual(d.subtract({days:7}).toKurdish(), {year:2726,month:6,day:9});
  assert.deepEqual(d.toKurdish(), {year:2726,month:6,day:16});
});

test('registry exposes supported calendars', () => assert.deepEqual(CalendarRegistry.list(), ['gregorian','jalali','kurdish','hijri']));
