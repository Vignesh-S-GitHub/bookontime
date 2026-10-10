import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Trash2 } from "lucide-react";
import { Temporal } from "@js-temporal/polyfill";
import {
  alertsFor,
  blankRule,
  calculateOpening,
  categories,
  dateInZone,
  errorMessage,
  formatAt,
  localInstant,
  offsetsSchema,
  reminderSchema,
  ruleSchema,
  ruleSummary,
  type Reminder,
  type Rule,
} from "./domain";
import { CategoryIcon, Field, HolidayContext, PageHeading, useApp } from "./ui";
import { useHolidays } from "./hooks";
import { nativeAndroid, offlineApp } from "./platform";
import { hasScheduledReminder } from "./android-alerts";
import RuleFields from "./RuleFields";
const choices = [
  [1440, "1 day"],
  [60, "1 hour"],
  [30, "30 min"],
  [15, "15 min"],
  [5, "5 min"],
  [0, "At opening"],
] as const;
export default function ReminderForm({
  existing,
  duplicate = false,
  initialCategory,
}: {
  existing?: Reminder;
  duplicate?: boolean;
  initialCategory?: Rule["category"];
}) {
  const { data, update, go, notify } = useApp();
  const editing = !!existing && !duplicate;
  const [step, setStep] = useState(existing ? 2 : 1);
  const [mode, setMode] = useState<"calculate" | "known" | null>(
    existing?.mode ?? null,
  );
  const [category, setCategory] = useState<Rule["category"]>(
    existing?.category ?? initialCategory ?? "Train",
  );
  const [title, setTitle] = useState(
    existing ? existing.title + (duplicate ? " (copy)" : "") : "",
  );
  const [targetDate, setTargetDate] = useState(existing?.targetDate ?? "");
  const [targetTime, setTargetTime] = useState(existing?.targetTime ?? "");
  const [rule, setRule] = useState<Rule>(
    existing
      ? structuredClone(existing.rule)
      : {
          ...(data.rules.find((r) => r.category === category && !r.disabled) ??
            blankRule(category)),
          timezone: data.settings.timezone,
        },
  );
  const [route, setRoute] = useState(existing?.route ?? "");
  const [provider, setProvider] = useState(existing?.provider ?? "");
  const [serviceId, setServiceId] = useState(existing?.serviceId ?? "");
  const [bookingUrl, setBookingUrl] = useState(existing?.bookingUrl ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [groupId, setGroupId] = useState(existing?.groupId ?? "");
  const [newGroup, setNewGroup] = useState("");
  const [offsets, setOffsets] = useState(
    existing?.alertOffsets ?? data.settings.alertOffsets,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const [reference] = useState(
    editing ? existing.createdAt : Temporal.Now.instant().toString(),
  );
  const effectiveRule = {
    ...rule,
    category,
    ...(mode === "known" ? { type: "fixed" as const } : {}),
  };
  let opening = "",
    calculationError = "";
  try {
    ruleSchema.parse(effectiveRule);
    if (mode === "calculate" && !targetDate)
      throw new Error("Choose a journey / event date.");
    opening = calculateOpening(
      effectiveRule,
      targetDate,
      targetTime,
      reference,
    );
  } catch (e) {
    calculationError = errorMessage(e);
  }
  const { holidays, error: holidayError } = useHolidays(
    [targetDate, opening ? dateInZone(opening, rule.timezone) : ""],
    data.settings,
  );
  useEffect(() => {
    const back = (e: Event) => {
      e.preventDefault();
      if (savedId) go(`detail/${savedId}`);
      else if (step > (editing ? 2 : 1)) setStep(step - 1);
      else if (window.confirm("Leave this form? Unsaved changes will be lost."))
        go(editing ? `detail/${existing.id}` : "home");
    };
    window.addEventListener("bookontime-back", back);
    return () => window.removeEventListener("bookontime-back", back);
  }, [step, editing, existing, savedId, go]);
  function changeCategory(value: Rule["category"]) {
    setCategory(value);
    const preset =
      data.rules.find((r) => r.category === value && !r.disabled) ??
      blankRule(value);
    setRule({
      ...preset,
      timezone: data.settings.timezone,
      ...(mode === "known"
        ? {
            type: "fixed",
            fixedDate: rule.fixedDate,
            verificationStatus: "custom",
          }
        : {}),
    });
  }
  function next() {
    setError("");
    if (step === 1 && !mode) {
      setError("Choose how you know the booking opening time.");
      return;
    }
    if (step === 2 && (!opening || !title.trim())) {
      setError(!title.trim() ? "Enter a reminder title." : calculationError);
      return;
    }
    if (step === 3) {
      try {
        offsetsSchema.parse(offsets);
        if (groupId === "__new" && !newGroup.trim())
          throw new Error("Enter a group name.");
      } catch (e) {
        setError(errorMessage(e));
        return;
      }
    }
    setStep(step + 1);
    window.scrollTo(0, 0);
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (step !== 4 && !editing) {
      next();
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (!opening) throw new Error(calculationError);
      const id = editing ? existing.id : crypto.randomUUID();
      const group =
        groupId === "__new"
          ? { id: crypto.randomUUID(), name: newGroup.trim() }
          : null;
      if (group && !group.name) throw new Error("Enter a group name.");
      const reminder = reminderSchema.parse({
        id,
        title,
        category,
        mode,
        route,
        provider,
        serviceId,
        targetDate,
        targetTime,
        targetAt:
          targetDate && targetTime
            ? localInstant(targetDate, targetTime, rule.timezone)
            : undefined,
        bookingOpeningAt: opening,
        timezone: rule.timezone,
        rule: effectiveRule,
        alertOffsets: offsets,
        alertAt: alertsFor(opening, offsets),
        bookingUrl,
        notes,
        groupId: group?.id ?? groupId,
        resolution: editing ? existing.resolution : "active",
        createdAt: reference,
        updatedAt: Temporal.Now.instant().toString(),
      });
      await update((d) => ({
        ...d,
        groups: group ? [...d.groups, group] : d.groups,
        reminders: [...d.reminders.filter((r) => r.id !== id), reminder],
      }));
      notify("Reminder saved on this device.");
      if (editing) go(`detail/${id}`);
      else {
        setSavedId(id);
        if (nativeAndroid) {
          try {
            setScheduled(await hasScheduledReminder(reminder));
          } catch {
            setScheduled(false);
          }
        }
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const titleText = editing
    ? "Edit reminder"
    : duplicate
      ? "Duplicate reminder"
      : "Add reminder";
  const alerts = (
    <>
      <h2>Set reminder alerts</h2>
      <p className="hint">Choose when to be reminded before booking opens.</p>
      <div className="alert-chips">
        {choices.map(([value, label]) => (
          <button
            type="button"
            key={value}
            aria-pressed={offsets.includes(value)}
            className={offsets.includes(value) ? "selected" : ""}
            onClick={() =>
              setOffsets(
                offsets.includes(value)
                  ? offsets.filter((v) => v !== value)
                  : [...offsets, value],
              )
            }
          >
            {label}
            {value > 0 && <small>before</small>}
          </button>
        ))}
      </div>
      <details>
        <summary>Custom alert offsets</summary>
        <Field
          label="Offsets in minutes"
          hint="Separate with commas. 0 = at opening."
        >
          <input
            value={offsets.join(", ")}
            onChange={(e) =>
              setOffsets(
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map(Number),
              )
            }
          />
        </Field>
      </details>
      <Field label="Group (optional)">
        <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          <option value="">No group</option>
          {data.groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
          <option value="__new">Create a group…</option>
        </select>
      </Field>
      {groupId === "__new" && (
        <Field label="New group name">
          <input
            maxLength={200}
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
          />
        </Field>
      )}
      <Field
        label="Booking URL (optional)"
        hint={
          offlineApp
            ? "Stored as reference text only. This app never opens websites."
            : undefined
        }
      >
        <input
          type="url"
          maxLength={2048}
          value={bookingUrl}
          onChange={(e) => setBookingUrl(e.target.value)}
          placeholder="https://…"
        />
      </Field>
      <Field
        label="Notes (optional)"
        hint="Do not enter passwords, identity numbers or payment details."
      >
        <textarea
          rows={3}
          maxLength={4000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
    </>
  );
  return (
    <>
      <a
        className="text-link back"
        href={editing ? `#detail/${existing.id}` : "#home"}
        onClick={(e) => {
          if (
            !savedId &&
            !window.confirm("Leave this form? Unsaved changes will be lost.")
          )
            e.preventDefault();
        }}
      >
        <ArrowLeft size={18} />
        Back
      </a>
      <PageHeading title={titleText} />
      {!editing && (
        <div className="wizard-steps" aria-label={`Step ${step} of 4`}>
          {["Type", "Details", "Alerts", "Review"].map((s, i) => (
            <div
              key={s}
              className={step === i + 1 ? "active" : step > i + 1 ? "done" : ""}
            >
              <span>{i + 1}</span>
              <small>{s}</small>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={save} className="wizard panel">
        {step === 1 && (
          <>
            <h2>What do you want to be reminded about?</h2>
            <div className="type-grid">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c}
                  aria-pressed={category === c}
                  className={category === c ? "selected" : ""}
                  onClick={() => changeCategory(c)}
                >
                  <CategoryIcon category={c} />
                  <span>{c}</span>
                </button>
              ))}
            </div>
            <h3>How do you know the booking time?</h3>
            <div className="creation-modes">
              <button
                type="button"
                aria-pressed={mode === "calculate"}
                className={mode === "calculate" ? "selected" : ""}
                onClick={() => {
                  setMode("calculate");
                  const r =
                    data.rules.find(
                      (r) => r.category === category && !r.disabled,
                    ) ?? blankRule(category);
                  setRule({ ...r, timezone: data.settings.timezone });
                }}
              >
                Calculate opening
                <small>From journey / event date and a rule</small>
              </button>
              <button
                type="button"
                aria-pressed={mode === "known"}
                className={mode === "known" ? "selected" : ""}
                onClick={() => {
                  setMode("known");
                  setRule({
                    ...rule,
                    type: "fixed",
                    verificationStatus: "custom",
                  });
                }}
              >
                I know the opening time
                <small>Enter an announced date and time</small>
              </button>
            </div>
          </>
        )}
        {(step === 2 || editing) && (
          <>
            <div className="form-category">
              <CategoryIcon category={category} />
              <div>
                <strong>{category}</strong>
                <small>
                  {mode === "known"
                    ? "Enter the announced booking opening."
                    : "Set your target date to calculate the opening."}
                </small>
              </div>
            </div>
            {editing && (
              <Field label="Category">
                <select
                  value={category}
                  onChange={(e) =>
                    changeCategory(e.target.value as Rule["category"])
                  }
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Title">
              <input
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Chennai → Coimbatore"
              />
            </Field>
            {["Train", "Bus", "Flight"].includes(category) && (
              <div className="form-grid">
                <Field label="From">
                  <input
                    maxLength={145}
                    value={route.includes(" → ") ? route.split(" → ")[0] : ""}
                    onChange={(e) =>
                      setRoute(
                        `${e.target.value} → ${route.split(" → ")[1] ?? ""}`,
                      )
                    }
                  />
                </Field>
                <Field label="To">
                  <input
                    maxLength={145}
                    value={route.split(" → ")[1] ?? ""}
                    onChange={(e) =>
                      setRoute(
                        `${route.includes(" → ") ? route.split(" → ")[0] : ""} → ${e.target.value}`,
                      )
                    }
                  />
                </Field>
              </div>
            )}
            <Field
              label={
                mode === "known"
                  ? "Journey / event date (optional)"
                  : "Journey / event date"
              }
            >
              <input
                type="date"
                required={mode === "calculate"}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </Field>
            {mode === "known" ? (
              <>
                <Field label="Booking opening date">
                  <input
                    type="date"
                    required
                    value={rule.fixedDate}
                    onChange={(e) =>
                      setRule({ ...rule, fixedDate: e.target.value })
                    }
                  />
                </Field>
                <Field label="Opening time">
                  <input
                    type="time"
                    required
                    value={rule.openingTime}
                    onChange={(e) =>
                      setRule({ ...rule, openingTime: e.target.value })
                    }
                  />
                </Field>
                <Field label="Timezone">
                  <input
                    required
                    list="timezones"
                    value={rule.timezone}
                    onChange={(e) =>
                      setRule({ ...rule, timezone: e.target.value })
                    }
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Use a saved rule">
                  <select
                    value={rule.id}
                    onChange={(e) => {
                      const r = data.rules.find((r) => r.id === e.target.value);
                      if (r) setRule(structuredClone(r));
                    }}
                  >
                    {!data.rules.some((r) => r.id === rule.id) && (
                      <option value={rule.id}>Reminder’s rule</option>
                    )}
                    {data.rules
                      .filter((r) => !r.disabled)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                  </select>
                </Field>
                {rule.type === "relative" &&
                !["minutes", "hours"].includes(rule.unit) ? (
                  <>
                    <div className="form-grid">
                      <Field label="Advance quantity">
                        <input
                          type="number"
                          min={0}
                          max={10000}
                          required
                          value={rule.quantity}
                          onChange={(e) =>
                            setRule({
                              ...rule,
                              quantity: Number(e.target.value),
                              verificationStatus: "custom",
                              lastVerifiedAt: "",
                            })
                          }
                        />
                      </Field>
                      <Field label="Advance unit">
                        <select
                          value={rule.unit}
                          onChange={(e) =>
                            setRule({
                              ...rule,
                              unit: e.target.value as Rule["unit"],
                              verificationStatus: "custom",
                              lastVerifiedAt: "",
                            })
                          }
                        >
                          {["minutes", "hours", "days", "weeks", "months"].map(
                            (u) => (
                              <option key={u}>{u}</option>
                            ),
                          )}
                        </select>
                      </Field>
                    </div>
                    <Field label="Opening time">
                      <input
                        type="time"
                        required
                        value={rule.openingTime}
                        onChange={(e) =>
                          setRule({
                            ...rule,
                            openingTime: e.target.value,
                            verificationStatus: "custom",
                            lastVerifiedAt: "",
                          })
                        }
                      />
                    </Field>
                    <details>
                      <summary>Rule options & timezone</summary>
                      <RuleFields
                        rule={rule}
                        onChange={(r) =>
                          setRule({
                            ...r,
                            verificationStatus: "custom",
                            lastVerifiedAt: "",
                          })
                        }
                      />
                    </details>
                  </>
                ) : (
                  <RuleFields
                    rule={rule}
                    onChange={(r) =>
                      setRule({
                        ...r,
                        verificationStatus: "custom",
                        lastVerifiedAt: "",
                      })
                    }
                  />
                )}
              </>
            )}
            <details>
              <summary>Route, provider & target time</summary>
              <Field label="Route / location">
                <input
                  maxLength={300}
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                />
              </Field>
              <Field label="Provider">
                <input
                  maxLength={150}
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                />
              </Field>
              <Field label="Service identifier">
                <input
                  maxLength={100}
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                />
              </Field>
              <Field label="Target time (optional)">
                <input
                  type="time"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                />
              </Field>
            </details>
            {opening && (
              <div className="opening-preview">
                <small>
                  {mode === "known"
                    ? "Booking opens"
                    : "Calculated booking opening"}
                </small>
                <strong>
                  {formatAt(opening, data.settings, rule.timezone)}
                </strong>
                <small>{rule.timezone}</small>
              </div>
            )}
            <div className="info">
              {rule.verificationStatus === "verified"
                ? "Verified rule"
                : rule.verificationStatus === "custom"
                  ? "Custom rule"
                  : "Needs verification"}{" "}
              · Confirm the opening with your provider.
            </div>
            {editing && alerts}
          </>
        )}
        {step === 3 && !editing && alerts}
        {step === 4 && !editing && (
          <>
            <h2>{savedId ? "Reminder saved" : "Review reminder"}</h2>
            <p className="hint">
              {savedId
                ? "Your data stays on this device."
                : "Check all details before saving."}
            </p>
            <div className="review-card">
              <div className="form-category">
                <CategoryIcon category={category} />
                <strong>{title}</strong>
              </div>
              <dl>
                <dt>Journey / event</dt>
                <dd>{targetDate || "Not specified"}</dd>
                <dt>Booking opens</dt>
                <dd>
                  {opening && formatAt(opening, data.settings, rule.timezone)}
                </dd>
                <dt>Timezone</dt>
                <dd>{rule.timezone}</dd>
                <dt>Rule</dt>
                <dd>{ruleSummary(effectiveRule)}</dd>
                <dt>Verification</dt>
                <dd>{rule.verificationStatus.replaceAll("-", " ")}</dd>
                <dt>Alerts</dt>
                <dd>
                  {offsets
                    .slice()
                    .sort((a, b) => b - a)
                    .map(
                      (v) => choices.find((c) => c[0] === v)?.[1] ?? `${v} min`,
                    )
                    .join(", ")}
                </dd>
                <dt>Group</dt>
                <dd>
                  {groupId === "__new"
                    ? newGroup
                    : data.groups.find((g) => g.id === groupId)?.name ||
                      "No group"}
                </dd>
                <dt>Notes</dt>
                <dd className="preserve">{notes || "None"}</dd>
              </dl>
            </div>
            {holidayError ? (
              <p className="hint">{holidayError}</p>
            ) : (
              <HolidayContext
                date={targetDate}
                holidays={holidays}
                settings={data.settings}
              />
            )}
            {savedId && (
              <div className="info">
                <Check size={18} />
                {scheduled
                  ? "Alerts scheduled on this device."
                  : nativeAndroid
                    ? "Saved. Open Notifications to check alert permissions."
                    : "Saved. Native alerts can be tested in the Android app."}
              </div>
            )}
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {savedId ? (
          <>
            <a className="button primary wide" href={`#detail/${savedId}`}>
              View reminder
            </a>
            {!scheduled && offlineApp && (
              <a className="button wide" href="#permissions">
                Set up Android alerts
              </a>
            )}
          </>
        ) : (
          <div className="wizard-actions">
            {!editing && step > 1 && (
              <button
                type="button"
                onClick={() => {
                  setStep(step - 1);
                  setError("");
                }}
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
            {editing || step === 4 ? (
              <button className="primary" disabled={busy || !opening}>
                {busy ? "Saving…" : editing ? "Save changes" : "Save reminder"}
              </button>
            ) : (
              <button
                type="button"
                className="primary"
                onClick={(event) => {
                  event.preventDefault();
                  next();
                }}
              >
                Next
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
        {editing && (
          <div className="edit-actions">
            <a className="button wide" href={`#duplicate/${existing.id}`}>
              <Copy size={17} />
              Duplicate reminder
            </a>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                if (
                  window.confirm(
                    "Delete this reminder and its scheduled alerts?",
                  )
                )
                  void update((d) => ({
                    ...d,
                    reminders: d.reminders.filter((r) => r.id !== existing.id),
                  }))
                    .then(() => go("reminders"))
                    .catch(() => setError("Could not delete this reminder."));
              }}
            >
              <Trash2 size={16} />
              Delete reminder
            </button>
          </div>
        )}
      </form>
    </>
  );
}
