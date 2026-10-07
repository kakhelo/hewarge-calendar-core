export type CalendarId = 'gregorian' | 'jalali' | 'kurdish' | 'hijri' | string;
export type DateObject = { year:number; month:number; day:number };
export type CalendarDateObject = DateObject & { calendar:string };
export type DateAmount = { years?:number; months?:number; weeks?:number; days?:number };
export declare class DateValue {
  readonly calendar:string; readonly year:number; readonly month:number; readonly day:number;
  readonly daysInMonth:number; readonly dayOfYear:number; readonly dayOfWeek:number; readonly isLeapYear:boolean;
  toJdn():number; toObject():CalendarDateObject; toObjectDate():DateObject; toJSON():CalendarDateObject;
  convert(calendar:CalendarId):DateValue; toGregorian():DateObject; toJalali():DateObject; toKurdish():DateObject; toHijri():DateObject;
  with(value?:Partial<DateObject>):DateValue; add(amount?:DateAmount):DateValue; addDays(days:number):DateValue; subtract(amount?:DateAmount):DateValue;
  difference(other:DateValue, unit?:'days'|'weeks'|'months'|'years'):number;
  startOf(unit:'day'|'month'|'year'):DateValue; endOf(unit:'day'|'month'|'year'):DateValue;
  isBefore(other:DateValue):boolean; isAfter(other:DateValue):boolean; isSame(other:DateValue):boolean; equals(other:DateValue):boolean;
  format(pattern?:string):string; toString():string;
}
export declare const HewargeDate: {
  from(calendar:CalendarId,year:number,month:number,day:number):DateValue;
  fromGregorian(year:number,month:number,day:number):DateValue; fromJalali(year:number,month:number,day:number):DateValue;
  fromKurdish(year:number,month:number,day:number):DateValue; fromHijri(year:number,month:number,day:number):DateValue;
  fromObject(value:CalendarDateObject):DateValue; fromDate(date?:Date):DateValue; fromUTCDate(date?:Date):DateValue; today():DateValue; calendars():string[];
};
export declare const CalendarRegistry: { list():string[]; all():any[]; get(name:CalendarId):any; has(name:CalendarId):boolean; register(engine:any):any };
export declare const KurdishConfig:any;
export declare class HewargeError extends Error { code:string }
export declare class InvalidDateError extends HewargeError {}
export declare class UnsupportedCalendarError extends HewargeError {}
export declare class InvalidOperationError extends HewargeError {}

export type ConvertedDate = {
  calendar: string;
  year: number;
  month: number;
  day: number;
  value: { year:number; month:number; day:number };
  yearMonthDay: string;
  yearMonthDayPadded: string;
  dayMonthYear: string;
  dayMonthYearPadded: string;
};
export declare function parseGregorianDate(input: string | Date | {year:number;month:number;day:number}, format?: string): DateValue;
export declare function formatGregorianDate(input: string | Date | {year:number;month:number;day:number}, pattern?: string): string;
export declare function gregorianToKurdish(input: string | Date | {year:number;month:number;day:number}, format?: string): ConvertedDate;
export declare function gregorianToJalali(input: string | Date | {year:number;month:number;day:number}, format?: string): ConvertedDate;
export declare function gregorianToHijri(input: string | Date | {year:number;month:number;day:number}, format?: string): ConvertedDate;
