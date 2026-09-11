# BookOnTime Holiday System

## Purpose

Holiday information provides booking context. It must not turn BookOnTime into a general holiday calendar.

Support:
- national public holidays
- state/regional public holidays
- major regional festivals
- long-weekend detection

Default country: India.  
Default timezone: Asia/Kolkata.

Users may configure primary and additional regions/states.

## Runtime architecture

Version 1 should not depend on a holiday API at runtime.

Generate local static JSON during development/build and ship it with the app.

Suggested paths:

- `public/data/holidays/IN/2026.json`
- `public/data/holidays/IN/2027.json`
- `public/data/holidays/IN/states/TN-2026.json`
- `public/data/holidays/IN/states/KA-2026.json`

Create `scripts/generate-holidays.ts` to generate baseline data for the current year plus the next 2–3 years using a maintained holiday-data source/library.

Support official/manual override data so corrections can take precedence over generated baseline records.

Recommended record fields:
- date
- name
- country
- region
- type
- national/regional
- source
- tentative status when relevant

## UI locations

Holiday context can appear in:
- Add Reminder after a target date is selected
- Reminder Details
- Booking Opening Calendar
- Dashboard/reminder cards when relevant
- Settings → Holidays

Example:

**Pongal — Tamil Nadu**  
Regional Public Holiday

## Long weekends

Calculate them from holiday data plus configured weekend days. Do not store all long weekends manually.

Examples:
- Friday holiday + Saturday + Sunday
- Saturday + Sunday + Monday holiday

Show neutral context such as:

**3-day long weekend detected**  
Travel demand may be higher.

Never state that tickets will definitely sell out or fabricate demand predictions.

## Performance

Load only the holiday data needed for the active year/regions rather than every state file at startup.

## Caveat

Some movable holidays can change based on official declarations. The UI should allow tentative/revised status and encourage verification where appropriate.
