import { describe, it, expect } from "vitest";
import {
  alertsFor,
  blankRule,
  calculateOpening,
  dateInZone,
  localInstant,
  statusOf,
  initialData,
  type Reminder,
} from "../src/domain";
import { parseBackup, mergeData } from "../src/storage";
import { exportICS, foldLine, googleCalendar } from "../src/calendar-export";
import { filterHolidays, longWeekends, type Holiday } from "../src/holidays";
const rule = () => ({ ...blankRule(), id: "r", name: "60 day window" });
function reminder(): Reminder {
  const r = rule(),
    opening = calculateOpening(r, "2026-11-10");
  return {
    id: "x",
    title: "Chennai → Coimbatore",
    category: "Train",
    mode: "calculate",
    route: "Chennai → Coimbatore",
    provider: "",
    serviceId: "",
    targetDate: "2026-11-10",
    targetTime: "",
    bookingOpeningAt: opening,
    timezone: r.timezone,
    rule: r,
    alertOffsets: [60, 0],
    alertAt: alertsFor(opening, [60, 0]),
    bookingUrl: "https://example.com",
    notes: "Comma, semicolon;\nTamil தமிழ்",
    groupId: "",
    resolution: "active",
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
  };
}
describe("calendar-safe rule engine", () => {
  it("calculates 60 days excluding target day in Kolkata", () =>
    expect(calculateOpening(rule(), "2026-11-10")).toBe(
      "2026-09-11T02:30:00Z",
    ));
  it("includes target as day one", () =>
    expect(
      calculateOpening({ ...rule(), includeTarget: true }, "2026-11-10"),
    ).toBe("2026-09-12T02:30:00Z"));
  it.each([
    ["2028-03-01", 1, "2028-02-29"],
    ["2027-03-01", 1, "2027-02-28"],
    ["2027-01-01", 1, "2026-12-31"],
    ["2026-05-01", 1, "2026-04-30"],
  ])("handles %s minus %s days", (target, quantity, expected) =>
    expect(
      dateInZone(
        calculateOpening({ ...rule(), quantity }, target),
        "Asia/Kolkata",
      ),
    ).toBe(expected),
  );
  it("constrains month subtraction at month end", () =>
    expect(
      dateInZone(
        calculateOpening(
          { ...rule(), unit: "months", quantity: 1 },
          "2028-03-31",
        ),
        "Asia/Kolkata",
      ),
    ).toBe("2028-02-29"));
  it("keeps midnight calendar dates in Kolkata", () =>
    expect(localInstant("2026-09-11", "00:00", "Asia/Kolkata")).toBe(
      "2026-09-10T18:30:00Z",
    ));
  it("calculates fixed opening without target", () =>
    expect(
      calculateOpening(
        { ...rule(), type: "fixed", fixedDate: "2026-10-01" },
        "",
      ),
    ).toBe("2026-10-01T02:30:00Z"));
  it("finds next Monday, including exact same time", () =>
    expect(
      calculateOpening(
        { ...rule(), type: "recurring", weekday: 1 },
        "",
        "",
        "2026-09-14T02:30:00Z",
      ),
    ).toBe("2026-09-14T02:30:00Z"));
  it("advances a passed recurring opening", () =>
    expect(
      calculateOpening(
        { ...rule(), type: "recurring", weekday: 1 },
        "",
        "",
        "2026-09-14T03:00:00Z",
      ),
    ).toBe("2026-09-21T02:30:00Z"));
  it("supports daily recurrence", () =>
    expect(
      calculateOpening(
        { ...rule(), type: "recurring", weekday: 0 },
        "",
        "",
        "2026-09-14T03:00:00Z",
      ),
    ).toBe("2026-09-15T02:30:00Z"));
  it("releases January bookings in December", () =>
    expect(
      calculateOpening({ ...rule(), type: "periodic" }, "2027-01-20"),
    ).toBe("2026-12-01T02:30:00Z"));
  it("clamps periodic release to February end", () =>
    expect(
      calculateOpening(
        { ...rule(), type: "periodic", releaseDay: 31 },
        "2028-03-20",
      ),
    ).toBe("2028-02-29T02:30:00Z"));
  it("supports same-day zero offset", () =>
    expect(
      dateInZone(
        calculateOpening(
          { ...rule(), quantity: 0, includeTarget: true },
          "2026-09-11",
        ),
        "Asia/Kolkata",
      ),
    ).toBe("2026-09-11"));
  it("subtracts elapsed hours from target time", () =>
    expect(
      calculateOpening(
        { ...rule(), quantity: 2, unit: "hours" },
        "2026-09-11",
        "10:00",
      ),
    ).toBe("2026-09-11T02:30:00Z"));
  it("requires target time for hour offsets", () =>
    expect(() =>
      calculateOpening({ ...rule(), unit: "hours" }, "2026-09-11"),
    ).toThrow());
  it("uses local calendar days across DST", () =>
    expect(
      calculateOpening(
        { ...rule(), quantity: 1, timezone: "America/New_York" },
        "2026-03-09",
      ),
    ).toBe("2026-03-08T12:00:00Z"));
  it("rejects nonexistent and ambiguous DST wall times", () => {
    expect(() =>
      localInstant("2026-03-08", "02:30", "America/New_York"),
    ).toThrow();
    expect(() =>
      localInstant("2026-11-01", "01:30", "America/New_York"),
    ).toThrow();
  });
  it("past openings remain Booking Open", () =>
    expect(statusOf(reminder(), Date.parse("2027-01-01"))).toBe(
      "Booking Open",
    ));
  it("respects explicit resolution", () =>
    expect(statusOf({ ...reminder(), resolution: "booked" })).toBe("Booked"));
  it("calculates alerts and duplicate changes", () => {
    const r = reminder();
    expect(r.alertAt[0]).toBe("2026-09-11T01:30:00Z");
    expect(calculateOpening(r.rule, "2026-11-11")).toBe("2026-09-12T02:30:00Z");
  });
});
describe("backups and calendar export", () => {
  it("round trips a validated backup", () => {
    const data = { ...initialData(), reminders: [reminder()] };
    expect(parseBackup(JSON.parse(JSON.stringify(data)))).toEqual(data);
  });
  it("rejects invalid schema, URL, date and mismatched calculation", () => {
    const data = { ...initialData(), reminders: [reminder()] };
    for (const change of [
      { bookingUrl: "javascript:alert(1)" },
      { targetDate: "2026-02-30" },
      { bookingOpeningAt: "2026-01-01T00:00:00Z" },
    ])
      expect(() =>
        parseBackup({ ...data, reminders: [{ ...reminder(), ...change }] }),
      ).toThrow();
    expect(() => parseBackup({ ...data, schemaVersion: 2 })).toThrow();
  });
  it("rejects duplicate IDs and dangling groups", () => {
    expect(() =>
      parseBackup({ ...initialData(), reminders: [reminder(), reminder()] }),
    ).toThrow();
    expect(() =>
      parseBackup({
        ...initialData(),
        reminders: [{ ...reminder(), groupId: "missing" }],
      }),
    ).toThrow();
  });
  it("merges by ID while preserving current settings", () => {
    const current = { ...initialData(), reminders: [reminder()] };
    const incoming = {
      ...initialData(),
      reminders: [{ ...reminder(), title: "Updated" }],
    };
    expect(mergeData(current, incoming).reminders).toHaveLength(1);
    expect(mergeData(current, incoming).reminders[0].title).toBe("Updated");
  });
  it("exports opening instant with alarms and escaped details", () => {
    const ics = exportICS([reminder()]);
    expect(ics).toContain("DTSTART:20260911T023000Z");
    expect(ics).toContain("TRIGGER:-PT60M");
    expect(ics).toContain("Comma\\, semicolon\\;\\n");
    expect(ics).toContain("END:VCALENDAR\r\n");
    expect(googleCalendar(reminder())).toContain("20260911T023000Z");
  });
  it("folds on UTF-8 boundaries with max 75 octets", () => {
    const text = "தமிழ்".repeat(80);
    const folded = foldLine(text);
    expect(folded.replace(/\r\n /g, "")).toBe(text);
    for (const line of folded.split("\r\n"))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});
describe("holiday context", () => {
  const holiday = (date: string, region = ""): Holiday => ({
    date,
    name: "Holiday",
    country: "IN",
    region,
    type: "public",
    scope: region ? "regional" : "national",
    source: "test",
    tentative: false,
  });
  it("filters regions and national preference", () => {
    const settings = initialData().settings;
    expect(
      filterHolidays(
        [
          holiday("2026-01-26"),
          holiday("2026-01-15", "TN"),
          holiday("2026-01-15", "KA"),
        ],
        settings,
      ),
    ).toHaveLength(2);
  });
  it("detects Friday and Monday long weekends", () => {
    expect(longWeekends([holiday("2026-09-11")], [6, 7])[0]).toEqual({
      start: "2026-09-11",
      end: "2026-09-13",
      days: 3,
    });
    expect(longWeekends([holiday("2026-09-14")], [6, 7])[0].days).toBe(3);
  });
  it("handles year boundaries and custom weekends", () => {
    expect(longWeekends([holiday("2027-01-01")], [6, 7])[0].days).toBe(3);
    expect(longWeekends([holiday("2026-09-10")], [5, 6])[0].days).toBe(3);
  });
  it("does not count observances as days off", () =>
    expect(
      longWeekends([{ ...holiday("2026-09-11"), type: "observance" }], [6, 7]),
    ).toHaveLength(0));
});
