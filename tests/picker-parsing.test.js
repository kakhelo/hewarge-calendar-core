import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDate, formatDate } from '../src/picker/HewargeDatePicker.js';

test('parseDate respects the configured format order (YYYY/MM/DD)', () => {
  assert.deepEqual(parseDate('2726/06/16', 'YYYY/MM/DD'), { year: 2726, month: 6, day: 16 });
});

test('parseDate respects a day-first format (DD/MM/YYYY)', () => {
  // With the old hard-coded regex this used to be mis-read as year=16, month=06, day=2726.
  assert.deepEqual(parseDate('16/06/2726', 'DD/MM/YYYY'), { year: 2726, month: 6, day: 16 });
});

test('parseDate respects a month-first format (MM-DD-YYYY)', () => {
  assert.deepEqual(parseDate('06-16-2726', 'MM-DD-YYYY'), { year: 2726, month: 6, day: 16 });
});

test('parseDate falls back gracefully on unparsable input', () => {
  assert.equal(parseDate('not a date', 'YYYY/MM/DD'), null);
  assert.equal(parseDate('', 'YYYY/MM/DD'), null);
});

test('formatDate/parseDate round-trip for every supported pattern', () => {
  const date = { year: 2726, month: 6, day: 16 };
  for (const pattern of ['YYYY/MM/DD', 'DD/MM/YYYY', 'MM-DD-YYYY']) {
    const formatted = formatDate(date, pattern);
    assert.deepEqual(parseDate(formatted, pattern), date);
  }
});
