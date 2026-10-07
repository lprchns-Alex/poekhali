import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_FILTERS, ROUTES, addDays, filterRoutes, getTripHours, nextSaturday, tbilisiToday, validSavedIds } from '../src/model';

test('date is based on Georgia timezone rather than host timezone', () => {
  assert.equal(tbilisiToday(new Date('2026-10-06T21:00:00Z')), '2026-10-07');
  assert.equal(nextSaturday(new Date('2026-10-10T09:00:00Z')), '2026-10-10');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('time filter respects the full upper estimate and combines with mood and walking', () => {
  const results = filterRoutes({ mood: 'История', maxHours: 7, easyOnly: true });
  assert.deepEqual(results.map(route => route.id), ['mtskheta-jvari', 'ananuri']);
  assert.equal(filterRoutes({ ...DEFAULT_FILTERS, maxHours: 3 }).length, 0);
});

test('search finds place names, regardless of whitespace or case', () => {
  assert.deepEqual(filterRoutes(DEFAULT_FILTERS, '  ДЖВАРИ  ').map(route => route.id), ['mtskheta-jvari']);
});

test('meal adjustment and short route adjustment compose without losing the estimate range', () => {
  const route = ROUTES.find(item => item.id === 'sabaduri-sioni')!;
  assert.deepEqual(getTripHours(route, 'picnic'), [7, 9]);
  assert.deepEqual(getTripHours(route, 'cafe', true), [4.5, 6.5]);
});

test('persisted saved routes discard unknown IDs, duplicates, and invalid structures', () => {
  assert.deepEqual(validSavedIds(['ananuri', 'removed-route', 'ananuri', 4]), ['ananuri']);
  assert.deepEqual(validSavedIds({ route: 'ananuri' }), []);
});
