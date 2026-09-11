# BookOnTime Booking Rules

## Principle

Rules describe **when booking opens**. They are user-editable configuration and must not be hardcoded across UI components.

## Rule types

### Relative

Booking opens an offset before the target date/time.

Examples:
- 60 days before target at 08:00
- 30 days before target at 10:00
- 2 weeks before target at 09:00

Fields:
- quantity
- unit: minutes / hours / days / weeks / months
- include or exclude target date where relevant
- opening time
- timezone

### Fixed

Exact opening datetime supplied by the user or preset.

### Recurring

Expected release pattern such as every Monday at 09:00 or every day at 07:00.

### Periodic release

A future period opens according to a calendar relationship, e.g. next month opens on the first day of the previous month at 10:00.

## Verification metadata

Rules may contain:
- `sourceLabel`
- `sourceUrl`
- `lastVerifiedAt`
- `verificationStatus`: verified / needs-verification / custom
- `notes`

Do not claim a rule is verified unless its metadata supports that claim.

## Preset examples

- Indian Railways — General
- Bus — Custom Advance Window
- Flight — Custom Advance Window
- Movie — Fixed Opening
- Event — Fixed Opening
- Sports — Fixed Opening
- Darshan — Fixed / Periodic
- Appointment Slot — Recurring / Fixed
- Registration — Fixed Opening
- Accommodation — Relative / Periodic
- Custom

Provider policies can change; all presets remain editable and may be restored to shipped defaults.

## Date-engine requirements

Clearly distinguish:
- `bookingOpeningAt`
- `targetAt`
- `alertAt`

Handle leap years, February, month/year boundaries, include/exclude semantics, timezone rendering and past/same-day opening states without accidental UTC day shifting.
