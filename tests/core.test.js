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

test('Kurdish Zayni shares Gregorian dates while retaining a separate calendar identity', () => {
  const gregorian = HewargeDate.fromGregorian(2026, 9, 7);
  const zayni = gregorian.convert('kurdish-zayni');
  assert.equal(zayni.calendar, 'kurdish-zayni');
  assert.deepEqual(zayni.toObjectDate(), {year:2026,month:9,day:7});
  assert.deepEqual(zayni.toGregorian(), {year:2026,month:9,day:7});
  assert.deepEqual(HewargeDate.fromKurdishZayni(2026, 9, 7).toJdn(), gregorian.toJdn());
  assert.deepEqual(gregorian.toKurdish(), {year:2726,month:6,day:16});
});

test('registry exposes all five supported calendars', () => assert.deepEqual(CalendarRegistry.list(), ['gregorian','jalali','kurdish','kurdish-zayni','hijri']));
