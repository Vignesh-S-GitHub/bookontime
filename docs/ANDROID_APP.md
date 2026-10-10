# BookOnTime offline Android 1.1.1

The Android application evolves the existing React/TypeScript app through Capacitor. Booking calculations, IndexedDB persistence, validated imports, rules, groups and calendars remain shared with the web build. Android uses bundled assets and native alarms; it never loads the deployed website.

## Design coverage

The 18 approved mockups guide these screens and states. White, blue and navy, Inter, the original ticket/clock logo and travel illustration are shared throughout.

| Reference | Implementation |
|---|---|
| 1 Home | `#home`, next opening, countdown, categories |
| 2 Reminders | `#reminders`, views, search/filter/sort |
| 3 Details | `#detail/{id}`, opening, rule, alerts and actions |
| 4 Calendar | `#calendar`, opening dates, holidays, selected day |
| 5 Rules | `#rules`, category chips, reusable editable rules |
| 6 Groups | `#groups` and `#groups/{id}` |
| 7 Type | `#add`, wizard step 1 |
| 8 Calculated opening | wizard step 2, calculation mode |
| 9 Known opening | wizard step 2, known date/time |
| 10 Alerts | wizard step 3, offsets, group and notes |
| 11 Review/save | wizard step 4 and saved confirmation |
| 12 Edit | `#edit/{id}`, preserves identity and rule snapshot |
| 13 More | `#more`, settings navigation |
| 14 General/holidays | `#settings`, `#holidays` |
| 15 Notifications | `#notifications`, permission/access/status/test |
| 16 Permission onboarding | `#permissions` plus Android system dialogs |
| 17 Backup/delete | `#data`, encrypted export, import review, delete sheet |
| 18 Device alert | Android notification/lock screen |

System dialogs, date pickers, keyboard and lock-screen notification layout depend on the Android device. Notifications deliberately omit booking titles, routes and notes to protect privacy. The mockups are visual references; existing rule capabilities are retained in advanced controls.

## Privacy and permissions

- No `INTERNET`, network-state, Wi-Fi-state, location, contacts, camera, microphone or broad storage permissions.
- Android `POST_NOTIFICATIONS`: requested only after pressing Allow notifications.
- `SCHEDULE_EXACT_ALARM`: optional special access for precise booking times; the app opens Android settings only when requested.
- `RECEIVE_BOOT_COMPLETED`: restores local reminders after boot. No app `WAKE_LOCK` permission; Android owns the brief alarm-delivery wake-up.
- AndroidX internal signature permission protects dynamic receivers. It provides no user-data access.
- Automatic cloud backup and device transfer are excluded. No exported content provider. Release WebView debugging and logging are disabled.
- Only bundled `https://localhost` resources are allowed in the WebView. This is a virtual asset origin, not an Internet server. CSP, native navigation restrictions and the missing network permission provide separate controls.
- Screenshots and recent-task previews are blocked using `FLAG_SECURE`; autofill is disabled where Android supports it. This does not protect a rooted or compromised device.
- IndexedDB and alarm metadata reside in Android's private app storage. This is protected by the Android sandbox and device security, rather than a separate application database password.
- Explicit backup export uses AES-256-GCM, random salt/nonce and PBKDF2-HMAC-SHA256 with 600,000 iterations. Passphrases are not saved. Use a long unique passphrase; it cannot be recovered.
- Native import/export uses the system document picker with local-only selection and a 10 MB bound. Legacy unencrypted JSON imports undergo the same schema and semantic validation. Optional ICS exports contain booking details in plaintext and should be kept private.

## Alerts and offline limitations

Future active reminders are scheduled after save/import and checked when the app resumes. Edits replace old alarms; resolving or deleting a reminder cancels its pending alarms. Delete-all also cancels pending test alerts. Notification taps open the associated reminder. The notification plugin restores pending alarms after boot/unlock.

Enable notifications and alarm access, then send the 10-second test from More → Notifications. Ordinary backgrounding and swiping away the app do not require the app to remain open. Android force-stop prevents delivery until the app is opened again. Denied permissions, Do Not Disturb, battery restrictions, a powered-off device and idle limits can suppress or delay alerts. Exact alarm access improves timing but does not override all OS restrictions. Closely spaced idle alarms may be delayed.

No online calendar, sharing, external booking link or online update action is enabled in the APK. Booking URLs are retained as reference text. The user handles booking separately.

Holiday data covers 2026 plus five future years through 2031 for India and supported regions. Future festival dates are marked tentative, not guaranteed official declarations. Data refreshes require a new app release. Reminder calculations continue outside holiday coverage, with a clear holiday-data message.

## Build and signing

See [BATTERY_BEHAVIOR.md](BATTERY_BEHAVIOR.md) for the foreground/background lifecycle, native alarm behavior, executed power checks and physical-phone measurement procedure.

Prerequisites: Node.js 24+, npm, Java 21 and Android SDK platform 36. Use locked `npm ci`. Install Android build tools as requested by Gradle. Configure `ANDROID_HOME` and `JAVA_HOME`, or use Android Studio's compatible SDK/JDK.

1. Run `npm run android:sync` to prepare original-logo icons, build `dist-android`, and copy assets/plugins into Android.
2. Run `npm test`, `npm run format:check`, `npm run security:check`, and `npm audit`.
3. For a signed release, set `BOOKONTIME_KEYSTORE` to a private keystore and `BOOKONTIME_SIGNING_PASSWORD_FILE` to a protected local password file. The alias must be `bookontime`. Never place either in Git. Without these variables Gradle produces an unsigned release for build validation only.
4. Run `android/gradlew -p android :app:assembleRelease :app:lintRelease --no-daemon`; use `android\gradlew.bat` on Windows.
5. Run `node scripts/verify-android-security.ts android/app/build/intermediates/merged_manifests/release/processReleaseManifest/AndroidManifest.xml`.
6. Verify the actual APK using SDK `apksigner verify --verbose --print-certs` and `aapt dump permissions`. The signed APK is at `android/app/build/outputs/apk/release/app-release.apk`.

Keep a secure private copy of the signing keystore and password. Future APK updates must use the same signing key and a higher versionCode. Losing that key can require uninstalling the previous app, which removes local data. The key created for the delivered APK stays in the ignored local `work/signing` folder; it is not distributed with the APK or committed.

## Install and test

Transfer the signed APK to the Android phone and open it. Android may require temporarily allowing installation from that file manager. After installation, revoke that install-source access. The app does not request Internet access. Android 7.0+ is the configured minimum; real-device validation on the user's phone remains useful because device-specific battery behavior varies.

For an emulator, use `adb install -r <signed-apk>`, disable Wi-Fi/mobile data, open BookOnTime and enable notifications explicitly. Test creation, editing, import/export, permission denial, background delivery, notification taps, resolution/deletion and reboot restoration. Release screenshots are intentionally blocked; visual comparisons use the same production Android web bundle in a browser.

The browser preview cannot deliver native alarms. The existing web build retains PWA behavior; its limitations and permissions differ from the Android APK.
