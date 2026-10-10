# Android 1.1.0 validation

Validated locally on 10 October 2026. This report distinguishes executed checks from device-dependent behavior. The APK is a signed installable release; it has not undergone an independent penetration test or a physical-phone test.

## Delivered APK

- Package: `com.bookontime.app`, versionName `1.1.0`, versionCode `2`.
- Size: 5,045,682 bytes.
- APK SHA-256: `b65e139481469978950cf3684f8ba84202cc2fdda52bbf47d88e46d50a8e944d`.
- Signing certificate SHA-256: `1defbbf43c4e90733bda69273ec0413f26bd185991af85c2a8bab2648f71b9ef`.
- SDK `apksigner verify --verbose --print-certs`: PASS; RSA 3072-bit APK v2 signature. Minimum Android API 24 supports this scheme.
- SDK `aapt dump permissions` on the delivered file: PASS; only notifications, exact alarm access, boot receipt, wake lock and the AndroidX internal signature permission. No Internet/network, location, camera, microphone, contacts or storage access.

## Executed checks

| Check | Result |
|---|---|
| TypeScript check | PASS |
| Prettier check | PASS |
| Vitest domain/storage/holiday/notification/encryption suites | PASS, 52 tests in 7 suites |
| Full npm audit | PASS, zero reported vulnerabilities |
| Android production web build and Capacitor sync | PASS |
| Original web production build and Pages/PWA asset verification | PASS |
| Offline asset/CSP/coverage/source security checker | PASS |
| Actual merged release manifest allowlist and backup/debug checks | PASS |
| Gradle signed `assembleRelease` and `lintRelease` | PASS, zero lint errors |
| Actual signed APK installation and update in API 36 emulator | PASS |

Android lint reports 29 warnings, principally Capacitor template resources/icon checks and available tooling/dependency updates. These were inspected; they do not introduce additional app permissions. Gradle also reports template flat-directory and future-version deprecation warnings. No warnings were suppressed with a lint baseline.

## Browser checks

The production Android bundle was exercised in Chrome. Home, reminders, calendar, More, rules, groups, general settings, notifications, holidays, backup, about and reminder details were inspected at widths 360, 390, 430, 768, 1024, 1280, 1440 and 1920: 96 route/width checks, no horizontal overflow, no page exceptions, no external requests, and Inter font throughout.

Executed interaction checks included calculated and known opening creation, optional target date, explicit review before save, duplicate identity, route/group editing with the same opening, booked status, confirmed reminder deletion, group creation, encrypted export/import merge without duplication, typed delete-all and encrypted restoration. The save-confirmation navigation overlap found during testing was corrected and its save/view flow passed afterward. Local screenshots are retained under ignored `output/playwright/`.

## Native emulator checks

Android 16/API 36 x86_64 emulator, final release build with debugging disabled and secure-window flag enabled:

- Launched with Wi-Fi and mobile data disabled; assets, saved reminders and holiday context remained available.
- Notification permission appeared only after the explicit Allow button. Alarm access was enabled through the app's explicit Android settings action.
- The 10-second test notification appeared while the app was backgrounded.
- A validated synthetic booking reminder registered an exact wake-up alarm and delivered after normal app-process termination. Notification content contained only the generic BookOnTime alert text; private booking title/notes were absent.
- Tapping that notification after a cold start opened its associated reminder details.
- A future booking alarm restored after reboot/unlock without manually opening BookOnTime. Android's boot broadcast queue took time to complete; the restored alarm was checked after delivery of that broadcast.
- Installed the updated signed APK over the previous test build; reminder data remained intact.
- Exported a backup using the local Android document picker. The resulting file contained no plaintext booking title/notes and decrypted successfully with the final 600,000-iteration key derivation.
- Force-stopped and reopened the final app; its future alarm was re-registered. Startup/resume deliberately re-arms stored notification records because Android can remove OS alarms while records remain in plugin storage.
- Revoked notification permission and reopened the app: no permission dialog appeared, permission remained denied, and pending booking alarms were cancelled. Permission was restored afterward for continued testing.
- Verified `SECURE` window flags, no release `DEBUGGABLE`/backup flags, and no native crash entries during these checks.

Scheduling regression tests separately cover edits, resolution/deletion, changed exact-alarm access, denied permissions, unchanged-alert retention, launch/resume re-arming, test-alert handling and cancellation of all pending alarms.

## Practical limits

Physical-phone testing, other Android releases and manufacturer-specific battery policies remain unverified. Force-stop prevents alerts until reopening; denial, power-off, Do Not Disturb and idle/battery restrictions can delay or suppress delivery. No security check can guarantee protection on a rooted, compromised or unlocked device. App-private storage relies on Android's sandbox/device protections; exported backups add passphrase encryption. ICS exports are explicitly plaintext.

Bundled holidays cover 2026–2031, with future festival dates marked tentative. There is no online holiday refresh or automatic app update. System dialogs/notification layout vary by Android version, and notification text differs from the mockup to keep booking details private.

Security decisions were checked against [Android security guidance](https://developer.android.com/privacy-and-security/security-tips) and [OWASP cryptographic storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) / [PBKDF2 guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). These references inform the implementation; this report is not a certification.
