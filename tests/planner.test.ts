import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES } from '../src/model';
import { budget, dayMinutes, fitPlan, newPlan, parsePlan } from '../src/planner';
import { mapQuery, mapSearch } from '../src/maps';
const route = ROUTES.find(r => r.stops.length >= 2 && r.days === 1)!;
test('fit preserves mandatory places and minimum visits', () => {
  const p = newPlan(route); p.hours = 1; p.required[0] = true;
  const next = fitPlan(route, p);
  assert.equal(next.selected[0], true);
  assert.deepEqual(next.minutes, p.minutes);
  assert.ok(next.selected.some(Boolean));
});
test('removing visits never invents driving savings', () => {
  const p = newPlan(route); const before = dayMinutes(route, p, 1);
  p.selected[0] = false;
  assert.equal(before - dayMinutes(route, p, 1), p.minutes[0]);
});
test('budget separates per-person and shared costs, unknown is explicit', () => {
  const p = newPlan(route); p.people = 3; p.costs = [100, 20, null, 0, 10];
  assert.deepEqual(budget(p), { total: 170, perPerson: 170 / 3, unknown: 1 });
});
test('saved plan rejects corrupt and out-of-range inputs', () => {
  const p = newPlan(route);
  assert.deepEqual(parsePlan('{oops', route), p);
  assert.deepEqual(parsePlan(JSON.stringify({ ...p, people: 0 }), route), p);
  assert.deepEqual(parsePlan(JSON.stringify({ ...p, costs: [-1, 0, 0, 0, 0] }), route), p);
  assert.deepEqual(parsePlan(JSON.stringify(p), route), p);
});
test('map choices preserve qualified place name and cannot intercept unrelated hosts', () => {
  const q = 'Cafe & Wine, Tbilisi, Georgia';
  assert.equal(mapQuery(mapSearch(q, 'google')), q);
  assert.equal(new URL(mapSearch(q, 'yandex')).searchParams.get('text'), q);
  assert.equal(mapQuery('https://evilgoogle.com/maps?query=no'), null);
});

test('extra places and multi-day drafts round-trip and require road review', async () => {
  const { addPlace, changeDays, expandedRoute, PLACES } = await import('../src/planner');
  const extra = PLACES.find(p => !route.stops.some(s => s.mapSearchQuery === p.stop.mapSearchQuery))!;
  const p = addPlace(changeDays(newPlan(route), 3), extra.key);
  assert.equal(p.days, 3);
  assert.equal(p.stopDays.at(-1), 3);
  assert.ok(p.road.every(v => v === null));
  assert.equal(expandedRoute(route, p).stops.length, route.stops.length + 1);
  assert.deepEqual(parsePlan(JSON.stringify(p), route), p);
  assert.deepEqual(fitPlan(expandedRoute(route, p), p), p);
  const short = changeDays(p, 1);
  assert.ok(short.stopDays.every(d => d === 1));
  assert.equal(short.selected.length, p.selected.length);
});
