/*
# Tighten table privileges to least privilege

1. Problem
- The platform's default privileges gave the public (anon) and signed-in (authenticated) roles
  full table-level rights (INSERT, UPDATE, DELETE, TRUNCATE, ...) on every CareFlow table.
  Table-level UPDATE overrides the intended column-level grants, so a facility administrator
  could change protected columns (e.g. facility name or location) of their own facility.

2. Security changes
- Revoke ALL privileges on `hospitals`, `hospital_admins` and `cases` from anon and authenticated.
- Re-grant only what the app uses:
  - `hospitals`: SELECT for everyone; UPDATE of operational columns only for authenticated
    (row access still limited by the "Admins update own facility" policy).
  - `hospital_admins`: SELECT for authenticated (own row via policy). Rows are created only by
    the `claim_demo_facility` function.
  - `cases`: INSERT of patient-supplied columns for anon + authenticated (policy forces
    status = 'incoming' and is_synthetic = false); SELECT and UPDATE (status, timeline only)
    for authenticated facility admins via policies.
- No DELETE or TRUNCATE for any client role.

3. Important Notes
  1. No data is changed by this migration.
  2. RLS policies are unchanged.
*/

REVOKE ALL ON hospitals FROM anon, authenticated;
REVOKE ALL ON hospital_admins FROM anon, authenticated;
REVOKE ALL ON cases FROM anon, authenticated;

GRANT SELECT ON hospitals TO anon, authenticated;
GRANT UPDATE (specialties, available_doctors, total_capacity, current_occupancy, wait_minutes, treatment_minutes, operational_status) ON hospitals TO authenticated;

GRANT SELECT ON hospital_admins TO authenticated;

GRANT INSERT (patient_alias, age, sex, symptoms, description, severity, onset, history, red_flags, urgency, pathway, specialty, screening_summary, hospital_id, distance_km, eta_minutes, match_score, timeline) ON cases TO anon, authenticated;
GRANT SELECT ON cases TO authenticated;
GRANT UPDATE (status, timeline) ON cases TO authenticated;
