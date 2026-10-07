# Changelog

## 1.2.0 — 2026-09-23

- Date Picker now keeps the selected calendar value in the visible input.
- Canonical Gregorian storage value is always available as `YYYY-MM-DD`.
- Added `storageValue` and `gregorianValue` to `hewarge:change`.
- Added `getGregorianValue()`.
- Added optional hidden storage input via `storageInput`, `storageName`, or `autoStorage`.
- Mobile Date Picker redesigned as a modern three-column Wheel Date Picker.
- Mobile wheel supports year, month and day scrolling, snap selection, safe-area bottom sheet and touch-friendly controls.
- Desktop keeps the calendar/grid Date Picker.
- Existing calendar conversion and restriction APIs remain available.

## 1.1.0

### Changed
- Date Picker input values are now always Gregorian, independent of the calendar shown in the picker.
- Default database-safe input format is `YYYY-MM-DD`.
- `hewarge:change` no longer exposes a `DateValue` as its primary output. The event provides a Gregorian string plus structured calendar results.
- Existing `format` option remains the display/calendar format; `gregorianFormat` controls the Gregorian input/storage format.

### Added
- `gregorianToKurdish()`
- `gregorianToJalali()`
- `gregorianToHijri()`
- `parseGregorianDate()`
- `formatGregorianDate()`
- Joined and separate output fields: `year`, `month`, `day`, `yearMonthDay`, `yearMonthDayPadded`, `dayMonthYear`, `dayMonthYearPadded`.

### Compatibility
- Calendar conversion remains JDN-based.
- Date Picker remains framework-free and modal.
- No runtime npm dependencies.
