import type { Hospital } from './types';

export type OperationalFields = Pick<
  Hospital,
  'wait_minutes' | 'treatment_minutes' | 'total_capacity' | 'current_occupancy' | 'available_doctors' | 'specialties' | 'operational_status'
>;

/**
 * Starting operational values of the synthetic demo facilities, as seeded by
 * supabase/migrations (seed_careflow_demo_data + align_demo_facilities_section10).
 * Used by the "Reset demo data" button so judges can restore a facility after testing.
 */
export const DEMO_BASELINE: Record<string, OperationalFields> = {
  H01: { specialties: ['emergency_medicine', 'cardiology', 'neurology', 'internal_medicine', 'pulmonology', 'general_surgery'], available_doctors: 14, total_capacity: 60, current_occupancy: 41, wait_minutes: 35, treatment_minutes: 90, operational_status: 'open' },
  H02: { specialties: ['emergency_medicine', 'orthopedics', 'general_surgery', 'internal_medicine', 'pediatrics'], available_doctors: 9, total_capacity: 45, current_occupancy: 40, wait_minutes: 70, treatment_minutes: 80, operational_status: 'open' },
  H03: { specialties: ['emergency_medicine', 'pediatrics', 'obstetrics', 'internal_medicine'], available_doctors: 11, total_capacity: 40, current_occupancy: 22, wait_minutes: 25, treatment_minutes: 70, operational_status: 'open' },
  H04: { specialties: ['emergency_medicine', 'cardiology', 'orthopedics', 'neurology', 'pulmonology'], available_doctors: 12, total_capacity: 50, current_occupancy: 18, wait_minutes: 15, treatment_minutes: 85, operational_status: 'open' },
  H05: { specialties: ['emergency_medicine', 'internal_medicine', 'general_surgery', 'obstetrics'], available_doctors: 6, total_capacity: 35, current_occupancy: 33, wait_minutes: 95, treatment_minutes: 75, operational_status: 'limited' },
  H06: { specialties: ['family_medicine', 'pediatrics'], available_doctors: 4, total_capacity: 20, current_occupancy: 8, wait_minutes: 15, treatment_minutes: 25, operational_status: 'open' },
  H07: { specialties: ['family_medicine', 'dermatology', 'ent'], available_doctors: 4, total_capacity: 20, current_occupancy: 8, wait_minutes: 75, treatment_minutes: 20, operational_status: 'open' },
  H08: { specialties: ['family_medicine', 'internal_medicine'], available_doctors: 4, total_capacity: 20, current_occupancy: 8, wait_minutes: 45, treatment_minutes: 25, operational_status: 'open' },
};
