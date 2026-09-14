import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
  Home,
  Bell,
  CalendarDays,
  SlidersHorizontal,
  Settings as SettingsIcon,
  Plus,
  MoreHorizontal,
  Layers3,
  Download,
  Info,
  WifiOff,
  X,
} from "lucide-react";
import { categories, initialData, type AppData, type Rule } from "./domain";
import { loadData, mutateData } from "./storage";
import { checkAlerts } from "./notifications";
import { AppContext, Brand, Empty, PageHeading, PrivacyNote } from "./ui";
const Dashboard = lazy(() => import("./Dashboard"));
const ReminderForm = lazy(() => import("./ReminderForm"));
const Reminders = lazy(() => import("./Reminders"));
const Details = lazy(() => import("./Details"));
const Rules = lazy(() => import("./Rules"));
const Calendar = lazy(() => import("./Calendar"));
const Groups = lazy(() => import("./Groups"));
const Settings = lazy(() => import("./Settings"));
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const current = useRef<AppData>(initialData());
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [route, setRoute] = useState(location.hash.slice(1) || "home");
  const [now, setNow] = useState(Date.now());
  const [online, setOnline] = useState(navigator.onLine);
  const installer = useRef<InstallEvent | null>(null);
  const queue = useRef(Promise.resolve());
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () =>
      setToast("Offline setup could not finish. Retry when connected."),
  });
  useEffect(() => {
    loadData()
      .then((d) => {
        current.current = d;
        setData(d);
      })
      .catch((e) =>
        setLoadError(
          `Device storage could not be opened: ${e.message}. No data has been overwritten.`,
        ),
      );
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const hash = () => {
      setRoute(location.hash.slice(1) || "home");
      window.scrollTo(0, 0);
    };
    const network = () => setOnline(navigator.onLine);
    const install = (event: Event) => {
      event.preventDefault();
      installer.current = event as InstallEvent;
    };
    window.addEventListener("hashchange", hash);
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    window.addEventListener("beforeinstallprompt", install);
    return () => {
      clearInterval(tick);
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
      window.removeEventListener("beforeinstallprompt", install);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 7000);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    if (data)
      void checkAlerts(data.reminders, now).catch(() =>
        setToast(
          "A browser notification could not be delivered. Use calendar export as a fallback.",
        ),
      );
  }, [data, Math.floor(now / 15000)]);
  useEffect(() => {
    // The approved white-and-blue appearance is independent of device settings.
    document.documentElement.dataset.theme = "light";
  }, []);
  const update = useCallback((fn: (d: AppData) => AppData): Promise<void> => {
    const operation = queue.current.then(async () => {
      const next = await mutateData(fn);
      current.current = next;
      setData(next);
    });
    queue.current = operation.catch(() => {
      setToast(
        "Your change could not be saved to device storage. Please export a backup and try again.",
      );
    });
    return operation;
  }, []);
  const go = useCallback((path: string) => {
    location.hash = path;
  }, []);
  function install() {
    if (installer.current) {
      void installer.current
        .prompt()
        .then(() => installer.current?.userChoice)
        .then((choice) => {
          if (choice?.outcome === "accepted")
            setToast("BookOnTime installation accepted.");
          installer.current = null;
        })
        .catch(() => setToast("Use your browser menu to install BookOnTime."));
    } else {
      go("settings");
      setToast(
        "Use your browser menu → Install app / Add to Home Screen. On iOS, use Safari → Share → Add to Home Screen.",
      );
    }
  }
  const [page, id] = route.split("/");
  let categoryParam = "";
  try {
    categoryParam = decodeURIComponent(id ?? "");
  } catch {
    /* Malformed route: use default category. */
  }
  const reminder = data?.reminders.find((r) => r.id === id);
  const nav = [
    ["home", "Home", Home],
    ["reminders", "Reminders", Bell],
    ["calendar", "Calendar", CalendarDays],
    ["rules", "Booking Rules", SlidersHorizontal],
    ["groups", "Journey Groups", Layers3],
    ["settings", "Settings", SettingsIcon],
  ] as const;
  const screen = !data ? (
    loadError ? (
      <section className="panel">
        <h1>Storage needs attention</h1>
        <p role="alert">{loadError}</p>
        <button onClick={() => location.reload()}>Retry</button>
      </section>
    ) : (
      <p role="status">Opening your reminders…</p>
    )
  ) : page === "home" ? (
    <Dashboard />
  ) : page === "add" ? (
    <ReminderForm
      key={route}
      initialCategory={
        categories.includes(categoryParam as Rule["category"])
          ? (categoryParam as Rule["category"])
          : undefined
      }
    />
  ) : page === "reminders" ? (
    <Reminders key={route} initialTab={id === "open" ? "Open" : "All"} />
  ) : page === "detail" && reminder ? (
    <Details reminder={reminder} />
  ) : ["edit", "duplicate"].includes(page) && reminder ? (
    <ReminderForm
      key={route}
      existing={reminder}
      duplicate={page === "duplicate"}
    />
  ) : page === "rules" ? (
    <Rules />
  ) : page === "calendar" ? (
    <Calendar />
  ) : page === "groups" ? (
    <Groups selectedId={id} />
  ) : page === "settings" ? (
    <Settings install={install} online={online} />
  ) : page === "more" ? (
    <>
      <PageHeading title="More" />
      <div className="more-menu">
        {nav.slice(3).map(([path, label, Icon]) => (
          <a className="panel" href={`#${path}`} key={path}>
            <Icon />
            {label}
          </a>
        ))}
        <a href="#settings" className="panel">
          <Download />
          Data & Backup
        </a>
        <button className="panel" onClick={install}>
          <Download />
          Install App
        </button>
        <a href="#settings" className="panel">
          <Info />
          About BookOnTime
        </a>
      </div>
    </>
  ) : (
    <Empty
      title="This reminder or page could not be found"
      text="Open your reminders to continue."
    />
  );
  return (
    <AppContext.Provider
      value={{ data: data ?? initialData(), update, now, notify: setToast, go }}
    >
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Main navigation">
          {nav.map(([path, label, Icon]) => (
            <a
              className={page === path ? "active" : ""}
              href={`#${path}`}
              key={path}
              aria-current={page === path ? "page" : undefined}
            >
              <Icon size={20} />
              {label}
            </a>
          ))}
        </nav>
        <a className="button primary sidebar-add" href="#add">
          <Plus size={19} />
          Add Reminder
        </a>
        <div className="sidebar-bottom">
          <div className="sidebar-art" />
          <p>Book Before It’s Late.</p>
          <button className="text-link" onClick={install}>
            <Download size={16} />
            Install App
          </button>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <span className="desktop-top-label">
            Your plans. Perfectly timed.
          </span>
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="top-status">
            {online ? (
              <>
                <span className="local-dot" />
                Local & private
              </>
            ) : (
              <>
                <WifiOff size={16} />
                Offline
              </>
            )}
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <Suspense fallback={<p role="status">Loading…</p>}>{screen}</Suspense>
          <PrivacyNote />
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {(
          [
            ["home", "Home", Home],
            ["reminders", "Reminders", Bell],
            ["add", "Add", Plus],
            ["calendar", "Calendar", CalendarDays],
            ["more", "More", MoreHorizontal],
          ] as const
        ).map(([path, label, Icon]) => (
          <a
            className={`${page === path ? "active" : ""} ${path === "add" ? "add-nav" : ""}`}
            href={`#${path}`}
            key={path}
            aria-current={page === path ? "page" : undefined}
          >
            <Icon size={22} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {(needRefresh || offlineReady) && (
        <div className="update-notice" role="status">
          <p>
            {needRefresh
              ? "A new BookOnTime version is ready. Save any form before updating."
              : "BookOnTime is ready offline. Holiday data is cached as you view it."}
          </p>
          <div className="actions">
            {needRefresh && (
              <button onClick={() => void updateServiceWorker(true)}>
                Update now
              </button>
            )}
            <button
              onClick={() => {
                setNeedRefresh(false);
                setOfflineReady(false);
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <datalist id="timezones">
        {[
          "Asia/Kolkata",
          "UTC",
          "Europe/London",
          "America/New_York",
          "America/Los_Angeles",
          "Asia/Singapore",
          "Asia/Dubai",
          "Australia/Sydney",
          "Asia/Tokyo",
        ].map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </AppContext.Provider>
  );
}
