import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { categories, dateInZone, statusOf } from "./domain";
import { Empty, Field, PageHeading, ReminderCard, useApp } from "./ui";
export default function Reminders({
  initialTab = "All",
}: {
  initialTab?: string;
}) {
  const { data, now } = useApp();
  const [tab, setTab] = useState(initialTab);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("asc");
  const filtered = data.reminders
    .filter((r) => {
      const state = statusOf(r, now),
        day = dateInZone(r.bookingOpeningAt, data.settings.timezone);
      return (
        (!search ||
          `${r.title} ${r.route} ${r.provider} ${r.serviceId}`
            .toLowerCase()
            .includes(search.toLowerCase())) &&
        (!category || r.category === category) &&
        (!status || state === status) &&
        (!from || day >= from) &&
        (!to || day <= to) &&
        (tab === "All" ||
          (tab === "Upcoming" &&
            r.resolution === "active" &&
            Date.parse(r.bookingOpeningAt) > now) ||
          (tab === "Open" && state === "Booking Open") ||
          (tab === "Booked" && state === "Booked") ||
          (tab === "Past" &&
            ["completed", "missed", "archived"].includes(r.resolution)))
      );
    })
    .sort(
      (a, b) =>
        (sort === "asc" ? 1 : -1) *
        a.bookingOpeningAt.localeCompare(b.bookingOpeningAt),
    );
  return (
    <>
      <PageHeading title="Reminders" subtitle="Every opening, in its own time.">
        <a className="button primary" href="#add">
          <Plus size={18} />
          Add Reminder
        </a>
      </PageHeading>
      <div className="tabs" role="tablist" aria-label="Reminder views">
        {["All", "Upcoming", "Open", "Booked", "Past"].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <section className="panel filters">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Search reminders"
            placeholder="Search title, route or provider…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="filter-grid">
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {[
                "Future",
                "Booking Soon",
                "Opens Today",
                "Booking Open",
                "Booked",
                "Completed",
                "Missed / Expired",
                "Archived",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Opening from">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="Opening until">
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
          <Field label="Sort openings">
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="asc">Earliest first</option>
              <option value="desc">Latest first</option>
            </select>
          </Field>
        </div>
      </section>
      <p className="muted small">
        {filtered.length} reminder{filtered.length === 1 ? "" : "s"} · Dates
        shown in {data.settings.timezone}
      </p>
      {filtered.length ? (
        filtered.map((r) => <ReminderCard key={r.id} reminder={r} />)
      ) : (
        <section className="panel">
          <Empty
            title={
              data.reminders.length
                ? "No matching openings"
                : "No reminders yet"
            }
            text={
              data.reminders.length
                ? "Try a different search or filter."
                : "Add your first booking opening to begin."
            }
            action={!data.reminders.length}
          />
        </section>
      )}
    </>
  );
}
