import { test } from 'node:test';
import assert from 'node:assert/strict';
import { locationMessage, mapsLink, smsUrl, whatsappUrl } from './share-location.ts';

const p = { lat: 21.5630123, lng: 39.1520456 };

test('maps link points at the exact coordinates', () => {
  assert.equal(mapsLink(p), 'https://maps.google.com/?q=21.563012,39.152046');
});

test('message includes the maps link in both languages, plus accuracy when known', () => {
  assert.ok(locationMessage(p, 'en', 18.4).includes(mapsLink(p)) && locationMessage(p, 'en', 18.4).includes('18 m'));
  assert.ok(locationMessage(p, 'ar').includes(mapsLink(p)) && locationMessage(p, 'ar').includes('997'));
});

test('share links encode the message safely', () => {
  const text = locationMessage(p, 'ar');
  assert.equal(decodeURIComponent(whatsappUrl(text).split('text=')[1]), text);
  assert.ok(smsUrl(text).startsWith('sms:?&body='));
});
