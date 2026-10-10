import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { App as AndroidApp } from "@capacitor/app";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Download,
  Upload,
  ShieldCheck,
  Trash2,
  Clock,
  Play,
  Check,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  initialData,
  settingsSchema,
  errorMessage,
  type AppData,
} from "./domain";
import { Field, Brand, PageHeading, useApp } from "./ui";
import { nativeAndroid, Documents } from "./platform";
import {
  alertStatus,
  cancelAllAndroidAlerts,
  enableAlerts,
  enableExactAlerts,
  syncAndroidAlerts,
  testAndroidAlert,
} from "./android-alerts";
import { decryptBackup, encryptBackup } from "./backup-crypto";
import { download, exportICS } from "./calendar-export";
import { parseBackup, mergeData } from "./storage";
import regions from "./data/regions.json";
export default function OfflineSettings({ section }: { section: string }) {
  const { data, update, now, notify } = useApp();
  const [draft, setDraft] = useState(data.settings);
  const [offsets, setOffsets] = useState(data.settings.alertOffsets.join(", "));
  const [status, setStatus] = useState({
    permission: "preview",
    exact: false,
    count: 0,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [incoming, setIncoming] = useState<AppData | null>(null);
  const [importMode, setImportMode] = useState("merge");
  const [deleting, setDeleting] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const refresh = async () => {
    try {
      setStatus(await alertStatus());
    } catch {
      setError("Android notification settings could not be read. Try again.");
    }
  };
  useEffect(() => {
    void refresh();
    if (!nativeAndroid) return;
    const listener = AndroidApp.addListener("appStateChange", (e) => {
      if (e.isActive) void refresh();
    });
    return () => {
      void listener.then((l) => l.remove());
    };
  }, []);
  async function action(fn: () => Promise<unknown>) {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
      await refresh();
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    await action(async () => {
      const settings = settingsSchema.parse({
        ...draft,
        theme: "light",
        alertOffsets: offsets
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map(Number),
      });
      await update((d) => ({ ...d, settings }));
      notify(
        "Settings saved. Existing reminders keep their own alerts and timezone.",
      );
    });
  }
  async function readBackup(content: string) {
    if (new TextEncoder().encode(content).length > 10 * 1024 * 1024)
      throw new Error("Backups must be smaller than 10 MB.");
    setIncoming(
      parseBackup(await decryptBackup(JSON.parse(content), passphrase)),
    );
  }
  async function importFile(e: ChangeEvent<HTMLInputElement>) {
    setIncoming(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await action(async () => {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("Backups must be smaller than 10 MB.");
      await readBackup(await file.text());
    });
  }
  const titles: Record<string, string> = {
    settings: "General settings",
    holidays: "Holidays",
    notifications: "Notifications",
    permissions: "Get your booking alerts",
    data: "Data & backup",
    about: "About BookOnTime",
  };
  const notificationPages = ["notifications", "permissions"].includes(section);
  return (
    <>
      <a className="text-link back" href="#more">
        <ArrowLeft size={18} />
        More
      </a>
      {section === "permissions" && (
        <div className="more-brand">
          <Brand />
        </div>
      )}
      <PageHeading title={titles[section]} />
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {["settings", "holidays"].includes(section) && (
        <form className="wizard panel" onSubmit={save}>
          {section === "settings" && (
            <>
              <h2>
                <SettingsIcon size={20} />
                General settings
              </h2>
              <Field label="Timezone">
                <input
                  required
                  list="timezones"
                  value={draft.timezone}
                  onChange={(e) =>
                    setDraft({ ...draft, timezone: e.target.value })
                  }
                />
              </Field>
              <Field label="Date format">
                <select
                  value={draft.dateFormat}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      dateFormat: e.target.value as typeof draft.dateFormat,
                    })
                  }
                >
                  <option value="friendly">Friendly</option>
                  <option value="iso">YYYY-MM-DD</option>
                  <option value="day-first">DD/MM/YYYY</option>
                </select>
              </Field>
              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.hour12}
                  onChange={(e) =>
                    setDraft({ ...draft, hour12: e.target.checked })
                  }
                />
                12-hour time
              </label>
              <h2>Default reminder alerts</h2>
              <Field
                label="Default alert offsets in minutes"
                hint="1440 = 1 day; 60 = 1 hour; 0 = at opening."
              >
                <input
                  value={offsets}
                  onChange={(e) => setOffsets(e.target.value)}
                />
              </Field>
              <div className="info">White & blue appearance · Inter font</div>
            </>
          )}
          <h2>
            <CalendarDays size={20} />
            Holidays
          </h2>
          <Field label="Country / region">
            <select value="IN" disabled>
              <option value="IN">India</option>
            </select>
          </Field>
          <Field label="State / region">
            <select
              value={draft.primaryRegion}
              onChange={(e) =>
                setDraft({ ...draft, primaryRegion: e.target.value })
              }
            >
              {Object.entries(regions).map(([id, name]) => (
                <option value={id} key={id}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          {(["national", "regional", "longWeekends"] as const).map((key, i) => (
            <label className="check" key={key}>
              <input
                type="checkbox"
                checked={draft[key]}
                onChange={(e) =>
                  setDraft({ ...draft, [key]: e.target.checked })
                }
              />
              {
                [
                  "National holidays",
                  "Regional holidays",
                  "Long weekend context",
                ][i]
              }
            </label>
          ))}
          <details>
            <summary>Additional regions & weekend days</summary>
            <div className="region-checks">
              {Object.entries(regions).map(([id, name]) => (
                <label className="check" key={id}>
                  <input
                    type="checkbox"
                    checked={draft.additionalRegions.includes(id)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        additionalRegions: e.target.checked
                          ? [...draft.additionalRegions, id]
                          : draft.additionalRegions.filter((r) => r !== id),
                      })
                    }
                  />
                  {name}
                </label>
              ))}
            </div>
            <div className="weekend-checks">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                (day, i) => (
                  <label className="check" key={day}>
                    <input
                      type="checkbox"
                      checked={draft.weekendDays.includes(i + 1)}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          weekendDays: e.target.checked
                            ? [...draft.weekendDays, i + 1]
                            : draft.weekendDays.filter((v) => v !== i + 1),
                        })
                      }
                    />
                    {day}
                  </label>
                ),
              )}
            </div>
          </details>
          <div className="info">
            <ShieldCheck size={18} />
            <span>
              2026–2031 holiday data is included offline. Future festival dates
              can change and are marked tentative.
            </span>
          </div>
          <button className="primary wide" disabled={busy}>
            Save settings
          </button>
        </form>
      )}
      {notificationPages && (
        <div className="wizard settings-cards">
          {section === "permissions" && (
            <p>
              Allow notifications to receive your booking alerts on this phone.
              You control when you are reminded.
            </p>
          )}
          {!nativeAndroid && (
            <div className="info">
              Browser preview. Native permissions and delivery are tested in the
              Android emulator.
            </div>
          )}
          <section className="panel">
            <h2>
              <Bell size={22} />
              Allow notifications
            </h2>
            <p>Get alerts for your reminders.</p>
            <strong>
              {status.permission === "granted"
                ? "Enabled"
                : status.permission === "preview"
                  ? "Android preview"
                  : status.permission === "denied"
                    ? "Blocked in Android settings"
                    : "Not enabled"}
            </strong>
            <button
              className="primary wide"
              disabled={busy || !nativeAndroid}
              onClick={() =>
                void action(async () => {
                  await enableAlerts();
                  await syncAndroidAlerts(data.reminders, true);
                })
              }
            >
              Allow notifications
            </button>
            {status.permission === "denied" && (
              <button
                className="wide"
                onClick={() => void action(() => Documents.openSettings())}
              >
                Open Android app settings
              </button>
            )}
          </section>
          <section className="panel">
            <h2>
              <Clock size={22} />
              Alarms & reminders access
            </h2>
            <p>Allow precise timing for booking openings.</p>
            <div className="permission-state">
              <Check size={18} />
              {status.exact ? "Allowed" : "Not allowed"}
            </div>
            <button
              className="wide"
              disabled={busy || !nativeAndroid}
              onClick={() => void action(enableExactAlerts)}
            >
              Review alarm access
            </button>
            <p className="hint">
              Without this access Android may delay alerts. Closely spaced
              alerts can also be delayed while the phone is idle.
            </p>
          </section>
          <section className="panel">
            <h2>Scheduled alerts</h2>
            <strong className="scheduled-count">{status.count}</strong>
            <button
              className="wide"
              disabled={busy || !nativeAndroid}
              onClick={() =>
                void action(async () => {
                  await syncAndroidAlerts(data.reminders, true);
                  notify("Scheduled alerts checked.");
                })
              }
            >
              Check scheduled alerts
            </button>
          </section>
          <section className="panel">
            <h2>
              <Play size={22} />
              Test notification
            </h2>
            <p>Schedule a test alert for 10 seconds from now.</p>
            <button
              className="primary wide"
              disabled={busy || status.permission !== "granted"}
              onClick={() =>
                void action(async () => {
                  await testAndroidAlert();
                  notify("Test scheduled. Lock the screen to check delivery.");
                })
              }
            >
              Send test notification
            </button>
          </section>
          <div className="info">
            <ShieldCheck size={20} />
            <span>
              Alerts are scheduled on this phone. Booking titles and notes are
              kept out of notification content. Force-stopping the app or
              denying permissions prevents delivery.
            </span>
          </div>
        </div>
      )}
      {section === "data" && (
        <div className="wizard settings-cards">
          <section className="panel">
            <h2>
              <ShieldCheck size={22} />
              Your data stays on this phone
            </h2>
            <p>
              No account, cloud sync, analytics or internet permission. Android
              automatic backup is disabled.
            </p>
            <Field
              label="Backup passphrase"
              hint="At least 12 characters. Keep it safe; it cannot be recovered."
            >
              <input
                type="password"
                autoComplete="off"
                minLength={12}
                maxLength={1024}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
              />
            </Field>
            <button
              className="wide"
              disabled={busy || passphrase.length < 12}
              onClick={() =>
                void action(async () => {
                  const content = await encryptBackup(
                    JSON.stringify(data),
                    passphrase,
                  );
                  if (
                    new TextEncoder().encode(content).length >
                    10 * 1024 * 1024
                  )
                    throw new Error("Backup exceeds the 10 MB limit.");
                  await download(
                    "bookontime-backup.json",
                    content,
                    "application/json",
                  );
                  setPassphrase("");
                  notify("Encrypted backup exported.");
                })
              }
            >
              <Download size={20} />
              Export encrypted backup
            </button>
            {nativeAndroid ? (
              <button
                className="wide"
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    setIncoming(null);
                    const file = await Documents.importFile();
                    await readBackup(file.content);
                  })
                }
              >
                <Upload size={20} />
                Import backup
              </button>
            ) : (
              <label className="button file-button wide">
                <Upload size={20} />
                Import backup
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => void importFile(e)}
                />
              </label>
            )}
            <p className="hint">
              Enter the passphrase before importing an encrypted file. Older
              unencrypted BookOnTime backups are supported. Export only to a
              location you trust.
            </p>
            {incoming && (
              <div className="import-review">
                <h3>Review import</h3>
                <p>
                  {incoming.reminders.length} reminders ·{" "}
                  {incoming.groups.length} groups
                </p>
                <Field label="Import behavior">
                  <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value)}
                  >
                    <option value="merge">Merge with existing data</option>
                    <option value="replace">Replace all existing data</option>
                  </select>
                </Field>
                <div className="actions">
                  <button
                    disabled={busy}
                    className="primary"
                    onClick={() =>
                      void action(async () => {
                        await update((d) =>
                          importMode === "replace"
                            ? incoming
                            : mergeData(d, incoming),
                        );
                        setIncoming(null);
                        setPassphrase("");
                        notify("Backup imported. Scheduled alerts updated.");
                      })
                    }
                  >
                    Confirm import
                  </button>
                  <button onClick={() => setIncoming(null)}>Cancel</button>
                </div>
              </div>
            )}
          </section>
          <section className="panel">
            <h2>Calendar export</h2>
            <p>
              Optional local file containing your booking details. No online
              calendar is opened.
            </p>
            <button
              className="wide"
              onClick={() =>
                void action(() =>
                  download(
                    "bookontime-openings.ics",
                    exportICS(
                      data.reminders.filter(
                        (r) =>
                          r.resolution === "active" &&
                          Date.parse(r.bookingOpeningAt) > now,
                      ),
                    ),
                    "text/calendar",
                  ),
                )
              }
            >
              Export calendar file
            </button>
          </section>
          <section className="panel">
            <button className="text-link" onClick={() => setDeleting(true)}>
              <Trash2 size={20} />
              Delete all data
            </button>
            <p className="hint">
              Uninstalling removes app data. Keep an encrypted backup if needed.
            </p>
          </section>
          {deleting && (
            <div className="modal-backdrop">
              <section
                className="panel confirmation-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-title"
              >
                <h2 id="delete-title">Delete all reminders?</h2>
                <p>
                  This removes reminders, groups, rules and settings, and
                  cancels scheduled alerts. It cannot be undone.
                </p>
                <Field label="Type DELETE to confirm">
                  <input
                    autoFocus
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                  />
                </Field>
                <div className="actions">
                  <button
                    disabled={busy}
                    onClick={() => {
                      setDeleting(false);
                      setDeleteText("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={busy || deleteText !== "DELETE"}
                    className="primary"
                    onClick={() =>
                      void action(async () => {
                        await cancelAllAndroidAlerts();
                        await update(() => initialData());
                        setIncoming(null);
                        setPassphrase("");
                        setDeleting(false);
                        setDeleteText("");
                        notify("All data deleted.");
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      )}
      {section === "about" && (
        <section className="wizard panel">
          <Brand />
          <h2>Book Before It’s Late.</h2>
          <p>Know when a ticket, reservation, registration or slot opens.</p>
          <div className="info">Fully offline Android app · Version 1.1.1</div>
          <p>
            No accounts, payments, cloud storage or tracking. All fonts, images
            and holiday data are included in the app.
          </p>
          <p>
            We store the reminder details you enter. Avoid entering sensitive
            information in titles or notes. No app can protect data on a
            compromised or unlocked device.
          </p>
        </section>
      )}
    </>
  );
}
