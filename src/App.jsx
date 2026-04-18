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
    key: "rebelSports",
    label: "Rebel Sports",
    path: "/data/rebelcoverage_list.json",
    sourceUrl: "https://unlvrebels.com/coverage",
  },
];

const UNLV_TODAY_FILE = {
  key: "unlvToday",
  label: "UNLV Today",
  path: "/data/unlvtoday_list.json",
  sourceUrl: "https://www.unlv.edu/news/unlvtoday",
};

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
  "Other",
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

const EXTENSION_EVENT_SOURCE_ORDER = [
  "Canvas",
  "Your Events",
  "Involvement Center",
  "UNLV Calendar",
  "Rebel Sports",
  "Google Calendar",
  "Saved Campus Event",
  "Extension Event",
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
const SITE_URL = "https://rebelremind.github.io";
const DEFAULT_OG_IMAGE = `${SITE_URL}/rr_logo_bg.png`;
const BACK_HOME_BUTTON_CLASS = "inline-flex items-center justify-center rounded-2xl border border-white/35 bg-white px-5 py-3 text-sm font-semibold text-stone-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-stone-100";

const DATASET_HOME_COPY = {
  academicCalendar: {
    eyebrow: "Deadlines",
    description: "Semester milestones, registration windows, and official academic dates.",
  },
  unlvCalendar: {
    eyebrow: "Campus Events",
    description: "Lectures, workshops, featured events, and university programming.",
  },
  involvementCenter: {
    eyebrow: "Student Life",
    description: "RSO events, student org meetups, and involvement opportunities.",
  },
  rebelSports: {
    eyebrow: "Athletics",
    description: "Rebel games, meets, matches, and sports coverage across campus.",
  },
};

function normalizeDatasetKey(value) {
  return value === "rebelCoverage" ? "rebelSports" : value;
}

function getCalendarSourceLink(key) {
  const normalizedKey = normalizeDatasetKey(key);
  return normalizedKey ? `/calendar?source=${encodeURIComponent(normalizedKey)}` : "/calendar";
}

const DEFAULT_THEME = {
  backgroundColor: "#BB0000",
  textColor: "#f3f4f6",
  selectedThemeKey: "custom",
};

function blendHexColor(color, ratio = 0.5) {
  if (!color || !color.startsWith("#") || color.length !== 7) {
    return color;
  }

  const clampRatio = Math.max(0, Math.min(1, ratio));
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);

  const mixChannel = (channel) => Math.round(channel + ((255 - channel) * clampRatio));

  return `#${[mixChannel(red), mixChannel(green), mixChannel(blue)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function buildBackground(backgroundColor) {
  const softenedColor = blendHexColor(backgroundColor, 0.5);
  return `linear-gradient(135deg, ${backgroundColor} 0%, ${softenedColor} 100%)`;
}

function upsertMetaTag(selector, attributes, content) {
  if (typeof document === "undefined") {
    return;
  }

  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function upsertCanonicalLink(href) {
  if (typeof document === "undefined") {
    return;
  }

  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

function getSeoConfig(pathname) {
  const normalizedPath = normalizeDatasetKey(pathname);
  const defaultConfig = {
    title: "Rebel Remind | UNLV Events, Academic Calendar, and Student Reminders",
    description:
      "Rebel Remind helps UNLV students browse the academic calendar, campus events, Rebel Sports, and synced reminders in one place.",
    keywords:
      "Rebel Remind, UNLV academic calendar, UNLV calendar, UNLV events, Rebel Sports, student reminders, UNLV campus events",
    path: pathname,
  };

  if (normalizedPath === "/calendar") {
    return {
      title: "Rebel Remind Calendar | UNLV Events and Synced Student Calendar",
      description:
        "See UNLV academic dates, campus events, Rebel Sports, and your synced Rebel Remind events on one calendar.",
      keywords:
        "Rebel Remind calendar, UNLV calendar, UNLV events calendar, Rebel Sports calendar, student calendar",
      path: pathname,
    };
  }

  if (normalizedPath === "/datasets") {
    return {
      title: "Rebel Remind Datasets | UNLV Event and Academic Calendar Feeds",
      description:
        "Explore the public JSON feeds behind Rebel Remind, including the UNLV Academic Calendar, UNLV Calendar, Involvement Center, and Rebel Sports.",
      keywords:
        "Rebel Remind datasets, UNLV academic calendar data, UNLV events data, Rebel Sports data",
      path: pathname,
    };
  }

  if (normalizedPath.startsWith("/datasets/")) {
    const datasetSlug = normalizedPath.split("/").pop();
    const datasetKey = normalizeDatasetKey(datasetSlug);
    const dataset = DATA_FILE_MAP[datasetKey];

    if (datasetKey === "academicCalendar") {
      return {
        title: "UNLV Academic Calendar | Rebel Remind",
        description:
          "Browse the UNLV Academic Calendar in Rebel Remind with semester dates, registration deadlines, recesses, and key academic milestones.",
        keywords:
          "UNLV Academic Calendar, Rebel Remind academic calendar, UNLV semester dates, UNLV deadlines",
        path: `/datasets/${datasetKey}`,
      };
    }

    if (dataset) {
      return {
        title: `${dataset.label} | Rebel Remind`,
        description: `Browse ${dataset.label} on Rebel Remind for upcoming UNLV events, dates, and source-linked campus information.`,
        keywords: `Rebel Remind, ${dataset.label}, UNLV ${dataset.label}, UNLV events`,
        path: `/datasets/${datasetKey}`,
      };
    }
  }

  if (normalizedPath === "/contributors") {
    return {
      title: "Rebel Remind Contributors | Student-Built at UNLV",
      description:
        "Meet the UNLV student team behind Rebel Remind and the campus event, reminder, and calendar experience.",
      keywords: "Rebel Remind contributors, UNLV student developers, Rebel Remind team",
      path: pathname,
    };
  }

  return defaultConfig;
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

  const normalizedTimeLabel = normalizeDisplayTime(item.startDate, item.startTime) || "";
  const isAllDay = normalizedTimeLabel.toUpperCase() === "(ALL DAY)";
  const timeLabel = isAllDay ? "(All Day)" : normalizedTimeLabel.toLowerCase();

  if (itemDay.getTime() === today.getTime()) {
    if (isAllDay) {
      return `Today ${timeLabel}`;
    }
    return timeLabel ? `Today at ${timeLabel}` : "Today";
  }

  if (itemDay.getTime() === tomorrow.getTime()) {
    if (isAllDay) {
      return `Tomorrow ${timeLabel}`;
    }
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
  if (isAllDay) {
    return `${dateLabel} ${timeLabel}`;
  }

  return timeLabel ? `${dateLabel} at ${timeLabel}` : dateLabel;
}

function formatNewsDate(item) {
  const publishedValue = item?.publishedAt || item?.publishedDate;
  if (!publishedValue) {
    return "Latest announcement";
  }

  const parsed = new Date(publishedValue);
  if (Number.isNaN(parsed.getTime())) {
    return item?.publishedDate || publishedValue;
  }

  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDatasetTimeRange(item) {
  if (!item) {
    return "Time TBD";
  }

  const rawStart = String(item.startTime || "").trim();
  const rawEnd = String(item.endTime || "").trim();
  const normalizedStart = rawStart.toUpperCase();

  if (!rawStart || normalizedStart === "(ALL DAY)" || normalizedStart === "TIME TBD" || normalizedStart === "TBD") {
    return normalizedStart === "(ALL DAY)" ? "All day" : "Time TBD";
  }

  const start = normalizeDisplayTime(item.startDate, rawStart) || rawStart;
  const end = normalizeDisplayTime(item.endDate || item.startDate, rawEnd) || "";

  if (start && end && start !== end) {
    return `${start} - ${end}`;
  }

  return start || "Time TBD";
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

function parseTimeParts(value) {
  const normalized = (value || "").trim().toUpperCase();
  const twentyFourHourMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hour = Number.parseInt(twentyFourHourMatch[1], 10);
    const minute = Number.parseInt(twentyFourHourMatch[2], 10);
    if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
      return { hour, minute };
    }
  }

  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*([AP]M)$/);
  if (!match) {
    return null;
  }

  let hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2] || "0", 10);
  const meridiem = match[3];

  if (hour === 12) {
    hour = 0;
  }
  if (meridiem === "PM") {
    hour += 12;
  }

  return { hour, minute };
}

function normalizeDisplayTime(dateValue, timeValue) {
  const rawTime = String(timeValue || "").trim();
  const normalizedTime = rawTime.toUpperCase();
  if (!rawTime || normalizedTime === "(ALL DAY)" || normalizedTime === "TIME TBD" || normalizedTime === "TBD") {
    return normalizedTime === "(ALL DAY)" ? "(ALL DAY)" : rawTime;
  }

  const amPmParts = parseTimeParts(rawTime);
  if (amPmParts) {
    return new Date(2025, 0, 1, amPmParts.hour, amPmParts.minute, 0, 0).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const militaryMatch = rawTime.match(/^(\d{1,2}):(\d{2})$/);
  if (militaryMatch) {
    const hour = Number.parseInt(militaryMatch[1], 10);
    const minute = Number.parseInt(militaryMatch[2], 10);
    if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
      return new Date(2025, 0, 1, hour, minute, 0, 0).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    }
  }

  if (dateValue) {
    const parsed = new Date(`${dateValue}T${rawTime}`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    }
  }

  return rawTime;
}

function parseLocalDateTime(dateValue, timeValue, fallbackHour = 12, fallbackMinute = 0) {
  if (!dateValue) {
    return null;
  }

  const dateMatch = String(dateValue).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) {
    const parsed = timeValue ? new Date(`${dateValue} ${timeValue}`) : new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const year = Number.parseInt(dateMatch[1], 10);
  const monthIndex = Number.parseInt(dateMatch[2], 10) - 1;
  const day = Number.parseInt(dateMatch[3], 10);
  const timeParts = parseTimeParts(timeValue);

  return new Date(
    year,
    monthIndex,
    day,
    timeParts?.hour ?? fallbackHour,
    timeParts?.minute ?? fallbackMinute,
    0,
    0
  );
}

function getEventTimestamp(item) {
  if (!item?.startDate) {
    return Number.POSITIVE_INFINITY;
  }

  const datePart = item.startDate;
  const timePart =
    item.startTime && item.startTime !== "(ALL DAY)" ? item.startTime : "11:59 PM";
  const parsed = parseLocalDateTime(datePart, timePart, 23, 59);

  if (!parsed || Number.isNaN(parsed.getTime())) {
    const fallback = parseLocalDateTime(datePart, "", 12, 0);
    return !fallback || Number.isNaN(fallback.getTime()) ? Number.POSITIVE_INFINITY : fallback.getTime();
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
    const parsed = parseLocalDateTime(startDate, "", 12, 0);
    return !parsed || Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = parseLocalDateTime(startDate, startTime, 12, 0);
  if (parsed && !Number.isNaN(parsed.getTime())) {
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
    return { label: dateKey, emphasize: false, isToday: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const value = new Date(parsed);
  value.setHours(0, 0, 0, 0);

  if (value.getTime() === today.getTime()) {
    return { label: "Today", emphasize: true, isToday: true };
  }

  if (value.getTime() === tomorrow.getTime()) {
    return { label: "Tomorrow", emphasize: false, isToday: false };
  }

  return {
    label: parsed.toLocaleDateString(undefined, { weekday: "long" }),
    emphasize: false,
    isToday: false,
  };
}

const CALENDAR_SESSION_KEY = "rebelremind-calendar-session";

function readCalendarSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CALENDAR_SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (parsed?.selectedCalendarKey) {
      parsed.selectedCalendarKey = normalizeDatasetKey(parsed.selectedCalendarKey);
    }

    return parsed;
  } catch {
    return null;
  }
}

function formatCalendarTimeRange(event) {
  if (!event || event.allDay || event.startTime === "(ALL DAY)") {
    return "All day";
  }

  const start = normalizeDisplayTime(event.startDate, event.startTime) || "";
  const end = normalizeDisplayTime(event.endDate || event.startDate, event.endTime) || "";
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
  const normalizedDatasetKey = normalizeDatasetKey(datasetKey);
  const datasetLabel = DATA_FILE_MAP[normalizedDatasetKey]?.label || "Campus Calendar";
  const sourceItems = Array.isArray(datasets[normalizedDatasetKey]) ? datasets[normalizedDatasetKey] : [];

  return sourceItems
    .map((item, index) => {
      const allDay = item.startTime === "(ALL DAY)";
      const resolvedEndTime = item.endTime || buildDefaultEventEndTime(item.startDate, item.startTime, allDay);
      const resolvedTitle = normalizedDatasetKey === "rebelSports" && item.sport && item.name
        ? `${item.sport}: ${item.name}`
        : item.name;

      return {
        id: `${normalizedDatasetKey}-${item.name}-${item.startDate}-${index}`,
        sourceKey: normalizedDatasetKey,
        title: resolvedTitle,
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
      const hasDistinctEndTime = Boolean(event.endTime) && event.endTime !== event.startTime;
      const resolvedEndTime = hasDistinctEndTime
        ? event.endTime
        : buildDefaultEventEndTime(event.startDate, event.startTime, allDay);
      const courseColor = event.courseID != null
        ? courseColors?.[event.courseID]?.color || courseColors?.[String(event.courseID)]?.color || ""
        : "";
      const resolvedTitle = event.sourceLabel === "Rebel Sports" && event.description && event.title
        && !event.title.startsWith(`${event.description}:`)
        ? `${event.description}: ${event.title}`
        : (event.title || "Untitled Event");

      return {
        id: event.id || `extension-event-${index}`,
        sourceKey: "extensionEvents",
        title: resolvedTitle,
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
          ? courseColor || "#3174ad"
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
            {payload.description ? (
              <p>
                <span className="font-semibold">{payload.sourceLabel === "Rebel Sports" ? "Sport:" : "Details:"}</span> {payload.description}
              </p>
            ) : null}
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

function DatasetEventModal({ dataset, item, onClose }) {
  if (!dataset || !item) {
    return null;
  }

  const isAcademicCalendar = dataset.key === "academicCalendar";
  const isRebelSports = dataset.key === "rebelSports";
  const modalTitle = isRebelSports && item.sport ? `${item.sport}: ${item.name}` : item.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/15 bg-stone-100 p-6 text-stone-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{dataset.label}</p>
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

        <div className="mt-5 space-y-3 text-sm">
          <p><span className="font-semibold">Date:</span> {isAcademicCalendar && item.startDate ? item.startDate : formatCalendarPanelDate(item.startDate)}</p>
          <p><span className="font-semibold">Time:</span> {formatDatasetTimeRange(item)}</p>
          {item.location ? <p><span className="font-semibold">Location:</span> {item.location}</p> : null}
          {item.organization ? <p><span className="font-semibold">RSO:</span> {item.organization}</p> : null}
          {item.sport && !isRebelSports ? <p><span className="font-semibold">Sport:</span> {item.sport}</p> : null}
          {item.category ? (
            <p><span className="font-semibold">Category:</span> {item.category}</p>
          ) : dataset.key === "unlvCalendar" ? (
            <p><span className="font-semibold">Category:</span> Other</p>
          ) : null}
          {item.description ? <p><span className="font-semibold">Details:</span> {item.description}</p> : null}
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full bg-[#8b0000] px-4 py-2 font-semibold text-white transition hover:bg-[#6b0000]"
            >
              Go to Event
            </a>
          ) : null}
        </div>
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

function getSyncedHomeEventTimestamp(event) {
  if (!event?.startDate) {
    return Number.MAX_SAFE_INTEGER;
  }

  if (event.sourceType === "involvementCenter") {
    return getEventTimestamp({
      startDate: event.startDate,
      startTime: event.startTime,
    });
  }

  if (!event.startTime || event.startTime === "(ALL DAY)") {
    return getEventTimestamp({
      startDate: event.startDate,
      startTime: "(ALL DAY)",
    });
  }

  const parsed = new Date(`${event.startDate} ${event.startTime}`);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getTime();
  }

  return getEventTimestamp({
    startDate: event.startDate,
    startTime: event.startTime,
  });
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

function isAcademicCalendarPrimarySourceEvent(item) {
  const link = item?.link || "";
  return link.startsWith("https://www.unlv.edu/");
}

function toTitleList(preferences = {}) {
  const labelOverrides = {
    UNLVCalendar: "UNLV Calendar",
    involvementCenter: "Involvement Center",
    academicCalendar: "Academic Calendar",
    rebelCoverage: "Rebel Sports",
    rebelSports: "Rebel Sports",
    canvasIntegration: "Canvas Integration",
    googleCalendar: "Google Calendar",
  };

  return Object.entries(preferences)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => labelOverrides[key] || key.replace(/([A-Z])/g, " $1"))
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1));
}

function getDatasetRoute(key) {
  return `/datasets/${normalizeDatasetKey(key)}`;
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
  onSelectAll,
  onClearAll,
  searchEnabled = false,
  searchPlaceholder = "Search filters",
}) {
  const [modalSearch, setModalSearch] = useState("");
  const allSelected = options.length > 0 && selectedValues.length === options.length;

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

  useEffect(() => {
    if (open) {
      setModalSearch("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const visibleOptions = searchEnabled
    ? options.filter((option) => option.toLowerCase().includes(modalSearch.trim().toLowerCase()))
    : options;
  const handleToggle = (option) => {
    onToggle(option);
    setModalSearch("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-[min(42rem,calc(100vh-4rem))] w-full max-w-2xl flex-col rounded-[2rem] border border-white/20 bg-stone-100/95 p-6 text-stone-900 shadow-2xl"
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
              onClick={onSelectAll}
              disabled={allSelected}
              className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedValues.length}
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

        <div className="mt-5 flex min-h-0 flex-1 flex-col rounded-[1.5rem] border border-stone-200 bg-white p-4">
          {searchEnabled ? (
            <div className="mb-4">
              <SearchInput
                value={modalSearch}
                onChange={setModalSearch}
                placeholder={searchPlaceholder}
              />
            </div>
          ) : null}

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
            {visibleOptions.length ? (
              visibleOptions.map((option) => (
                <label key={option} className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-stone-100">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    onChange={() => handleToggle(option)}
                  />
                  <span className="text-sm font-medium text-stone-800">{option}</span>
                </label>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-stone-600">No filters match your search.</p>
            )}
          </div>
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

function openDownloadModal() {
  window.__openRebelDownloadModal?.();
}

function Navbar({ visible, onCloseCalendarNavbar }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const datasetKey = location.pathname.startsWith("/datasets/")
    ? normalizeDatasetKey(location.pathname.split("/").pop())
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
        <div
          className={[
            "rounded-[1.5rem] px-4 py-3 shadow-2xl backdrop-blur-md",
            showHomeActions
              ? "border border-white/25 bg-black/82"
              : "border border-white/20 bg-black/65",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-3 text-left text-white"
            >
              <img src="/rr_logo.png" alt="Rebel Remind logo" className="h-10 w-10 rounded-xl ring-1 ring-white/20" />
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
              <>
                <div className="hidden items-center gap-3 md:flex">
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
                    onClick={openDownloadModal}
                    className="rounded-full bg-[#bb0000] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#bb0000]/30 transition hover:bg-[#980000]"
                  >
                    Download RebelRemind
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((current) => !current)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white transition hover:bg-white/20 md:hidden"
                  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={mobileMenuOpen}
                >
                  <span className="sr-only">{mobileMenuOpen ? "Close menu" : "Open menu"}</span>
                  <span className="flex flex-col gap-1.5">
                    <span className="block h-0.5 w-5 rounded-full bg-current" />
                    <span className="block h-0.5 w-5 rounded-full bg-current" />
                    <span className="block h-0.5 w-5 rounded-full bg-current" />
                  </span>
                </button>
              </>
            ) : (
              null
            )}
          </div>

          {showHomeActions ? (
            <div
              className={[
                "grid overflow-hidden transition-all duration-300 md:hidden",
                mobileMenuOpen ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              ].join(" ")}
            >
              <div className="min-h-0">
                <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
                  <Link
                    to="/calendar"
                    className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Calendar
                  </Link>
                  <a
                    href="/datasets"
                    className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Datasets
                  </a>
                  <button
                    type="button"
                    onClick={openDownloadModal}
                    className="rounded-2xl bg-[#bb0000] px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-[#980000]"
                  >
                    Download RebelRemind
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

function Hero({ bridgeStatus, bridgeState, featuredPreferences, bridgeError }) {
  const bridgeIsConnected = bridgeStatus === "connected";
  const bridgeIsUnsupported = bridgeStatus === "unsupported";
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const profileName = bridgeState?.user?.name || "User";
  const profileInitials = profileName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

  useEffect(() => {
    setProfileImageFailed(false);
  }, [bridgeState?.user?.picture]);

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
              {bridgeState.user.picture && !profileImageFailed ? (
                <img
                  src={bridgeState.user.picture}
                  alt={bridgeState.user.name}
                  referrerPolicy="no-referrer"
                  onError={() => setProfileImageFailed(true)}
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white/30"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-lg font-semibold text-white ring-2 ring-white/30">
                  {profileInitials}
                </div>
              )}
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
              <p className="text-sm text-white/70">Your Events</p>
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
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={openDownloadModal}
              className="inline-flex items-center justify-center rounded-full bg-[#bb0000] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#bb0000]/30 transition hover:bg-[#980000]"
            >
              Download RebelRemind
            </button>
            <Link
              to="/calendar"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/20"
            >
              View Calendar
            </Link>
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
                    ? "Bridge sync is not available in this browser. Please use Google Chrome and download the extension to see your upcoming Canvas Assignments!"
                    : "Sync not available. Turn on the extension to preview upcoming assignments here."}
              </div>
            )}
          </div>
        </aside>
      </div>
    </header>
  );
}

function HomePage({ bridgeStatus, bridgeState, bridgeError, datasets, newsFeed }) {
  const [collapsedEvents, setCollapsedEvents] = useState({});
  const featuredPreferences = toTitleList(bridgeState?.preferences);
  const campusFeedItems = Array.isArray(newsFeed)
    ? [...newsFeed]
      .filter((item) => item?.name && item?.link)
      .sort((left, right) => {
        const leftTime = new Date(left.publishedAt || left.publishedDate || 0).getTime();
        const rightTime = new Date(right.publishedAt || right.publishedDate || 0).getTime();
        return rightTime - leftTime;
      })
      .slice(0, 6)
    : [];
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
      displayTitle: `Custom Event: ${event.title}`,
      displayLocation: event.location,
      displayDescription: event.desc || "",
    }))),
    ...((bridgeState?.savedUNLVEvents || []).map((event) => ({
      ...event,
      sourceType: "savedUnlvEvent",
      displayTitle: event.sport && event.name ? `${event.sport}: ${event.name}` : event.name,
      displayLocation: event.location,
      displayDescription: event.sport || event.description || event.organization || event.category || "",
    }))),
    ...((bridgeState?.googleCalendarEvents || []).map((event) => ({
      ...event,
      sourceType: "googleCalendar",
      displayTitle: event.title,
      displayLocation: event.location,
      displayDescription: event.desc || "",
    }))),
  ].sort((left, right) => getSyncedHomeEventTimestamp(left) - getSyncedHomeEventTimestamp(right));

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
        <section className="mt-3 rounded-[2rem] border border-white/20 bg-black/20 p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Your Events</p>
              <h2 className="mt-2 font-serif text-3xl leading-tight text-white">Your upcoming saved and custom events.</h2>
            </div>
            <div className="rounded-[1.5rem] border border-white/15 bg-white/10 px-5 py-4 text-white">
              <p className="text-sm uppercase tracking-[0.2em] text-white/65">Upcoming Saved Events</p>
              <p className="mt-2 text-4xl font-semibold">{syncedUserEvents.length}</p>
            </div>
          </div>
          <div className="mt-5 max-h-[21rem] space-y-3 overflow-y-auto pr-1">
            {syncedUserEvents.length ? (
              syncedUserEvents.map((event, index) => {
                const eventKey = `${event.displayTitle}-${event.startDate}-${index}`;
                const isCollapsed = Boolean(collapsedEvents[eventKey]);
                const hasExtraDetails = Boolean(event.displayLocation || event.displayDescription);

                const Wrapper = event.link ? "a" : "article";

                return (
                  <Wrapper
                    key={eventKey}
                    href={event.link || undefined}
                    target={event.link ? "_blank" : undefined}
                    rel={event.link ? "noreferrer" : undefined}
                    className="block rounded-[1.25rem] border border-white/15 bg-white/10 px-4 py-4 text-white shadow-sm transition hover:bg-white/12"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-semibold">{event.displayTitle}</p>
                      {hasExtraDetails ? (
                        <button
                          type="button"
                          onClick={(clickEvent) => {
                            clickEvent.preventDefault();
                            clickEvent.stopPropagation();
                            toggleCollapsedEvent(eventKey);
                          }}
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
                  </Wrapper>
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

      <section id="campus-feed" className="mt-3 grid scroll-mt-28 gap-4">
        <div className="rounded-[2rem] border border-white/20 bg-black/20 p-6 shadow-xl backdrop-blur-md">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">UNLV Today</p>
          <div className="mt-5 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
            {campusFeedItems.length ? (
              campusFeedItems.map((item, index) => (
                <a
                  key={`${item.name}-${index}`}
                  href={item.link || undefined}
                  target={item.link ? "_blank" : undefined}
                  rel={item.link ? "noreferrer" : undefined}
                  className="block rounded-[1.5rem] border border-white/15 bg-white/8 px-4 py-4 transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="text-lg font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm text-white/75">{formatNewsDate(item)}</p>
                  {item.summary ? <p className="mt-2 text-sm leading-6 text-white/72">{item.summary}</p> : null}
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                    {[item.category, UNLV_TODAY_FILE.label].filter(Boolean).join(" • ")}
                  </p>
                </a>
              ))
            ) : (
              <p className="text-white/80">Loading the latest UNLV Today announcements...</p>
            )}
          </div>
        </div>

        <div id="dataset-grid" className="grid scroll-mt-28 gap-4 xl:grid-cols-2">
          {DATA_FILES.map((source) => {
            const sourceItems = Array.isArray(datasets[source.key]) ? datasets[source.key] : [];
            const nextItem = sourceItems
              .filter(isUpcomingEvent)
              .sort((left, right) => getEventTimestamp(left) - getEventTimestamp(right))[0];
            const datasetCopy = DATASET_HOME_COPY[source.key] || {
              eyebrow: "Dataset Explorer",
              description: "Open the full page for this feed.",
            };

            return (
              <Link
                key={source.key}
                to={getDatasetRoute(source.key)}
                className="group rounded-[2rem] border border-black/10 bg-stone-100/90 p-6 text-stone-900 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-white"
              >
                <div className="flex h-full flex-col justify-between gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">{datasetCopy.eyebrow}</p>
                      <h3 className="mt-1 text-2xl font-semibold">{source.label}</h3>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">{datasetCopy.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex max-w-[5.5rem] flex-col items-center rounded-2xl bg-stone-900 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] leading-tight text-white sm:max-w-none sm:flex-row sm:gap-1 sm:rounded-full sm:px-3 sm:py-1 sm:text-xs">
                        <span>{sourceItems.length || 0}</span>
                        <span>loaded</span>
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-stone-200 bg-white/75 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Next Up</p>
                    {nextItem ? (
                      <>
                        <p className="mt-2 line-clamp-2 text-base font-semibold text-stone-900">{nextItem.name}</p>
                        <p className="mt-1 text-sm text-stone-700">{formatEventDate(nextItem)}</p>
                        <p className="mt-3 text-sm font-semibold text-stone-700 transition-transform duration-300 group-hover:translate-x-1">
                          Explore feed →
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-2 text-sm leading-6 text-stone-600">The feed is loading or there are no upcoming events in range yet.</p>
                        <p className="mt-3 text-sm font-semibold text-stone-700 transition-transform duration-300 group-hover:translate-x-1">
                          Open dataset →
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

function DatasetPage({ datasets, bridgeStatus, bridgeState }) {
  const { datasetKey } = useParams();
  const normalizedDatasetKey = normalizeDatasetKey(datasetKey);
  const dataset = DATA_FILES.find((item) => item.key === normalizedDatasetKey);
  const allItems = dataset
    ? (datasets[dataset.key] || [])
      .filter(isUpcomingEvent)
      .filter((item) => (dataset.key === "academicCalendar" ? isAcademicCalendarPrimarySourceEvent(item) : true))
      .sort((left, right) => getEventTimestamp(left) - getEventTimestamp(right))
    : [];
  const isUNLVCalendar = dataset?.key === "unlvCalendar";
  const isInvolvementCenter = dataset?.key === "involvementCenter";
  const isRebelSports = dataset?.key === "rebelSports";
  const supportsViewAllModal = isInvolvementCenter || isRebelSports;
  const usesSlimEventRows = isUNLVCalendar || isInvolvementCenter || isRebelSports;
  const supportsFilters = isUNLVCalendar || isInvolvementCenter || isRebelSports;
  const hasSync = bridgeStatus === "connected";
  const [useSyncedPreferences, setUseSyncedPreferences] = useState(true);
  const [manualFilters, setManualFilters] = useState([]);
  const [filterSearch, setFilterSearch] = useState("");
  const [organizationDirectory, setOrganizationDirectory] = useState([]);
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [activeDatasetItem, setActiveDatasetItem] = useState(null);

  useEffect(() => {
    setUseSyncedPreferences(true);
    setManualFilters([]);
    setFilterSearch("");
    setActiveDatasetItem(null);
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
  const allManualFiltersSelected =
    supportsFilters && availableFilters.length > 0 && manualFilters.length === availableFilters.length;

  const selectAllManualFilters = () => {
    setManualFilters(availableFilters);
  };

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

  const items = supportsFilters
    ? activeFilters.length
      ? allItems.filter((item) => {
        const field = isUNLVCalendar
          ? item.category || "Other"
          : isInvolvementCenter
            ? item.organization
            : item.sport;
        return activeFilters.includes(field);
      })
      : []
    : allItems;
  const itemCountLabel = `${items.length} ${items.length === 1 ? "Event" : "Events"}`;

  if (!dataset) {
    return (
      <section className="rounded-[2rem] border border-white/20 bg-black/20 p-8 text-white shadow-xl backdrop-blur-md">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">Not Found</p>
        <h1 className="mt-3 font-serif text-4xl">That dataset page does not exist.</h1>
        <Link to="/" className={`mt-6 ${BACK_HOME_BUTTON_CLASS}`}>
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
          <div className="mt-4 flex flex-wrap gap-2">
            {DATA_FILES.map((item) => (
              <Link
                key={item.key}
                to={getDatasetRoute(item.key)}
                className={[
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  item.key === dataset.key
                    ? "border-white bg-white text-stone-900"
                    : "border-white/20 bg-white/10 text-white hover:bg-white/20",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-3">
          <Link
            to="/"
            className={BACK_HOME_BUTTON_CLASS}
          >
            Back Home
          </Link>
          <Link
            to={getCalendarSourceLink(dataset.key)}
            className="inline-flex items-center justify-center rounded-2xl border border-[#8b0000]/30 bg-[#8b0000] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#8b0000]/25 transition hover:-translate-y-0.5 hover:bg-[#6b0000]"
          >
            Calendar View
          </Link>
        </div>
      </div>

      {supportsFilters ? (
        <section className="rounded-[1.75rem] border border-white/20 bg-black/20 p-6 text-white shadow-xl backdrop-blur-md">
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
                      No synced {isUNLVCalendar ? "interests" : isInvolvementCenter ? "organizations" : "sports"} selected, so no events are shown.
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
                      onClick={selectAllManualFilters}
                      disabled={allManualFiltersSelected}
                      className="text-stone-700 transition hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Select All
                    </button>
                    {supportsViewAllModal ? (
                      <button
                        type="button"
                        onClick={() => setIsViewAllModalOpen(true)}
                        className="text-stone-700 transition hover:text-stone-950"
                      >
                        View All
                      </button>
                    ) : null}
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

      {supportsFilters && supportsViewAllModal ? (
        <ViewAllFiltersModal
          open={isViewAllModalOpen}
          onClose={() => setIsViewAllModalOpen(false)}
          title={isUNLVCalendar ? "All Interest Filters" : isInvolvementCenter ? "All Organization Filters" : "All Sport Filters"}
          options={availableFilters}
          selectedValues={manualFilters}
          onToggle={toggleManualFilter}
          onSelectAll={selectAllManualFilters}
          onClearAll={() => setManualFilters([])}
          searchEnabled={isInvolvementCenter}
          searchPlaceholder="Search RSOs and organizations"
        />
      ) : null}

      <div className="rounded-[1.75rem] border border-white/20 bg-black/20 p-4 shadow-xl backdrop-blur-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Upcoming Events</p>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
            {itemCountLabel}
          </span>
        </div>
        <div className="max-h-[min(60rem,calc(100vh-16rem))] overflow-y-auto pr-1">
          <div
            className={
              dataset.key === "academicCalendar"
                ? "grid gap-4"
                : usesSlimEventRows
                  ? "grid gap-3"
                  : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            }
          >
            {items.length ? (
              items.map((item, index) => (
                dataset.key === "academicCalendar" ? (
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
                    <div className="grid h-full grid-cols-[minmax(0,1fr)_auto] gap-8">
                      <div className="flex h-full min-h-0 min-w-0 flex-col">
                        <div>
                          <h2 className={`${getTitleSizeClass(item.name)} font-semibold leading-tight`}>{item.name}</h2>
                          {dataset.key === "academicCalendar" && item.startDate ? (
                            <p className="mt-2 text-sm font-medium text-stone-500">{item.startDate}</p>
                          ) : null}
                        </div>
                        <div className={dataset.key === "academicCalendar" ? "pt-0" : "pt-6"}>
                          {dataset.key !== "academicCalendar" ? (
                            <p className="text-base text-stone-700 sm:text-lg">
                              <span className="font-bold">
                                {formatEventDate(item)}
                              </span>
                            </p>
                          ) : null}
                          {item.location ? (
                            <p className={`${dataset.key === "academicCalendar" ? "" : "mt-1"} text-sm text-stone-700`}>
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
                          {item.category && !isRebelSports ? (
                            <p className="mt-1 text-sm text-stone-700">
                              <span className="font-semibold">Category:</span> {item.category}
                            </p>
                          ) : isUNLVCalendar ? (
                            <p className="mt-1 text-sm text-stone-700">
                              <span className="font-semibold">Category:</span> Other
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
                ) : (
                  <button
                    key={`${dataset.key}-${item.name}-${index}`}
                    type="button"
                    onClick={() => setActiveDatasetItem(item)}
                    className={[
                      "flex flex-col rounded-[1.5rem] border border-black/10 bg-stone-100/90 text-left text-stone-900 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl",
                      usesSlimEventRows ? "min-h-0 p-4" : "min-h-[16rem] p-5",
                    ].join(" ")}
                  >
                    <div className={usesSlimEventRows ? "flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6" : "grid h-full grid-cols-[minmax(0,1fr)_auto] gap-4"}>
                      <div className={usesSlimEventRows ? "min-w-0 flex-1" : "flex h-full min-h-0 min-w-0 flex-col justify-between"}>
                        <div>
                          <h2
                            className={[
                              usesSlimEventRows ? "text-base leading-tight sm:text-lg" : `${getTitleSizeClass(item.name)} font-semibold leading-tight`,
                            ].join(" ")}
                          >
                            {isRebelSports && item.sport ? (
                              <>
                                <span className="font-semibold">{item.sport}:</span>{" "}
                                <span className="font-normal">{item.name}</span>
                              </>
                            ) : (
                              <span className={usesSlimEventRows ? "font-normal" : "font-semibold"}>{item.name}</span>
                            )}
                          </h2>
                          {isInvolvementCenter && item.organization ? (
                            <p className="mt-1 text-sm font-semibold text-stone-700">RSO: {item.organization}</p>
                          ) : null}
                          {isUNLVCalendar ? (
                            <p className="mt-1 text-sm font-semibold text-stone-700">Category: {item.category || "Other"}</p>
                          ) : null}
                        </div>
                        <div className={usesSlimEventRows ? "hidden" : "pt-6"}>
                          <p className={usesSlimEventRows ? "text-sm text-stone-700 sm:text-base" : "text-base text-stone-700 sm:text-lg"}>
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
                          {item.sport && !isRebelSports ? (
                            <p className="mt-1 text-sm text-stone-700">
                              <span className="font-semibold">Sport:</span> {item.sport}
                            </p>
                          ) : null}
                          {item.category ? (
                            <p className="mt-1 text-sm text-stone-700">
                              <span className="font-semibold">Category:</span> {item.category}
                            </p>
                          ) : isUNLVCalendar ? (
                            <p className="mt-1 text-sm text-stone-700">
                              <span className="font-semibold">Category:</span> Other
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {usesSlimEventRows ? (
                        <div className="min-w-0 text-left sm:max-w-[16rem] sm:text-right">
                          <p className="text-sm font-bold text-stone-700 sm:text-base">
                            {formatEventDate(item)}
                          </p>
                          {item.location ? (
                            <p className="mt-1 line-clamp-2 break-words text-sm text-stone-700">
                              {item.location}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </button>
                )
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-white/20 bg-black/20 p-6 text-white shadow-xl backdrop-blur-md">
                No events match the current filters.
              </div>
            )}
          </div>
        </div>
      </div>

      <DatasetEventModal dataset={dataset} item={activeDatasetItem} onClose={() => setActiveDatasetItem(null)} />
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
            className={BACK_HOME_BUTTON_CLASS}
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
  const location = useLocation();
  const initialSession = readCalendarSession();
  const requestedCalendarSource = normalizeDatasetKey(new URLSearchParams(location.search).get("source") || "");
  const [isWideMonthLayout, setIsWideMonthLayout] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.matchMedia("(min-width: 1280px)").matches;
  });
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
  const [useSyncedCalendarFilters, setUseSyncedCalendarFilters] = useState(true);
  const [calendarManualFilters, setCalendarManualFilters] = useState([]);
  const [calendarFilterSearch, setCalendarFilterSearch] = useState("");
  const [calendarOrganizationDirectory, setCalendarOrganizationDirectory] = useState([]);
  const [isCalendarFilterModalOpen, setIsCalendarFilterModalOpen] = useState(false);
  const calendarPanelRef = useRef(null);
  const weeklyScrollRef = useRef(null);
  const calendarOptions = [
    { key: "extensionEvents", label: "Your Synched Events" },
    ...DATA_FILES.map(({ key, label }) => ({ key, label })),
  ];
  const [selectedCalendarKey, setSelectedCalendarKey] = useState(() => {
    if (requestedCalendarSource && ["extensionEvents", ...DATA_FILES.map(({ key }) => key)].includes(requestedCalendarSource)) {
      return requestedCalendarSource;
    }

    return initialSession?.selectedCalendarKey || "extensionEvents";
  });
  const extensionEventsAvailable = bridgeStatus === "connected";
  const selectedCalendarSupportsFilters = ["extensionEvents", "unlvCalendar", "involvementCenter", "rebelSports"].includes(selectedCalendarKey);
  const selectedCalendarUsesSyncedFilters = ["unlvCalendar", "involvementCenter", "rebelSports"].includes(selectedCalendarKey);
  const hasSyncedCalendarFilters = bridgeStatus === "connected" && selectedCalendarUsesSyncedFilters;

  useEffect(() => {
    if (requestedCalendarSource && calendarOptions.some((option) => option.key === requestedCalendarSource)) {
      setSelectedCalendarKey(requestedCalendarSource);
    }
  }, [requestedCalendarSource]);

  useEffect(() => {
    if (selectedCalendarKey === "extensionEvents" && ["unsupported", "unavailable"].includes(bridgeStatus)) {
      setSelectedCalendarKey(DATA_FILES[0].key);
    }
  }, [selectedCalendarKey, bridgeStatus]);

  useEffect(() => {
    setUseSyncedCalendarFilters(true);
    setCalendarManualFilters([]);
    setCalendarFilterSearch("");
  }, [selectedCalendarKey]);

  useEffect(() => {
    if (selectedCalendarKey !== "involvementCenter") {
      setCalendarOrganizationDirectory([]);
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
          setCalendarOrganizationDirectory(names);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCalendarKey]);

  const baseCalendarEvents = selectedCalendarKey === "extensionEvents"
    ? normalizeBridgeCalendarEvents(bridgeState)
    : normalizeDatasetCalendarEvents(selectedCalendarKey, datasets);
  const availableCalendarFilters = selectedCalendarSupportsFilters
    ? selectedCalendarKey === "extensionEvents"
      ? Array.from(new Set(baseCalendarEvents.map((event) => event.sourceLabel).filter(Boolean)))
        .sort((left, right) => {
          const leftIndex = EXTENSION_EVENT_SOURCE_ORDER.indexOf(left);
          const rightIndex = EXTENSION_EVENT_SOURCE_ORDER.indexOf(right);
          const leftRank = leftIndex === -1 ? Number.POSITIVE_INFINITY : leftIndex;
          const rightRank = rightIndex === -1 ? Number.POSITIVE_INFINITY : rightIndex;

          if (leftRank !== rightRank) {
            return leftRank - rightRank;
          }

          return left.localeCompare(right);
        })
      : selectedCalendarKey === "unlvCalendar"
        ? ALL_INTERESTS
        : selectedCalendarKey === "rebelSports"
          ? ALL_SPORTS
          : calendarOrganizationDirectory.length
            ? calendarOrganizationDirectory
            : Array.from(
              new Set(
                (Array.isArray(datasets.involvementCenter) ? datasets.involvementCenter : [])
                  .map((item) => item?.organization)
                  .filter(Boolean)
              )
            ).sort((left, right) => left.localeCompare(right))
    : [];
  const syncedCalendarFilters = selectedCalendarKey === "unlvCalendar"
    ? bridgeState?.selectedInterests || []
    : selectedCalendarKey === "involvementCenter"
      ? bridgeState?.involvedClubs || []
      : selectedCalendarKey === "rebelSports"
        ? bridgeState?.selectedSports || []
        : [];
  const activeCalendarFilters = hasSyncedCalendarFilters && useSyncedCalendarFilters
    ? syncedCalendarFilters
    : calendarManualFilters;
  const visibleCalendarManualFilters = selectedCalendarKey === "involvementCenter"
    ? availableCalendarFilters
      .filter((filter) => !calendarManualFilters.includes(filter))
      .filter((filter) => filter.toLowerCase().includes(calendarFilterSearch.trim().toLowerCase()))
      .slice(0, 8)
    : availableCalendarFilters;
  const visibleCalendarEvents = selectedCalendarSupportsFilters && activeCalendarFilters.length
    ? baseCalendarEvents.filter((event) => {
      const eventFilterValue = selectedCalendarKey === "extensionEvents"
        ? event.sourceLabel
        : event.description;
      return activeCalendarFilters.includes(eventFilterValue);
    })
    : baseCalendarEvents;
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
  const isCanvasSourceVisible = !activeCalendarFilters.length || activeCalendarFilters.includes("Canvas");
  const shouldShowWeeklyDueSection = selectedCalendarKey === "extensionEvents"
    && bridgeStatus === "connected"
    && Boolean(bridgeState?.preferences?.canvasIntegration)
    && isCanvasSourceVisible;

  function toggleCalendarManualFilter(filter) {
    setCalendarManualFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter]
    );
    setCalendarFilterSearch("");
  }

  function toggleAllCalendarManualFilters() {
    setCalendarManualFilters((current) =>
      current.length === availableCalendarFilters.length ? [] : [...availableCalendarFilters]
    );
    setCalendarFilterSearch("");
  }

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
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const syncLayout = () => setIsWideMonthLayout(mediaQuery.matches);

    syncLayout();
    mediaQuery.addEventListener("change", syncLayout);
    return () => mediaQuery.removeEventListener("change", syncLayout);
  }, []);

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
      selectedCalendarKey,
      calendarView,
      weeklyScrollTop: weeklyScrollRef.current?.scrollTop ?? null,
      pageScrollY: window.scrollY,
    };

    window.sessionStorage.setItem(CALENDAR_SESSION_KEY, JSON.stringify(session));
  }, [currentMonth, selectedDateKey, selectedCalendarKey, calendarView]);

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
            className={`self-start ${BACK_HOME_BUTTON_CLASS}`}
          >
            Back Home
          </Link>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/20 bg-black/20 p-4 text-white shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4">
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

          {selectedCalendarSupportsFilters ? (
            <div className="rounded-[1.5rem] border border-white/15 bg-white/8 p-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Filters</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">
                      {selectedCalendarKey === "extensionEvents"
                        ? "Browse extension events by source"
                        : selectedCalendarKey === "unlvCalendar"
                          ? "Browse by interest"
                          : selectedCalendarKey === "involvementCenter"
                            ? "Browse by organization"
                            : "Browse by sport"}
                    </h2>
                  </div>
                  {hasSyncedCalendarFilters ? (
                    <label className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                      <input
                        type="checkbox"
                        checked={useSyncedCalendarFilters}
                        onChange={(event) => setUseSyncedCalendarFilters(event.target.checked)}
                      />
                      Use Synced Preferences
                    </label>
                  ) : null}
                </div>

                {hasSyncedCalendarFilters && useSyncedCalendarFilters ? (
                  <div className="rounded-[1.25rem] border border-white/15 bg-black/10 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Synced Filters</p>
                    <div className="flex flex-wrap gap-2">
                      {syncedCalendarFilters.length ? (
                        syncedCalendarFilters.map((filter) => (
                          <span
                            key={filter}
                            className="rounded-full border border-white/15 bg-white px-3 py-1 text-sm font-semibold text-stone-900"
                          >
                            {filter}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-white/70">
                          No synced {selectedCalendarKey === "unlvCalendar" ? "interests" : selectedCalendarKey === "involvementCenter" ? "organizations" : "sports"} found, so all events are shown.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.25rem] border border-white/15 bg-black/10 p-4">
                    <div className="flex flex-col gap-4">
                      {selectedCalendarKey === "involvementCenter" ? (
                        <SearchInput
                          value={calendarFilterSearch}
                          onChange={setCalendarFilterSearch}
                          placeholder="Search RSOs and organizations"
                        />
                      ) : null}
                      {selectedCalendarKey === "rebelSports" ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-[1rem] border border-white/10 bg-white/10 p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Men's Sports</p>
                            <div className="flex flex-wrap gap-2">
                              {availableCalendarFilters
                                .filter((sport) => !sport.startsWith("Women's"))
                                .map((sport) => (
                                  <FilterChip
                                    key={sport}
                                    active={calendarManualFilters.includes(sport)}
                                    onClick={() => toggleCalendarManualFilter(sport)}
                                  >
                                    {sport}
                                  </FilterChip>
                                ))}
                            </div>
                          </div>
                          <div className="rounded-[1rem] border border-white/10 bg-white/10 p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Women's Sports</p>
                            <div className="flex flex-wrap gap-2">
                              {availableCalendarFilters
                                .filter((sport) => sport.startsWith("Women's"))
                                .map((sport) => (
                                  <FilterChip
                                    key={sport}
                                    active={calendarManualFilters.includes(sport)}
                                    onClick={() => toggleCalendarManualFilter(sport)}
                                  >
                                    {sport}
                                  </FilterChip>
                                ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {calendarManualFilters.length ? (
                        <div>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                            Selected {selectedCalendarKey === "extensionEvents" ? "Sources" : selectedCalendarKey === "involvementCenter" ? "Organizations" : selectedCalendarKey === "rebelSports" ? "Sports" : "Filters"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {calendarManualFilters.map((filter) => (
                              <SelectedFilterPill
                                key={filter}
                                label={filter}
                                onRemove={() =>
                                  setCalendarManualFilters((current) => current.filter((item) => item !== filter))
                                }
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {selectedCalendarKey !== "rebelSports" ? (
                        <div className="flex flex-wrap gap-2">
                          {visibleCalendarManualFilters.map((filter) => (
                            <FilterChip
                              key={filter}
                              active={calendarManualFilters.includes(filter)}
                              onClick={() => toggleCalendarManualFilter(filter)}
                            >
                              {filter}
                            </FilterChip>
                          ))}
                          {!visibleCalendarManualFilters.length ? (
                            <p className="text-sm text-white/70">
                              {selectedCalendarKey === "involvementCenter"
                                ? "No organizations match your search."
                                : "No filters are available right now."}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                        {selectedCalendarKey === "extensionEvents" ? (
                          <button
                            type="button"
                            onClick={toggleAllCalendarManualFilters}
                            className="text-white/80 transition hover:text-white"
                          >
                            {calendarManualFilters.length === availableCalendarFilters.length ? "Clear All" : "Select All"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsCalendarFilterModalOpen(true)}
                            className="text-white/80 transition hover:text-white"
                          >
                            View All
                          </button>
                        )}
                        {calendarManualFilters.length && selectedCalendarKey !== "extensionEvents" ? (
                          <button
                            type="button"
                            onClick={() => setCalendarManualFilters([])}
                            className="text-[#ffb3b3] transition hover:text-white"
                          >
                            Clear All
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {selectedCalendarSupportsFilters ? (
        <ViewAllFiltersModal
          open={isCalendarFilterModalOpen}
          onClose={() => setIsCalendarFilterModalOpen(false)}
          title={
            selectedCalendarKey === "extensionEvents"
              ? "All Extension Event Sources"
              : selectedCalendarKey === "unlvCalendar"
                ? "All Interest Filters"
                : selectedCalendarKey === "involvementCenter"
                  ? "All Organization Filters"
                  : "All Sport Filters"
          }
          options={availableCalendarFilters}
          selectedValues={calendarManualFilters}
          onToggle={toggleCalendarManualFilter}
          onClearAll={() => setCalendarManualFilters([])}
          searchEnabled={selectedCalendarKey === "involvementCenter"}
          searchPlaceholder={selectedCalendarKey === "involvementCenter" ? "Search RSOs and organizations" : "Search filters"}
        />
      ) : null}

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
                            className={[
                              "truncate rounded-full px-2 py-0 text-[10px] font-medium leading-[1.15rem] max-[700px]:hidden",
                              selectedCalendarKey === "extensionEvents" && event.color ? "" : "bg-white/12 text-white/90",
                            ].join(" ")}
                            style={
                              selectedCalendarKey === "extensionEvents" && event.color
                                ? {
                                  backgroundColor: event.color,
                                  color: getEventForegroundColor(event.color),
                                }
                                : undefined
                            }
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
              className="mt-5 flex min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/8"
              style={{ height: "min(46rem, calc(100vh - 17.5rem))" }}
            >
              <div className="max-w-full flex-1 overflow-x-auto">
                <div className="flex min-h-0 min-w-[34rem] flex-col">
                  <div className="grid grid-cols-[0.8fr_0.95fr_0.95fr_1.3fr_0.95fr_1.1fr] border-b border-white/10 bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/65 max-[700px]:grid-cols-[0.95fr_0.95fr_1.4fr_1fr_1.15fr] max-[700px]:px-3 max-[600px]:grid-cols-[0.95fr_0.95fr_1.5fr_1fr_1.15fr]">
                    <span className="max-[700px]:hidden">Day</span>
                    <span>Date</span>
                    <span>Time</span>
                    <span>Event</span>
                    <span>Source</span>
                    <span>Location</span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="divide-y divide-white/10 bg-transparent">
                      {tableEvents.length ? (
                        tableEvents.map((event) => {
                          const dayLabel = getTableDayLabel(event.startDate);

                          return (
                            <button
                              key={event.id}
                              type="button"
                              onClick={() => setActiveModalEvent(event)}
                              className={[
                                "grid w-full grid-cols-[0.8fr_0.95fr_0.95fr_1.3fr_0.95fr_1.1fr] border-l-2 px-4 py-3 text-left text-sm text-white transition max-[700px]:grid-cols-[0.95fr_0.95fr_1.4fr_1fr_1.15fr] max-[700px]:px-3 max-[600px]:grid-cols-[0.95fr_0.95fr_1.5fr_1fr_1.15fr]",
                                dayLabel.isToday
                                  ? "border-l-white/60 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-white/14"
                                  : "border-l-transparent hover:bg-white/10",
                              ].join(" ")}
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
                <div className="sticky top-0 z-30">
                  <div className="grid grid-cols-[4rem_repeat(7,minmax(5.7rem,1fr))] border-b border-white/10 bg-white/10 backdrop-blur-md max-[600px]:grid-cols-[4rem_repeat(7,minmax(6rem,1fr))]">
                    <div className="sticky left-0 z-40 border-r border-white/10 bg-[rgba(17,17,17,0.94)] px-2 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/50 backdrop-blur-md">
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

                </div>

                {shouldShowWeeklyDueSection ? (
                  <div className="grid grid-cols-[4rem_repeat(7,minmax(5.7rem,1fr))] border-b border-white/10 bg-black/10 max-[600px]:grid-cols-[4rem_repeat(7,minmax(6rem,1fr))]">
                    <div className="sticky left-0 z-30 border-r border-white/10 bg-[rgba(17,17,17,0.94)] px-2 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/50 backdrop-blur-md">
                      Due
                    </div>
                    {weekDays.map((day) => {
                      const canvasAssignments = day.events
                        .filter((event) => isCanvasAssignmentEvent(event))
                        .sort((left, right) => left.startsAt - right.startsAt);

                      return (
                        <div
                          key={`${day.dateKey}-canvas-header`}
                          className={[
                            "min-h-[5.5rem] border-r border-white/10 px-2 py-3 last:border-r-0",
                            day.isToday ? "bg-[#8b0000]/10" : "",
                          ].join(" ")}
                        >
                          {canvasAssignments.length ? (
                            <div className="space-y-2">
                              {canvasAssignments.map((event) => {
                                const backgroundColor = event.color || "#3174ad";
                                const textColor = getEventForegroundColor(backgroundColor);

                                return (
                                  <button
                                    key={`${event.id}-header-due`}
                                    type="button"
                                    onClick={() => setActiveModalEvent(event)}
                                    className="w-full rounded-xl border border-white/10 px-2 py-2 text-left shadow-sm transition hover:brightness-110"
                                    style={{
                                      backgroundColor,
                                      color: textColor,
                                    }}
                                  >
                                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] opacity-80">
                                      {formatCalendarTimeRange(event)}
                                    </p>
                                    <p className="mt-1 line-clamp-2 text-xs font-semibold">{event.title}</p>
                                  </button>
                                );
                              })}
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
                ) : null}

                <div className="relative grid grid-cols-[4rem_repeat(7,minmax(5.7rem,1fr))] max-[600px]:grid-cols-[4rem_repeat(7,minmax(6rem,1fr))]">
                  <div className="sticky left-0 z-20 border-r border-white/10 bg-[rgba(17,17,17,0.9)] backdrop-blur-md">
                    {weekHours.map((hour) => (
                      <div
                        key={hour}
                        className="h-20 border-b border-white/10 px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/45 max-[850px]:text-[10px]"
                      >
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
                        const isCompactEvent = height <= 44;
                        const isTightEvent = height <= 56;

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
                            <p
                              className={[
                                "truncate font-semibold uppercase opacity-80",
                                isCompactEvent
                                  ? "text-[8px] tracking-[0.08em]"
                                  : isTightEvent
                                    ? "text-[9px] tracking-[0.1em]"
                                    : "text-[10px] tracking-[0.12em]",
                              ].join(" ")}
                            >
                              {timeLabel}
                            </p>
                            <p
                              className={[
                                "font-semibold leading-tight",
                                isCompactEvent
                                  ? "mt-0.5 line-clamp-1 text-[10px]"
                                  : isTightEvent
                                    ? "mt-0.5 line-clamp-2 text-[11px]"
                                    : "mt-1 line-clamp-2 text-xs",
                              ].join(" ")}
                            >
                              {buttonLabel}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

              </div>
            </div>
          ) : null}
        </section>

        {calendarView === "month" ? (
          <aside
            className="flex min-h-0 flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-stone-100/90 p-6 text-stone-900 shadow-xl"
            style={
              calendarPanelHeight
                ? isWideMonthLayout
                  ? { height: `${calendarPanelHeight}px` }
                  : { maxHeight: `${calendarPanelHeight}px` }
                : undefined
            }
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
            className={`self-start sm:self-auto ${BACK_HOME_BUTTON_CLASS}`}
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
  const [newsFeed, setNewsFeed] = useState([]);
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

  useEffect(() => {
    const loadNewsFeed = async () => {
      try {
        const response = await fetch(UNLV_TODAY_FILE.path);
        if (!response.ok) {
          throw new Error(`Failed to load ${UNLV_TODAY_FILE.path}`);
        }

        const payload = await response.json();
        setNewsFeed(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error(error);
      }
    };

    loadNewsFeed();
  }, []);

  useEffect(() => {
    const seo = getSeoConfig(location.pathname);
    const canonicalUrl = `${SITE_URL}${seo.path}`;

    document.title = seo.title;
    upsertMetaTag('meta[name="description"]', { name: "description" }, seo.description);
    upsertMetaTag('meta[name="keywords"]', { name: "keywords" }, seo.keywords);
    upsertMetaTag('meta[property="og:title"]', { property: "og:title" }, seo.title);
    upsertMetaTag('meta[property="og:description"]', { property: "og:description" }, seo.description);
    upsertMetaTag('meta[property="og:url"]', { property: "og:url" }, canonicalUrl);
    upsertMetaTag('meta[property="og:image"]', { property: "og:image" }, DEFAULT_OG_IMAGE);
    upsertMetaTag('meta[name="twitter:title"]', { name: "twitter:title" }, seo.title);
    upsertMetaTag('meta[name="twitter:description"]', { name: "twitter:description" }, seo.description);
    upsertMetaTag('meta[name="twitter:image"]', { name: "twitter:image" }, DEFAULT_OG_IMAGE);
    upsertCanonicalLink(canonicalUrl);
  }, [location.pathname]);

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
                  newsFeed={newsFeed}
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
