import { gregorianToJdn, jdnToGregorian } from '../../core/JulianDay.js';
export const GregorianCalendar = {
  id: 'gregorian', name: 'Gregorian', aliases: ['gregorian','georgian','miladi'],
  isLeapYear(y) { return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0); },
  daysInMonth(y,m) { if (m === 2) return this.isLeapYear(y) ? 29 : 28; return [4,6,9,11].includes(m) ? 30 : 31; },
  isValidDate(y,m,d) { return Number.isInteger(y)&&Number.isInteger(m)&&Number.isInteger(d)&&m>=1&&m<=12&&d>=1&&d<=this.daysInMonth(y,m); },
  toJdn(y,m,d) { return gregorianToJdn(y,m,d); },
  fromJdn(jdn) { return jdnToGregorian(jdn); }
};
