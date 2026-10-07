import { GregorianCalendar } from '../calendars/gregorian/GregorianCalendar.js';
import { JalaliCalendar } from '../calendars/jalali/JalaliCalendar.js';
import { KurdishCalendar } from '../calendars/kurdish/KurdishCalendar.js';
import { HijriCalendar } from '../calendars/hijri/HijriCalendar.js';
import { UnsupportedCalendarError } from './errors.js';

const engines = [GregorianCalendar, JalaliCalendar, KurdishCalendar, HijriCalendar];
const map = new Map();
for (const engine of engines) for (const key of [engine.id, ...(engine.aliases || [])]) map.set(key.toLowerCase(), engine);

export const CalendarRegistry = {
  list: () => engines.map(e => e.id),
  all: () => engines.slice(),
  get(name) {
    const key = String(name).trim().toLowerCase();
    const engine = map.get(key);
    if (!engine) throw new UnsupportedCalendarError(name);
    return engine;
  },
  has(name) { return map.has(String(name).trim().toLowerCase()); },
  register(engine) {
    if (!engine?.id || typeof engine.toJdn !== 'function' || typeof engine.fromJdn !== 'function') {
      throw new TypeError('A calendar engine must define id, toJdn and fromJdn.');
    }
    engines.push(engine);
    for (const key of [engine.id, ...(engine.aliases || [])]) map.set(key.toLowerCase(), engine);
    return engine;
  }
};
