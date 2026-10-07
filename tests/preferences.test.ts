import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePreferences } from '../src/preferences';

const now = new Date('2026-10-07T12:00:00Z');
test('old saved preferences migrate without losing routes or meal choice', () => {
  const state = parsePreferences(JSON.stringify({ saved: ['ananuri', 'unknown', 'ananuri'], date: '2026-10-10', meal: 'picnic', theme: 'dark' }), now);
  assert.deepEqual(state.saved, ['ananuri']);
  assert.equal(state.meal, 'picnic');
  assert.equal(state.theme, 'dark');
  assert.equal(state.filters.days, 1);
});
test('two-day settings survive reload and impossible hour combinations are repaired', () => {
  const state = parsePreferences(JSON.stringify({ filters: { days: 2, maxHours: 6, easyOnly: 'false', mood: 'anything' } }), now);
  assert.deepEqual(state.filters, { days: 2, maxHours: 48, easyOnly: false, mood: 'Все' });
  const valid = parsePreferences(JSON.stringify({ ...state, filters: { days: 2, maxHours: 36, easyOnly: true, mood: 'Город' } }), now);
  assert.deepEqual(valid.filters, { days: 2, maxHours: 36, easyOnly: true, mood: 'Город' });
});
test('past and impossible persisted dates cannot poison the calendar or forecast', () => {
  for (const date of ['2027-02-31', '2026-10-06', 'not-a-date']) assert.equal(parsePreferences(JSON.stringify({ date }), now).date, '2026-10-10');
  assert.throws(() => parsePreferences('{corrupt', now));
});
