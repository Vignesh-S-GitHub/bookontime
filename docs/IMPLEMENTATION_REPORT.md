# BookOnTime Version 1 verification report

Release candidate: 1.0.0. Final automated checks: September 14, 2026. Browser checks: September 11–12, 2026 against the same application implementation. 117 acceptance items are reported below. PASS identifies the evidence stated for that section; it does not imply exhaustive testing of every device or third-party provider.

## Final quality gate

- PASS — Vitest: 42 tests across four files (domain, IndexedDB, generated holiday data, notifications).
- PASS — TypeScript: no diagnostics.
- PASS — Prettier: all configured source/test/script files formatted.
- PASS — npm audit: zero known vulnerabilities, including development dependencies at check time.
- PASS — Production Vite build and PWA generation; 34 precached entries.
- PASS — Build contract: /bookontime/ manifest and start URL, actual icon dimensions, referenced HTML/CSS/font files, worker and holiday data.
- NOT APPLICABLE — Separate lint tool is not configured. TypeScript and formatting checks run in CI.

## Browser evidence

- Calculated Train reminder: December 1, 2026 target minus 60 days gives October 2, 2026 at 08:00 Asia/Kolkata. Saved record survived reload.
- Known Event / Concert opening: September 14 at 10:00 Asia/Kolkata saved without a target; ICS download and status change exercised.
- With the preview server stopped, the app reloaded, showed stored reminders and cached holidays, and duplicated a reminder. Changing its target to December 2 recalculated the opening to October 3 at 08:00 and all six alert instants; save completed offline.
- October 2 calendar selection showed the opening, Gandhi Jayanti and a computed three-day long weekend.
- Custom rule and group creation succeeded. JSON export produced a real backup file. Delete All Data showed a disabled confirmation action until the required text is entered; destructive confirmation was not executed through the browser.
- Widths checked: 360, 390, 430, 768, 1024, 1280, 1440, 1920. No document horizontal overflow in measured views. Chrome screenshots and in-app browser measurements were used; Windows scaling required compensated Chrome viewport sizes. Exact 768/1024 measurements were also taken in the in-app browser.
- Computed primary color is #2563EB, background #FAFBFF and font family Inter Variable / Inter. Supplied ticket-clock artwork is preserved. Native system dark appearance cannot change the theme.
- No application console errors were observed during the completed browser flows.

## Verification limits and operational notes

- Chrome automation could not set the backup file in the file chooser because its extension lacks file-URL access. Import schema, malformed input rejection, merge behavior and persistence are covered by automated tests and source review; a full browser file-picker import roundtrip remains a manual check.
- Notification display is covered through service-worker mocks. Actual OS notifications, install prompts and iOS/Android standalone installation require device checks. A closed static PWA cannot guarantee exact-time delivery; the product explicitly provides calendar export.
- Holiday coverage is India national baseline plus available regional entries and selected Tamil festival overrides for 2026–2029. Coverage varies, projections are marked tentative, and official local verification remains necessary.
- The build reports a non-blocking 508.53 kB main-chunk warning (154.29 kB gzip); routes are lazy loaded. This is a performance tuning opportunity, not a failed build.
- The user's explicit white/blue/Inter instruction supersedes the original System/Light/Dark preference requirement. Historical backup values remain compatible but do not affect rendering.
- GitHub upload and hosted deployment status must be verified separately after publication; the local checks alone do not establish that a hosted site is live.

## Acceptance checklist

## Product identity

Evidence: Approved assets and all application screens inspected.

- **PASS** — Product name is BookOnTime.
- **PASS** — Tagline is “Book Before It’s Late.”
- **PASS** — Approved ticket + clock identity is preserved.
- **PASS** — App is not presented as train-only.
- **PASS** — App remains focused on booking-opening moments rather than generic reminders.

## Scope guardrails

Evidence: Source, dependencies and external-link handling inspected; static-only architecture.

- **PASS** — No login/signup/profile/account system.
- **PASS** — No required backend or cloud database.
- **PASS** — No payment processing.
- **PASS** — No booking-provider credential storage.
- **PASS** — No automated ticket purchase, CAPTCHA handling, or booking-form submission.
- **PASS** — No generic bill/birthday/habit/task/notes feature set.

## Add Reminder

Evidence: Both modes exercised in browser; optional target, preview, save and reload checked; domain tests.

- **PASS** — First asks how the user knows booking time.
- **PASS** — Mode 1 calculates opening datetime from target date + configurable rule.
- **PASS** — Mode 2 accepts known opening datetime directly.
- **PASS** — Target date is optional in Mode 2.
- **PASS** — Calculation preview appears before save.
- **PASS** — Multiple alert offsets are configurable.

## Rule engine

Evidence: Domain tests for all four models; rule editor metadata inspected; custom rule saved.

- **PASS** — Relative rules supported.
- **PASS** — Fixed rules supported.
- **PASS** — Recurring rules supported.
- **PASS** — Periodic-release rules supported.
- **PASS** — Include/exclude target-day logic supported where relevant.
- **PASS** — Rule presets are editable configuration.
- **PASS** — Rule source / URL / last verified / verification status metadata supported.
- **PASS** — Rules can show Verified, Needs Verification, or Custom.

## Categories and icons

Evidence: All eleven categories inspected on dashboard/forms; custom gopuram SVG inspected.

- **PASS** — Train
- **PASS** — Bus
- **PASS** — Flight
- **PASS** — Movie
- **PASS** — Event / Concert
- **PASS** — Sports
- **PASS** — Darshan
- **PASS** — Appointment / Slot
- **PASS** — Registration
- **PASS** — Accommodation
- **PASS** — Custom
- **PASS** — Darshan icon is a Hindu temple/gopuram-style architectural icon.
- **PASS** — Icon family is visually consistent.

## Dashboard / reminders

Evidence: Browser save, reload, details, countdown and duplicate flow; status/date tests and filter source inspection.

- **PASS** — Next booking opening is prominently displayed.
- **PASS** — Live countdown is based on booking-opening datetime.
- **PASS** — Booking Open state appears after opening passes instead of auto-deleting the reminder.
- **PASS** — Search/filter/sort are available on reminders.
- **PASS** — Reminder details expose relevant opening/target/rule/alert/holiday information.
- **PASS** — Open Booking Site action only opens a user-supplied/provider URL.
- **PASS** — Duplicate reminder recalculates opening/alerts after target date change.

## Groups

Evidence: Browser group creation and reminder assignment in earlier smoke test; next-opening selection inspected.

- **PASS** — Related booking opportunities can be grouped without becoming a full itinerary planner.
- **PASS** — Group view indicates which opening occurs next.

## Calendar

Evidence: Browser selected October 2, 2026; correct reminder and 08:00 opening listed; target kept secondary.

- **PASS** — Internal calendar is primarily a Booking Opening Calendar.
- **PASS** — Booking-opening dates are marked.
- **PASS** — Selecting a day lists openings and opening times.
- **PASS** — Target/journey date remains secondary context.

## Holidays

Evidence: Generated-data tests, region settings inspection and offline browser calendar check; coverage is partial and labeled tentative.

- **PASS** — Local static holiday JSON is usable at runtime without an online API.
- **PASS** — Country and primary region/state can be configured.
- **PASS** — Additional regions can be configured.
- **PASS** — National holidays supported.
- **PASS** — Regional holidays supported.
- **PASS** — Holiday context appears where relevant in reminder creation/details/calendar.
- **PASS** — Long weekends are calculated rather than manually enumerated.
- **PASS** — Holiday messaging never guarantees scarcity or sell-out.
- **PASS** — Holiday generator/override workflow is documented.

## Notifications and calendar fallback

Evidence: Notification permission/deduplication tests; browser permission UI inspected; ICS downloaded; Google Calendar URL inspected.

- **PASS** — Notification permission is requested only from explicit user action.
- **PASS** — Permission state is visible.
- **PASS** — Test notification exists where supported.
- **PASS** — UI does not claim guaranteed exact background notification delivery for a fully closed static PWA.
- **PASS** — Single reminder can export an ICS event based on booking-opening datetime.
- **PASS** — Upcoming reminders can be exported to calendar.
- **PASS** — Google Calendar link is supported where practical.

## Storage / privacy

Evidence: IndexedDB integration tests, browser persistence/export and deletion guard, backup validation tests and source review.

- **PASS** — Core records persist locally using IndexedDB or equivalent local-first storage.
- **PASS** — JSON export works.
- **PASS** — JSON import is validated.
- **PASS** — Delete All Data requires confirmation.
- **PASS** — UI explains that reminders are stored on the device.
- **PASS** — Sensitive credentials/payment/Aadhaar data are not stored.

## PWA / offline

Evidence: Production manifest/icon contract check; service worker update and server-stopped browser reload, calendar and duplicate/save exercised.

- **PASS** — Valid web manifest.
- **PASS** — 192x192 and 512x512 app icons.
- **PASS** — Maskable icon where practical.
- **PASS** — Service worker registered.
- **PASS** — Install UI/fallback instructions provided.
- **PASS** — App shell loads offline after first successful load.
- **PASS** — Local reminders/rules/calendar/holiday calculation remain usable offline.

## GitHub Pages

Evidence: Production base-path contract check plus browser navigation/reload on /bookontime/; this validates build compatibility, not deployment status.

- **PASS** — Production build works from `/bookontime/` base path.
- **PASS** — CSS/JS/images/fonts resolve correctly.
- **PASS** — Manifest resolves correctly.
- **PASS** — Service worker scope is correct.
- **PASS** — Holiday JSON resolves correctly.
- **PASS** — Navigation/reload behavior does not depend on server-side route fallback.

## Date/time correctness

Evidence: Automated domain tests, including Temporal calculations, calendar boundaries, DST and UTC conversion.

- **PASS** — 60-day calculation covered by tests.
- **PASS** — Target-day include/exclude covered by tests.
- **PASS** — Month boundary covered.
- **PASS** — December → January covered.
- **PASS** — February covered.
- **PASS** — Leap year covered.
- **PASS** — Fixed opening covered.
- **PASS** — Recurring opening covered.
- **PASS** — Periodic release covered.
- **PASS** — Same-day/past opening covered.
- **PASS** — Asia/Kolkata behavior covered.
- **PASS** — Accidental UTC date shifting avoided.

## Design / responsive quality

Evidence: White/blue/navy and Inter computed styles inspected; all eight widths inspected with DOM overflow checks.

- **PASS** — Inter is used as primary UI typography.
- **PASS** — Approved BookOnTime palette/design language is preserved.
- **PASS** — No fake account/profile UI copied from generated mockups.
- **PASS** — 360px checked.
- **PASS** — 390px checked.
- **PASS** — 430px checked.
- **PASS** — 768px checked.
- **PASS** — 1024px checked.
- **PASS** — 1280px checked.
- **PASS** — 1440px checked.
- **PASS** — 1920px checked.
- **PASS** — No unintended horizontal scrolling/clipping.
- **PASS** — Important state is not communicated by color alone.

## Build quality

Evidence: 42 tests, TypeScript, Prettier, npm audit and production build passed; browser console review and functional smoke tests.

- **PASS** — Automated tests pass.
- **PASS** — Type checking passes.
- **NOT APPLICABLE** — Lint passes if configured.
- **PASS** — Production build passes.
- **PASS** — No material console/runtime errors remain.
- **PASS** — Core visible actions are functional rather than placeholders/TODOs.
