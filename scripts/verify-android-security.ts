import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import config from "../capacitor.config.ts";
const manifest = await readFile(
  "android/app/src/main/AndroidManifest.xml",
  "utf8",
);
assert.match(manifest, /android:allowBackup="false"/);
assert.match(manifest, /android:usesCleartextTraffic="false"/);
assert.match(
  manifest,
  /android:dataExtractionRules="@xml\/data_extraction_rules"/,
);
for (const permission of [
  "INTERNET",
  "ACCESS_NETWORK_STATE",
  "ACCESS_WIFI_STATE",
  "WAKE_LOCK",
])
  assert.match(
    manifest,
    new RegExp(`android.permission.${permission}" tools:node="remove"`),
  );
assert.equal(config.server?.url, undefined);
assert.equal(config.android?.webContentsDebuggingEnabled, false);
assert.equal(config.android?.allowMixedContent, false);
assert.equal(config.loggingBehavior, "none");
const html = await readFile("dist-android/index.html", "utf8");
assert.match(html, /Content-Security-Policy/);
assert.match(html, /connect-src 'self'/);
assert.doesNotMatch(html, /https?:\/\/(?!localhost)/);
assert.doesNotMatch(html, /registerSW|manifest.webmanifest/);
for (const match of html.matchAll(/(?:src|href)="(\/[^"]+)"/g))
  await access(`dist-android${match[1]}`);
const coverage = JSON.parse(
  await readFile("dist-android/data/holidays/coverage.json", "utf8"),
);
assert.deepEqual(coverage.years, [2026, 2027, 2028, 2029, 2030, 2031]);
for (const year of coverage.years) {
  await access(`dist-android/data/holidays/IN/${year}.json`);
  for (const region of coverage.regions)
    await access(`dist-android/data/holidays/IN/states/${region}-${year}.json`);
}
assert.ok(
  (await readdir("dist-android/assets")).some((f) => f.endsWith(".woff2")),
);
const activity = await readFile(
  "android/app/src/main/java/com/bookontime/app/MainActivity.java",
  "utf8",
);
assert.match(activity, /setBlockNetworkLoads\(true\)/);
assert.match(activity, /FLAG_SECURE/);
assert.match(activity, /setAllowFileAccess\(false\)/);
console.log(
  "PASS: offline assets, six-year holiday coverage, CSP, network removal, backup protection, WebView restrictions.",
);
// When supplied, check the actual merged manifest, not just the source template.
if (process.argv[2]) {
  const merged = await readFile(process.argv[2], "utf8");
  const allowed = new Set([
    "POST_NOTIFICATIONS",
    "SCHEDULE_EXACT_ALARM",
    "RECEIVE_BOOT_COMPLETED",
  ]);
  for (const match of merged.matchAll(
    /<uses-permission\b[^>]*android:name="([^"]+)"/g,
  ))
    assert.ok(
      allowed.has(match[1].replace("android.permission.", "")) ||
        match[1] ===
          "com.bookontime.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION",
      `Unexpected packaged permission: ${match[1]}`,
    );
  assert.match(merged, /android:allowBackup="false"/);
  assert.doesNotMatch(merged, /android:debuggable="true"/);
  assert.match(merged, /android:usesCleartextTraffic="false"/);
  assert.doesNotMatch(merged, /<service\b/);
  for (const tag of merged.matchAll(
    /<(activity|receiver|provider|service)\b[^>]*>/g,
  )) {
    if (!/android:exported="true"/.test(tag[0])) continue;
    assert.ok(
      /android:name="com\.bookontime\.app\.MainActivity"/.test(tag[0]) ||
        (/android:name="androidx\.profileinstaller\.ProfileInstallReceiver"/.test(
          tag[0],
        ) &&
          /android:permission="android\.permission\.DUMP"/.test(tag[0])),
      `Unexpected exported component: ${tag[0]}`,
    );
  }
  console.log(
    "PASS: packaged release permission allowlist, backup disabled, debugging disabled.",
  );
}
