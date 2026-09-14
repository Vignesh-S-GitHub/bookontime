import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { initialData } from "../src/domain";
import { loadData, mutateData, saveData } from "../src/storage";
beforeEach(async () => {
  await saveData(initialData());
});
describe("IndexedDB persistence", () => {
  it("persists settings and custom groups across reads", async () => {
    await mutateData((d) => ({
      ...d,
      settings: { ...d.settings, theme: "dark" },
      groups: [{ id: "g1", name: "December getaway" }],
    }));
    const d = await loadData();
    expect(d.settings.theme).toBe("dark");
    expect(d.groups[0].name).toBe("December getaway");
  });
  it("serializes independent writes without dropping records", async () => {
    await Promise.all([
      mutateData((d) => ({
        ...d,
        groups: [...d.groups, { id: "a", name: "A" }],
      })),
      mutateData((d) => ({
        ...d,
        groups: [...d.groups, { id: "b", name: "B" }],
      })),
    ]);
    expect((await loadData()).groups).toHaveLength(2);
  });
  it("keeps stored data when a mutation fails", async () => {
    await expect(
      mutateData(() => {
        throw new Error("invalid");
      }),
    ).rejects.toThrow("invalid");
    expect((await loadData()).reminders).toHaveLength(0);
  });
  it("reset restores shipped defaults", async () => {
    await mutateData((d) => ({ ...d, groups: [{ id: "a", name: "A" }] }));
    await mutateData(() => initialData());
    expect((await loadData()).groups).toEqual([]);
  });
});
