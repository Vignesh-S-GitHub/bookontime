import { useState } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { dateInZone } from "./domain";
import { longWeekends } from "./holidays";
import { useHolidays } from "./hooks";
import { Empty, HolidayContext, PageHeading, ReminderCard, useApp } from "./ui";
export default function Calendar() {
  const { data, now } = useApp();
  const today = dateInZone(new Date(now).toISOString(), data.settings.timezone);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const first = Temporal.PlainDate.from(`${month}-01`);
  const start = first.subtract({ days: first.dayOfWeek % 7 });
  const days = Array.from({ length: 42 }, (_, i) => start.add({ days: i }));
  const { holidays, error } = useHolidays(
    [days[0].toString(), days[41].toString()],
    data.settings,
  );
  const weekends = data.settings.longWeekends
    ? longWeekends(holidays, data.settings.weekendDays)
    : [];
  const reminders = data.reminders
    .filter(
      (r) =>
        dateInZone(r.bookingOpeningAt, data.settings.timezone) === selected,
    )
    .sort((a, b) => a.bookingOpeningAt.localeCompare(b.bookingOpeningAt));
  return (
    <>
      <PageHeading
        title="Booking Opening Calendar"
        subtitle={`Opening dates take the lead. Times shown in ${data.settings.timezone}.`}
      >
        <a className="button primary" href="#add">
          <Plus size={18} />
          Add Reminder
        </a>
      </PageHeading>
      <div className="calendar-layout">
        <section className="panel calendar-panel">
          <div className="calendar-toolbar">
            <h2>
              {first.toLocaleString("en", { month: "long", year: "numeric" })}
            </h2>
            <div className="actions">
              <button
                onClick={() => {
                  setMonth(today.slice(0, 7));
                  setSelected(today);
                }}
              >
                Today
              </button>
              <button
                aria-label="Previous month"
                onClick={() =>
                  setMonth(first.subtract({ months: 1 }).toString().slice(0, 7))
                }
              >
                <ChevronLeft size={18} />
              </button>
              <button
                aria-label="Next month"
                onClick={() =>
                  setMonth(first.add({ months: 1 }).toString().slice(0, 7))
                }
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="calendar-grid">
            <div className="weekday">Sun</div>
            <div className="weekday">Mon</div>
            <div className="weekday">Tue</div>
            <div className="weekday">Wed</div>
            <div className="weekday">Thu</div>
            <div className="weekday">Fri</div>
            <div className="weekday">Sat</div>
            {days.map((day) => {
              const d = day.toString(),
                opens = data.reminders.filter(
                  (r) =>
                    dateInZone(r.bookingOpeningAt, data.settings.timezone) ===
                    d,
                ),
                holiday = holidays.some((h) => h.date === d),
                weekend = weekends.some((w) => w.start <= d && w.end >= d);
              return (
                <button
                  key={d}
                  onClick={() => setSelected(d)}
                  aria-label={`${d}${opens.length ? `, ${opens.length} booking openings` : ""}${holiday ? ", holiday" : ""}${weekend ? ", long weekend" : ""}`}
                  aria-pressed={selected === d}
                  className={`calendar-day ${d.slice(0, 7) !== month ? "outside" : ""} ${d === selected ? "selected" : ""} ${d === today ? "today" : ""}`}
                >
                  <span>{day.day}</span>
                  <div className="day-markers">
                    {opens.length > 0 && (
                      <span title="Booking openings" className="marker booking">
                        {opens.length}
                      </span>
                    )}
                    {holiday && (
                      <span title="Holiday" className="marker holiday">
                        H
                      </span>
                    )}
                    {weekend && (
                      <span title="Long weekend" className="marker weekend">
                        L
                      </span>
                    )}
                  </div>
                  {opens.length > 0 && <small>{opens[0].title}</small>}
                </button>
              );
            })}
          </div>
          <div className="calendar-legend">
            <span>
              <i className="marker booking" />
              Booking opening
            </span>
            <span>
              <i className="marker holiday" />
              Holiday (H)
            </span>
            <span>
              <i className="marker weekend" />
              Long weekend (L)
            </span>
          </div>
          {error && <p className="hint">{error}</p>}
        </section>
        <aside className="panel selected-date">
          <span className="eyebrow">SELECTED DAY</span>
          <h2>
            {Temporal.PlainDate.from(selected).toLocaleString("en", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h2>
          {reminders.length ? (
            reminders.map((r) => (
              <ReminderCard key={r.id} reminder={r} compact />
            ))
          ) : (
            <Empty
              title="No openings on this day"
              text="Select a marked day or add a booking opening."
              action={false}
            />
          )}
          <HolidayContext
            date={selected}
            holidays={holidays}
            settings={data.settings}
          />
        </aside>
      </div>
    </>
  );
}
