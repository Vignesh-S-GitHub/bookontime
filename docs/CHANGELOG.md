# Product Decision Changelog

## 2026-09-12 — User-directed appearance lock

- The user explicitly requested the same white-and-blue theme and fonts throughout.
- Version 1 now always renders the approved light palette and Inter, independent of system appearance. This supersedes the earlier System/Light/Dark selector requirement.
- Preserve the original ticket-and-clock artwork, framed directly in the header without the padded app-icon tile. The supplied travel background uses subtle fades on pale-blue surfaces.
- Legacy backup theme values remain readable for compatibility, but do not change the locked appearance.

## 2026-09-14 — Version 1 implementation

- Added the static React/TypeScript PWA, four booking rule models, local reminders and groups, calendar exports, validated backups, regional holiday data, and notification fallback.
- Added locked dependencies, automated domain/storage/notification/data checks and GitHub Actions validation and Pages workflows.
- Release verification and limitations are recorded in `IMPLEMENTATION_REPORT.md`.

## 2026-09-11 — Specification freeze for initial build

- Final product name: BookOnTime.
- Final tagline: Book Before It’s Late.
- Train is a sample/use case, not the product identity.
- Product scope restricted to booking/ticket/registration/slot opening moments.
- Two primary reminder modes finalized: calculated opening and known opening datetime.
- Four rule models defined: relative, fixed, recurring, periodic release.
- No login/account/backend for Version 1.
- GitHub Pages static PWA is the deployment target.
- Calendar/ICS fallback required because exact closed-PWA browser notification timing is not guaranteed.
- Holiday awareness added: national/regional holidays and long-weekend detection.
- Static generated holiday JSON chosen for runtime; official/manual overrides supported.
- Booking rule verification metadata added.
- Journey/event groups and lightweight alternative booking options added.
- Darshan icon must use Hindu temple/gopuram architecture.
- Approved ticket + clock logo and blue/white/navy/Inter visual identity locked.

Future product changes should be recorded here before materially changing implementation scope.
