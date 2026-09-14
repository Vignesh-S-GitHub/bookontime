# Version 1 implementation

BookOnTime is a static React/TypeScript/Vite PWA. All records live in IndexedDB in the browser origin. It has no backend, account, payment integration, analytics, or provider automation.

## Development

Appearance is locked to the supplied white/blue/navy palette and Inter following the user's September 12 clarification. Old backups may contain other theme values; these remain readable but cannot override the visual lock. The header frames the original supplied logo directly, preserving its artwork.

Use Node.js 24 LTS or newer and npm. Run `npm ci`, then `npm run dev` and open the printed `/bookontime/` URL. `npm run preview` serves a production build. Run `npm run typecheck`, `npm test`, `npm run format:check`, `npm audit --audit-level=high`, and `npm run build` before release. Exact dependencies are locked in `package-lock.json`.

On a restricted Windows host where the default command shell cannot spawn, the equivalent checks are `node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/vitest/vitest.mjs run --configLoader native --pool threads`, and `node node_modules/vite/bin/vite.js build --configLoader native`. If Vite's Windows drive discovery cannot start the default shell, set the process-local `ComSpec` to an available PowerShell executable. This does not alter system settings. Node's native TypeScript support runs the asset and holiday scripts without a transpiler.

## Structure

- `src/domain.ts`: schemas, models, default rules, date engine, alerts, statuses and formatting.
- `src/storage.ts`: validated backup loading, atomic IndexedDB mutations and merge semantics.
- `src/holidays.ts`: static dataset loading, region filtering and dynamically calculated long weekends.
- `src/calendar-export.ts`: UTF-8-safe RFC 5545 line folding, escaped ICS events/alarms, Google Calendar links and file downloads.
- `src/notifications.ts`: permission-gated display, service-worker delivery and due-alert deduplication.
- Page components implement dashboard, reminders, creation/edit/duplicate, details, calendar, rules, groups and settings. Shared accessible controls and the supplied branding are in `src/ui.tsx` and `src/styles.css`.

## Date semantics

`bookingOpeningAt` and `alertAt` are instants. `targetDate` is a calendar date string; optional `targetAt` exists only when the user supplies a target time. Temporal performs calendar calculations in the reminder's IANA timezone, so UTC conversion cannot silently shift an entered calendar date.

For a 60-day rule excluding the target, subtract 60 calendar days. Including the target counts it as day 1 and subtracts 59 days. Zero stays on the same date. Days/weeks/months use calendar arithmetic; month subtraction clamps to month end. Hours/minutes require a target time and subtract elapsed time. Nonexistent or ambiguous daylight-saving wall times are rejected for the user to clarify.

Recurring rules select the next matching occurrence at or after the reminder's creation reference. A reminder tracks one opening, not an infinite series; duplicate for subsequent releases. Editing preserves the reference, and duplication starts a new reference. Periodic releases choose a day in the target month minus the configured number of months, clamping day 29–31 to the release month's last day. Each reminder keeps its own rule snapshot. Editing a preset does not silently change saved reminders.

Future openings within seven days show Booking Soon; same-local-day openings show Opens Today. Once the instant passes, Booking Open persists until the user resolves it. Target dates never automatically delete or expire records.

## Holiday maintenance

Run `npm run holidays -- 2026` (or omit the year for the current year) to generate India national baseline and the library's 35 state/region datasets for four years. Runtime loads only selected regions/years. `date-holidays` is a build-time dependency; there is no holiday API call from the app. It provides partial baseline coverage, not every officially declared holiday. Selected major Tamil festivals augment it. All generated baseline dates and future projections are marked tentative; individually checked official overrides can be non-tentative.

Edit `scripts/holiday-overrides.json` before regeneration. Each record contains date, name, country, region, type, scope, source URL, and tentative status. A matching date/name/region overrides the baseline; `remove: true` suppresses a record. To move a holiday, remove its former date and add its corrected record. Do not automatically carry dated overrides into future years. Confirm movable festivals and local declarations against official announcements before release. Dataset coverage is recorded in `public/data/holidays/coverage.json`.

Sources: [date-holidays](https://github.com/commenthol/date-holidays), [Chennai central-government 2026 holidays](https://gstchennai.gov.in/wp-content/uploads/2025/12/CGEWCC-letter-dated-05.12.2025-regarding-List-of-Holiday-2026.pdf), and dated [Drik Panchang festival projections](https://www.drikpanchang.com/hindu-festivals/diwali/diwali.html). Each override retains its specific source URL. Long weekends derive from public-holiday dates plus user-selected weekend days; observances alone do not count as days off.

## Storage, backup and privacy

All core records/settings are stored together in the `bookontime` IndexedDB database. Mutations read and write in a transaction to avoid lost updates across simultaneous saves. Import validates the entire schema, duplicate IDs, group references, URL schemes, timezones, date/rule consistency and limits before presenting merge/replace confirmation. Merge lets incoming IDs replace matching records while keeping current settings; replace uses the complete backup. Derived alert/target instants are reconstructed. A typed DELETE confirmation is required for resetting data.

No provider credentials or payment fields exist. Users should not enter sensitive information in booking notes. Exported JSON and calendar files contain booking details; share them intentionally. Browser storage can be cleared by the browser or user, so export backups periodically. Origin-specific storage does not transfer automatically between localhost and GitHub Pages.

## Offline, notifications and updates

The production worker precaches every application route chunk, the HTML shell, fonts and supplied icons. Holiday files are cached on first use, including before the worker controls the initial page. Offline reminder CRUD, rule calculations, groups, settings and exports work locally. Unloaded region/year data and external booking sites require a connection. The UI reports missing holiday data rather than inventing it.

Only Enable Notifications requests permission. While open, the app checks due alerts every 15 seconds, with a two-minute catch-up window; delivered alerts are deduplicated in IndexedDB. The browser may suspend a background tab, and a fully closed static PWA cannot reliably wake at an arbitrary time. Single/all-upcoming ICS exports with alarms and Google Calendar links provide the calendar fallback. Actual notification appearance and installation prompts vary by browser/OS.

An available worker update prompts the user to save any form and choose Update now. Installation uses `beforeinstallprompt` when supported, otherwise browser-specific instructions. Icons are resized from the approved supplied logo by `npm run assets`.

## GitHub Pages release

After building, run `npm run verify:build` to check the deployed base path, manifest, icon dimensions and referenced HTML/CSS/font assets. Both GitHub workflows run this check. The deployment workflow runs the full quality gate before publishing.

Set repository Settings → Pages → Source to GitHub Actions. The Pages workflow publishes `dist` after a push to `main` or manual dispatch. Pull requests run checks without publishing. The entire app is scoped to `/bookontime/`, uses hash navigation, and needs no server route fallback. Its URL will be `https://Vignesh-S-GitHub.github.io/bookontime/` after a successful deployment. A configured workflow is not evidence of a live deployment.

## Future considerations

Expand officially verified regional festival coverage and device-specific installation/notification testing. No extra product features are introduced by this implementation.
