import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { ROUTES } from '../src/model';
import { cafeMapsUrl, routeCafes } from '../src/cafes';
import photos from '../src/gallery-photos.json';
import galleries from '../src/gallery-routes.json';

test('each trip has three distinct, sourced lunch suggestions and geographically qualified map links', () => {
  for (const route of ROUTES) {
    const { places, note } = routeCafes(route);
    assert.equal(places.length, 3, route.id);
    assert.equal(new Set(places.map(place => place.id)).size, 3, route.id);
    assert.ok(note.length > 0);
    for (const place of places) {
      assert.equal(new URL(place.sourceUrl).protocol, 'https:');
      assert.equal(place.checkedAt, '2026-10-08');
      assert.ok(place.description && place.locality);
      const url = new URL(cafeMapsUrl(place));
      assert.equal(url.origin, 'https://www.google.com');
      assert.equal(url.pathname, '/maps/search/');
      assert.equal(url.searchParams.get('api'), '1');
      assert.equal(url.searchParams.get('query'), place.mapQuery);
      assert.match(place.mapQuery, /, .+, Georgia$/);
    }
  }
});

test('each gallery has additional local photos with attribution and no duplicate sources', () => {
  for (const route of ROUTES) {
    const ids = galleries[route.id as keyof typeof galleries];
    assert.ok(ids.length >= 1, route.id);
    const sources = new Set([route.photo.sourceUrl]);
    for (const id of ids) {
      const photo = photos[id as keyof typeof photos];
      assert.ok(photo, `${route.id}: ${id}`);
      assert.ok(existsSync(new URL(`../assets/photos/gallery/${id}.jpg`, import.meta.url)));
      assert.ok(photo.caption && photo.credit && photo.license);
      assert.equal(new URL(photo.licenseUrl).protocol, 'https:');
      assert.ok(!sources.has(photo.sourceUrl), `${route.id}: duplicate photo`);
      sources.add(photo.sourceUrl);
    }
  }
});

test('remote lunch suggestions explain extra driving, including the shortened forest trip', () => {
  for (const id of ['sabaduri-sioni', 'bateti-lake', 'kojori-fortress', 'asureti']) {
    assert.match(routeCafes({ id }).note, /заезд|дополнительн|увеличить/i);
  }
  assert.ok(routeCafes({ id: 'sabaduri-sioni' }).places.every(place => !/Sioni/.test(place.mapQuery)));
  assert.deepEqual(routeCafes({ id: 'missing-route' }).places, []);
});
