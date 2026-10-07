# Hewarge Release Checklist

## Core

- [ ] Gregorian conversion tested
- [ ] Jalali conversion tested
- [ ] Kurdish conversion tested
- [ ] Hijri conversion tested
- [ ] JDN conversion tested
- [ ] Date arithmetic tested
- [ ] Comparison operations tested
- [ ] Invalid dates rejected

## Date Picker

- [ ] Empty input opens on today
- [ ] Manual year/month/day works
- [ ] Today writes to input and closes
- [ ] Past-only restriction works
- [ ] Future-only restriction works
- [ ] minDate/maxDate works
- [ ] Backdrop closes
- [ ] Close button closes
- [ ] Escape closes
- [ ] Mobile bottom sheet works
- [ ] Keyboard focus is trapped
- [ ] `hewarge:change` fires
- [ ] `hewarge:clear` fires

## Package

- [ ] `npm test`
- [ ] `npm pack --dry-run`
- [ ] Inspect `.tgz`
- [ ] Test clean installation
- [ ] Verify package exports
- [ ] Verify TypeScript declarations
- [ ] Verify CSS export
- [ ] Verify README
- [ ] Verify LICENSE
- [ ] Verify CHANGELOG

## Release

- [ ] Version is new
- [ ] npm account is authenticated
- [ ] Scope ownership verified
- [ ] No secrets in package
- [ ] Publish with the intended tag
- [ ] Verify `npm view @hewarge/calendar-core`
- [ ] Test `npm install @hewarge/calendar-core` from a clean project
