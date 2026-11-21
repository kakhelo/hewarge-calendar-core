export const DATE_FORMAT_PRESETS = Object.freeze({
  standard:'YYYY/MM/DD', iso:'YYYY-MM-DD', short:'YY/MM/DD', dayFirst:'DD/MM/YYYY', monthFirst:'MM/DD/YYYY', compact:'Y/M/D', abbreviatedMonth:'D MMM YYYY', fullMonth:'D MMMM YYYY', fullDate:'dddd، D MMMM YYYY', monthYear:'MMMM YYYY', numericMonthYear:'MM/YYYY'
});
export const TIME_FORMAT_PRESETS = Object.freeze({
  time24:'HH:mm', time24Seconds:'HH:mm:ss', time12:'hh:mm A', time12Compact:'h:mm A', time12Seconds:'hh:mm:ss A', hourOnly:'HH', minuteOnly:'mm', secondOnly:'ss'
});
export const DATETIME_FORMAT_PRESETS = Object.freeze({
  dateTime:'YYYY/MM/DD HH:mm', dateTimeSeconds:'YYYY/MM/DD HH:mm:ss', dateTimeLong:'dddd، D MMMM YYYY HH:mm', isoDateTime:'YYYY-MM-DDTHH:mm:ssZ'
});
export function getAvailableFormatPresets() {
  return Object.freeze({ date:{...DATE_FORMAT_PRESETS}, time:{...TIME_FORMAT_PRESETS}, dateTime:{...DATETIME_FORMAT_PRESETS} });
}
