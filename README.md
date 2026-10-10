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
- A fully offline Android app with native local booking alerts

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

Validate with `npm test`, `npm run typecheck`, `npm run format:check`, `npm audit`, and `npm run verify:build` after building.

## Offline Android app

Version 1.1.1 reuses the existing React application inside Capacitor with native local notifications. The APK has **no Internet, network-state or wake-lock permissions**, no accounts or analytics, and bundled Inter fonts, original brand assets and India holiday data for **2026–2031**. The separate web/PWA build remains available. Foreground countdowns update locally, background WebView timers are paused, and native Android alarms deliver reminders without continuous polling. See [battery behavior and measurement](docs/BATTERY_BEHAVIOR.md).

See [Android build, privacy and installation](docs/ANDROID_APP.md) and [Android validation report](docs/ANDROID_VALIDATION.md). Preview the Android UI with `npm run dev:android`; native notification delivery requires an emulator or Android phone.

```bash
npm ci
npm test
npm run format:check
npm run android:sync
npm run security:check
```

With Java 21 and Android SDK 36 configured, build with `android/gradlew -p android :app:assembleRelease :app:lintRelease` (Windows: `android\gradlew.bat`). Signing credentials are supplied through local environment variables; never commit them. Keep the private signing key safely for future updates.

## Project notes

This project is spec-led. Start with the repository’s `AGENTS.md` and the product, acceptance, design, and booking-rule documents in `docs/` before changing behavior. The app is built with TypeScript, Vite, and a static PWA setup.

See [implementation and maintenance](docs/IMPLEMENTATION.md) for date semantics, holiday generation/overrides, backups, offline limitations and GitHub Pages deployment.

---

<p align="center"><sub>Be ready when the window opens.</sub></p>
