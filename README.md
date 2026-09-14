# BookOnTime

**Book Before It’s Late.**

BookOnTime is a local-first, static Progressive Web App focused on one problem: helping users know **when a booking, reservation, ticket sale, registration, or slot opens** so they can be ready before the opening time.

This repository is intentionally specification-first. Before implementing the app, read `AGENTS.md` and everything under `docs/`.

## Product constraints

- No login or account system
- No backend required for Version 1
- No payment processing or credential storage
- No automated ticket purchasing
- Static GitHub Pages deployment
- Responsive desktop + mobile PWA
- Local-first storage
- Booking-opening datetime is the core product concept

## Codex

When using Codex, start with `AGENTS.md`. The written specification overrides placeholder content in generated mockups.

## Run Version 1

Requires Node.js 24+ and npm.

```sh
npm ci
npm run dev
```

Open the printed `/bookontime/` URL. Validate with `npm test`, `npm run typecheck`, `npm run format:check`, and `npm run build`. Preview the static build with `npm run preview`.

See [implementation and maintenance](docs/IMPLEMENTATION.md) for date semantics, holiday generation/overrides, backups, offline limitations and GitHub Pages deployment.
