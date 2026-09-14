import { Copy, Edit3, Share2, Check, Trash2, ArrowLeft } from "lucide-react";
import { formatAt, ruleSummary, type Reminder } from "./domain";
import {
  BookingActions,
  CategoryIcon,
  Countdown,
  HolidayContext,
  PageHeading,
  Status,
  useApp,
} from "./ui";
import { useHolidays } from "./hooks";
import { googleCalendar } from "./calendar-export";
export default function Details({ reminder: r }: { reminder: Reminder }) {
  const { data, update, notify, go } = useApp();
  const { holidays, error } = useHolidays(
    [r.targetDate, r.bookingOpeningAt.slice(0, 10)],
    data.settings,
  );
  async function resolve(resolution: Reminder["resolution"]) {
    try {
      await update((d) => ({
        ...d,
        reminders: d.reminders.map((x) =>
          x.id === r.id
            ? { ...x, resolution, updatedAt: new Date().toISOString() }
            : x,
        ),
      }));
      notify("Reminder status updated.");
    } catch {
      /* The app displays the persistence error. */
    }
  }
  async function share() {
    const text = `${r.title}\nBooking opens: ${formatAt(r.bookingOpeningAt, data.settings, r.timezone)} (${r.timezone})\n${r.targetDate ? `Target: ${r.targetDate}\n` : ""}${r.bookingUrl}`;
    try {
      if (navigator.share) await navigator.share({ title: "BookOnTime", text });
      else {
        await navigator.clipboard.writeText(text);
        notify("Booking details copied.");
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        notify(
          "Sharing is unavailable in this browser. Use Add to Calendar or export your data.",
        );
    }
  }
  return (
    <>
      <a className="text-link back" href="#reminders">
        <ArrowLeft size={16} />
        All reminders
      </a>
      <PageHeading
        title={r.title}
        subtitle={`${r.category}${r.route ? ` · ${r.route}` : ""}`}
      >
        <Status reminder={r} />
      </PageHeading>
      <div className="detail-grid">
        <section className="panel detail-opening">
          <div className="section-head">
            <span className="eyebrow">BOOKING OPENING</span>
            <CategoryIcon category={r.category} />
          </div>
          <div className="hero-date">
            {formatAt(r.bookingOpeningAt, data.settings, r.timezone)}
          </div>
          <p>{r.timezone}</p>
          <Countdown at={r.bookingOpeningAt} large />
          <BookingActions reminder={r} />
          <a
            className="text-link"
            href={googleCalendar(r)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Google Calendar ↗
          </a>
          <hr />
          <div className="actions">
            <a className="button" href={`#edit/${r.id}`}>
              <Edit3 size={17} />
              Edit
            </a>
            <a className="button" href={`#duplicate/${r.id}`}>
              <Copy size={17} />
              Duplicate
            </a>
            <button onClick={() => void share()}>
              <Share2 size={17} />
              Share
            </button>
            <button onClick={() => void resolve("booked")}>
              <Check size={17} />
              Mark Booked
            </button>
            <button onClick={() => void resolve("completed")}>Complete</button>
            <button onClick={() => void resolve("missed")}>Mark Missed</button>
            {r.resolution !== "active" && (
              <button onClick={() => void resolve("active")}>Reopen</button>
            )}
            <button
              className="danger"
              onClick={() => {
                if (
                  window.confirm(`Delete “${r.title}”? This cannot be undone.`)
                )
                  void update((d) => ({
                    ...d,
                    reminders: d.reminders.filter((x) => x.id !== r.id),
                  }))
                    .then(() => {
                      notify("Reminder deleted.");
                      go("reminders");
                    })
                    .catch(() => {});
              }}
            >
              <Trash2 size={17} />
              Delete
            </button>
          </div>
        </section>
        <section className="panel">
          <h2>Booking information</h2>
          <dl>
            <dt>Journey / event date</dt>
            <dd>
              {r.targetDate || "Not specified"} {r.targetTime}
            </dd>
            <dt>Route / location</dt>
            <dd>{r.route || "Not specified"}</dd>
            <dt>Provider</dt>
            <dd>{r.provider || "Not specified"}</dd>
            <dt>Service identifier</dt>
            <dd>{r.serviceId || "Not specified"}</dd>
            <dt>Group</dt>
            <dd>
              {data.groups.find((g) => g.id === r.groupId)?.name || "No group"}
            </dd>
            <dt>Booking rule</dt>
            <dd>{ruleSummary(r.rule)}</dd>
            <dt>Verification</dt>
            <dd>
              {r.rule.verificationStatus === "verified"
                ? "Verified"
                : r.rule.verificationStatus === "custom"
                  ? "Custom"
                  : "Needs Verification"}
              {r.rule.lastVerifiedAt && ` · ${r.rule.lastVerifiedAt}`}
            </dd>
            {r.rule.sourceLabel && (
              <>
                <dt>Source</dt>
                <dd>
                  {r.rule.sourceUrl ? (
                    <a
                      href={r.rule.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {r.rule.sourceLabel} ↗
                    </a>
                  ) : (
                    r.rule.sourceLabel
                  )}
                </dd>
              </>
            )}
          </dl>
          {r.rule.notes && <p className="small muted">{r.rule.notes}</p>}
        </section>
        <section className="panel">
          <h2>Reminder alerts</h2>
          <ul className="alert-list">
            {r.alertAt.map((at, i) => (
              <li key={at}>
                <strong>
                  {r.alertOffsets.slice().sort((a, b) => b - a)[i] === 0
                    ? "At opening"
                    : `${r.alertOffsets.slice().sort((a, b) => b - a)[i]} minutes before`}
                </strong>
                <span>{formatAt(at, data.settings, r.timezone)}</span>
              </li>
            ))}
          </ul>
          <p className="hint">
            Browser alerts are checked while BookOnTime is running. Add to your
            calendar for future reminders when the app is closed.
          </p>
        </section>
        <section className="panel">
          <h2>Holiday context</h2>
          {error ? (
            <p className="hint">{error}</p>
          ) : (
            <HolidayContext
              date={r.targetDate || r.bookingOpeningAt.slice(0, 10)}
              holidays={holidays}
              settings={data.settings}
            />
          )}
          <hr />
          <h3>Booking notes</h3>
          <p className="preserve">{r.notes || "No notes added."}</p>
        </section>
      </div>
    </>
  );
}
