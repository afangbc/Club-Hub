/**
 * Shared contract between the browser and the server. Everything here is safe to
 * import from either side — the actual records live in the database behind
 * `src/server`, and these are the shapes the API hands back.
 */

export type Role = "student" | "teacher" | "admin";

/** Teachers sign up, then wait on a school admin. Students and admins are active immediately. */
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
  /** Null until the account enters the campus access code. */
  schoolId: string | null;
};

export type Club = {
  id: string;
  name: string;
  category: ClubCategory;
  visibility: "public" | "private";
  sponsorId: string;
  sponsorName: string;
  sponsorEmail: string;
  room: string;
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

/** Seeded demo accounts all share this password so each role can be signed into. */
export const DEMO_PASSWORD = "raccoons26";

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
 * Where a signed-in account belongs — the three roles never share a landing
 * page, and staff wait on an admin before they get one at all.
 */
export function homeFor(
  session: Session | null,
): "/" | "/clubs" | "/manage" | "/admin" | "/pending" | "/create-school" {
  if (!session) return "/";
  if (session.role === "admin" && !session.schoolId) return "/create-school";
  if (session.role === "student") return "/clubs";
  if (session.status !== "active") return "/pending";
  return session.role === "admin" ? "/admin" : "/manage";
}
