import { errorMessage } from "./domain";
import { useState, type FormEvent } from "react";
import { Copy, Plus, RotateCcw, Save } from "lucide-react";
import {
  blankRule,
  categories,
  defaultRules,
  ruleSchema,
  ruleSummary,
  type Rule,
} from "./domain";
import { CategoryIcon, Field, PageHeading, useApp } from "./ui";
import RuleFields from "./RuleFields";
export default function Rules() {
  const { data, update, notify } = useApp();
  const [editing, setEditing] = useState<Rule | null>(null);
  const [error, setError] = useState("");
  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      const r = ruleSchema.parse(editing);
      await update((d) => ({
        ...d,
        rules: [...d.rules.filter((x) => x.id !== r.id), r],
      }));
      setEditing(null);
      notify(
        "Booking rule saved. Existing reminders retain their rule snapshot.",
      );
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <>
      <PageHeading
        title="Booking Rules"
        subtitle="Opening policies you can inspect, adjust and reuse."
      >
        <button
          className="primary"
          onClick={() => {
            setError("");
            setEditing(blankRule());
          }}
        >
          <Plus size={18} />
          Create Rule
        </button>
      </PageHeading>
      <div className="info">
        Provider policies can change. Check the source before relying on a
        preset. Changing a saved rule does not silently reschedule existing
        reminders.
      </div>
      {editing && (
        <form className="panel rule-editor" onSubmit={save}>
          <h2>
            {data.rules.some((r) => r.id === editing.id)
              ? "Edit rule"
              : "Create rule"}
          </h2>
          <div className="form-grid">
            <Field label="Rule name">
              <input
                required
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </Field>
            <Field label="Category">
              <select
                value={editing.category}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    category: e.target.value as Rule["category"],
                  })
                }
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <RuleFields rule={editing} onChange={setEditing} metadata />
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="actions">
            <button className="primary">
              <Save size={18} />
              Save Rule
            </button>
            <button type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="rules-grid">
        {data.rules.map((r) => (
          <article
            className={`panel rule-card ${r.disabled ? "disabled-card" : ""}`}
            key={r.id}
          >
            <div className="section-head">
              <CategoryIcon category={r.category} />
              <span className="status">
                {r.disabled
                  ? "Disabled"
                  : r.verificationStatus === "verified"
                    ? "Verified"
                    : r.verificationStatus === "custom"
                      ? "Custom"
                      : "Needs Verification"}
              </span>
            </div>
            <h2>{r.name}</h2>
            <p>{ruleSummary(r)}</p>
            <small>{r.timezone}</small>
            {r.sourceLabel && (
              <p>
                {r.sourceLabel}
                {r.sourceUrl && (
                  <>
                    {" "}
                    ·{" "}
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Source
                    </a>
                  </>
                )}
              </p>
            )}
            {r.lastVerifiedAt && (
              <p className="small">Last verified {r.lastVerifiedAt}</p>
            )}
            {r.notes && <p className="small muted">{r.notes}</p>}
            <div className="actions">
              <button
                onClick={() => {
                  setEditing(structuredClone(r));
                  setError("");
                  window.scrollTo(0, 0);
                }}
              >
                Edit
              </button>
              <button
                aria-label={`Duplicate ${r.name}`}
                onClick={() => {
                  setEditing({
                    ...r,
                    id: crypto.randomUUID(),
                    presetId: undefined,
                    name: `${r.name} (copy)`,
                    verificationStatus: "custom",
                  });
                  setError("");
                  window.scrollTo(0, 0);
                }}
              >
                <Copy size={17} />
              </button>
              <button
                onClick={() =>
                  void update((d) => ({
                    ...d,
                    rules: d.rules.map((x) =>
                      x.id === r.id ? { ...x, disabled: !x.disabled } : x,
                    ),
                  })).catch(() => {})
                }
              >
                {r.disabled ? "Enable" : "Disable"}
              </button>
              {r.presetId && (
                <button
                  aria-label={`Restore default ${r.name}`}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Restore this rule to its shipped default? Existing reminders will keep their saved rules.",
                      )
                    )
                      void update((d) => ({
                        ...d,
                        rules: d.rules.map((x) =>
                          x.id === r.id
                            ? {
                                ...structuredClone(
                                  defaultRules.find(
                                    (p) => p.id === r.presetId,
                                  )!,
                                ),
                                id: r.id,
                              }
                            : x,
                        ),
                      })).catch(() => {});
                  }}
                >
                  <RotateCcw size={17} />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
