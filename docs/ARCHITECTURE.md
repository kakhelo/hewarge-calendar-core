# هەوارگە — Architecture

```text
Calendar Engine
   │
   ├── Gregorian
   ├── Jalali
   ├── Kurdish
   └── Hijri
   │
   ▼
  JDN
   │
   ▼
DateValue (immutable)
   │
   ├── Conversion
   ├── Arithmetic
   ├── Comparison
   ├── Metadata
   └── Serialization
   │
   ▼
Public API
   │
   ├── JavaScript / TypeScript
   ├── Browser UI
   └── future adapters
```

## بنەمای دیزاین

1. UI نابێت بیرکاریی ڕۆژژمێر جێبەجێ بکات.
2. هەموو گۆڕینەکان لەسەر JDN دەبن.
3. `DateValue` immutable ـە.
4. هەر Calendar Engine ـێک `toJdn()` و `fromJdn()` هەیە.
5. Registry دەتوانێت Engine ـی نوێ وەربگرێت.
6. JavaScript `Date` تەنها بۆ وەرگرتنی بەرواری سیستەم بەکاردهێنرێت؛ Core بە timestamp پەیوەندیدار نییە.
