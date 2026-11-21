import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatTime, formatDateTime, parseDate, parseTime, convertNumerals, validateFormat, getAvailableDateTokens, getAvailableTimeTokens, getAvailableFormatPresets } from '../src/formatting/index.js';
import { HewargeDate } from '../src/index.js';

test('date formatting supports calendars, literals, locales and numerals', () => {
  const d=HewargeDate.fromKurdish(2726,6,16);
  assert.equal(formatDate(d,'D MMMM YYYY',{locale:'ku-SO',numberingSystem:'latn'}),'16 خەرمانان 2726');
  assert.equal(formatDate(d,'[Day] D [of] MMMM YYYY',{locale:'ku-SO'}),'Day 16 of خەرمانان 2726');
  assert.equal(formatDate(HewargeDate.fromGregorian(2026,9,7),'YYYY-MM-DD',{numberingSystem:'arab'}),'٢٠٢٦-٠٩-٠٧');
  assert.equal(formatDate(HewargeDate.fromJalali(1405,6,16),'MMMM YYYY',{locale:'fa',numberingSystem:'fa'}),'شهریور ۱۴۰۵');
});

test('date weekday and year/day tokens are deterministic', () => {
  const d=HewargeDate.fromGregorian(2026,1,1);
  assert.equal(formatDate(d,'YYYY YY Y D DD DDD DDDD',{locale:'en'}),'2026 26 2026 1 01 1 001');
  assert.equal(formatDate(d,'dddd ddd dd d',{locale:'en'}),'Thursday Thu Th 4');
});

test('time formatting handles 12/24-hour, milliseconds and zones', () => {
  assert.equal(formatTime({hour:0,minute:5,second:9,millisecond:123},'hh:mm:ss.SSS A',{locale:'en'}),'12:05:09.123 AM');
  assert.equal(formatTime({hour:12,minute:5},'h:mm a',{locale:'en'}),'12:05 pm');
  assert.equal(formatTime({hour:23,minute:9},'HH:mm k',{locale:'en'}),'23:09 23');
  assert.equal(formatTime({hour:8,minute:5},'HH:mm Z',{timeZone:'Asia/Tehran'}),'08:05 +03:30');
  assert.equal(formatTime({hour:8,minute:5},'HH:mm zz',{timeZone:'UTC'}),'08:05 UTC');
});

test('numerals and metadata APIs work', () => {
  assert.equal(convertNumerals(12345,'fa'),'۱۲۳۴۵');
  assert.equal(convertNumerals(12345,'arab'),'١٢٣٤٥');
  assert.ok(getAvailableDateTokens().length>=20);
  assert.ok(getAvailableTimeTokens().length>=18);
  assert.equal(getAvailableFormatPresets().date.iso,'YYYY-MM-DD');
  assert.equal(validateFormat('YYYY/MM/DD').valid,true);
});

test('date parsing validates and rejects invalid dates', () => {
  assert.deepEqual(parseDate('16/06/2726','DD/MM/YYYY',{calendar:'kurdish'}).toObjectDate(),{year:2726,month:6,day:16});
  assert.throws(()=>parseDate('31/02/2024','DD/MM/YYYY',{calendar:'gregorian'}),RangeError);
});

test('combined formatter preserves ISO T separator', () => {
  assert.equal(formatDateTime({calendar:'gregorian',year:2026,month:9,day:7,hour:8,minute:5,second:9},'YYYY-MM-DDTHH:mm:ssZ',{timeZone:'UTC'}),'2026-09-07T08:05:09+00:00');
});

test('time parser rejects invalid fields', () => {
  assert.deepEqual(parseTime('12:05 PM','hh:mm A',{locale:'en'}),{hour:12,minute:5,second:0,millisecond:0});
  assert.throws(()=>parseTime('24:00','HH:mm'),RangeError);
});
