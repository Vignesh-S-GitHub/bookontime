import { Temporal } from "@js-temporal/polyfill";
import type { Settings } from "./domain";
export type Holiday = {
  date: string;
  name: string;
  country: string;
  region: string;
  type: string;
  scope: "national" | "regional";
  source: string;
  tentative: boolean;
};
export type LongWeekend = { start: string; end: string; days: number };
export function filterHolidays(data: Holiday[], settings: Settings): Holiday[] {
  const regions = [settings.primaryRegion, ...settings.additionalRegions];
  return data.filter(
    (h) =>
      h.country === settings.country &&
      (h.scope === "national"
        ? settings.national
        : settings.regional && regions.includes(h.region)),
  );
}
export function longWeekends(
  holidays: Holiday[],
  weekendDays: number[],
): LongWeekend[] {
  const dates = new Set(
    holidays.filter((h) => h.type === "public").map((h) => h.date),
  );
  const results = new Map<string, LongWeekend>();
  const free = (d: Temporal.PlainDate) =>
    dates.has(d.toString()) || weekendDays.includes(d.dayOfWeek);
  for (const s of dates) {
    let start = Temporal.PlainDate.from(s),
      end = start;
    while (free(start.subtract({ days: 1 })))
      start = start.subtract({ days: 1 });
    while (free(end.add({ days: 1 }))) end = end.add({ days: 1 });
    const days = start.until(end).days + 1;
    if (days >= 3)
      results.set(start.toString(), {
        start: start.toString(),
        end: end.toString(),
        days,
      });
  }
  return [...results.values()].sort((a, b) => a.start.localeCompare(b.start));
}
const cached = new Map<string, Promise<Holiday[]>>();
async function readHolidayFile(path: string): Promise<Holiday[]> {
  const url = `${import.meta.env.BASE_URL}data/holidays/${path}`;
  const cache =
    "caches" in globalThis
      ? await caches.open("bookontime-holidays-v1")
      : undefined;
  const saved = await cache?.match(url);
  if (saved) return saved.json() as Promise<Holiday[]>;
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok)
    throw new Error(
      "Holiday data is unavailable for a selected year or region. Previously loaded data remains available offline.",
    );
  const records = (await response.clone().json()) as Holiday[];
  await cache?.put(url, response);
  return records;
}
export async function loadHolidays(
  years: number[],
  settings: Settings,
): Promise<Holiday[]> {
  const paths = [...new Set(years)].flatMap((year) => [
    ...(settings.national ? [`IN/${year}.json`] : []),
    ...(settings.regional
      ? [...new Set([settings.primaryRegion, ...settings.additionalRegions])]
          .filter(Boolean)
          .map((region) => `IN/states/${region}-${year}.json`)
      : []),
  ]);
  const rows = await Promise.all(
    paths.map((path) => {
      if (!cached.has(path))
        cached.set(
          path,
          readHolidayFile(path).catch((e) => {
            cached.delete(path);
            throw e;
          }),
        );
      return cached.get(path)!;
    }),
  );
  return filterHolidays(rows.flat(), settings);
}
