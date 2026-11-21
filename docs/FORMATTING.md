# Date and Time Formatting

## Imports

```js
import { formatDate, formatTime, formatDateTime, parseDate, parseTime } from '@hewarge/calendar-core/formatting';
```

## Date API

```js
formatDate(HewargeDate.fromKurdish(2726, 6, 16), 'D MMMM YYYY', {
  calendar: 'kurdish', locale: 'ku-SO', numberingSystem: 'latn'
});
```

`calendar` controls arithmetic. `locale` controls names and direction. `numberingSystem` can be `latn`, `fa`/`persian`, or `arab`/`arabicIndic` independently.

## Tokens

| Category | Token | Meaning |
|---|---|---|
| Year | `Y` | Full year |
| Year | `YY` | Two-digit year |
| Year | `YYYY` | Padded four-digit year |
| Month | `M`, `MM` | Month without/with padding |
| Month | `MMM`, `MMMM`, `MMMMM` | Abbreviated, full, and narrow month name |
| Day | `D`, `DD` | Day without/with padding |
| Day of year | `DDD`, `DDDD` | Day of year without/with three-digit padding |
| Weekday | `d`, `dd`, `ddd`, `dddd` | Numeric weekday, narrow, abbreviated, and full name |
| Calendar week | `w`, `ww` | Calendar-specific week; week 1 starts at the first week containing January 1 for the configured calendar/year |
| ISO week | `W`, `WW` | ISO-8601 week number; Monday is the first ISO weekday |
| Hour | `H`, `HH` | 24-hour, 0–23 |
| Hour | `h`, `hh` | 12-hour, 1–12 |
| Hour | `k`, `kk` | 24-hour, 1–24; midnight is 24 and noon is 12 |
| Minute | `m`, `mm` | Minute |
| Second | `s`, `ss` | Second |
| Millisecond | `S`, `SS`, `SSS` | 1, 2, or 3 millisecond digits |
| Meridiem | `A`, `a` | Uppercase/lowercase localized AM/PM |
| Time zone | `Z`, `ZZ` | Offset with/without colon |
| Time zone | `z`, `zz` | Short name when available/IANA identifier |

## Literal text

Wrap literals in brackets: `[Day] D [of] MMMM YYYY`. Escape a literal character with backslash, for example `YYYY\\MM\\DD`. Literal brackets can be escaped as `\[`, `\]`.

## Presets

Date presets: `standard`, `iso`, `short`, `dayFirst`, `monthFirst`, `compact`, `abbreviatedMonth`, `fullMonth`, `fullDate`, `monthYear`, `numericMonthYear`.

Time presets: `time24`, `time24Seconds`, `time12`, `time12Compact`, `time12Seconds`, `hourOnly`, `minuteOnly`, `secondOnly`.

Date-time presets: `dateTime`, `dateTimeSeconds`, `dateTimeLong`, `isoDateTime`.

## Parsing

```js
parseDate('16/06/2726', 'DD/MM/YYYY', { calendar: 'kurdish', locale: 'ku-SO' });
parseTime('12:05 PM', 'hh:mm A', { locale: 'en' });
```

Parsing validates calendar dates and time fields. Formats that omit year, month, day, hour, or minute cannot reconstruct a complete value. Timezone-only text is also not sufficient to reconstruct an instant; use a timestamp or explicit date/time fields.

## Time zones

`UTC`, IANA zones such as `Asia/Tehran`, and the system zone are accepted. DST offsets are derived for the instant. `Asia/Kurdstan` is normalized to `Asia/Baghdad`. Unavailable IANA zones throw `RangeError` instead of silently guessing. `z` uses the runtime short name and may be empty if no stable abbreviation is available.
