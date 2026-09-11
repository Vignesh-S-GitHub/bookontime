# BookOnTime Codex Instructions

These instructions are authoritative for all Codex work in this repository.

## Source-of-truth order

1. `AGENTS.md`
2. `docs/PRODUCT_SPEC.md`
3. `docs/ACCEPTANCE_CRITERIA.md`
4. `docs/DESIGN_SYSTEM.md`
5. `docs/BOOKING_RULES.md`
6. `docs/HOLIDAY_SYSTEM.md`
7. Approved files under `design/reference/`
8. Existing implementation
9. Codex assumptions

When sources conflict, the higher source wins.

## Product lock

Product: **BookOnTime**

Tagline: **Book Before It’s Late.**

Purpose: help users know when a future booking, ticket sale, reservation, registration, or slot opens and become ready before the opening time.

The booking-opening datetime is the central product concept.

## Hard constraints

Do not add or introduce without explicit user instruction:

- login, signup, user accounts, profiles, authentication
- backend database, server API, cloud sync
- payment processing
- credential storage
- automatic ticket purchasing, CAPTCHA handling, or form automation
- generic notes/tasks/birthday/bill/habit reminder features
- a new logo, new brand identity, or unrelated visual system

Version 1 must remain a static GitHub Pages-compatible PWA.

## Anti-deviation rule

Do not add, remove, reinterpret, or materially change product scope because another design seems preferable. When requirements and mockups disagree, follow the written specification. Generated mockup usernames, emails, PNRs, account controls, typos, sample dates, and placeholder copy are not requirements.

When a small implementation detail is unspecified, choose the smallest solution consistent with the product intent. Put out-of-scope improvements under `Future considerations`; do not silently implement them.

## Required product behaviors

- Mode 1: calculate booking opening datetime from target/journey/event date plus configurable booking rule.
- Mode 2: accept a known booking-opening datetime directly.
- Support relative, fixed, recurring, and periodic-release rule types.
- Support national/regional holiday context and long-weekend detection using local static JSON at runtime.
- Support rule verification metadata: source, source URL, last verified date, verification status.
- Support local-first storage, JSON import/export, ICS export, PWA install/offline behavior.
- Use calendar events based on booking-opening datetime.
- Do not claim exact background notification delivery when a static PWA is fully closed.

## Categories

Use only these initial product categories unless the written spec is explicitly updated:

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

Darshan must use a Hindu temple/gopuram-style architectural icon.

## Branding

Preserve the approved ticket + clock BookOnTime logo and supplied references.

Primary visual language:

- Inter
- primary blue `#2563EB`
- dark navy `#0F2747`
- light blue `#EAF4FF`
- pale blue `#F4F9FF`
- white / `#FAFBFF`
- rounded cards, subtle borders/shadows, clean consistent icons

## Engineering

Preferred stack: React + TypeScript + Vite, IndexedDB, Vitest, static PWA tooling.

Production must work at `https://USERNAME.github.io/bookontime/`; never assume `/` is the site root.

Before declaring completion:

1. Run tests.
2. Run type checking and linting if configured.
3. Run production build.
4. Verify GitHub Pages subpath behavior.
5. Visually inspect 360, 390, 430, 768, 1024, 1280, 1440, and 1920 px widths.
6. Check every item in `docs/ACCEPTANCE_CRITERIA.md` and report PASS / FAIL / NOT APPLICABLE.

Do not declare completion merely because the UI renders.
