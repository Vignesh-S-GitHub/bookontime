import "fake-indexeddb/auto";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { openDB } from "idb";
import { showNotification, checkAlerts } from "../src/notifications";
import { blankRule, type Reminder } from "../src/domain";
const shown = vi.fn().mockResolvedValue(undefined);
beforeEach(async () => {
  shown.mockClear();
  vi.stubGlobal("window", { Notification: { permission: "granted" } });
  vi.stubGlobal("Notification", { permission: "granted" });
  vi.stubGlobal("navigator", {
    serviceWorker: {
      getRegistration: async () => ({ showNotification: shown }),
    },
  });
  const db = await openDB("bookontime", 1, {
    upgrade(db) {
      db.createObjectStore("app");
    },
  });
  await db.put("app", {}, "sent-alerts");
});
afterEach(() => vi.unstubAllGlobals());
describe("notification boundary", () => {
  it("uses service-worker notification display", async () => {
    await showNotification("Test", "Ready");
    expect(shown).toHaveBeenCalledWith(
      "Test",
      expect.objectContaining({ body: "Ready", tag: "bookontime-test" }),
    );
  });
  it("never requests permission or displays while denied", async () => {
    vi.stubGlobal("Notification", { permission: "denied" });
    await expect(showNotification("Test", "Ready")).rejects.toThrow(
      "Enable notifications first.",
    );
    expect(shown).not.toHaveBeenCalled();
  });
  it("deduplicates due alerts and ignores resolved reminders", async () => {
    const now = Date.parse("2026-09-11T08:00:00Z");
    const r: Reminder = {
      id: "test",
      title: "Test opening",
      category: "Train",
      mode: "known",
      route: "",
      provider: "",
      serviceId: "",
      targetDate: "",
      targetTime: "",
      bookingOpeningAt: new Date(now).toISOString(),
      timezone: "UTC",
      rule: blankRule(),
      alertOffsets: [0],
      alertAt: [new Date(now).toISOString()],
      bookingUrl: "",
      notes: "",
      groupId: "",
      resolution: "active",
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    };
    await checkAlerts([r], now);
    await checkAlerts([r], now + 15000);
    await checkAlerts([{ ...r, id: "resolved", resolution: "booked" }], now);
    expect(shown).toHaveBeenCalledTimes(1);
  });
});
