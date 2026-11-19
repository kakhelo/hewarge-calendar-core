import { dateTimeToTimestamp, timestampToDateTime, normalizeTimeZone } from '../api/TimestampConverters.js';
import { createDatePicker } from './HewargeDatePicker.js';

const DEFAULTS = {
  format: '24',
  locale: 'en',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  showSeconds: false,
  keyboard: true
};
const LABELS = {
  en: { kicker: 'TIME', title: 'Choose a time', close: 'Close', hour: 'Hour', minute: 'Minute', second: 'Second', period: 'Period', now: 'Current time', exit: 'Exit' },
  ku: { kicker: 'کات', title: 'هەڵبژاردنی کات', close: 'داخستن', hour: 'کاتژمێر', minute: 'خولەک', second: 'چرکە', period: 'پێشنیوەڕۆ/دواینیوەڕۆ', now: 'کاتی ئێستا', exit: 'دەرچوون' },
  fa: { kicker: 'زمان', title: 'انتخاب زمان', close: 'بستن', hour: 'ساعت', minute: 'دقیقه', second: 'ثانیه', period: 'ق.ظ/ب.ظ', now: 'زمان اکنون', exit: 'خروج' },
  ar: { kicker: 'الوقت', title: 'اختر الوقت', close: 'إغلاق', hour: 'الساعة', minute: 'الدقيقة', second: 'الثانية', period: 'ص/م', now: 'الوقت الآن', exit: 'خروج' }
};

function pad(value) { return String(value).padStart(2, '0'); }
function validateTime(hour, minute, second = 0) {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59 || !Number.isInteger(second) || second < 0 || second > 59) return null;
  return { hour, minute, second };
}

export function formatTime(value, format = '24', showSeconds = false) {
  const time = validateTime(Number(value.hour), Number(value.minute), Number(value.second ?? 0));
  if (!time) throw new RangeError('Time must use hour 0-23 and minute/second 0-59.');
  const hour12 = time.hour % 12 || 12;
  const clock = format === '12' ? `${hour12}:${pad(time.minute)}${showSeconds ? `:${pad(time.second)}` : ''} ${time.hour < 12 ? 'AM' : 'PM'}` : `${pad(time.hour)}:${pad(time.minute)}${showSeconds ? `:${pad(time.second)}` : ''}`;
  return clock;
}

export function parseTime(raw, format = '24') {
  if (!raw || typeof raw !== 'string') return null;
  const value = raw.trim();
  const match12 = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match12) {
    let hour = Number(match12[1]);
    const period = match12[4].toUpperCase();
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (period === 'PM' ? 12 : 0);
    return validateTime(hour, Number(match12[2]), Number(match12[3] || 0));
  }
  const match24 = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match24) return null;
  const result = validateTime(Number(match24[1]), Number(match24[2]), Number(match24[3] || 0));
  if (!result || (format === '12' && Number(match24[1]) > 12)) return null;
  return result;
}

function validTimeZone(timeZone) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: normalizeTimeZone(timeZone) }).format(0); return true; } catch { return false; }
}
function esc(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
let stylesInstalled = false;
function installStyles() {
  if (stylesInstalled || typeof document === 'undefined') return;
  if (!document.querySelector('link[data-hewarge-picker-styles], link[href*="hewarge-date-picker.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('./hewarge-date-picker.css', import.meta.url).href;
    link.dataset.hewargePickerStyles = 'true';
    document.head.appendChild(link);
  }
  stylesInstalled = true;
}

export class HewargeTimePicker {
  constructor(input, options = {}) {
    if (!input || input.nodeType !== 1) throw new TypeError('HewargeTimePicker requires an input element.');
    installStyles();
    this.input = input;
    this.options = { ...DEFAULTS, ...Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined)) };
    delete this.options.timeZones;
    const calendarLocale = { kurdish: 'ku', 'kurdish-zayni': 'ku', jalali: 'fa', hijri: 'ar', gregorian: 'en' };
    this.options.locale = calendarLocale[this.options.locale] || this.options.locale;
    this.options.format = String(this.options.format) === '12' ? '12' : '24';
    this.options.showSeconds = Boolean(this.options.showSeconds);
    if (!validTimeZone(this.options.timeZone)) throw new RangeError(`Invalid IANA time zone: ${this.options.timeZone}`);
    this.timeZone = this.options.timeZone;
    this.value = parseTime(input.value, this.options.format) || this.currentTime();
    if (!this.options.showSeconds) this.value.second = 0;
    this.draft = { ...this.value };
    this.isOpen = false;
    this._suppressFocusOpen = false;
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-haspopup', 'dialog');
    this._onFocus = () => { if (!this._suppressFocusOpen) this.open(); };
    this._onClick = () => this.open();
    this._onResize = () => this.position();
    input.addEventListener('focus', this._onFocus);
    input.addEventListener('click', this._onClick);
    this._onKeyDown = event => {
      if (event.key === 'Escape' && this.isOpen) { event.preventDefault(); this.close(); }
      if ((event.key === 'Enter' || event.key === 'ArrowDown') && !this.isOpen) { event.preventDefault(); this.open(); }
    };
    if (this.options.keyboard) input.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('resize', this._onResize);
    window.addEventListener('scroll', this._onResize, true);
  }

  open() {
    if (this.isOpen) return this;
    this.isOpen = true;
    const parsedInput = parseTime(this.input.value, this.options.format);
    this.value = parsedInput || this.currentTime();
    if (!this.options.showSeconds) this.value.second = 0;
    this.draft = { ...this.value };
    this.render();
    document.body.append(this.backdrop, this.dialog);
    this.position();
    this.input.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => { this.position(); this.dialog.classList.add('hewarge-picker-open'); this.centerWheelSelection(); this.dialog.querySelector('.hw-time-wheel-item.is-active')?.focus({ preventScroll: true }); });
    return this;
  }

  close() {
    if (!this.isOpen) return this;
    this.isOpen = false;
    this.dialog?.remove();
    this.backdrop?.remove();
    this.input.setAttribute('aria-expanded', 'false');
    this._suppressFocusOpen = true;
    queueMicrotask(() => { this._suppressFocusOpen = false; });
    this.input.focus({ preventScroll: true });
    return this;
  }

  destroy() {
    this.close();
    this.input.removeEventListener('focus', this._onFocus);
    this.input.removeEventListener('click', this._onClick);
    this.input.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('scroll', this._onResize, true);
  }

  updateDraft() {
    const summary = this.dialog.querySelector('.hw-time-summary');
    if (summary) summary.textContent = formatTime(this.draft, this.options.format, this.options.showSeconds);
  }

  currentTime() {
    const now = timestampToDateTime(Date.now(), { timeZone: this.timeZone });
    return { hour: now.hour, minute: now.minute, second: this.options.showSeconds ? now.second : 0 };
  }

  wheelColumn(type, values, active) {
    const items = values.map(([value, label]) => `<button type="button" tabindex="${String(value) === String(active) ? '0' : '-1'}" class="hw-wheel-item hw-time-wheel-item${String(value) === String(active) ? ' is-active' : ''}" data-wheel="${type}" data-value="${esc(value)}">${esc(label)}</button>`).join('');
    return `<div class="hw-wheel-column" data-wheel-column="${type}"><div class="hw-wheel-fade top"></div><div class="hw-wheel-list" role="group" aria-label="${esc(type)}">${items}</div><div class="hw-wheel-selection" aria-hidden="true"></div><div class="hw-wheel-fade bottom"></div></div>`;
  }

  visibleHour() {
    return this.options.format === '12' ? (this.draft.hour % 12 || 12) : this.draft.hour;
  }

  bindWheelColumn(type) {
    const list = this.dialog?.querySelector(`[data-wheel-column="${type}"] .hw-wheel-list`);
    if (!list) return;
    const items = () => [...list.querySelectorAll('.hw-time-wheel-item')];
    const center = () => list.scrollTop + list.clientHeight / 2;
    const scrollTo = button => {
      if (!button) return;
      list.scrollTo({ top: button.offsetTop - list.clientHeight / 2 + button.offsetHeight / 2, behavior: 'smooth' });
    };
    list.addEventListener('wheel', event => {
      if (Math.abs(event.deltaY) < 1) return;
      event.preventDefault();
      const buttons = items();
      const nearest = buttons.reduce((best, button, index) => {
        const distance = Math.abs(button.offsetTop + button.offsetHeight / 2 - center());
        return distance < best.distance ? { index, distance } : best;
      }, { index: 0, distance: Infinity });
      scrollTo(buttons[Math.max(0, Math.min(buttons.length - 1, nearest.index + (event.deltaY > 0 ? 1 : -1)))]);
    }, { passive: false });
    let touchStartY = null;
    list.addEventListener('touchstart', event => { touchStartY = event.touches[0]?.clientY ?? null; }, { passive: true });
    list.addEventListener('touchend', event => {
      if (touchStartY == null) return;
      const endY = event.changedTouches[0]?.clientY;
      const delta = touchStartY - endY;
      touchStartY = null;
      if (Math.abs(delta) < 8) return;
      const buttons = items();
      const nearest = buttons.reduce((best, button, index) => {
        const distance = Math.abs(button.offsetTop + button.offsetHeight / 2 - center());
        return distance < best.distance ? { index, distance } : best;
      }, { index: 0, distance: Infinity });
      scrollTo(buttons[Math.max(0, Math.min(buttons.length - 1, nearest.index + Math.sign(delta)))]);
    }, { passive: true });
    list.addEventListener('keydown', event => {
      if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const buttons = items();
      const activeIndex = buttons.findIndex(button => button.classList.contains('is-active'));
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, activeIndex + (event.key === 'PageDown' ? 5 : event.key === 'PageUp' ? -5 : event.key === 'ArrowDown' ? 1 : -1)));
      buttons[next]?.focus();
      scrollTo(buttons[next]);
    });
    list.addEventListener('scroll', () => {
      clearTimeout(list._hwTimer);
      list._hwTimer = setTimeout(() => this.onWheelScroll(type, list), 100);
    }, { passive: true });
    items().forEach(button => button.addEventListener('click', () => {
      this.updateWheelPart(type, button.dataset.value);
      scrollTo(button);
    }));
  }

  onWheelScroll(type, list) {
    if (!this.isOpen || !list.isConnected) return;
    const buttons = [...list.querySelectorAll('.hw-time-wheel-item')];
    const midpoint = list.scrollTop + list.clientHeight / 2;
    const active = buttons.reduce((best, button) => {
      const distance = Math.abs(button.offsetTop + button.offsetHeight / 2 - midpoint);
      return distance < best.distance ? { button, distance } : best;
    }, { button: null, distance: Infinity }).button;
    if (!active) return;
    list.querySelector('.is-active')?.classList.remove('is-active');
    buttons.forEach(button => button.tabIndex = button === active ? 0 : -1);
    active.classList.add('is-active');
    this.updateWheelPart(type, active.dataset.value);
  }

  updateWheelPart(type, rawValue) {
    const value = type === 'period' ? rawValue : Number(rawValue);
    if (type === 'hour') {
      const hour = this.options.format === '12' ? (value % 12) + (this.draft.hour >= 12 ? 12 : 0) : value;
      this.draft.hour = hour;
    } else if (type === 'period') {
      this.draft.hour = (this.draft.hour % 12) + (value === 'PM' ? 12 : 0);
    } else if (type === 'minute') this.draft.minute = value;
    else if (type === 'second') this.draft.second = value;
    this.updateDraft();
    this.markCurrentWheelValues();
  }

  centerWheelSelection(selected = this.draft) {
    const activeByType = {
      hour: this.options.format === '12' ? (selected.hour % 12 || 12) : selected.hour,
      minute: selected.minute,
      second: selected.second,
      period: selected.hour < 12 ? 'AM' : 'PM'
    };
    for (const [type, value] of Object.entries(activeByType)) {
      const list = this.dialog?.querySelector(`[data-wheel-column="${type}"] .hw-wheel-list`);
      const active = [...(list?.querySelectorAll('.hw-time-wheel-item') || [])].find(item => String(item.dataset.value) === String(value));
      if (list && active) {
        list.scrollTop = active.offsetTop - list.clientHeight / 2 + active.offsetHeight / 2;
        list.querySelector('.is-active')?.classList.remove('is-active');
        list.querySelectorAll('.hw-time-wheel-item').forEach(item => item.tabIndex = item === active ? 0 : -1);
        active.classList.add('is-active');
      }
    }
  }

  markCurrentWheelValues() {
    this.centerWheelSelection(this.draft);
  }

  render() {
    this.dialog?.remove();
    this.backdrop?.remove();
    const locale = String(this.options.locale || 'en').toLowerCase().split('-')[0];
    const labels = LABELS[locale] || LABELS.en;
    const hourValues = this.options.format === '12'
      ? Array.from({ length: 12 }, (_, i) => [i + 1, pad(i + 1)])
      : Array.from({ length: 24 }, (_, i) => [i, pad(i)]);
    const minuteValues = Array.from({ length: 60 }, (_, minute) => [minute, pad(minute)]);
    const secondValues = Array.from({ length: 60 }, (_, i) => [i, pad(i)]);
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'hewarge-picker-backdrop';
    this.dialog = document.createElement('div');
    this.dialog.className = 'hewarge-picker-modal hw-time-modal';
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.setAttribute('aria-modal', 'true');
    this.dialog.dir = this.options.direction || (locale === 'ku' || locale === 'fa' || locale === 'ar' ? 'rtl' : 'ltr');
    this.dialog.innerHTML = `
      <div class="hw-modal-top"><div><span class="hw-kicker">${esc(labels.kicker)}</span><strong>${esc(labels.title)}</strong></div></div>
      <div class="hw-time-summary">${esc(formatTime(this.draft, this.options.format, this.options.showSeconds))}</div>
      <div class="hw-time-fields" dir="ltr">
        ${this.wheelColumn('hour', hourValues, this.visibleHour())}
        <b>:</b>${this.wheelColumn('minute', minuteValues, this.draft.minute)}
        ${this.options.showSeconds ? `<b>:</b>${this.wheelColumn('second', secondValues, this.draft.second)}` : ''}
        ${this.options.format === '12' ? this.wheelColumn('period', [['AM','AM'],['PM','PM']], this.draft.hour < 12 ? 'AM' : 'PM') : ''}
        <div class="hw-wheel-selection" aria-hidden="true"></div>
      </div>
      <div class="hw-message" role="alert" hidden></div>
      <div class="hw-footer hw-time-footer"><button type="button" class="hw-today" data-action="now">${esc(labels.now)}</button><button type="button" class="hw-confirm" data-action="exit">${esc(labels.exit)}</button></div>`;
    this.backdrop.addEventListener('click', () => this.close());
    this.dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); this.close(); return; }
      if (event.key === 'Enter' && event.target instanceof HTMLButtonElement) { event.preventDefault(); event.target.click(); return; }
      if (event.key !== 'Tab') return;
      const controls = [...this.dialog.querySelectorAll('button:not([disabled]), .hw-time-wheel-item')];
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    for (const type of ['hour', 'minute', ...(this.options.showSeconds ? ['second'] : []), ...(this.options.format === '12' ? ['period'] : [])]) this.bindWheelColumn(type);
    this.dialog.querySelector('[data-action="now"]').addEventListener('click', () => this.selectCurrentTime());
    this.dialog.querySelector('[data-action="exit"]').addEventListener('click', () => this.commit());
  }

  selectCurrentTime() {
    this.draft = this.currentTime();
    this.updateDraft();
    requestAnimationFrame(() => this.centerWheelSelection());
  }

  position() {
    if (!this.isOpen || !this.dialog) return;
    if (window.matchMedia('(max-width: 600px)').matches) {
      this.dialog.style.left = ''; this.dialog.style.top = ''; this.dialog.style.width = '';
      return;
    }
    const rect = this.input.getBoundingClientRect();
    const width = Math.min(340, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    let top = rect.bottom + 10;
    this.dialog.style.width = `${width}px`;
    if (top + this.dialog.offsetHeight > window.innerHeight - 12 && rect.top - this.dialog.offsetHeight - 10 > 12) top = rect.top - this.dialog.offsetHeight - 10;
    top = Math.max(12, Math.min(top, window.innerHeight - this.dialog.offsetHeight - 12));
    this.dialog.style.left = `${left}px`;
    this.dialog.style.top = `${top}px`;
  }

  commit() {
    this.updateDraft();
    this.value = { ...this.draft };
    this.input.value = formatTime(this.value, this.options.format, this.options.showSeconds);
    const detail = this.detail();
    this.input.dispatchEvent(new CustomEvent('hewarge:timechange', { bubbles: true, detail }));
    this.input.dispatchEvent(new CustomEvent('hewarge:change', { bubbles: true, detail }));
    this.close();
  }

  setTime(value) {
    const next = validateTime(Number(value.hour), Number(value.minute), Number(value.second ?? 0));
    if (!next) throw new RangeError('Invalid time value.');
    if (!this.options.showSeconds) next.second = 0;
    this.value = next;
    this.input.value = formatTime(next, this.options.format, this.options.showSeconds);
    this.input.dispatchEvent(new CustomEvent('hewarge:timechange', { bubbles: true, detail: this.detail() }));
    this.input.dispatchEvent(new CustomEvent('hewarge:change', { bubbles: true, detail: this.detail() }));
    return this;
  }

  setFormat(format) {
    if (format !== '12' && format !== '24') throw new RangeError('Time format must be "12" or "24".');
    this.options.format = format;
    this.input.value = formatTime(this.value, format, this.options.showSeconds);
    if (this.isOpen) {
      this.render();
      document.body.append(this.backdrop, this.dialog);
      this.position();
      this.dialog.classList.add('hewarge-picker-open');
      this.centerWheelSelection();
    }
    return this;
  }

  setShowSeconds(showSeconds) {
    this.options.showSeconds = Boolean(showSeconds);
    if (!this.options.showSeconds) {
      this.value.second = 0;
      this.draft.second = 0;
    }
    this.input.value = formatTime(this.value, this.options.format, this.options.showSeconds);
    if (this.isOpen) {
      this.render();
      document.body.append(this.backdrop, this.dialog);
      this.position();
      this.dialog.classList.add('hewarge-picker-open');
      this.centerWheelSelection();
    }
    return this;
  }

  setLocale(locale) {
    const calendarLocale = { kurdish: 'ku', 'kurdish-zayni': 'ku', jalali: 'fa', hijri: 'ar', gregorian: 'en' };
    this.options.locale = calendarLocale[locale] || locale || 'en';
    if (this.isOpen) {
      this.render();
      document.body.append(this.backdrop, this.dialog);
      this.position();
      this.dialog.classList.add('hewarge-picker-open');
      this.centerWheelSelection();
    }
    return this;
  }

  setTimeZone(timeZone) {
    if (!validTimeZone(timeZone)) throw new RangeError(`Invalid IANA time zone: ${timeZone}`);
    this.timeZone = normalizeTimeZone(timeZone);
    this.options.timeZone = this.timeZone;
    if (this.isOpen) { this.render(); document.body.append(this.backdrop, this.dialog); this.position(); this.dialog.classList.add('hewarge-picker-open'); this.centerWheelSelection(); }
    return this;
  }

  detail(date) {
    const detail = { ...this.value, format: this.options.format, timeZone: this.timeZone, value: formatTime(this.value, this.options.format, this.options.showSeconds) };
    if (date) {
      const dateTime = { ...date, ...this.value };
      detail.dateTime = dateTime;
      try { detail.timestamp = dateTimeToTimestamp(dateTime, { timeZone: this.timeZone }); }
      catch (error) { detail.timestamp = null; detail.validationError = error.message; }
    }
    return detail;
  }
}

export function createTimePicker(input, options = {}) { return new HewargeTimePicker(input, options); }
export function attachTimePickers(root = document, options = {}) {
  const selector = options.selector || 'input[data-hewarge-timepicker], input.hewarge-time-input';
  return [...root.querySelectorAll(selector)].map(input => createTimePicker(input, { ...options, format: input.dataset.timeFormat || options.format, timeZone: input.dataset.timeZone || options.timeZone }));
}
export const timePicker = { create: createTimePicker, attach: attachTimePickers, HewargeTimePicker };

export class HewargeDateTimePicker {
  constructor(dateInput, timeInput, options = {}) {
    if (!dateInput || !timeInput) throw new TypeError('HewargeDateTimePicker requires date and time inputs.');
    const dateOptions = { ...options.date };
    for (const key of ['calendar', 'locale', 'format', 'gregorianFormat', 'weekStart', 'minDate', 'maxDate', 'direction', 'pastYears', 'futureYears', 'pastMonths', 'futureMonths']) {
      if (dateOptions[key] === undefined && options[key] !== undefined) dateOptions[key] = options[key];
    }
    this.datePicker = createDatePicker(dateInput, dateOptions);
    const timeOptions = { ...options.time };
    for (const key of ['timeZone', 'showSeconds', 'direction', 'keyboard']) {
      if (timeOptions[key] === undefined && options[key] !== undefined) timeOptions[key] = options[key];
    }
    if (timeOptions.format !== '12' && timeOptions.format !== '24') timeOptions.format = '24';
    timeOptions.locale = timeOptions.locale || options.date?.calendar || options.calendar || 'en';
    this.timePicker = createTimePicker(timeInput, timeOptions);
    this.dateInput = dateInput;
    this.timeInput = timeInput;
    this._onChange = event => this.emit(event.target);
    dateInput.addEventListener('hewarge:change', this._onChange);
    timeInput.addEventListener('hewarge:timechange', this._onChange);
  }
  get value() { return this.timePicker.detail(this.datePicker.value.toObject()); }
  setCalendar(calendar) { this.datePicker.setCalendar(calendar); this.timePicker.setLocale(calendar); return this; }
  setTimeFormat(format) { this.timePicker.setFormat(format); return this; }
  setShowSeconds(showSeconds) { this.timePicker.setShowSeconds(showSeconds); return this; }
  setTimeZone(zone) {
    this.timePicker.setTimeZone(zone);
    this.emit(this.timeInput);
    return this;
  }
  destroy() { this.dateInput.removeEventListener('hewarge:change', this._onChange); this.timeInput.removeEventListener('hewarge:timechange', this._onChange); this.datePicker.destroy(); this.timePicker.destroy(); }
  emit(target) {
    const detail = this.value;
    target.dispatchEvent(new CustomEvent('hewarge:datetimechange', { bubbles: true, detail }));
  }
}

export function createDateTimePicker(dateInput, timeInput, options = {}) { return new HewargeDateTimePicker(dateInput, timeInput, options); }
export const dateTimePicker = { create: createDateTimePicker, HewargeDateTimePicker };
