import test from 'node:test';
import assert from 'node:assert/strict';
import { datePicker, createDatePicker, attachDatePickers, timePicker, createTimePicker, attachTimePickers, dateTimePicker, createDateTimePicker, formatTime, parseTime } from '../src/picker/index.js';

test('date picker API is exported without DOM side effects', () => {
  assert.equal(typeof datePicker.create, 'function');
  assert.equal(typeof createDatePicker, 'function');
  assert.equal(typeof attachDatePickers, 'function');
  assert.equal(typeof timePicker.create, 'function');
  assert.equal(typeof createTimePicker, 'function');
  assert.equal(typeof attachTimePickers, 'function');
  assert.equal(typeof dateTimePicker.create, 'function');
  assert.equal(typeof createDateTimePicker, 'function');
  assert.equal(typeof formatTime, 'function');
  assert.equal(typeof parseTime, 'function');
});

test('time formatting and parsing support 12-hour and 24-hour clocks', () => {
  assert.equal(formatTime({ hour: 0, minute: 5 }, '12'), '12:05 AM');
  assert.equal(formatTime({ hour: 12, minute: 5 }, '12'), '12:05 PM');
  assert.equal(formatTime({ hour: 23, minute: 9, second: 7 }, '24', true), '23:09:07');
  assert.deepEqual(parseTime('12:05 AM', '12'), { hour: 0, minute: 5, second: 0 });
  assert.deepEqual(parseTime('12:05 PM', '12'), { hour: 12, minute: 5, second: 0 });
  assert.deepEqual(parseTime('23:09:07'), { hour: 23, minute: 9, second: 7 });
  assert.equal(parseTime('13:05 PM', '12'), null);
  assert.equal(parseTime('24:00', '24'), null);
});
