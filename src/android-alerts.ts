import {
  LocalNotifications,
  type LocalNotificationSchema,
} from "@capacitor/local-notifications";
import { nativeAndroid } from "./platform";
import type { Reminder } from "./domain";

export const alertChannel = "booking-openings-private";
export type AlertPlan = {
  id: number;
  key: string;
  reminderId: string;
  at: number;
};
export function planAlerts(reminders: Reminder[], now: number): AlertPlan[] {
  const used = new Set<number>();
  return reminders
    .filter((r) => r.resolution === "active")
    .flatMap((r) =>
      [...new Set(r.alertAt)].map((at) => ({
        key: `${r.id}:${at}`,
        reminderId: r.id,
        at: Date.parse(at),
      })),
    )
    .filter((a) => Number.isFinite(a.at) && a.at > now)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((a) => {
      let hash = 2166136261;
      for (const c of a.key) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
      let id = ((hash >>> 0) % 2147483646) + 1;
      while (used.has(id)) id = id === 2147483647 ? 1 : id + 1;
      used.add(id);
      return { ...a, id };
    });
}
export async function alertStatus() {
  if (!nativeAndroid) return { permission: "preview", exact: false, count: 0 };
  const [permission, exact, pending] = await Promise.all([
    LocalNotifications.checkPermissions(),
    LocalNotifications.checkExactNotificationSetting(),
    LocalNotifications.getPending(),
  ]);
  return {
    permission: permission.display,
    exact: exact.exact_alarm === "granted",
    count: pending.notifications.length,
  };
}
export async function enableAlerts() {
  if (!nativeAndroid) return;
  await LocalNotifications.requestPermissions();
}
export async function enableExactAlerts() {
  if (!nativeAndroid) return;
  await LocalNotifications.changeExactNotificationSetting();
}
export async function hasScheduledReminder(reminder: Reminder) {
  if (!nativeAndroid) return false;
  const expected = planAlerts([reminder], Date.now());
  if (!expected.length) return false;
  const pending = (await LocalNotifications.getPending()).notifications;
  return expected.every((a) => pending.some((p) => p.extra?.key === a.key));
}
let queue: Promise<unknown> = Promise.resolve();
export async function cancelAllAndroidAlerts() {
  if (!nativeAndroid) return;
  await queue.catch(() => undefined);
  const pending = (await LocalNotifications.getPending()).notifications;
  if (pending.length)
    await LocalNotifications.cancel({
      notifications: pending.map((p) => ({ id: p.id })),
    });
}
export function syncAndroidAlerts(
  reminders: Reminder[],
  force = false,
): Promise<void> {
  if (!nativeAndroid) return Promise.resolve();
  const snapshot = structuredClone(reminders);
  const operation = queue
    .catch(() => undefined)
    .then(async () => {
      const status = await alertStatus();
      const pending = (await LocalNotifications.getPending()).notifications;
      // Check first: scheduling must never implicitly trigger a permission dialog.
      const plan =
        status.permission === "granted" ? planAlerts(snapshot, Date.now()) : [];
      const wanted = new Map(plan.map((a) => [a.id, a]));
      const obsolete = pending.filter((p) => {
        if (p.id === -1) return false;
        const a = wanted.get(p.id);
        return (
          force ||
          !a ||
          p.extra?.key !== a.key ||
          p.extra?.exact !== status.exact
        );
      });
      if (obsolete.length)
        await LocalNotifications.cancel({
          notifications: obsolete.map((p) => ({ id: p.id })),
        });
      if (status.permission !== "granted") return;
      await LocalNotifications.createChannel({
        id: alertChannel,
        name: "Booking openings",
        description: "Private, offline booking reminders",
        importance: 4,
        visibility: 0,
        vibration: true,
      });
      const retained = new Set(
        pending.filter((p) => !obsolete.includes(p)).map((p) => p.id),
      );
      const notifications: LocalNotificationSchema[] = plan
        .filter((a) => !retained.has(a.id))
        .map((a) => ({
          id: a.id,
          title: "BookOnTime",
          body: "A booking alert is due. Open the app for details.",
          channelId: alertChannel,
          schedule: { at: new Date(a.at), allowWhileIdle: true },
          isExactNotification: status.exact,
          isExactMandatory: status.exact,
          extra: { key: a.key, reminderId: a.reminderId, exact: status.exact },
        }));
      for (let i = 0; i < notifications.length; i += 50)
        await LocalNotifications.schedule({
          notifications: notifications.slice(i, i + 50),
        });
    });
  queue = operation;
  return operation;
}
export async function testAndroidAlert() {
  if (!nativeAndroid)
    throw new Error(
      "Native alerts are available in the Android app or emulator.",
    );
  const status = await alertStatus();
  if (status.permission !== "granted")
    throw new Error("Allow notifications first.");
  await LocalNotifications.createChannel({
    id: alertChannel,
    name: "Booking openings",
    importance: 4,
    visibility: 0,
    vibration: true,
  });
  await LocalNotifications.schedule({
    notifications: [
      {
        id: -1,
        title: "BookOnTime",
        body: "Your offline test alert is working.",
        channelId: alertChannel,
        schedule: { at: new Date(Date.now() + 10000), allowWhileIdle: true },
        isExactNotification: status.exact,
        isExactMandatory: status.exact,
      },
    ],
  });
}
export async function listenForAlertTap(go: (route: string) => void) {
  if (!nativeAndroid) return { remove: async () => {} };
  return LocalNotifications.addListener(
    "localNotificationActionPerformed",
    (event) => {
      const id: unknown = event.notification.extra?.reminderId;
      if (typeof id === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(id))
        go(`detail/${id}`);
    },
  );
}
