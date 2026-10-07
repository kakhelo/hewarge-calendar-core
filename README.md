<<<<<<< HEAD
# @hewarge/calendar-core

A framework-free multi-calendar date engine with an embeddable RTL modal date picker.

Hewarge is designed to be used as a **library**, not as a standalone date-picker page. You connect it to one or more `<input>` elements and the picker opens as a modal when the user focuses or clicks an input.

## Features

- Gregorian, Jalali, Kurdish and Hijri calendar support
- Calendar conversion through a shared JDN-based core
- Immutable `DateValue` API
- Date arithmetic and comparisons
- Framework-free modal date picker
- RTL Kurdish-first UI
- Empty inputs open on today's date
- Manual year/month/day editing
- Today button writes today's date and closes the modal
- Per-input past/future date restrictions
- Explicit `minDate` / `maxDate` boundaries
- Responsive desktop modal and mobile bottom-sheet behavior
- Backdrop, close button and Escape dismissal
- Keyboard focus trapping
- No runtime dependencies
- Node built-in test runner; Vitest is not required

## Requirements

- Node.js 18+ for the package development/test environment
- A modern browser for the date-picker UI

The published package has no runtime npm dependencies.

## Install

```bash
npm install @hewarge/calendar-core
```

## Quick start: Date Picker

HTML:

```html
<input
  id="birthDate"
  type="text"
  placeholder="بەروار هەڵبژێرە"
  autocomplete="off"
>
```

JavaScript:

```js
import { createDatePicker } from '@hewarge/calendar-core/picker';
import '@hewarge/calendar-core/picker/css';

const input = document.querySelector('#birthDate');

const picker = createDatePicker(input, {
  calendar: 'kurdish',
  format: 'YYYY/MM/DD'
});

input.addEventListener('hewarge:change', (event) => {
  console.log(event.detail.date);
  console.log(event.detail.gregorian);
});
```

The picker is attached to the input. It does **not** navigate to another page.

## Auto-attach multiple inputs

```html
<input
  data-hewarge-datepicker
  data-calendar="kurdish"
  data-format="YYYY/MM/DD"
>

<input
  data-hewarge-datepicker
  data-calendar="gregorian"
  data-format="YYYY-MM-DD"
>
```

```js
import { attachDatePickers } from '@hewarge/calendar-core/picker';
import '@hewarge/calendar-core/picker/css';

attachDatePickers(document);
```

## Date restrictions

Each input can have its own allowed range.

### Only past dates

```js
createDatePicker(input, {
  calendar: 'kurdish',
  direction: 'past',
  pastMonths: 6
});
```

### Only future dates

```js
createDatePicker(input, {
  calendar: 'kurdish',
  direction: 'future',
  futureYears: 2
});
```

### Exact boundaries

```js
createDatePicker(input, {
  calendar: 'kurdish',
  minDate: { year: 2726, month: 1, day: 1 },
  maxDate: { year: 2727, month: 12, day: 29 }
});
```

`direction` accepts `both`, `past`, or `future`.

## Date Picker options

| Option | Type | Default | Description |
|---|---|---:|---|
| `calendar` | string | `kurdish` | Calendar used by the input/picker |
| `locale` | string | `ku` | UI locale identifier |
| `format` | string | `YYYY/MM/DD` | Input display format |
| `weekStart` | number | `6` | First weekday index: `0`=Sunday … `6`=Saturday |
| `closeOnSelect` | boolean | `true` | Close after selecting a day |
| `clearable` | boolean | `true` | Show Clear action |
| `todayButton` | boolean | `true` | Show Today action |
| `keyboard` | boolean | `true` | Enable input keyboard handling |
| `inputValue` | boolean | `true` | Write selected value into the input |
| `direction` | `both \| past \| future` | `both` | Allowed side of today |
| `pastYears` | number \| null | `null` | Past range in years |
| `futureYears` | number \| null | `null` | Future range in years |
| `pastMonths` | number \| null | `null` | Past range in months |
| `futureMonths` | number \| null | `null` | Future range in months |
| `minDate` | object \| null | `null` | Explicit minimum `{year,month,day}` |
| `maxDate` | object \| null | `null` | Explicit maximum `{year,month,day}` |

Explicit `minDate` and `maxDate` are interpreted in the configured calendar.

## HTML data attributes

The auto-attach API maps options to `data-*` attributes. For example:

```html
<input
  data-hewarge-datepicker
  data-calendar="kurdish"
  data-format="YYYY/MM/DD"
  data-direction="future"
  data-future-years="1"
>
```

## Events

### `hewarge:change`

Fired after a valid date is selected or the Today action is used.

```js
input.addEventListener('hewarge:change', (event) => {
  const detail = event.detail;

  console.log(detail.calendar);
  console.log(detail.date);
  console.log(detail.gregorian);
  console.log(detail.jalali);
  console.log(detail.kurdish);
  console.log(detail.hijri);
});
```

### `hewarge:clear`

Fired when the user clears the input.

```js
input.addEventListener('hewarge:clear', (event) => {
  console.log(event.detail.calendar);
});
```

## Date Core API

```js
import { HewargeDate } from '@hewarge/calendar-core';

const date = HewargeDate.fromGregorian(2026, 9, 7);

console.log(date.toKurdish());
// { year: 2726, month: 6, day: 16 }

console.log(date.toJalali());
// { year: 1405, month: 6, day: 16 }
```

### Create dates

```js
HewargeDate.from('kurdish', 2726, 6, 16);
HewargeDate.fromGregorian(2026, 9, 7);
HewargeDate.fromJalali(1405, 6, 16);
HewargeDate.fromKurdish(2726, 6, 16);
HewargeDate.fromHijri(1448, 3, 24);
HewargeDate.today();
```

### Convert

```js
const date = HewargeDate.fromGregorian(2026, 9, 7);

const kurdish = date.convert('kurdish');
const jalali = date.convert('jalali');
const hijri = date.convert('hijri');
```

### Date operations

All operations return a new immutable date value.

```js
date.add({ days: 10 });
date.add({ weeks: 2 });
date.add({ months: 1 });
date.add({ years: 1 });
date.subtract({ days: 3 });

date.isBefore(other);
date.isAfter(other);
date.isSame(other);
date.equals(other);

date.startOf('month');
date.endOf('month');
date.startOf('year');
date.endOf('year');
```

### Date metadata

```js
date.dayOfWeek;
date.dayOfYear;
date.daysInMonth;
date.isLeapYear;
date.toJdn();
```

## Calendar IDs

```text
kurdish
gregorian
jalali
hijri
```

## Package exports

```text
@hewarge/calendar-core
@hewarge/calendar-core/picker
@hewarge/calendar-core/picker/css
```

The core export contains the calendar/date API. The picker export contains the embeddable modal UI API. The CSS export contains the picker styles.

## Testing

This project uses Node's built-in test runner, so Vitest is not required to run the package tests.

```bash
npm test
```

## Local demo

```bash
npm run dev
```

Then open:

```text
http://localhost:5177
```

## Publishing

Before the first publish:

```bash
npm login
npm whoami
npm pack --dry-run
npm publish --access public
```

`@hewarge/calendar-core` is a scoped package. Scoped public packages need `--access public` on their initial direct publish. See `docs/PUBLISHING.md` for the complete checklist.

## License

MIT

## Database-safe Gregorian output

The Date Picker separates **display value** from **storage value**. The selected calendar controls what the user sees in the visible input, while the canonical value exposed to the application is always Gregorian `YYYY-MM-DD`.

For example, with the Kurdish calendar:

```text
Visible input: 16/6/2726
Storage/API:   2026-09-07
```

The change event exposes both values:

```js
input.addEventListener('hewarge:change', (event) => {
  console.log(event.detail.value);        // 16/6/2726
  console.log(event.detail.storageValue);  // 2026-09-07
  console.log(event.detail.gregorianValue); // 2026-09-07
  console.log(event.detail.kurdish.year);  // 2726
});
```

For direct form submission, use a hidden storage input:

```html
<input id="birth-display" data-hewarge-datepicker name="birth_display">
<input id="birth-storage" type="hidden" name="birth_date">
```

```js
createDatePicker(document.querySelector('#birth-display'), {
  calendar: 'kurdish',
  storageInput: '#birth-storage'
});
```

The hidden field receives `2026-09-07`, while the visible input keeps the Kurdish date. You can also use `storageName: 'birth_date'` to let the picker create the hidden field automatically, or `autoStorage: true` when the visible input already has a `name`.

## Mobile Wheel Date Picker

On screens up to 600px, the default UI becomes a touch-first bottom-sheet Wheel Date Picker with separate year, month and day wheels. The desktop UI remains a calendar/grid picker.

You can force a mode with:

```js
createDatePicker(input, {
  calendar: 'kurdish',
  mobileMode: 'wheel'
});
```

Available values are `auto`, `wheel`, and `calendar`.

## Converting a Gregorian database value

If a database returns `2026-09-07`, pass it directly to the dedicated conversion function you need:

```js
import {
  gregorianToKurdish,
  gregorianToJalali,
  gregorianToHijri
} from '@hewarge/calendar-core';

const dbDate = '2026-09-07';

const kurdish = gregorianToKurdish(dbDate);
const jalali = gregorianToJalali(dbDate);
const hijri = gregorianToHijri(dbDate);

console.log(kurdish.year);        // 2726
console.log(kurdish.month);       // 6
console.log(kurdish.day);         // 16
console.log(kurdish.dayMonthYear); // 16/6/2726
```

Each conversion result contains both separate fields and ready-to-use strings:

```js
result.year
result.month
result.day
result.yearMonthDay
result.yearMonthDayPadded
result.dayMonthYear
result.dayMonthYearPadded
```

The conversion helpers also accept a JavaScript `Date` or `{ year, month, day }` Gregorian object.

> Hijri conversion in this package is the implemented arithmetic/civil Hijri algorithm. It should not be treated as a local moon-sighting declaration.
=======
# hewarge-calendar-core
A framework-free multi-calendar core and date picker for Kurdish, Jalali, Gregorian and Hijri calendars.
>>>>>>> ba551d3a3357ca193273709ea96d12a2393983e0
