import { createContext, useContext, type ReactNode } from "react";
import {
  TrainFront,
  Bus,
  Plane,
  Clapperboard,
  Ticket,
  Trophy,
  CalendarClock,
  ClipboardPen,
  BedDouble,
  Ellipsis,
  Clock,
  ExternalLink,
  CalendarPlus,
  Plus,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import {
  formatAt,
  statusOf,
  type AppData,
  type Reminder,
  type Rule,
  type Settings,
} from "./domain";
import { download, exportICS } from "./calendar-export";
import { longWeekends, type Holiday } from "./holidays";
export type AppContextType = {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => Promise<void>;
  now: number;
  notify: (s: string) => void;
  go: (path: string) => void;
};
export const AppContext = createContext<AppContextType | null>(null);
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("App context missing");
  return context;
}
const categoryIcons: Partial<Record<Rule["category"], LucideIcon>> = {
  Train: TrainFront,
  Bus,
  Flight: Plane,
  Movie: Clapperboard,
  "Event / Concert": Ticket,
  Sports: Trophy,
  "Appointment / Slot": CalendarClock,
  Registration: ClipboardPen,
  Accommodation: BedDouble,
  Custom: Ellipsis,
};
export function CategoryIcon({
  category,
  size = 24,
}: {
  category: Rule["category"];
  size?: number;
}) {
  const Icon = categoryIcons[category];
  return (
    <span className="category-icon" aria-hidden="true">
      {Icon ? (
        <Icon size={size} />
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        >
          <path d="M3 22h18M5 22v-6h14v6M6 16v-4h12v4M8 12V8h8v4M10 8V5h4v3M12 2v3M9 22v-4h6v4M4 16h16M5 12h14M7 8h10" />
          <path d="M8 14h1m2 0h2m2 0h1M10 10h4" />
        </svg>
      )}
    </span>
  );
}
export function Brand() {
  return (
    <a className="brand" href="#home" aria-label="BookOnTime home">
      <svg className="brand-mark" viewBox="300 250 650 510" aria-hidden="true">
        <image
          href={`${import.meta.env.BASE_URL}brand-logo.png`}
          width="1254"
          height="1254"
        />
      </svg>
      <span>
        <strong>
          Book<span>On</span>Time
        </strong>
        <small>Book Before It’s Late.</small>
      </span>
    </a>
  );
}
export function PageHeading({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}
export function Empty({
  title = "Your next opening starts here",
  text = "Add a booking opening to keep the important moment in sight.",
  action = true,
}: {
  title?: string;
  text?: string;
  action?: boolean;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <CalendarClock size={32} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {action && (
        <a className="button primary" href="#add">
          <Plus size={18} />
          Add Reminder
        </a>
      )}
    </div>
  );
}
export function Status({ reminder }: { reminder: Reminder }) {
  const { now } = useApp();
  const status = statusOf(reminder, now);
  return (
    <span
      className={`status ${status === "Booking Open" ? "open" : status === "Booked" ? "booked" : status === "Opens Today" ? "today" : ""}`}
    >
      <Clock size={13} />
      {status}
    </span>
  );
}
export function Countdown({
  at,
  large = false,
}: {
  at: string;
  large?: boolean;
}) {
  const { now } = useApp();
  const seconds = Math.max(0, Math.floor((Date.parse(at) - now) / 1000));
  if (!seconds)
    return (
      <div className="opening-live">
        <Clock size={20} />
        Booking is open
      </div>
    );
  const values = [
    Math.floor(seconds / 86400),
    Math.floor((seconds % 86400) / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ];
  return (
    <div
      className={`countdown ${large ? "large" : ""}`}
      aria-label={`Opens in ${values[0]} days ${values[1]} hours ${values[2]} minutes`}
    >
      {values.map((v, i) => (
        <div key={i}>
          <strong>{String(v).padStart(2, "0")}</strong>
          <small>{["Days", "Hours", "Minutes", "Seconds"][i]}</small>
        </div>
      ))}
    </div>
  );
}
export function BookingActions({ reminder: r }: { reminder: Reminder }) {
  return (
    <div className="actions">
      {r.bookingUrl ? (
        <a
          className="button primary"
          href={r.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={17} />
          Open Booking Site
        </a>
      ) : (
        <span className="muted">No booking site added</span>
      )}
      <button
        onClick={() =>
          download("bookontime-opening.ics", exportICS([r]), "text/calendar")
        }
      >
        <CalendarPlus size={17} />
        Add to Calendar
      </button>
    </div>
  );
}
export function ReminderCard({
  reminder: r,
  compact = false,
}: {
  reminder: Reminder;
  compact?: boolean;
}) {
  const { data } = useApp();
  return (
    <article className="reminder-card">
      <CategoryIcon category={r.category} />
      <div className="reminder-main">
        <div className="eyebrow">{r.category}</div>
        <a className="card-title" href={`#detail/${r.id}`}>
          {r.title}
        </a>
        {r.route && <p>{r.route}</p>}
        <div className="opening-date">
          <Clock size={15} />
          {formatAt(r.bookingOpeningAt, data.settings, r.timezone)}
        </div>
        {!compact && (
          <small>
            {r.timezone}
            {r.targetDate && ` · Target ${r.targetDate}`}
          </small>
        )}
      </div>
      <div className="reminder-end">
        <Status reminder={r} />
        <a className="text-link" href={`#detail/${r.id}`}>
          View Details →
        </a>
      </div>
    </article>
  );
}
export function PrivacyNote() {
  return (
    <p className="privacy-note">
      <ShieldCheck size={16} />
      Your reminders are stored on this device.
    </p>
  );
}
export function HolidayContext({
  date,
  holidays,
  settings,
}: {
  date: string;
  holidays: Holiday[];
  settings: Settings;
}) {
  if (!date) return null;
  const matching = holidays.filter((h) => h.date === date);
  const weekend = settings.longWeekends
    ? longWeekends(holidays, settings.weekendDays).find(
        (w) => w.start <= date && w.end >= date,
      )
    : undefined;
  if (!matching.length && !weekend)
    return (
      <p className="muted small">
        No holiday context in the loaded data for this date.
      </p>
    );
  return (
    <div className="holiday-context">
      {matching.map((h, i) => (
        <div key={i}>
          <strong>
            {h.name} — {h.region || "India"}
          </strong>
          <small>
            {h.scope === "national" ? "National" : "Regional"}{" "}
            {h.type === "public" ? "Public Holiday" : "Festival / Observance"}
            {h.tentative ? " · Tentative, verify locally" : ""}
          </small>
        </div>
      ))}
      {weekend && (
        <strong>
          {weekend.days}-day long weekend detected · {weekend.start}–
          {weekend.end}
        </strong>
      )}
      <p>Travel demand may be higher.</p>
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
