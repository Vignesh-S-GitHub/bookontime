# BookOnTime Product Specification

## Identity

**BookOnTime**  
**Book Before It’s Late.**

BookOnTime helps users know when a booking, ticket sale, reservation, registration, or slot opens so they can be ready before that moment.

This is not a generic reminder, notes, task, calendar, ticket-wallet, travel-planner, or purchasing app.

## Core concept

The central datetime is `bookingOpeningAt`.

A reminder may also contain `targetAt` for the actual journey/event/darshan/stay date and one or more `alertAt` datetimes.

## Creation modes

### Mode 1 — Calculate from target date

User provides journey/event/target date plus a configurable rule. BookOnTime calculates the expected opening datetime.

Fields can include category, title, route, target date/time, provider, service identifier, booking URL, notes, rule, include/exclude target day, opening time, timezone, alert schedule and holiday context.

### Mode 2 — Known opening date

User directly enters booking opening date/time. Target date is optional.

Fields can include category, title, booking opening datetime, timezone, optional target date/time, route, provider, service identifier, booking URL, notes, alerts and holiday context.

## Supported categories

- Train
- Bus
- Flight
- Movie
- Event / Concert
- Sports
- Darshan
- Appointment / Slot
- Registration
- Accommodation
- Custom

## Rule models

1. Relative opening — e.g. 60 days before target at 08:00.
2. Fixed opening — exact known date/time.
3. Recurring opening — e.g. every Monday at 09:00.
4. Periodic release — e.g. next month opens on the first of the previous month at 10:00.

Rules are editable configuration, never scattered hardcoded provider assumptions.

## Rule verification

Rules may include source label, source URL, last verified date, verification status and notes. States include Verified, Needs Verification and Custom.

## Alerts

Suggested defaults: 1 day, 1 hour, 30 minutes, 15 minutes, 5 minutes, and at opening time. Users can customize defaults and individual reminder alerts.

## Statuses

- Future
- Booking Soon
- Opens Today
- Booking Open
- Booked
- Completed
- Missed / Expired
- Archived if needed

Passing the opening time must not delete a reminder; it should become Booking Open until resolved.

## Home dashboard

Prioritize the next booking opening with a large countdown, opening date/time, context, booking-site action, calendar action and holiday/long-weekend context. Secondary sections can include Booking Now, Opening Soon, This Week, Upcoming and Trip Groups.

## Reminders

Search and filter by category/status/date. Sort primarily by opening datetime. Cards show category, title, opening date/time, countdown/status, target date when useful and holiday badge where relevant.

## Reminder details

Show category, title, status, countdown, opening datetime, target datetime, route, provider, service identifier, rule and verification state, alerts, holiday context, booking URL and notes.

Actions: Open Booking Site, Add to Calendar, Edit, Duplicate, Share, Mark Booked, Complete, Delete.

## Calendar

The internal calendar is primarily a **Booking Opening Calendar**. Dates show opening markers and holiday markers. Selecting a date shows opening time, category, status, related target dates and holiday information.

## Holiday awareness

Support national/regional public holidays, major regional festivals and long-weekend detection. This supplements booking decisions; it is not a general holiday app. Do not claim tickets will definitely sell out.

## Journey / event groups

Users may optionally group related booking opportunities for the same target, such as Train, Bus, Flight and Accommodation for one trip. Groups organize openings only; they are not full itineraries.

## Duplicate

Duplicating a reminder should let the user change the target date and automatically recalculate opening datetime, alerts, holiday context and countdown.

## Booking links

Users can save an optional booking URL. BookOnTime may open that site, but must never log in, store provider credentials, solve CAPTCHA, submit bookings or handle payment.

## Local-first storage

Persist reminders, groups, rules, rule-verification metadata, alert defaults, holiday-region settings, theme/timezone/date preferences in IndexedDB; localStorage may hold lightweight UI preferences.

Never store passwords, Aadhaar data, payment details, provider credentials or sensitive tokens.

## Backup

Support JSON export/import, ICS export of upcoming openings and Delete All Data with confirmation. Validate imports before use.

## Notifications

Use browser/service-worker notification capabilities where appropriate, only after explicit permission. Provide permission state and test notification. Never claim guaranteed exact delivery when a static PWA has been fully closed.

## Calendar fallback

ICS events must be based on booking-opening datetime. Also provide Google Calendar links where practical. Calendar reminders are the primary reliable fallback for static-hosted Version 1.

## PWA / offline

Installable PWA with manifest, service worker, icons, standalone display, offline shell and update strategy. After first load, core reminder/rule/calendar/holiday calculations and local data workflows should work offline.

## Deployment

Primary target is GitHub Pages at `/bookontime/`. All assets, manifest, service worker, navigation and holiday JSON must be subpath-safe.

## No-login rule

Version 1 has no login, signup, account, profile, cloud sync, payment or backend.
