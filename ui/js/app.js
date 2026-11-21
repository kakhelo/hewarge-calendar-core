import { createDatePicker, createDateTimePicker, formatTime, parseTime } from '../../src/picker/index.js';
import { dateTimeToTimestamp, timestampToDateTime, formatDate } from '../../src/index.js';

const input = document.querySelector('#main-date');
const picker = createDatePicker(input, { calendar: 'kurdish', format: 'DD/MM/YYYY', storageName: 'event_date' });
const inputLabel = document.querySelector('#main-date-label');
const gregorian = document.querySelector('#gregorian');
const calendarName = document.querySelector('#calendar-name');
const display = document.querySelector('#display-value');
const json = document.querySelector('#event-json');
const labels = {kurdish:'کوردی','kurdish-zayni':'کوردی زاینی',jalali:'هەوری',gregorian:'زایینی',hijri:'هجری'};
const inputCopy = {
  kurdish: ['بەرواری کوردی', 'بەروار هەڵبژێرە'],
  'kurdish-zayni': ['بەرواری کوردی زاینی', 'بەروار هەڵبژێرە'],
  jalali: ['تاریخ شمسی', 'انتخاب تاریخ'],
  gregorian: ['Gregorian date', 'Select a date'],
  hijri: ['التاريخ الهجري', 'اختر التاريخ']
};

function render(detail){
  const [label, placeholder] = inputCopy[detail.calendar] || inputCopy.kurdish;
  inputLabel.textContent = label;
  input.placeholder = placeholder;
  gregorian.textContent = detail.storageValue || '—';
  calendarName.textContent = labels[detail.calendar] || detail.calendar;
  display.textContent = detail.value || '—';
  json.textContent = JSON.stringify({value:detail.value,storageValue:detail.storageValue,calendar:detail.calendar,selected:detail.selected}, null, 2);
}
input.addEventListener('hewarge:change', e => render(e.detail));
input.addEventListener('hewarge:clear', () => { gregorian.textContent='—'; calendarName.textContent='—'; display.textContent='—'; json.textContent='—'; });

const mainDateFormat=document.querySelector('#main-date-format');
const mainDateLocale=document.querySelector('#main-date-locale');
const mainDateNumerals=document.querySelector('#main-date-numerals');
function updateMainFormatting(){
  picker.options.format=mainDateFormat.value;
  picker.options.locale=mainDateLocale.value;
  picker.options.numberingSystem=mainDateNumerals.value;
  picker.syncInput();
  const localeMap={kurdish:'ku-SO','kurdish-zayni':'ku-SO',jalali:'fa',hijri:'ar',gregorian:'en'};
  if(mainDateLocale.value==='auto') mainDateLocale.value=localeMap[picker.calendar];
  display.textContent=formatDate(picker.value,mainDateFormat.value,{calendar:picker.calendar,locale:mainDateLocale.value,numberingSystem:mainDateNumerals.value});
}
mainDateFormat.addEventListener('change',updateMainFormatting);
mainDateLocale.addEventListener('change',updateMainFormatting);
mainDateNumerals.addEventListener('change',updateMainFormatting);
document.querySelectorAll('[data-set-calendar]').forEach(btn => btn.addEventListener('click', () => {
  picker.setCalendar(btn.dataset.setCalendar);
  const defaults={kurdish:'ku-SO','kurdish-zayni':'ku-SO',jalali:'fa',gregorian:'en',hijri:'ar'};
  mainDateLocale.value=defaults[picker.calendar];
  updateMainFormatting(); picker.open();
}));

document.querySelector('#theme').addEventListener('click', () => document.documentElement.classList.toggle('dark'));
document.querySelector('#copy').addEventListener('click', async () => {
  const code = document.querySelector('.code code').textContent;
  await navigator.clipboard?.writeText(code);
  const b=document.querySelector('#copy'); b.textContent='کۆپی کرا'; setTimeout(()=>b.textContent='کۆپی',1200);
});

const timestampUnit = document.querySelector('#timestamp-unit');
const timestampZone = document.querySelector('#timestamp-zone');
const timestampInput = document.querySelector('#timestamp-input');
const timestampDateOutput = document.querySelector('#timestamp-result-date');
const timestampTimeOutput = document.querySelector('#timestamp-result-time');
const timestampJsonOutput = document.querySelector('#timestamp-result-json');
const encodeOutput = document.querySelector('#datetime-result-timestamp');
const encodeIsoOutput = document.querySelector('#datetime-result-iso');
const roundtripOutput = document.querySelector('#timestamp-test-result');
let lastTimestampUnit = timestampUnit.value;

function readDateTimeInput() {
  return {
    calendar: document.querySelector('#datetime-calendar').value,
    year: Number(document.querySelector('#datetime-year').value),
    month: Number(document.querySelector('#datetime-month').value),
    day: Number(document.querySelector('#datetime-day').value),
    hour: Number(document.querySelector('#datetime-hour').value),
    minute: Number(document.querySelector('#datetime-minute').value),
    second: Number(document.querySelector('#datetime-second').value),
    millisecond: Number(document.querySelector('#datetime-millisecond').value)
  };
}

function showTimestampAsDate() {
  try {
    const result = timestampToDateTime(Number(timestampInput.value), {
      unit: timestampUnit.value, timeZone: timestampZone.value,
      calendar: document.querySelector('#datetime-calendar').value
    });
    timestampDateOutput.textContent = result.date.format('YYYY/MM/DD');
    timestampTimeOutput.textContent = `${String(result.hour).padStart(2, '0')}:${String(result.minute).padStart(2, '0')}:${String(result.second).padStart(2, '0')}.${String(result.millisecond).padStart(3, '0')} · ${result.timeZone}`;
    timestampJsonOutput.textContent = JSON.stringify({ calendar: result.calendar, date: result.date.toObjectDate(), hour: result.hour, minute: result.minute, second: result.second, millisecond: result.millisecond, timeZone: result.timeZone }, null, 2);
  } catch (error) {
    timestampDateOutput.textContent = error.message;
    timestampTimeOutput.textContent = '—';
    timestampJsonOutput.textContent = '—';
  }
}

function showDateAsTimestamp() {
  try {
    const timestamp = dateTimeToTimestamp(readDateTimeInput(), { unit: timestampUnit.value, timeZone: timestampZone.value });
    encodeOutput.textContent = String(timestamp);
    const milliseconds = timestampUnit.value === 'seconds' ? timestamp * 1000 : timestamp;
    encodeIsoOutput.textContent = `${new Date(milliseconds).toISOString()} · ${timestampUnit.value}`;
    return timestamp;
  } catch (error) {
    encodeOutput.textContent = error.message;
    encodeIsoOutput.textContent = '—';
    return null;
  }
}

document.querySelector('#timestamp-decode').addEventListener('click', showTimestampAsDate);
document.querySelector('#timestamp-encode').addEventListener('click', showDateAsTimestamp);
timestampUnit.addEventListener('change', () => {
  const currentTimestamp = Number(timestampInput.value);
  if (Number.isFinite(currentTimestamp)) {
    timestampInput.value = String(lastTimestampUnit === 'seconds' ? currentTimestamp * 1000 : currentTimestamp / 1000);
  }
  lastTimestampUnit = timestampUnit.value;
  showTimestampAsDate();
  showDateAsTimestamp();
});
timestampZone.addEventListener('change', () => { showTimestampAsDate(); showDateAsTimestamp(); });
document.querySelector('#datetime-calendar').addEventListener('change', showTimestampAsDate);
document.querySelector('#timestamp-test').addEventListener('click', () => {
  const expected = readDateTimeInput();
  const timestamp = showDateAsTimestamp();
  if (timestamp == null) {
    roundtripOutput.textContent = 'تاقیکردنەوە سەرکەوتوو نەبوو؛ خانەکان بپشکنە.';
    roundtripOutput.dataset.state = 'failed';
    return;
  }
  const actual = timestampToDateTime(timestamp, {
    unit: timestampUnit.value, timeZone: timestampZone.value, calendar: expected.calendar
  });
  const matches = ['year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond']
    .every(field => actual[field] === expected[field]);
  roundtripOutput.textContent = matches
    ? '✓ تاقیکردنەوە سەرکەوتوو بوو — هەموو خانەکان بە دروستی گەڕانەوە.'
    : '✕ گەڕانەوە لەگەڵ بەروار و کاتی سەرەتایی یەکسان نییە.';
  roundtripOutput.dataset.state = matches ? 'passed' : 'failed';
});

document.querySelector('#calendar-test').addEventListener('click', () => {
  const time = {
    hour: Number(document.querySelector('#datetime-hour').value),
    minute: Number(document.querySelector('#datetime-minute').value),
    second: Number(document.querySelector('#datetime-second').value),
    millisecond: Number(document.querySelector('#datetime-millisecond').value)
  };
  const cases = [
    { calendar: 'kurdish', year: 2726, month: 6, day: 16 },
    { calendar: 'kurdish-zayni', year: 2026, month: 9, day: 7 },
    { calendar: 'jalali', year: 1405, month: 6, day: 16 },
    { calendar: 'gregorian', year: 2026, month: 9, day: 7 },
    { calendar: 'hijri', year: 1448, month: 3, day: 24 }
  ];
  const fields = ['year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'];
  const results = cases.map(expected => {
    try {
      const timestamp = dateTimeToTimestamp({ ...expected, ...time }, {
        unit: timestampUnit.value,
        timeZone: timestampZone.value
      });
      const actual = timestampToDateTime(timestamp, {
        unit: timestampUnit.value,
        timeZone: timestampZone.value,
        calendar: expected.calendar
      });
      const passed = fields.every(field => actual[field] === (expected[field] ?? time[field]));
      return { calendar: expected.calendar, passed };
    } catch (error) {
      return { calendar: expected.calendar, passed: false, error: error.message };
    }
  });
  const passedCount = results.filter(result => result.passed).length;
  const output = document.querySelector('#calendar-test-result');
  output.textContent = `${passedCount}/${results.length} · ${results.map(result => `${result.passed ? '✓' : '✕'} ${labels[result.calendar] || result.calendar}${result.error ? `: ${result.error}` : ''}`).join(' · ')}`;
  output.dataset.state = passedCount === results.length ? 'passed' : 'failed';
});

const pickerCalendar = document.querySelector('#picker-calendar');
const pickerTimeFormat = document.querySelector('#picker-time-format');
const pickerTimeZone = document.querySelector('#picker-time-zone');
const pickerDateInput = document.querySelector('#picker-date');
const pickerTimeInput = document.querySelector('#picker-time');
const pickerTimestamp = document.querySelector('#picker-timestamp');
const pickerIso = document.querySelector('#picker-iso');
const pickerJson = document.querySelector('#picker-datetime-json');
const pickerStatus = document.querySelector('#picker-datetime-status');
const dateTimeDemo = createDateTimePicker(pickerDateInput, pickerTimeInput, {
  calendar: pickerCalendar.value,
  date: { format: 'DD/MM/YYYY', mobileMode: 'auto' },
  time: { format: pickerTimeFormat.value, timeZone: pickerTimeZone.value, timeZones: ['Asia/Baghdad', 'UTC', 'Europe/London', 'America/New_York', 'Asia/Tehran', 'Asia/Tokyo','Asia/kurdstan'], minuteStep: 5, showSeconds: true }
});

function renderDateTimeDetail(detail) {
  pickerJson.textContent = JSON.stringify(detail, null, 2);
  if (detail.timestamp == null) {
    pickerTimestamp.textContent = detail.validationError || '—';
    pickerIso.textContent = 'ئەم کاتە لەم ناوچەیەدا بوونی نییە.';
    pickerStatus.textContent = 'کاتێکی تری هەڵبژێرە؛ لە کاتی گۆڕانی DST ـدا ئەم کاتە بوونی نییە.';
    pickerStatus.dataset.state = 'failed';
    return;
  }
  pickerTimestamp.textContent = String(detail.timestamp);
  pickerIso.textContent = `${new Date(detail.timestamp).toISOString()} · ${detail.timeZone}`;
  pickerStatus.textContent = '✓ بەروار و کات و Time Zone بە سەرکەوتوویی پێکەوە بەستران.';
  pickerStatus.dataset.state = 'passed';
}

pickerDateInput.addEventListener('hewarge:datetimechange', event => renderDateTimeDetail(event.detail));
pickerTimeInput.addEventListener('hewarge:datetimechange', event => renderDateTimeDetail(event.detail));
pickerCalendar.addEventListener('change', () => {
  dateTimeDemo.setCalendar(pickerCalendar.value);
  pickerDateInput.dataset.format = 'DD/MM/YYYY';
  dateTimeDemo.datePicker.open();
});
pickerTimeFormat.addEventListener('change', () => dateTimeDemo.setTimeFormat(pickerTimeFormat.value));
pickerTimeZone.addEventListener('change', () => dateTimeDemo.setTimeZone(pickerTimeZone.value));
document.querySelector('#picker-api-test').addEventListener('click', () => {
  const valid12 = formatTime({ hour: 0, minute: 5, second: 9 }, '12', true) === '12:05:09 AM';
  const valid24 = formatTime({ hour: 23, minute: 5, second: 9 }, '24', true) === '23:05:09';
  const parsed = parseTime('12:05 PM', '12');
  const validParse = parsed?.hour === 12 && parsed.minute === 5 && parsed.second === 0;
  const passed = valid12 && valid24 && validParse;
  pickerStatus.textContent = passed
    ? '✓ API پاس شد: قالب ١٢/٢٤ کاتژمێری و parse/format دروستن.'
    : '✕ API test شکستیهێنا.';
  pickerStatus.dataset.state = passed ? 'passed' : 'failed';
});

timestampInput.value = String(Date.UTC(2026, 8, 7, 16, 34, 56, 789));
showTimestampAsDate();
showDateAsTimestamp();
document.querySelector('#timestamp-test').click();
