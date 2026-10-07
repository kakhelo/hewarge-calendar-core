import { HewargeDate } from '../src/index.js';

const date = HewargeDate.fromGregorian(2026, 9, 7);
console.log('Gregorian:', date.toGregorian());
console.log('Jalali:', date.toJalali());
console.log('Kurdish:', date.toKurdish());
console.log('Hijri:', date.toHijri());
console.log('Next month:', date.add({ months: 1 }).toGregorian());
console.log('Day of year:', date.dayOfYear);
