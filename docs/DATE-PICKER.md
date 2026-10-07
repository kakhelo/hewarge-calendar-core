# Hewarge Modal Date Picker API

## Design goal

The date picker is an embeddable component. It is not a standalone page. A developer attaches it to an existing HTML input; focusing or clicking that input opens a modal date picker.

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

## Empty input behavior

If the input is empty when opened, the picker uses today's date as its initial view. This means the user sees the current month/year immediately instead of an arbitrary month.

## Today action

The built-in button is rendered as:

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
