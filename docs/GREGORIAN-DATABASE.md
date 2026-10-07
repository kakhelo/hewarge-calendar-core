# Gregorian Database Contract

## Principle

Hewarge Date Picker separates the user-facing calendar from the canonical application value. The visible input shows the selected calendar; the canonical storage value is always Gregorian `YYYY-MM-DD`.

Example with Kurdish calendar:

```text
Visible input: 16/6/2726
Storage value: 2026-09-07
```

## Change event

```js
input.addEventListener('hewarge:change', (event) => {
  const displayValue = event.detail.value;
  const gregorianForDatabase = event.detail.storageValue;

  console.log(displayValue);           // 16/6/2726
  console.log(gregorianForDatabase);    // 2026-09-07
});
```

`event.detail.gregorianValue` is an alias of `storageValue`.

## Hidden form storage

```html
<input id="date-display" data-hewarge-datepicker name="date_display">
<input id="date-storage" type="hidden" name="date">
```

```js
createDatePicker(document.querySelector('#date-display'), {
  calendar: 'kurdish',
  storageInput: '#date-storage'
});
```

The visible field remains Kurdish while the hidden field receives the Gregorian value used by PHP, Laravel, WordPress or another backend.

Alternatively:

```js
createDatePicker(input, { storageName: 'date' });
```

creates the hidden field automatically. `autoStorage: true` can also create it from the visible input's `name`.

## Dedicated conversion functions

```js
import {
  gregorianToKurdish,
  gregorianToJalali,
  gregorianToHijri
} from '@hewarge/calendar-core';

const result = gregorianToKurdish('2026-09-07');

result.year;                 // 2726
result.month;                // 6
result.day;                  // 16
result.dayMonthYear;         // '16/6/2726'
result.dayMonthYearPadded;   // '16/06/2726'
result.yearMonthDay;         // '2726/6/16'
result.yearMonthDayPadded;   // '2726/06/16'
```
