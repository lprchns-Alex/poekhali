import data from './cafes.json';
import type { Route } from './model';

export type Cafe = (typeof data.places)[keyof typeof data.places];
export function routeCafes(route: Pick<Route, 'id'>): { places: Cafe[]; note: string } {
  const key = data.routes[route.id as keyof typeof data.routes];
  const group = key ? data.groups[key as keyof typeof data.groups] : undefined;
  return {
    places: group?.placeIds.map(id => data.places[id as keyof typeof data.places]).filter(Boolean) ?? [],
    note: group?.note ?? 'Найди кафе рядом с остановками на картах.',
  };
}
export function cafeMapsUrl(cafe: Cafe): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafe.mapQuery)}`;
}
