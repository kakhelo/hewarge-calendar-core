const KU_WEEKDAYS = ['یەکشەممە','دووشەممە','سێشەممە','چوارشەممە','پێنجشەممە','هەینی','شەممە'];
const FA_WEEKDAYS = ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','آدینه','شنبه'];
const AR_WEEKDAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const EN_WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export const LOCALES = Object.freeze({
  'ku-SO': { direction:'rtl', months:['خاکەلێوە','گوڵان','جۆزەردان','پووشپەڕ','گەلاوێژ','خەرمانان','ڕەزبەر','گەڵاڕێزان','سەرماوەز','بەفرانبار','ڕێبەندان','ڕەشەمە'], weekdays:KU_WEEKDAYS, weekdaysAbbrev:['یەک','دوو','سێ','چوار','پێنج','هەینی','شەم'], narrowWeekdays:['ی','د','س','چ','پ','ه','ش'], meridiem:{AM:'پێش نیوەڕۆ', PM:'دوای نیوەڕۆ'}, fallbackNumerals:'arab' },
  'ku-KMR': { direction:'rtl', months:['Xanûn','Gulan','Cozerdan','Pûşper','Gelawej','Xermanan','Rezber','Gêlarezan','Sermawez','Behranbar','Rebendan','Reşeme'], weekdays:['Yekşem','Duşem','Sêşem','Çarşem','Pêncşem','În','Şemî'], weekdaysAbbrev:['Yş','Dş','Sş','Çş','Pş','În','Şm'], narrowWeekdays:['Y','D','S','Ç','P','Î','Ş'], meridiem:{AM:'BN', PM:'DN'}, fallbackNumerals:'latn' },
  ku: { direction:'rtl', months:KU_WEEKDAYS, weekdays:KU_WEEKDAYS, weekdaysAbbrev:['یەک','دوو','سێ','چوار','پێنج','هەینی','شەم'], narrowWeekdays:['ی','د','س','چ','پ','ه','ش'], meridiem:{AM:'پێش نیوەڕۆ', PM:'دوای نیوەڕۆ'}, fallbackNumerals:'latn' },
  fa: { direction:'rtl', months:['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'], weekdays:FA_WEEKDAYS, weekdaysAbbrev:['یک‌شنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'], narrowWeekdays:['ی','د','س','چ','پ','ج','ش'], meridiem:{AM:'ق.ظ', PM:'ب.ظ'}, fallbackNumerals:'fa' },
  en: { direction:'ltr', months:['January','February','March','April','May','June','July','August','September','October','November','December'], weekdays:EN_WEEKDAYS, weekdaysAbbrev:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], narrowWeekdays:['S','M','T','W','T','F','S'], meridiem:{AM:'AM', PM:'PM'}, fallbackNumerals:'latn' },
  ar: { direction:'rtl', months:['محرم','صفر','ربيع الأول','ربيع الآخر','جمادى الأولى','جمادى الآخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'], weekdays:['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'], weekdaysAbbrev:['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'], narrowWeekdays:['ح','ن','ث','ر','خ','ج','س'], meridiem:{AM:'ص',PM:'م'}, fallbackNumerals:'arab' }
});

export function resolveLocale(locale = 'en', calendar = 'gregorian') {
  const key = String(locale).trim();
  if (LOCALES[key]) return LOCALES[key];
  const lower = key.toLowerCase();
  if (lower.startsWith('ku-so') || lower === 'ckb') return LOCALES['ku-SO'];
  if (lower.startsWith('ku-kmr') || lower.startsWith('kmr')) return LOCALES['ku-KMR'];
  if (lower.startsWith('ku')) return LOCALES.ku;
  if (lower.startsWith('fa') || lower === 'persian') return LOCALES.fa;
  if (lower.startsWith('ar')) return LOCALES.ar;
  if (lower.startsWith('en')) return LOCALES.en;
  if (calendar === 'jalali') return LOCALES.fa;
  if (calendar === 'hijri') return LOCALES.ar;
  if (calendar === 'kurdish' || calendar === 'kurdish-zayni') return LOCALES['ku-SO'];
  return LOCALES.en;
}
