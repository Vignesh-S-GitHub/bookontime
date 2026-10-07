<div align="center">

# BookOnTime
### Book before it’s late.

**Know when booking opens · prepare early · act on time**

</div>

BookOnTime is a local-first planning app for time-sensitive bookings: ticket sales, reservations, registrations, and appointment slots. It helps you track when an opportunity opens and prepare the details you need before that moment arrives.

## What it helps you manage

- A booking or release date and time, with clear countdown context
- Reminders and preparation details for upcoming opportunities
- A focused view of future booking windows
- A responsive, installable PWA that works locally in the browser

## Product boundaries

BookOnTime is designed as a static, GitHub Pages-compatible app. It does not provide accounts, cloud sync, payments, credential storage, automatic purchasing, CAPTCHA solving, or form automation. Your booking remains yours to complete on the relevant service.

## Run locally

Requires **Node.js 24 or newer** and npm.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. For a production build and local preview:

```bash
npm run build
npm run preview
```

## Project notes

This project is spec-led. Start with the repository’s `AGENTS.md` and the product, acceptance, design, and booking-rule documents in `docs/` before changing behavior. The app is built with TypeScript, Vite, and a static PWA setup.

---

<p align="center"><sub>Be ready when the window opens.</sub></p>
