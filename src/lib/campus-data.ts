/**
 * Shared contract between the browser and the server. Everything here is safe to
 * import from either side — the actual records live in the database behind
 * `src/server`, and these are the shapes the API hands back.
 */

export type Role = "student" | "teacher" | "admin";

/**
 * Students are active the moment they enter a campus code. Staff wait: teachers
 * on their school admin, admins on a ClubHub owner.
 */
export type AccountStatus = "active" | "pending" | "denied";

export type ClubCategory = "Academic" | "Service" | "Arts" | "STEM" | "Culture" | "Athletics";

export const CATEGORIES: ClubCategory[] = [
  "Academic",
  "STEM",
  "Service",
  "Arts",
  "Culture",
  "Athletics",
];

export const GRADES = ["9th", "10th", "11th", "12th"] as const;
export type Grade = (typeof GRADES)[number];

export type Session = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  grade?: string | undefined;
  /** False until the emailed six-digit code comes back. Gates everything. */
  emailVerified: boolean;
  /** Null until the account enters the campus access code. */
  schoolId: string | null;
  /**
   * True for the people who run ClubHub itself. Derived on the server from an
   * environment allowlist, never from anything stored or submitted, so no
   * sign-up path can hand it to itself.
   */
  owner: boolean;
};

// ------------------------------------------------------------ meeting schedule

/**
 * When a club meets. Stored as parts rather than prose so a sponsor picks
 * "Thursdays · 9:00 PM · every other week" instead of typing it, and so the
 * calendar and directory can render one consistent phrasing everywhere.
 */
export type MeetingSchedule = {
  frequency: Frequency;
  /** 0 = Sunday … 6 = Saturday. Ignored when the club meets daily. */
  weekday: number;
  /** 1st–4th, or 5 for "last". Only used by monthly clubs. */
  week: number;
  /** 0–23. Paired with `minute` this is a plain 24-hour clock time. */
  hour: number;
  minute: number;
};

export type Frequency = "weekly" | "biweekly" | "monthly" | "daily";

export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Every week" },
  { value: "biweekly", label: "Every other week" },
  { value: "monthly", label: "Once a month" },
  { value: "daily", label: "Every school day" },
];

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const WEEK_ORDINALS = ["1st", "2nd", "3rd", "4th", "Last"] as const;

export const defaultSchedule: MeetingSchedule = {
  frequency: "weekly",
  weekday: 2,
  week: 1,
  hour: 16,
  minute: 0,
};

/** Clamps anything that arrives off the wire into a schedule we can render. */
export function normalizeSchedule(input: Partial<MeetingSchedule> | undefined): MeetingSchedule {
  const whole = (value: unknown, min: number, max: number, fallback: number) => {
    const n = Math.trunc(Number(value));
    return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
  };
  const frequency = FREQUENCIES.some((f) => f.value === input?.frequency)
    ? (input?.frequency as Frequency)
    : defaultSchedule.frequency;
  return {
    frequency,
    weekday: whole(input?.weekday, 0, 6, defaultSchedule.weekday),
    week: whole(input?.week, 1, 5, defaultSchedule.week),
    hour: whole(input?.hour, 0, 23, defaultSchedule.hour),
    minute: whole(input?.minute, 0, 59, defaultSchedule.minute),
  };
}

/** 16, 15 → "4:15 PM". The whole app shows times in this one format. */
export function formatClock(hour: number, minute: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${String(minute).padStart(2, "0")} ${suffix}`;
}

/** "16:15" → "4:15 PM". Events store a 24-hour clock string. */
export function formatTime(value: string): string {
  const [h, m] = value.split(":");
  const hour = Number(h);
  const minute = Number(m);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
  return formatClock(hour, minute);
}

/** The one-line phrasing students read in the directory and on a club card. */
export function formatSchedule(schedule: MeetingSchedule): string {
  const time = formatClock(schedule.hour, schedule.minute);
  const day = WEEKDAYS[schedule.weekday] ?? WEEKDAYS[1];
  switch (schedule.frequency) {
    case "daily":
      return `Daily, ${time}`;
    case "biweekly":
      return `Every other ${day}, ${time}`;
    case "monthly":
      return `${WEEK_ORDINALS[schedule.week - 1] ?? "1st"} ${day} of the month, ${time}`;
    default:
      return `${day}s, ${time}`;
  }
}

export type Club = {
  id: string;
  name: string;
  category: ClubCategory;
  visibility: "public" | "private";
  sponsorId: string;
  sponsorName: string;
  sponsorEmail: string;
  room: string;
  schedule: MeetingSchedule;
  /** `formatSchedule(schedule)`, precomputed so every surface reads the same. */
  meets: string;
  members: number;
  blurb: string;
  joinInstructions?: string | undefined;
};

export type ClubEvent = {
  id: string;
  clubId: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  /** 24-hour "HH:MM" — run it through `formatTime` before showing it. */
  start: string;
  end: string;
  location: string;
};

export type Announcement = {
  id: string;
  clubId: string;
  title: string;
  body: string;
  author: string;
  postedAt: string; // ISO yyyy-mm-dd
};

/** A student waiting on a sponsor to let them into a private club. */
export type JoinRequest = {
  id: string;
  clubId: string;
  studentName: string;
  email: string;
  grade: string;
  note: string;
};

export type StaffAccount = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  department?: string | undefined;
  note?: string | undefined;
};

/** Safe account details an admin may view for everyone enrolled at the school. */
export type SchoolAccount = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  grade?: string | undefined;
};

/** Just enough about a school to pick it from a list before you belong to it. */
export type SchoolSummary = {
  id: string;
  name: string;
  district: string;
  mascot: string;
};

/** Owner-only view of a school, including the code that lets people in. */
export type SchoolDetail = SchoolSummary & {
  joinCode: string;
  admins: number;
  students: number;
  clubs: number;
};

export type AdminRequestStatus = "pending" | "approved" | "denied";

/**
 * Somebody asking to run a campus. Only a ClubHub owner can approve one — that
 * is the whole point of the queue.
 */
export type AdminRequest = {
  id: string;
  schoolId: string;
  schoolName: string;
  name: string;
  email: string;
  /** Why they should be trusted with the campus — their words. */
  message: string;
  status: AdminRequestStatus;
  createdAt: string;
  decidedAt?: string | undefined;
};

export type Prefs = {
  eventReminders: boolean;
  announcements: boolean;
  weeklyDigest: boolean;
  calendarSync: boolean;
  directoryVisible: boolean;
};

export const defaultPrefs: Prefs = {
  eventReminders: true,
  announcements: true,
  weeklyDigest: false,
  calendarSync: false,
  directoryVisible: true,
};

export const SCHOOL = {
  name: "Frisco High School",
  mascot: "Raccoons",
  district: "Frisco ISD",
  studentDomain: "k12.friscoisd.org",
  staffDomain: "friscoisd.org",
  /** Only the seed value — an admin can rotate the live code from the console. */
  defaultJoinCode: "RACCOONS26",
};

export const roleLabel: Record<Role, string> = {
  student: "Student",
  teacher: "Teacher / Sponsor",
  admin: "School Admin",
};

/**
 * Frisco ISD hands students a k12 mailbox and staff a district mailbox, so the
 * domain is what tells a real sign-up apart from someone picking a role.
 */
export function emailProblem(email: string, role: Role): string | null {
  const value = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter your full school email address.";
  const domain = value.split("@")[1] ?? "";
  const personalDomains = new Set([
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "aol.com",
  ]);
  if (role === "admin" && personalDomains.has(domain))
    return "Admins must use an email address issued by their school or district.";
  if (role === "student" && !value.endsWith(`@${SCHOOL.studentDomain}`))
    return `Students sign in with their @${SCHOOL.studentDomain} address.`;
  if (role === "teacher" && !value.endsWith(`@${SCHOOL.staffDomain}`))
    return `Staff sign in with their @${SCHOOL.staffDomain} address.`;
  return null;
}

export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
    return "Password needs at least one letter and one number.";
  return null;
}

/**
 * Where a signed-in account belongs. No two roles share a landing page, and
 * both kinds of staff wait on someone before they get one at all: a teacher on
 * their school admin, an admin on a ClubHub owner.
 */
export function homeFor(
  session: Session | null,
):
  | "/"
  | "/clubs"
  | "/manage"
  | "/admin"
  | "/pending"
  | "/owner"
  | "/request-admin"
  | "/verify-email" {
  if (!session) return "/";
  // Nothing else happens until the address is proven — not even the owner console.
  if (!session.emailVerified) return "/verify-email";
  if (session.owner) return "/owner";
  if (session.role === "student") return "/clubs";
  // An admin has no campus until an owner grants them one.
  if (session.role === "admin" && !session.schoolId) return "/request-admin";
  if (session.status !== "active") return "/pending";
  return session.role === "admin" ? "/admin" : "/manage";
}
