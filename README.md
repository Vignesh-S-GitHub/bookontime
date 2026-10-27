<div align="center">

<img src="public/brand-logo.png" alt="BookOnTime logo" width="96" />

# BookOnTime

**Book Before It’s Late.**

![React](https://img.shields.io/badge/React-149ECA?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PWA + Android](https://img.shields.io/badge/PWA%20%2B%20Android-2563EB?style=flat-square)

[Quick start](#quick-start) · [Features](#features) · [Android](#offline-android-app) · [Documentation](#documentation)

</div>

---

A local-first planner for the moment a booking, ticket sale, reservation, registration, or slot **opens**. Calculate the opening time from an event date and rule, or enter a known opening time directly; then prepare and act on the relevant provider site.

<a id="features"></a>

## ✨ Features

| Plan | Prepare | Keep your data |
|---|---|---|
| Calculated or directly entered booking-opening times | Countdowns, configurable alert offsets, and opening-calendar views | IndexedDB storage and validated JSON import/export |
| Relative, fixed, recurring, and periodic-release rules | Groups, search/filter/sort, and rule verification metadata | ICS/calendar exports |
| Eleven booking categories | Regional holiday and long-weekend context | Installable web PWA and separate offline Android build |

Categories: **Train · Bus · Flight · Movie · Event / Concert · Sports · Darshan · Appointment / Slot · Registration · Accommodation · Custom**.

<a id="quick-start"></a>

## 🚀 Quick start

Requires **Node.js 24+** and npm.

```bash
git clone https://github.com/Vignesh-S-GitHub/bookontime.git
cd bookontime
npm ci
npm run dev
```

Open the Vite URL, including its **`/bookontime/`** path. For a production build:

```bash
npm run build
npm run preview
npm run verify:build
```

The web build targets GitHub Pages under `/bookontime/`. Run it through HTTP/HTTPS; opening a source HTML file directly does not reproduce its module and service-worker behavior.

## 🧭 Using the planner

1. Choose whether to calculate a booking opening or enter one you already know.
2. Select a category and configure the target date/rule or direct opening time.
3. Review the calculation, rule source, and verification status before saving.
4. Add preparation details, groups, and alert offsets as needed.
5. Export an opening-time calendar event or open the booking site when ready.

The app does not purchase tickets, submit provider forms, or store provider credentials. It has no accounts, cloud sync, payments, or required backend.

<a id="offline-android-app"></a>

## 📱 Offline Android app

The Capacitor Android build bundles the existing React application, Inter fonts, approved branding, and India holiday data for **2026–2031**. It uses native local notifications, without Internet, network-state, or wake-lock permissions. Native delivery still depends on Android permissions and device alarm policies.

```bash
npm run dev:android
# To prepare the native project:
npm run android:sync
npm run security:check
```

With **Java 21** and **Android SDK 36** configured:

```bash
android/gradlew -p android :app:assembleRelease :app:lintRelease
```

Windows uses `android\gradlew.bat`. Supply signing material only through local configuration. See the [Android guide](docs/ANDROID_APP.md), [validation report](docs/ANDROID_VALIDATION.md), and [battery behavior](docs/BATTERY_BEHAVIOR.md).

## 💾 Storage and notification behavior

Browser reminders are local to the device and origin; clearing site data can remove them. Keep JSON backups. A fully closed static web PWA cannot guarantee exact background alerts; use calendar exports where appropriate. Native Android scheduling is a separate capability, not a web push service.

## 🧪 Development checks

```bash
npm test
npm run typecheck
npm run format:check
npm run build
npm run verify:build
npm audit
```

These are the repository's configured checks. Native scheduling requires emulator/device verification in addition to web tests. [AGENTS.md](AGENTS.md) sets the specification, branding, and acceptance-review requirements for implementation changes.

<a id="documentation"></a>

## 📚 Documentation

| Guide | Purpose |
|---|---|
| [Product specification](docs/PRODUCT_SPEC.md) | Product scope and required behavior |
| [Acceptance criteria](docs/ACCEPTANCE_CRITERIA.md) | Implementation and release review checklist |
| [Booking rules](docs/BOOKING_RULES.md) | Opening-date semantics |
| [Holiday system](docs/HOLIDAY_SYSTEM.md) | Bundled data and maintenance |
| [Implementation](docs/IMPLEMENTATION.md) | Architecture, backups, offline behavior, and Pages deployment |
| [Design system](docs/DESIGN_SYSTEM.md) | Approved palette, typography, and identity |

## 📁 Repository guide

[src/](src/) contains React views, date/rule logic, storage, and notification adapters. [tests/](tests/) covers date boundaries and local behavior. [public/](public/) holds approved assets and holiday JSON; [android/](android/) contains the native shell. Web output is `dist/`; Android output is `dist-android/`.

## 🤝 Contributing

Open an issue with a reproducible example or submit a focused pull request. Keep setup instructions and documentation aligned with any behavior changes.

## 📄 License

No repository-level `LICENSE` file is currently included.
