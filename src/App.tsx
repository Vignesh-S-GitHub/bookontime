import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
  ShieldCheck,
  X,
} from "lucide-react";
import { App as AndroidApp } from "@capacitor/app";
import { useRegisterSW } from "virtual:pwa-register/react";
import { categories, initialData, type AppData, type Rule } from "./domain";
import { loadData, mutateData } from "./storage";
import { checkAlerts } from "./notifications";
import { listenForAlertTap, syncAndroidAlerts } from "./android-alerts";
import { nativeAndroid, offlineApp } from "./platform";
import { AppContext, Brand, Empty, PrivacyNote } from "./ui";
const Dashboard = lazy(() => import("./Dashboard"));
const ReminderForm = lazy(() => import("./ReminderForm"));
const Reminders = lazy(() => import("./Reminders"));
const Details = lazy(() => import("./Details"));
const Rules = lazy(() => import("./Rules"));
const Calendar = lazy(() => import("./Calendar"));
const Groups = lazy(() => import("./Groups"));
const Settings = lazy(() => import("./Settings"));
const OfflineSettings = lazy(() => import("./OfflineSettings"));
export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const current = useRef(initialData());
  const loaded = useRef(false);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [alertError, setAlertError] = useState("");
  const [route, setRoute] = useState(location.hash.slice(1) || "home");
  const [now, setNow] = useState(Date.now());
  const queue = useRef(Promise.resolve());
  const installer = useRef<(Event & { prompt: () => Promise<void> }) | null>(
    null,
  );
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const go = useCallback((path: string) => {
    location.hash = path;
  }, []);
  const reconcile = useCallback(
    async (reminders = current.current.reminders, force = false) => {
      try {
        await syncAndroidAlerts(reminders, force);
        setAlertError("");
      } catch {
        setAlertError(
          "Reminders are saved, but alerts could not be scheduled. Open Notifications to retry.",
        );
      }
    },
    [],
  );
  useEffect(() => {
    let live = true;
    loadData()
      .then((d) => {
        if (!live) return;
        current.current = d;
        loaded.current = true;
        setData(d);
        void reconcile(d.reminders, true);
      })
      .catch(() => {
        if (live)
          setLoadError(
            "Device storage could not be opened. No saved data has been overwritten.",
          );
      });
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const hash = () => {
      setRoute(location.hash.slice(1) || "home");
      window.scrollTo(0, 0);
    };
    const installEvent = (e: Event) => {
      e.preventDefault();
      installer.current = e as typeof installer.current;
    };
    window.addEventListener("hashchange", hash);
    if (!offlineApp)
      window.addEventListener("beforeinstallprompt", installEvent);
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.offline = String(offlineApp);
    return () => {
      live = false;
      clearInterval(tick);
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("beforeinstallprompt", installEvent);
    };
  }, [reconcile]);
  useEffect(() => {
    if (!nativeAndroid) return;
    const handles = [
      listenForAlertTap(go),
      AndroidApp.addListener("appStateChange", (event) => {
        if (event.isActive && loaded.current) void reconcile(undefined, true);
      }),
      AndroidApp.addListener("backButton", () => {
        if (
          !window.dispatchEvent(
            new Event("bookontime-back", { cancelable: true }),
          )
        )
          return;
        if (location.hash !== "#home") go("home");
        else void AndroidApp.exitApp();
      }),
    ];
    return () => {
      for (const h of handles) void h.then((handle) => handle.remove());
    };
  }, [go, reconcile]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 7000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!offlineApp && data)
      void checkAlerts(data.reminders, now).catch(() =>
        setToast("A browser alert could not be delivered."),
      );
  }, [data, Math.floor(now / 15000)]);
  const update = useCallback(
    (fn: (d: AppData) => AppData): Promise<void> => {
      const operation = queue.current.then(async () => {
        const next = await mutateData(fn);
        current.current = next;
        setData(next);
        await reconcile(next.reminders);
      });
      queue.current = operation.catch(() =>
        setToast(
          "Your change could not be saved to device storage. Please try again.",
        ),
      );
      return operation;
    },
    [reconcile],
  );
  function install() {
    if (installer.current)
      void installer.current
        .prompt()
        .catch(() => setToast("Use the browser menu to install BookOnTime."));
    else setToast("Use the browser menu → Install app / Add to Home Screen.");
  }
  const [page, id] = route.split("/");
  let category = "";
  try {
    category = decodeURIComponent(id ?? "");
  } catch {
    /* Invalid route uses default category. */
  }
  const reminder = data?.reminders.find((r) => r.id === id);
  const nav = [
    ["home", "Home", Home],
    ["reminders", "Reminders", Bell],
    ["calendar", "Calendar", CalendarDays],
    ["rules", "Booking rules", SlidersHorizontal],
    ["groups", "Groups", Layers3],
    ["settings", "General settings", SettingsIcon],
  ] as const;
  const settingsPages = [
    "settings",
    "holidays",
    "notifications",
    "permissions",
    "data",
    "about",
  ];
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
        categories.includes(category as Rule["category"])
          ? (category as Rule["category"])
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
  ) : settingsPages.includes(page) ? (
    offlineApp ? (
      <OfflineSettings key={page} section={page} />
    ) : (
      <Settings install={install} online={navigator.onLine} />
    )
  ) : page === "more" ? (
    <>
      <div className="more-brand">
        <Brand />
      </div>
      <div className="panel more-menu">
        {(
          [
            ...nav.slice(5),
            ["notifications", "Notifications", Bell],
            ["holidays", "Holidays", CalendarDays],
            ...nav.slice(3, 5),
            ["data", "Data & backup", Download],
            ["about", "About", Info],
          ] as const
        ).map(([path, label, Icon]) => (
          <a href={`#${path}`} key={path}>
            <Icon size={22} />
            <span>{label}</span>
            <span aria-hidden="true">›</span>
          </a>
        ))}
        {!offlineApp && <button onClick={install}>Install app</button>}
      </div>
    </>
  ) : (
    <Empty
      title="This reminder or page could not be found"
      text="Open your reminders to continue."
    />
  );
  const active = ["detail", "edit", "duplicate"].includes(page)
    ? "reminders"
    : ["rules", "groups", ...settingsPages].includes(page)
      ? "more"
      : page;
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
              key={path}
              className={page === path ? "active" : ""}
              href={`#${path}`}
            >
              <Icon size={20} />
              {label}
            </a>
          ))}
          {offlineApp && (
            <a href="#notifications">
              <Bell size={20} />
              Notifications
            </a>
          )}
        </nav>
        <a className="button primary sidebar-add" href="#add">
          <Plus size={19} />
          Create reminder
        </a>
        <div className="sidebar-bottom">
          <div className="sidebar-art" />
          <p>Book Before It’s Late.</p>
        </div>
      </aside>
      <div className="app-body">
        <header className={`topbar ${page !== "home" ? "inner-topbar" : ""}`}>
          <span className="desktop-top-label">
            Your plans. Perfectly timed.
          </span>
          <div className="mobile-brand">
            <Brand />
          </div>
          <span className="top-status">
            <ShieldCheck size={15} />
            Local & private
          </span>
        </header>
        <main id="main-content" tabIndex={-1} data-page={page}>
          {alertError && (
            <a className="info" role="alert" href="#notifications">
              {alertError}
            </a>
          )}
          <Suspense fallback={<p role="status">Loading…</p>}>{screen}</Suspense>
          <PrivacyNote />
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {(
          [
            ["home", "Home", Home],
            ["reminders", "Reminders", Bell],
            ["calendar", "Calendar", CalendarDays],
            ["more", "More", MoreHorizontal],
          ] as const
        ).map(([path, label, Icon]) => (
          <a
            key={path}
            className={active === path ? "active" : ""}
            href={`#${path}`}
            aria-current={active === path ? "page" : undefined}
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
      {!offlineApp && needRefresh && (
        <div className="update-notice">
          <p>A new version is ready. Save your form before updating.</p>
          <button onClick={() => void updateServiceWorker(true)}>
            Update now
          </button>
          <button onClick={() => setNeedRefresh(false)}>Dismiss</button>
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
