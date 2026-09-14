import { useState, type FormEvent } from "react";
import { Plus, Layers3, Trash2 } from "lucide-react";
import { formatAt, groupSchema } from "./domain";
import { Empty, PageHeading, ReminderCard, useApp } from "./ui";
export default function Groups({ selectedId }: { selectedId?: string }) {
  const { data, update, now, notify } = useApp();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  async function add(e: FormEvent) {
    e.preventDefault();
    try {
      const group = groupSchema.parse({ id: crypto.randomUUID(), name });
      await update((d) => ({ ...d, groups: [...d.groups, group] }));
      setName("");
      setError("");
      notify("Group created. Choose it when adding or editing a reminder.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save group.");
    }
  }
  return (
    <>
      <PageHeading
        title="Journey & Event Groups"
        subtitle="Related booking opportunities, with each opening kept separate."
      />
      <form className="panel group-form" onSubmit={add}>
        <label className="field">
          <span>New group name</span>
          <input
            required
            maxLength={200}
            placeholder="e.g. Diwali Chennai → Bengaluru Trip"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button className="primary">
          <Plus size={18} />
          Create Group
        </button>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </form>
      {!data.groups.length && (
        <Empty
          title="Keep related openings together"
          text="Create a group, then assign reminders to it from the reminder form."
          action={false}
        />
      )}
      <div className="groups-list">
        {data.groups
          .filter((g) => !selectedId || g.id === selectedId)
          .map((g) => {
            const items = data.reminders
              .filter((r) => r.groupId === g.id)
              .sort((a, b) =>
                a.bookingOpeningAt.localeCompare(b.bookingOpeningAt),
              );
            const next = items.find(
              (r) =>
                r.resolution === "active" &&
                Date.parse(r.bookingOpeningAt) > now,
            );
            return (
              <section className="panel" key={g.id}>
                <div className="section-head">
                  <h2>
                    <Layers3 size={22} />
                    {g.name}
                  </h2>
                  <button
                    className="danger"
                    aria-label={`Delete group ${g.name}`}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Delete this group? Its reminders will be kept without a group.",
                        )
                      )
                        void update((d) => ({
                          ...d,
                          groups: d.groups.filter((x) => x.id !== g.id),
                          reminders: d.reminders.map((r) =>
                            r.groupId === g.id ? { ...r, groupId: "" } : r,
                          ),
                        })).catch(() => {});
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <p className="info">
                  {next
                    ? `Next opening: ${next.title} · ${formatAt(next.bookingOpeningAt, data.settings, next.timezone)}`
                    : "No future active openings in this group."}
                </p>
                {items.length ? (
                  items.map((r) => <ReminderCard key={r.id} reminder={r} />)
                ) : (
                  <p className="muted">
                    Assign reminders to this group from Add Reminder or Edit.
                  </p>
                )}
              </section>
            );
          })}
      </div>
    </>
  );
}
