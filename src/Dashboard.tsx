import {
  Plus,
  CalendarDays,
  Clock,
  Layers3,
  ArrowRight,
  Info,
} from "lucide-react";
import { categories, formatAt, dateInZone } from "./domain";
import {
  CategoryIcon,
  Countdown,
  Empty,
  HolidayContext,
  ReminderCard,
  Status,
  useApp,
} from "./ui";
import { useHolidays } from "./hooks";
export default function Dashboard() {
  const { data, now } = useApp();
  const active = data.reminders
    .filter((r) => r.resolution === "active")
    .sort((a, b) => a.bookingOpeningAt.localeCompare(b.bookingOpeningAt));
  const next = active.find((r) => Date.parse(r.bookingOpeningAt) > now);
  const open = active.filter((r) => Date.parse(r.bookingOpeningAt) <= now);
  const { holidays, error } = useHolidays(
    [
      next?.targetDate ||
        dateInZone(new Date(now).toISOString(), data.settings.timezone),
    ],
    data.settings,
  );
  return (
    <div className="home-screen">
      <section className="panel home-opening">
        {next ? (
          <>
            <div className="section-head">
              <div className="form-category">
                <CategoryIcon category={next.category} />
                <div>
                  <a className="card-title" href={`#detail/${next.id}`}>
                    {next.title}
                  </a>
                  <small>
                    {next.category}
                    {next.provider ? ` · ${next.provider}` : ""}
                  </small>
                </div>
              </div>
              <Status reminder={next} />
            </div>
            <div className="date-pair">
              <div>
                <small>Booking opens</small>
                <strong>
                  {formatAt(
                    next.bookingOpeningAt,
                    data.settings,
                    next.timezone,
                  )}
                </strong>
                <small>{next.timezone}</small>
              </div>
              <div>
                <small>Journey / event</small>
                <strong>{next.targetDate || "Not specified"}</strong>
                <small>{next.route || next.category}</small>
              </div>
            </div>
            <Countdown at={next.bookingOpeningAt} />
            <a className="text-link" href={`#detail/${next.id}`}>
              View reminder
              <ArrowRight size={16} />
            </a>
          </>
        ) : (
          <Empty
            title="Your next opening starts here"
            text="Create a reminder for when a booking opens."
            action={false}
          />
        )}
        <div className="info">
          <Info size={17} />
          Set a reminder so you don’t miss the opening.
        </div>
        <a className="button primary wide" href="#add">
          <Plus size={20} />
          Create reminder
        </a>
      </section>
      <section className="home-quick">
        <h2>Quick categories</h2>
        <div className="quick-category-grid">
          {categories.slice(0, 4).map((c) => (
            <a key={c} href={`#add/${encodeURIComponent(c)}`}>
              <CategoryIcon category={c} />
              <span>{c}</span>
            </a>
          ))}
        </div>
      </section>
      <div
        className="home-art"
        role="img"
        aria-label="Pale blue travel journey illustration"
      />
      {open.length > 0 && (
        <section>
          <div className="section-head">
            <h2>
              <Clock size={18} />
              Booking now
            </h2>
            <a href="#reminders/open">View all</a>
          </div>
          {open.slice(0, 3).map((r) => (
            <ReminderCard key={r.id} reminder={r} />
          ))}
        </section>
      )}
      {next?.targetDate && (
        <details className="panel home-context">
          <summary>
            <CalendarDays size={18} />
            Holiday context for your journey
          </summary>
          {error ? (
            <p className="hint">{error}</p>
          ) : (
            <HolidayContext
              date={next.targetDate}
              holidays={holidays}
              settings={data.settings}
            />
          )}
        </details>
      )}
      {data.groups.length > 0 && (
        <section className="panel">
          <div className="section-head">
            <h2>
              <Layers3 size={19} />
              Journey & event groups
            </h2>
            <a href="#groups">View groups</a>
          </div>
          <p className="small">
            {data.groups.length} groups · {active.length} active openings
          </p>
        </section>
      )}
    </div>
  );
}
