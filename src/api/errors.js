export class HewargeError extends Error {
  constructor(message, code = 'HEWARGE_ERROR') { super(message); this.name = 'HewargeError'; this.code = code; }
}
export class InvalidDateError extends HewargeError {
  constructor(calendar, y, m, d) { super(`Invalid ${calendar} date: ${y}-${m}-${d}`, 'INVALID_DATE'); this.name = 'InvalidDateError'; }
}
export class UnsupportedCalendarError extends HewargeError {
  constructor(calendar) { super(`Unsupported calendar: ${calendar}`, 'UNSUPPORTED_CALENDAR'); this.name = 'UnsupportedCalendarError'; }
}
export class InvalidOperationError extends HewargeError {
  constructor(message) { super(message, 'INVALID_OPERATION'); this.name = 'InvalidOperationError'; }
}
