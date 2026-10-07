import test from 'node:test';
import assert from 'node:assert/strict';
import { datePicker, createDatePicker, attachDatePickers } from '../src/picker/index.js';

test('date picker API is exported without DOM side effects', () => {
  assert.equal(typeof datePicker.create, 'function');
  assert.equal(typeof createDatePicker, 'function');
  assert.equal(typeof attachDatePickers, 'function');
});
