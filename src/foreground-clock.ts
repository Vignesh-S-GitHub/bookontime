// UI clocks never deliver Android reminders; native AlarmManager owns delivery.
export const activityEvent = "bookontime-activity";
let nativeActive = true;
export function setNativeActivity(active: boolean) {
  if (nativeActive === active) return;
  nativeActive = active;
  document.dispatchEvent(new Event(activityEvent));
}
export function startForegroundClock(
  tick: (now: number) => void,
  {
    intervalMs,
    deadline,
    background = false,
    events = document,
    visible = () => document.visibilityState === "visible" && nativeActive,
  }: {
    intervalMs: number;
    deadline?: number;
    background?: boolean;
    events?: EventTarget;
    visible?: () => boolean;
  },
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  function stop() {
    clearTimeout(timer);
    timer = undefined;
  }
  function refresh() {
    stop();
    if (disposed || (!background && !visible())) return;
    const now = Date.now();
    tick(now);
    // Align to the wall clock, and refresh exactly at the next booking opening.
    let delay = intervalMs - (now % intervalMs);
    if (deadline !== undefined && deadline > now)
      delay = Math.min(delay, deadline - now);
    timer = setTimeout(refresh, Math.max(1, delay));
  }
  events.addEventListener("visibilitychange", refresh);
  events.addEventListener(activityEvent, refresh);
  refresh();
  return () => {
    disposed = true;
    stop();
    events.removeEventListener("visibilitychange", refresh);
    events.removeEventListener(activityEvent, refresh);
  };
}
