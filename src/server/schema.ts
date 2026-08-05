import {
  SCHOOL,
  type AccountStatus,
  type AdminRequestStatus,
  type ClubCategory,
  type MeetingSchedule,
  type Prefs,
  type Role,
} from "@/lib/campus-data";

export const DB_VERSION = 4;

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
  /** False until the six-digit code we mailed to `email` comes back. */
  emailVerified: boolean;
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
  /** Structured, so the app renders the phrasing instead of a sponsor typing it. */
  schedule: MeetingSchedule;
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
  /** 24-hour "HH:MM". */
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

/**
 * A live six-digit code. Only its hash is kept, so a database dump can't be
 * replayed to verify somebody else's address. One row per account — requesting
 * a new code replaces the old one.
 */
export type EmailVerificationRecord = {
  userId: string;
  /** The address the code was sent to, so changing your email invalidates it. */
  email: string;
  codeHash: string;
  expiresAt: string;
  sentAt: string;
  attempts: number;
};

/** An account asking a ClubHub owner to make it the admin of a campus. */
export type AdminRequestRecord = {
  id: string;
  userId: string;
  schoolId: string;
  message: string;
  status: AdminRequestStatus;
  createdAt: string;
  decidedAt?: string;
  /** The owner's user id, kept so a decision can be traced back to a person. */
  decidedBy?: string;
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
  adminRequests: AdminRequestRecord[];
  emailVerifications: EmailVerificationRecord[];
};

export const FRISCO_SCHOOL_ID = "sch-frisco-hs";

/**
 * The starting database: one real campus and nothing else.
 *
 * There are deliberately no seeded accounts, clubs, or meetings. Everything a
 * student sees is something a real person at the school created — an owner
 * approves the first admin, that admin approves sponsors, and sponsors build the
 * club list from there.
 */
export function buildSeedDatabase(): Database {
  return {
    version: DB_VERSION,
    schools: [
      {
        id: FRISCO_SCHOOL_ID,
        name: SCHOOL.name,
        mascot: SCHOOL.mascot,
        district: SCHOOL.district,
        joinCode: SCHOOL.defaultJoinCode,
      },
    ],
    users: [],
    clubs: [],
    memberships: [],
    events: [],
    announcements: [],
    sessions: [],
    adminRequests: [],
    emailVerifications: [],
  };
}
