# Hewarge Core API Reference

## `HewargeDate`

Factory API for creating dates.

```js
import { HewargeDate } from '@hewarge/calendar-core';
```

### `from(calendar, year, month, day)`

```js
HewargeDate.from('kurdish', 2726, 6, 16);
```

### Calendar-specific factories

```js
HewargeDate.fromGregorian(2026, 9, 7);
HewargeDate.fromJalali(1405, 6, 16);
HewargeDate.fromKurdish(2726, 6, 16);
HewargeDate.fromHijri(1448, 3, 24);
```

### `today()`

Creates today's date using the core's current-date behavior.

### `fromObject(value)`

```js
HewargeDate.fromObject({
  calendar: 'kurdish',
  year: 2726,
  month: 6,
  day: 16
});
```

### `fromDate(date)` / `fromUTCDate(date)`

Create a Gregorian value from a JavaScript `Date` using local or UTC interpretation respectively.

## `DateValue`

Date values are immutable. Operations return new values rather than mutating the original.

### Conversion

```js
value.convert('gregorian');
value.toGregorian();
value.toJalali();
value.toKurdish();
value.toHijri();
```

### Serialization

```js
value.toObject();
value.toObjectDate();
value.toJSON();
value.toString();
value.format('YYYY/MM/DD');
```

### Arithmetic

```js
value.add({ years: 1 });
value.add({ months: 2 });
value.add({ weeks: 1 });
value.add({ days: 10 });
value.addDays(10);
value.subtract({ days: 10 });
```

### Difference

```js
value.difference(other, 'days');
value.difference(other, 'weeks');
value.difference(other, 'months');
value.difference(other, 'years');
```

### Comparisons

```js
value.isBefore(other);
value.isAfter(other);
value.isSame(other);
value.equals(other);
```

### Boundaries

```js
value.startOf('day');
value.startOf('month');
value.startOf('year');
value.endOf('day');
value.endOf('month');
value.endOf('year');
```

### Metadata

```js
value.daysInMonth;
value.dayOfYear;
value.dayOfWeek;
value.isLeapYear;
value.toJdn();
```

## `CalendarRegistry`

```js
import { CalendarRegistry } from '@hewarge/calendar-core';

CalendarRegistry.list();
CalendarRegistry.has('kurdish');
CalendarRegistry.get('kurdish');
CalendarRegistry.all();
```

The registry is the extension point for additional calendar engines.

## Errors

The package exposes:

- `HewargeError`
- `InvalidDateError`
- `UnsupportedCalendarError`
- `InvalidOperationError`

Use these for explicit error handling when integrating the core into an application.
