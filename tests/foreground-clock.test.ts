import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { activityEvent, startForegroundClock } from "../src/foreground-clock";
let events: EventTarget;
let foreground: boolean;
const options = () => ({
  events,
  visible: () => foreground,
  intervalMs: 60000,
});
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-10T08:00:00Z"));
  events = new EventTarget();
  foreground = true;
});
afterEach(() => vi.useRealTimers());
describe("foreground UI clocks", () => {
  it("refreshes the general UI once per minute, not once per second", () => {
    const tick = vi.fn();
    const stop = startForegroundClock(tick, options());
    vi.advanceTimersByTime(59999);
    expect(tick).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(tick).toHaveBeenCalledTimes(2);
    stop();
  });
  it("does no timer work while hidden and resumes at the current wall time without catch-up ticks", () => {
    const tick = vi.fn();
    const stop = startForegroundClock(tick, options());
    foreground = false;
    events.dispatchEvent(new Event("visibilitychange"));
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(5 * 60000);
    expect(tick).toHaveBeenCalledTimes(1);
    foreground = true;
    events.dispatchEvent(new Event("visibilitychange"));
    expect(tick).toHaveBeenLastCalledWith(Date.now());
    expect(tick).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(1);
    stop();
  });
  it("also pauses on native activity changes even when the document is visible", () => {
    const stop = startForegroundClock(vi.fn(), options());
    foreground = false;
    events.dispatchEvent(new Event(activityEvent));
    expect(vi.getTimerCount()).toBe(0);
    foreground = true;
    events.dispatchEvent(new Event(activityEvent));
    expect(vi.getTimerCount()).toBe(1);
    stop();
  });
  it("has no timer or initial tick if mounted in the background", () => {
    foreground = false;
    const tick = vi.fn();
    const stop = startForegroundClock(tick, options());
    expect(tick).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    stop();
  });
  it("refreshes at an opening between minute boundaries without a busy loop afterward", () => {
    const tick = vi.fn();
    const stop = startForegroundClock(tick, {
      ...options(),
      deadline: Date.now() + 12345,
    });
    vi.advanceTimersByTime(12344);
    expect(tick).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(tick).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(47655);
    expect(tick).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(1);
    stop();
  });
  it("updates visible countdown seconds and removes every timer/listener on unmount", () => {
    const tick = vi.fn();
    const stop = startForegroundClock(tick, { ...options(), intervalMs: 1000 });
    vi.advanceTimersByTime(3000);
    expect(tick).toHaveBeenCalledTimes(4);
    stop();
    events.dispatchEvent(new Event("visibilitychange"));
    events.dispatchEvent(new Event(activityEvent));
    vi.advanceTimersByTime(60000);
    expect(tick).toHaveBeenCalledTimes(4);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("preserves the separate browser notification clock's background behavior", () => {
    foreground = false;
    const tick = vi.fn();
    const stop = startForegroundClock(tick, {
      ...options(),
      intervalMs: 1000,
      background: true,
    });
    vi.advanceTimersByTime(1000);
    expect(tick).toHaveBeenCalledTimes(2);
    stop();
  });
});
