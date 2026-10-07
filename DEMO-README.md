# Hewarge Calendar Core — Publication Demo

This demo showcases `@hewarge/calendar-core` v1.0.0.

## Features
- Kurdish / Jalali / Gregorian / Hijri calendar switching
- Desktop calendar picker
- Clickable month/year selectors with scrollable selection panels
- Mobile Wheel Date Picker
- Display value stays in the selected calendar
- `event.detail.storageValue` is always Gregorian `YYYY-MM-DD`
- Hidden storage input via `storageName`
- Dark/light presentation
- No runtime dependency

## Run
From the package root:

```bash
npm run dev
```

Then open the local address printed by the server.


## اجرای دمو با Python HTTP Server

این نسخه برای اجرای مستقیم به‌صورت Static آماده شده و به Node.js یا سرور اختصاصی دمو نیاز ندارد.

از ریشه پروژه اجرا کنید:

```bash
python -m http.server 5500
```

سپس مرورگر را روی `http://localhost:5500/` باز کنید.

> نکته: دمو باید از ریشه پروژه اجرا شود تا مسیرهای ES Module مانند `./src/picker/index.js` به‌درستی سرو شوند.
