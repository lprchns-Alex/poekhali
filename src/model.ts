import catalog from './catalog.json';

export type Route = (typeof catalog)[number];
export type Stop = Route['stops'][number];
export type Meal = 'cafe' | 'picnic';
export type Mood = 'Все' | 'Природа' | 'У воды' | 'История' | 'Город';
export type Filters = { mood: Mood; maxHours: number; easyOnly: boolean };
export const ROUTES: Route[] = catalog;
export const MOODS: Mood[] = ['Все', 'Природа', 'У воды', 'История', 'Город'];
export const DEFAULT_FILTERS: Filters = { mood: 'Все', maxHours: 12, easyOnly: false };

export function tbilisiToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tbilisi', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function nextSaturday(now = new Date()): string {
  const day = tbilisiToday(now);
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  return addDays(day, (6 - weekday + 7) % 7);
}

export function formatDate(day: string, long = false): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: long ? 'long' : 'short', weekday: 'short', timeZone: 'Asia/Tbilisi' }).format(new Date(`${day}T12:00:00Z`));
}

export function getTripHours(route: Route, meal: Meal = route.preferredMeal as Meal, short = false): [number, number] {
  const mealDelta = meal === route.preferredMeal ? 0 : meal === 'cafe' ? 0.5 : -0.5;
  const shortDelta = short && route.shortVariant ? 3 : 0;
  return [Math.max(1, route.durationHours[0] + mealDelta - shortDelta), Math.max(1, route.durationHours[1] + mealDelta - shortDelta)];
}

export function hoursLabel(hours: number[]): string {
  return `≈ ${hours.map(value => String(value).replace('.', ',')).join('–')} ч`;
}

export function filterRoutes(filters: Filters, query = ''): Route[] {
  const search = query.trim().toLocaleLowerCase('ru-RU');
  return ROUTES.filter(route =>
    (filters.mood === 'Все' || route.tags.includes(filters.mood)) &&
    route.durationHours[1] <= filters.maxHours &&
    (!filters.easyOnly || route.easy) &&
    (!search || `${route.title} ${route.subtitle} ${route.tags.join(' ')} ${route.stops.map(stop => stop.name).join(' ')}`.toLocaleLowerCase('ru-RU').includes(search))
  );
}

export function foodSearchUrl(route: Route): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(route.foodSearchQuery)}`;
}

export function placeSearchUrl(stop: Stop): string {
  // Destination search only: catalog coordinates are overview anchors, not verified parking entrances.
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${stop.name} Georgia`)}`;
}

export function validSavedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && ROUTES.some(route => route.id === id)))];
}
