import { DEFAULT_FILTERS, Filters, isValidDate, Meal, MOODS, nextSaturday, tbilisiToday, validSavedIds } from './model';

export type Preferences = { saved: string[]; theme: 'light' | 'dark' | null; meal: Meal; date: string; filters: Filters };

export function parsePreferences(raw: string | null, now = new Date()): Preferences {
  const defaults: Preferences = { saved: [], theme: null, meal: 'cafe', date: nextSaturday(now), filters: { ...DEFAULT_FILTERS } };
  const parsed: unknown = raw ? JSON.parse(raw) : null;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaults;
  const data = parsed as Record<string, unknown>;
  const candidate = data.filters && typeof data.filters === 'object' ? data.filters as Record<string, unknown> : {};
  const days = candidate.days === 2 ? 2 : 1;
  const limits = days === 2 ? [36, 48] : [6, 8, 12];
  return {
    saved: validSavedIds(data.saved),
    theme: data.theme === 'light' || data.theme === 'dark' ? data.theme : null,
    meal: data.meal === 'picnic' ? 'picnic' : 'cafe',
    date: isValidDate(data.date) && data.date >= tbilisiToday(now) ? data.date : defaults.date,
    filters: {
      days,
      mood: MOODS.includes(candidate.mood as Filters['mood']) ? candidate.mood as Filters['mood'] : 'Все',
      maxHours: typeof candidate.maxHours === 'number' && limits.includes(candidate.maxHours) ? candidate.maxHours : days === 2 ? 48 : 12,
      easyOnly: candidate.easyOnly === true,
    },
  };
}
