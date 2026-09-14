import { z } from "zod";
import { Temporal } from "@js-temporal/polyfill";
import regions from "./data/regions.json";

export const categories = [
  "Train",
  "Bus",
  "Flight",
  "Movie",
  "Event / Concert",
  "Sports",
  "Darshan",
  "Appointment / Slot",
  "Registration",
  "Accommodation",
  "Custom",
] as const;
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    try {
      Temporal.PlainDate.from(v);
      return true;
    } catch {
      return false;
    }
  }, "Invalid calendar date");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const zone = z.string().refine((v) => {
  try {
    Temporal.Now.zonedDateTimeISO(v);
    return true;
  } catch {
    return false;
  }
}, "Use a valid IANA timezone");
const instant = z.string().refine((v) => {
  try {
    Temporal.Instant.from(v);
    return true;
  } catch {
    return false;
  }
}, "Invalid instant");
export const safeUrl = z
  .string()
  .max(2048)
  .refine((v) => {
    if (!v) return true;
    if (/[\r\n\t]/.test(v)) return false;
    try {
      const u = new URL(v);
      return (
        ["http:", "https:"].includes(u.protocol) && !u.username && !u.password
      );
    } catch {
      return false;
    }
  }, "Use an http or https URL without credentials");
export const ruleSchema = z
  .object({
    id: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(150),
    category: z.enum(categories),
    type: z.enum(["relative", "fixed", "recurring", "periodic"]),
    quantity: z.number().int().min(0).max(10000),
    unit: z.enum(["minutes", "hours", "days", "weeks", "months"]),
    includeTarget: z.boolean(),
    openingTime: time,
    timezone: zone,
    fixedDate: date.or(z.literal("")),
    weekday: z.number().int().min(0).max(7),
    monthsBefore: z.number().int().min(0).max(120),
    releaseDay: z.number().int().min(1).max(31),
    sourceLabel: z.string().max(200),
    sourceUrl: safeUrl,
    lastVerifiedAt: date.or(z.literal("")),
    verificationStatus: z.enum(["verified", "needs-verification", "custom"]),
    notes: z.string().max(4000),
    disabled: z.boolean(),
    presetId: z
      .string()
      .regex(/^preset-(?:[0-9]|10)$/)
      .optional(),
  })
  .superRefine((r, ctx) => {
    if (
      r.verificationStatus === "verified" &&
      (!r.sourceLabel || !r.sourceUrl || !r.lastVerifiedAt)
    )
      ctx.addIssue({
        code: "custom",
        message: "Verified rules need a source, URL and verification date.",
      });
    if (r.type === "fixed" && !r.fixedDate)
      ctx.addIssue({
        code: "custom",
        message: "Fixed rules need an opening date.",
      });
  });
export type Rule = z.infer<typeof ruleSchema>;
export const offsetsSchema = z
  .array(z.number().int().min(0).max(525600))
  .min(1)
  .max(30)
  .refine((v) => new Set(v).size === v.length, "Alert offsets must be unique.");
export const reminderSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(200),
  category: z.enum(categories),
  mode: z.enum(["calculate", "known"]),
  route: z.string().max(300),
  provider: z.string().max(150),
  serviceId: z.string().max(100),
  targetDate: date.or(z.literal("")),
  targetTime: time.or(z.literal("")),
  targetAt: instant.optional(),
  bookingOpeningAt: instant,
  timezone: zone,
  rule: ruleSchema,
  alertOffsets: offsetsSchema,
  alertAt: z.array(instant).max(30),
  bookingUrl: safeUrl,
  notes: z.string().max(4000),
  groupId: z.string().max(100),
  resolution: z.enum(["active", "booked", "completed", "missed", "archived"]),
  createdAt: instant,
  updatedAt: instant,
});
export type Reminder = z.infer<typeof reminderSchema>;
export const settingsSchema = z.object({
  timezone: zone,
  dateFormat: z.enum(["friendly", "iso", "day-first"]),
  hour12: z.boolean(),
  country: z.literal("IN"),
  primaryRegion: z
    .string()
    .refine((v) => Object.hasOwn(regions, v), "Choose a supported region."),
  additionalRegions: z
    .array(
      z
        .string()
        .refine((v) => Object.hasOwn(regions, v), "Choose a supported region."),
    )
    .max(40),
  national: z.boolean(),
  regional: z.boolean(),
  longWeekends: z.boolean(),
  weekendDays: z.array(z.number().int().min(1).max(7)).min(1).max(6),
  theme: z.enum(["system", "light", "dark"]),
  alertOffsets: offsetsSchema,
});
export type Settings = z.infer<typeof settingsSchema>;
export const groupSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(200),
});
export const backupSchema = z.object({
  schemaVersion: z.literal(1),
  reminders: z.array(reminderSchema).max(10000),
  rules: z.array(ruleSchema).max(1000),
  groups: z.array(groupSchema).max(1000),
  settings: settingsSchema,
});
export type AppData = z.infer<typeof backupSchema>;
export const defaultSettings: Settings = {
  timezone: "Asia/Kolkata",
  dateFormat: "friendly",
  hour12: true,
  country: "IN",
  primaryRegion: "TN",
  additionalRegions: [],
  national: true,
  regional: true,
  longWeekends: true,
  weekendDays: [6, 7],
  theme: "light",
  alertOffsets: [1440, 60, 30, 15, 5, 0],
};
export const blankRule = (category: Rule["category"] = "Custom"): Rule => ({
  id: crypto.randomUUID(),
  name: "Custom opening",
  category,
  type: "relative",
  quantity: 60,
  unit: "days",
  includeTarget: false,
  openingTime: "08:00",
  timezone: "Asia/Kolkata",
  fixedDate: "",
  weekday: 1,
  monthsBefore: 1,
  releaseDay: 1,
  sourceLabel: "",
  sourceUrl: "",
  lastVerifiedAt: "",
  verificationStatus: "custom",
  notes: "",
  disabled: false,
});
export const defaultRules: Rule[] = categories.map((category, i) => ({
  ...blankRule(category),
  id: `preset-${i}`,
  presetId: `preset-${i}`,
  name:
    category === "Train"
      ? "Indian Railways — General"
      : `${category} — Custom window`,
  type:
    category === "Darshan"
      ? "periodic"
      : category === "Appointment / Slot"
        ? "recurring"
        : "relative",
  quantity: category === "Train" ? 60 : 30,
  verificationStatus: "needs-verification",
  notes:
    "Editable example. Confirm the opening policy with your provider before relying on this rule.",
}));
export const initialData = (): AppData => ({
  schemaVersion: 1,
  reminders: [],
  rules: structuredClone(defaultRules),
  groups: [],
  settings: structuredClone(defaultSettings),
});

export function localInstant(
  dateValue: string,
  timeValue: string,
  timezone: string,
): string {
  return Temporal.PlainDate.from(dateValue)
    .toPlainDateTime(timeValue)
    .toZonedDateTime(timezone, { disambiguation: "reject" })
    .toInstant()
    .toString();
}
export function calculateOpening(
  rule: Rule,
  targetDate: string,
  targetTime = "",
  reference = Temporal.Now.instant().toString(),
): string {
  if (rule.type === "fixed")
    return localInstant(rule.fixedDate, rule.openingTime, rule.timezone);
  if (rule.type === "recurring") {
    const now = Temporal.Instant.from(reference).toZonedDateTimeISO(
      rule.timezone,
    );
    let day = now.toPlainDate();
    for (let i = 0; i < 9; i++, day = day.add({ days: 1 })) {
      if (rule.weekday !== 0 && day.dayOfWeek !== rule.weekday) continue;
      const candidate = localInstant(
        day.toString(),
        rule.openingTime,
        rule.timezone,
      );
      if (Temporal.Instant.compare(candidate, reference) >= 0) return candidate;
    }
    throw new Error("No recurring opening could be calculated.");
  }
  const target = Temporal.PlainDate.from(targetDate);
  if (rule.type === "periodic") {
    const month = target
      .with({ day: 1 })
      .subtract({ months: rule.monthsBefore });
    return localInstant(
      month
        .with({ day: Math.min(rule.releaseDay, month.daysInMonth) })
        .toString(),
      rule.openingTime,
      rule.timezone,
    );
  }
  if (rule.unit === "minutes" || rule.unit === "hours") {
    if (!targetTime)
      throw new Error("A target time is required for hour/minute rules.");
    return Temporal.Instant.from(
      localInstant(targetDate, targetTime, rule.timezone),
    )
      .subtract({ [rule.unit]: rule.quantity })
      .toString();
  }
  // Exclude target: N full calendar days before. Include target: target counts as day 1.
  let day = target.subtract({ [rule.unit]: rule.quantity });
  if (rule.includeTarget && rule.quantity > 0) day = day.add({ days: 1 });
  return localInstant(day.toString(), rule.openingTime, rule.timezone);
}
export function alertsFor(opening: string, offsets: number[]): string[] {
  return [...new Set(offsets)]
    .sort((a, b) => b - a)
    .map((minutes) =>
      Temporal.Instant.from(opening).subtract({ minutes }).toString(),
    );
}
export function statusOf(r: Reminder, now = Date.now()): string {
  if (r.resolution !== "active")
    return {
      booked: "Booked",
      completed: "Completed",
      missed: "Missed / Expired",
      archived: "Archived",
    }[r.resolution];
  const left = Date.parse(r.bookingOpeningAt) - now;
  if (left <= 0) return "Booking Open";
  if (
    dateInZone(r.bookingOpeningAt, r.timezone) ===
    dateInZone(new Date(now).toISOString(), r.timezone)
  )
    return "Opens Today";
  return left <= 7 * 86400000 ? "Booking Soon" : "Future";
}
export function dateInZone(value: string, timezone: string): string {
  return Temporal.Instant.from(value)
    .toZonedDateTimeISO(timezone)
    .toPlainDate()
    .toString();
}
export function formatAt(
  value: string,
  settings: Settings,
  timezone = settings.timezone,
): string {
  const d = new Date(value);
  if (settings.dateFormat === "iso")
    return `${dateInZone(value, timezone)} · ${d.toLocaleTimeString("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: settings.hour12 })}`;
  return d.toLocaleString(
    settings.dateFormat === "day-first" ? "en-GB" : "en-IN",
    {
      timeZone: timezone,
      day: "numeric",
      month: settings.dateFormat === "day-first" ? "2-digit" : "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: settings.hour12,
    },
  );
}
export function ruleSummary(r: Rule): string {
  switch (r.type) {
    case "relative":
      return `${r.quantity} ${r.unit} before target (${r.includeTarget ? "include" : "exclude"} target day)${["hours", "minutes"].includes(r.unit) ? "" : ` at ${r.openingTime}`}`;
    case "fixed":
      return `${r.fixedDate} at ${r.openingTime}`;
    case "recurring":
      return `Every ${["day", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][r.weekday]} at ${r.openingTime}`;
    case "periodic":
      return `Day ${r.releaseDay} of ${r.monthsBefore} month(s) before target at ${r.openingTime} (clamped to month end)`;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];
    return issue ? issue.message : "Please check your entries.";
  }
  return error instanceof Error
    ? error.message
    : "Please check your entries and try again.";
}
