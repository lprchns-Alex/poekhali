import assert from 'node:assert/strict';
import test from 'node:test';
import { ROUTES, addDays, tbilisiToday, type Route } from '../src/model';
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
  assert.equal(point.date, '2026-10-10');
  assert.equal(point.day, 1);
  assert.equal(weatherSummary(point), 'Возможен дождь');
});

test('a missing intended hour does not silently use another time', () => {
  const point = readWeatherPoint({ hourly: { time: ['2026-10-10T11:00'], temperature_2m: [18] } }, '2026-10-10', 15, 'Сиони');
  assert.equal(point.temperatureC, null);
});

test('impossible probabilities, negative wind and unknown weather codes stay unknown', () => {
  const point = readWeatherPoint({ hourly: { time: ['2026-10-10T11:00'], temperature_2m: [12], precipitation_probability: [110], wind_speed_10m: [-7], weather_code: [999] } }, '2026-10-10', 11, 'Сабадури');
  assert.equal(point.rainProbability, null);
  assert.equal(point.windKmh, null);
  assert.equal(point.code, null);
  assert.equal(weatherSummary(point), 'Прогноз на время остановки');
});

test('dates outside forecast horizon do not produce a fabricated forecast', async () => {
  const result = await fetchRouteWeather(ROUTES[0], addDays(tbilisiToday(), 30));
  assert.equal(result.status, 'out_of_range');
  assert.equal(result.points.length, 0);
});

test('unavailable weather does not suggest that travel conditions are good', () => {
  assert.equal(weatherAdvice({ status: 'unavailable', date: '2026-10-10', points: [], updatedAt: null }), null);
});

let nextLocation = 0;
function routeForWeather(days: number[] = [1]): Route {
  const location = ++nextLocation;
  return {
    ...ROUTES[0],
    days: Math.max(...days),
    stops: days.map((day, index) => ({ ...ROUTES[0].stops[0], name: `Остановка ${index + 1}`, day, latitude: 40 + location / 100 + index / 1000, longitude: 44 })),
  };
}

function forecastResponse(input: unknown, temperature = 18) {
  const params = new URL(String(input)).searchParams;
  assert.equal(params.has('forecast_days'), false, 'Open-Meteo rejects forecast_days together with explicit start/end dates');
  const date = params.get('start_date');
  return Response.json({ hourly: { time: [`${date}T11:00`, `${date}T15:00`], temperature_2m: [temperature, temperature + 1], weather_code: [0, 2], precipitation_probability: [0, 10], wind_speed_10m: [4, 5] } });
}

test('two-day trips request each stop on its own date, with times restarting each day', async t => {
  const requests: URL[] = [];
  t.mock.method(globalThis, 'fetch', async (input: unknown) => {
    requests.push(new URL(String(input)));
    return forecastResponse(input);
  });
  const date = tbilisiToday();
  const result = await fetchRouteWeather(routeForWeather([1, 1, 2, 2]), date);
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.points.map(point => [point.date, point.day, point.hour]), [[date, 1, 11], [date, 1, 15], [addDays(date, 1), 2, 11], [addDays(date, 1), 2, 15]]);
  assert.deepEqual(requests.map(url => url.searchParams.get('start_date')), [date, date, addDays(date, 1), addDays(date, 1)]);
  assert.ok(requests.every(url => url.searchParams.get('timezone') === 'Asia/Tbilisi' && url.searchParams.get('end_date') === url.searchParams.get('start_date')));
});

test('the last available forecast day remains useful when the second trip day is outside the horizon', async t => {
  const requests: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input: unknown) => {
    requests.push(String(input));
    return forecastResponse(input);
  });
  const date = addDays(tbilisiToday(), 15);
  const result = await fetchRouteWeather(routeForWeather([1, 2]), date);
  assert.equal(result.status, 'ready');
  assert.equal(requests.length, 1);
  assert.equal(result.points[0].temperatureC, 18);
  assert.equal(result.points[1].temperatureC, null);
  assert.equal(result.points[1].date, addDays(date, 1));
  assert.match(result.message ?? '', /второй день/);
});

test('past and malformed trip dates never trigger network requests', async t => {
  const request = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected request'); });
  for (const date of [addDays(tbilisiToday(), -1), '2026-02-31', 'not-a-date']) {
    assert.equal((await fetchRouteWeather(routeForWeather(), date)).status, 'out_of_range');
  }
  assert.equal(request.mock.callCount(), 0);
});

test('one failed stop preserves the other forecast and its stop order', async t => {
  const route = routeForWeather([1, 1]);
  t.mock.method(globalThis, 'fetch', async (input: unknown) => new URL(String(input)).searchParams.get('latitude') === String(route.stops[0].latitude) ? new Response(null, { status: 503 }) : forecastResponse(input));
  const result = await fetchRouteWeather(route, tbilisiToday());
  assert.equal(result.status, 'ready');
  assert.equal(result.points[0].stopName, route.stops[0].name);
  assert.equal(result.points[0].temperatureC, null);
  assert.equal(result.points[1].temperatureC, 19);
  assert.match(result.message ?? '', /части остановок/);
});

test('malformed responses are unavailable and can recover without waiting for cache expiry', async t => {
  let attempts = 0;
  t.mock.method(globalThis, 'fetch', async (input: unknown) => ++attempts === 1 ? Response.json(null) : forecastResponse(input));
  const route = routeForWeather();
  const date = tbilisiToday();
  assert.equal((await fetchRouteWeather(route, date)).status, 'unavailable');
  assert.equal((await fetchRouteWeather(route, date)).status, 'ready');
  assert.equal(attempts, 2);
});

test('simultaneous cards share an in-flight weather request for the same place and date', async t => {
  const request = t.mock.method(globalThis, 'fetch', async (input: unknown) => forecastResponse(input));
  const route = routeForWeather();
  const [first, second] = await Promise.all([fetchRouteWeather(route, tbilisiToday()), fetchRouteWeather(route, tbilisiToday())]);
  assert.equal(request.mock.callCount(), 1);
  assert.deepEqual(first.points, second.points);
  assert.equal(first.status, 'ready');
});

test('manual refresh recovers a cached response that lacked the intended forecast hour', async t => {
  let attempts = 0;
  t.mock.method(globalThis, 'fetch', async (input: unknown) => ++attempts === 1 ? Response.json({ hourly: { time: [], temperature_2m: [] } }) : forecastResponse(input, 21));
  const route = routeForWeather();
  const date = tbilisiToday();
  assert.equal((await fetchRouteWeather(route, date)).status, 'unavailable');
  assert.equal((await fetchRouteWeather(route, date)).status, 'unavailable');
  const refreshed = await fetchRouteWeather(route, date, false, true);
  assert.equal(refreshed.status, 'ready');
  assert.equal(refreshed.points[0].temperatureC, 21);
  assert.equal(attempts, 2);
});

test('an older failed request does not erase a successful manual refresh', async t => {
  const pending: { input: unknown; resolve: (response: Response) => void }[] = [];
  const request = t.mock.method(globalThis, 'fetch', (input: unknown) => new Promise<Response>(resolve => pending.push({ input, resolve })));
  const route = routeForWeather();
  const date = tbilisiToday();
  const older = fetchRouteWeather(route, date);
  const newer = fetchRouteWeather(route, date, false, true);
  pending[1].resolve(forecastResponse(pending[1].input, 23));
  assert.equal((await newer).points[0].temperatureC, 23);
  pending[0].resolve(new Response(null, { status: 503 }));
  assert.equal((await older).status, 'unavailable');
  assert.equal((await fetchRouteWeather(route, date)).points[0].temperatureC, 23);
  assert.equal(request.mock.callCount(), 2);
});

test('short trips request only the retained stop', async t => {
  const request = t.mock.method(globalThis, 'fetch', async (input: unknown) => forecastResponse(input));
  const result = await fetchRouteWeather(routeForWeather([1, 1]), tbilisiToday(), true);
  assert.equal(result.points.length, 1);
  assert.equal(request.mock.callCount(), 1);
});
