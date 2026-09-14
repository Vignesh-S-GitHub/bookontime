import {
  CalendarDays,
  CalendarPlus,
  Plus,
  SlidersHorizontal,
  ArrowUpRight,
  Layers3,
} from "lucide-react";
import { categories, formatAt, statusOf } from "./domain";
import {
  BookingActions,
  CategoryIcon,
  Countdown,
  Empty,
  HolidayContext,
  PageHeading,
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
  const week = active.filter(
    (r) =>
      Date.parse(r.bookingOpeningAt) > now &&
      Date.parse(r.bookingOpeningAt) - now <= 7 * 86400000,
  );
  const { holidays, error } = useHolidays(
    [next?.targetDate ?? new Date(now).toISOString().slice(0, 10)],
    data.settings,
  );
  return (
    <>
      <PageHeading
        title="Be ready for your next booking."
        subtitle="A little planning. The right moment."
      >
        <a className="button primary" href="#add">
          <Plus size={18} />
          Add Reminder
        </a>
      </PageHeading>
      <div className="stats">
        <a href="#reminders">
          <span>Upcoming openings</span>
          <strong>
            {active.length - open.length}
            <ArrowUpRight size={20} />
          </strong>
        </a>
        <a href="#reminders/open">
          <span>Booking now</span>
          <strong>
            {open.length}
            <ClockIcon />
          </strong>
        </a>
        <a href="#calendar">
          <span>Opening this week</span>
          <strong>
            {week.length}
            <CalendarDays size={20} />
          </strong>
        </a>
      </div>
      <div className="dashboard-grid">
        <section className="panel next-booking">
          <div className="section-head">
            <span className="eyebrow">NEXT BOOKING</span>
            {next && <Status reminder={next} />}
          </div>
          {next ? (
            <>
              <div className="next-title">
                <CategoryIcon category={next.category} size={30} />
                <div>
                  <span className="eyebrow">{next.category}</span>
                  <h2>{next.title}</h2>
                  {next.route && <p>{next.route}</p>}
                </div>
              </div>
              <p className="opening-caption">Booking opens on</p>
              <div className="hero-date">
                {formatAt(next.bookingOpeningAt, data.settings, next.timezone)}
              </div>
              <small>{next.timezone}</small>
              <Countdown at={next.bookingOpeningAt} large />
              <BookingActions reminder={next} />
              <a href={`#detail/${next.id}`} className="text-link">
                View Details →
              </a>
            </>
          ) : (
            <Empty
              title="Make room for your next plan"
              text="Add the moment a booking opens. We’ll keep the countdown ready."
            />
          )}
        </section>
        <aside className="panel insight">
          <div className="eyebrow">PLAN WITH CONTEXT</div>
          <CalendarDays size={28} />
          <h2>
            {next?.targetDate
              ? "Around your target date"
              : "Good timing starts here"}
          </h2>
          {next?.targetDate ? (
            <>
              <p>{next.targetDate}</p>
              {error ? (
                <p className="hint">{error}</p>
              ) : (
                <HolidayContext
                  date={next.targetDate}
                  holidays={holidays}
                  settings={data.settings}
                />
              )}
            </>
          ) : (
            <p>
              See regional holidays and long weekends alongside your bookings.
            </p>
          )}
          <a className="button" href="#calendar">
            View Calendar
            <ArrowUpRight size={16} />
          </a>
          <div className="insight-art" />
        </aside>
      </div>
      <section className="panel quick-actions">
        <h2>Quick actions</h2>
        <div>
          <a href="#add">
            <CalendarPlus />
            Add Reminder
          </a>
          <a href="#calendar">
            <CalendarDays />
            View Calendar
          </a>
          <a href="#rules">
            <SlidersHorizontal />
            Browse Rules
          </a>
          <a href="#groups">
            <Layers3 />
            Journey Groups
          </a>
        </div>
      </section>
      {open.length > 0 && (
        <section>
          <div className="section-head">
            <h2>Booking Now</h2>
            <a href="#reminders/open">View all →</a>
          </div>
          {open.slice(0, 3).map((r) => (
            <ReminderCard key={r.id} reminder={r} />
          ))}
        </section>
      )}
      {active.length > 0 && (
        <section>
          <div className="section-head">
            <h2>Upcoming</h2>
            <a href="#reminders">All reminders →</a>
          </div>
          {active
            .filter((r) => Date.parse(r.bookingOpeningAt) > now)
            .slice(0, 4)
            .map((r) => (
              <ReminderCard key={r.id} reminder={r} />
            ))}
        </section>
      )}
      <section className="panel">
        <h2>What are you booking next?</h2>
        <div className="category-grid">
          {categories.map((c) => (
            <a href={`#add/${encodeURIComponent(c)}`} key={c}>
              <CategoryIcon category={c} />
              <span>{c}</span>
            </a>
          ))}
        </div>
      </section>
      {data.groups.length > 0 && (
        <section>
          <div className="section-head">
            <h2>Trip Groups</h2>
            <a href="#groups">View groups →</a>
          </div>
          <div className="group-grid">
            {data.groups.slice(0, 3).map((g) => (
              <a className="panel" href={`#groups/${g.id}`} key={g.id}>
                <Layers3 />
                <h3>{g.name}</h3>
                <p>
                  {data.reminders.filter((r) => r.groupId === g.id).length}{" "}
                  booking opportunities
                </p>
                <small>
                  {active.find((r) => r.groupId === g.id)
                    ? statusOf(
                        active.find((r) => r.groupId === g.id)!,
                        now,
                      )
                    : "No active openings"}
                </small>
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
function ClockIcon() {
  return <span aria-hidden="true">↗</span>;
}
