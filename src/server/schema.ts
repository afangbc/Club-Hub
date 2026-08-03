import {
  DEMO_PASSWORD,
  SCHOOL,
  defaultPrefs,
  type AccountStatus,
  type ClubCategory,
  type Prefs,
  type Role,
} from "@/lib/campus-data";
import { hashPassword } from "./crypto";

export const DB_VERSION = 2;

export type SchoolRecord = {
  id: string;
  name: string;
  mascot: string;
  district: string;
  joinCode: string;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  passwordHash: string;
  /** Null until the account enters the campus access code. */
  schoolId: string | null;
  grade?: string;
  department?: string;
  note?: string;
  prefs: Prefs;
  createdAt: string;
};

export type ClubRecord = {
  id: string;
  schoolId: string;
  name: string;
  category: ClubCategory;
  visibility: "public" | "private";
  sponsorId: string;
  room: string;
  meets: string;
  blurb: string;
  joinInstructions?: string;
  createdAt: string;
};

export type MembershipRecord = {
  id: string;
  clubId: string;
  userId: string;
  status: "member" | "pending";
  note: string;
  createdAt: string;
};

export type EventRecord = {
  id: string;
  clubId: string;
  title: string;
  date: string;
  start: string;
  end: string;
  location: string;
};

export type AnnouncementRecord = {
  id: string;
  clubId: string;
  title: string;
  body: string;
  authorId: string;
  postedAt: string;
};

export type SessionRecord = {
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type SchoolVerificationRecord = {
  userId: string;
  email: string;
  codeHash: string;
  expiresAt: string;
  sentAt: string;
  attempts: number;
  schoolName: string;
  mascot: string;
  district: string;
};

export type Database = {
  version: number;
  schools: SchoolRecord[];
  users: UserRecord[];
  clubs: ClubRecord[];
  memberships: MembershipRecord[];
  events: EventRecord[];
  announcements: AnnouncementRecord[];
  sessions: SessionRecord[];
  schoolVerifications: SchoolVerificationRecord[];
};

function day(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

const SCHOOL_ID = "sch-frisco-hs";

type SeedStaff = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  department: string;
  note?: string;
};

const STAFF: SeedStaff[] = [
  {
    id: "u-nguyen",
    name: "Alicia Nguyen",
    email: `alicia.nguyen@${SCHOOL.staffDomain}`,
    role: "admin",
    status: "active",
    department: "Assistant Principal · Student Activities",
  },
  {
    id: "u-alvarez",
    name: "Marcus Alvarez",
    email: `marcus.alvarez@${SCHOOL.staffDomain}`,
    role: "teacher",
    status: "active",
    department: "Career & Technical Education",
  },
  {
    id: "u-whitfield",
    name: "Dana Whitfield",
    email: `dana.whitfield@${SCHOOL.staffDomain}`,
    role: "teacher",
    status: "active",
    department: "Social Studies",
  },
  {
    id: "u-boateng",
    name: "Grace Boateng",
    email: `grace.boateng@${SCHOOL.staffDomain}`,
    role: "teacher",
    status: "active",
    department: "English",
  },
  {
    id: "u-deleon",
    name: "Hector Deleon",
    email: `hector.deleon@${SCHOOL.staffDomain}`,
    role: "teacher",
    status: "active",
    department: "Fine Arts",
  },
  {
    id: "u-reed",
    name: "Terrence Reed",
    email: `terrence.reed@${SCHOOL.staffDomain}`,
    role: "teacher",
    status: "active",
    department: "Athletics",
  },
  {
    id: "u-raman",
    name: "Priya Raman",
    email: `priya.raman@${SCHOOL.staffDomain}`,
    role: "teacher",
    status: "pending",
    department: "Science",
    note: "Wants to sponsor Science Olympiad this fall.",
  },
  {
    id: "u-salazar",
    name: "Owen Salazar",
    email: `owen.salazar@${SCHOOL.staffDomain}`,
    role: "teacher",
    status: "pending",
    department: "Fine Arts",
    note: "Taking over Theatre Tech Crew from Mr. Deleon.",
  },
  {
    id: "u-cho",
    name: "Bethany Cho",
    email: `bethany.cho@${SCHOOL.staffDomain}`,
    role: "teacher",
    status: "pending",
    department: "Business",
    note: "New to campus — DECA co-sponsor.",
  },
];

type SeedStudent = { id: string; name: string; handle: string; grade: string };

const STUDENTS: SeedStudent[] = [
  { id: "u-rivera", name: "Jordan Rivera", handle: "jordan.rivera.123", grade: "11th" },
  { id: "u-fitzgerald", name: "Maya Fitzgerald", handle: "maya.fitzgerald.204", grade: "11th" },
  { id: "u-park", name: "Devin Park", handle: "devin.park.088", grade: "12th" },
  { id: "u-brooks", name: "Aaliyah Brooks", handle: "aaliyah.brooks.317", grade: "10th" },
  { id: "u-trevino", name: "Elias Trevino", handle: "elias.trevino.451", grade: "11th" },
  { id: "u-iqbal", name: "Sana Iqbal", handle: "sana.iqbal.529", grade: "9th" },
  { id: "u-okafor", name: "Chidi Okafor", handle: "chidi.okafor.612", grade: "12th" },
  { id: "u-santos", name: "Lucia Santos", handle: "lucia.santos.733", grade: "10th" },
  { id: "u-nguyen-k", name: "Kai Nguyen", handle: "kai.nguyen.845", grade: "9th" },
  { id: "u-becker", name: "Ruth Becker", handle: "ruth.becker.190", grade: "11th" },
  { id: "u-haddad", name: "Omar Haddad", handle: "omar.haddad.276", grade: "12th" },
  { id: "u-white", name: "Sydney White", handle: "sydney.white.358", grade: "10th" },
];

type SeedClub = Omit<ClubRecord, "schoolId" | "createdAt">;

const CLUBS: SeedClub[] = [
  {
    id: "c-tsa",
    name: "Technology Student Association",
    category: "STEM",
    visibility: "public",
    sponsorId: "u-alvarez",
    room: "C-214",
    meets: "Tuesdays, 4:15 PM",
    blurb: "Compete in engineering, coding, and design events at region and state.",
  },
  {
    id: "c-nhs",
    name: "National Honor Society",
    category: "Service",
    visibility: "private",
    sponsorId: "u-whitfield",
    room: "Library",
    meets: "1st Thursday, 7:30 AM",
    blurb: "Scholarship, service, leadership, and character.",
    joinInstructions:
      "Requires a 3.6+ unweighted GPA and 20 logged service hours. Submit the interest form in the front office by Sept 15, then a sponsor will approve you here.",
  },
  {
    id: "c-robotics",
    name: "Robotics Team 4412",
    category: "STEM",
    visibility: "private",
    sponsorId: "u-alvarez",
    room: "Shop B",
    meets: "Mon/Wed, 4:00 PM",
    blurb: "Build season runs January through March. Tools, CAD, and drive team.",
    joinInstructions:
      "Attend one open build night, complete the shop safety quiz, then ask a captain to add you.",
  },
  {
    id: "c-debate",
    name: "Speech & Debate",
    category: "Academic",
    visibility: "public",
    sponsorId: "u-boateng",
    room: "A-108",
    meets: "Wednesdays, 4:00 PM",
    blurb: "LD, CX, and extemp. Novices welcome every semester.",
  },
  {
    id: "c-art",
    name: "Art Club",
    category: "Arts",
    visibility: "public",
    sponsorId: "u-deleon",
    room: "Art 2",
    meets: "Fridays, 3:45 PM",
    blurb: "Murals, print-making, and the spring student gallery.",
  },
  {
    id: "c-bsu",
    name: "Black Student Union",
    category: "Culture",
    visibility: "public",
    sponsorId: "u-reed",
    room: "D-101",
    meets: "2nd Monday, 4:00 PM",
    blurb: "Community, culture, and campus events all year.",
  },
  {
    id: "c-key",
    name: "Key Club",
    category: "Service",
    visibility: "public",
    sponsorId: "u-whitfield",
    room: "B-220",
    meets: "Thursdays, 4:00 PM",
    blurb: "Volunteer projects across Frisco ISD. Hours logged in app.",
  },
  {
    id: "c-hoops",
    name: "Varsity Basketball",
    category: "Athletics",
    visibility: "private",
    sponsorId: "u-reed",
    room: "Main Gym",
    meets: "Daily, 6:30 AM",
    blurb: "Team schedule, film sessions, and travel details.",
    joinInstructions: "Roster only. Coach Reed gives rostered players a team access code.",
  },
];

/** `[clubId, userId, status, note]` */
const MEMBERSHIPS: [string, string, "member" | "pending", string][] = [
  ["c-tsa", "u-rivera", "member", ""],
  ["c-tsa", "u-okafor", "member", ""],
  ["c-tsa", "u-santos", "member", ""],
  ["c-tsa", "u-becker", "member", ""],
  ["c-key", "u-rivera", "member", ""],
  ["c-key", "u-white", "member", ""],
  ["c-key", "u-haddad", "member", ""],
  ["c-key", "u-fitzgerald", "member", ""],
  ["c-key", "u-nguyen-k", "member", ""],
  ["c-debate", "u-park", "member", ""],
  ["c-debate", "u-becker", "member", ""],
  ["c-debate", "u-nguyen-k", "member", ""],
  ["c-art", "u-santos", "member", ""],
  ["c-art", "u-white", "member", ""],
  ["c-bsu", "u-okafor", "member", ""],
  ["c-bsu", "u-brooks", "member", ""],
  ["c-bsu", "u-haddad", "member", ""],
  ["c-robotics", "u-okafor", "member", ""],
  ["c-robotics", "u-becker", "member", ""],
  ["c-nhs", "u-haddad", "member", ""],
  ["c-hoops", "u-park", "member", ""],
  ["c-nhs", "u-fitzgerald", "pending", "3.8 GPA, 24 service hours logged."],
  ["c-nhs", "u-park", "pending", "Interest form submitted Sept 12."],
  ["c-robotics", "u-brooks", "pending", "Attended open build night, safety quiz passed."],
  ["c-robotics", "u-iqbal", "pending", "CAD experience from middle school team."],
  ["c-hoops", "u-trevino", "pending", "Rostered guard, needs team code."],
];

const EVENTS: Omit<EventRecord, "id">[] = [
  {
    clubId: "c-tsa",
    title: "TSA General Meeting",
    date: day(0),
    start: "4:15 PM",
    end: "5:15 PM",
    location: "C-214",
  },
  {
    clubId: "c-debate",
    title: "Novice Practice Round",
    date: day(1),
    start: "4:00 PM",
    end: "5:30 PM",
    location: "A-108",
  },
  {
    clubId: "c-key",
    title: "Park Cleanup Sign-Up",
    date: day(2),
    start: "4:00 PM",
    end: "4:45 PM",
    location: "B-220",
  },
  {
    clubId: "c-art",
    title: "Mural Paint Day",
    date: day(3),
    start: "3:45 PM",
    end: "6:00 PM",
    location: "Art 2",
  },
  {
    clubId: "c-tsa",
    title: "Regional Prep Workshop",
    date: day(4),
    start: "4:15 PM",
    end: "6:00 PM",
    location: "C-214",
  },
  {
    clubId: "c-bsu",
    title: "BSU Community Night",
    date: day(5),
    start: "6:00 PM",
    end: "8:00 PM",
    location: "Cafeteria",
  },
  {
    clubId: "c-nhs",
    title: "Induction Rehearsal",
    date: day(6),
    start: "7:30 AM",
    end: "8:15 AM",
    location: "Auditorium",
  },
  {
    clubId: "c-robotics",
    title: "Open Build Night",
    date: day(7),
    start: "4:00 PM",
    end: "7:00 PM",
    location: "Shop B",
  },
  {
    clubId: "c-hoops",
    title: "Scrimmage vs. Wakeland",
    date: day(8),
    start: "6:30 PM",
    end: "8:30 PM",
    location: "Main Gym",
  },
  {
    clubId: "c-key",
    title: "Frisco ISD Service Fair",
    date: day(9),
    start: "9:00 AM",
    end: "12:00 PM",
    location: "Frisco Public Library",
  },
  {
    clubId: "c-debate",
    title: "Tournament Departure",
    date: day(11),
    start: "6:00 AM",
    end: "9:00 PM",
    location: "Bus Loop",
  },
  {
    clubId: "c-art",
    title: "Gallery Setup",
    date: day(13),
    start: "3:45 PM",
    end: "5:30 PM",
    location: "Commons",
  },
];

const ANNOUNCEMENTS: Omit<AnnouncementRecord, "id">[] = [
  {
    clubId: "c-tsa",
    title: "Region entry forms due Friday",
    body: "Pick your two competitive events and get the entry form signed before Friday. Late entries can't be added once region locks the roster.",
    authorId: "u-alvarez",
    postedAt: day(-1),
  },
  {
    clubId: "c-key",
    title: "Park cleanup needs 6 more volunteers",
    body: "Saturday morning at Frisco Commons, 8–11 AM. Counts for three service hours. Sign up at the meeting Thursday.",
    authorId: "u-whitfield",
    postedAt: day(-2),
  },
  {
    clubId: "c-debate",
    title: "Novice packet posted",
    body: "The September LD case packet is in the class folder. Read the aff and neg blocks before practice on Wednesday.",
    authorId: "u-boateng",
    postedAt: day(-3),
  },
  {
    clubId: "c-robotics",
    title: "Shop safety quiz retakes",
    body: "If you missed the safety quiz you can retake it during either lunch this week in Shop B. You can't touch tools until it's passed.",
    authorId: "u-alvarez",
    postedAt: day(-4),
  },
];

/**
 * Builds the starting database. Every demo account shares one password hash —
 * that is a seed-data shortcut, not how real sign-ups are stored; those each get
 * their own salt from `hashPassword`.
 */
export async function buildSeedDatabase(): Promise<Database> {
  const demoHash = await hashPassword(DEMO_PASSWORD);
  const now = new Date().toISOString();

  const users: UserRecord[] = [
    ...STAFF.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.role,
      status: s.status,
      passwordHash: demoHash,
      // Pending teachers haven't gone through the code screen yet.
      schoolId: s.status === "active" ? SCHOOL_ID : null,
      department: s.department,
      ...(s.note ? { note: s.note } : {}),
      prefs: { ...defaultPrefs },
      createdAt: now,
    })),
    ...STUDENTS.map((s) => ({
      id: s.id,
      name: s.name,
      email: `${s.handle}@${SCHOOL.studentDomain}`,
      role: "student" as const,
      status: "active" as const,
      passwordHash: demoHash,
      schoolId: SCHOOL_ID,
      grade: s.grade,
      prefs: { ...defaultPrefs },
      createdAt: now,
    })),
  ];

  return {
    version: DB_VERSION,
    schools: [{
      id: SCHOOL_ID,
      name: SCHOOL.name,
      mascot: SCHOOL.mascot,
      district: SCHOOL.district,
      joinCode: SCHOOL.defaultJoinCode,
    }],
    users,
    clubs: CLUBS.map((c) => ({ ...c, schoolId: SCHOOL_ID, createdAt: now })),
    memberships: MEMBERSHIPS.map(([clubId, userId, status, note], i) => ({
      id: `m-seed-${i}`,
      clubId,
      userId,
      status,
      note,
      createdAt: now,
    })),
    events: EVENTS.map((e, i) => ({ ...e, id: `e-seed-${i}` })),
    announcements: ANNOUNCEMENTS.map((a, i) => ({ ...a, id: `a-seed-${i}` })),
    sessions: [],
    schoolVerifications: [],
  };
}
