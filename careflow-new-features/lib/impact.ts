import { matchFacilities, type MatchResult } from './matching.ts';
import { DEMO_LOCATIONS } from './geo.ts';
import type { Hospital, LatLng, Pathway, Urgency } from './types.ts';

/** One synthetic patient used by the impact simulation. */
export interface SimPatient {
  origin: LatLng;
  locationId: string;
  pathway: Exclude<Pathway, 'emergency_assistance'>;
  urgency: Exclude<Urgency, 'emergency'>;
  specialty: string;
}

export interface ImpactSummary {
  patients: number;
  /** Patients for whom at least one eligible facility existed. */
  matched: number;
  /** Mean of (time to care at nearest suitable facility - time to care at recommended facility), minutes. */
  avgMinutesSaved: number;
  /** Total minutes saved across all matched patients. */
  totalMinutesSaved: number;
  /** % of matched patients whose recommendation is NOT simply the nearest suitable facility. */
  pctNotNearest: number;
  /** % of matched patients steered away from a nearest facility with a wait of 60+ minutes. */
  pctAvoidedLongWait: number;
  /** % of matched patients whose recommended facility offers the suggested service. */
  pctSpecialtyMatch: number;
  avgTimeToCareNearest: number;
  avgTimeToCareRecommended: number;
}

/** Small deterministic PRNG (mulberry32) so the same seed always produces the same patients. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PRIMARY_SERVICES = ['family_medicine', 'family_medicine', 'pediatrics', 'internal_medicine', 'dermatology', 'ent'];
const ED_SERVICES = ['emergency_medicine', 'cardiology', 'orthopedics', 'pulmonology', 'neurology', 'general_surgery', 'pediatrics', 'obstetrics', 'internal_medicine'];

/** Generates synthetic, non-emergency patients spread around the Jeddah demo districts. */
export function syntheticPatients(count: number, seed = 2026): SimPatient[] {
  const r = rng(seed);
  const pick = <T,>(list: T[]) => list[Math.floor(r() * list.length)];
  const out: SimPatient[] = [];
  for (let i = 0; i < count; i++) {
    const loc = pick(DEMO_LOCATIONS);
    // Jitter up to ~1.5 km around the district centre.
    const origin = { lat: loc.coords.lat + (r() - 0.5) * 0.027, lng: loc.coords.lng + (r() - 0.5) * 0.029 };
    const toEd = r() < 0.45;
    out.push(
      toEd
        ? { origin, locationId: loc.id, pathway: 'emergency_department', urgency: r() < 0.6 ? 'high' : 'moderate', specialty: pick(ED_SERVICES) }
        : { origin, locationId: loc.id, pathway: 'primary_care', urgency: r() < 0.6 ? 'moderate' : 'low', specialty: pick(PRIMARY_SERVICES) },
    );
  }
  return out;
}

export interface PatientOutcome {
  patient: SimPatient;
  recommended: MatchResult;
  nearest: MatchResult;
}

export function simulateOutcomes(hospitals: Hospital[], patients: SimPatient[]): PatientOutcome[] {
  const outcomes: PatientOutcome[] = [];
  for (const patient of patients) {
    const out = matchFacilities(hospitals, patient);
    if (out.mode !== 'ranked' || out.ranked.length === 0) continue;
    const recommended = out.ranked[0];
    const nearest = out.ranked.reduce((a, b) => (b.distanceKm < a.distanceKm ? b : a));
    outcomes.push({ patient, recommended, nearest });
  }
  return outcomes;
}

const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Runs the real matching algorithm for each synthetic patient and compares the recommendation
 * with the simple baseline of going to the nearest suitable facility.
 */
export function simulateImpact(hospitals: Hospital[], count = 100, seed = 2026): ImpactSummary {
  const patients = syntheticPatients(count, seed);
  const outcomes = simulateOutcomes(hospitals, patients);
  const m = outcomes.length;
  const saved = outcomes.map((o) => o.nearest.totalTimeMinutes - o.recommended.totalTimeMinutes);
  const total = saved.reduce((a, b) => a + b, 0);
  return {
    patients: patients.length,
    matched: m,
    avgMinutesSaved: m ? round1(total / m) : 0,
    totalMinutesSaved: Math.round(total),
    pctNotNearest: pct(outcomes.filter((o) => o.recommended.hospital.id !== o.nearest.hospital.id).length, m),
    pctAvoidedLongWait: pct(outcomes.filter((o) => o.nearest.hospital.wait_minutes >= 60 && o.recommended.hospital.wait_minutes < 60).length, m),
    pctSpecialtyMatch: pct(outcomes.filter((o) => o.recommended.hasSpecialty).length, m),
    avgTimeToCareNearest: m ? Math.round(outcomes.reduce((a, o) => a + o.nearest.totalTimeMinutes, 0) / m) : 0,
    avgTimeToCareRecommended: m ? Math.round(outcomes.reduce((a, o) => a + o.recommended.totalTimeMinutes, 0) / m) : 0,
  };
}
