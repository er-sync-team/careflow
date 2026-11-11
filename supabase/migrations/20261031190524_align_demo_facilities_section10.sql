/*
# Align primary care demo facilities with the dynamic re-ranking scenario

1. Purpose
- Makes the "Hospital A / B / C" re-ranking demonstration reproducible from migrations.
- Measured from the Al-Rawdah demo origin (21.5630, 39.1520):
  - H08 Hamra (Hospital A): 5 km, 45 minute wait
  - H06 Safa (Hospital B): 9 km, 15 minute wait
  - H07 Salamah (Hospital C): 7 km, 75 minute wait

2. Modified Tables
- `hospitals`: updates coordinates, wait, occupancy, doctors, status and specialties for H06, H07, H08 only.

3. Security
- No changes to RLS, policies or grants.

4. Notes
- Data is synthetic. Demo admin accounts are created via Supabase Auth and linked through claim_demo_facility; no credentials are stored here.
*/

UPDATE hospitals SET lat = 21.52074, lng = 39.16853, wait_minutes = 45, current_occupancy = 8, total_capacity = 20,
  available_doctors = 4, operational_status = 'open', specialties = ARRAY['family_medicine','internal_medicine']
WHERE id = 'H08';

UPDATE hospitals SET lat = 21.59066, lng = 39.2338, wait_minutes = 15, current_occupancy = 8, total_capacity = 20,
  available_doctors = 4, operational_status = 'open', specialties = ARRAY['family_medicine','pediatrics']
WHERE id = 'H06';

UPDATE hospitals SET lat = 21.62215, lng = 39.17516, wait_minutes = 75, current_occupancy = 8, total_capacity = 20,
  available_doctors = 4, operational_status = 'open', specialties = ARRAY['family_medicine','dermatology','ent']
WHERE id = 'H07';
