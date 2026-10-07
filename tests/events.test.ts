import assert from 'node:assert/strict';
import test from 'node:test';
import { TRIP_EVENTS, eventsForDates, eventsForTrip, filterEvents, upcomingEvents, type TripEvent } from '../src/events';

const today = '2026-10-07';
const festival = TRIP_EVENTS.find(event => event.id === 'jazz-wine-kakheti-2026')!;

test('event search finds names, locations and categories, ignoring case and outer whitespace', () => {
  assert.deepEqual(filterEvents(TRIP_EVENTS, '  JAZZ  ').map(event => event.id), [festival.id]);
  assert.deepEqual(filterEvents(TRIP_EVENTS, 'МЦХЕТА').map(event => event.id), ['kitesa-cooking']);
  assert.deepEqual(filterEvents(TRIP_EVENTS, 'еда').map(event => event.id), ['kitesa-cooking', 'pheasants-tears-tasting']);
  assert.deepEqual(filterEvents(TRIP_EVENTS, 'несуществующее событие'), []);
  assert.deepEqual(filterEvents(TRIP_EVENTS, '  '), TRIP_EVENTS);
});

test('search preserves exact-date and upcoming groups without reintroducing seasonal activities', () => {
  const selection = eventsForDates('2026-10-09', 1, today);
  assert.deepEqual(filterEvents(selection.dated, 'jazz'), []);
  assert.deepEqual(filterEvents(upcomingEvents(today), 'jazz').map(event => event.id), [festival.id]);
  assert.deepEqual(filterEvents(eventsForDates('2026-11-01', 1, today).byArrangement, 'рафтинг'), []);
});

test('a festival on the second calendar day is included in global trip-date discovery', () => {
  assert.equal(eventsForDates('2026-10-09', 1, today).dated.length, 0);
  assert.deepEqual(eventsForDates('2026-10-09', 2, today).dated.map(event => event.id), [festival.id]);
  assert.deepEqual(eventsForDates('2026-10-10', 1, today).dated.map(event => event.id), [festival.id]);
});

test('route event matching respects the day when the itinerary visits the venue', () => {
  assert.equal(eventsForTrip('kakheti-weekend', '2026-10-09', 2, today).dated.length, 0);
  assert.deepEqual(eventsForTrip('kakheti-weekend', '2026-10-10', 2, today).dated.map(event => event.id), [festival.id]);
  assert.equal(eventsForTrip('sighnaghi-bodbe', '2026-10-10', 1, today).dated.length, 0);
  assert.equal(eventsForTrip('removed-route', '2026-10-10', 2, today).byArrangement.length, 0);
});

test('activities never appear as confirmed dated events and have separate booking semantics', () => {
  const matches = eventsForTrip('mtskheta-jvari', '2026-10-10', 1, today);
  assert.equal(matches.dated.length, 0);
  assert.deepEqual(matches.byArrangement.map(event => event.id), ['kitesa-cooking']);
  assert.ok(matches.byArrangement.every(event => event.schedule.kind === 'by_arrangement'));
});

test('past and unconfirmed festival dates cannot be returned as an exact-date recommendation', () => {
  assert.equal(eventsForDates('2026-10-10', 1, '2026-10-11').dated.length, 0);
  assert.equal(upcomingEvents('2026-10-11').length, 0);
  const unconfirmed: TripEvent = { ...festival, schedule: { kind: 'dated', startDate: '2026-10-10', endDate: '2026-10-10', confirmed: false } };
  assert.equal(eventsForDates('2026-10-10', 1, today, [unconfirmed]).dated.length, 0);
  assert.equal(upcomingEvents(today, 5, [unconfirmed]).length, 0);
});

test('multi-day festivals overlap the trip inclusively, even across year boundaries', () => {
  const newYear: TripEvent = { ...festival, schedule: { kind: 'dated', startDate: '2026-12-31', endDate: '2027-01-02', confirmed: true } };
  assert.equal(eventsForDates('2026-12-30', 2, today, [newYear]).dated.length, 1);
  assert.equal(eventsForDates('2027-01-02', 1, today, [newYear]).dated.length, 1);
  assert.equal(eventsForDates('2027-01-03', 1, today, [newYear]).dated.length, 0);
});

test('seasonal activity is absent in winter but can match the second day at a season boundary', () => {
  assert.equal(eventsForTrip('ananuri', '2026-11-01', 1, today).byArrangement.length, 0);
  assert.equal(eventsForTrip('ananuri', '2026-10-10', 1, today).byArrangement.length, 1);
  assert.equal(eventsForTrip('ananuri', '2027-03-31', 2, today).byArrangement.length, 1);
});

test('invalid calendar dates fail closed instead of overflowing to a different month', () => {
  for (const date of ['2026-02-30', '2026-13-10', '', '2026-1-01']) {
    assert.deepEqual(eventsForDates(date, 2, today), { dated: [], byArrangement: [] });
    assert.deepEqual(eventsForTrip('kakheti-weekend', date, 2, today), { dated: [], byArrangement: [] });
    assert.deepEqual(upcomingEvents(date), []);
  }
});

test('catalog entries retain evidence, booking links and distinct stable IDs', () => {
  assert.equal(new Set(TRIP_EVENTS.map(event => event.id)).size, TRIP_EVENTS.length);
  for (const event of TRIP_EVENTS) {
    assert.equal(new URL(event.sourceUrl).protocol, 'https:');
    assert.equal(new URL(event.bookingUrl).protocol, 'https:');
    assert.match(event.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(event.routeIds.length);
    assert.ok(event.bookingNote.length);
  }
});
