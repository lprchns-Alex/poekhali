import assert from 'node:assert/strict';
import test from 'node:test';
import { ROUTES, addDays, tbilisiToday } from '../src/model';
import { fetchRouteWeather, readWeatherPoint, weatherAdvice, weatherSummary } from '../src/services/weather';

test('missing or invalid measurements remain unknown rather than zero', () => {
  const point = readWeatherPoint({ hourly: { time: ['2026-10-10T11:00'], temperature_2m: [null], precipitation_probability: [0], wind_speed_10m: ['4'] } }, '2026-10-10', 11, 'Сабадури');
  assert.equal(point.temperatureC, null);
  assert.equal(point.rainProbability, 0);
  assert.equal(point.windKmh, null);
  assert.equal(weatherSummary(point), 'Прогноз недоступен');
});

test('forecast selects the intended local date and hour', () => {
  const point = readWeatherPoint({ hourly: { time: ['2026-10-10T11:00', '2026-10-10T15:00'], temperature_2m: [12, 18], weather_code: [0, 61] } }, '2026-10-10', 15, 'Сиони');
  assert.equal(point.temperatureC, 18);
  assert.equal(weatherSummary(point), 'Возможен дождь');
});

test('dates outside forecast horizon do not produce a fabricated forecast', async () => {
  const result = await fetchRouteWeather(ROUTES[0], addDays(tbilisiToday(), 30));
  assert.equal(result.status, 'out_of_range');
  assert.equal(result.points.length, 0);
});

test('unavailable weather does not suggest that travel conditions are good', () => {
  assert.equal(weatherAdvice({ status: 'unavailable', date: '2026-10-10', points: [], updatedAt: null }), null);
});
