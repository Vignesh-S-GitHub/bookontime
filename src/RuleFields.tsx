import type { Rule } from "./domain";
import { Field } from "./ui";
export default function RuleFields({
  rule: r,
  onChange,
  metadata = false,
}: {
  rule: Rule;
  onChange: (r: Rule) => void;
  metadata?: boolean;
}) {
  const set = <K extends keyof Rule>(key: K, value: Rule[K]) =>
    onChange({ ...r, [key]: value });
  return (
    <div className="form-grid">
      <Field label="Rule type">
        <select
          value={r.type}
          onChange={(e) => set("type", e.target.value as Rule["type"])}
        >
          <option value="relative">Relative opening</option>
          <option value="fixed">Fixed opening</option>
          <option value="recurring">Recurring opening</option>
          <option value="periodic">Periodic release</option>
        </select>
      </Field>
      <Field
        label="Timezone"
        hint="IANA timezone, e.g. Asia/Kolkata or America/New_York"
      >
        <input
          required
          value={r.timezone}
          onChange={(e) => set("timezone", e.target.value)}
          list="timezones"
        />
      </Field>
      {r.type === "relative" && (
        <>
          <Field label="Advance quantity">
            <input
              type="number"
              min="0"
              max="10000"
              required
              value={r.quantity}
              onChange={(e) => set("quantity", Number(e.target.value))}
            />
          </Field>
          <Field label="Advance unit">
            <select
              value={r.unit}
              onChange={(e) => set("unit", e.target.value as Rule["unit"])}
            >
              {["minutes", "hours", "days", "weeks", "months"].map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
          {!["minutes", "hours"].includes(r.unit) && (
            <label className="check full">
              <input
                type="checkbox"
                checked={r.includeTarget}
                onChange={(e) => set("includeTarget", e.target.checked)}
              />
              Include target day as day 1{" "}
              <small>(opens one day later than excluding it)</small>
            </label>
          )}
        </>
      )}
      {r.type === "fixed" && (
        <Field label="Booking opening date">
          <input
            type="date"
            required
            value={r.fixedDate}
            onChange={(e) => set("fixedDate", e.target.value)}
          />
        </Field>
      )}
      {r.type === "recurring" && (
        <>
          <Field label="Repeats">
            <select
              value={r.weekday}
              onChange={(e) => set("weekday", Number(e.target.value))}
            >
              {[
                "Every day",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day, i) => (
                <option value={i} key={day}>
                  {day}
                </option>
              ))}
            </select>
          </Field>
          <p className="hint full">
            Finds the next opening from now. This reminder tracks that one
            occurrence; duplicate it for another release.
          </p>
        </>
      )}
      {r.type === "periodic" && (
        <>
          <Field label="Months before target month">
            <input
              type="number"
              min="0"
              max="120"
              required
              value={r.monthsBefore}
              onChange={(e) => set("monthsBefore", Number(e.target.value))}
            />
          </Field>
          <Field
            label="Release day of month"
            hint="Short months use their last day."
          >
            <input
              type="number"
              min="1"
              max="31"
              required
              value={r.releaseDay}
              onChange={(e) => set("releaseDay", Number(e.target.value))}
            />
          </Field>
        </>
      )}
      {!(r.type === "relative" && ["minutes", "hours"].includes(r.unit)) && (
        <Field label="Opening time">
          <input
            type="time"
            required
            value={r.openingTime}
            onChange={(e) => set("openingTime", e.target.value)}
          />
        </Field>
      )}
      {metadata && (
        <>
          <Field label="Verification status">
            <select
              value={r.verificationStatus}
              onChange={(e) =>
                set(
                  "verificationStatus",
                  e.target.value as Rule["verificationStatus"],
                )
              }
            >
              <option value="custom">Custom</option>
              <option value="needs-verification">Needs Verification</option>
              <option value="verified">Verified</option>
            </select>
          </Field>
          <Field label="Source label">
            <input
              value={r.sourceLabel}
              onChange={(e) => set("sourceLabel", e.target.value)}
            />
          </Field>
          <Field label="Source URL">
            <input
              type="url"
              value={r.sourceUrl}
              onChange={(e) => set("sourceUrl", e.target.value)}
            />
          </Field>
          <Field label="Last verified">
            <input
              type="date"
              value={r.lastVerifiedAt}
              onChange={(e) => set("lastVerifiedAt", e.target.value)}
            />
          </Field>
          <Field label="Rule notes">
            <textarea
              value={r.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
        </>
      )}
    </div>
  );
}
