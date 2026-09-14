import { useEffect, useState } from "react";
import { loadHolidays, type Holiday } from "./holidays";
import type { Settings } from "./domain";
export function useHolidays(dates: string[], settings: Settings) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [error, setError] = useState("");
  const years = [
    ...new Set(dates.filter(Boolean).map((d) => Number(d.slice(0, 4)))),
  ]
    .sort()
    .join(",");
  const regionKey = JSON.stringify([
    settings.primaryRegion,
    settings.additionalRegions,
    settings.national,
    settings.regional,
  ]);
  useEffect(() => {
    let live = true;
    setHolidays([]);
    setError("");
    if (!years) return;
    loadHolidays(years.split(",").map(Number), settings)
      .then((h) => {
        if (live) setHolidays(h);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [years, regionKey]);
  return { holidays, error };
}
