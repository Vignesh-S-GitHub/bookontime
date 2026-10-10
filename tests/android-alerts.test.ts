import { describe, it, expect } from "vitest";
import { planAlerts } from "../src/android-alerts";
import { blankRule, type Reminder } from "../src/domain";
const now = Date.parse("2026-10-10T00:00:00Z");
const reminder = (id = "one"): Reminder => ({
  id,
  title: "Private title",
  category: "Train",
  mode: "known",
  route: "",
  provider: "",
  serviceId: "",
  targetDate: "",
  targetTime: "",
  bookingOpeningAt: "2026-10-11T00:00:00Z",
  timezone: "UTC",
  rule: {
    ...blankRule("Train"),
    type: "fixed",
    fixedDate: "2026-10-11",
    openingTime: "00:00",
    timezone: "UTC",
  },
  alertOffsets: [60, 0],
  alertAt: ["2026-10-10T23:00:00Z", "2026-10-11T00:00:00Z"],
  bookingUrl: "",
  notes: "Private notes",
  groupId: "",
  resolution: "active",
  createdAt: new Date(now).toISOString(),
  updatedAt: new Date(now).toISOString(),
});
describe("native alert planning", () => {
  it("keeps stable unique Android IDs independent of reminder ordering", () => {
    const a = reminder(),
      b = reminder("two");
    const plan = planAlerts([a, b], now);
    expect(planAlerts([b, a], now)).toEqual(plan);
    expect(new Set(plan.map((p) => p.id)).size).toBe(4);
    expect(plan.every((p) => p.id > 0 && p.id <= 2147483647)).toBe(true);
  });
  it("drops past, duplicate, invalid and resolved alerts", () => {
    const r = reminder();
    r.alertAt.push(r.alertAt[0], "invalid", new Date(now - 1000).toISOString());
    expect(planAlerts([r], now)).toHaveLength(2);
    expect(planAlerts([{ ...r, resolution: "booked" }], now)).toEqual([]);
  });
  it("replaces edited timestamps and never includes titles or notes in the OS plan", () => {
    const r = reminder();
    const before = planAlerts([r], now);
    const after = planAlerts(
      [{ ...r, alertAt: ["2026-10-12T00:00:00Z"] }],
      now,
    );
    expect(after[0].id).not.toBe(before[0].id);
    expect(JSON.stringify(after)).not.toContain("Private");
    expect(planAlerts([], now)).toEqual([]);
  });
});
