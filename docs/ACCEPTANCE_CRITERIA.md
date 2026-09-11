# BookOnTime Acceptance Criteria

Codex must report every item as **PASS**, **FAIL**, or **NOT APPLICABLE** before calling Version 1 complete.

## Product identity

- [ ] Product name is BookOnTime.
- [ ] Tagline is “Book Before It’s Late.”
- [ ] Approved ticket + clock identity is preserved.
- [ ] App is not presented as train-only.
- [ ] App remains focused on booking-opening moments rather than generic reminders.

## Scope guardrails

- [ ] No login/signup/profile/account system.
- [ ] No required backend or cloud database.
- [ ] No payment processing.
- [ ] No booking-provider credential storage.
- [ ] No automated ticket purchase, CAPTCHA handling, or booking-form submission.
- [ ] No generic bill/birthday/habit/task/notes feature set.

## Add Reminder

- [ ] First asks how the user knows booking time.
- [ ] Mode 1 calculates opening datetime from target date + configurable rule.
- [ ] Mode 2 accepts known opening datetime directly.
- [ ] Target date is optional in Mode 2.
- [ ] Calculation preview appears before save.
- [ ] Multiple alert offsets are configurable.

## Rule engine

- [ ] Relative rules supported.
- [ ] Fixed rules supported.
- [ ] Recurring rules supported.
- [ ] Periodic-release rules supported.
- [ ] Include/exclude target-day logic supported where relevant.
- [ ] Rule presets are editable configuration.
- [ ] Rule source / URL / last verified / verification status metadata supported.
- [ ] Rules can show Verified, Needs Verification, or Custom.

## Categories and icons

- [ ] Train
- [ ] Bus
- [ ] Flight
- [ ] Movie
- [ ] Event / Concert
- [ ] Sports
- [ ] Darshan
- [ ] Appointment / Slot
- [ ] Registration
- [ ] Accommodation
- [ ] Custom
- [ ] Darshan icon is a Hindu temple/gopuram-style architectural icon.
- [ ] Icon family is visually consistent.

## Dashboard / reminders

- [ ] Next booking opening is prominently displayed.
- [ ] Live countdown is based on booking-opening datetime.
- [ ] Booking Open state appears after opening passes instead of auto-deleting the reminder.
- [ ] Search/filter/sort are available on reminders.
- [ ] Reminder details expose relevant opening/target/rule/alert/holiday information.
- [ ] Open Booking Site action only opens a user-supplied/provider URL.
- [ ] Duplicate reminder recalculates opening/alerts after target date change.

## Groups

- [ ] Related booking opportunities can be grouped without becoming a full itinerary planner.
- [ ] Group view indicates which opening occurs next.

## Calendar

- [ ] Internal calendar is primarily a Booking Opening Calendar.
- [ ] Booking-opening dates are marked.
- [ ] Selecting a day lists openings and opening times.
- [ ] Target/journey date remains secondary context.

## Holidays

- [ ] Local static holiday JSON is usable at runtime without an online API.
- [ ] Country and primary region/state can be configured.
- [ ] Additional regions can be configured.
- [ ] National holidays supported.
- [ ] Regional holidays supported.
- [ ] Holiday context appears where relevant in reminder creation/details/calendar.
- [ ] Long weekends are calculated rather than manually enumerated.
- [ ] Holiday messaging never guarantees scarcity or sell-out.
- [ ] Holiday generator/override workflow is documented.

## Notifications and calendar fallback

- [ ] Notification permission is requested only from explicit user action.
- [ ] Permission state is visible.
- [ ] Test notification exists where supported.
- [ ] UI does not claim guaranteed exact background notification delivery for a fully closed static PWA.
- [ ] Single reminder can export an ICS event based on booking-opening datetime.
- [ ] Upcoming reminders can be exported to calendar.
- [ ] Google Calendar link is supported where practical.

## Storage / privacy

- [ ] Core records persist locally using IndexedDB or equivalent local-first storage.
- [ ] JSON export works.
- [ ] JSON import is validated.
- [ ] Delete All Data requires confirmation.
- [ ] UI explains that reminders are stored on the device.
- [ ] Sensitive credentials/payment/Aadhaar data are not stored.

## PWA / offline

- [ ] Valid web manifest.
- [ ] 192x192 and 512x512 app icons.
- [ ] Maskable icon where practical.
- [ ] Service worker registered.
- [ ] Install UI/fallback instructions provided.
- [ ] App shell loads offline after first successful load.
- [ ] Local reminders/rules/calendar/holiday calculation remain usable offline.

## GitHub Pages

- [ ] Production build works from `/bookontime/` base path.
- [ ] CSS/JS/images/fonts resolve correctly.
- [ ] Manifest resolves correctly.
- [ ] Service worker scope is correct.
- [ ] Holiday JSON resolves correctly.
- [ ] Navigation/reload behavior does not depend on server-side route fallback.

## Date/time correctness

- [ ] 60-day calculation covered by tests.
- [ ] Target-day include/exclude covered by tests.
- [ ] Month boundary covered.
- [ ] December → January covered.
- [ ] February covered.
- [ ] Leap year covered.
- [ ] Fixed opening covered.
- [ ] Recurring opening covered.
- [ ] Periodic release covered.
- [ ] Same-day/past opening covered.
- [ ] Asia/Kolkata behavior covered.
- [ ] Accidental UTC date shifting avoided.

## Design / responsive quality

- [ ] Inter is used as primary UI typography.
- [ ] Approved BookOnTime palette/design language is preserved.
- [ ] No fake account/profile UI copied from generated mockups.
- [ ] 360px checked.
- [ ] 390px checked.
- [ ] 430px checked.
- [ ] 768px checked.
- [ ] 1024px checked.
- [ ] 1280px checked.
- [ ] 1440px checked.
- [ ] 1920px checked.
- [ ] No unintended horizontal scrolling/clipping.
- [ ] Important state is not communicated by color alone.

## Build quality

- [ ] Automated tests pass.
- [ ] Type checking passes.
- [ ] Lint passes if configured.
- [ ] Production build passes.
- [ ] No material console/runtime errors remain.
- [ ] Core visible actions are functional rather than placeholders/TODOs.
