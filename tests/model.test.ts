import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_FILTERS, ROUTES, addDays, filterRoutes, getStopDate, getTripEndDate, getTripHours, isValidDate, nextSaturday, tbilisiToday, validSavedIds } from '../src/model';

test('date is based on Georgia timezone rather than host timezone', () => {
  assert.equal(tbilisiToday(new Date('2026-10-06T21:00:00Z')), '2026-10-07');
  assert.equal(nextSaturday(new Date('2026-10-10T09:00:00Z')), '2026-10-10');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('time filter respects the full upper estimate and combines with mood and walking', () => {
  const results = filterRoutes({ mood: 'История', days: 1, maxHours: 7, easyOnly: true });
  assert.deepEqual(results.map(route => route.id), ['mtskheta-jvari', 'ananuri']);
  assert.equal(filterRoutes({ ...DEFAULT_FILTERS, maxHours: 3 }).length, 0);
});

test('six-hour limit covers the complete trip with stops and chosen meal', () => {
  const filters = { ...DEFAULT_FILTERS, maxHours: 6 };
  assert.deepEqual(filterRoutes(filters, '', 'cafe').map(route => route.id), ['mtskheta-jvari']);
  const sevenHourFilters = { ...filters, maxHours: 6.5 };
  assert.equal(filterRoutes(sevenHourFilters, '', 'cafe').some(route => route.id === 'ananuri'), false);
  assert.equal(filterRoutes(sevenHourFilters, '', 'picnic').some(route => route.id === 'ananuri'), true);
  const nineHourFilters = { ...filters, maxHours: 9 };
  assert.equal(filterRoutes(nineHourFilters, '', 'picnic').some(route => route.id === 'sabaduri-sioni'), true);
  assert.equal(filterRoutes(nineHourFilters, '', 'cafe').some(route => route.id === 'sabaduri-sioni'), false);
});

test('two-day plans are distinct from day trips and obey combined filters', () => {
  const weekends = filterRoutes({ ...DEFAULT_FILTERS, days: 2, maxHours: 48 });
  assert.deepEqual(weekends.map(route => route.id), ['kakheti-weekend', 'kazbegi-weekend']);
  assert.equal(filterRoutes({ ...DEFAULT_FILTERS, maxHours: 48 }).every(route => route.days === 1), true);
  assert.deepEqual(filterRoutes({ ...DEFAULT_FILTERS, days: 2, maxHours: 36, mood: 'Город' }, 'Телави', 'cafe').map(route => route.id), ['kakheti-weekend']);
  assert.equal(filterRoutes({ ...DEFAULT_FILTERS, days: 2, maxHours: 6 }).length, 0);
  assert.equal(filterRoutes({ ...DEFAULT_FILTERS, days: 2, maxHours: 48, easyOnly: true }).length, 0);
});

test('search finds place names, regardless of whitespace or case', () => {
  assert.deepEqual(filterRoutes(DEFAULT_FILTERS, '  ДЖВАРИ  ').map(route => route.id), ['mtskheta-jvari']);
});

test('meal adjustment and short route adjustment compose without losing the estimate range', () => {
  const route = ROUTES.find(item => item.id === 'sabaduri-sioni')!;
  assert.deepEqual(getTripHours(route, 'picnic'), [7, 9]);
  assert.deepEqual(getTripHours(route, 'cafe', true), [4.5, 6.5]);
  const weekend = ROUTES.find(item => item.id === 'kakheti-weekend')!;
  assert.deepEqual(getTripHours(weekend, 'cafe'), [30, 36]);
  assert.deepEqual(getTripHours(weekend, 'picnic'), [29, 35]);
});

test('persisted dates reject normalization, malformed values, and non-leap dates', () => {
  for (const value of ['2026-02-31', '2026-02-29', '2026-04-31', '2026-13-01', '2026-00-10', '2026-10-00', '2026-1-01', '2026-10-07T12:00:00Z', null, 20261007]) {
    assert.equal(isValidDate(value), false, String(value));
  }
  assert.equal(isValidDate('2028-02-29'), true);
  assert.equal(isValidDate('2026-10-07'), true);
});

test('stop and return dates follow itinerary day across year and leap-day boundaries', () => {
  assert.equal(getStopDate('2026-12-31', { day: 2 }), '2027-01-01');
  assert.equal(getStopDate('2028-02-28', { day: 2 }), '2028-02-29');
  assert.equal(getTripEndDate('2026-12-31', { days: 1 }), '2026-12-31');
  assert.equal(getTripEndDate('2026-12-31', { days: 2 }), '2027-01-01');
});

test('catalogue has an ordered, non-empty itinerary for each day and overnight estimates include the night', () => {
  assert.equal(new Set(ROUTES.map(route => route.id)).size, ROUTES.length);
  for (const route of ROUTES) {
    assert.ok(route.days === 1 || route.days === 2);
    assert.deepEqual([...new Set(route.stops.map(stop => stop.day))], Array.from({ length: route.days }, (_, index) => index + 1), route.id);
    assert.ok(route.stops.every((stop, index) => index === 0 || stop.day >= route.stops[index - 1].day));
    if (route.days === 2) {
      assert.ok(route.overnight?.location);
      assert.ok(route.durationHours[0] >= 24 && route.durationHours[1] <= 48);
    } else {
      assert.equal(route.overnight, null);
      assert.ok(route.durationHours[1] < 24);
    }
  }
});

test('persisted saved routes discard unknown IDs, duplicates, and invalid structures', () => {
  assert.deepEqual(validSavedIds(['ananuri', 'removed-route', 'ananuri', 4]), ['ananuri']);
  assert.deepEqual(validSavedIds({ route: 'ananuri' }), []);
});
