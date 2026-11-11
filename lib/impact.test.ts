import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulateImpact, syntheticPatients, simulateOutcomes } from './impact.ts';
import type { Hospital } from './types.ts';

const base: Hospital = {
  id: 'X', name: 'Test', district: '', lat: 21.57, lng: 39.16, facility_type: 'hospital', has_ed: true,
  specialties: ['emergency_medicine'], available_doctors: 8, total_capacity: 40, current_occupancy: 10,
  wait_minutes: 30, treatment_minutes: 60, operational_status: 'open', updated_at: new Date().toISOString(),
} as Hospital;

const HOSPITALS: Hospital[] = [
  { ...base, id: 'ED-near-busy', lat: 21.565, lng: 39.155, wait_minutes: 120, specialties: ['emergency_medicine', 'cardiology'] },
  { ...base, id: 'ED-far-quiet', lat: 21.62, lng: 39.2, wait_minutes: 15, specialties: ['emergency_medicine', 'orthopedics', 'pediatrics'] },
  { ...base, id: 'PC-a', facility_type: 'primary_care', has_ed: false, lat: 21.54, lng: 39.165, wait_minutes: 45, specialties: ['family_medicine'] },
  { ...base, id: 'PC-b', facility_type: 'primary_care', has_ed: false, lat: 21.59, lng: 39.23, wait_minutes: 15, specialties: ['family_medicine', 'pediatrics'] },
];

test('synthetic patients are deterministic for a given seed and never emergencies', () => {
  const a = syntheticPatients(50, 7);
  const b = syntheticPatients(50, 7);
  assert.deepEqual(a, b);
  assert.equal(a.length, 50);
  assert.ok(a.every((p) => p.pathway !== ('emergency_assistance' as string) && p.urgency !== ('emergency' as string)));
  assert.ok(a.some((p) => p.pathway === 'primary_care') && a.some((p) => p.pathway === 'emergency_department'));
});

test('impact simulation compares the recommendation with the nearest suitable facility', () => {
  const s = simulateImpact(HOSPITALS, 100);
  assert.equal(s.patients, 100);
  assert.equal(s.matched, 100);
  // The baseline is the nearest suitable facility, so time saved equals the difference of the two averages (within rounding).
  assert.ok(Math.abs(s.avgMinutesSaved - (s.avgTimeToCareNearest - s.avgTimeToCareRecommended)) <= 1);
  assert.ok(s.avgMinutesSaved > 0, 'avoiding a 120-minute ED wait should save time on average');
  for (const p of [s.pctNotNearest, s.pctAvoidedLongWait, s.pctSpecialtyMatch]) assert.ok(p >= 0 && p <= 100);
});

test('each outcome only uses facilities that fit the patient pathway', () => {
  for (const o of simulateOutcomes(HOSPITALS, syntheticPatients(40, 3))) {
    const want = o.patient.pathway === 'primary_care' ? 'primary_care' : 'hospital';
    assert.equal(o.recommended.hospital.facility_type, want);
    assert.equal(o.nearest.hospital.facility_type, want);
  }
});

test('no facilities means no matched patients and zeroed statistics', () => {
  const s = simulateImpact([], 20);
  assert.equal(s.matched, 0);
  assert.equal(s.avgMinutesSaved, 0);
});
