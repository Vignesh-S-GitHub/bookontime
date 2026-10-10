import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LocalNotificationSchema } from "@capacitor/local-notifications";
import { blankRule, type Reminder } from "../src/domain";
const fake = vi.hoisted(() => ({
  pending: [] as LocalNotificationSchema[],
  permission: "granted",
  exact: "granted",
  request: vi.fn(),
  schedule: vi.fn(),
  cancel: vi.fn(),
  channel: vi.fn(),
}));
vi.mock("../src/platform", () => ({ nativeAndroid: true }));
vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    checkPermissions: async () => ({ display: fake.permission }),
    checkExactNotificationSetting: async () => ({ exact_alarm: fake.exact }),
    getPending: async () => ({ notifications: [...fake.pending] }),
    requestPermissions: fake.request,
    createChannel: fake.channel,
    schedule: async ({
      notifications,
    }: {
      notifications: LocalNotificationSchema[];
    }) => {
      fake.schedule(notifications);
      fake.pending.push(...notifications);
    },
    cancel: async ({ notifications }: { notifications: { id: number }[] }) => {
      fake.cancel(notifications);
      fake.pending = fake.pending.filter(
        (p) => !notifications.some((n) => n.id === p.id),
      );
    },
  },
}));
import {
  syncAndroidAlerts,
  cancelAllAndroidAlerts,
  hasScheduledReminder,
} from "../src/android-alerts";
const makeReminder = (): Reminder => ({
  id: "native-test",
  title: "Sensitive ticket title",
  notes: "Sensitive notes",
  category: "Train",
  mode: "known",
  route: "",
  provider: "",
  serviceId: "",
  targetDate: "",
  targetTime: "",
  bookingOpeningAt: "2031-10-11T08:00:00Z",
  timezone: "UTC",
  rule: {
    ...blankRule("Train"),
    type: "fixed",
    fixedDate: "2031-10-11",
    openingTime: "08:00",
    timezone: "UTC",
  },
  alertOffsets: [0],
  alertAt: ["2031-10-11T08:00:00Z"],
  bookingUrl: "",
  groupId: "",
  resolution: "active",
  createdAt: "2026-10-10T00:00:00Z",
  updatedAt: "2026-10-10T00:00:00Z",
});
beforeEach(() => {
  fake.pending = [];
  fake.permission = "granted";
  fake.exact = "granted";
  vi.clearAllMocks();
});
describe("Android scheduling boundary", () => {
  it("re-arms stored pending records after launch/resume, when Android may have removed OS alarms", async () => {
    const r = makeReminder();
    await syncAndroidAlerts([r]);
    await syncAndroidAlerts([r], true);
    expect(fake.cancel).toHaveBeenCalledTimes(1);
    expect(fake.schedule).toHaveBeenCalledTimes(2);
    expect(fake.pending).toHaveLength(1);
  });
  it("retains unchanged alerts, replaces edited ones, and cancels resolved reminders", async () => {
    const r = makeReminder();
    await syncAndroidAlerts([r]);
    await syncAndroidAlerts([r]);
    expect(fake.schedule).toHaveBeenCalledTimes(1);
    expect(await hasScheduledReminder(r)).toBe(true);
    const edited = { ...r, alertAt: ["2031-10-12T08:00:00Z"] };
    await syncAndroidAlerts([edited]);
    expect(fake.cancel).toHaveBeenCalledTimes(1);
    expect(fake.pending).toHaveLength(1);
    expect(await hasScheduledReminder(r)).toBe(false);
    await syncAndroidAlerts([{ ...edited, resolution: "booked" }]);
    expect(fake.pending).toEqual([]);
  });
  it("never requests permissions during sync or puts user text in OS notifications", async () => {
    await syncAndroidAlerts([makeReminder()]);
    expect(JSON.stringify(fake.pending)).not.toContain("Sensitive");
    expect(fake.pending[0].isExactNotification).toBe(true);
    fake.permission = "denied";
    await syncAndroidAlerts([makeReminder()]);
    expect(fake.pending).toEqual([]);
    expect(fake.request).not.toHaveBeenCalled();
  });
  it("reschedules after alarm-access changes and clears every alarm on delete-all", async () => {
    await syncAndroidAlerts([makeReminder()]);
    fake.exact = "denied";
    await syncAndroidAlerts([makeReminder()]);
    expect(fake.pending[0].isExactNotification).toBe(false);
    fake.pending.push({ id: -1, title: "BookOnTime", body: "test" });
    await syncAndroidAlerts([makeReminder()]);
    expect(fake.pending).toHaveLength(2);
    await cancelAllAndroidAlerts();
    expect(fake.pending).toEqual([]);
  });
});
