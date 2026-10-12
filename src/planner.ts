import { Route, ROUTES } from './model';
export type Plan = { version: 1; extras: string[]; road: (number | null)[]; days: number; stopDays: number[]; ceiling: number | null; selected: boolean[]; required: boolean[]; minutes: number[]; hours: number; start: number; deadline: number; people: number; costs: (number | null)[] };
export const COSTS = [ ['Дорога и топливо', 'на компанию'], ['Билеты и развлечения', 'на человека'], ['Еда', 'на человека'], ['Ночлег за все ночи', 'на компанию'], ['Парковки и прочее', 'на компанию'] ] as const;
export function newPlan(route: Route): Plan {
  return { version: 1, extras: [], road: Array.from({ length: route.days }, () => Math.ceil(route.driveMinutes[1] / route.days)), days: route.days, stopDays: route.stops.map(s => s.day), ceiling: null, selected: route.stops.map(() => true), required: route.stops.map(() => false), minutes: route.stops.map(s => s.durationMinutesEstimate), hours: 10, start: 8, deadline: 18, people: 2, costs: [null, null, null, route.days === 1 ? 0 : null, null] };
}
export function parsePlan(raw: string | null, route: Route): Plan {
  const fallback = newPlan(route);
  try {
    const p = JSON.parse(raw || 'null');
    if (!p || !Array.isArray(p.extras) || p.extras.length > 12 || new Set(p.extras).size !== p.extras.length || !p.extras.every((key: string) => PLACES.some(place => place.key === key))) return fallback;
    route = expandedRoute(route, p);
    const nums = (a: unknown, size: number, max: number) => Array.isArray(a) && a.length === size && a.every(n => Number.isFinite(n) && n >= 0 && n <= max);
    if (!Array.isArray(p.road) || p.road.length !== p.days || !p.road.every((v: unknown) => v === null || typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1440) || ![1, 2, 3].includes(p.days) || !nums(p.stopDays, route.stops.length, p.days) || p.stopDays.some((v: number) => v < 1 || !Number.isInteger(v)) || !(p.ceiling === null || typeof p.ceiling === 'number' && Number.isFinite(p.ceiling) && p.ceiling >= 0 && p.ceiling <= 100000) || p.version !== 1 || !['selected', 'required'].every(k => Array.isArray(p[k]) && p[k].length === route.stops.length && p[k].every((v: unknown) => typeof v === 'boolean')) || !nums(p.minutes, route.stops.length, 720) || !nums([p.hours, p.start, p.deadline, p.people], 4, 24) || p.people < 1 || !Number.isInteger(p.people) || p.hours < 1 || p.start >= p.deadline || !Array.isArray(p.costs) || p.costs.length !== 5 || !p.costs.every((v: unknown) => v === null || typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100000)) return fallback;
    return { ...p, selected: p.selected.map((v: boolean, i: number) => v || p.required[i]), minutes: p.minutes.map((v: number, i: number) => Math.max(v, route.stops[i].durationMinutesEstimate)) };
  } catch { return fallback; }
}
export function dayMinutes(route: Route, plan: Plan, day: number) {
  // Keep the upper original driving estimate: there is no verified road-leg dataset.
  return (plan.road[day - 1] ?? Math.ceil(route.driveMinutes[1] / plan.days)) + 90 + route.stops.reduce((sum, stop, i) => sum + (plan.stopDays[i] === day && plan.selected[i] ? plan.minutes[i] : 0), 0);
}
export function fitPlan(route: Route, plan: Plan): Plan {
  if (plan.road.some(v => v === null)) return plan;
  const next = { ...plan, selected: [...plan.selected] };
  const limit = Math.min(plan.hours, plan.deadline - plan.start) * 60;
  for (let day = 1; day <= plan.days; day++) {
    const candidates = route.stops.map((stop, i) => ({ stop, i })).filter(({ i }) => plan.stopDays[i] === day && next.selected[i] && !next.required[i]).sort((a, b) => plan.minutes[b.i] - plan.minutes[a.i]);
    for (const { i } of candidates) {
      if (dayMinutes(route, next, day) <= limit) break;
      if (route.stops.filter((s, j) => plan.stopDays[j] === day && next.selected[j]).length > 1) next.selected[i] = false;
    }
  }
  return next;
}
export function budget(plan: Plan) {
  const total = plan.costs.reduce<number>((sum, cost, i) => sum + (cost ?? 0) * (i === 1 || i === 2 ? plan.people : 1), 0);
  return { total, perPerson: total / plan.people, unknown: plan.costs.filter(v => v === null).length };
}
export function clockLabel(minutes: number) { minutes = Math.round(minutes); return `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${Math.round(minutes % 60).toString().padStart(2, '0')}`; }

export function changeDays(plan: Plan, days: number): Plan {
  if (days === plan.days || ![1, 2, 3].includes(days)) return plan;
  return { ...plan, days, road: Array.from({ length: days }, () => null), stopDays: plan.stopDays.map(d => Math.min(d, days)), costs: plan.costs.map((v, i) => i === 3 ? days === 1 ? 0 : null : v) };
}

export const PLACES = ROUTES.flatMap(route => route.stops.map((stop, index) => ({ key: `${route.id}:${index}`, stop, routeTitle: route.title })));
export function expandedRoute(route: Route, plan: Pick<Plan, 'extras'>): Route {
  return { ...route, stops: [...route.stops, ...plan.extras.flatMap(key => { const found = PLACES.find(place => place.key === key); return found ? [found.stop] : []; })] };
}
export function addPlace(plan: Plan, key: string): Plan {
  const place = PLACES.find(p => p.key === key);
  if (!place || plan.extras.includes(key) || plan.extras.length >= 12) return plan;
  return { ...plan, extras: [...plan.extras, key], selected: [...plan.selected, true], required: [...plan.required, false], minutes: [...plan.minutes, place.stop.durationMinutesEstimate], stopDays: [...plan.stopDays, plan.days], road: plan.road.map(() => null) };
}
