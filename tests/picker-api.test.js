import test from 'node:test';
import assert from 'node:assert/strict';
import { datePicker, createDatePicker, attachDatePickers, createDatePickerController, HewargeDatePickerController, timePicker, createTimePicker, attachTimePickers, dateTimePicker, createDateTimePicker, formatTime, parseTime } from '../src/picker/index.js';
import { HewargeDate } from '../src/index.js';

test('date picker API is exported without DOM side effects', () => {
  assert.equal(typeof datePicker.create, 'function');
  assert.equal(typeof createDatePicker, 'function');
  assert.equal(typeof attachDatePickers, 'function');
  assert.equal(typeof createDatePickerController, 'function');
  assert.equal(typeof HewargeDatePickerController, 'function');
  assert.equal(typeof timePicker.create, 'function');
  assert.equal(typeof createTimePicker, 'function');
  assert.equal(typeof attachTimePickers, 'function');
  assert.equal(typeof dateTimePicker.create, 'function');
  assert.equal(typeof createDateTimePicker, 'function');
  assert.equal(typeof formatTime, 'function');
  assert.equal(typeof parseTime, 'function');
});

test('headless date picker controller exposes UI-ready state and emits changes', () => {
  const today = HewargeDate.fromGregorian(2026, 1, 15);
  const controller = createDatePickerController({
    calendar: 'gregorian',
    format: 'YYYY-MM-DD',
    value: { year: 2026, month: 1, day: 10 },
    todayProvider: () => today,
    minDate: { year: 2026, month: 1, day: 5 },
    maxDate: { year: 2026, month: 2, day: 10 }
  });
  const firstState = controller.getState();
  assert.equal(firstState.formattedValue, '2026-01-10');
  assert.equal(firstState.days.find(day => day.day === 10).selected, true);
  assert.equal(firstState.days.find(day => day.day === 4).allowed, false);

  const events = [];
  const unsubscribe = controller.subscribe(event => events.push(event));
  controller.navigate(1).select(7);
  assert.equal(controller.getState().gregorianValue, '2026-02-07');
  assert.deepEqual(events.map(event => event.type), ['view', 'change']);
  assert.equal(unsubscribe(), true);
  assert.equal(controller.canMoveMonth(1), false);

  const secondController = new HewargeDatePickerController({
    calendar: 'jalali', value: { calendar: 'gregorian', year: 2026, month: 1, day: 10 }, todayProvider: () => today
  });
  assert.equal(secondController.getState().calendar, 'jalali');
  assert.notEqual(secondController.getState().formattedValue, firstState.formattedValue);
});

test('third date and time picker variants are available through typed picker API', () => {
  assert.equal(typeof createDatePicker, 'function');
  assert.equal(typeof createTimePicker, 'function');
  assert.equal(typeof dateTimePicker.create, 'function');
  assert.equal(typeof HewargeDatePickerController, 'function');
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
