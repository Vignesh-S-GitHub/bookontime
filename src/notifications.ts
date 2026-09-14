import { openDB } from "idb";
import type { Reminder } from "./domain";
export async function showNotification(
  title: string,
  body: string,
  tag = "bookontime-test",
) {
  if (!("Notification" in window) || Notification.permission !== "granted")
    throw new Error("Enable notifications first.");
  const registration = await navigator.serviceWorker?.getRegistration(
    import.meta.env.BASE_URL,
  );
  if (registration)
    await registration.showNotification(title, {
      body,
      tag,
      icon: `${import.meta.env.BASE_URL}icons/icon-192.png`,
    });
  else new Notification(title, { body, tag });
}
let checking = false;
export async function checkAlerts(reminders: Reminder[], now: number) {
  if (
    checking ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  )
    return;
  checking = true;
  try {
    const db = await openDB("bookontime", 1, {
      upgrade(db) {
        db.createObjectStore("app");
      },
    });
    const sent: Record<string, number> =
      (await db.get("app", "sent-alerts")) ?? {};
    for (const r of reminders.filter((r) => r.resolution === "active"))
      for (const at of r.alertAt) {
        const elapsed = now - Date.parse(at),
          key = `${r.id}:${at}`;
        if (elapsed >= 0 && elapsed < 120000 && !sent[key]) {
          await showNotification(
            r.title,
            Date.parse(r.bookingOpeningAt) <= now
              ? "Booking is open."
              : `Booking opens ${new Date(r.bookingOpeningAt).toLocaleString("en-IN", { timeZone: r.timezone })} (${r.timezone}).`,
            key,
          );
          sent[key] = now;
        }
      }
    for (const key of Object.keys(sent))
      if (now - sent[key] > 7 * 86400000) delete sent[key];
    await db.put("app", sent, "sent-alerts");
  } finally {
    checking = false;
  }
}
