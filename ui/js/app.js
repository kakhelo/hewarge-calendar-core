import { createDatePicker } from '../../src/picker/index.js';
import { dateTimeToTimestamp, timestampToDateTime } from '../../src/index.js';

const input = document.querySelector('#main-date');
const picker = createDatePicker(input, { calendar: 'kurdish', format: 'DD/MM/YYYY', storageName: 'event_date' });
const gregorian = document.querySelector('#gregorian');
const calendarName = document.querySelector('#calendar-name');
const display = document.querySelector('#display-value');
const json = document.querySelector('#event-json');
const labels = {kurdish:'کوردی',jalali:'هەوری',gregorian:'زایینی',hijri:'هجری'};

function render(detail){
  gregorian.textContent = detail.storageValue || '—';
  calendarName.textContent = labels[detail.calendar] || detail.calendar;
  display.textContent = detail.value || '—';
  json.textContent = JSON.stringify({value:detail.value,storageValue:detail.storageValue,calendar:detail.calendar,selected:detail.selected}, null, 2);
}
input.addEventListener('hewarge:change', e => render(e.detail));
input.addEventListener('hewarge:clear', () => { gregorian.textContent='—'; calendarName.textContent='—'; display.textContent='—'; json.textContent='—'; });

document.querySelectorAll('[data-set-calendar]').forEach(btn => btn.addEventListener('click', () => {
  picker.setCalendar(btn.dataset.setCalendar);
  picker.open();
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

timestampInput.value = String(Date.UTC(2026, 8, 7, 16, 34, 56, 789));
showTimestampAsDate();
showDateAsTimestamp();
document.querySelector('#timestamp-test').click();
