import { HewargeDate, CalendarRegistry } from '../index.js';

const DEFAULTS = {
  calendar: 'kurdish',
  locale: 'ku',
  format: 'YYYY/MM/DD',
  gregorianFormat: 'YYYY-MM-DD',
  weekStart: 6,
  closeOnSelect: true,
  clearable: true,
  todayButton: true,
  keyboard: true,
  inputValue: true,
  storageInput: null,
  storageName: null,
  autoStorage: false,
  mobileMode: 'auto',
  direction: 'both',
  pastYears: null,
  futureYears: null,
  pastMonths: null,
  futureMonths: null,
  minDate: null,
  maxDate: null
};

const MONTHS = {
  kurdish: ['خاکەلێوە','گوڵان','جۆزەردان','پووشپەڕ','گەلاوێژ','خەرمانان','ڕەزبەر','گەڵاڕێزان','سەرماوەز','بەفرانبار','ڕێبەندان','ڕەشەمە'],
  jalali: ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'],
  gregorian: ['کانوونی دووەم','شوبات','ئازار','نیسان','ئایار','حوزەیران','تەممووز','ئاب','ئەیلوول','تشرینی یەکەم','تشرینی دووەم','کانوونی یەکەم'],
  hijri: ['موحەڕەم','سەفەر','ڕەبیعی یەکەم','ڕەبیعی دووەم','جەمادی یەکەم','جەمادی دووەم','ڕەجەب','شەعبان','ڕەمەزان','شەوال','ذوالقەعدە','ذوالحجە']
};
const WEEKDAYS = ['یەکشەممە','دووشەممە','سێشەممە','چوارشەممە','پێنجشەممە','هەینی','شەممە'];
const LABELS = { kurdish:'کوردی', jalali:'هەوری', gregorian:'زایینی', hijri:'هجری' };

let stylesInstalled = false;

function installStyles() {
  if (stylesInstalled || typeof document === 'undefined') return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./hewarge-date-picker.css', import.meta.url).href;
  document.head.appendChild(link);
  stylesInstalled = true;
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function pad(n) { return String(n).padStart(2, '0'); }
function formatDate(date, pattern) {
  return pattern.replaceAll('YYYY', String(date.year).padStart(4, '0')).replaceAll('MM', pad(date.month)).replaceAll('DD', pad(date.day)).replaceAll('M', String(date.month)).replaceAll('D', String(date.day));
}
const ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;
function escapeRegExp(str) { return str.replace(ESCAPE_RE, '\\$&'); }
function parseDate(raw, pattern) {
  if (!raw) return null;
  // Build a regex from the pattern's token order (YYYY/MM/DD in any order/separators).
  // Split into alternating literal/token parts first, so only the *literal* separators
  // (e.g. "/" or "-") get regex-escaped — the capture groups themselves must stay intact.
  const parts = pattern.split(/(YYYY|MM|DD|M|D)/).filter(p => p !== '');
  const tokens = parts.filter(p => /^(YYYY|MM|DD|M|D)$/.test(p));
  if (!tokens.length) return null;
  const groupFor = { YYYY: '(-?\\d{1,6})', MM: '(\\d{1,2})', DD: '(\\d{1,2})', M: '(\\d{1,2})', D: '(\\d{1,2})' };
  const regexSource = parts.map(p => (groupFor[p] ? groupFor[p] : escapeRegExp(p))).join('');
  let re;
  try { re = new RegExp(`^${regexSource}$`); } catch { re = null; }
  const fieldOf = t => (t === 'YYYY' ? 'year' : t === 'MM' || t === 'M' ? 'month' : 'day');
  if (re) {
    const m = raw.trim().match(re);
    if (m) {
      const result = {};
      tokens.forEach((t, i) => { result[fieldOf(t)] = Number(m[i + 1]); });
      if (result.year != null && result.month != null && result.day != null) return result;
    }
  }
  // Fallback: any three numeric groups, in the pattern's field order
  const nums = raw.match(/-?\d{1,6}/g);
  if (nums && nums.length >= 3) {
    const order = tokens.map(fieldOf);
    const seen = new Set();
    const uniqueOrder = order.filter(f => (seen.has(f) ? false : (seen.add(f), true)));
    const result = {};
    uniqueOrder.forEach((f, i) => { result[f] = Number(nums[i]); });
    if (result.year != null && result.month != null && result.day != null) return result;
  }
  return null;
}
export { formatDate, parseDate };
function monthLabel(calendar, month) { return MONTHS[calendar]?.[month - 1] ?? `${month}`; }
function monthStart(calendar, year, month) { return HewargeDate.from(calendar, year, month, 1); }
function shiftMonth(calendar, year, month, delta) {
  const base = monthStart(calendar, year, month).add({ months: delta });
  return { year: base.year, month: base.month };
}

export class HewargeDatePicker {
  constructor(input, options = {}) {
    if (!input || input.nodeType !== 1) throw new TypeError('HewargeDatePicker requires an input element.');
    installStyles();
    this.input = input;
    this.options = { ...DEFAULTS, ...options };
    const requestedWeekStart = Number(this.options.weekStart);
    this.options.weekStart = Number.isFinite(requestedWeekStart) ? ((Math.trunc(requestedWeekStart) % 7) + 7) % 7 : DEFAULTS.weekStart;
    this.calendar = this.options.calendar;
    this.value = this.readInput() || this.todayValue();
    this.view = { year: this.value.year, month: this.value.month };
    this.isOpen = false;
    this._onKeyDown = e => this.onKeyDown(e);
    this._onDialogKeyDown = e => this.trapFocus(e);
    this._onDocumentClick = () => {};
    this._onResize = () => this.position();
    this.input.setAttribute('autocomplete', 'off');
    this.storageInput = this.resolveStorageInput();
    this.input.setAttribute('aria-haspopup', 'dialog');
    this._suppressFocusOpen = false;
    this.input.addEventListener('focus', () => { if (!this._suppressFocusOpen) this.open(); });
    this.input.addEventListener('click', () => this.open());
    if (this.options.keyboard) this.input.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('mousedown', this._onDocumentClick);
    window.addEventListener('resize', this._onResize);
    window.addEventListener('scroll', this._onResize, true);
  }

  readInput() {
    const raw = this.input.value?.trim();
    if (!raw) return null;
    try {
      const parsed = parseDate(raw, this.options.format);
      if (parsed) return HewargeDate.from(this.calendar, parsed.year, parsed.month, parsed.day);
    } catch {}
    try {
      const parsed = parseDate(raw, this.options.gregorianFormat);
      if (parsed) return HewargeDate.fromGregorian(parsed.year, parsed.month, parsed.day).convert(this.calendar);
    } catch {}
    return null;
  }

  resolveStorageInput() {
    const target = this.options.storageInput;
    if (target?.nodeType === 1) return target;
    if (typeof target === 'string' && typeof document !== 'undefined') return document.querySelector(target);
    if ((this.options.storageName || (this.options.autoStorage && this.input.name)) && typeof document !== 'undefined') {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = this.options.storageName || this.input.name;
      hidden.dataset.hewargeStorage = 'true';
      this.input.insertAdjacentElement('afterend', hidden);
      return hidden;
    }
    return null;
  }

  isMobile() {
    if (this.options.mobileMode === 'wheel') return true;
    if (this.options.mobileMode === 'calendar') return false;
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 600px)').matches;
  }

  open() {
    if (this.isOpen) return this;
    this.isOpen = true;
    this.view = { year: this.value.year, month: this.value.month };
    this.renderDialog();
    document.body.appendChild(this.backdrop);
    document.body.appendChild(this.dialog);
    this.dialog.addEventListener('keydown', this._onDialogKeyDown);
    requestAnimationFrame(() => {
      this.position();
      this.dialog.classList.add('hewarge-picker-open');
      this.focusableInDialog()[0]?.focus({ preventScroll: true });
    });
    this.input.setAttribute('aria-expanded', 'true');
    return this;
  }

  close() {
    if (!this.isOpen) return this;
    this.isOpen = false;
    this.dialog?.removeEventListener('keydown', this._onDialogKeyDown);
    this.dialog?.remove(); this.backdrop?.remove();
    this.input.setAttribute('aria-expanded', 'false');
    this._suppressFocusOpen = true;
    queueMicrotask(() => { this._suppressFocusOpen = false; });
    this.input.focus({ preventScroll: true });
    return this;
  }

  focusableInDialog() {
    return [...this.dialog.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  }

  trapFocus(e) {
    if (e.key !== 'Tab') return;
    const items = this.focusableInDialog();
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  destroy() {
    this.close();
    this.input.replaceWith(this.input.cloneNode(true));
    document.removeEventListener('mousedown', this._onDocumentClick);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('scroll', this._onResize, true);
  }

  todayValue() { return HewargeDate.today().convert(this.calendar); }

  dateFromConfig(raw) {
    if (!raw) return null;
    try {
    } catch {}
    if (typeof raw === 'object' && raw.year != null && raw.month != null && raw.day != null) {
      try { return HewargeDate.from(this.calendar, Number(raw.year), Number(raw.month), Number(raw.day)); } catch { return null; }
    }
    return null;
  }

  bounds() {
    const today = this.todayValue();
    let min = this.dateFromConfig(this.options.minDate);
    let max = this.dateFromConfig(this.options.maxDate);
    const shift = (date, months) => date.add({ months });
    if (this.options.direction === 'past') max = max || today;
    if (this.options.direction === 'future') min = min || today;
    if (Number.isFinite(this.options.pastYears)) min = shift(today, -Math.abs(this.options.pastYears) * 12);
    if (Number.isFinite(this.options.futureYears)) max = shift(today, Math.abs(this.options.futureYears) * 12);
    if (Number.isFinite(this.options.pastMonths)) min = shift(today, -Math.abs(this.options.pastMonths));
    if (Number.isFinite(this.options.futureMonths)) max = shift(today, Math.abs(this.options.futureMonths));
    return { min, max };
  }

  isAllowed(date) {
    const { min, max } = this.bounds();
    if (min && date.isBefore(min)) return false;
    if (max && date.isAfter(max)) return false;
    return true;
  }

  canMoveMonth(delta) {
    const candidate = monthStart(this.calendar, this.view.year, this.view.month).add({ months: delta });
    const last = candidate.add({ days: candidate.daysInMonth - 1 });
    const { min, max } = this.bounds();
    if (min && last.isBefore(min)) return false;
    if (max && candidate.isAfter(max)) return false;
    return true;
  }

  applyManualDate() {
    const year = Number(this.dialog.querySelector('[data-field="year"]').value);
    const month = Number(this.dialog.querySelector('[data-field="month"]').value);
    const day = Number(this.dialog.querySelector('[data-field="day"]').value);
    try {
      const next = HewargeDate.from(this.calendar, year, month, day);
      if (!this.isAllowed(next)) { this.showMessage('ئەم بەروارە لە سنووری دیاریکراودا نییە'); return; }
      this.value = next;
      this.view = { year, month };
      this.syncInput();
      this.input.dispatchEvent(new CustomEvent('hewarge:change', { bubbles:true, detail:this.detail() }));
      this.renderDialog();
    } catch { this.showMessage('بەروارەکە دروست نییە'); }
  }

  showMessage(message) {
    const el = this.dialog.querySelector('.hw-message');
    if (el) { el.textContent = message; el.hidden = false; }
  }

  setCalendar(calendar) {
    const engine = CalendarRegistry.get(calendar);
    this.calendar = engine.id;
    this.value = this.value.convert(this.calendar);
    this.view = { year: this.value.year, month: this.value.month };
    this.input.dataset.calendar = this.calendar;
    if (this.isOpen) this.renderDialog();
    this.syncInput();
    this.dispatchChange();
    return this;
  }

  select(day) {
    try {
      const next = HewargeDate.from(this.calendar, this.view.year, this.view.month, day);
      if (!this.isAllowed(next)) return;
      this.value = next;
      this.syncInput();
      this.input.dispatchEvent(new CustomEvent('hewarge:change', { bubbles: true, detail: this.detail() }));
      if (this.options.closeOnSelect) this.close(); else this.renderDialog();
    } catch { /* invalid dates are never selectable */ }
  }

  getGregorianValue() {
    const g = this.value.toGregorian();
    return `${String(g.year).padStart(4,'0')}-${String(g.month).padStart(2,'0')}-${String(g.day).padStart(2,'0')}`;
  }

  syncInput() {
    const gregorian = this.value.toGregorian();
    const display = formatDate(this.value, this.options.format);
    const storage = formatDate(gregorian, 'YYYY-MM-DD');
    if (this.options.inputValue) this.input.value = display;
    this.input.dataset.gregorianValue = storage;
    if (this.storageInput) this.storageInput.value = storage;
    return storage;
  }

  detail() {
    const gregorian = this.value.toGregorian();
    const jalali = this.value.toJalali();
    const kurdish = this.value.toKurdish();
    const hijri = this.value.toHijri();
    const make = (calendar, value) => ({
      calendar, year: value.year, month: value.month, day: value.day,
      yearMonthDay: `${value.year}/${value.month}/${value.day}`,
      yearMonthDayPadded: `${String(value.year).padStart(4,'0')}/${String(value.month).padStart(2,'0')}/${String(value.day).padStart(2,'0')}`,
      dayMonthYear: `${value.day}/${value.month}/${value.year}`,
      dayMonthYearPadded: `${String(value.day).padStart(2,'0')}/${String(value.month).padStart(2,'0')}/${String(value.year).padStart(4,'0')}`
    });
    const g = make('gregorian', gregorian);
    const storageValue = `${gregorian.year}-${String(gregorian.month).padStart(2,'0')}-${String(gregorian.day).padStart(2,'0')}`;
    return {
      value: this.input.value,
      storageValue,
      gregorianValue: storageValue,
      calendar: this.calendar,
      selected: make(this.calendar, this.value.toObjectDate()),
      gregorian: g,
      jalali: make('jalali', jalali),
      kurdish: make('kurdish', kurdish),
      hijri: make('hijri', hijri)
    };
  }

  renderDialog() {
    // When the picker is already open, rerendering must replace the dialog
    // in-place instead of leaving the newly created dialog detached. This is
    // especially important for month/year selector changes: selecting a value
    // updates the input but must NOT close the main picker.
    const wasMounted = Boolean(this.dialog?.isConnected);

    if (this.dialog) this.dialog.remove();
    if (this.backdrop) this.backdrop.remove();
    this.backdrop = document.createElement('div'); this.backdrop.className = 'hewarge-picker-backdrop';
    this.dialog = document.createElement('div'); this.dialog.className = 'hewarge-picker-modal'; this.dialog.setAttribute('role','dialog'); this.dialog.setAttribute('aria-modal','true'); this.dialog.dir = 'rtl';
    const first = monthStart(this.calendar, this.view.year, this.view.month);
    const total = first.daysInMonth;
    const today = this.todayValue();
    const offset = ((first.dayOfWeek - this.options.weekStart) + 7) % 7;
    const cells = [];
    for (let i=0;i<offset;i++) cells.push('<span class="hw-empty" aria-hidden="true"></span>');
    for (let d=1; d<=total; d++) {
      const current = HewargeDate.from(this.calendar, this.view.year, this.view.month, d);
      const active = current.isSame(this.value), isToday = current.isSame(today), allowed = this.isAllowed(current);
      cells.push(`<button type="button" class="hw-day${active?' is-selected':''}${isToday?' is-today':''}" data-day="${d}" ${allowed?'':'disabled'} aria-label="${esc(d+' '+monthLabel(this.calendar,this.view.month)+' '+this.view.year)}"${active?' aria-current="date"':''}>${d}</button>`);
    }
    const prevAllowed = this.canMoveMonth(-1), nextAllowed = this.canMoveMonth(1);
    const selected = this.value || today;
    if (this.isMobile()) {
      this.renderWheelDialog();
      return;
    }
    this.dialog.innerHTML = `
      <div class="hw-modal-top">
        <div><span class="hw-kicker">HEWARGE DATE PICKER</span><strong>${esc(LABELS[this.calendar] || this.calendar)}</strong></div>
        <button type="button" class="hw-close" data-action="close" aria-label="داخستن">×</button>
      </div>
      <div class="hw-value"><b>${esc(formatDate(selected, this.options.format))}</b></div>
      <div class="hw-message" role="alert" hidden></div>
      <div class="hw-toolbar">
        <button type="button" class="hw-nav" data-action="prev" aria-label="مانگی پێشوو" ${prevAllowed?'':'disabled'}>‹</button>
        <div class="hw-toolbar-title">
          <button type="button" class="hw-month-selector" data-action="month-selector" aria-haspopup="listbox" aria-expanded="false">${esc(monthLabel(this.calendar,this.view.month))}<span class="hw-selector-chevron">⌄</span></button>
          <button type="button" class="hw-year-selector" data-action="year-selector" aria-haspopup="listbox" aria-expanded="false">${esc(this.view.year)}<span class="hw-selector-chevron">⌄</span></button>
          <div class="hw-selector-panel" data-selector-panel hidden></div>
        </div>
        <button type="button" class="hw-nav" data-action="next" aria-label="مانگی دواتر" ${nextAllowed?'':'disabled'}>›</button>
      </div>
      <div class="hw-week">${Array.from({length:7},(_,i)=>`<span>${esc(WEEKDAYS[(i+this.options.weekStart)%7].slice(0,2))}</span>`).join('')}</div>
      <div class="hw-days">${cells.join('')}</div>
      `;
    this.bindDialog();

    // open() mounts the initial dialog. For subsequent rerenders while open,
    // mount the new dialog immediately and restore its modal behavior.
    if (wasMounted && this.isOpen) {
      document.body.appendChild(this.dialog);
      this.dialog.addEventListener('keydown', this._onDialogKeyDown);
      requestAnimationFrame(() => {
        this.position();
        this.dialog?.classList.add('hewarge-picker-open');
      });
    }
  }

  renderWheelDialog() {
    const selected = this.value || this.todayValue();
    const { min, max } = this.bounds();
    const currentYear = selected.year;
    let minYear = min ? min.year : currentYear - 100;
    let maxYear = max ? max.year : currentYear + 100;
    if (maxYear < minYear) [minYear, maxYear] = [maxYear, minYear];
    const years = [];
    for (let y = minYear; y <= maxYear; y++) years.push(y);
    const months = Array.from({length:12}, (_,i)=>i+1);
    const daysInMonth = HewargeDate.from(this.calendar, selected.year, selected.month, 1).daysInMonth;
    const days = Array.from({length:daysInMonth}, (_,i)=>i+1);
    const item = (type, rawValue, labelValue=rawValue, active=false) => `<button type="button" class="hw-wheel-item${active?' is-active':''}" data-wheel="${type}" data-value="${esc(rawValue)}">${esc(labelValue)}</button>`;
    const monthItems = months.map(m => item('month',m,monthLabel(this.calendar,m),m===selected.month)).join('');
    const dayItems = days.map(d => item('day',d,d,d===selected.day)).join('');
    const yearItems = years.map(y => item('year',y,y,y===selected.year)).join('');
    this.dialog.innerHTML = `
      <div class="hw-modal-top">
        <div><span class="hw-kicker">HEWARGE DATE PICKER</span><strong>هەڵبژاردنی بەروار</strong></div>
        <button type="button" class="hw-close" data-action="close" aria-label="داخستن">×</button>
      </div>
      <div class="hw-wheel-summary"><b>${esc(formatDate(selected,this.options.format))}</b></div>
      <div class="hw-wheel" dir="rtl">
        <div class="hw-wheel-column" data-wheel-column="year"><div class="hw-wheel-fade top"></div><div class="hw-wheel-list">${yearItems}</div><div class="hw-wheel-fade bottom"></div></div>
        <div class="hw-wheel-column" data-wheel-column="month"><div class="hw-wheel-fade top"></div><div class="hw-wheel-list">${months.map(m=>item('month',m,monthLabel(this.calendar,m),m===selected.month)).join('')}</div><div class="hw-wheel-fade bottom"></div></div>
        <div class="hw-wheel-column" data-wheel-column="day"><div class="hw-wheel-fade top"></div><div class="hw-wheel-list">${dayItems}</div><div class="hw-wheel-fade bottom"></div></div>
        <div class="hw-wheel-selection" aria-hidden="true"></div>
      </div>
      <div class="hw-message" role="alert" hidden></div>
      <div class="hw-footer hw-wheel-footer">
        <div class="hw-calendar-switch">${CalendarRegistry.list().map(id=>`<button type="button" class="hw-cal ${id===this.calendar?'active':''}" data-calendar="${id}">${esc(LABELS[id]||id)}</button>`).join('')}</div>
        <div class="hw-actions">${this.options.clearable?'<button type="button" class="hw-text" data-action="clear">پاککردن</button>':''}${this.options.todayButton?'<button type="button" class="hw-today" data-action="today">ئەمڕۆ</button>':''}<button type="button" class="hw-confirm" data-action="confirm-wheel">تەواو</button></div>
      </div>`;
    this.bindWheelDialog(selected);
  }

  bindWheelDialog(selected) {
    this.dialog.querySelector('[data-action="close"]').addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => this.close());
    this.dialog.querySelector('[data-action="today"]')?.addEventListener('click', () => {
      const today = this.todayValue();
      if (!this.isAllowed(today)) return;
      this.value = today;
      this.view = { year: today.year, month: today.month };
      this.syncInput();
      this.dispatchChange();
      this.renderWheelDialog();
      this.dialog.classList.add('hewarge-picker-open');
    });
    this.dialog.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
      this.input.value = '';
      if (this.storageInput) this.storageInput.value = '';
      this.input.dataset.gregorianValue = '';
      this.input.dispatchEvent(new CustomEvent('hewarge:clear', { bubbles:true, detail:{calendar:this.calendar} }));
      this.renderWheelDialog();
      this.dialog.classList.add('hewarge-picker-open');
    });
    this.dialog.querySelector('[data-action="confirm-wheel"]').addEventListener('click', () => {
      // The wheel is an editing surface: all wheel changes are reflected in
      // the picker state immediately, while this button commits the current
      // value to the input and closes the mobile picker.
      this.syncInput();
      this.dispatchChange();
      this.close();
    });
    this.dialog.querySelectorAll('[data-calendar]').forEach(b => b.addEventListener('click', () => this.setCalendar(b.dataset.calendar)));

    for (const type of ['year','month','day']) {
      this.bindWheelColumn(type);
    }
    requestAnimationFrame(() => this.centerWheelSelection(selected));
  }

  bindWheelColumn(type) {
    const column = this.dialog?.querySelector(`[data-wheel-column="${type}"]`);
    const list = column?.querySelector('.hw-wheel-list');
    if (!list) return;

    const snapToIndex = (index, behavior = 'smooth') => {
      const items = [...list.querySelectorAll('.hw-wheel-item')];
      if (!items.length) return;
      const nextIndex = Math.max(0, Math.min(items.length - 1, index));
      const item = items[nextIndex];
      const target = item.offsetTop - list.clientHeight / 2 + item.offsetHeight / 2;
      list.scrollTo({ top: target, behavior });
    };

    list.addEventListener('wheel', (event) => {
      if (event.currentTarget !== list || Math.abs(event.deltaY) < 1) return;
      event.preventDefault();
      event.stopPropagation();
      const items = [...list.querySelectorAll('.hw-wheel-item')];
      if (!items.length) return;
      const center = list.scrollTop + list.clientHeight / 2;
      let nearest = 0;
      let distance = Infinity;
      items.forEach((item, index) => {
        const c = item.offsetTop + item.offsetHeight / 2;
        const d = Math.abs(c - center);
        if (d < distance) { distance = d; nearest = index; }
      });
      snapToIndex(nearest + (event.deltaY > 0 ? 1 : -1));
    }, { passive:false });

    list.addEventListener('scroll', () => {
      clearTimeout(list._hwTimer);
      list._hwTimer = setTimeout(() => this.onWheelScroll(type, list), 90);
    }, { passive:true });

    list.querySelectorAll('.hw-wheel-item').forEach(btn => btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const items = [...list.querySelectorAll('.hw-wheel-item')];
      snapToIndex(items.indexOf(btn));
    }));
  }

  dispatchChange() {
    this.input.dispatchEvent(new CustomEvent('hewarge:change', {
      bubbles: true,
      detail: this.detail()
    }));
  }

  centerWheelSelection(selected = this.value) {
    for (const type of ['year','month','day']) {
      const list = this.dialog.querySelector(`[data-wheel-column="${type}"] .hw-wheel-list`);
      if (!list) continue;
      const value = type === 'year' ? selected.year : type === 'month' ? selected.month : selected.day;
      const btn = [...list.querySelectorAll('.hw-wheel-item')].find(x => Number(x.dataset.value) === value);
      if (!btn) continue;
      const target = btn.offsetTop - list.clientHeight / 2 + btn.offsetHeight / 2;
      list.scrollTop = target;
      this.markWheelActive(type, btn);
    }
  }

  markWheelActive(type, activeButton) {
    const list = activeButton?.closest('.hw-wheel-list');
    if (!list) return;
    list.querySelectorAll('.hw-wheel-item.is-active').forEach(item => item.classList.remove('is-active'));
    activeButton.classList.add('is-active');
  }

  onWheelScroll(type, list) {
    if (!list || !list.isConnected || !this.dialog?.contains(list)) return;
    const center = list.scrollTop + list.clientHeight / 2;
    let best = null;
    let distance = Infinity;
    list.querySelectorAll('.hw-wheel-item').forEach(btn => {
      const c = btn.offsetTop + btn.offsetHeight / 2;
      const d = Math.abs(c - center);
      if (d < distance) { distance = d; best = btn; }
    });
    if (!best) return;

    const target = best.offsetTop - list.clientHeight / 2 + best.offsetHeight / 2;
    if (Math.abs(target - list.scrollTop) > 1) {
      list.scrollTo({ top: target, behavior: 'smooth' });
      return;
    }

    this.markWheelActive(type, best);
    this.updateWheelPart(type, Number(best.dataset.value), true);
  }

  updateWheelPart(type, value, fromScroll = false) {
    let year = this.value.year;
    let month = this.value.month;
    let day = this.value.day;
    if (type === 'year') year = value;
    if (type === 'month') month = value;
    if (type === 'day') day = value;

    try {
      const daysInMonth = HewargeDate.from(this.calendar, year, month, 1).daysInMonth;
      day = Math.min(day, daysInMonth);
      const candidate = HewargeDate.from(this.calendar, year, month, day);
      if (!this.isAllowed(candidate)) return;

      this.value = candidate;
      this.view = { year, month };
      this.syncInput();
      this.dispatchChange();

      if (fromScroll && (type === 'year' || type === 'month')) {
        this.refreshWheelDays();
      }
      this.markCurrentWheelValues();
    } catch {}
  }

  refreshWheelDays() {
    const column = this.dialog?.querySelector('[data-wheel-column="day"]');
    const list = column?.querySelector('.hw-wheel-list');
    if (!list) return;
    const daysInMonth = HewargeDate.from(this.calendar, this.value.year, this.value.month, 1).daysInMonth;
    const html = Array.from({length:daysInMonth}, (_,i) => {
      const day = i + 1;
      return `<button type="button" class="hw-wheel-item${day === this.value.day ? ' is-active' : ''}" data-wheel="day" data-value="${day}">${day}</button>`;
    }).join('');
    list.innerHTML = html;
    this.bindWheelColumn('day');
    requestAnimationFrame(() => {
      const active = [...list.querySelectorAll('.hw-wheel-item')].find(x => Number(x.dataset.value) === this.value.day);
      if (active) {
        list.scrollTop = active.offsetTop - list.clientHeight / 2 + active.offsetHeight / 2;
        this.markWheelActive('day', active);
      }
    });
  }

  markCurrentWheelValues() {
    const selected = this.value;
    for (const type of ['year','month','day']) {
      const list = this.dialog.querySelector(`[data-wheel-column="${type}"] .hw-wheel-list`);
      if (!list) continue;
      const value = type === 'year' ? selected.year : type === 'month' ? selected.month : selected.day;
      const active = [...list.querySelectorAll('.hw-wheel-item')].find(x => Number(x.dataset.value) === value);
      if (active) this.markWheelActive(type, active);
    }
  }

  renderDesktopSelector(type) {
    const panel = this.dialog.querySelector('[data-selector-panel]');
    if (!panel) return;
    const isMonth = type === 'month';
    const { min, max } = this.bounds();
    const items = [];

    if (isMonth) {
      for (let month = 1; month <= 12; month++) {
        const candidateStart = monthStart(this.calendar, this.view.year, month);
        const candidateEnd = candidateStart.add({ days: candidateStart.daysInMonth - 1 });
        const allowed = !(min && candidateEnd.isBefore(min)) && !(max && candidateStart.isAfter(max));
        items.push(`<button type="button" class="hw-selector-item${month === this.view.month ? ' is-active' : ''}" data-selector-month="${month}" ${allowed ? '' : 'disabled'}>${esc(monthLabel(this.calendar, month))}</button>`);
      }
    } else {
      let minYear = min ? min.year : this.view.year - 100;
      let maxYear = max ? max.year : this.view.year + 100;
      if (maxYear < minYear) [minYear, maxYear] = [maxYear, minYear];
      for (let year = minYear; year <= maxYear; year++) {
        const start = monthStart(this.calendar, year, 1);
        const end = monthStart(this.calendar, year, 12).add({ days: monthStart(this.calendar, year, 12).daysInMonth - 1 });
        const allowed = !(min && end.isBefore(min)) && !(max && start.isAfter(max));
        items.push(`<button type="button" class="hw-selector-item${year === this.view.year ? ' is-active' : ''}" data-selector-year="${year}" ${allowed ? '' : 'disabled'}>${esc(year)}</button>`);
      }
    }

    panel.innerHTML = `<div class="hw-selector-header"><strong>${isMonth ? 'هەڵبژاردنی مانگ' : 'هەڵبژاردنی ساڵ'}</strong><button type="button" class="hw-selector-close" data-action="close-selector" aria-label="داخستن">×</button></div><div class="hw-selector-list">${items.join('')}</div>`;
    panel.hidden = false;
    panel.dataset.open = type;
    this.dialog.querySelector('[data-action="month-selector"]').setAttribute('aria-expanded', String(isMonth));
    this.dialog.querySelector('[data-action="year-selector"]').setAttribute('aria-expanded', String(!isMonth));

    panel.querySelector('[data-action="close-selector"]').addEventListener('click', () => this.closeDesktopSelector());
    panel.querySelectorAll('[data-selector-month]').forEach(button => button.addEventListener('click', () => {
      const month = Number(button.dataset.selectorMonth);
      this.view.month = month;
      const days = monthStart(this.calendar, this.view.year, month).daysInMonth;
      const day = Math.min(this.value.day, days);
      try {
        const next = HewargeDate.from(this.calendar, this.view.year, month, day);
        if (!this.isAllowed(next)) return;
        this.value = next;
        this.syncInput();
        this.input.dispatchEvent(new CustomEvent('hewarge:change', { bubbles:true, detail:this.detail() }));
      } catch { return; }
      this.closeDesktopSelector();
      this.renderDialog();
    }));
    panel.querySelectorAll('[data-selector-year]').forEach(button => button.addEventListener('click', () => {
      const year = Number(button.dataset.selectorYear);
      this.view.year = year;
      const days = monthStart(this.calendar, year, this.view.month).daysInMonth;
      const day = Math.min(this.value.day, days);
      try {
        const next = HewargeDate.from(this.calendar, year, this.view.month, day);
        if (!this.isAllowed(next)) return;
        this.value = next;
        this.syncInput();
        this.input.dispatchEvent(new CustomEvent('hewarge:change', { bubbles:true, detail:this.detail() }));
      } catch { return; }
      this.closeDesktopSelector();
      this.renderDialog();
    }));

    requestAnimationFrame(() => {
      const active = panel.querySelector('.hw-selector-item.is-active');
      active?.scrollIntoView({ block: 'center' });
    });
  }

  closeDesktopSelector() {
    const panel = this.dialog?.querySelector('[data-selector-panel]');
    if (!panel) return;
    panel.hidden = true;
    delete panel.dataset.open;
    this.dialog.querySelector('[data-action="month-selector"]')?.setAttribute('aria-expanded', 'false');
    this.dialog.querySelector('[data-action="year-selector"]')?.setAttribute('aria-expanded', 'false');
  }

  bindDialog() {
    this.dialog.querySelectorAll('[data-day]:not([disabled])').forEach(b => b.addEventListener('click', () => this.select(Number(b.dataset.day))));
    this.dialog.querySelector('[data-action="close"]').addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => this.close());
    this.dialog.querySelector('[data-action="prev"]').addEventListener('click', () => { if (!this.canMoveMonth(-1)) return; this.view=shiftMonth(this.calendar,this.view.year,this.view.month,-1); this.renderDialog(); });
    this.dialog.querySelector('[data-action="next"]').addEventListener('click', () => { if (!this.canMoveMonth(1)) return; this.view=shiftMonth(this.calendar,this.view.year,this.view.month,1); this.renderDialog(); });
    this.dialog.querySelector('[data-action="month-selector"]').addEventListener('click', () => {
      const panel = this.dialog.querySelector('[data-selector-panel]');
      if (panel?.dataset.open === 'month') this.closeDesktopSelector();
      else this.renderDesktopSelector('month');
    });
    this.dialog.querySelector('[data-action="year-selector"]').addEventListener('click', () => {
      const panel = this.dialog.querySelector('[data-selector-panel]');
      if (panel?.dataset.open === 'year') this.closeDesktopSelector();
      else this.renderDesktopSelector('year');
    });
    this.dialog.querySelector('[data-action="today"]')?.addEventListener('click', () => {
      const today=this.todayValue();
      if(!this.isAllowed(today)) return;
      this.value=today;
      this.view={year:today.year,month:today.month};
      this.syncInput();
      this.dispatchChange();
      this.renderDialog();
    });
    this.dialog.querySelector('[data-action="apply-date"]')?.addEventListener('click', () => this.applyManualDate());
    this.dialog.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
      this.input.value='';
      if(this.storageInput) this.storageInput.value='';
      this.input.dataset.gregorianValue='';
      this.input.dispatchEvent(new CustomEvent('hewarge:clear',{bubbles:true,detail:{calendar:this.calendar}}));
      this.renderDialog();
    });
    this.dialog.querySelectorAll('[data-calendar]').forEach(b => b.addEventListener('click', () => this.setCalendar(b.dataset.calendar)));
  }

  onKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') { if (!this.isOpen) this.open(); e.preventDefault(); }
    if (!this.isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); this.close(); }
    if (e.key === 'PageUp') { e.preventDefault(); const x=shiftMonth(this.calendar,this.view.year,this.view.month,e.shiftKey?-12:-1); this.view=x; this.renderDialog(); }
    if (e.key === 'PageDown') { e.preventDefault(); const x=shiftMonth(this.calendar,this.view.year,this.view.month,e.shiftKey?12:1); this.view=x; this.renderDialog(); }
  }

  position() {
    if (!this.dialog || !this.isOpen) return;
    if (this.isMobile()) { this.dialog.style.left=''; this.dialog.style.top=''; this.dialog.style.width=''; return; }
    const r=this.input.getBoundingClientRect(), gap=10, width=Math.min(330,window.innerWidth-24);
    this.dialog.style.width=`${width}px`;
    let left=Math.max(12, Math.min(r.left, window.innerWidth-width-12));
    let top=r.bottom+gap;
    const h=this.dialog.offsetHeight;
    if (top+h>window.innerHeight-12 && r.top-h-gap>12) top=r.top-h-gap;
    this.dialog.style.left=`${left}px`; this.dialog.style.top=`${top}px`;
  }
}

export function createDatePicker(input, options={}) { return new HewargeDatePicker(input, options); }
function numberData(input, name, fallback=null) { const v=input.dataset[name]; return v == null || v === '' ? fallback : Number(v); }
function optionsFromInput(input, options) {
  const o={ ...options, calendar: input.dataset.calendar || options.calendar || DEFAULTS.calendar, format: input.dataset.format || options.format || DEFAULTS.format, gregorianFormat: input.dataset.gregorianFormat || options.gregorianFormat || DEFAULTS.gregorianFormat };
  if (input.dataset.direction) o.direction=input.dataset.direction;
  if (input.dataset.weekStart != null && input.dataset.weekStart !== '') { const n=Number(input.dataset.weekStart); if(Number.isFinite(n)) o.weekStart=n; }
  for (const key of ['pastYears','futureYears','pastMonths','futureMonths']) { const n=numberData(input,key,null); if(n!==null && Number.isFinite(n)) o[key]=n; }
  if (input.dataset.minDate) { const p=parseDate(input.dataset.minDate,o.format); if(p) o.minDate=p; }
  if (input.dataset.maxDate) { const p=parseDate(input.dataset.maxDate,o.format); if(p) o.maxDate=p; }
  return o;
}
export function attachDatePickers(root=document, options={}) {
  installStyles();
  const selector = options.selector || 'input[data-hewarge-datepicker], input.hewarge-date-input';
  return [...root.querySelectorAll(selector)].map(input => createDatePicker(input, optionsFromInput(input, options)));
}
export const datePicker = { create: createDatePicker, attach: attachDatePickers, HewargeDatePicker };
