import { HewargeDate } from '../HewargeDate.js';
import { tokenizeFormat } from './tokenizer.js';
import { resolvePreset } from './formatter.js';
import { resolveLocale } from './locales.js';
import { normalizeLocalizedNumerals } from './numbering.js';

export function parseDate(raw, format='YYYY-MM-DD', options={}) {
  if (typeof raw !== 'string') throw new TypeError('raw date must be a string.');
  format=resolvePreset(format,'date');
  const calendar=options.calendar||'gregorian';
  const locale=options.locale||(calendar==='jalali'?'fa':calendar==='hijri'?'ar':calendar==='gregorian'?'en':'ku-SO');
  const text=normalizeLocalizedNumerals(raw.trim());
  const parts=tokenizeFormat(format); const fields={}; let position=0;
  const localeData=resolveLocale(locale,calendar);
  let monthNames;
  if (localeData) {
    monthNames=localeData.months;
  }
  for(const part of parts){
    if(part.type==='literal'){
      if(!text.startsWith(part.value,position)) throw new RangeError(`Invalid date: literal text ${JSON.stringify(part.value)} does not match.`);
      position+=part.value.length; continue;
    }
    const token=part.value;
    if(token==='YYYY'||token==='YY'||token==='Y'||token==='M'||token==='MM'||token==='D'||token==='DD'){
      let length=token==='YYYY'?4:token==='YY'?2:token.length;
      let match;
      if(token==='YYYY'||token==='YY'||token==='Y') match=text.slice(position).match(token==='Y'?/^-?\d+/:/^\d+/);
      else {
        const rest=text.slice(position);
        match=rest.match(new RegExp(`^\\d{1,${length}}`));
      }
      if(!match) throw new RangeError(`Invalid date: expected ${token} at position ${position}.`);
      const value=Number(match[0]);
      if(token==='YYYY'||token==='Y') fields.year=value;
      else if(token==='YY') fields.year=value>=0&&value<=68?2000+value:1900+value;
      else if(token==='M'||token==='MM') fields.month=value;
      else fields.day=value;
      position+=match[0].length;
    } else if(token==='MMMM'||token==='MMM'||token==='MMMMM'){
      const rest=text.slice(position);
      let foundIndex=-1;
      for(let i=0;i<monthNames.length;i++){ const name=monthNames[i]; const candidate=token==='MMMM'?name:token==='MMM'?name.slice(0,3):[...name][0]; if(rest.startsWith(candidate)){foundIndex=i+1;break;} }
      if(foundIndex<1) throw new RangeError(`Invalid date: month name does not match at position ${position}.`);
      fields.month=foundIndex; position+=([...monthNames[foundIndex-1]][0] || '').length;
      // Adjust consumed length for MMM/MMMM variants by exact matched candidate.
      const matched=monthNames[foundIndex-1]; position-=monthNames[foundIndex-1].length-[...(token==='MMMM'?matched:token==='MMM'?matched.slice(0,3):[...matched][0])].length;
    } else {
      throw new RangeError(`Unsupported or non-reversible date token: ${token}.`);
    }
  }
  if(position!==text.length) throw new RangeError(`Invalid date: unexpected trailing text ${JSON.stringify(text.slice(position))}.`);
  if(fields.year==null||fields.month==null||fields.day==null) throw new RangeError('A date format must provide Y/YYYY, month, and day tokens.');
  try { return HewargeDate.from(calendar,fields.year,fields.month,fields.day); }
  catch(error){ throw new RangeError(`Invalid ${calendar} date: ${fields.year}-${fields.month}-${fields.day}.`); }
}

export function parseTime(raw, format='HH:mm', options={}) {
  if(typeof raw!=='string') throw new TypeError('raw time must be a string.');
  format=resolvePreset(format,'time');
  const text=normalizeLocalizedNumerals(raw.trim());
  const parts=tokenizeFormat(format); let hour=null,minute=null,second=0,millisecond=0,position=0; let meridiem=null;
  for(const part of parts){
    if(part.type==='literal'){if(!text.startsWith(part.value,position)) throw new RangeError('Invalid time literal.');position+=part.value.length;continue;}
    const token=part.value;
    if(['H','HH','h','hh','k','kk','m','mm','s','ss','SSS','SS','S','A','a'].includes(token)){
      if(['A','a'].includes(token)){
        const locale=resolveLocale(options.locale||'en','gregorian'); const am=locale.meridiem.AM, pm=locale.meridiem.PM;
        let label=text.slice(position); if(label.startsWith(am)||label.toLowerCase().startsWith(am.toLowerCase())) meridiem='AM'; else if(label.startsWith(pm)||label.toLowerCase().startsWith(pm.toLowerCase())) meridiem='PM'; else if(/^AM/i.test(label)||/^ص/.test(label)) meridiem='AM'; else if(/^PM/i.test(label)||/^م/.test(label)) meridiem='PM'; else throw new RangeError('Invalid AM/PM text.');
        position+=meridiem==='AM'?(text.slice(position).match(/^AM/i)?.[0]?.length||am.length):(text.slice(position).match(/^PM/i)?.[0]?.length||pm.length); continue;
      }
      const digits=new RegExp(`^\\d{1,${token.length>2?token.length:token.length}}`); const match=text.slice(position).match(digits); if(!match) throw new RangeError(`Invalid time: expected ${token}.`);
      const value=Number(match[0]); position+=match[0].length;
      if(['H','HH','h','hh','k','kk'].includes(token)) hour=value;
      if(['m','mm'].includes(token)) minute=value;
      if(['s','ss'].includes(token)) second=value;
      if(['S','SS','SSS'].includes(token)) millisecond=token==='S'?value*100:token==='SS'?value*10:value;
    } else if(['Z','ZZ','z','zz'].includes(token)){ throw new RangeError(`Parsing timezone token ${token} is not supported because timezone information alone cannot reconstruct the instant.`); }
  }
  if(position!==text.length) throw new RangeError('Invalid time: unexpected trailing text.');
  if(hour==null||minute==null) throw new RangeError('A time format must include hour and minute.');
  if(['h','hh'].includes(parts.find(p=>p.type==='token'&&['h','hh'].includes(p.value))?.value)&&meridiem){ if(hour<1||hour>12) throw new RangeError('12-hour hour must be 1-12.'); hour=(hour%12)+(meridiem==='PM'?12:0); }
  if(['k','kk'].includes(parts.find(p=>p.type==='token'&&['k','kk'].includes(p.value))?.value)&&hour===24) hour=0;
  if(hour<0||hour>23||minute<0||minute>59||second<0||second>59||millisecond<0||millisecond>999) throw new RangeError('Invalid time fields.');
  return {hour,minute,second,millisecond};
}

export function parseDateTime(raw, format='YYYY/MM/DD HH:mm', options={}) {
  throw new RangeError('parseDateTime is not reversible for all combined formats; use parseDate or parseTime, or an explicit date+time pair.');
}
