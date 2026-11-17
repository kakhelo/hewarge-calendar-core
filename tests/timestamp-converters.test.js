import test from 'node:test';
import assert from 'node:assert/strict';
import { dateTimeToTimestamp, timestampToDateTime } from '../src/index.js';

test('millisecond timestamps round-trip with second and millisecond precision', () => {
  const value = {
    calendar: 'gregorian', year: 2026, month: 9, day: 7,
    hour: 12, minute: 34, second: 56, millisecond: 789
  };
  const timestamp = dateTimeToTimestamp(value, { unit: 'ms', timeZone: 'America/New_York' });
  const decoded = timestampToDateTime(timestamp, { unit: 'milliseconds', timeZone: 'America/New_York' });

  assert.equal(timestamp, Date.UTC(2026, 8, 7, 16, 34, 56, 789));
  assert.deepEqual(
    [decoded.year, decoded.month, decoded.day, decoded.hour, decoded.minute, decoded.second, decoded.millisecond],
    [2026, 9, 7, 12, 34, 56, 789]
  );
});

test('seconds timestamps preserve fractional seconds and requested calendar', () => {
  const timestamp = Date.UTC(2026, 8, 7, 16, 34, 56, 789) / 1000;
  const decoded = timestampToDateTime(timestamp, { unit: 'seconds', timeZone: 'America/New_York', calendar: 'kurdish' });

  assert.equal(decoded.timestamp, timestamp);
  assert.equal(decoded.unit, 'seconds');
  assert.deepEqual([decoded.year, decoded.month, decoded.day], [2726, 6, 16]);
  assert.equal(dateTimeToTimestamp(decoded, { unit: 'seconds', timeZone: decoded.timeZone }), timestamp);
});

test('timezone conversion handles a local date crossing UTC midnight', () => {
  const timestamp = dateTimeToTimestamp({
    calendar: 'gregorian', year: 2026, month: 9, day: 7,
    hour: 0, minute: 30
  }, { timeZone: 'Asia/Baghdad' });
  const decoded = timestampToDateTime(timestamp, { timeZone: 'Asia/Baghdad' });

  assert.equal(new Date(timestamp).toISOString(), '2026-09-06T21:30:00.000Z');
  assert.deepEqual([decoded.year, decoded.month, decoded.day, decoded.hour, decoded.minute], [2026, 9, 7, 0, 30]);
});

test('nonexistent local times during a daylight-saving gap are rejected', () => {
  assert.throws(() => dateTimeToTimestamp({
    calendar: 'gregorian', year: 2026, month: 3, day: 8, hour: 2, minute: 30
  }, { timeZone: 'America/New_York' }), /does not exist/);
});

test('invalid units and time fields are rejected', () => {
  assert.throws(() => timestampToDateTime(0, { unit: 'minutes' }), /Unsupported timestamp unit/);
  assert.throws(() => dateTimeToTimestamp({ year: 2026, month: 9, day: 7, second: 60 }), /Time must use/);
});