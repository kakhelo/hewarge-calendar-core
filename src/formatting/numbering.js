export const NUMBERING_SYSTEMS = Object.freeze({
  latn: '0123456789',
  arab: '٠١٢٣٤٥٦٧٨٩',
  arabicIndic: '٠١٢٣٤٥٦٧٨٩',
  fa: '۰۱۲۳۴۵۶۷۸۹',
  persian: '۰۱۲۳۴۵۶۷۸۹'
});

export function normalizeNumberingSystem(system = 'latn') {
  const key = String(system).toLowerCase().replace(/[-_]/g, '');
  const aliases = { latn: 'latn', latin: 'latn', arab: 'arab', arabicindic: 'arab', fa: 'fa', persian: 'fa' };
  return aliases[key] || 'latn';
}

export function convertNumerals(value, numberingSystem = 'latn') {
  const system = normalizeNumberingSystem(numberingSystem);
  const digits = NUMBERING_SYSTEMS[system] || NUMBERING_SYSTEMS.latn;
  return String(value).replace(/[0-9]/g, digit => digits[Number(digit)]);
}

export function normalizeLocalizedNumerals(value) {
  const text = String(value);
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  return text
    .replace(/[٠-٩]/g, digit => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String(persian.indexOf(digit)));
}
