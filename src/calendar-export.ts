import { Temporal } from "@js-temporal/polyfill";
import { ruleSummary, type Reminder } from "./domain";
const escape = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
const stamp = (s: string) =>
  new Date(s)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
export function foldLine(line: string): string {
  let out = "",
    count = 0;
  for (const c of line) {
    const n = new TextEncoder().encode(c).length;
    if (count + n > 75) {
      out += "\r\n ";
      count = 1;
    }
    out += c;
    count += n;
  }
  return out;
}
export function exportICS(reminders: Reminder[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BookOnTime//Booking Openings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const r of reminders) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escape(r.id)}@bookontime.local`,
      `DTSTAMP:${stamp(r.updatedAt)}`,
      `DTSTART:${stamp(r.bookingOpeningAt)}`,
      `DTEND:${stamp(Temporal.Instant.from(r.bookingOpeningAt).add({ minutes: 15 }).toString())}`,
      `SUMMARY:${escape(`BOOK TICKET — ${r.title}`)}`,
      `DESCRIPTION:${escape(`${r.category}\nTarget: ${r.targetDate || "Not specified"} ${r.targetTime}\nTimezone: ${r.timezone}\nProvider: ${r.provider}\nRule: ${ruleSummary(r.rule)}\n${r.bookingUrl}\n${r.notes}`)}`,
    );
    if (r.bookingUrl) lines.push(`URL:${r.bookingUrl}`);
    for (const minutes of [...new Set(r.alertOffsets)])
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escape(`Booking opens: ${r.title}`)}`,
        `TRIGGER:-PT${minutes}M`,
        "END:VALARM",
      );
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
export function googleCalendar(r: Reminder): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `BOOK TICKET — ${r.title}`,
    dates: `${stamp(r.bookingOpeningAt)}/${stamp(Temporal.Instant.from(r.bookingOpeningAt).add({ minutes: 15 }).toString())}`,
    details: `${r.category}\nTarget: ${r.targetDate}\n${ruleSummary(r.rule)}\n${r.bookingUrl}\n${r.notes}`,
    ctz: r.timezone,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
export function download(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
