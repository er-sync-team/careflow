/*
# Add Arabic facility names

1. Purpose
- Supports the Arabic version of CareFlow by storing an Arabic name and district for every demo facility.

2. Modified Tables
- `hospitals`
  - `name_ar` (text, not null, default '') - Arabic facility name
  - `district_ar` (text, not null, default '') - Arabic district name

3. Security
- No policy changes. The existing table-level SELECT grant already lets everyone read these columns.
- Admin UPDATE grants are column-limited and do NOT include these columns, so facility admins cannot rename facilities.

4. Data
- Fills Arabic names for the 8 synthetic facilities (H01-H08). Existing English values are untouched.
*/

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS name_ar text NOT NULL DEFAULT '';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS district_ar text NOT NULL DEFAULT '';

UPDATE hospitals SET name_ar = v.name_ar, district_ar = v.district_ar
FROM (VALUES
  ('H01', 'مركز الكورنيش الساحلي الطبي', 'الشاطئ'),
  ('H02', 'مستشفى الروضة الموحد', 'الروضة'),
  ('H03', 'مستشفى النهضة للأطفال والأسرة', 'النهضة'),
  ('H04', 'مستشفى مرتفعات أبحر العام', 'أبحر الشمالية'),
  ('H05', 'مستشفى البلد التراثي', 'البلد'),
  ('H06', 'مركز الصفا للرعاية الأولية', 'الصفا'),
  ('H07', 'عيادة السلامة للأسرة', 'السلامة'),
  ('H08', 'مركز الحمراء الصحي المجتمعي', 'الحمراء')
) AS v(id, name_ar, district_ar)
WHERE hospitals.id = v.id;
