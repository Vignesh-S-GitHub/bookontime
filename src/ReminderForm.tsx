import { errorMessage } from "./domain";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CalendarDays, Clock, Save } from "lucide-react";
import { Temporal } from "@js-temporal/polyfill";
import {
  alertsFor,
  blankRule,
  calculateOpening,
  categories,
  formatAt,
  localInstant,
  reminderSchema,
  ruleSchema,
  ruleSummary,
  type Reminder,
  type Rule,
} from "./domain";
import { CategoryIcon, Field, HolidayContext, PageHeading, useApp } from "./ui";
import { useHolidays } from "./hooks";
import RuleFields from "./RuleFields";
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
  const [mode, setMode] = useState<"calculate" | "known" | null>(
    existing?.mode ?? null,
  );
  const [category, setCategory] = useState<Rule["category"]>(
    existing?.category ?? initialCategory ?? "Train",
  );
  const [title, setTitle] = useState(
    existing ? `${existing.title}${duplicate ? " (copy)" : ""}` : "",
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
  const [offsetText, setOffsetText] = useState(
    (existing?.alertOffsets ?? data.settings.alertOffsets).join(", "),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reference] = useState(
    existing && !duplicate
      ? existing.createdAt
      : Temporal.Now.instant().toString(),
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
      throw new Error("Choose a target date to calculate your opening.");
    opening = calculateOpening(
      effectiveRule,
      targetDate,
      targetTime,
      reference,
    );
  } catch (e) {
    calculationError =
      e instanceof Error && e.name !== "ZodError"
        ? e.message
        : "Enter a valid opening date, time and timezone.";
  }
  const { holidays, error: holidayError } = useHolidays(
    [targetDate, opening ? opening.slice(0, 10) : ""],
    data.settings,
  );
  function changeCategory(value: Rule["category"]) {
    setCategory(value);
    if (!existing) {
      const preset = data.rules.find(
        (r) => r.category === value && !r.disabled,
      );
      if (preset) setRule({ ...preset, timezone: data.settings.timezone });
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!opening) {
      setError(calculationError);
      return;
    }
    setBusy(true);
    try {
      const id = existing && !duplicate ? existing.id : crypto.randomUUID();
      const group =
        groupId === "__new"
          ? { id: crypto.randomUUID(), name: newGroup.trim() }
          : null;
      if (group && !group.name) throw new Error("Enter a group name.");
      const offsets = [
        ...new Set(
          offsetText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map(Number),
        ),
      ].sort((a, b) => b - a);
      const r = reminderSchema.parse({
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
        resolution: existing && !duplicate ? existing.resolution : "active",
        createdAt: reference,
        updatedAt: Temporal.Now.instant().toString(),
      });
      await update((d) => ({
        ...d,
        groups: group ? [...d.groups, group] : d.groups,
        reminders: [...d.reminders.filter((x) => x.id !== id), r],
      }));
      notify(
        duplicate
          ? "Reminder duplicated and recalculated."
          : "Reminder saved on this device.",
      );
      go(`detail/${id}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (!mode)
    return (
      <>
        <PageHeading
          title="Add Reminder"
          subtitle="Keep the opening moment in sight."
        />
        <section className="panel mode-panel">
          <div className="steps">
            <span className="active">1 · Mode</span>
            <span>2 · Details & alerts</span>
            <span>3 · Review</span>
          </div>
          <h2>How do you know the booking time?</h2>
          <div className="mode-options">
            <button onClick={() => setMode("calculate")}>
              <CalendarDays size={30} />
              <strong>Calculate from journey/event date</strong>
              <span>
                Choose a target date and a booking rule. We’ll calculate when
                booking opens.
              </span>
            </button>
            <button
              onClick={() => {
                setMode("known");
                setRule({
                  ...rule,
                  type: "fixed",
                  verificationStatus: "custom",
                });
              }}
            >
              <Clock size={30} />
              <strong>I know the booking opening date</strong>
              <span>
                Enter the announced opening date and time. The journey or event
                date is optional.
              </span>
            </button>
          </div>
          <div className="info">
            For tickets, reservations, registrations and slots — all in one
            place.
          </div>
        </section>
      </>
    );
  return (
    <>
      <PageHeading
        title={
          duplicate
            ? "Duplicate Reminder"
            : existing
              ? "Edit Reminder"
              : "Add Reminder"
        }
        subtitle={
          mode === "known"
            ? "Enter the opening announced by your provider."
            : "Calculate the opening from your journey or event date."
        }
      />
      <button className="text-link back" onClick={() => setMode(null)}>
        <ArrowLeft size={16} />
        Change creation mode
      </button>
      <form onSubmit={save} className="form-layout">
        <div className="form-sections">
          <section className="panel">
            <h2>
              <CategoryIcon category={category} />
              Booking details
            </h2>
            <div className="form-grid">
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
              <Field label="Title">
                <input
                  autoFocus
                  required
                  maxLength={200}
                  placeholder="e.g. Chennai to Coimbatore"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>
              <Field
                label={
                  mode === "known"
                    ? "Target date (optional)"
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
              <Field label="Target time (optional)">
                <input
                  type="time"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                />
              </Field>
              <Field label="Route / location (optional)">
                <input
                  placeholder="Chennai → Coimbatore"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                />
              </Field>
              <Field label="Provider (optional)">
                <input
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                />
              </Field>
              <Field label="Service identifier (optional)">
                <input
                  placeholder="Train, flight or event identifier"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                />
              </Field>
              <Field label="Booking URL (optional)">
                <input
                  type="url"
                  placeholder="https://…"
                  value={bookingUrl}
                  onChange={(e) => setBookingUrl(e.target.value)}
                />
              </Field>
            </div>
          </section>
          <section className="panel">
            <h2>When does booking open?</h2>
            {mode === "calculate" && (
              <Field label="Use a saved rule">
                <select
                  value={rule.id}
                  onChange={(e) => {
                    const r = data.rules.find((x) => x.id === e.target.value);
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
            )}
            {mode === "known" ? (
              <div className="form-grid">
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
              </div>
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
          </section>
          <section className="panel">
            <h2>Alerts & organization</h2>
            <Field
              label="Alert offsets in minutes"
              hint="Separate with commas. 1440 = 1 day, 60 = 1 hour, 0 = at opening."
            >
              <input
                required
                value={offsetText}
                onChange={(e) => setOffsetText(e.target.value)}
              />
            </Field>
            <div className="form-grid">
              <Field label="Journey / event group">
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  <option value="">No group</option>
                  {data.groups.map((g) => (
                    <option value={g.id} key={g.id}>
                      {g.name}
                    </option>
                  ))}
                  <option value="__new">Create a group…</option>
                </select>
              </Field>
              {groupId === "__new" && (
                <Field label="New group name">
                  <input
                    required
                    maxLength={200}
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                  />
                </Field>
              )}
            </div>
            <Field
              label="Booking notes (optional)"
              hint="Do not enter passwords, identity numbers or payment details."
            >
              <textarea
                rows={3}
                maxLength={4000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </section>
        </div>
        <aside className="panel preview-panel">
          <div className="eyebrow">OPENING PREVIEW</div>
          <h2>{title || "Your booking opening"}</h2>
          {opening ? (
            <>
              <div className="preview-date">
                {formatAt(opening, data.settings, rule.timezone)}
              </div>
              <p>{rule.timezone}</p>
              <p>{ruleSummary(effectiveRule)}</p>
              {Date.parse(opening) <= Date.now() && (
                <div className="info">
                  This opening is in the past. It will be saved as Booking Open.
                </div>
              )}
            </>
          ) : (
            <p>{calculationError}</p>
          )}
          <hr />
          <h3>Target date context</h3>
          {holidayError ? (
            <p className="hint">{holidayError}</p>
          ) : (
            <HolidayContext
              date={targetDate}
              holidays={holidays}
              settings={data.settings}
            />
          )}
          <p className="small muted">
            Browser alerts work while the app is running. Export to your
            calendar for reliable future reminders.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="primary wide"
            disabled={!opening || busy}
          >
            <Save size={18} />
            {busy ? "Saving…" : "Save Reminder"}
          </button>
          <a
            className="button wide"
            href={existing ? `#detail/${existing.id}` : "#home"}
          >
            Cancel
          </a>
        </aside>
      </form>
    </>
  );
}
