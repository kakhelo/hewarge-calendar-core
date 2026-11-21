import { formatDate } from './formatter.js';
import { formatTime } from './formatter-time.js';
import { resolvePreset } from './formatter.js';
import { parseDate, parseTime } from './parser.js';
import { validateFormat as validateFormatString } from './tokenizer.js';

export { formatDate };
export { formatTime };
export { parseDate, parseTime };
export { tokenizeFormat } from './tokenizer.js';
export { convertNumerals, normalizeLocalizedNumerals, normalizeNumberingSystem, NUMBERING_SYSTEMS } from './numbering.js';
export { LOCALES, resolveLocale } from './locales.js';
export { DATE_FORMAT_PRESETS, TIME_FORMAT_PRESETS, DATETIME_FORMAT_PRESETS, getAvailableFormatPresets } from './presets.js';

export function formatDateTime(dateTime, format='YYYY/MM/DD HH:mm', options={}) {
  if (typeof format !== 'string' || format.length===0) throw new TypeError('format must be a non-empty string.');
  format=resolvePreset(format,'dateTime');
  const date= dateTime?.date || dateTime;
  const dateParts=[]; const timeParts=[];
  // Split at literal/known boundaries by using the central formatter's literal tokenizer.
  const match=format.match(/^(.*?)(\s|T)(.*)$/);
  if (match) { dateParts.push(match[1]); timeParts.push(match[3]); }
  else if (/^[YMDdW]/.test(format)) dateParts.push(format);
  else timeParts.push(format);
  const dateText=dateParts.length?formatDate(date,dateParts[0],options):'';
  const timeText=timeParts.length?formatTime(dateTime,timeParts[0],options):'';
  if(dateParts.length&&timeParts.length){
    const separator=format.includes('T')?'T':(format.match(/\s/) ? ' ':'');
    return `${dateText}${separator}${timeText}`;
  }
  return dateText||timeText;
}

export function getAvailableDateTokens() {
  return [
    ['Y','Full year','2726','year'],['YY','Last two digits','26','year'],['YYYY','Four-digit padded year','2726','year'],
    ['M','Month number','6','month'],['MM','Padded month number','06','month'],['MMM','Abbreviated month name','خاک','month'],['MMMM','Full month name','خاکەلێوە','month'],['MMMMM','Narrow month name','خ','month'],
    ['D','Day','7','day'],['DD','Padded day','07','day'],['DDD','Day of year','188','day'],['DDDD','Padded day of year','188','day'],
    ['d','Localized weekday number','1','weekday'],['dd','Narrow weekday','ی','weekday'],['ddd','Abbreviated weekday','یەک','weekday'],['dddd','Full weekday','دووشەممە','weekday'],
    ['w','Calendar week','5','week'],['ww','Padded calendar week','05','week'],['W','ISO week','5','week'],['WW','Padded ISO week','05','week']
  ].map(([name,description,example,category])=>({name,description,example,category}));
}

export function getAvailableTimeTokens() {
  return [
    ['H','24-hour','8','hour'],['HH','Padded 24-hour','08','hour'],['h','12-hour','8','hour'],['hh','Padded 12-hour','08','hour'],['k','24-hour 1-24','24','hour'],['kk','Padded 24-hour 1-24','24','hour'],
    ['m','Minute','5','minute'],['mm','Padded minute','05','minute'],['s','Second','9','second'],['ss','Padded second','09','second'],
    ['S','First millisecond digit','1','millisecond'],['SS','First two millisecond digits','12','millisecond'],['SSS','Three-digit millisecond','123','millisecond'],
    ['A','Uppercase/localized meridiem','PM','meridiem'],['a','Lowercase/localized meridiem','pm','meridiem'],
    ['Z','UTC offset with colon','+03:30','timezone'],['ZZ','UTC offset without colon','+0330','timezone'],['z','Short time-zone name','IRST','timezone'],['zz','IANA identifier','Asia/Tehran','timezone']
  ].map(([name,description,example,category])=>({name,description,example,category}));
}

export function validateFormat(format) { return validateFormatString(format); }

export { parseDate as parseFormattedDate, parseTime as parseFormattedTime };
