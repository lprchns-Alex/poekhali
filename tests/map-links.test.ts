import assert from 'node:assert/strict';
import test from 'node:test';
import { foodSearchUrl, placeSearchUrl, ROUTES } from '../src/model';

const forestRoute = ROUTES.find(route => route.id === 'sabaduri-sioni')!;

test('Sabaduri link identifies the forest near Tbilisi independently of its short display name', () => {
  const stop = forestRoute.stops[0];
  const url = new URL(placeSearchUrl(stop));
  assert.equal(url.searchParams.get('query'), 'Sabaduri Forest, Tbilisi National Park, Georgia');
  assert.equal(placeSearchUrl({ ...stop, name: 'Лес на день' }), url.href);
});

test('every stop has a geographically qualified Maps search, without routing to overview coordinates', () => {
  for (const stop of ROUTES.flatMap(route => route.stops)) {
    const url = new URL(placeSearchUrl(stop));
    assert.equal(url.origin, 'https://www.google.com');
    assert.equal(url.pathname, '/maps/search/');
    assert.equal(url.searchParams.get('api'), '1');
    const query = url.searchParams.get('query')!;
    assert.match(query, /, .+, Georgia$/);
    assert.notEqual(query, `${stop.name} Georgia`);
    assert.notEqual(query, `${stop.latitude},${stop.longitude}`);
    assert.equal(url.searchParams.has('dir_action'), false);
    assert.doesNotMatch(query, /parking|entrance/i);
  }
  const canyon = ROUTES.find(route => route.id === 'dashbashi')!.stops[0];
  assert.match(new URL(placeSearchUrl(canyon)).searchParams.get('query')!, /Dashbashi Canyon, Tsalka/);
  const ananuri = ROUTES.find(route => route.id === 'ananuri')!;
  assert.equal(placeSearchUrl(ananuri.stops[0]), placeSearchUrl(ananuri.stops[1]));
});

test('food search follows the retained destination for the shortened forest trip', () => {
  const full = new URL(foodSearchUrl(forestRoute)).searchParams.get('query')!;
  const short = new URL(foodSearchUrl(forestRoute, true)).searchParams.get('query')!;
  assert.match(full, /Sioni Reservoir, Mtskheta-Mtianeti, Georgia/);
  assert.match(short, /restaurants near Sabaduri Forest, Tbilisi National Park, Georgia/);
  assert.doesNotMatch(short, /Sioni/);
  const other = ROUTES.find(route => route.id === 'mtskheta-jvari')!;
  assert.equal(foodSearchUrl(other, true), foodSearchUrl(other));
});
