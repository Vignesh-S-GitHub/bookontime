# Android battery behavior

BookOnTime 1.1.1 retains the existing React/Capacitor interface. Its notification scheduling and delivery use the plugin's native Kotlin implementation and Android AlarmManager. It is not a fully native Kotlin UI, and no measured equivalence to a native UI or battery-drain percentage is claimed.

## Power contract

- No network permission, network polling, analytics, push connection, online updates or holiday refresh. All assets and holiday data are bundled.
- No application foreground service, periodic JobScheduler/WorkManager job, repeating alarm, location tracking, or request to exempt the app from battery optimization.
- No app wake-lock permission or manually acquired wake lock. An OS wake-up alarm may briefly wake the CPU to post the user's due notification. Sound/vibration also use energy when an alert fires.
- Android UI status refreshes once per minute while visible, plus the exact next booking-opening boundary. A one-second clock is confined to a mounted, visible countdown and stops once that countdown reaches zero. The previous whole-interface one-second refresh is removed from the Android build.
- UI clocks stop on hidden-document/native inactive events and resume with the current wall time, without replaying missed ticks. MainActivity also calls WebView.pauseTimers() onStop and resumeTimers() onResume. This pauses WebView layout/parsing/JavaScript timers while the activity is stopped; native alarm receivers work independently.
- Future alerts are registered after explicit reminder changes and reconciled on startup/resume to recover from removed OS alarms. Unchanged alerts are retained during ordinary data changes. Reconciliation is not a periodic background process.
- Exact/idle wake-up alarms are restricted to the reminder times selected by the user. More selected offsets mean more notification deliveries; choose fewer pre-opening offsets for fewer wake-ups. Booking openings can be time-sensitive, so this release retains the existing alert choices.
- Backup encryption runs only on explicit export/import, using the same strong password derivation. It is intentionally not weakened to save battery.

The WebView renderer can remain cached or bound in the process while its timers are paused. Android controls reclamation; a cached process or the system's bound WebView sandbox service does not imply continuous polling. This app does not force garbage collection or kill its own process as a battery strategy.

## Executed checks

Seven clock regression tests cover minute cadence, hidden mounting, native inactivity, countdown cadence, exact opening boundaries, no catch-up ticks and cleanup. The existing alarm/security/encryption suites remain required. Browser tests verify that a visible countdown changes, a hidden countdown stays unchanged, returning refreshes it immediately, and More has no unnecessary DOM mutations over the observation window.

The release manifest checker rejects wake-lock/network permissions and declared application services. APK verification checks the actual packaged permissions. Native emulator observations are recorded in ANDROID_VALIDATION.md; they establish lifecycle and delivery behavior, not real battery capacity or energy use.

## Physical-phone acceptance

1. Install this signed update over the earlier APK; keep the same signing certificate and a higher versionCode. Do not uninstall if you want to preserve reminders.
2. Leave Android's normal battery optimization enabled. Grant notification and optional exact-alarm access; do not select unrestricted battery use as a default workaround.
3. Set one real test booking a few minutes ahead with an opening-time alert. Lock the screen, verify delivery, and verify that tapping opens the right reminder. Test through the next reboot as well.
4. For a 24–48 hour idle comparison, use the same phone, charging state, screen use, connectivity and selected reminder count. Compare against an idle baseline without BookOnTime activity. Record the app/OS version and the number of delivered alerts; inspect Android Settings → Battery → app usage. Percentages vary with hardware, battery age, OS and manufacturer policy.
5. For a developer measurement on that test phone, collect `adb shell dumpsys batterystats com.bookontime.app` and an Android Studio system trace/Power Profiler recording where supported. Investigate sustained background CPU, an unexpected wake lock, periodic jobs, or unexplained frequent alarms. Do not reset battery statistics on a user's everyday phone without consent.

Force-stop, power-off, denied permissions, Do Not Disturb and vendor restrictions can prevent/delay alerts. Correctness and battery saving must be tested together. There is no defensible promise of zero drain or a fixed percentage based on an emulator.

References: [Android alarm guidance](https://developer.android.com/develop/background-work/services/alarms), [WebView timer lifecycle](https://developer.android.com/reference/android/webkit/WebView#pauseTimers()), [Android battery profiling](https://developer.android.com/topic/performance/power/setup-battery-historian).
