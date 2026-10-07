import { createDatePicker } from '../src/picker/index.js';

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
  render(picker.detail());
  picker.open();
}));

document.querySelector('#theme').addEventListener('click', () => document.documentElement.classList.toggle('light'));
document.querySelector('#copy').addEventListener('click', async () => {
  const code = document.querySelector('.code code').textContent;
  await navigator.clipboard?.writeText(code);
  const b=document.querySelector('#copy'); b.textContent='کۆپی کرا'; setTimeout(()=>b.textContent='کۆپی',1200);
});
