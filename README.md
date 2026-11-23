# Hewarge Calendar Core

**Framework-free multi-calendar dates, formatting, time-zone conversion, and embeddable date/time pickers.**

[![npm version](https://img.shields.io/npm/v/%40hewarge%2Fcalendar-core)](https://www.npmjs.com/package/@hewarge/calendar-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

Hewarge separates calendar arithmetic from interface code. Use its immutable date API and conversion utilities in any JavaScript environment, or attach accessible, responsive date and time pickers to existing browser inputs. It has no runtime npm dependencies.

## Contents

- [Highlights](#highlights)
- [Requirements and installation](#requirements-and-installation)
- [Quick start](#quick-start)
- [Supported calendars](#supported-calendars)
- [Date and time formatting](#date-and-time-formatting)
- [Date picker](#date-picker)
- [Time and date-time pickers](#time-and-date-time-pickers)
- [Time zones and timestamps](#time-zones-and-timestamps)
- [Custom and native interfaces](#custom-and-native-interfaces)
- [API exports](#api-exports)
- [Demo and development](#demo-and-development)
- [Testing](#testing)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Highlights

- Five calendar systems: Gregorian, Kurdish, Kurdish Zayni, Jalali, and Hijri.
- JDN-based calendar conversion and immutable `DateValue` operations.
- Localized formatting, parsing, numeral systems, and extensive date/time tokens.
- Independent, embeddable date, time-only, and combined date-time pickers.
- Three date-picker designs and three time-picker designs, selectable per instance.
- Date boundaries and relative past/future restrictions.
- Gregorian `YYYY-MM-DD` storage values for dates displayed in another calendar.
- IANA time-zone conversion, millisecond or second timestamps, and daylight-saving validation.
- RTL/LTR-aware picker localization, keyboard support, responsive layouts, and dark-mode styling.
- UI-independent date picker controller for custom web, native, or framework interfaces.
- TypeScript declarations and zero runtime npm dependencies.

## Requirements and installation

Install the published package:

```bash
npm install @hewarge/calendar-core
```

The library is an ES module. The date/time picker UI runs in a modern browser; the core and formatting APIs can also be used without the DOM. Node.js 18 or newer is recommended for the repository's development scripts and tests.

## Quick start

### Date picker

```html
<input id="appointment-date" type="text" autocomplete="off">
```

```js
import { createDatePicker } from '@hewarge/calendar-core/picker';
import '@hewarge/calendar-core/picker/css';

const input = document.querySelector('#appointment-date');
const picker = createDatePicker(input, {
  calendar: 'kurdish',
  format: 'DD/MM/YYYY'
});

input.addEventListener('hewarge:change', ({ detail }) => {
  console.log(detail.value);        // Date shown in the selected calendar
  console.log(detail.storageValue); // Canonical Gregorian YYYY-MM-DD
});
```

The picker attaches to the input; it does not navigate away or render a separate page. Import the CSS entry point once in your browser application.

### Core date API

```js
import { HewargeDate } from '@hewarge/calendar-core';

const date = HewargeDate.fromGregorian(2026, 9, 7);
const kurdishDate = date.toKurdish();

console.log(kurdishDate); // { year: 2726, month: 6, day: 16 }
console.log(date.convert('jalali').toObjectDate());
console.log(date.add({ days: 10 }).format('YYYY-MM-DD'));
```

`HewargeDate` is the factory for immutable `DateValue` instances. Calendar conversion, arithmetic, comparison, boundary, metadata, and serialization methods are available on each value.

## Supported calendars

| Calendar ID | Calendar behavior | Picker language and direction |
|---|---|---|
| `gregorian` | Gregorian arithmetic | English, LTR |
| `kurdish` | Legacy Kurdish calendar with its existing 2726-based year convention | Kurdish, RTL |
| `kurdish-zayni` | Gregorian date arithmetic with Kurdish month names | Kurdish, RTL |
| `jalali` | Jalali/Persian calendar | Persian, RTL |
| `hijri` | Implemented arithmetic/civil Hijri calendar | Arabic, RTL |

Create calendar values with `HewargeDate.from(calendar, year, month, day)` or the specific factories `fromGregorian()`, `fromKurdish()`, `fromKurdishZayni()`, `fromJalali()`, and `fromHijri()`. The registry can list, resolve, and register calendar engines; see [docs/API.md](./docs/API.md).

> Hijri dates use the package's arithmetic/civil algorithm and should not be treated as a local moon-sighting declaration.

## Date and time formatting

The formatting API is available from the package root or the dedicated formatting entry point:

```js
import { HewargeDate } from '@hewarge/calendar-core';
import {
  formatDate,
  formatTime,
  formatDateTime,
  parseDate,
  parseTime
} from '@hewarge/calendar-core/formatting';

const date = HewargeDate.fromKurdish(2726, 6, 16);
console.log(formatDate(date, 'D MMMM YYYY', {
  calendar: 'kurdish', locale: 'ku-SO', numberingSystem: 'latn'
}));

console.log(formatTime({ hour: 8, minute: 5, second: 9 }, 'hh:mm:ss A'));
const parsed = parseDate('16/06/2726', 'DD/MM/YYYY', { calendar: 'kurdish' });
```

Locales include Kurdish (`ku`, `ku-SO`, `ku-KMR`), Persian (`fa`), English (`en`), and Arabic (`ar`). Numbering systems include Latin (`latn`), Persian (`fa`/`persian`), and Arabic-Indic (`arab`/`arabicIndic`). Calendar arithmetic, locale names, and numeral display can be configured independently.

Common tokens include:

| Tokens | Meaning |
|---|---|
| `Y`, `YY`, `YYYY` | Year |
| `M`, `MM`, `MMM`, `MMMM`, `MMMMM` | Numeric, padded, abbreviated, full, or narrow month |
| `D`, `DD`, `DDD`, `DDDD` | Day of month or day of year |
| `d`, `dd`, `ddd`, `dddd` | Numeric or localized weekday |
| `w`, `ww`, `W`, `WW` | Calendar or ISO week |
| `H`/`HH`, `h`/`hh`, `k`/`kk` | 24-hour, 12-hour, or 1–24-hour clock |
| `m`/`mm`, `s`/`ss`, `S`/`SS`/`SSS` | Minute, second, and millisecond |
| `A`, `a` | Localized AM/PM marker |
| `Z`, `ZZ`, `z`, `zz` | UTC offset, short time-zone name, or IANA identifier |

Wrap literal text in brackets, for example `[Day] D [of] MMMM YYYY`. Parsing validates supported values; formats that omit required fields cannot reconstruct a complete date or time. For full token, preset, and parsing details, see [docs/FORMATTING.md](./docs/FORMATTING.md).

## Date picker

### Options and variants

```js
const picker = createDatePicker(input, {
  calendar: 'kurdish',
  format: 'DD/MM/YYYY',
  variant: 'default',       // default | calendar-card | calendar-glass
  mobileMode: 'auto',       // auto | wheel | calendar
  weekStart: 6,             // 0=Sunday ... 6=Saturday
  minDate: { year: 2726, month: 1, day: 1 },
  maxDate: { year: 2727, month: 12, day: 29 }
});
```

`default`, `calendar-card`, and `calendar-glass` can be mixed on the same page. On narrow screens, the picker can use a touch-friendly wheel; set `mobileMode` to `calendar` to keep the calendar grid or `wheel` to force the wheel. The default `auto` mode selects the wheel below 600px.

Additional range options include `direction: 'past' | 'future' | 'both'`, `pastYears`, `futureYears`, `pastMonths`, and `futureMonths`. `minDate` and `maxDate` use the selected calendar. See the [complete option declarations](./src/picker/index.d.ts) and [date picker guide](./docs/DATE-PICKER.md).

### Gregorian storage and form submission

The visible date follows the selected calendar, while `detail.storageValue` and `detail.gregorianValue` provide the corresponding Gregorian `YYYY-MM-DD` value. To submit that canonical value in a form, connect a hidden field:

```html
<input id="date-display" type="text" autocomplete="off">
<input id="date-storage" type="hidden" name="appointment_date">
```

```js
createDatePicker(document.querySelector('#date-display'), {
  calendar: 'kurdish',
  storageInput: '#date-storage'
});
```

Alternatively, `storageName: 'appointment_date'` creates a hidden field, or `autoStorage: true` derives its name from the visible input. The [Gregorian database contract](./docs/GREGORIAN-DATABASE.md) documents the behavior and conversion helpers.

### Auto-attach multiple inputs

```html
<input data-hewarge-datepicker data-calendar="kurdish" data-format="DD/MM/YYYY">
<input data-hewarge-datepicker data-calendar="gregorian" data-format="YYYY-MM-DD">
```

```js
import { attachDatePickers } from '@hewarge/calendar-core/picker';
import '@hewarge/calendar-core/picker/css';

const instances = attachDatePickers(document);
```

Use `attachDatePickers(root, { selector: '.my-date-input' })` to provide a custom selector. Per-input `data-*` settings can override picker options.

### Events and lifecycle

`hewarge:change` fires when a date is committed. Its detail includes the visible `value`, canonical `storageValue`/`gregorianValue`, selected calendar fields, and conversions to the supported calendars. `hewarge:clear` fires when the value is cleared.

```js
picker.open();
picker.setCalendar('jalali');
picker.close();
picker.destroy();
```

The picker also supports keyboard interaction, focus containment, Escape dismissal, and disabled dates outside configured bounds.

## Time and date-time pickers

### Time-only picker

```html
<input id="meeting-time" type="text" autocomplete="off">
```

```js
import { createTimePicker } from '@hewarge/calendar-core/picker';
import '@hewarge/calendar-core/picker/css';

const clock = createTimePicker(document.querySelector('#meeting-time'), {
  variant: 'ios-wheel', // default | analog-clock | ios-wheel
  format: '12',         // 12 | 24
  timeZone: 'Europe/London',
  showSeconds: false,
  keyboard: true
});
```

Time picker variants are the standard scroll wheel, analog clock, and iOS-style wheel. The time zone is configured by the developer, not selected by the user. An empty input opens at the current time in the configured zone. Use `setFormat()`, `setVariant()`, `setTimeZone()`, `setShowSeconds()`, or `setTime()` to update a picker instance.

The committed time fires `hewarge:timechange` and `hewarge:change`. The detail includes hour, minute, second, display `value`, `format`, and `timeZone`.

### Combined date and time

```html
<input id="appointment-date" type="text" autocomplete="off">
<input id="appointment-time" type="text" autocomplete="off">
```

```js
import { createDateTimePicker } from '@hewarge/calendar-core/picker';
import '@hewarge/calendar-core/picker/css';

const appointment = createDateTimePicker(
  document.querySelector('#appointment-date'),
  document.querySelector('#appointment-time'),
  {
    calendar: 'kurdish',
    date: { format: 'YYYY/MM/DD', variant: 'calendar-glass' },
    time: { format: '12', variant: 'ios-wheel', timeZone: 'Asia/Baghdad' }
  }
);

document.querySelector('#appointment-time').addEventListener('hewarge:datetimechange', ({ detail }) => {
  console.log(detail.dateTime);  // Selected calendar date and 24-hour time fields
  console.log(detail.timeZone);
  console.log(detail.timestamp); // Unix milliseconds, or null for a DST gap
});
```

The combined picker supports `setCalendar()`, `setTimeFormat()`, `setTimeVariant()`, `setTimeZone()`, and `destroy()`. The emitted `datetimechange` detail includes a validation error when the selected wall-clock time cannot represent an instant.

## Time zones and timestamps

The core exports `dateTimeToTimestamp()`, `timestampToDateTime()`, and `normalizeTimeZone()`:

```js
import { dateTimeToTimestamp, timestampToDateTime } from '@hewarge/calendar-core';

const timestamp = dateTimeToTimestamp({
  calendar: 'kurdish', year: 2726, month: 6, day: 16,
  hour: 12, minute: 34, second: 56, millisecond: 789
}, { timeZone: 'America/New_York', unit: 'milliseconds' });

const local = timestampToDateTime(timestamp, {
  timeZone: 'America/New_York', calendar: 'kurdish'
});
```

Timestamps default to milliseconds; `unit: 'seconds'` or `'s'` uses Unix seconds. Time zones accept `UTC` and runtime-supported IANA names. `Asia/Kurdstan` is normalized to `Asia/Baghdad`. A nonexistent local wall-clock time during a daylight-saving transition is rejected by `dateTimeToTimestamp()`; an ambiguous repeated time resolves to the earlier matching instant. See [docs/API.md](./docs/API.md) for return values and details.

## Custom and native interfaces

Use `createDatePickerController()` when you need calendar state and behavior without the bundled DOM picker:

```js
import { createDatePickerController } from '@hewarge/calendar-core/picker';

const model = createDatePickerController({
  calendar: 'kurdish',
  format: 'DD/MM/YYYY',
  minDate: { year: 2726, month: 1, day: 1 }
});

const state = model.getState();
const unsubscribe = model.subscribe(({ type, state }) => {
  // Render state.value, state.days, state.monthLabel, and allowed flags.
});

model.navigate(1);
model.select(16);
model.setCalendar('jalali');
unsubscribe();
```

Each controller owns its value, visible month, calendar, and date-range rules. It exposes state, navigation, selection, range checks, `goToToday()`, `clear()`, and subscriptions without requiring `document` or `window`. Consult [docs/DATE-PICKER.md](./docs/DATE-PICKER.md#custom-and-native-interfaces) for the full state and notification contract.

## API exports

| Import path | Contents |
|---|---|
| `@hewarge/calendar-core` | `HewargeDate`, `DateValue`, calendar registry, conversions, timestamp helpers, errors, formatting exports |
| `@hewarge/calendar-core/formatting` | Date/time formatting and parsing, locales, numeral helpers, tokens, presets |
| `@hewarge/calendar-core/picker` | Date/time/date-time pickers, date picker controller, picker helpers |
| `@hewarge/calendar-core/picker/css` | Bundled picker styles |

TypeScript declarations are included for the root, formatting, and picker APIs. See [src/index.d.ts](./src/index.d.ts), [src/formatting/index.d.ts](./src/formatting/index.d.ts), and [src/picker/index.d.ts](./src/picker/index.d.ts).

## Demo and development

Clone the repository, install dependencies if needed, and start the interactive local demo:

```bash
npm install
npm run dev
```

Open the address printed by the server (by default, `http://localhost:5177`). The demo includes all picker variants, calendar selection, date/time formatting, and timestamp round-trip tools.

## Testing

Run the test suite with Node's built-in test runner:

```bash
npm test
```

The tests cover calendar conversion and arithmetic, formatting and parsing, picker exports and controller behavior, timestamp units, time zones, and daylight-saving edge cases.

## Documentation

- [Core API reference](./docs/API.md)
- [Date, time, and date-time pickers](./docs/DATE-PICKER.md)
- [Formatting tokens and parsing](./docs/FORMATTING.md)
- [Gregorian database/storage contract](./docs/GREGORIAN-DATABASE.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Publishing guide](./docs/PUBLISHING.md)
- [Release checklist](./docs/RELEASE-CHECKLIST.md)
- [Changelog](./CHANGELOG.md)
- [Basic example](./examples/basic.mjs)

## Contributing

Contributions and bug reports are welcome. Before opening a pull request, run `npm test` and describe the affected API or UI behavior. Public API changes should also update the relevant TypeScript declarations and documentation.

## License

This project is distributed under the [MIT License](./LICENSE).
