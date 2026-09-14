import Holidays from "date-holidays";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { Holiday } from "../src/holidays";
type Override = Holiday & { remove?: boolean };
const hd = new Holidays("IN");
const regions = hd.getStates("IN") as Record<string, string>;
const start = Number(process.argv[2] ?? new Date().getFullYear());
if (!Number.isInteger(start) || start < 2000 || start > 2100)
  throw new Error("Provide a year from 2000 through 2100.");
const overrides = JSON.parse(
  await readFile("scripts/holiday-overrides.json", "utf8"),
) as Override[];
const base = "public/data/holidays";
await mkdir(`${base}/IN/states`, { recursive: true });
await mkdir("src/data", { recursive: true });
await writeFile(
  "src/data/regions.json",
  JSON.stringify(regions, null, 2) + "\n",
);
for (let year = start; year <= start + 3; year++) {
  const national = hd
    .getHolidays(year)
    .filter((h) => h.type === "public" || h.type === "observance");
  const signature = (h: { date: string; name: string }) =>
    `${h.date.slice(0, 10)}|${h.name}`;
  for (const region of ["", ...Object.keys(regions)]) {
    const source = region ? new Holidays("IN", region) : hd;
    let records: Holiday[] = source
      .getHolidays(year)
      .filter(
        (h) =>
          ["public", "observance"].includes(h.type) &&
          (!region || !national.some((n) => signature(n) === signature(h))),
      )
      .map((h) => ({
        date: h.date.slice(0, 10),
        name: h.name,
        country: "IN",
        region,
        type: h.type,
        scope: region ? "regional" : "national",
        source: "https://github.com/commenthol/date-holidays",
        tentative: true,
      }));
    for (const override of overrides.filter(
      (o) => o.region === region && o.date.startsWith(String(year)),
    )) {
      records = records.filter((r) => signature(r) !== signature(override));
      if (!override.remove) {
        const { remove: _, ...record } = override;
        records.push(record);
      }
    }
    records.sort(
      (a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name),
    );
    await writeFile(
      `${base}/IN/${region ? `states/${region}-` : ""}${year}.json`,
      JSON.stringify(records, null, 2) + "\n",
    );
  }
}
await writeFile(
  `${base}/coverage.json`,
  JSON.stringify(
    {
      years: [start, start + 1, start + 2, start + 3],
      country: "IN",
      regions: Object.keys(regions),
      note: "Baseline and selected festival overrides; not an exhaustive official holiday gazette. Verify tentative dates.",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Generated India and ${Object.keys(regions).length} regions for ${start}–${start + 3}.`,
);
