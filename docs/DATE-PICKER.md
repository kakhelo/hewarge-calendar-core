# Hewarge Modal Date Picker API

## Time picker and combined date-time

The same package also provides an embeddable time picker with compact, responsive scroll-wheel columns like the date picker, all 60 minute values, 12/24-hour display, optional seconds, and a programmer-configured IANA timezone. Users cannot change the timezone in the picker. `Asia/Kurdstan` is supported as an alias for `Asia/Baghdad`.

```html
<input id="appointmentDate" type="text" autocomplete="off">
<input id="appointmentTime" type="text" autocomplete="off">
```

```js
import { createDateTimePicker } from '@hewarge/calendar-core/picker';
import '@hewarge/calendar-core/picker/css';

const appointment = createDateTimePicker(
  document.querySelector('#appointmentDate'),
  document.querySelector('#appointmentTime'),
  {
    calendar: 'kurdish',
    date: { format: 'YYYY/MM/DD' },
    time: { format: '12', timeZone: 'Asia/Kurdstan', showSeconds: false }
  }
);

document.querySelector('#appointmentTime').addEventListener('hewarge:datetimechange', event => {
  console.log(event.detail.dateTime); // calendar date and 24-hour time fields
  console.log(event.detail.timeZone);
  console.log(event.detail.timestamp); // epoch milliseconds, or null for a DST gap
});
```

Use the independent time-only API when no calendar date is required:

```js
import { createTimePicker } from '@hewarge/calendar-core/picker';

const clock = createTimePicker(document.querySelector('#time'), {
  format: '24', // or '12'
  timeZone: 'Europe/London',
  showSeconds: false
});

const analogClock = createTimePicker(document.querySelector('#analog-time'), {
  variant: 'analog-clock',
  format: '12',
  timeZone: 'Europe/London'
});

const iosWheel = createTimePicker(document.querySelector('#ios-time'), {
  variant: 'ios-wheel',
  format: '12',
  timeZone: 'Europe/London'
});
```

The time picker supports `variant: 'default'` (the existing wheel interface), `variant: 'analog-clock'` (analog dial), and `variant: 'ios-wheel'` (center-highlighted scroll wheels with Cancel and Apply). Variants are selected per instance and support light/dark color schemes. For a combined picker, use `date: { variant: 'calendar-glass' }` and `time: { variant: 'ios-wheel' }`, or set top-level `variant: 'calendar-glass'` with `timeVariant: 'ios-wheel'`. The input and change events update only after Apply/OK.

On opening, the picker shows the current time in its configured timezone if the input is empty. In the default variant, **Current time** resets the wheel and **Exit** commits. The analog variant uses **Cancel** and **OK**. Both fire `hewarge:timechange` (and `hewarge:change`) after confirmation. The composed date-time picker also fires `hewarge:datetimechange`, whose detail includes `dateTime`, `timeZone`, and a millisecond `timestamp`. Any runtime-supported IANA timezone may be configured by the developer; the UI has no timezone selector. `Asia/Kurdstan` is normalized to `Asia/Baghdad`. Nonexistent wall-clock times during a daylight-saving transition are reported through `validationError` and have a `null` timestamp.

Available helpers include `formatTime({hour, minute, second}, '12' | '24')` and `parseTime(text, '12' | '24')`. Use `appointment.setTimeZone('Asia/Tehran')` to update the composed picker's timezone, and `appointment.destroy()` to clean up both controls.

## Design goal

The date picker is an embeddable component. It is not a standalone page. A developer attaches it to an existing HTML input; focusing or clicking that input opens a modal date picker.

## Custom and native interfaces

The calendar logic can also be used without the bundled DOM interface. Create one controller per field or UI instance; each controller owns its calendar, value, range and visible month, so different interfaces can coexist on the same page. This API does not access `document`, `window` or an HTML input and can be bridged to a native app or a framework-specific component.

```js
import { createDatePickerController } from '@hewarge/calendar-core/picker';

const model = createDatePickerController({
  calendar: 'kurdish',
  format: 'DD/MM/YYYY',
  minDate: { year: 2726, month: 1, day: 1 },
  maxDate: { year: 2726, month: 12, day: 29 }
});

function render(state) {
  // Render state.monthLabel, state.weekdays and state.days in your own UI.
  // Each day includes selected, today and allowed flags.
  console.log(state.formattedValue, state.gregorianValue, state.days);
}

render(model.getState());
const unsubscribe = model.subscribe(({ state }) => render(state));

model.navigate(1);       // next month, if in range
model.select(16);         // select day 16 in the visible month
model.setCalendar('jalali');
model.goToToday();
model.clear();
unsubscribe();
```

The controller API includes `getState()`, `subscribe()`, `setDate()`, `setView()`, `navigate()`, `select()`, `setCalendar()`, `goToToday()`, `clear()`, `isAllowed()` and `canMoveMonth()`. Change notifications contain `{ type, state }`; view-only navigation uses `type: 'view'`, date changes use `type: 'change'`, and clearing uses `type: 'clear'`. `state.gregorianValue` is the canonical Gregorian `YYYY-MM-DD` value, or `null` when cleared.

The existing `createDatePicker(input, options)` remains the default ready-made interface and is unchanged. The controller is the custom/native interface foundation. Once additional visual designs are provided, they can be registered as independent per-instance UI adapters without changing this calendar API.

## Installation

```bash
npm install @hewarge/calendar-core
```

Then import the picker and its CSS:

```js
import { createDatePicker } from '@hewarge/calendar-core/picker';
import '@hewarge/calendar-core/picker/css';
```

## Basic usage

```html
<input id="date" type="text" autocomplete="off">
```

```js
const picker = createDatePicker(document.querySelector('#date'), {
  calendar: 'kurdish',
  format: 'YYYY/MM/DD'
});
```

Supported calendars are `kurdish` (the legacy 2726-based calendar), `kurdish-zayni` (Gregorian date arithmetic with Kurdish month names), `gregorian` (Gregorian arithmetic with English month names), `jalali`, and `hijri`.

The picker automatically chooses its interface language and text direction from the active calendar. Kurdish and Kurdish Zayni use Kurdish text and RTL layout; Jalali uses Persian and RTL; Hijri uses Arabic and RTL; Gregorian uses English and LTR. Month and weekday names, picker headings, today/confirm/close controls, navigation labels, month/year selector headings, validation messages, and labels/placeholders in the bundled demo follow that language. The `locale` option remains available for compatibility; calendar-based localization is automatic.

## Empty input behavior

If the input is empty when opened, the picker uses today's date as its initial view. This means the user sees the current month/year immediately instead of an arbitrary month.

## Today action

The built-in Today button is localized to the selected calendar (for example, `ئەمڕۆ` for Kurdish, `امروز` for Jalali, `اليوم` for Hijri, and `Today` for Gregorian).

In Kurdish mode, the button is rendered as:

```html
<button type="button" class="hw-today" data-action="today">ئەمڕۆ</button>
```

When clicked, it:

1. resolves today's date in the configured calendar,
2. checks the configured boundaries,
3. writes the date to the input,
4. dispatches `hewarge:change`,
5. closes the modal.

If the configured range does not allow today, the action does not select it.

## Manual date input

The modal provides editable year, month and day fields. The developer does not need to implement this UI separately.

```text
Year / Month / Day → Apply
```

The entered date is validated by the calendar core and by the configured min/max range before it is accepted.

## Restricting an input to past dates

```js
createDatePicker(input, {
  calendar: 'kurdish',
  direction: 'past',
  pastMonths: 6
});
```

This permits dates from the configured past range through today.

## Restricting an input to future dates

```js
createDatePicker(input, {
  calendar: 'kurdish',
  direction: 'future',
  futureYears: 1
});
```

This permits today through the configured future range.

## Explicit range

```js
createDatePicker(input, {
  calendar: 'kurdish',
  minDate: { year: 2726, month: 1, day: 1 },
  maxDate: { year: 2726, month: 12, day: 29 }
});
```

Use explicit boundaries when the business rule is not relative to today.

## Multiple inputs

Each input can have independent settings:

```js
createDatePicker(birthDate, {
  calendar: 'kurdish',
  direction: 'past'
});

createDatePicker(appointmentDate, {
  calendar: 'kurdish',
  direction: 'future',
  futureMonths: 3
});
```

## Built-in calendar-card interface

Choose the orange calendar-card design from the attached reference with `variant: 'calendar-card'`. The choice belongs to the individual picker instance, so the existing default interface and the card interface can be mixed on a page. In this variant, clicking a day changes the draft selection; the input and `hewarge:change` event update only after **Confirm**.

```js
const compactCard = createDatePicker(document.querySelector('#date-card'), {
  calendar: 'gregorian',
  format: 'MM/DD/YYYY',
  variant: 'calendar-card'
});

const existingDesign = createDatePicker(document.querySelector('#date-default'), {
  calendar: 'kurdish',
  variant: 'default'
});
```

On small screens, `calendar-card` switches to the date wheel, styled to match the orange card design, with a Done action to confirm the draft. Set `mobileMode: 'calendar'` to keep the calendar grid on mobile. The wheel/card styling adapts to light and dark color schemes. `data-variant="calendar-card"` (or `data-ui="calendar-card"`) is also supported by `attachDatePickers()`.

## Built-in glass calendar interface

The third visual variant is `calendar-glass`, based on the dark glass calendar reference. It has a month header with previous/next navigation, Monday-first weekday headings, a purple selected date, and month/year selectors. On mobile it automatically switches to a matching scroll-wheel date selector with a draft selection and Done action. Both desktop and mobile layouts adapt to light and dark themes.

```js
const glassDate = createDatePicker(document.querySelector('#glass-date'), {
  calendar: 'gregorian',
  format: 'MMM YYYY',
  variant: 'calendar-glass'
});

const glassDateTime = createDateTimePicker(dateInput, timeInput, {
  calendar: 'gregorian',
  date: { variant: 'calendar-glass' },
  time: { variant: 'ios-wheel', format: '12' }
});
```

The `ios-wheel` time interface supports 12/24-hour formatting, optional seconds, AM/PM, keyboard entry, and Cancel/Apply. It can be used on desktop and mobile; `data-time-variant="ios-wheel"` is supported by `attachTimePickers()`.

## Auto-attach API

```html
<input data-hewarge-datepicker data-calendar="kurdish">
<input data-hewarge-datepicker data-calendar="gregorian">
```

```js
import { attachDatePickers } from '@hewarge/calendar-core/picker';
import '@hewarge/calendar-core/picker/css';

const instances = attachDatePickers(document);
```

You can override the selector when needed:

```js
attachDatePickers(document, {
  selector: '.my-date-input',
  calendar: 'kurdish'
});
```

## Lifecycle

```js
const picker = createDatePicker(input);

picker.open();
picker.close();
picker.setCalendar('gregorian');
picker.select(15);
picker.destroy();
```

## Events

`hewarge:change` detail:

```js
{
  calendar: 'kurdish',
  value: DateValue,
  date: { calendar: 'kurdish', year, month, day },
  gregorian: { year, month, day },
  jalali: { year, month, day },
  kurdish: { year, month, day },
  kurdishZayni: { year, month, day },
  hijri: { year, month, day }
}
```

`hewarge:clear` detail:

```js
{
  calendar: 'kurdish'
}
```

## Dismissal and mobile behavior

The modal closes through:

- close button,
- backdrop click,
- Escape,
- successful selection when `closeOnSelect` is enabled,
- Today action,
- Clear action.

On small screens the picker switches to a bottom-sheet layout and accounts for safe-area insets.

## Accessibility behavior

The picker uses:

- `role="dialog"`,
- `aria-modal="true"`,
- `aria-haspopup="dialog"` on the input,
- `aria-expanded` while open,
- keyboard focus trapping inside the dialog,
- Escape handling,
- disabled states for dates outside the allowed range.

### Week start

The picker starts weeks on **Saturday by default** (`weekStart: 6`). Developers can configure the first weekday with a zero-based index:

```js
createDatePicker(input, {
  weekStart: 6 // Saturday (default)
});
```

Supported indexes:

- `0` Sunday
- `1` Monday
- `2` Tuesday
- `3` Wednesday
- `4` Thursday
- `5` Friday
- `6` Saturday

The same setting can be supplied on an input with `data-week-start="6"`.
