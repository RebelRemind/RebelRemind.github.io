import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, Route, Routes, useLocation, useParams } from "react-router-dom";
import StatusPill from "./components/StatusPill";
import { bridgeTypes, pingExtension, requestExtensionState, subscribeToBridge } from "./lib/bridge";

const DATA_FILES = [
  {
    key: "academicCalendar",
    label: "Academic Calendar",
    path: "/data/academiccalendar_list.json",
    sourceUrl: "https://www.unlv.edu/students/academic-calendar",
  },
  {
    key: "unlvCalendar",
    label: "UNLV Calendar",
    path: "/data/unlvcalendar_list.json",
    sourceUrl: "https://www.unlv.edu/calendar",
  },
  {
    key: "involvementCenter",
    label: "Involvement Center",
    path: "/data/involvementcenter_list.json",
    sourceUrl: "https://involvementcenter.unlv.edu/events",
  },
  {
    key: "rebelCoverage",
    label: "Rebel Sports",
    path: "/data/rebelcoverage_list.json",
    sourceUrl: "https://unlvrebels.com/coverage",
  },
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

function buildDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseCalendarEventDate(startDate, startTime, allDay = false) {
  if (!startDate) {
    return null;
  }

  if (allDay || !startTime || startTime === "(ALL DAY)") {
    const parsed = new Date(`${startDate}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(`${startDate} ${startTime}`);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const fallback = new Date(`${startDate}T${startTime}`);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function buildDefaultEventEndTime(startDate, startTime, allDay = false) {
  if (allDay || !startDate || !startTime || startTime === "(ALL DAY)") {
    return allDay ? "(ALL DAY)" : "";
  }

  const parsedStart = parseCalendarEventDate(startDate, startTime, false);
  if (!parsedStart) {
    return startTime;
  }

  const endDate = new Date(parsedStart.getTime() + (60 * 60 * 1000));
  return endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function parseCalendarEventEndDate(endDate, endTime, startDate, startTime, allDay = false) {
  const resolvedEndTime = endTime || buildDefaultEventEndTime(startDate, startTime, allDay);
  const parsed = parseCalendarEventDate(endDate || startDate, resolvedEndTime || startTime, allDay);
  if (!parsed) {
    return null;
  }

  if (allDay) {
    const endValue = new Date(parsed);
    endValue.setHours(23, 59, 59, 999);
    return endValue;
  }

  return parsed;
}

function formatCalendarHeaderMonth(date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function formatCalendarPanelDate(dateKey) {
  const parsed = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return dateKey;
  }

  return parsed.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getCalendarViewDateLabel(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatCalendarDateOnly(dateKey) {
  const parsed = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return dateKey;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getTableDayLabel(dateKey) {
  const parsed = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { label: dateKey, emphasize: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const value = new Date(parsed);
  value.setHours(0, 0, 0, 0);

  if (value.getTime() === today.getTime()) {
    return { label: "Today", emphasize: true };
  }

  if (value.getTime() === tomorrow.getTime()) {
    return { label: "Tomorrow", emphasize: true };
  }

  return {
    label: parsed.toLocaleDateString(undefined, { weekday: "long" }),
    emphasize: false,
  };
}

const CALENDAR_SESSION_KEY = "rebelremind-calendar-session";

function readCalendarSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CALENDAR_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatCalendarTimeRange(event) {
  if (!event || event.allDay || event.startTime === "(ALL DAY)") {
    return "All day";
  }

  const start = event.startTime || "";
  const end = event.endTime || "";
  if (start && end && start !== end) {
    return `${start} - ${end}`;
  }

  return start || "Time TBD";
}

function isWeeklyAllDayEvent(event) {
  return Boolean(
    event?.allDay ||
    !event?.startTime ||
    event.startTime === "(ALL DAY)" ||
    event.startTime === "Time TBD" ||
    event.startTime === "TBD"
  );
}

function isCanvasAssignmentEvent(event) {
  return event?.eventType === "canvasAssignment";
}

function startOfWeek(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - value.getDay());
  return value;
}

function endOfWeek(date) {
  const value = startOfWeek(date);
  value.setDate(value.getDate() + 6);
  value.setHours(23, 59, 59, 999);
  return value;
}

function buildEventsByDate(events) {
  return events.reduce((result, event) => {
    if (!event.startDate) {
      return result;
    }

    if (!result[event.startDate]) {
      result[event.startDate] = [];
    }

    result[event.startDate].push(event);
    result[event.startDate].sort((left, right) => left.startsAt - right.startsAt);
    return result;
  }, {});
}

function normalizeDatasetCalendarEvents(datasetKey, datasets) {
  const datasetLabel = DATA_FILE_MAP[datasetKey]?.label || "Campus Calendar";
  const sourceItems = Array.isArray(datasets[datasetKey]) ? datasets[datasetKey] : [];

  return sourceItems
    .map((item, index) => {
      const allDay = item.startTime === "(ALL DAY)";
      const resolvedEndTime = item.endTime || buildDefaultEventEndTime(item.startDate, item.startTime, allDay);

      return {
        id: `${datasetKey}-${item.name}-${item.startDate}-${index}`,
        sourceKey: datasetKey,
        title: item.name,
        startDate: item.startDate,
        endDate: item.endDate || item.startDate,
        startTime: item.startTime,
        endTime: resolvedEndTime,
        location: item.location || "",
        description: item.organization || item.category || item.sport || "",
        link: item.link || "",
        sourceLabel: datasetLabel,
        allDay,
        startsAt: parseCalendarEventDate(item.startDate, item.startTime, allDay),
        endsAt: parseCalendarEventEndDate(item.endDate, resolvedEndTime, item.startDate, item.startTime, allDay),
      };
    })
    .filter((event) => event.startsAt)
    .sort((left, right) => left.startsAt - right.startsAt);
}

function normalizeBridgeCalendarEvents(bridgeState) {
  const colorList = bridgeState?.colorList || {};
  const courseColors = colorList?.CanvasCourses || {};

  return (Array.isArray(bridgeState?.calendarEvents) ? bridgeState.calendarEvents : [])
    .map((event, index) => {
      const allDay = Boolean(event.allDay) || event.startTime === "(ALL DAY)";
      const resolvedEndTime = event.endTime || buildDefaultEventEndTime(event.startDate, event.startTime, allDay);

      return {
        id: event.id || `extension-event-${index}`,
        sourceKey: "extensionEvents",
        title: event.title || "Untitled Event",
        startDate: event.startDate,
        endDate: event.endDate || event.startDate,
        startTime: event.startTime,
        endTime: resolvedEndTime,
        location: event.location || "",
        description: event.description || "",
        link: event.link || "",
        sourceLabel: event.sourceLabel || "Extension Event",
        eventType: event.eventType || "",
        courseID: event.courseID || null,
        allDay,
        startsAt: parseCalendarEventDate(event.startDate, event.startTime, allDay),
        endsAt: parseCalendarEventEndDate(
          event.endDate,
          resolvedEndTime,
          event.startDate,
          event.startTime,
          allDay
        ),
        color: event.eventType === "canvasAssignment"
          ? courseColors?.[event.courseID]?.color || "#3174ad"
          : colorList?.[event.eventType] || "",
      };
    })
    .filter((event) => event.startsAt)
    .sort((left, right) => left.startsAt - right.startsAt);
}

function getEventForegroundColor(backgroundColor) {
  if (!backgroundColor || !backgroundColor.startsWith("#") || backgroundColor.length !== 7) {
    return "#ffffff";
  }

  const red = Number.parseInt(backgroundColor.slice(1, 3), 16);
  const green = Number.parseInt(backgroundColor.slice(3, 5), 16);
  const blue = Number.parseInt(backgroundColor.slice(5, 7), 16);

  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return "#ffffff";
  }

  const brightness = ((red * 299) + (green * 587) + (blue * 114)) / 1000;
  return brightness > 125 ? "#111827" : "#ffffff";
}

function layoutTimedWeekEvents(events, weekStart) {
  const weekEnd = endOfWeek(weekStart);
  const timedEvents = events
    .filter((event) => !isWeeklyAllDayEvent(event) && event.startsAt && event.startsAt >= weekStart && event.startsAt <= weekEnd)
    .map((event) => {
      const startsAt = new Date(event.startsAt);
      const endsAt = event.endsAt ? new Date(event.endsAt) : new Date(startsAt.getTime() + (60 * 60 * 1000));
      if (endsAt <= startsAt) {
        endsAt.setTime(startsAt.getTime() + (60 * 60 * 1000));
      }

      return { ...event, startsAt, endsAt };
    })
    .sort((left, right) => left.startsAt - right.startsAt);

  const byDay = {};

  for (const event of timedEvents) {
    const dayKey = buildDateKey(event.startsAt);
    if (!byDay[dayKey]) {
      byDay[dayKey] = [];
    }
    byDay[dayKey].push(event);
  }

  const layouts = {};
  const clusters = {};

  Object.entries(byDay).forEach(([dayKey, dayEvents]) => {
    const assigned = [];
    let cluster = [];
    let clusterEnd = null;

    const finalizeCluster = () => {
      if (!cluster.length) {
        return;
      }

      const clusterId = `${dayKey}-${cluster[0].id}`;
      const laneEnds = [];
      cluster.forEach((event) => {
        let lane = 0;
        while (laneEnds[lane] && laneEnds[lane] > event.startsAt) {
          lane += 1;
        }
        laneEnds[lane] = event.endsAt;
        assigned.push({ ...event, lane });
      });

      const clusterItems = assigned.slice(-cluster.length);
      const laneCount = Math.max(...clusterItems.map((item) => item.lane)) + 1;
      clusters[clusterId] = {
        id: clusterId,
        leadEventId: clusterItems[0].id,
        events: clusterItems,
        count: clusterItems.length,
      };

      assigned.slice(-cluster.length).forEach((item) => {
        layouts[item.id] = {
          lane: item.lane,
          laneCount,
          clusterId,
          clusterSize: clusterItems.length,
          clusterLeadId: clusterItems[0].id,
        };
      });

      cluster = [];
      clusterEnd = null;
    };

    dayEvents.forEach((event) => {
      if (!cluster.length) {
        cluster = [event];
        clusterEnd = event.endsAt;
        return;
      }

      if (event.startsAt < clusterEnd) {
        cluster.push(event);
        if (event.endsAt > clusterEnd) {
          clusterEnd = event.endsAt;
        }
      } else {
        finalizeCluster();
        cluster = [event];
        clusterEnd = event.endsAt;
      }
    });

    finalizeCluster();
  });

  return { events: layouts, clusters };
}

function CalendarEventModal({ payload, onClose }) {
  if (!payload) {
    return null;
  }

  const isGroup = Array.isArray(payload.events);
  const modalTitle = isGroup ? payload.title : payload.title;
  const modalSourceLabel = isGroup ? payload.subtitle : payload.sourceLabel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/15 bg-stone-100 p-6 text-stone-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{modalSourceLabel}</p>
            <h3 className="mt-2 font-serif text-3xl leading-tight">{modalTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-stone-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            Close
          </button>
        </div>

        {isGroup ? (
          <div className="mt-5 max-h-[26rem] space-y-3 overflow-y-auto pr-1">
            {payload.events.map((event) => {
              const Wrapper = event.link ? "a" : "div";
              return (
                <Wrapper
                  key={event.id}
                  href={event.link || undefined}
                  target={event.link ? "_blank" : undefined}
                  rel={event.link ? "noreferrer" : undefined}
                  className="block rounded-[1.35rem] border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{event.sourceLabel}</p>
                  <h4 className="mt-2 text-lg font-semibold leading-tight text-stone-900">{event.title}</h4>
                  <p className="mt-2 text-sm font-semibold text-stone-800">
                    {formatCalendarPanelDate(event.startDate)} · {formatCalendarTimeRange(event)}
                  </p>
                  {event.location ? (
                    <p className="mt-1 text-sm text-stone-700"><span className="font-semibold">Location:</span> {event.location}</p>
                  ) : null}
                  {event.description ? <p className="mt-2 text-sm text-stone-600">{event.description}</p> : null}
                </Wrapper>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 space-y-3 text-sm">
            <p><span className="font-semibold">Date:</span> {formatCalendarPanelDate(payload.startDate)}</p>
            <p><span className="font-semibold">Time:</span> {formatCalendarTimeRange(payload)}</p>
            {payload.location ? <p><span className="font-semibold">Location:</span> {payload.location}</p> : null}
            {payload.description ? <p><span className="font-semibold">Details:</span> {payload.description}</p> : null}
            {payload.link ? (
              <a
                href={payload.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full bg-[#8b0000] px-4 py-2 font-semibold text-white transition hover:bg-[#6b0000]"
              >
                Open Event
              </a>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
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

  if (event.allDay || !event.startTime) {
    return formatEventDate({
      startDate: event.startDate,
      startTime: "(ALL DAY)",
    });
  }

  return formatEventDate({
    startDate: event.startDate,
    startTime: event.startTime,
  });
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

function isBridgeSupportedBrowser() {
  if (typeof navigator === "undefined") {
    return true;
  }

  const brands = navigator.userAgentData?.brands?.map((entry) => entry.brand) || [];
  if (brands.some((brand) => /chrome|chromium|edge/i.test(brand))) {
    return true;
  }

  return /(Chrome|Chromium|Edg)\//.test(navigator.userAgent || "");
}

function Navbar({ visible, onCloseCalendarNavbar }) {
  const location = useLocation();
  const datasetKey = location.pathname.startsWith("/datasets/")
    ? location.pathname.split("/").pop()
    : null;
  const activeDatasetLabel = datasetKey ? DATA_FILE_MAP[datasetKey]?.label : null;
  const isHomePage = location.pathname === "/";
  const isContributorsPage = location.pathname === "/contributors" || location.pathname.startsWith("/contributors/");
  const isCalendarPage = location.pathname === "/calendar" || location.pathname.startsWith("/calendar/");
  const isDatasetsPage = location.pathname === "/datasets" || location.pathname === "/datasets/";
  const pageLabel = isHomePage
    ? "Home"
    : isContributorsPage
      ? "Contributors"
      : isCalendarPage
        ? "Calendar"
        : isDatasetsPage
          ? "Datasets"
          : "Dataset Explorer";
  const showHomeActions = isHomePage;

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <nav
      className={[
        "fixed inset-x-0 top-0 z-40 transition duration-300",
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between rounded-[1.5rem] border border-white/20 bg-black/65 px-4 py-3 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-3 text-left text-white"
          >
            <img src="/rr_logo.png" alt="Rebel Remind logo" className="h-10 w-10 rounded-xl" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Rebel Remind</p>
              <p className="text-sm font-semibold text-white/95">{pageLabel}</p>
            </div>
          </button>

          {activeDatasetLabel ? (
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Dataset</p>
              <p className="text-xl font-black text-white sm:text-2xl">{activeDatasetLabel}</p>
            </div>
          ) : isCalendarPage ? (
            <button
              type="button"
              onClick={onCloseCalendarNavbar}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              aria-label="Close navbar"
            >
              X
            </button>
          ) : showHomeActions ? (
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                to="/calendar"
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Calendar
              </Link>
              <a
                href="/datasets"
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
  const bridgeIsConnected = bridgeStatus === "connected";
  const bridgeIsUnsupported = bridgeStatus === "unsupported";

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
          <ConnectedPulse active={bridgeIsConnected} />
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
            {bridgeIsConnected ? "Bridge Live" : bridgeIsUnsupported ? "Bridge Unavailable" : "Bridge Waiting"}
          </span>
        </div>
        <StatusPill
          active={bridgeIsConnected}
          inactiveClassName="border-white/20 bg-white/10 text-white"
        >
          {bridgeIsConnected ? "Extension Connected" : bridgeIsUnsupported ? "Bridge Not Available" : "Bridge Not Detected"}
        </StatusPill>
        <StatusPill
          active={Boolean(bridgeState?.user)}
          inactiveClassName="border-white/20 bg-white/10 text-white"
        >
          {bridgeState?.user ? `Signed In: ${bridgeState.user.name}` : bridgeIsUnsupported ? "Chrome Browser Required" : "No Synced Extension Data"}
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
                  {bridgeIsUnsupported
                    ? "Bridge sync is only available in Chrome-compatible browsers with the Rebel Remind extension installed."
                    : "No synced extension preferences yet. Install the extension and open this page in Chrome to pull them in."}
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
                  : bridgeIsUnsupported
                    ? "Bridge sync is not available in this browser."
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
  const [collapsedEvents, setCollapsedEvents] = useState({});
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

  const toggleCollapsedEvent = (eventKey) => {
    setCollapsedEvents((current) => ({
      ...current,
      [eventKey]: !current[eventKey],
    }));
  };

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
              syncedUserEvents.map((event, index) => {
                const eventKey = `${event.displayTitle}-${event.startDate}-${index}`;
                const isCollapsed = Boolean(collapsedEvents[eventKey]);
                const hasExtraDetails = Boolean(event.displayLocation || event.displayDescription);

                return (
                  <article
                    key={eventKey}
                    className="rounded-[1.25rem] border border-white/15 bg-white/10 px-4 py-4 text-white shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-semibold">{event.displayTitle}</p>
                      {hasExtraDetails ? (
                        <button
                          type="button"
                          onClick={() => toggleCollapsedEvent(eventKey)}
                          className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:text-white"
                        >
                          {isCollapsed ? "Show Details" : "Hide Details"}
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-white/85">{formatCombinedHomeEventDate(event)}</p>
                    {!isCollapsed && hasExtraDetails ? (
                      <>
                        {event.displayLocation ? <p className="mt-1 text-sm text-white/70">{event.displayLocation}</p> : null}
                        {event.displayDescription ? <p className="mt-2 text-sm text-white/70">{event.displayDescription}</p> : null}
                      </>
                    ) : null}
                  </article>
                );
              })
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
                  <span className="inline-flex max-w-[5.5rem] flex-col items-center rounded-2xl bg-stone-900 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] leading-tight text-white sm:max-w-none sm:flex-row sm:gap-1 sm:rounded-full sm:px-3 sm:py-1 sm:text-xs">
                    <span>{datasets[source.key]?.length || 0}</span>
                    <span>loaded</span>
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

function DatasetsLandingPage({ datasets }) {
  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-white/20 bg-black/20 p-6 text-white shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Datasets</p>
            <h1 className="mt-2 font-serif text-4xl">How Rebel Remind powers the public campus feed.</h1>
            <div className="mt-4 w-full space-y-2 text-white/80">
              <p>Rebel Remind collects public UNLV event sources, normalizes them into a consistent JSON format, and publishes them for the site and extension to consume.</p>
              <p>The website uses these datasets for its public calendar views, while the extension combines them with your personal Rebel Remind events.</p>
              <p>Below you can open each dataset, inspect the hosted JSON, and see the original source each feed comes from.</p>
            </div>
          </div>
          <div className="flex justify-start lg:justify-end">
            <Link
              to="/"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Back Home
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {DATA_FILES.map((source) => (
          <article
            key={source.key}
            className="rounded-[1.75rem] border border-black/10 bg-stone-100/90 p-6 text-stone-900 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">Dataset</p>
                <h2 className="mt-1 text-2xl font-semibold">{source.label}</h2>
              </div>
              <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                {datasets[source.key]?.length || 0} items
              </span>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="font-semibold text-stone-700">Hosted JSON</p>
                <a
                  href={source.path}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all text-[#8b0000] transition hover:text-[#6b0000]"
                >
                  {typeof window !== "undefined" ? `${window.location.origin}${source.path}` : source.path}
                </a>
              </div>

              <div>
                <p className="font-semibold text-stone-700">Source URL</p>
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all text-[#8b0000] transition hover:text-[#6b0000]"
                >
                  {source.sourceUrl}
                </a>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={getDatasetRoute(source.key)}
                className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
              >
                Open Dataset Page
              </Link>
              <a
                href={source.path}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
              >
                View JSON
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CalendarPage({ datasets, bridgeState, bridgeStatus }) {
  const today = new Date();
  const initialSession = readCalendarSession();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const savedMonth = initialSession?.currentMonth;
    const parsed = savedMonth ? new Date(savedMonth) : null;
    return parsed && !Number.isNaN(parsed.getTime())
      ? new Date(parsed.getFullYear(), parsed.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => initialSession?.selectedDateKey || buildDateKey(today));
  const [calendarView, setCalendarView] = useState(() => initialSession?.calendarView || "month");
  const [activeModalEvent, setActiveModalEvent] = useState(null);
  const [calendarPanelHeight, setCalendarPanelHeight] = useState(null);
  const calendarPanelRef = useRef(null);
  const weeklyScrollRef = useRef(null);
  const calendarOptions = [
    { key: "extensionEvents", label: "Use Extension Events" },
    ...DATA_FILES.map(({ key, label }) => ({ key, label })),
  ];
  const [selectedCalendarKey, setSelectedCalendarKey] = useState(() => initialSession?.selectedCalendarKey || "extensionEvents");
  const extensionEventsAvailable = bridgeStatus === "connected";

  useEffect(() => {
    if (selectedCalendarKey === "extensionEvents" && !extensionEventsAvailable) {
      setSelectedCalendarKey(DATA_FILES[0].key);
    }
  }, [selectedCalendarKey, extensionEventsAvailable]);

  const visibleCalendarEvents = selectedCalendarKey === "extensionEvents"
    ? normalizeBridgeCalendarEvents(bridgeState)
    : normalizeDatasetCalendarEvents(selectedCalendarKey, datasets);
  const eventsByDate = buildEventsByDate(visibleCalendarEvents);

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));
  const totalCalendarDays = Math.round((gridEnd - gridStart) / (1000 * 60 * 60 * 24)) + 1;
  const monthWeekCount = totalCalendarDays / 7;

  const calendarDays = Array.from({ length: totalCalendarDays }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateKey = buildDateKey(date);
    const dayEvents = (eventsByDate[dateKey] || []).sort((left, right) => left.startsAt - right.startsAt);

    return {
      date,
      dateKey,
      isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
      isToday: dateKey === buildDateKey(today),
      events: dayEvents,
    };
  });

  const selectedDayEvents = (eventsByDate[selectedDateKey] || []).sort((left, right) => left.startsAt - right.startsAt);
  const selectedDate = new Date(`${selectedDateKey}T12:00:00`);
  const selectedWeekStart = startOfWeek(selectedDate);
  const selectedWeekEnd = endOfWeek(selectedDate);
  const todayKey = buildDateKey(today);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(selectedWeekStart);
    date.setDate(selectedWeekStart.getDate() + index);
    const dateKey = buildDateKey(date);

    return {
      date,
      dateKey,
      isToday: dateKey === buildDateKey(today),
      events: (eventsByDate[dateKey] || []).sort((left, right) => left.startsAt - right.startsAt),
    };
  });

  const tableEvents = visibleCalendarEvents.filter((event) => {
    return event.startsAt >= selectedWeekStart && event.startsAt <= selectedWeekEnd;
  });
  const weeklyTimedEvents = visibleCalendarEvents.filter((event) => !isCanvasAssignmentEvent(event));
  const weekLayout = layoutTimedWeekEvents(weeklyTimedEvents, selectedWeekStart);
  const weekHours = Array.from({ length: 16 }, (_, index) => 7 + index);
  const nowInSelectedWeek = today >= selectedWeekStart && today <= selectedWeekEnd;
  const nowMinutes = (today.getHours() * 60) + today.getMinutes();
  const currentTimeTop = ((Math.max(7 * 60, Math.min(nowMinutes, 23 * 60)) - (7 * 60)) / 60) * 80;

  function shiftCalendar(direction) {
    if (calendarView === "weekly" || calendarView === "table") {
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + (direction * 7));
      setSelectedDateKey(buildDateKey(nextDate));
      setCurrentMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
      return;
    }

    setCurrentMonth((current) => {
      const nextMonth = new Date(current.getFullYear(), current.getMonth() + direction, 1);
      return nextMonth;
    });
  }

  function jumpToToday() {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateKey(buildDateKey(today));
  }

  useLayoutEffect(() => {
    if (calendarView !== "month" || !calendarPanelRef.current) {
      return undefined;
    }

    const element = calendarPanelRef.current;
    const syncHeight = () => setCalendarPanelHeight(element.getBoundingClientRect().height);

    const frameId = window.requestAnimationFrame(syncHeight);

    const observer = new ResizeObserver(() => {
      syncHeight();
    });

    observer.observe(element);
    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [calendarView, currentMonth, selectedDateKey, selectedCalendarKey, visibleCalendarEvents.length, monthWeekCount]);

  useEffect(() => {
    if (calendarView !== "weekly" || !weeklyScrollRef.current) {
      return;
    }

    const viewport = weeklyScrollRef.current;
    const savedScrollTop = readCalendarSession()?.weeklyScrollTop;
    if (typeof savedScrollTop === "number") {
      viewport.scrollTop = savedScrollTop;
      return;
    }

    const noonOffset = (12 - 7) * 80;
    const targetScrollTop = Math.max(0, noonOffset - (viewport.clientHeight / 2));
    viewport.scrollTop = targetScrollTop;
  }, [calendarView, selectedDateKey, selectedCalendarKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const session = {
      currentMonth: currentMonth.toISOString(),
      selectedDateKey,
      calendarView,
      selectedCalendarKey,
      weeklyScrollTop: weeklyScrollRef.current?.scrollTop ?? null,
      pageScrollY: window.scrollY,
    };

    window.sessionStorage.setItem(CALENDAR_SESSION_KEY, JSON.stringify(session));
  }, [currentMonth, selectedDateKey, calendarView, selectedCalendarKey]);

  useEffect(() => {
    if (calendarView !== "weekly" || !weeklyScrollRef.current) {
      return undefined;
    }

    const viewport = weeklyScrollRef.current;
    const handleScroll = () => {
      const session = readCalendarSession() || {};
      window.sessionStorage.setItem(
        CALENDAR_SESSION_KEY,
        JSON.stringify({ ...session, weeklyScrollTop: viewport.scrollTop, pageScrollY: window.scrollY })
      );
    };

    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, [calendarView]);

  useEffect(() => {
    const savedPageScrollY = readCalendarSession()?.pageScrollY;
    if (typeof savedPageScrollY !== "number") {
      return;
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: savedPageScrollY, behavior: "auto" });
    });
  }, []);

  useEffect(() => {
    const handleWindowScroll = () => {
      const session = readCalendarSession() || {};
      window.sessionStorage.setItem(
        CALENDAR_SESSION_KEY,
        JSON.stringify({ ...session, pageScrollY: window.scrollY })
      );
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-white/20 bg-black/20 p-6 text-white shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Calendar</p>
            <h1 className="mt-2 font-serif text-4xl">See campus and synced events on one calendar.</h1>
            <p className="mt-3 max-w-3xl text-white/80">
              This view combines our datasets with your synced Rebel Remind events when the extension is connected.
            </p>
          </div>
          <Link
            to="/"
            className="self-start rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Back Home
          </Link>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/20 bg-black/20 p-4 text-white shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">Calendars</span>
            <div className="flex flex-wrap gap-2">
              {calendarOptions.map((option) => (
                (() => {
                  const isDisabled = option.key === "extensionEvents" && !extensionEventsAvailable;

                  return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelectedCalendarKey(option.key)}
                  disabled={isDisabled}
                  aria-disabled={isDisabled}
                  title={isDisabled ? "Extension events are only available when the extension bridge is connected in a supported browser." : undefined}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    selectedCalendarKey === option.key
                      ? "border-white bg-white text-stone-900"
                      : isDisabled
                        ? "cursor-not-allowed border-white/10 bg-white/5 text-white/40"
                        : "border-white/20 bg-white/10 text-white hover:bg-white/20",
                  ].join(" ")}
                >
                  {option.label}
                </button>
                  );
                })()
              ))}
            </div>
          </div>
          <p className="text-sm text-white/70">
            {selectedCalendarKey === "extensionEvents"
              ? "Shows your personalized Rebel Remind events."
              : `Showing only ${DATA_FILE_MAP[selectedCalendarKey]?.label || "selected"} events.`}
          </p>
        </div>
      </div>

      <div className={calendarView === "month" ? "grid min-w-0 gap-5 xl:grid-cols-[1.35fr_0.65fr] xl:items-start" : "grid min-w-0 gap-5"}>
        <section ref={calendarPanelRef} className="min-w-0 rounded-[2rem] border border-white/20 bg-black/20 p-6 text-white shadow-xl backdrop-blur-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
                {calendarView === "weekly" ? "Weekly View" : calendarView === "table" ? "Table View" : "Month View"}
              </p>
              <h2 className="mt-2 font-serif text-3xl">
                {calendarView === "weekly" || calendarView === "table"
                  ? `${getCalendarViewDateLabel(weekDays[0].date)} - ${getCalendarViewDateLabel(weekDays[6].date)}`
                  : formatCalendarHeaderMonth(currentMonth)}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {["month", "weekly", "table"].map((viewKey) => (
                <button
                  key={viewKey}
                  type="button"
                  onClick={() => setCalendarView(viewKey)}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold capitalize transition",
                    calendarView === viewKey
                      ? "border-white bg-white text-stone-900"
                      : "border-white/20 bg-white/10 text-white hover:bg-white/20",
                  ].join(" ")}
                >
                  {viewKey === "month" ? "Monthly" : viewKey === "weekly" ? "Weekly" : "Table"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={jumpToToday}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Jump to Today
            </button>
            <div className="inline-flex overflow-hidden rounded-full border border-white/20 bg-white/10">
              <button
                type="button"
                onClick={() => shiftCalendar(-1)}
                className="px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Previous
              </button>
              <div className="w-px bg-white/15" />
              <button
                type="button"
                onClick={() => shiftCalendar(1)}
                className="px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Next
              </button>
            </div>
          </div>

          {calendarView === "month" ? (
            <>
              <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/60 max-[700px]:text-[10px]">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-2 max-[600px]:gap-1">
                {calendarDays.map((day) => {
                  const isSelected = day.dateKey === selectedDateKey;

                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      onClick={() => setSelectedDateKey(day.dateKey)}
                      className={[
                        "flex min-h-[7rem] flex-col rounded-[1.35rem] border px-2.5 py-2 text-left transition max-[700px]:min-h-[4.9rem] max-[700px]:items-center max-[700px]:px-1.5 max-[700px]:py-1.5 max-[600px]:min-h-[4.4rem] max-[600px]:rounded-[1rem] max-[600px]:px-1 max-[600px]:py-1",
                        isSelected
                          ? "border-white/50 bg-white/20 shadow-lg"
                          : "border-white/15 bg-white/8 hover:bg-white/12",
                        day.isCurrentMonth ? "text-white" : "text-white/45",
                      ].join(" ")}
                    >
                      <div className="flex min-h-[1.4rem] items-start justify-between gap-2 max-[700px]:w-full max-[700px]:min-h-0 max-[700px]:justify-center">
                        <span
                          className={[
                            "text-sm font-semibold max-[600px]:text-xs",
                            day.isToday ? "rounded-full bg-white px-2 py-0.5 text-stone-900" : "",
                          ].join(" ")}
                        >
                          {day.date.getDate()}
                        </span>
                        <span
                          className={[
                            "min-w-[2.1rem] rounded-full px-2 py-1 text-center text-[10px] font-semibold tabular-nums max-[700px]:hidden",
                            day.events.length
                              ? "bg-[#8b0000]/85 text-white"
                              : "border border-white/10 text-transparent",
                          ].join(" ")}
                        >
                          {day.events.length || 0}
                        </span>
                      </div>
                      <div className="mt-2 grid auto-rows-[1.15rem] gap-0.5 max-[700px]:mt-1 max-[700px]:w-full max-[700px]:justify-items-center">
                        <span
                          className={[
                            "hidden min-w-[2.1rem] rounded-full px-2 py-1 text-center text-[10px] font-semibold tabular-nums max-[700px]:inline-flex max-[700px]:items-center max-[700px]:justify-center max-[600px]:min-w-[1.6rem] max-[600px]:px-1.5 max-[600px]:py-0.5 max-[600px]:text-[9px]",
                            day.events.length
                              ? "bg-[#8b0000]/85 text-white"
                              : "border border-white/10 text-transparent",
                          ].join(" ")}
                        >
                          {day.events.length || 0}
                        </span>
                        {day.events.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="truncate rounded-full bg-white/12 px-2 py-0 text-[10px] font-medium leading-[1.15rem] text-white/90 max-[700px]:hidden"
                          >
                            {event.title}
                          </div>
                        ))}
                        {Array.from({ length: Math.max(0, 2 - Math.min(day.events.length, 2)) }).map((_, index) => (
                          <div
                            key={`${day.dateKey}-placeholder-${index}`}
                            className="rounded-full border border-transparent px-2 py-0 text-[10px] leading-[1.15rem] opacity-0 max-[700px]:hidden"
                          >
                            placeholder
                          </div>
                        ))}
                        <div className="pt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] leading-none text-white/55 max-[700px]:hidden">
                          {day.events.length > 2 ? `+${day.events.length - 2} more` : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {calendarView === "table" ? (
            <div
              className="mt-5 min-w-0 overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/8"
              style={{ height: "min(46rem, calc(100vh - 17.5rem))" }}
            >
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[34rem]">
                  <div className="grid grid-cols-[0.8fr_0.95fr_0.95fr_1.3fr_0.95fr_1.1fr] border-b border-white/10 bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/65 max-[700px]:grid-cols-[0.95fr_0.95fr_1.4fr_1fr_1.15fr] max-[700px]:px-3 max-[600px]:grid-cols-[0.95fr_0.95fr_1.5fr_1fr_1.15fr]">
                    <span className="max-[700px]:hidden">Day</span>
                    <span>Date</span>
                    <span>Time</span>
                    <span>Event</span>
                    <span>Source</span>
                    <span>Location</span>
                  </div>
                  <div className="h-[calc(100%-3.125rem)] overflow-y-auto">
                    <div className="divide-y divide-white/10 bg-transparent">
                      {tableEvents.length ? (
                        tableEvents.map((event) => {
                          const dayLabel = getTableDayLabel(event.startDate);

                          return (
                            <button
                              key={event.id}
                              type="button"
                              onClick={() => setActiveModalEvent(event)}
                              className="grid w-full grid-cols-[0.8fr_0.95fr_0.95fr_1.3fr_0.95fr_1.1fr] px-4 py-3 text-left text-sm text-white transition hover:bg-white/10 max-[700px]:grid-cols-[0.95fr_0.95fr_1.4fr_1fr_1.15fr] max-[700px]:px-3 max-[600px]:grid-cols-[0.95fr_0.95fr_1.5fr_1fr_1.15fr]"
                            >
                              <span className={[dayLabel.emphasize ? "font-bold text-white" : "", "max-[700px]:hidden"].join(" ")}>{dayLabel.label}</span>
                              <span>{formatCalendarDateOnly(event.startDate)}</span>
                              <span>{formatCalendarTimeRange(event)}</span>
                              <span className="font-semibold">{event.title}</span>
                              <span>{event.sourceLabel}</span>
                              <span className="truncate text-white/75">{event.location || "TBA"}</span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-6 text-sm text-white/75">No events are available for this range.</div>
                      )}
                      {tableEvents.length > 0 ? <div className="h-0 border-t border-white/10" /> : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {calendarView === "weekly" ? (
            <div
              ref={weeklyScrollRef}
              className="mt-5 min-w-0 max-w-full overflow-x-auto overflow-y-auto rounded-[1.5rem] border border-white/15 bg-white/8"
              style={{ height: "min(46rem, calc(100vh - 17.5rem))" }}
            >
              <div className="min-w-[44rem] max-[600px]:min-w-[760px]">
                <div className="sticky top-0 z-30 grid grid-cols-[4rem_repeat(7,minmax(5.7rem,1fr))] border-b border-white/10 bg-white/10 backdrop-blur-md max-[600px]:grid-cols-[4rem_repeat(7,minmax(6rem,1fr))]">
                  <div className="border-r border-white/10 px-2 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                    Time
                  </div>
                  {weekDays.map((day) => (
                    <div
                      key={day.dateKey}
                      className={[
                        "border-r border-white/10 px-2 py-3 last:border-r-0",
                        day.isToday ? "bg-[#8b0000]/18" : "",
                      ].join(" ")}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60 max-[850px]:text-[10px]">
                        {day.isToday ? "Today" : day.date.toLocaleDateString(undefined, { weekday: "long" })}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white max-[850px]:text-xs">
                        <span>{day.date.toLocaleDateString(undefined, { month: "short" })}</span>
                        <span className={day.isToday ? "rounded-full bg-white px-2 py-0.5 text-stone-900" : ""}>
                          {day.date.getDate()}
                        </span>
                      </div>
                      {day.events.filter((event) => isWeeklyAllDayEvent(event)).length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {day.events.filter((event) => isWeeklyAllDayEvent(event)).slice(0, 1).map((event) => (
                            <button
                              key={event.id}
                              type="button"
                              onClick={() => setActiveModalEvent(event)}
                              className="truncate rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-white/25"
                            >
                              {event.title}
                            </button>
                          ))}
                          {day.events.filter((event) => isWeeklyAllDayEvent(event)).length > 1 ? (
                            <button
                              type="button"
                              onClick={() => setActiveModalEvent({
                                title: `${day.events.filter((event) => isWeeklyAllDayEvent(event)).length} All Day Events`,
                                subtitle: getCalendarViewDateLabel(day.date),
                                events: day.events.filter((event) => isWeeklyAllDayEvent(event)),
                              })}
                              className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/75 transition hover:bg-white/20"
                            >
                              +{day.events.filter((event) => isWeeklyAllDayEvent(event)).length - 1} more
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="relative grid grid-cols-[4rem_repeat(7,minmax(5.7rem,1fr))] max-[600px]:grid-cols-[4rem_repeat(7,minmax(6rem,1fr))]">
                  <div className="relative border-r border-white/10">
                    {weekHours.map((hour) => (
                      <div key={hour} className="h-20 border-b border-white/10 px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/45 max-[850px]:text-[10px]">
                        {new Date(2025, 0, 1, hour).toLocaleTimeString(undefined, { hour: "numeric" })}
                      </div>
                    ))}
                  </div>

                  {weekDays.map((day) => (
                    <div
                      key={day.dateKey}
                      className={[
                        "relative border-r border-white/10 last:border-r-0",
                        day.isToday ? "bg-[#8b0000]/8" : "",
                      ].join(" ")}
                    >
                      {weekHours.map((hour) => (
                        <div key={`${day.dateKey}-${hour}`} className="h-20 border-b border-white/10" />
                      ))}

                      {day.isToday && nowInSelectedWeek ? (
                        <div
                          className="pointer-events-none absolute left-0 right-0 z-20 border-t-2 border-[#ff4b4b]"
                          style={{ top: `${currentTimeTop}px` }}
                        >
                          <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-[#ff4b4b]" />
                        </div>
                      ) : null}

                      {day.events.filter((event) => !isWeeklyAllDayEvent(event) && !isCanvasAssignmentEvent(event)).map((event) => {
                        const layout = weekLayout.events[event.id] || { lane: 0, laneCount: 1 };
                        if (layout.clusterSize >= 3 && layout.clusterLeadId !== event.id) {
                          return null;
                        }

                        const startMinutes = (event.startsAt.getHours() * 60) + event.startsAt.getMinutes();
                        const endSource = event.endsAt || new Date(event.startsAt.getTime() + (60 * 60 * 1000));
                        const endMinutes = (endSource.getHours() * 60) + endSource.getMinutes();
                        const clampedStart = Math.max(7 * 60, Math.min(startMinutes, 23 * 60));
                        const clampedEnd = Math.max(clampedStart + 30, Math.min(endMinutes, 23 * 60));
                        const top = ((clampedStart - (7 * 60)) / 60) * 80;
                        const height = Math.max(36, ((clampedEnd - clampedStart) / 60) * 80);
                        const cluster = layout.clusterId ? weekLayout.clusters[layout.clusterId] : null;
                        const isCollapsedGroup = layout.clusterSize >= 3 && cluster;
                        const width = isCollapsedGroup ? "calc(100% - 6px)" : `calc(${100 / layout.laneCount}% - 6px)`;
                        const left = isCollapsedGroup ? "3px" : `calc(${(100 / layout.laneCount) * layout.lane}% + 3px)`;
                        const buttonLabel = isCollapsedGroup ? `${cluster.count}+ Events` : event.title;
                        const timeLabel = isCollapsedGroup ? "Overlapping events" : formatCalendarTimeRange(event);

                        const eventBackgroundColor = event.color || "#8b0000";
                        const eventTextColor = getEventForegroundColor(eventBackgroundColor);

                        return (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => {
                              if (isCollapsedGroup) {
                                setActiveModalEvent({
                                  title: `${cluster.count}+ Events`,
                                  subtitle: getCalendarViewDateLabel(day.date),
                                  events: cluster.events,
                                });
                                return;
                              }

                              setActiveModalEvent(event);
                            }}
                            className="absolute rounded-2xl border border-white/15 px-2 py-2 text-left shadow-lg transition hover:brightness-110"
                            style={{
                              top: `${top}px`,
                              left,
                              width,
                              height: `${height}px`,
                              backgroundColor: eventBackgroundColor,
                              color: eventTextColor,
                            }}
                          >
                            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] opacity-80">
                              {timeLabel}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs font-semibold">{buttonLabel}</p>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-[4rem_repeat(7,minmax(5.7rem,1fr))] border-t border-white/10 bg-black/10 max-[600px]:grid-cols-[4rem_repeat(7,minmax(6rem,1fr))]">
                  <div className="border-r border-white/10 px-2 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                    Due
                  </div>
                  {weekDays.map((day) => {
                    const canvasAssignments = day.events
                      .filter((event) => isCanvasAssignmentEvent(event))
                      .sort((left, right) => left.startsAt - right.startsAt);

                    return (
                      <div
                        key={`${day.dateKey}-canvas-footer`}
                        className={[
                          "min-h-[5.5rem] border-r border-white/10 px-2 py-3 last:border-r-0",
                          day.isToday ? "bg-[#8b0000]/10" : "",
                        ].join(" ")}
                      >
                        {canvasAssignments.length ? (
                          <div className="space-y-2">
                            {canvasAssignments.map((event) => (
                              <button
                                key={`${event.id}-footer`}
                                type="button"
                                onClick={() => setActiveModalEvent(event)}
                                className="w-full rounded-xl border border-white/10 bg-white/10 px-2 py-2 text-left text-white transition hover:bg-white/15"
                              >
                                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-white/65">
                                  {formatCalendarTimeRange(event)}
                                </p>
                                <p className="mt-1 line-clamp-2 text-xs font-semibold">{event.title}</p>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="pt-2 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-white/35">
                            No Canvas
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {calendarView === "month" ? (
          <aside
            className="flex min-h-0 flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-stone-100/90 p-6 text-stone-900 shadow-xl"
            style={calendarPanelHeight ? { height: `${calendarPanelHeight}px` } : undefined}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">Selected Day</p>
            <h2 className="mt-2 font-serif text-3xl">{formatCalendarPanelDate(selectedDateKey)}</h2>
            <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {selectedDayEvents.length ? (
                selectedDayEvents.map((event) => (
                  <a
                    key={event.id}
                    href={event.link || undefined}
                    target={event.link ? "_blank" : undefined}
                    rel={event.link ? "noreferrer" : undefined}
                    className="block rounded-[1.35rem] border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{event.sourceLabel}</p>
                    <h3 className="mt-2 text-lg font-semibold leading-tight text-stone-900">{event.title}</h3>
                    <p className="mt-2 text-sm font-semibold text-stone-800">{formatEventDate(event)}</p>
                    {event.location ? (
                      <p className="mt-1 text-sm text-stone-700">
                        <span className="font-semibold">Location:</span> {event.location}
                      </p>
                    ) : null}
                    {event.description ? <p className="mt-2 text-sm text-stone-600">{event.description}</p> : null}
                  </a>
                ))
              ) : (
                <div className="rounded-[1.35rem] border border-dashed border-stone-300 bg-white/70 px-4 py-6 text-sm text-stone-600">
                  No events are scheduled for this day yet.
                </div>
              )}
            </div>
          </aside>
        ) : null}
      </div>

      <CalendarEventModal payload={activeModalEvent} onClose={() => setActiveModalEvent(null)} />
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
            className={`flex min-h-[16rem] flex-col items-center rounded-[1.75rem] border border-white/20 bg-black/20 p-5 text-center text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-black/25 hover:shadow-2xl backdrop-blur-md ${index === CONTRIBUTORS.length - 1 && CONTRIBUTORS.length % 3 === 1 ? "xl:col-start-2" : ""
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
  const [calendarNavbarDismissed, setCalendarNavbarDismissed] = useState(false);
  const theme = bridgeState?.theme || DEFAULT_THEME;
  const location = useLocation();

  useEffect(() => {
    window.__openRebelDownloadModal = () => setIsDownloadModalOpen(true);
    return () => {
      delete window.__openRebelDownloadModal;
    };
  }, []);

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY;
      const isCalendarPage = location.pathname === "/calendar" || location.pathname.startsWith("/calendar/");

      if (!isCalendarPage) {
        setShowNavbar(scrollY > 120);
        return;
      }

      if (scrollY <= 0) {
        setCalendarNavbarDismissed(false);
        setShowNavbar(false);
        return;
      }

      if (calendarNavbarDismissed) {
        setShowNavbar(false);
        return;
      }

      setShowNavbar(scrollY > 120);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [calendarNavbarDismissed, location.pathname]);

  useEffect(() => {
    const isCalendarPage = location.pathname === "/calendar" || location.pathname.startsWith("/calendar/");
    if (!isCalendarPage) {
      setCalendarNavbarDismissed(false);
      setShowNavbar(window.scrollY > 120);
      return;
    }

    if (window.scrollY <= 0) {
      setShowNavbar(false);
    } else if (!calendarNavbarDismissed) {
      setShowNavbar(window.scrollY > 120);
    }
  }, [location.pathname, calendarNavbarDismissed]);

  useEffect(() => {
    if (!isBridgeSupportedBrowser()) {
      setBridgeStatus("unsupported");
      setBridgeState(null);
      setBridgeError("");
      return undefined;
    }

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

    const attemptBridgeHandshake = () => {
      pingExtension();
      requestExtensionState();
    };

    attemptBridgeHandshake();

    const retryIntervalId = window.setInterval(() => {
      if (seenPong || seenState) {
        window.clearInterval(retryIntervalId);
        return;
      }

      attemptBridgeHandshake();
    }, 500);

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(retryIntervalId);
      if (!seenPong && !seenState) {
        setBridgeStatus("unavailable");
        setBridgeState(null);
        setBridgeError("");
      }
    }, 4000);

    return () => {
      unsubscribe();
      window.clearInterval(retryIntervalId);
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
      <Navbar
        visible={showNavbar}
        onCloseCalendarNavbar={() => {
          if (location.pathname === "/calendar" || location.pathname.startsWith("/calendar/")) {
            setCalendarNavbarDismissed(true);
            setShowNavbar(false);
          }
        }}
      />
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
              path="/datasets"
              element={<DatasetsLandingPage datasets={datasets} />}
            />
            <Route
              path="/datasets/:datasetKey"
              element={<DatasetPage datasets={datasets} bridgeStatus={bridgeStatus} bridgeState={bridgeState} />}
            />
            <Route path="/calendar" element={<CalendarPage datasets={datasets} bridgeState={bridgeState} bridgeStatus={bridgeStatus} />} />
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
