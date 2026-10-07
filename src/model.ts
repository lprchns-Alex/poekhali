import catalog from './catalog.json';

export type Route = (typeof catalog)[number];
export type Stop = Route['stops'][number];
export type Meal = 'cafe' | 'picnic';
export type Mood = 'Все' | 'Природа' | 'У воды' | 'История' | 'Город';
export type TripDays = 1 | 2;
export type Filters = { mood: Mood; days: TripDays; maxHours: number; easyOnly: boolean };
export const ROUTES: Route[] = catalog;
export const MOODS: Mood[] = ['Все', 'Природа', 'У воды', 'История', 'Город'];
export const DEFAULT_FILTERS: Filters = { mood: 'Все', days: 1, maxHours: 12, easyOnly: false };

export function tbilisiToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tbilisi', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export const isValidDateString = isValidDate;

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getStopDate(startDate: string, stop: Pick<Stop, 'day'>): string {
  return addDays(startDate, stop.day - 1);
}

export function getTripEndDate(startDate: string, route: Pick<Route, 'days'>): string {
  return addDays(startDate, route.days - 1);
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
  // Both the route estimate and meal adjustment cover every day, including the overnight interval.
  const mealDelta = (meal === route.preferredMeal ? 0 : meal === 'cafe' ? 0.5 : -0.5) * route.days;
  const shortDelta = short && route.shortVariant ? 3 : 0;
  return [Math.max(1, route.durationHours[0] + mealDelta - shortDelta), Math.max(1, route.durationHours[1] + mealDelta - shortDelta)];
}

export function hoursLabel(hours: number[]): string {
  return `≈ ${hours.map(value => String(value).replace('.', ',')).join('–')} ч`;
}

export function filterRoutes(filters: Filters, query = '', meal?: Meal): Route[] {
  const search = query.trim().toLocaleLowerCase('ru-RU');
  return ROUTES.filter(route =>
    (filters.mood === 'Все' || route.tags.includes(filters.mood)) &&
    route.days === filters.days &&
    getTripHours(route, meal)[1] <= filters.maxHours &&
    (!filters.easyOnly || route.easy) &&
    (!search || `${route.title} ${route.subtitle} ${route.tags.join(' ')} ${route.stops.map(stop => stop.name).join(' ')}`.toLocaleLowerCase('ru-RU').includes(search))
  );
}

export function foodSearchUrl(route: Route, short = false): string {
  const query = short && route.shortVariant ? `restaurants near ${route.stops[0].mapSearchQuery}` : route.foodSearchQuery;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function placeSearchUrl(stop: Stop): string {
  // Use the explicit landmark and locality, never an ambiguous display label or overview coordinate.
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.mapSearchQuery)}`;
}

export function validSavedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && ROUTES.some(route => route.id === id)))];
}
