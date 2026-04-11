import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation, useParams } from "react-router-dom";
import StatusPill from "./components/StatusPill";
import { bridgeTypes, pingExtension, requestExtensionState, subscribeToBridge } from "./lib/bridge";

const DATA_FILES = [
  { key: "academicCalendar", label: "Academic Calendar", path: "/data/academiccalendar_list.json" },
  { key: "unlvCalendar", label: "UNLV Calendar", path: "/data/unlvcalendar_list.json" },
  { key: "involvementCenter", label: "Involvement Center", path: "/data/involvementcenter_list.json" },
  { key: "rebelCoverage", label: "Rebel Sports", path: "/data/rebelcoverage_list.json" },
];

const ALL_INTERESTS = [
  "Academics",
  "Arts",
  "Career",
  "Community",
  "Culture",
  "Diversity",
  "Health",
  "Social",
  "Sports",
  "Tech",
];

const ALL_SPORTS = [
  "Baseball",
  "Football",
  "Softball",
  "Swimming & Diving",
  "Men's Basketball",
  "Men's Golf",
  "Men's Soccer",
  "Men's Tennis",
  "Women's Basketball",
  "Women's Cross Country",
  "Women's Golf",
  "Women's Soccer",
  "Women's Tennis",
  "Women's Track & Field",
  "Women's Volleyball",
];

const CONTRIBUTORS = [
  {
    name: "Billy Estrada",
    role: "Integrated Services",
    contribution: "Notifications, login reminders, and extension workflow support.",
    image: "/contributors/Billy.jpeg",
    linkedin: "https://www.linkedin.com/in/billy-estrada/",
  },
  {
    name: "Blaise Carillo",
    role: "Backend",
    contribution: "Project development, collaboration, and implementation support.",
    image: "/contributors/Blaise.png",
    linkedin: "https://www.linkedin.com/in/blaise-carrillo-601a83241/",
  },
  {
    name: "Chandni Mirpuri Silva",
    role: "Frontend",
    contribution: "UI components, Pomodoro work, and interaction design support.",
    image: "/contributors/Chandni.png",
    linkedin: "https://www.linkedin.com/in/chandni-mirpuri-a0b047287/",
  },
  {
    name: "Frank Lopez",
    role: "Backend",
    contribution: "Project development, collaboration, and product support.",
    image: "/contributors/Frank.jpeg",
    linkedin: "https://www.linkedin.com/in/frank-lopez-b4809295/",
  },
  {
    name: "Gee Buchanan",
    role: "Frontend",
    contribution: "Testing, settings-page support, and project polish.",
    image: "/contributors/Gee.png",
    linkedin: "https://www.linkedin.com/in/gerica-buchanan-115a02209/",
  },
  {
    name: "Gunnar Dalton",
    role: "Integrated Services",
    contribution: "Canvas integration, Google Calendar sync, and assignment systems.",
    image: "/contributors/Gunnar.jpeg",
    linkedin: "https://www.linkedin.com/in/gunnar-dalton/",
  },
  {
    name: "Jeremy Besitula",
    role: "Frontend Lead",
    contribution: "Calendar view, accordion interactions, and core interface behavior.",
    image: "/contributors/Jeremy.jpeg",
    linkedin: "https://www.linkedin.com/in/jeremy-besitula-369794257/",
  },
  {
    name: "Joshua Stiles",
    role: "Backend Lead",
    contribution: "Project development, collaboration, and implementation support.",
    image: "/contributors/Josh.jpeg",
    linkedin: "https://www.linkedin.com/in/joshstiles/",
  },
  {
    name: "Kamila Kinel",
    role: "Backend",
    contribution: "Project development, coordination, and product support.",
    image: "/contributors/Kamila.png",
    linkedin: "https://www.linkedin.com/in/kamila-kinel/",
  },
  {
    name: "Sebastian Yepez",
    role: "Team Lead",
    contribution: "Authentication, preferences, user events, and settings experience.",
    image: "/contributors/Sebastian.png",
    linkedin: "https://www.linkedin.com/in/sebastian-yepez/",
  },
];

const DATA_FILE_MAP = Object.fromEntries(DATA_FILES.map((item) => [item.key, item]));

const DEFAULT_THEME = {
  backgroundColor: "#BB0000",
  textColor: "#f3f4f6",
  selectedThemeKey: "custom",
};

function buildBackground(backgroundColor) {
  return `linear-gradient(135deg, ${backgroundColor} 0%, #f3d2d7 100%)`;
}

function formatEventDate(item) {
  if (!item?.startDate) {
    return "TBA";
  }

  const date = new Date(`${item.startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return [item.startDate, item.startTime].filter(Boolean).join(" at ");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const itemDay = new Date(date);
  itemDay.setHours(0, 0, 0, 0);

  const formatTime = (value) => {
    if (!value || value === "(ALL DAY)") {
      return "";
    }

    const parsed = new Date(`${item.startDate}T${value}`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).toLowerCase();
    }

    return value.toLowerCase();
  };

  const timeLabel = formatTime(item.startTime);

  if (itemDay.getTime() === today.getTime()) {
    return timeLabel ? `Today at ${timeLabel}` : "Today";
  }

  if (itemDay.getTime() === tomorrow.getTime()) {
    return timeLabel ? `Tomorrow at ${timeLabel}` : "Tomorrow";
  }

  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day % 100 !== 11
      ? "st"
      : day % 10 === 2 && day % 100 !== 12
        ? "nd"
        : day % 10 === 3 && day % 100 !== 13
          ? "rd"
          : "th";

  const dateLabel = `${date.toLocaleDateString(undefined, { month: "short" })} ${day}${suffix}`;
  return timeLabel ? `${dateLabel} at ${timeLabel}` : dateLabel;
}

function getTitleSizeClass(title = "") {
  if (title.length > 90) {
    return "text-lg sm:text-xl";
  }

  if (title.length > 60) {
    return "text-xl sm:text-2xl";
  }

  return "text-2xl";
}

function getEventSourceLabel(sourceKey) {
  return DATA_FILE_MAP[sourceKey]?.label || "Campus Source";
}

function getEventTimestamp(item) {
  if (!item?.startDate) {
    return Number.POSITIVE_INFINITY;
  }

  const datePart = item.startDate;
  const timePart =
    item.startTime && item.startTime !== "(ALL DAY)" ? item.startTime : "11:59 PM";
  const parsed = new Date(`${datePart} ${timePart}`);

  if (Number.isNaN(parsed.getTime())) {
    const fallback = new Date(datePart);
    return Number.isNaN(fallback.getTime()) ? Number.POSITIVE_INFINITY : fallback.getTime();
  }

  return parsed.getTime();
}

function isUpcomingEvent(item) {
  return getEventTimestamp(item) >= Date.now();
}

function formatAssignmentDate(value) {
  if (!value) {
    return "No due date";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatUserEventDate(event) {
  if (!event?.startDate) {
    return "No date";
  }

  const baseDate = new Date(`${event.startDate}T00:00:00`);
  if (Number.isNaN(baseDate.getTime())) {
    return event.startDate;
  }

  const dateLabel = baseDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (event.allDay || !event.startTime) {
    return `${dateLabel} · All day`;
  }

  const timedDate = new Date(`${event.startDate}T${event.startTime}`);
  if (Number.isNaN(timedDate.getTime())) {
    return `${dateLabel} · ${event.startTime}`;
  }

  return `${dateLabel} · ${timedDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function formatCombinedHomeEventDate(event) {
  if (event.sourceType === "involvementCenter") {
    return formatEventDate({
      startDate: event.startDate,
      startTime: event.startTime,
    });
  }

  return formatUserEventDate(event);
}

function formatAcademicCalendarBadge(item) {
  if (!item?.startDate) {
    return "TBA";
  }

  const parsed = new Date(`${item.startDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return item.startDate;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function toTitleList(preferences = {}) {
  const labelOverrides = {
    UNLVCalendar: "UNLV Calendar",
    involvementCenter: "Involvement Center",
    academicCalendar: "Academic Calendar",
    rebelCoverage: "Rebel Sports",
    canvasIntegration: "Canvas Integration",
    googleCalendar: "Google Calendar",
  };

  return Object.entries(preferences)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => labelOverrides[key] || key.replace(/([A-Z])/g, " $1"))
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1));
}

function getDatasetRoute(key) {
  return `/datasets/${key}`;
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-sm font-semibold transition",
        active
          ? "border-stone-900 bg-stone-900 text-white"
          : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-300"
    />
  );
}

function SelectedFilterPill({ label, onRemove }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#8b0000] px-3 py-1 text-sm font-semibold text-white shadow-sm">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full border border-white/20 px-2 py-0.5 text-xs font-bold transition hover:bg-white/15"
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
    </div>
  );
}

function ViewAllFiltersModal({
  open,
  onClose,
  title,
  options,
  selectedValues,
  onToggle,
  onClearAll,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl rounded-[2rem] border border-white/20 bg-stone-100/95 p-6 text-stone-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-all-filters-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">View All</p>
            <h2 id="view-all-filters-title" className="mt-2 font-serif text-3xl leading-tight">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClearAll}
              className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-stone-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-5 max-h-[24rem] space-y-3 overflow-y-auto rounded-[1.5rem] border border-stone-200 bg-white p-4">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-stone-100">
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={() => onToggle(option)}
              />
              <span className="text-sm font-medium text-stone-800">{option}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConnectedPulse({ active }) {
  return (
    <div className="relative flex h-3 w-3 items-center justify-center">
      {active ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" /> : null}
      <span className={["relative inline-flex h-3 w-3 rounded-full", active ? "bg-emerald-300" : "bg-rose-300"].join(" ")} />
    </div>
  );
}

function Navbar({ visible }) {
  const location = useLocation();
  const datasetKey = location.pathname.startsWith("/datasets/")
    ? location.pathname.split("/").pop()
    : null;
  const activeDatasetLabel = datasetKey ? DATA_FILE_MAP[datasetKey]?.label : null;
  const isHomePage = location.pathname === "/";
  const isContributorsPage = location.pathname === "/contributors";
  const pageLabel = isHomePage ? "Home" : isContributorsPage ? "Contributors" : "Dataset Explorer";
  const showHomeActions = !activeDatasetLabel && !isContributorsPage;

  return (
    <nav
      className={[
        "fixed inset-x-0 top-0 z-40 transition duration-300",
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between rounded-[1.5rem] border border-white/20 bg-black/65 px-4 py-3 shadow-2xl backdrop-blur-md">
          <Link to="/" className="flex items-center gap-3 text-white">
            <img src="/rr_logo.png" alt="Rebel Remind logo" className="h-10 w-10 rounded-xl" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Rebel Remind</p>
              <p className="text-sm font-semibold text-white/95">{pageLabel}</p>
            </div>
          </Link>

          {activeDatasetLabel ? (
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Dataset</p>
              <p className="text-xl font-black text-white sm:text-2xl">{activeDatasetLabel}</p>
            </div>
          ) : showHomeActions ? (
            <div className="hidden items-center gap-3 sm:flex">
              <a
                href="#campus-feed"
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Campus Feed
              </a>
              <a
                href="#dataset-grid"
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Datasets
              </a>
              <button
                type="button"
                onClick={window.__openRebelDownloadModal}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-stone-200"
              >
                Download RebelRemind
              </button>
            </div>
          ) : (
            null
          )}
        </div>
      </div>
    </nav>
  );
}

function Hero({ bridgeStatus, bridgeState, featuredPreferences, bridgeError }) {
  return (
    <header className="rounded-[2rem] border border-white/20 bg-black/20 px-6 py-6 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
          <div className="max-w-none">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 shadow-lg">
                <p className="text-2xl font-black uppercase tracking-[0.45em] text-white sm:text-3xl">
                  Rebel Remind
                </p>
              </div>
              <div className="hidden h-px flex-1 bg-white/20 sm:block" />
            </div>
            <h1 className="w-full max-w-none font-serif text-2xl font-semibold leading-tight sm:text-3xl xl:text-4xl">
              A student-built Chrome Extension designed to centralize assignment reminders, club events, and general
              campus events, all in one place.
            </h1>
            <div className="mt-5 grid gap-3 text-sm text-white/88 sm:text-base">
              <p>🥇 Winner of UNLV's Spring 2025 CS Senior Design Competition</p>
              <p>🔖 Events and Assignments from Canvas, Involvement Center, and more</p>
              <p>📅 Google Calendar Integration</p>
              <p>💡 Lightweight, privacy-friendly, open source</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
          <ConnectedPulse active={bridgeStatus === "connected"} />
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
            {bridgeStatus === "connected" ? "Bridge Live" : "Bridge Waiting"}
          </span>
        </div>
        <StatusPill
          active={bridgeStatus === "connected"}
          inactiveClassName="border-white/20 bg-white/10 text-white"
        >
          {bridgeStatus === "connected" ? "Extension Connected" : "Bridge Not Detected"}
        </StatusPill>
        <StatusPill
          active={Boolean(bridgeState?.user)}
          inactiveClassName="border-white/20 bg-white/10 text-white"
        >
          {bridgeState?.user ? `Signed In: ${bridgeState.user.name}` : "No Synced Extension Data"}
        </StatusPill>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.75rem] border border-white/20 bg-stone-950/25 p-6 shadow-xl backdrop-blur-md">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Live Sync Snapshot</p>
          {bridgeState?.user ? (
            <div className="mt-4 flex items-center gap-4 rounded-[1.5rem] border border-white/15 bg-white/10 p-4">
              <img
                src={bridgeState.user.picture}
                alt={bridgeState.user.name}
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white/30"
              />
              <div>
                <p className="text-lg font-semibold">{bridgeState.user.name}</p>
                <p className="text-sm text-white/75">{bridgeState.user.email}</p>
              </div>
            </div>
          ) : null}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/12 p-4">
              <p className="text-sm text-white/70">Saved Preferences</p>
              <p className="mt-2 text-3xl font-semibold">{featuredPreferences.length}</p>
            </div>
            <div className="rounded-3xl bg-white/12 p-4">
              <p className="text-sm text-white/70">Custom Events</p>
              <p className="mt-2 text-3xl font-semibold">{bridgeState?.userEventCount || 0}</p>
            </div>
            <div className="rounded-3xl bg-white/12 p-4">
              <p className="text-sm text-white/70">Canvas Assignments</p>
              <p className="mt-2 text-3xl font-semibold">{bridgeState?.upcomingAssignmentCount || 0}</p>
            </div>
          </div>
          {bridgeError ? <p className="mt-4 text-sm text-rose-100/90">{bridgeError}</p> : null}

          <div className="mt-6 rounded-[1.5rem] border border-white/15 bg-white/10 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Enabled Areas</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {featuredPreferences.length ? (
                featuredPreferences.map((item) => <StatusPill key={item} active>{item}</StatusPill>)
              ) : (
                <p className="text-sm text-white/75">
                  No synced extension preferences yet. Install the extension and open this page in Chrome to pull
                  them in.
                </p>
              )}
            </div>
          </div>
        </div>

        <aside className="rounded-[1.75rem] border border-black/10 bg-stone-100/90 p-6 text-stone-900 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">Upcoming Assignments</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight">Canvas Assignments Due Soon</h2>
          <div className="mt-5 max-h-[24rem] space-y-3 overflow-y-auto pr-1">
            {bridgeStatus === "connected" && bridgeState?.upcomingAssignments?.length ? (
              bridgeState.upcomingAssignments.map((assignment) => (
                <a
                  key={assignment.id}
                  href={assignment.link || undefined}
                  target={assignment.link ? "_blank" : undefined}
                  rel={assignment.link ? "noreferrer" : undefined}
                  className="block rounded-[1.25rem] border border-stone-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="font-semibold text-stone-900">{assignment.title}</p>
                  {assignment.courseName ? (
                    <p className="mt-1 text-sm text-stone-600">{assignment.courseName}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-stone-700">{formatAssignmentDate(assignment.dueAt)}</p>
                </a>
              ))
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-stone-300 bg-white/70 px-4 py-6 text-sm text-stone-600">
                {bridgeStatus === "connected"
                  ? "No upcoming Canvas assignments are available right now."
                  : "Sync not available. Turn on the extension to preview upcoming assignments here."}
              </div>
            )}
          </div>
        </aside>
      </div>
    </header>
  );
}

function HomePage({ bridgeStatus, bridgeState, bridgeError, datasets }) {
  const featuredPreferences = toTitleList(bridgeState?.preferences);
  const upcomingEvents = DATA_FILES.flatMap(({ key }) => {
    const items = Array.isArray(datasets[key]) ? datasets[key] : [];
    const now = Date.now();

    return items
      .filter((item) => getEventTimestamp(item) >= now)
      .sort((left, right) => getEventTimestamp(left) - getEventTimestamp(right))
      .slice(0, 2)
      .map((item) => ({ ...item, sourceKey: key }));
  }).sort((left, right) => getEventTimestamp(left) - getEventTimestamp(right));
  const syncedUserEvents = [
    ...((bridgeState?.involvementCenterEvents || []).map((event) => ({
      ...event,
      sourceType: "involvementCenter",
      displayTitle: event.name,
      displayLocation: event.location,
      displayDescription: event.organization ? `RSO: ${event.organization}` : "",
    }))),
    ...((bridgeState?.userEvents || []).map((event) => ({
      ...event,
      sourceType: "userEvent",
      displayTitle: event.title,
      displayLocation: event.location,
      displayDescription: event.desc || "",
    }))),
  ].sort((left, right) => {
    const leftTime = left.sourceType === "involvementCenter"
      ? getEventTimestamp({ startDate: left.startDate, startTime: left.startTime })
      : new Date(`${left.startDate}T${left.startTime || "00:00"}`).getTime();
    const rightTime = right.sourceType === "involvementCenter"
      ? getEventTimestamp({ startDate: right.startDate, startTime: right.startTime })
      : new Date(`${right.startDate}T${right.startTime || "00:00"}`).getTime();
    return leftTime - rightTime;
  });

  return (
    <>
      <Hero
        bridgeStatus={bridgeStatus}
        bridgeState={bridgeState}
        featuredPreferences={featuredPreferences}
        bridgeError={bridgeError}
      />

      {bridgeStatus === "connected" ? (
        <section className="rounded-[2rem] border border-white/20 bg-black/20 p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Your Events</p>
              <h2 className="mt-2 font-serif text-3xl leading-tight text-white">Your upcoming custom events.</h2>
            </div>
            <div className="rounded-[1.5rem] border border-white/15 bg-white/10 px-5 py-4 text-white">
              <p className="text-sm uppercase tracking-[0.2em] text-white/65">Upcoming Custom Events</p>
              <p className="mt-2 text-4xl font-semibold">{syncedUserEvents.length}</p>
            </div>
          </div>
          <div className="mt-5 max-h-[21rem] space-y-3 overflow-y-auto pr-1">
            {syncedUserEvents.length ? (
              syncedUserEvents.map((event, index) => (
                <article
                  key={`${event.displayTitle}-${event.startDate}-${index}`}
                  className="rounded-[1.25rem] border border-white/15 bg-white/10 px-4 py-4 text-white shadow-sm"
                >
                  <p className="font-semibold">{event.displayTitle}</p>
                  <p className="mt-1 text-sm text-white/75">{formatCombinedHomeEventDate(event)}</p>
                  {event.displayLocation ? <p className="mt-1 text-sm text-white/70">{event.displayLocation}</p> : null}
                  {event.displayDescription ? <p className="mt-2 text-sm text-white/70">{event.displayDescription}</p> : null}
                </article>
              ))
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-white/20 bg-white/5 px-4 py-6 text-sm text-white/75">
                No upcoming custom events are synced right now.
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section id="campus-feed" className="grid scroll-mt-28 gap-4 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/20 bg-black/20 p-6 shadow-xl backdrop-blur-md">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Campus Feed</p>
          <div className="mt-5 space-y-3">
            {upcomingEvents.length ? (
              upcomingEvents.map((item, index) => (
                <a
                  key={`${item.name}-${index}`}
                  href={item.link || undefined}
                  target={item.link ? "_blank" : undefined}
                  rel={item.link ? "noreferrer" : undefined}
                  className="block rounded-[1.5rem] border border-white/15 bg-white/8 px-4 py-4 transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="text-lg font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm text-white/75">{formatEventDate(item)}</p>
                  {item.location ? <p className="mt-1 text-sm text-white/70">{item.location}</p> : null}
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                    {getEventSourceLabel(item.sourceKey)}
                  </p>
                </a>
              ))
            ) : (
              <p className="text-white/80">Loading campus data from GitHub Pages JSON...</p>
            )}
          </div>
        </div>

        <div id="dataset-grid" className="grid scroll-mt-28 gap-4">
          {DATA_FILES.map((source) => (
            <Link
              key={source.key}
              to={getDatasetRoute(source.key)}
              className="group rounded-[2rem] border border-black/10 bg-stone-100/90 p-6 text-stone-900 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-white"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">Dataset Explorer</p>
                  <h3 className="mt-1 text-2xl font-semibold">{source.label}</h3>
                  <p className="mt-2 text-sm text-stone-600">Open the full page for this feed.</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                    {datasets[source.key]?.length || 0} loaded
                  </span>
                  <p className="mt-3 text-sm font-semibold text-stone-700 transition-transform duration-300 group-hover:translate-x-1">
                    View page →
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function DatasetPage({ datasets, bridgeStatus, bridgeState }) {
  const { datasetKey } = useParams();
  const dataset = DATA_FILES.find((item) => item.key === datasetKey);
  const allItems = dataset
    ? (datasets[dataset.key] || []).filter(isUpcomingEvent).sort((left, right) => getEventTimestamp(left) - getEventTimestamp(right))
    : [];
  const isUNLVCalendar = dataset?.key === "unlvCalendar";
  const isInvolvementCenter = dataset?.key === "involvementCenter";
  const isRebelSports = dataset?.key === "rebelCoverage";
  const supportsFilters = isUNLVCalendar || isInvolvementCenter || isRebelSports;
  const hasSync = bridgeStatus === "connected";
  const [useSyncedPreferences, setUseSyncedPreferences] = useState(true);
  const [manualFilters, setManualFilters] = useState([]);
  const [filterSearch, setFilterSearch] = useState("");
  const [organizationDirectory, setOrganizationDirectory] = useState([]);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);

  useEffect(() => {
    setUseSyncedPreferences(true);
    setManualFilters([]);
    setFilterSearch("");
  }, [datasetKey]);

  useEffect(() => {
    if (!isInvolvementCenter) {
      return undefined;
    }

    let cancelled = false;
    fetch("/data/organization_list.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load organization list");
        }
        return response.json();
      })
      .then((payload) => {
        if (!cancelled) {
          const names = payload
            .map((item) => item?.name)
            .filter(Boolean)
            .sort((left, right) => left.localeCompare(right));
          setOrganizationDirectory(names);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [isInvolvementCenter]);

  const availableFilters = supportsFilters
    ? (isUNLVCalendar
      ? ALL_INTERESTS
      : isRebelSports
        ? ALL_SPORTS
        : isInvolvementCenter && organizationDirectory.length
          ? organizationDirectory
          : Array.from(
            new Set(
              allItems
                .map((item) => (isUNLVCalendar ? item.category : isInvolvementCenter ? item.organization : item.sport))
                .filter(Boolean)
            )
          ).sort((left, right) => left.localeCompare(right)))
    : [];

  const syncedFilters = isUNLVCalendar
    ? bridgeState?.selectedInterests || []
    : isInvolvementCenter
      ? bridgeState?.involvedClubs || []
      : isRebelSports
        ? bridgeState?.selectedSports || []
        : [];

  const activeFilters =
    supportsFilters && hasSync && useSyncedPreferences ? syncedFilters : manualFilters;

  const toggleManualFilter = (filter) => {
    setManualFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter]
    );
  };

  const visibleManualFilters = isInvolvementCenter
    ? availableFilters
      .filter((filter) => !manualFilters.includes(filter))
      .filter((filter) =>
        filter.toLowerCase().includes(filterSearch.trim().toLowerCase())
      )
      .slice(0, 8)
    : availableFilters;

  const items = supportsFilters && activeFilters.length
    ? allItems.filter((item) => {
      const field = isUNLVCalendar ? item.category : isInvolvementCenter ? item.organization : item.sport;
      return activeFilters.includes(field);
    })
    : allItems;

  if (!dataset) {
    return (
      <section className="rounded-[2rem] border border-white/20 bg-black/20 p-8 text-white shadow-xl backdrop-blur-md">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">Not Found</p>
        <h1 className="mt-3 font-serif text-4xl">That dataset page does not exist.</h1>
        <Link to="/" className="mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
          Back Home
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/20 bg-black/20 p-6 text-white shadow-xl backdrop-blur-md">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Dataset Explorer</p>
          <h1 className="mt-2 font-serif text-4xl">{dataset.label}</h1>
          <p className="mt-2 text-white/80">Browse the live JSON feed published to GitHub Pages.</p>
        </div>
        <Link to="/" className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20">
          Back Home
        </Link>
      </div>

      {supportsFilters ? (
        <section className="rounded-[2rem] border border-[#7f0d0d]/35 bg-[linear-gradient(135deg,rgba(139,0,0,0.26),rgba(255,232,236,0.94))] p-6 text-stone-900 shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white">Filters</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  {isUNLVCalendar ? "Browse by interest" : isInvolvementCenter ? "Browse by organization" : "Browse by sport"}
                </h2>
              </div>
              {hasSync ? (
                <label className="inline-flex items-center gap-3 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={useSyncedPreferences}
                    onChange={(event) => setUseSyncedPreferences(event.target.checked)}
                  />
                  Use Synced Preferences
                </label>
              ) : null}
            </div>

            {hasSync && useSyncedPreferences ? (
              <div className="rounded-[1.5rem] border border-white/75 bg-white/78 p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Synced Filters
                </p>
                <div className="flex flex-wrap gap-2">
                  {syncedFilters.length ? (
                    syncedFilters.map((filter) => (
                      <span
                        key={filter}
                        className="rounded-full border border-stone-900 bg-stone-900 px-3 py-1 text-sm font-semibold text-white"
                      >
                        {filter}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-stone-600">
                      No synced {isUNLVCalendar ? "interests" : isInvolvementCenter ? "organizations" : "sports"} found, so all events are shown.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-white/75 bg-white/78 p-4 shadow-sm">
                <div className="flex flex-col gap-4">
                  {isInvolvementCenter ? (
                    <SearchInput
                      value={filterSearch}
                      onChange={setFilterSearch}
                      placeholder="Search RSOs and organizations"
                    />
                  ) : null}
                  {isRebelSports ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-[1rem] border border-stone-200 bg-white/85 p-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Men's Sports</p>
                        <div className="flex flex-wrap gap-2">
                          {availableFilters
                            .filter((sport) => !sport.startsWith("Women's"))
                            .map((sport) => (
                              <FilterChip
                                key={sport}
                                active={manualFilters.includes(sport)}
                                onClick={() => toggleManualFilter(sport)}
                              >
                                {sport}
                              </FilterChip>
                            ))}
                        </div>
                      </div>
                      <div className="rounded-[1rem] border border-stone-200 bg-white/85 p-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Women's Sports</p>
                        <div className="flex flex-wrap gap-2">
                          {availableFilters
                            .filter((sport) => sport.startsWith("Women's"))
                            .map((sport) => (
                              <FilterChip
                                key={sport}
                                active={manualFilters.includes(sport)}
                                onClick={() => toggleManualFilter(sport)}
                              >
                                {sport}
                              </FilterChip>
                            ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {manualFilters.length ? (
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Selected {isInvolvementCenter ? "Organizations" : isRebelSports ? "Sports" : "Filters"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {manualFilters.map((filter) => (
                          <SelectedFilterPill
                            key={filter}
                            label={filter}
                            onRemove={() =>
                              setManualFilters((current) => current.filter((item) => item !== filter))
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {!isRebelSports ? (
                    <div className="flex flex-wrap gap-2">
                      {visibleManualFilters.map((filter) => (
                        <FilterChip
                          key={filter}
                          active={manualFilters.includes(filter)}
                          onClick={() => toggleManualFilter(filter)}
                        >
                          {filter}
                        </FilterChip>
                      ))}
                      {!visibleManualFilters.length ? (
                        <p className="text-sm text-stone-600">No organizations match your search.</p>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                    <button
                      type="button"
                      onClick={() => setIsViewAllModalOpen(true)}
                      className="text-stone-700 transition hover:text-stone-950"
                    >
                      View All
                    </button>
                    {manualFilters.length ? (
                      <button
                        type="button"
                        onClick={() => setManualFilters([])}
                        className="text-[#8b0000] transition hover:text-[#5f0000]"
                      >
                        Clear All
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {supportsFilters ? (
        <ViewAllFiltersModal
          open={isViewAllModalOpen}
          onClose={() => setIsViewAllModalOpen(false)}
          title={isUNLVCalendar ? "All Interest Filters" : isInvolvementCenter ? "All Organization Filters" : "All Sport Filters"}
          options={availableFilters}
          selectedValues={manualFilters}
          onToggle={toggleManualFilter}
          onClearAll={() => setManualFilters([])}
        />
      ) : null}

      <div className={dataset.key === "academicCalendar" ? "grid gap-4" : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"}>
        {items.length ? (
          items.map((item, index) => (
            <a
              key={`${dataset.key}-${item.name}-${index}`}
              href={item.link || undefined}
              target={item.link ? "_blank" : undefined}
              rel={item.link ? "noreferrer" : undefined}
              className={[
                "flex flex-col rounded-[1.5rem] border border-black/10 bg-stone-100/90 p-5 text-stone-900 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl",
                dataset.key === "academicCalendar" ? "" : "min-h-[16rem]",
              ].join(" ")}
            >
              <div className="grid h-full grid-cols-[minmax(0,1fr)_auto] gap-4">
                <div className="flex h-full min-h-0 min-w-0 flex-col justify-between">
                  <div>
                    <h2 className={`${getTitleSizeClass(item.name)} font-semibold leading-tight`}>{item.name}</h2>
                    {dataset.key === "academicCalendar" && item.startDate ? (
                      <p className="mt-2 text-sm font-medium text-stone-500">{item.startDate}</p>
                    ) : null}
                  </div>
                  <div className="pt-6">
                    <p className="text-base text-stone-700 sm:text-lg">
                      <span className="font-bold">
                        {formatEventDate(item)}
                      </span>
                    </p>
                    {item.location ? (
                      <p className="mt-1 text-sm text-stone-700">
                        <span className="font-semibold">Location:</span> {item.location}
                      </p>
                    ) : null}
                    {item.organization ? (
                      <p className="mt-1 text-sm text-stone-700">
                        <span className="font-semibold">RSO:</span> {item.organization}
                      </p>
                    ) : null}
                    {item.sport ? (
                      <p className="mt-1 text-sm text-stone-700">
                        <span className="font-semibold">Sport:</span> {item.sport}
                      </p>
                    ) : null}
                    {item.category ? (
                      <p className="mt-1 text-sm text-stone-700">
                        <span className="font-semibold">Category:</span> {item.category}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 self-start">
                  {dataset.key === "academicCalendar" ? (
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Date</p>
                      <p className="mt-1 text-3xl font-black text-stone-900 sm:text-4xl">
                        {formatAcademicCalendarBadge(item)}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </a>
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-white/20 bg-black/20 p-6 text-white shadow-xl backdrop-blur-md">
            No events match the current filters.
          </div>
        )}
      </div>
    </section>
  );
}

function DevelopersPage() {
  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-white/20 bg-black/20 p-6 text-white shadow-xl backdrop-blur-md">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Contributors Page</p>
        <h1 className="mt-2 font-serif text-4xl">Built by students, for students.</h1>
        <p className="mt-4 max-w-3xl text-white/80">
          Rebel Remind was designed and built as a UNLV senior design project. This page highlights the contributors
          behind the project and the areas each person helped shape.
        </p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/UNLV-CS472-672/2025-S-GROUP3-RebelRemind"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-stone-200"
            >
              Chrome Extension Repo
            </a>
            <a
              href="https://github.com/RebelRemind/RebelRemind.github.io"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              GitHub Pages Repo
            </a>
          </div>
          <Link
            to="/"
            className="self-start rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 sm:self-auto"
          >
            Back Home
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CONTRIBUTORS.map((contributor, index) => (
          <a
            key={contributor.name}
            href={contributor.linkedin}
            target="_blank"
            rel="noreferrer"
            className={`flex min-h-[16rem] flex-col items-center rounded-[1.75rem] border border-white/20 bg-black/20 p-5 text-center text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-black/25 hover:shadow-2xl backdrop-blur-md ${
              index === CONTRIBUTORS.length - 1 && CONTRIBUTORS.length % 3 === 1 ? "xl:col-start-2" : ""
            }`}
          >
            <img
              src={contributor.image}
              alt={contributor.name}
              className="h-[7.5rem] w-[7.5rem] rounded-3xl border border-white/15 bg-white/10 object-cover p-1"
            />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Contributor</p>
            <h2 className="mt-1 text-2xl font-semibold leading-tight">{contributor.name}</h2>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">{contributor.role}</p>
            <div className="mt-5 flex-1 w-full rounded-[1.25rem] border border-white/10 bg-white/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Contribution</p>
              <p className="mt-2 text-sm leading-6 text-white/85">{contributor.contribution}</p>
            </div>
            <p className="mt-4 text-sm font-semibold text-white/80">Open LinkedIn →</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function BridgeInfoModal({ open, onClose }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl rounded-[2rem] border border-white/20 bg-stone-100/95 p-6 text-stone-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bridge-info-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">Bridge Model</p>
            <h2 id="bridge-info-title" className="mt-2 font-serif text-3xl leading-tight">
              The website only receives safe, intentional data.
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-stone-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            Close
          </button>
        </div>

        <ol className="mt-5 space-y-3 text-sm leading-6 text-stone-700">
          <li>1. The page pings the extension through `window.postMessage`.</li>
          <li>2. A content script validates the origin and forwards the request.</li>
          <li>3. The service worker filters a minimal payload from `chrome.storage`.</li>
          <li>4. The site updates live when those approved values change.</li>
        </ol>

        <div className="mt-5 rounded-[1.5rem] border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700">
          Sensitive values stay in the extension. The site never receives your Canvas PAT or OAuth tokens.
        </div>
      </div>
    </div>
  );
}

function DownloadModal({ open, onClose }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-xl rounded-[2rem] border border-white/20 bg-stone-100/95 p-6 text-stone-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">Download</p>
            <h2 id="download-modal-title" className="mt-2 font-serif text-3xl leading-tight">
              Download RebelRemind
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-stone-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            Close
          </button>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700">
          The downloadable extension package will live here soon. We can drop the final `.zip` or install package
          into this modal once you are ready to publish it.
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white opacity-60"
            disabled
          >
            Download Coming Soon
          </button>
          <a
            href="https://github.com/UNLV-CS472-672/2025-S-GROUP3-RebelRemind"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-stone-100"
          >
            View Source
          </a>
        </div>
      </div>
    </div>
  );
}

function Footer({ onOpenBridgeInfo }) {
  return (
    <footer className="rounded-[2rem] border border-white/20 bg-black/20 px-6 py-5 text-white/80 shadow-xl backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">Rebel Remind, student-built at UNLV.</p>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <a
            href="https://github.com/RebelRemind/RebelRemind.github.io"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-white"
          >
            GitHub Pages Repo
          </a>
          <button
            type="button"
            onClick={onOpenBridgeInfo}
            className="transition hover:text-white"
          >
            Bridge Model
          </button>
          <Link to="/contributors" className="transition hover:text-white">
            Contributors
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [bridgeStatus, setBridgeStatus] = useState("checking");
  const [bridgeState, setBridgeState] = useState(null);
  const [datasets, setDatasets] = useState({});
  const [bridgeError, setBridgeError] = useState("");
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(false);
  const theme = bridgeState?.theme || DEFAULT_THEME;

  useEffect(() => {
    window.__openRebelDownloadModal = () => setIsDownloadModalOpen(true);
    return () => {
      delete window.__openRebelDownloadModal;
    };
  }, []);

  useEffect(() => {
    function handleScroll() {
      setShowNavbar(window.scrollY > 120);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let seenPong = false;
    let seenState = false;

    const unsubscribe = subscribeToBridge((type, payload) => {
      if (type === bridgeTypes.pong) {
        seenPong = true;
        setBridgeStatus("connected");
        return;
      }

      if (type === bridgeTypes.response || type === bridgeTypes.storageUpdate) {
        seenState = true;
        setBridgeStatus("connected");
        setBridgeError("");
        console.log("Rebel Remind bridge payload:", payload);
        setBridgeState(payload);
        return;
      }

      if (type === bridgeTypes.error) {
        setBridgeStatus("unavailable");
        setBridgeError(payload?.message || "Bridge request failed");
      }
    });

    pingExtension();
    requestExtensionState();

    const timeoutId = window.setTimeout(() => {
      if (!seenPong && !seenState) {
        setBridgeStatus("unavailable");
        setBridgeState(null);
        setBridgeError("");
      }
    }, 1500);

    return () => {
      unsubscribe();
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    DATA_FILES.forEach(async ({ key, path }) => {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to load ${path}`);
        }

        const payload = await response.json();
        setDatasets((current) => ({ ...current, [key]: payload }));
      } catch (error) {
        console.error(error);
      }
    });
  }, []);

  return (
    <main
      className="min-h-screen text-white"
      style={{ background: buildBackground(theme.backgroundColor), color: theme.textColor }}
    >
      <Navbar visible={showNavbar} />
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  bridgeStatus={bridgeStatus}
                  bridgeState={bridgeState}
                  bridgeError={bridgeError}
                  datasets={datasets}
                />
              }
            />
            <Route
              path="/datasets/:datasetKey"
              element={<DatasetPage datasets={datasets} bridgeStatus={bridgeStatus} bridgeState={bridgeState} />}
            />
            <Route path="/contributors" element={<DevelopersPage />} />
          </Routes>
        </div>
        <Footer onOpenBridgeInfo={() => setIsBridgeModalOpen(true)} />
      </div>
      <BridgeInfoModal open={isBridgeModalOpen} onClose={() => setIsBridgeModalOpen(false)} />
      <DownloadModal open={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} />
    </main>
  );
}
