import { dateTimeToTimestamp, timestampToDateTime, normalizeTimeZone } from '../api/TimestampConverters.js';
import { createDatePicker } from './HewargeDatePicker.js';
import { formatTime as formatCoreTime, parseTime as parseCoreTime } from '../formatting/index.js';

const DEFAULTS = {
  variant: 'default',
  format: '24',
  locale: 'en',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  showSeconds: false,
  keyboard: true
};
const LABELS = {
  en: { kicker: 'TIME', title: 'Choose a time', clockTitle: 'Select time', iosTitle: 'IOS TIMEPICKER', close: 'Close', hour: 'Hour', minute: 'Minute', second: 'Second', period: 'Period', now: 'Current time', exit: 'Exit', cancel: 'Cancel', ok: 'OK', apply: 'Apply', keyboard: 'Use keyboard', clock: 'Use clock' },
  ku: { kicker: 'کات', title: 'هەڵبژاردنی کات', clockTitle: 'هەڵبژاردنی کات', iosTitle: 'هەڵبژاردنی کات', close: 'داخستن', hour: 'کاتژمێر', minute: 'خولەک', second: 'چرکە', period: 'پێشنیوەڕۆ/دواینیوەڕۆ', now: 'کاتی ئێستا', exit: 'دەرچوون', cancel: 'پاشگەزبوونەوە', ok: 'باشە', apply: 'جێبەجێکردن', keyboard: 'بە کیبۆرد بنووسە', clock: 'بە کاتژمێر هەڵبژێرە' },
  fa: { kicker: 'زمان', title: 'انتخاب زمان', clockTitle: 'انتخاب زمان', iosTitle: 'انتخاب زمان', close: 'بستن', hour: 'ساعت', minute: 'دقیقه', second: 'ثانیه', period: 'ق.ظ/ب.ظ', now: 'زمان اکنون', exit: 'خروج', cancel: 'لغو', ok: 'تأیید', apply: 'اعمال', keyboard: 'ورود با صفحه‌کلید', clock: 'انتخاب با ساعت' },
  ar: { kicker: 'الوقت', title: 'اختر الوقت', clockTitle: 'اختر الوقت', iosTitle: 'اختيار الوقت', close: 'إغلاق', hour: 'الساعة', minute: 'الدقيقة', second: 'الثانية', period: 'ص/م', now: 'الوقت الآن', exit: 'خروج', cancel: 'إلغاء', ok: 'موافق', apply: 'تطبيق', keyboard: 'استخدم لوحة المفاتيح', clock: 'استخدم الساعة' }
};

function pad(value) { return String(value).padStart(2, '0'); }
function validateTime(hour, minute, second = 0) {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59 || !Number.isInteger(second) || second < 0 || second > 59) return null;
  return { hour, minute, second };
}

export function formatTime(value, format = '24', showSeconds = false) {
  const pattern = format === '12' ? (showSeconds ? 'hh:mm:ss A' : 'hh:mm A') : (showSeconds ? 'HH:mm:ss' : 'HH:mm');
  return formatCoreTime(value, pattern, { locale: 'en', numberingSystem: 'latn' });
}

export function parseTime(raw, format = '24') {
  try { const text=String(raw||'').trim(); const hasSeconds=text.includes(':')&&text.split(':').length>=3; const pattern=format==='12'?(hasSeconds?'hh:mm:ss A':'hh:mm A'):(hasSeconds?'HH:mm:ss':'HH:mm'); const value=parseCoreTime(text,pattern,{locale:'en'}); return {hour:value.hour,minute:value.minute,second:value.second}; } catch { return null; }
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
    if (!['default', 'analog-clock', 'ios-wheel'].includes(this.options.variant)) throw new RangeError('Time picker variant must be "default", "analog-clock" or "ios-wheel".');
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
    this.clockMode = 'hour';
    this.clockKeyboard = false;
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
    this.clockMode = 'hour';
    this.clockKeyboard = false;
    this.render();
    document.body.append(this.backdrop, this.dialog);
    this.position();
    this.input.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => { this.position(); this.dialog.classList.add('hewarge-picker-open'); this.centerWheelSelection(); (this.dialog.querySelector('.hw-time-wheel-item.is-active') || this.dialog.querySelector('.hw-clock-time-button.is-active') || this.dialog.querySelector('[data-clock-action="cancel"]'))?.focus({ preventScroll: true }); });
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
    const clockSummary = this.dialog.querySelector('.hw-clock-preview');
    if (clockSummary) clockSummary.textContent = formatTime(this.draft, this.options.format, this.options.showSeconds);
    const iosSummary = this.dialog.querySelector('.hw-ios-value');
    if (iosSummary) iosSummary.textContent = formatTime(this.draft, this.options.format, this.options.showSeconds);
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
      this.updateWheelPart(type, button.dataset.value, false, false);
      items().forEach(item => {
        item.classList.toggle('is-active', item === button);
        item.tabIndex = item === button ? 0 : -1;
      });
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

  updateWheelPart(type, rawValue, rerender = false, updateWheels = true) {
    const value = type === 'period' ? rawValue : Number(rawValue);
    if (type === 'hour') {
      const hour = this.options.format === '12' ? (value % 12) + (this.draft.hour >= 12 ? 12 : 0) : value;
      this.draft.hour = hour;
    } else if (type === 'period') {
      this.draft.hour = (this.draft.hour % 12) + (value === 'PM' ? 12 : 0);
    } else if (type === 'minute') this.draft.minute = value;
    else if (type === 'second') this.draft.second = value;
    this.updateDraft();
    if (updateWheels) this.markCurrentWheelValues();
    if (rerender && this.options.variant === 'ios-wheel') this.renderIOSAgain();
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
    if (this.options.variant === 'analog-clock') {
      this.renderClockDialog(labels);
      return;
    }
    if (this.options.variant === 'ios-wheel') {
      this.renderIOSWheelDialog(labels);
      return;
    }
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

  renderClockDialog(labels) {
    this.dialog.classList.add('hw-time-clock-modal');
    const hour = this.options.format === '12' ? this.visibleHour() : this.draft.hour;
    const hourText = this.options.format === '12' ? String(hour) : pad(hour);
    const minuteText = pad(this.draft.minute);
    const hourAngle = ((this.draft.hour % 12) * 30);
    const minuteAngle = this.draft.minute * 6;
    const handAngle = this.clockMode === 'hour' ? hourAngle : minuteAngle;
    const activePeriod = this.draft.hour < 12 ? 'AM' : 'PM';
    const dial = this.clockKeyboard ? this.renderClockKeyboard(labels) : this.renderClockFace(labels, hourAngle, minuteAngle);

    this.dialog.innerHTML = `
      <div class="hw-clock-heading">
        <span>${esc(labels.clockTitle || labels.title)}</span>
        <button type="button" class="hw-clock-close" data-clock-action="cancel" aria-label="${esc(labels.cancel || labels.close)}">×</button>
      </div>
      <div class="hw-clock-time-row" dir="ltr">
        <button type="button" class="hw-clock-time-button${this.clockMode === 'hour' ? ' is-active' : ''}" data-clock-field="hour" aria-label="${esc(labels.hour)}">${hourText}</button>
        <span class="hw-clock-colon">:</span>
        <button type="button" class="hw-clock-time-button${this.clockMode === 'minute' ? ' is-active' : ''}" data-clock-field="minute" aria-label="${esc(labels.minute)}">${minuteText}</button>
        ${this.options.format === '12' ? `<div class="hw-clock-period" role="group" aria-label="${esc(labels.period)}"><button type="button" data-clock-period="AM" class="${activePeriod === 'AM' ? 'is-active' : ''}">AM</button><button type="button" data-clock-period="PM" class="${activePeriod === 'PM' ? 'is-active' : ''}">PM</button></div>` : ''}
      </div>
      <div class="hw-clock-preview" aria-live="polite">${esc(formatTime(this.draft, this.options.format, this.options.showSeconds))}</div>
      ${dial}
      <div class="hw-clock-footer">
        <button type="button" class="hw-clock-keyboard" data-clock-action="keyboard" aria-label="${esc(this.clockKeyboard ? labels.clock : labels.keyboard)}" title="${esc(this.clockKeyboard ? labels.clock : labels.keyboard)}" ${this.options.keyboard ? '' : 'hidden'}>${this.clockKeyboard ? '◷' : '⌨'}</button>
        <div class="hw-clock-actions"><button type="button" data-clock-action="now">${esc(labels.now)}</button><button type="button" data-clock-action="close">${esc(labels.close)}</button></div>
      </div>`;
    this.backdrop.addEventListener('click', () => this.close());

    this.dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); this.close(); return; }
      if (event.key === 'Enter' && event.target instanceof HTMLButtonElement) { event.preventDefault(); event.target.click(); return; }
      if (event.key !== 'Tab') return;
      const controls = [...this.dialog.querySelectorAll('button:not([disabled]):not([hidden]), input:not([disabled])')];
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    this.dialog.querySelector('[data-clock-action="close"]')?.addEventListener('click', () => this.commit());
    this.dialog.querySelector('[data-clock-action="now"]')?.addEventListener('click', () => this.selectCurrentTime());
    this.dialog.querySelector('[data-clock-action="keyboard"]')?.addEventListener('click', () => {
      this.clockKeyboard = !this.clockKeyboard;
      this.renderVariantAgain();
      this.dialog.querySelector('.hw-clock-input, .hw-ios-input')?.focus({ preventScroll: true });
    });
    this.dialog.querySelectorAll('[data-clock-field]').forEach(button => button.addEventListener('click', () => {
      this.clockMode = button.dataset.clockField;
      this.clockKeyboard = false;
      this.renderClockAgain();
    }));
    this.dialog.querySelectorAll('[data-clock-period]').forEach(button => button.addEventListener('click', () => {
      this.draft.hour = (this.draft.hour % 12) + (button.dataset.clockPeriod === 'PM' ? 12 : 0);
      this.updateDraft();
      this.renderClockAgain();
    }));
    this.dialog.querySelectorAll('[data-clock-hour-value]').forEach(button => button.addEventListener('click', () => {
      const selectedHour = Number(button.dataset.clockHourValue);
      if (this.options.format === '12') this.draft.hour = (selectedHour % 12) + (this.draft.hour >= 12 ? 12 : 0);
      else this.draft.hour = selectedHour;
      this.clockMode = 'minute';
      this.renderClockAgain();
    }));
    this.dialog.querySelectorAll('[data-clock-minute-value]').forEach(button => button.addEventListener('click', () => {
      this.draft.minute = Number(button.dataset.clockMinuteValue);
      this.updateDraft();
      this.renderClockAgain();
    }));
    const clockFace = this.dialog.querySelector('.hw-clock-face');
    if (clockFace && this.clockMode === 'minute') {
      const setMinuteFromPointer = event => {
        const bounds = clockFace.getBoundingClientRect();
        const dx = event.clientX - (bounds.left + bounds.width / 2);
        const dy = event.clientY - (bounds.top + bounds.height / 2);
        const degrees = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
        this.draft.minute = Math.round(degrees / 6) % 60;
        this.updateDraft();
        this.updateClockDisplay();
      };
      clockFace.addEventListener('pointerdown', event => {
        this._clockPointerActive = true;
        try { clockFace.setPointerCapture?.(event.pointerId); } catch { /* pointer capture is optional */ }
        setMinuteFromPointer(event);
      });
      clockFace.addEventListener('pointermove', event => {
        if (this._clockPointerActive) setMinuteFromPointer(event);
      });
      clockFace.addEventListener('pointerup', event => {
        if (!this._clockPointerActive) return;
        this._clockPointerActive = false;
        try { clockFace.releasePointerCapture?.(event.pointerId); } catch { /* pointer capture is optional */ }
        this.renderClockAgain();
      });
      clockFace.addEventListener('pointercancel', () => { this._clockPointerActive = false; });
    }
    this.dialog.querySelectorAll('.hw-clock-input').forEach(input => input.addEventListener('input', () => {
      const next = Number(input.value);
      const field = input.dataset.field;
      const max = field === 'hour' ? (this.options.format === '12' ? 12 : 23) : 59;
      const min = field === 'hour' && this.options.format === '12' ? 1 : 0;
      if (input.value === '' || !Number.isInteger(next) || next < min || next > max) return;
      if (field === 'hour') this.draft.hour = this.options.format === '12'
        ? (next % 12) + (this.draft.hour >= 12 ? 12 : 0)
        : next;
      else this.draft[field] = next;
      this.updateClockDisplay();
    }));
  }

  renderIOSWheelDialog(labels) {
    this.dialog.classList.add('hw-time-ios-modal');
    const hours = this.options.format === '12'
      ? Array.from({ length: 12 }, (_, index) => [index + 1, String(index + 1)])
      : Array.from({ length: 24 }, (_, hour) => [hour, pad(hour)]);
    const minutes = Array.from({ length: 60 }, (_, minute) => [minute, pad(minute)]);
    const seconds = Array.from({ length: 60 }, (_, second) => [second, pad(second)]);
    this.dialog.innerHTML = `
      <div class="hw-ios-heading">${esc(labels.iosTitle || 'IOS TIMEPICKER')}</div>
      <div class="hw-ios-value">${esc(formatTime(this.draft, this.options.format, this.options.showSeconds))}</div>
      ${this.clockKeyboard ? this.renderIOSKeyboard(labels) : `<div class="hw-ios-fields" dir="ltr">
        ${this.wheelColumn('hour', hours, this.visibleHour())}<b>:</b>
        ${this.wheelColumn('minute', minutes, this.draft.minute)}
        ${this.options.showSeconds ? `<b>:</b>${this.wheelColumn('second', seconds, this.draft.second)}` : ''}
        ${this.options.format === '12' ? this.wheelColumn('period', [['AM','AM'], ['PM','PM']], this.draft.hour < 12 ? 'AM' : 'PM') : ''}
      </div>`}
      <div class="hw-ios-footer">
        <button type="button" class="hw-ios-keyboard" data-action="keyboard" aria-label="${esc(this.clockKeyboard ? labels.clock : labels.keyboard)}" title="${esc(this.clockKeyboard ? labels.clock : labels.keyboard)}" ${this.options.keyboard ? '' : 'hidden'}>${this.clockKeyboard ? '◷' : '⌨'}</button>
        <div class="hw-ios-actions"><button type="button" data-action="now">${esc(labels.now)}</button><button type="button" data-action="exit">${esc(labels.exit)}</button></div>
      </div>`;
    this.backdrop.addEventListener('click', () => this.close());
    this.dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); this.close(); return; }
      if (event.key === 'Enter' && event.target instanceof HTMLButtonElement) { event.preventDefault(); event.target.click(); return; }
      if (event.key !== 'Tab') return;
      const controls = [...this.dialog.querySelectorAll('button:not([disabled]):not([hidden]), input:not([disabled])')];
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    this.dialog.querySelector('[data-action="now"]')?.addEventListener('click', () => this.selectCurrentTime());
    this.dialog.querySelector('[data-action="exit"]')?.addEventListener('click', () => this.commit());
    this.dialog.querySelector('[data-action="keyboard"]')?.addEventListener('click', () => {
      this.clockKeyboard = !this.clockKeyboard;
      this.renderIOSAgain();
      this.dialog.querySelector('.hw-clock-input, .hw-ios-input')?.focus({ preventScroll: true });
    });
    if (!this.clockKeyboard) {
      for (const type of ['hour', 'minute', ...(this.options.showSeconds ? ['second'] : []), ...(this.options.format === '12' ? ['period'] : [])]) this.bindWheelColumn(type);
    } else {
      this.bindIOSKeyboardInputs();
      this.dialog.querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => {
        this.draft.hour = (this.draft.hour % 12) + (button.dataset.period === 'PM' ? 12 : 0);
        this.renderIOSAgain();
      }));
    }
  }

  renderIOSKeyboard(labels) {
    const hour = this.options.format === '12' ? this.visibleHour() : this.draft.hour;
    return `<div class="hw-ios-keyboard-fields" dir="ltr">
      <label>${esc(labels.hour)}<input class="hw-ios-input" data-field="hour" type="number" min="${this.options.format === '12' ? 1 : 0}" max="${this.options.format === '12' ? 12 : 23}" inputmode="numeric" value="${hour}"></label>
      <span>:</span>
      <label>${esc(labels.minute)}<input class="hw-ios-input" data-field="minute" type="number" min="0" max="59" inputmode="numeric" value="${pad(this.draft.minute)}"></label>
      ${this.options.showSeconds ? `<span>:</span><label>${esc(labels.second)}<input class="hw-ios-input" data-field="second" type="number" min="0" max="59" inputmode="numeric" value="${pad(this.draft.second)}"></label>` : ''}
      ${this.options.format === '12' ? `<div class="hw-ios-period"><button type="button" data-period="AM" class="${this.draft.hour < 12 ? 'is-active' : ''}">AM</button><button type="button" data-period="PM" class="${this.draft.hour >= 12 ? 'is-active' : ''}">PM</button></div>` : ''}
    </div>`;
  }

  bindIOSKeyboardInputs() {
    this.dialog.querySelectorAll('.hw-ios-input').forEach(input => input.addEventListener('input', () => {
      const next = Number(input.value);
      const field = input.dataset.field;
      const max = field === 'hour' ? (this.options.format === '12' ? 12 : 23) : 59;
      const min = field === 'hour' && this.options.format === '12' ? 1 : 0;
      if (input.value === '' || !Number.isInteger(next) || next < min || next > max) return;
      if (field === 'hour') this.draft.hour = this.options.format === '12'
        ? (next % 12) + (this.draft.hour >= 12 ? 12 : 0)
        : next;
      else this.draft[field] = next;
      const preview = this.dialog.querySelector('.hw-ios-value');
      if (preview) preview.textContent = formatTime(this.draft, this.options.format, this.options.showSeconds);
    }));
  }

  renderIOSAgain() {
    if (!this.isOpen) return;
    this.render();
    document.body.append(this.backdrop, this.dialog);
    this.position();
    this.dialog.classList.add('hewarge-picker-open');
    if (!this.clockKeyboard) this.centerWheelSelection();
  }

  renderClockFace(labels, hourAngle, minuteAngle) {
    const items = [];
    if (this.clockMode === 'hour') {
      if (this.options.format === '12') {
        const values = [12, ...Array.from({ length: 11 }, (_, index) => index + 1)];
        values.forEach((value, index) => {
          const active = this.visibleHour() === value;
          const angle = index * 30;
          items.push(`<button type="button" class="hw-clock-number${active ? ' is-selected' : ''}" style="--clock-index:${index};--clock-angle:${angle}deg" data-clock-hour-value="${value}" aria-label="${esc(labels.hour)} ${value}">${value}</button>`);
        });
      } else {
        const inner = [12, ...Array.from({ length: 11 }, (_, index) => index + 1)];
        inner.forEach((value, index) => {
          items.push(`<button type="button" class="hw-clock-number is-inner${this.draft.hour === value ? ' is-selected' : ''}" style="--clock-index:${index}" data-clock-hour-value="${value}" aria-label="${esc(labels.hour)} ${value}">${pad(value)}</button>`);
        });
        const outer = [0, ...Array.from({ length: 11 }, (_, index) => index + 13)];
        outer.forEach((value, index) => {
          items.push(`<button type="button" class="hw-clock-number is-outer${this.draft.hour === value ? ' is-selected' : ''}" style="--clock-index:${index}" data-clock-hour-value="${value}" aria-label="${esc(labels.hour)} ${pad(value)}">${pad(value)}</button>`);
        });
      }
    } else {
      for (let index = 0; index < 12; index++) {
        const value = index === 0 ? 0 : index * 5;
        const active = (Math.round(this.draft.minute / 5) * 5) % 60 === value;
        items.push(`<button type="button" class="hw-clock-number${active ? ' is-selected' : ''}" style="--clock-index:${index}" data-clock-minute-value="${value}" aria-label="${esc(labels.minute)} ${pad(value)}">${pad(value)}</button>`);
      }
    }
    const angle = this.clockMode === 'hour' ? hourAngle : minuteAngle;
    return `<div class="hw-clock-face" role="group" aria-label="${esc(this.clockMode === 'hour' ? labels.hour : labels.minute)}">
      <div class="hw-clock-hand" style="--clock-hand-angle:${angle}deg" aria-hidden="true"></div><span class="hw-clock-center" aria-hidden="true"></span>
      ${items.join('')}
    </div>`;
  }

  renderClockKeyboard(labels) {
    const hour = this.options.format === '12' ? this.visibleHour() : this.draft.hour;
    return `<div class="hw-clock-keyboard-fields" dir="ltr">
      <label>${esc(labels.hour)}<input class="hw-clock-input" data-field="hour" type="number" min="${this.options.format === '12' ? 1 : 0}" max="${this.options.format === '12' ? 12 : 23}" inputmode="numeric" value="${hour}"></label>
      <span>:</span>
      <label>${esc(labels.minute)}<input class="hw-clock-input" data-field="minute" type="number" min="0" max="59" inputmode="numeric" value="${pad(this.draft.minute)}"></label>
      ${this.options.showSeconds ? `<span>:</span><label>${esc(labels.second)}<input class="hw-clock-input" data-field="second" type="number" min="0" max="59" inputmode="numeric" value="${pad(this.draft.second)}"></label>` : ''}
    </div>`;
  }

  updateClockDisplay() {
    const hourButton = this.dialog?.querySelector('[data-clock-field="hour"]');
    const minuteButton = this.dialog?.querySelector('[data-clock-field="minute"]');
    const hour = this.options.format === '12' ? String(this.visibleHour()) : pad(this.draft.hour);
    if (hourButton) hourButton.textContent = hour;
    if (minuteButton) minuteButton.textContent = pad(this.draft.minute);
    this.updateDraft();
  }

  renderClockAgain() {
    this.renderVariantAgain();
  }

  renderVariantAgain() {
    if (!this.isOpen) return;
    this.render();
    document.body.append(this.backdrop, this.dialog);
    this.position();
    this.dialog.classList.add('hewarge-picker-open');
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
    const preferredWidth = this.options.variant === 'analog-clock' ? 300 : this.options.variant === 'ios-wheel' ? 300 : 340;
    const width = Math.min(preferredWidth, window.innerWidth - 24);
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

  setVariant(variant) {
    if (!['default', 'analog-clock', 'ios-wheel'].includes(variant)) throw new RangeError('Time picker variant must be "default", "analog-clock" or "ios-wheel".');
    this.options.variant = variant;
    this.clockMode = 'hour';
    this.clockKeyboard = false;
    if (this.isOpen) {
      this.render();
      document.body.append(this.backdrop, this.dialog);
      this.position();
      this.dialog.classList.add('hewarge-picker-open');
      if (!this.clockKeyboard && this.options.variant !== 'analog-clock') this.centerWheelSelection();
    }
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
      if (!this.clockKeyboard) this.centerWheelSelection();
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
      if (!this.clockKeyboard) this.centerWheelSelection();
    }
    return this;
  }

  setTimeZone(timeZone) {
    if (!validTimeZone(timeZone)) throw new RangeError(`Invalid IANA time zone: ${timeZone}`);
    this.timeZone = normalizeTimeZone(timeZone);
    this.options.timeZone = this.timeZone;
    if (this.isOpen) { this.render(); document.body.append(this.backdrop, this.dialog); this.position(); this.dialog.classList.add('hewarge-picker-open'); if (!this.clockKeyboard) this.centerWheelSelection(); }
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
  return [...root.querySelectorAll(selector)].map(input => createTimePicker(input, { ...options, variant: input.dataset.timeVariant || input.dataset.variant || options.variant, format: input.dataset.timeFormat || options.format, timeZone: input.dataset.timeZone || options.timeZone }));
}
export const timePicker = { create: createTimePicker, attach: attachTimePickers, HewargeTimePicker };

export class HewargeDateTimePicker {
  constructor(dateInput, timeInput, options = {}) {
    if (!dateInput || !timeInput) throw new TypeError('HewargeDateTimePicker requires date and time inputs.');
    const dateOptions = { ...options.date };
    for (const key of ['calendar', 'locale', 'format', 'gregorianFormat', 'weekStart', 'minDate', 'maxDate', 'direction', 'pastYears', 'futureYears', 'pastMonths', 'futureMonths', 'variant']) {
      if (dateOptions[key] === undefined && options[key] !== undefined) dateOptions[key] = options[key];
    }
    this.datePicker = createDatePicker(dateInput, dateOptions);
    const timeOptions = { ...options.time };
    for (const key of ['timeZone', 'showSeconds', 'direction', 'keyboard']) {
      if (timeOptions[key] === undefined && options[key] !== undefined) timeOptions[key] = options[key];
    }
    if (timeOptions.variant === undefined && options.timeVariant !== undefined) timeOptions.variant = options.timeVariant;
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
  setTimeVariant(variant) { this.timePicker.setVariant(variant); return this; }
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
