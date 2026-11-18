import { GregorianCalendar } from '../gregorian/GregorianCalendar.js';

/**
 * Kurdish Zayni uses Gregorian year/month/day arithmetic. Its separate ID lets
 * applications present Kurdish month names without changing Gregorian dates.
 */
export const KurdishZayniCalendar = {
  id: 'kurdish-zayni',
  name: 'Kurdish Zayni',
  aliases: ['kurdishzayni', 'kurd-zayni', 'zayni'],
  months: ['کانوونی دووەم','شوبات','ئازار','نیسان','ئایار','حوزەیران','تەممووز','ئاب','ئەیلوول','تشرینی یەکەم','تشرینی دووەم','کانوونی یەکەم'],
  isLeapYear(year) {
    return GregorianCalendar.isLeapYear(year);
  },
  daysInMonth(year, month) {
    return GregorianCalendar.daysInMonth(year, month);
  },
  isValidDate(year, month, day) {
    return GregorianCalendar.isValidDate(year, month, day);
  },
  toJdn(year, month, day) {
    return GregorianCalendar.toJdn(year, month, day);
  },
  fromJdn(jdn) {
    return GregorianCalendar.fromJdn(jdn);
  }
};