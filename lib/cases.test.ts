import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIncomingCase, makeAlias } from './cases.ts';
import { matchFacilities, type MatchResult } from './matching.ts';
import { evaluateTriage } from './triage/engine.ts';
import { DEMO_SCENARIOS } from './demo-scenarios.ts';
import type { Hospital } from './types';

const clinic: Hospital = {
  id: 'P1',
  name: 'Test Clinic',
  district: '',
  lat: 21.57,
  lng: 39.16,
  facility_type: 'primary_care',
  has_ed: false,
  specialties: ['family_medicine'],
  available_doctors: 4,
  total_capacity: 20,
  current_occupancy: 5,
  wait_minutes: 20,
  treatment_minutes: 20,
  operational_status: 'open',
  updated_at: '',
};

const draft = DEMO_SCENARIOS.matching.answers;
const triage = evaluateTriage(draft);

function topMatch(): MatchResult {
  const out = matchFacilities([clinic], { ...triage, origin: { lat: 21.56, lng: 39.16 } });
  if (out.mode !== 'ranked') throw new Error('expected ranking');
  return out.ranked[0];
}

test('builds an incoming case that satisfies the database rules', () => {
  const now = new Date('2026-01-01T10:00:00Z');
  const row = buildIncomingCase(draft, triage, topMatch(), 'Patient #TEST', now);
  assert.equal(row.hospital_id, 'P1');
  assert.equal(row.urgency, 'moderate');
  assert.equal(row.pathway, 'primary_care');
  assert.deepEqual(row.symptoms, ['high_fever', 'cough']);
  assert.ok(row.match_score >= 0 && row.match_score <= 100);
  assert.deepEqual(
    row.timeline.map((t) => t.status),
    ['assessed', 'incoming'],
  );
  assert.equal(row.timeline[0].at, now.toISOString());
  assert.ok(!('status' in row) && !('is_synthetic' in row), 'status and synthetic flag are set by the database');
  assert.ok(row.screening_summary.length <= 2000);
});

test('emergency cases are never routed to a facility', () => {
  const emergency = evaluateTriage(DEMO_SCENARIOS.emergency.answers);
  assert.throws(() => buildIncomingCase(DEMO_SCENARIOS.emergency.answers, emergency, topMatch(), 'Patient #X'));
});

test('cases cannot be routed to an ineligible facility', () => {
  assert.throws(() => buildIncomingCase(draft, triage, { ...topMatch(), eligible: false }, 'Patient #X'));
});

test('aliases are anonymous and short', () => {
  const alias = makeAlias(() => 0);
  assert.equal(alias, 'Patient #AAAA');
  assert.ok(alias.length <= 40);
});
