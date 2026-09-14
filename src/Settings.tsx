import { errorMessage } from "./domain";
import { useState, type FormEvent, type ChangeEvent } from "react";
import {
  Download,
  Upload,
  Trash2,
  Bell,
  Save,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import {
  initialData,
  settingsSchema,
  type AppData,
  type Settings as SettingsType,
} from "./domain";
import { download, exportICS } from "./calendar-export";
import { mergeData, parseBackup } from "./storage";
import { showNotification } from "./notifications";
import { Field, PageHeading, PrivacyNote, useApp } from "./ui";
import regions from "./data/regions.json";
export default function Settings({
  install,
  online,
}: {
  install: () => void;
  online: boolean;
}) {
  const { data, update, now, notify } = useApp();
  const [draft, setDraft] = useState(data.settings);
  const [offsets, setOffsets] = useState(draft.alertOffsets.join(", "));
  const [error, setError] = useState("");
  const [permission, setPermission] = useState(
    "Notification" in window ? Notification.permission : "unsupported",
  );
  const [incoming, setIncoming] = useState<AppData | null>(null);
  const [importMode, setImportMode] = useState("merge");
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const set = <K extends keyof SettingsType>(k: K, v: SettingsType[K]) =>
    setDraft({ ...draft, [k]: v });
  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      const settings = settingsSchema.parse({
        ...draft,
        alertOffsets: offsets
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map(Number),
      });
      await update((d) => ({ ...d, settings }));
      setError("");
      notify(
        "Settings saved. Existing reminders keep their own timezone and alerts.",
      );
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function importFile(e: ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024)
        throw new Error("Backups must be smaller than 10 MB.");
      setIncoming(parseBackup(JSON.parse(await file.text())));
      setError("");
    } catch (e) {
      setIncoming(null);
      setError(errorMessage(e));
    }
    e.target.value = "";
  }
  async function applyImport() {
    if (!incoming) return;
    try {
      await update((d) =>
        importMode === "replace" ? incoming : mergeData(d, incoming),
      );
      if (importMode === "replace") {
        setDraft(incoming.settings);
        setOffsets(incoming.settings.alertOffsets.join(", "));
      }
      setIncoming(null);
      notify("Backup imported successfully.");
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <>
      <PageHeading
        title="Settings"
        subtitle="Make BookOnTime work for your plans."
      />
      <div className="settings-layout">
        <form className="form-sections" onSubmit={save}>
          <section className="panel">
            <h2>General</h2>
            <div className="form-grid">
              <Field label="Default timezone">
                <input
                  required
                  list="timezones"
                  value={draft.timezone}
                  onChange={(e) => set("timezone", e.target.value)}
                />
              </Field>
              <Field label="Date format">
                <select
                  value={draft.dateFormat}
                  onChange={(e) =>
                    set(
                      "dateFormat",
                      e.target.value as SettingsType["dateFormat"],
                    )
                  }
                >
                  <option value="friendly">11 Sep 2026</option>
                  <option value="iso">2026-09-11</option>
                  <option value="day-first">11/09/2026</option>
                </select>
              </Field>
              <Field label="Time format">
                <select
                  value={draft.hour12 ? "12" : "24"}
                  onChange={(e) => set("hour12", e.target.value === "12")}
                >
                  <option value="12">12-hour</option>
                  <option value="24">24-hour</option>
                </select>
              </Field>
              <Field label="Appearance">
                <input value="White & blue · Inter" readOnly />
              </Field>
            </div>
          </section>
          <section className="panel">
            <h2>Holidays & regions</h2>
            <div className="form-grid">
              <Field label="Country">
                <select value={draft.country} onChange={() => {}}>
                  <option value="IN">India</option>
                </select>
              </Field>
              <Field label="Primary State / Region">
                <select
                  value={draft.primaryRegion}
                  onChange={(e) => set("primaryRegion", e.target.value)}
                >
                  {Object.entries(regions).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <fieldset>
              <legend>Additional States / Regions</legend>
              <div className="region-checks">
                {Object.entries(regions)
                  .filter(([code]) => code !== draft.primaryRegion)
                  .map(([code, name]) => (
                    <label className="check" key={code}>
                      <input
                        type="checkbox"
                        checked={draft.additionalRegions.includes(code)}
                        onChange={(e) =>
                          set(
                            "additionalRegions",
                            e.target.checked
                              ? [...draft.additionalRegions, code]
                              : draft.additionalRegions.filter(
                                  (c) => c !== code,
                                ),
                          )
                        }
                      />
                      {name}
                    </label>
                  ))}
              </div>
            </fieldset>
            {(
              [
                ["national", "Show National Holidays"],
                ["regional", "Show Regional Holidays"],
                ["longWeekends", "Show Long Weekends"],
              ] as const
            ).map(([key, label]) => (
              <label className="check" key={key}>
                <input
                  type="checkbox"
                  checked={draft[key]}
                  onChange={(e) => set(key, e.target.checked)}
                />
                {label}
              </label>
            ))}
            <fieldset>
              <legend>Weekend days</legend>
              <div className="weekend-checks">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, i) => (
                    <label className="check" key={day}>
                      <input
                        type="checkbox"
                        checked={draft.weekendDays.includes(i + 1)}
                        onChange={(e) =>
                          set(
                            "weekendDays",
                            e.target.checked
                              ? [...draft.weekendDays, i + 1]
                              : draft.weekendDays.filter((d) => d !== i + 1),
                          )
                        }
                      />
                      {day}
                    </label>
                  ),
                )}
              </div>
            </fieldset>
            <p className="hint">
              India baseline and selected regional festivals are included for
              2026–2029. Coverage varies by region; tentative dates should be
              verified with official local announcements.
            </p>
          </section>
          <section className="panel">
            <h2>Reminder defaults</h2>
            <Field
              label="Default alert offsets in minutes"
              hint="Comma-separated. 1440 = 1 day; 0 = at opening."
            >
              <input
                required
                value={offsets}
                onChange={(e) => setOffsets(e.target.value)}
              />
            </Field>
          </section>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary">
            <Save size={18} />
            Save Settings
          </button>
        </form>
        <div className="form-sections">
          <section className="panel">
            <h2>
              <Bell size={20} />
              Notifications
            </h2>
            <p>
              Permission: <strong>{permission}</strong>
            </p>
            <div className="actions">
              <button
                disabled={
                  permission === "unsupported" || permission === "denied"
                }
                onClick={() => {
                  void Notification.requestPermission()
                    .then(setPermission)
                    .catch(() =>
                      notify("Notification permission could not be requested."),
                    );
                }}
              >
                Enable Notifications
              </button>
              <button
                disabled={permission !== "granted"}
                onClick={() =>
                  void showNotification(
                    "BookOnTime",
                    "Your test notification is ready.",
                  )
                    .then(() => notify("Test notification sent."))
                    .catch((e) => notify(e.message))
                }
              >
                Test Notification
              </button>
            </div>
            {permission === "denied" && (
              <p className="hint">
                Notifications are blocked. Change this site’s permission in
                browser settings.
              </p>
            )}
            <p className="hint">
              A fully closed static PWA cannot guarantee an alert at an exact
              future time. Export opening dates to your calendar as the reliable
              fallback.
            </p>
          </section>
          <section className="panel" id="data">
            <h2>
              <ShieldCheck size={20} />
              Data & Privacy
            </h2>
            <PrivacyNote />
            <p className="small">
              Clearing browser storage or uninstalling the PWA can remove your
              reminders. Keep a backup. Exported files contain your booking
              details and notes.
            </p>
            <div className="actions">
              <button
                onClick={() =>
                  download(
                    "bookontime-backup.json",
                    JSON.stringify(data, null, 2),
                    "application/json",
                  )
                }
              >
                <Download size={17} />
                Export JSON
              </button>
              <label className="button file-button">
                <Upload size={17} />
                Import JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => void importFile(e)}
                />
              </label>
              <button
                onClick={() =>
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
                  )
                }
              >
                Export Calendar
              </button>
            </div>
            {incoming && (
              <div className="import-review">
                <h3>Review import</h3>
                <p>
                  {incoming.reminders.length} reminders ·{" "}
                  {incoming.rules.length} rules · {incoming.groups.length}{" "}
                  groups
                </p>
                <Field label="Import behavior">
                  <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value)}
                  >
                    <option value="merge">
                      Merge — incoming matching IDs replace existing records
                    </option>
                    <option value="replace">
                      Replace — overwrite all current records and settings
                    </option>
                  </select>
                </Field>
                <div className="actions">
                  <button
                    className="primary"
                    onClick={() => void applyImport()}
                  >
                    Confirm Import
                  </button>
                  <button onClick={() => setIncoming(null)}>Cancel</button>
                </div>
              </div>
            )}
            <hr />
            {!deleting ? (
              <button className="danger" onClick={() => setDeleting(true)}>
                <Trash2 size={17} />
                Delete All Data
              </button>
            ) : (
              <div>
                <p>
                  This removes all reminders, groups, custom rules and settings
                  from this device.
                </p>
                <Field label="Type DELETE to confirm">
                  <input
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                  />
                </Field>
                <div className="actions">
                  <button
                    className="danger"
                    disabled={deleteText !== "DELETE"}
                    onClick={() =>
                      void update(() => initialData())
                        .then(() => {
                          setDraft(initialData().settings);
                          setOffsets(
                            initialData().settings.alertOffsets.join(", "),
                          );
                          setDeleting(false);
                          setDeleteText("");
                          notify("All app records reset to defaults.");
                        })
                        .catch(() => {})
                    }
                  >
                    Confirm Delete All Data
                  </button>
                  <button onClick={() => setDeleting(false)}>Cancel</button>
                </div>
              </div>
            )}
          </section>
          <section className="panel" id="install">
            <h2>
              <Smartphone size={20} />
              App
            </h2>
            <p>
              {online
                ? "Online"
                : "Offline — your saved reminders are available"}
            </p>
            <p className="small muted">Version 1.0.0</p>
            <button onClick={install}>Install App</button>
            <p className="hint">
              Android: use your browser’s Install app or Add to Home screen.
              iPhone/iPad: Safari → Share → Add to Home Screen. Desktop: use the
              browser’s install icon.
            </p>
          </section>
          <section className="panel" id="about">
            <h2>About BookOnTime</h2>
            <strong>Book Before It’s Late.</strong>
            <p>
              Know when your next ticket, reservation, registration or slot
              opens. Plan the opening moment and book directly with your
              provider.
            </p>
            <p className="small">
              No account. No cloud sync. Your booking information stays in this
              browser unless you export or share it.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
