import { openDB } from "idb";
import { Temporal } from "@js-temporal/polyfill";
import {
  alertsFor,
  backupSchema,
  calculateOpening,
  initialData,
  localInstant,
  type AppData,
} from "./domain";
const database = () =>
  openDB("bookontime", 1, {
    upgrade(db) {
      db.createObjectStore("app");
    },
  });
export async function loadData(): Promise<AppData> {
  const db = await database();
  const value = await db.get("app", "data");
  return value ? parseBackup(value) : initialData();
}
export async function saveData(data: AppData): Promise<void> {
  const db = await database();
  await db.put("app", data, "data");
}
export async function mutateData(
  fn: (data: AppData) => AppData,
): Promise<AppData> {
  const db = await database();
  const tx = db.transaction("app", "readwrite");
  const stored = await tx.store.get("data");
  const next = parseBackup(fn(stored ? parseBackup(stored) : initialData()));
  await tx.store.put(next, "data");
  await tx.done;
  return next;
}
export function parseBackup(value: unknown): AppData {
  const data = backupSchema.parse(value);
  for (const key of ["reminders", "rules", "groups"] as const) {
    const ids = data[key].map((v) => v.id);
    if (new Set(ids).size !== ids.length)
      throw new Error(`Duplicate ${key} IDs in backup.`);
  }
  for (const r of data.reminders) {
    if (r.groupId && !data.groups.some((g) => g.id === r.groupId))
      throw new Error("A reminder refers to a missing group.");
    if (r.timezone !== r.rule.timezone)
      throw new Error("Reminder and rule timezones differ.");
    if (r.mode === "calculate" && !r.targetDate)
      throw new Error("Calculated reminders require a target date.");
    if (r.mode === "known" && r.rule.type !== "fixed")
      throw new Error("Known openings require a fixed rule.");
    const expected = calculateOpening(
      r.rule,
      r.targetDate,
      r.targetTime,
      r.createdAt,
    );
    if (Date.parse(expected) !== Date.parse(r.bookingOpeningAt))
      throw new Error("Opening date does not match its rule.");
    r.bookingOpeningAt = Temporal.Instant.from(r.bookingOpeningAt).toString();
    r.alertAt = alertsFor(r.bookingOpeningAt, r.alertOffsets);
    r.targetAt =
      r.targetDate && r.targetTime
        ? localInstant(r.targetDate, r.targetTime, r.timezone)
        : undefined;
  }
  return data;
}
export function mergeData(current: AppData, incoming: AppData): AppData {
  const merge = <T extends { id: string }>(a: T[], b: T[]) => [
    ...new Map([...a, ...b].map((x) => [x.id, x])).values(),
  ];
  return parseBackup({
    ...current,
    reminders: merge(current.reminders, incoming.reminders),
    rules: merge(current.rules, incoming.rules),
    groups: merge(current.groups, incoming.groups),
  });
}
