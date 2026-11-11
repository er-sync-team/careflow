# CareFlow - Smart Emergency Routing

**The Right Care. The Right Place. The Right Time.**
Team ER Sync - hackathon MVP. All patients, facilities and accounts are synthetic.

CareFlow takes a simulated patient through a guided assessment, applies deterministic safety rules, selects a care
pathway, ranks eligible facilities with a transparent weighted score, and re-ranks live when hospital administrators
update their operational data.

> CareFlow is a demonstration prototype. It does not diagnose, is not clinically validated, and makes no claim to
> reduce mortality or waiting times. In an emergency call 997.

## Quick links for judges

| What | Link |
| --- | --- |
| Live site | `https://careflow-er-sync.netlify.app` |
| Scenario A - emergency warning | `https://careflow-er-sync.netlify.app/assess?demo=emergency` |
| Scenario B - facility matching | `https://careflow-er-sync.netlify.app/assess?demo=matching` |
| Demo Mode (live A/B/C re-ranking) | `https://careflow-er-sync.netlify.app/demo` |
| Hospital dashboard | `https://careflow-er-sync.netlify.app/admin` |
| Impact simulation (100 synthetic patients) | `https://careflow-er-sync.netlify.app/demo#impact` |
| How we tested | `https://careflow-er-sync.netlify.app/testing` |

**Hospital dashboard logins** (synthetic accounts): `admin.h01@careflow-demo.test` ... `admin.h08@careflow-demo.test`,
password `CareFlowDemo2026!`. Hospital B (Safa) is `admin.h06@careflow-demo.test`.
After testing, press **Reset demo data** in Facility settings so the next judge sees the expected results.

The interface is available in **English and Arabic** (language switch in the header).

---

## Stack

- Next.js 13 (App Router), TypeScript, Tailwind CSS, shadcn/ui, lucide-react
- Supabase: Postgres, Row Level Security, Realtime, email/password Auth (administrators only)
- Leaflet + OpenStreetMap for the interactive map
- Server-side AI symptom extraction from free text in Arabic or English (`/api/extract`): Google Gemini (`GEMINI_API_KEY`, free tier) or OpenAI (`OPENAI_API_KEY`) as a fallback. The deterministic rules always run first; AI can only add symptoms, never remove a warning sign
- Bilingual UI (English / Arabic, right-to-left) with a cookie-based language switch

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page with Demo Mode entry |
| `/assess` | Guided assessment, screening results, recommendations, map, facility selection |
| `/assess?demo=emergency` / `?demo=matching` | Assessment with Scenario A / B suggested answers |
| `/demo` | Demo Mode hub: scenarios, live Hospital A/B/C re-ranking, demo credentials |
| `/admin` | Administrator sign in / sign up, facility dashboard, case details, facility settings |
| `/testing` | How we tested: what, how, results, fixed issues and what is not tested yet |

## Setup

```bash
cp .env.example .env      # fill in your Supabase URL and anon key
npm install
npm run dev
```

### Database

Migrations live in `supabase/migrations/` and should be applied in filename order:

1. `create_careflow_schema` - tables `hospitals`, `hospital_admins`, `cases`; RLS policies; `claim_demo_facility` function; realtime
2. `seed_careflow_demo_data` - 8 fictional Jeddah facilities (H01-H08) and synthetic cases
3. `tighten_table_privileges` - minimum column-level grants
4. `align_demo_facilities_section10` - places Hospitals A/B/C at 5/9/7 km from the demo patient
5. `grant_anon_case_insert` - lets patients without an account submit an incoming case
6. `add_arabic_facility_names` - Arabic names for the demo facilities

### Demo administrator accounts

Create one Supabase Auth user per facility (email confirmation off), sign in once, and claim the facility from the
dashboard (or call `claim_demo_facility('H0x')`). The provisioned demo project already has:

| Facility | Email | Password |
| --- | --- | --- |
| H01 - H08 | `admin.h01@careflow-demo.test` ... `admin.h08@careflow-demo.test` | `CareFlowDemo2026!` |

Hospital A = H08 (Hamra), Hospital B = H06 (Safa), Hospital C = H07 (Salamah).
The admin login screen has a "Fill demo login" helper.

### Deployment (Netlify)

`netlify.toml` uses `@netlify/plugin-nextjs`. Connect the repository and set these environment variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public anon key (access is enforced by RLS) |
| `GEMINI_API_KEY` | recommended | Free key from https://aistudio.google.com/apikey - server-side only |
| `GEMINI_MODEL` | no | Defaults to `gemini-2.5-flash-lite` |
| `OPENAI_API_KEY` | no | Used only if no Gemini key is set |

Without an AI key the app still works: symptoms are recognised by the built-in Arabic and English keyword rules.

## Security model

- Patients never sign in. They can read facility data and insert a case (status forced to `incoming`, never synthetic).
  They cannot read, update or delete any case.
- Each administrator is linked to exactly one facility. RLS lets them update only that facility, and column grants
  limit them to operational fields (specialties, doctors, capacity, occupancy, wait, treatment time, status).
  Name, location, type and ED flag are read-only. They can read and update (status/timeline only) only their facility's cases.
- No secrets reach the browser. The optional AI key is used only by a server route.

## Matching algorithm (`lib/matching.ts`)

1. **Safety first.** `lib/triage/engine.ts` checks fixed warning-sign rules (e.g. severe chest pain, stroke signs,
   severe breathing difficulty) before anything else. If any fire, urgency is *Emergency*: the app shows 997
   instructions and an ambulance call button and **skips facility ranking entirely**.
2. **Pathway.** Otherwise urgency (high / moderate / low) maps to *Emergency Department* or *Primary Care*, plus a suggested service.
3. **Eligibility filters** (applied before scoring). A facility is excluded, with a stated reason, if it is:
   closed; missing usable operational data; full; for the ED pathway without an ED or diverting; for the primary
   care pathway not a primary care facility.
4. **Factors** (each 0-1):
   - Travel: `1 - ETA / 60`
   - Time to care: `1 - (ETA + wait) / 240`
   - Capacity: `1 - occupancy / capacity`
   - Specialty: 1 if the suggested service is offered, else 0
   - Staffing: `doctors / 10` (capped at 1)
5. **Weights by urgency**

   | Urgency | Travel | Time to care | Capacity | Specialty | Staffing |
   | --- | --- | --- | --- | --- | --- |
   | High | 15% | 45% | 15% | 20% | 5% |
   | Moderate | 10% | 45% | 15% | 20% | 10% |
   | Low | 10% | 45% | 20% | 15% | 10% |

   Score = weighted sum x 100. Facilities with *limited* status get x0.9. Every card explains its factors.
6. **Simulated ETA:** straight-line distance x 1.35 road factor, at 32 km/h, plus 3 minutes. Clearly labeled as simulated; not live traffic.

### Worked example (Demo Mode)

Patient in Al-Rawdah, primary care. Initially A (5 km, 45 min), B (9 km, 15 min), C (7 km, 75 min) ranks **B, A, C**,
because B's total time to care is shortest. After Hospital B's admin sets its wait to 100 minutes, the ranking is
recomputed from the database as **A, C, B**. The patient screen and `/demo` update via Realtime, and both have a
"Refresh" button as a fallback.

## Demo walkthrough

1. **Scenario A:** Landing -> Demo Mode -> Run Scenario A. Accept the suggested answers. Severe chest pain triggers the
   emergency screen immediately: call 997, no hospital comparison.
2. **Scenario B:** Run Scenario B and accept the suggested answers. See the Primary Care pathway and its reasons,
   the ranked facility cards, the map and excluded facilities. Select a facility.
3. The confirmation screen shows which dashboard received the case and its demo login. Open it in a new tab: the
   case appears under Incoming with a live notification. Open it to see details and the timeline.
4. In Facility settings, change waiting time or capacity and save. Back on the patient tab, choose "Back to live
   recommendations": a toast confirms the re-rank. `/demo` shows the A/B/C before and after table.
5. Reset with **Reset demo data** in Facility settings (or set Hospital B's wait back to 15).

## Tests

```bash
npm test         # matching, triage and case-creation logic (node --test)
npm run test:db  # access control against the live Supabase project (needs .env)
```

Covered: emergency warning activation, eligibility filtering, score calculation, ranking change after wait and
capacity updates (including the A/B/C example), unavailable data handling, unauthorized admin changes (other
facility, protected columns, anonymous), case read isolation, forged case status, and correct incoming case creation.

## Features

- English and Arabic interface (RTL), including Arabic symptom descriptions
- Conversational assessment with disclaimers, demo answer helper, red flags rechecked after every answer
- AI-assisted symptom extraction from free text (Gemini), always backed by deterministic safety rules
- Emergency rules for chest pain, stroke signs, breathing difficulty, loss of consciousness, seizures, heavy bleeding and poisoning/overdose
- "Time saved" comparison: minutes to care at the recommended facility vs the nearest suitable one
- One-click **Reset demo data** for each facility
- **Impact simulation** on `/demo`: 100 synthetic patients through the real algorithm vs going to the nearest suitable facility
- **How we tested** page (`/testing`): methods, results, issues found and fixed, and what is not tested yet
- **Share my location** on the emergency screen: Google Maps link via WhatsApp or SMS
- **Voice input** for symptoms in Arabic or English (browsers with speech recognition, e.g. Chrome and Edge)
- **Vision and roadmap** section with a QR code on the landing page
- Deterministic four-level urgency and three pathways
- Eligibility-first weighted matching with explanations and excluded-facility reasons
- Comparison cards, interactive map, directions link
- Incoming cases with timeline; admin dashboard with KPIs, filters, case details and status updates
- Facility settings editor with validation; real-time re-ranking and manual refresh
- Demo Mode with Scenario A, Scenario B and the live A/B/C panel, plus a local "what-if" simulator (not saved)

## Limitations

- ETAs are simulated from straight-line distance; no live traffic or routing.
- Safety rules and weights are illustrative and not clinically validated.
- Location is chosen from preset Jeddah districts rather than device GPS.
- All facilities, cases and accounts are synthetic. Do not enter real health information.
- Any new sign-up can claim a facility that has no administrator yet (by design for the demo); production would need an approval step.
- Demo admin credentials are intentionally public so judges can test the dashboard.
- No patient accounts or notifications; the patient's view of a case ends at the confirmation screen.

---

## Team ER Sync

| Name | Role |
| --- | --- |
| Sultan | Team Leader |
| Retal | Designer |
| Hamza | Developer |
| Talia | Presenter |
| Mohammed | Presenter |
