import { normalizeTimeZone, timestampToDateTime } from '../api/TimestampConverters.js';
import { resolveLocale } from './locales.js';
import { convertNumerals } from './numbering.js';
import { compileFormat, resolvePreset } from './formatter.js';

function pad(value, length) { return String(value).padStart(length, '0'); }

export function validTimeZone(timeZone) {
  const normalized = normalizeTimeZone(timeZone == null ? 'UTC' : timeZone);
  if (String(normalized).toLowerCase() === 'utc' || String(normalized).toLowerCase() === 'gmt') return 'UTC';
  try { new Intl.DateTimeFormat('en-US', { timeZone: normalized }).format(0); return normalized; }
  catch { throw new RangeError(`Unavailable IANA time zone: ${timeZone}`); }
}

function timeFields(input, timeZone) {
  let epoch;
  if (input instanceof Date) epoch = input.getTime();
  else if (typeof input === 'number') epoch = input;
  else if (input && typeof input === 'object') {
    if (input.hour != null) {
      epoch = null;
      const hour=Number(input.hour), minute=Number(input.minute??0), second=Number(input.second??0), millisecond=Number(input.millisecond??0);
      if (![hour,minute,second,millisecond].every(Number.isInteger) || hour<0||hour>23||minute<0||minute>59||second<0||second>59||millisecond<0||millisecond>999) throw new RangeError('Invalid time fields.');
      return {hour,minute,second,millisecond};
    }
  }
  if (epoch == null || Number.isNaN(epoch)) throw new TypeError('time must be a Date, timestamp, or {hour, minute, second, millisecond} object.');
  const zone = validTimeZone(timeZone);
  const result = timestampToDateTime(epoch, { timeZone:zone, unit:'milliseconds' });
  return {hour:result.hour,minute:result.minute,second:result.second,millisecond:result.millisecond};
}

function offsetParts(epoch, zone) {
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone:zone, timeZoneName:'longOffset' });
  const part=fmt.formatToParts(new Date(epoch)).find(p=>p.type==='timeZoneName');
  if (!part || part.value==='GMT' || part.value==='GMT+0' || part.value==='GMT-0') return '+00:00';
  const match=part.value.match(/GMT([+-])(\d{2})(?::?(\d{2}))?/);
  if (!match) throw new RangeError(`Could not determine UTC offset for time zone: ${zone}`);
  return `${match[1]}${pad(match[2],2)}:${pad(match[3]||'00',2)}`;
}

export function formatTime(time, format='HH:mm', options={}) {
  if (typeof format !== 'string' || format.length===0) throw new TypeError('format must be a non-empty string.');
  format=resolvePreset(format,'time');
  const locale=options.locale||'en';
  const numbering=options.numberingSystem||'latn';
  const zone=validTimeZone(options.timeZone|| (typeof Intl!=='undefined'?Intl.DateTimeFormat().resolvedOptions().timeZone:'UTC') || 'UTC');
  const fields=timeFields(time,zone);
  const epoch=time instanceof Date ? time.getTime() : typeof time==='number'?time:Date.UTC(1970,0,1,fields.hour,fields.minute,fields.second,fields.millisecond);
  const localeData=resolveLocale(locale,'gregorian');
  const meridiem=localeData.meridiem;
  const parts=compileFormat(format);
  const output=parts.map(part=>{
    if(part.type==='literal') return part.value;
    const token=part.value; let result;
    switch(token){
      case 'H': result=String(fields.hour); break;
      case 'HH': result=pad(fields.hour,2); break;
      case 'h': result=String(fields.hour%12||12); break;
      case 'hh': result=pad(fields.hour%12||12,2); break;
      case 'k': result=String(fields.hour||24); break;
      case 'kk': result=pad(fields.hour||24,2); break;
      case 'm': result=String(fields.minute); break;
      case 'mm': result=pad(fields.minute,2); break;
      case 's': result=String(fields.second); break;
      case 'ss': result=pad(fields.second,2); break;
      case 'S': result=String(Math.floor(fields.millisecond/100)); break;
      case 'SS': result=pad(Math.floor(fields.millisecond/10),2); break;
      case 'SSS': result=pad(fields.millisecond,3); break;
      case 'A': result=fields.hour<12?meridiem.AM:meridiem.PM; break;
      case 'a': result=(fields.hour<12?meridiem.AM:meridiem.PM).toLocaleLowerCase(locale); break;
      case 'Z': result=offsetParts(epoch,zone); break;
      case 'ZZ': result=offsetParts(epoch,zone).replace(':',''); break;
      case 'z': {
        const found=new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'short'}).formatToParts(new Date(epoch)).find(p=>p.type==='timeZoneName');
        result=found?.value && !found.value.startsWith('GMT') ? found.value : (zone==='UTC'?'UTC':''); break;
      }
      case 'zz': result=zone; break;
      default: throw new RangeError(`Unsupported time token: ${token}`);
    }
    return convertNumerals(result,numbering);
  }).join('');
  return output;
}
