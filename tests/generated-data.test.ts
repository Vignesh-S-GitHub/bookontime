import { readFileSync, readdirSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import type { Holiday } from "../src/holidays";
describe("shipped holiday datasets", () => {
  it("ships four years and every advertised region", () => {
    const coverage = JSON.parse(
      readFileSync("public/data/holidays/coverage.json", "utf8"),
    );
    for (const year of coverage.years) {
      expect(
        JSON.parse(readFileSync(`public/data/holidays/IN/${year}.json`, "utf8"))
          .length,
      ).toBeGreaterThan(0);
      for (const region of coverage.regions)
        expect(() =>
          JSON.parse(
            readFileSync(
              `public/data/holidays/IN/states/${region}-${year}.json`,
              "utf8",
            ),
          ),
        ).not.toThrow();
    }
  });
  it("uses valid date-only values and source metadata", () => {
    for (const file of readdirSync("public/data/holidays/IN/states")) {
      const rows = JSON.parse(
        readFileSync(`public/data/holidays/IN/states/${file}`, "utf8"),
      ) as Holiday[];
      for (const h of rows) {
        expect(Temporal.PlainDate.from(h.date).toString()).toBe(h.date);
        expect(h.source).toMatch(/^https:/);
        expect(h.scope).toBe("regional");
      }
    }
  });
  it("official overrides take precedence", () => {
    const rows = JSON.parse(
      readFileSync("public/data/holidays/IN/states/TN-2026.json", "utf8"),
    ) as Holiday[];
    expect(rows.find((h) => h.name === "Pongal")).toMatchObject({
      date: "2026-01-15",
      tentative: false,
    });
  });
});
