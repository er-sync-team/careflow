import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchFacilities, eligibilityIssues, simulatedEtaMinutes, timeSavedVsNearest, WEIGHT_PROFILES } from './matching.ts';
import type { Hospital } from './types';

const origin = { lat: 21.56, lng: 39.16 };

function hospital(overrides: Partial<Hospital>): Hospital {
  return {
    id: 'X',
    name: 'Test',
    district: '',
    lat: 21.57,
    lng: 39.16,
    facility_type: 'hospital',
    has_ed: true,
    specialties: ['emergency_medicine', 'cardiology'],
    available_doctors: 10,
    total_capacity: 50,
    current_occupancy: 20,
    wait_minutes: 30,
    treatment_minutes: 60,
    operational_status: 'open',
    updated_at: '',
    ...overrides,
  };
}

const edRequest = { urgency: 'high' as const, pathway: 'emergency_department' as const, specialty: 'cardiology', origin };

test('emergency pathway never produces a ranking', () => {
  const out = matchFacilities([hospital({})], { ...edRequest, urgency: 'emergency', pathway: 'emergency_assistance' });
  assert.equal(out.mode, 'emergency');
  assert.equal(out.ranked.length, 0);
});

test('facility without an ED is excluded from ED pathway even with zero wait', () => {
  const noEd = hospital({ id: 'A', has_ed: false, wait_minutes: 0, facility_type: 'primary_care' });
  const out = matchFacilities([noEd, hospital({ id: 'B', wait_minutes: 120 })], edRequest);
  assert.equal(out.mode, 'ranked');
  if (out.mode !== 'ranked') return;
  assert.deepEqual(out.ranked.map((r) => r.hospital.id), ['B']);
  assert.ok(out.excluded[0].exclusionReasons.includes('No emergency department'));
});

test('diverting, closed and full facilities are excluded', () => {
  assert.ok(eligibilityIssues(hospital({ operational_status: 'diverting' }), 'emergency_department').length > 0);
  assert.ok(eligibilityIssues(hospital({ operational_status: 'closed' }), 'emergency_department').length > 0);
  assert.ok(eligibilityIssues(hospital({ current_occupancy: 50 }), 'emergency_department').length > 0);
});

test('primary care pathway only matches primary care facilities', () => {
  const out = matchFacilities(
    [hospital({ id: 'H' }), hospital({ id: 'P', facility_type: 'primary_care', has_ed: false, specialties: ['family_medicine'] })],
    { urgency: 'low', pathway: 'primary_care', specialty: 'family_medicine', origin },
  );
  if (out.mode !== 'ranked') throw new Error('expected ranking');
  assert.deepEqual(out.ranked.map((r) => r.hospital.id), ['P']);
});

test('ranking responds to waiting time changes', () => {
  const a = hospital({ id: 'A', wait_minutes: 20 });
  const b = hospital({ id: 'B', wait_minutes: 90 });
  const first = matchFacilities([a, b], edRequest);
  const second = matchFacilities([{ ...a, wait_minutes: 150 }, b], edRequest);
  if (first.mode !== 'ranked' || second.mode !== 'ranked') throw new Error('expected ranking');
  assert.equal(first.ranked[0].hospital.id, 'A');
  assert.equal(second.ranked[0].hospital.id, 'B');
});

test('scores are bounded 0-100 and weights sum to 1', () => {
  for (const w of Object.values(WEIGHT_PROFILES)) {
    const sum = Object.values(w).reduce((x, y) => x + y, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9);
  }
  const out = matchFacilities([hospital({ wait_minutes: 0, current_occupancy: 0, lat: origin.lat, lng: origin.lng })], edRequest);
  if (out.mode !== 'ranked') throw new Error('expected ranking');
  assert.ok(out.ranked[0].score <= 100 && out.ranked[0].score >= 0);
});

test('simulated ETA grows with distance', () => {
  assert.ok(simulatedEtaMinutes(10) > simulatedEtaMinutes(2));
});

const KM_PER_DEG_LAT = (Math.PI / 180) * 6371;
const atKm = (id: string, km: number, wait: number) =>
  hospital({ id, lat: origin.lat + km / KM_PER_DEG_LAT, lng: origin.lng, wait_minutes: wait, facility_type: 'primary_care', has_ed: false, specialties: ['family_medicine'] });
const stableRequest = { urgency: 'moderate' as const, pathway: 'primary_care' as const, specialty: 'family_medicine', origin };
const order = (out: ReturnType<typeof matchFacilities>) => (out.mode === 'ranked' ? out.ranked.map((r) => r.hospital.id) : []);

test('section 10 demo: B (9 km, 15 min) ranks first, then drops when its wait becomes 100 min', () => {
  const a = atKm('A', 5, 45);
  const b = atKm('B', 9, 15);
  const c = atKm('C', 7, 75);
  for (const urgency of ['moderate', 'high'] as const) {
    assert.deepEqual(order(matchFacilities([a, b, c], { ...stableRequest, urgency })), ['B', 'A', 'C'], urgency);
    assert.deepEqual(order(matchFacilities([a, { ...b, wait_minutes: 100 }, c], { ...stableRequest, urgency })), ['A', 'C', 'B'], urgency);
  }
});

test('score is the weighted sum of factor points', () => {
  const out = matchFacilities([atKm('A', 5, 45)], stableRequest);
  if (out.mode !== 'ranked') throw new Error('expected ranking');
  const r = out.ranked[0];
  const sum = r.factors.reduce((s, f) => s + f.weight * f.value * 100, 0);
  assert.equal(r.score, Math.round(sum));
  const ttc = r.factors.find((f) => f.key === 'timeToCare')!;
  assert.ok(Math.abs(ttc.value - (1 - (r.etaMinutes + 45) / 240)) < 1e-9);
});

test('ranking changes after a capacity update, and a full facility is excluded', () => {
  const a = hospital({ id: 'A', current_occupancy: 10 });
  const b = hospital({ id: 'B', current_occupancy: 15 });
  assert.deepEqual(order(matchFacilities([a, b], edRequest)), ['A', 'B']);
  assert.deepEqual(order(matchFacilities([{ ...a, current_occupancy: 48 }, b], edRequest)), ['B', 'A']);
  const full = matchFacilities([{ ...a, current_occupancy: 50 }, b], edRequest);
  assert.deepEqual(order(full), ['B']);
  if (full.mode === 'ranked') assert.ok(full.excluded[0].exclusionReasons.includes('No available capacity'));
});

test('facilities with missing or invalid operational data are excluded, not ranked', () => {
  const broken = [
    hospital({ id: 'N1', wait_minutes: null as unknown as number }),
    hospital({ id: 'N2', total_capacity: 0 }),
    hospital({ id: 'N3', current_occupancy: Number.NaN }),
    hospital({ id: 'N4', specialties: undefined as unknown as string[] }),
  ];
  const out = matchFacilities([...broken, hospital({ id: 'OK' })], edRequest);
  if (out.mode !== 'ranked') throw new Error('expected ranking');
  assert.deepEqual(order(out), ['OK']);
  assert.equal(out.excluded.length, 4);
  for (const r of out.excluded) {
    assert.equal(r.score, 0);
    assert.ok(r.exclusionReasons[0].startsWith('Operational data unavailable'));
  }
});

test('no facilities at all yields an empty ranking instead of an error', () => {
  assert.deepEqual(order(matchFacilities([], edRequest)), []);
});

test('time saved: recommending B (9 km, 15 min wait) over nearest A (5 km, 45 min wait) saves time to care', () => {
  const out = matchFacilities([atKm('A', 5, 45), atKm('B', 9, 15), atKm('C', 7, 75)], stableRequest);
  if (out.mode !== 'ranked') throw new Error('expected ranking');
  const saved = timeSavedVsNearest(out.ranked);
  assert.ok(saved);
  assert.equal(saved.best.hospital.id, 'B');
  assert.equal(saved.nearest.hospital.id, 'A');
  assert.equal(saved.savedMinutes, Math.round(saved.nearest.totalTimeMinutes - saved.best.totalTimeMinutes));
  assert.ok(saved.savedMinutes > 0);
});

test('time saved is not shown when the nearest suitable facility is already the recommendation', () => {
  const out = matchFacilities([atKm('A', 5, 10), atKm('B', 9, 60)], stableRequest);
  if (out.mode !== 'ranked') throw new Error('expected ranking');
  assert.equal(timeSavedVsNearest(out.ranked), null);
});
