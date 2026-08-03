import {
  CATEGORIES,
  defaultPrefs,
  emailProblem,
  passwordProblem,
  type Announcement,
  type Club,
  type ClubCategory,
  type ClubEvent,
  type JoinRequest,
  type Prefs,
  type Role,
  type Session,
  type StaffAccount,
} from "@/lib/campus-data";
import {
  clearFailures,
  currentUser,
  endAllSessions,
  endSession,
  recordFailure,
  startSession,
  throttled,
} from "./auth";
import { hashPassword, newId, verifyPassword } from "./crypto";
import type { ClubRecord, Database, UserRecord } from "./schema";
import { getDatabase, transaction } from "./store";

export type Result = { error: string | null };

const ok: Result = { error: null };
const fail = (error: string): Result => ({ error });

const norm = (value: string) => value.trim().toLowerCase();
const today = () => new Date().toISOString().slice(0, 10);

/** Deliberately vague so sign-in can't be used to enumerate real addresses. */
const BAD_CREDENTIALS = "That email and password don't match an account.";

export type AppState = {
  user: Session | null;
  prefs: Prefs;
  school: { name: string; mascot: string; district: string } | null;
  clubs: Club[];
  events: ClubEvent[];
  announcements: Announcement[];
  myClubs: string[];
  pending: string[];
  requests: JoinRequest[];
  staff: StaffAccount[];
  /** Admins only — nobody else is told the live campus code. */
  schoolCode: string;
};

// ---------------------------------------------------------------- projections

function toSession(user: UserRecord): Session {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    ...(user.grade === undefined ? {} : { grade: user.grade }),
    schoolId: user.schoolId,
  };
}

function toClub(db: Database, club: ClubRecord): Club {
  const sponsor = db.users.find((u) => u.id === club.sponsorId);
  return {
    id: club.id,
    name: club.name,
    category: club.category,
    visibility: club.visibility,
    sponsorId: club.sponsorId,
    sponsorName: sponsor?.name ?? "Unassigned",
    sponsorEmail: sponsor?.email ?? "",
    room: club.room,
    meets: club.meets,
    members: db.memberships.filter((m) => m.clubId === club.id && m.status === "member").length,
    blurb: club.blurb,
    ...(club.joinInstructions === undefined ? {} : { joinInstructions: club.joinInstructions }),
  };
}

// -------------------------------------------------------------- authorization

const isActiveStaff = (user: UserRecord) =>
  user.status === "active" && (user.role === "teacher" || user.role === "admin");

const isActiveAdmin = (user: UserRecord) => user.status === "active" && user.role === "admin";

/** Admins run the campus; a teacher only controls the clubs they sponsor. */
function canManage(user: UserRecord, club: ClubRecord): boolean {
  if (!isActiveStaff(user) || user.schoolId !== club.schoolId) return false;
  return user.role === "admin" || club.sponsorId === user.id;
}

/** Every mutation below starts here, so an unapproved account can never write. */
async function requireEnrolled(): Promise<
  { user: UserRecord; error: null } | { user: null; error: string }
> {
  const user = await currentUser();
  if (!user) return { user: null, error: "You're signed out. Sign in and try again." };
  if (!user.schoolId) return { user: null, error: "Enter your campus access code first." };
  if (user.role !== "student" && user.status !== "active")
    return { user: null, error: "A school admin hasn't approved this account yet." };
  return { user, error: null };
}

// ----------------------------------------------------------------- read model

export async function loadState(): Promise<AppState> {
  const db = await getDatabase();
  const user = await currentUser();

  const empty: AppState = {
    user: user ? toSession(user) : null,
    prefs: user?.prefs ?? { ...defaultPrefs },
    school: null,
    clubs: [],
    events: [],
    announcements: [],
    myClubs: [],
    pending: [],
    requests: [],
    staff: [],
    schoolCode: "",
  };

  // Not signed in, or signed in but not through the campus code screen yet.
  if (!user || user.schoolId !== db.school.id) return empty;
  // Staff waiting on approval get their own status back and nothing else.
  if (user.role !== "student" && user.status !== "active") return empty;

  const clubs = db.clubs.filter((c) => c.schoolId === db.school.id);
  const mine = db.memberships.filter((m) => m.userId === user.id);
  const myClubIds = mine.filter((m) => m.status === "member").map((m) => m.clubId);

  const manageable = clubs.filter((c) => canManage(user, c));
  const manageableIds = new Set(manageable.map((c) => c.id));

  const visibleAnnouncements = db.announcements.filter((a) => {
    if (user.role === "admin") return true;
    return myClubIds.includes(a.clubId) || manageableIds.has(a.clubId);
  });

  const requests: JoinRequest[] = db.memberships
    .filter((m) => m.status === "pending" && manageableIds.has(m.clubId))
    .map((m) => {
      const student = db.users.find((u) => u.id === m.userId);
      return {
        id: m.id,
        clubId: m.clubId,
        studentName: student?.name ?? "Unknown student",
        email: student?.email ?? "",
        grade: student?.grade ?? "—",
        note: m.note,
      };
    });

  const staff: StaffAccount[] = isActiveAdmin(user)
    ? db.users
        .filter((u) => u.role === "teacher" || u.role === "admin")
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          ...(u.department === undefined ? {} : { department: u.department }),
          ...(u.note === undefined ? {} : { note: u.note }),
        }))
    : [];

  return {
    user: toSession(user),
    prefs: user.prefs,
    school: { name: db.school.name, mascot: db.school.mascot, district: db.school.district },
    clubs: clubs.map((c) => toClub(db, c)),
    events: db.events.filter((e) => clubs.some((c) => c.id === e.clubId)),
    announcements: visibleAnnouncements
      .map((a) => ({
        id: a.id,
        clubId: a.clubId,
        title: a.title,
        body: a.body,
        author: db.users.find((u) => u.id === a.authorId)?.name ?? "Sponsor",
        postedAt: a.postedAt,
      }))
      .sort((a, b) => b.postedAt.localeCompare(a.postedAt)),
    myClubs: myClubIds,
    pending: mine.filter((m) => m.status === "pending").map((m) => m.clubId),
    requests,
    staff,
    schoolCode: isActiveAdmin(user) ? db.school.joinCode : "",
  };
}

// --------------------------------------------------------------------- access

export async function signUp(input: {
  name: string;
  email: string;
  role: Role;
  grade: string;
  password: string;
}): Promise<Result> {
  const name = input.name.trim();
  const email = input.email.trim();
  if (!name) return fail("Enter your full name.");

  const roles: Role[] = ["student", "teacher", "admin"];
  if (!roles.includes(input.role)) return fail("Pick a role.");

  const emailError = emailProblem(email, input.role);
  if (emailError) return fail(emailError);

  const passwordError = passwordProblem(input.password);
  if (passwordError) return fail(passwordError);

  const passwordHash = await hashPassword(input.password);

  const created = await transaction((db) => {
    if (db.users.some((u) => norm(u.email) === norm(email))) return null;
    const user: UserRecord = {
      id: newId("usr"),
      name,
      email,
      role: input.role,
      // Staff wait on an admin; students are in as soon as they have the code.
      status: input.role === "student" ? "active" : "pending",
      passwordHash,
      schoolId: null,
      ...(input.role === "student" && input.grade ? { grade: input.grade } : {}),
      prefs: { ...defaultPrefs },
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return user;
  });

  if (!created) return fail("An account with that email already exists. Sign in instead.");
  await startSession(created.id);
  return ok;
}

export async function signIn(input: { email: string; password: string }): Promise<Result> {
  const key = norm(input.email);
  if (throttled(key)) return fail("Too many failed attempts. Wait 15 minutes and try again.");

  const db = await getDatabase();
  const user = db.users.find((u) => norm(u.email) === key);

  if (!user) {
    recordFailure(key);
    // Spend the same work as a real verification so timing doesn't reveal much.
    await hashPassword(input.password);
    return fail(BAD_CREDENTIALS);
  }

  if (!(await verifyPassword(input.password, user.passwordHash))) {
    recordFailure(key);
    return fail(BAD_CREDENTIALS);
  }

  if (user.status === "denied")
    return fail("A school admin declined this staff account. Contact the front office.");

  clearFailures(key);
  await startSession(user.id);
  return ok;
}

export async function signOut(): Promise<Result> {
  await endSession();
  return ok;
}

export async function joinSchool(input: { code: string }): Promise<Result> {
  const user = await currentUser();
  if (!user) return fail("You're signed out. Sign in and try again.");

  const db = await getDatabase();
  if (norm(input.code) !== norm(db.school.joinCode))
    return fail("That code doesn't match a campus. Ask your sponsor for the current one.");

  await transaction((next) => {
    const record = next.users.find((u) => u.id === user.id);
    if (record) record.schoolId = next.school.id;
  });
  return ok;
}

// -------------------------------------------------------------------- account

export async function updateProfile(input: { name: string; email: string }): Promise<Result> {
  const user = await currentUser();
  if (!user) return fail("You're signed out. Sign in and try again.");

  const name = input.name.trim();
  const email = input.email.trim();
  if (!name) return fail("Name can't be empty.");

  const emailError = emailProblem(email, user.role);
  if (emailError) return fail(emailError);

  return transaction((db) => {
    if (db.users.some((u) => u.id !== user.id && norm(u.email) === norm(email)))
      return fail("Another account already uses that email.");
    const record = db.users.find((u) => u.id === user.id);
    if (!record) return fail("Account not found.");
    record.name = name;
    record.email = email;
    return ok;
  });
}

export async function changePassword(input: {
  current: string;
  next: string;
  confirm: string;
}): Promise<Result> {
  const user = await currentUser();
  if (!user) return fail("You're signed out. Sign in and try again.");

  if (!(await verifyPassword(input.current, user.passwordHash)))
    return fail("Current password is incorrect.");

  const problem = passwordProblem(input.next);
  if (problem) return fail(problem);
  if (input.next !== input.confirm) return fail("New passwords don't match.");

  const passwordHash = await hashPassword(input.next);
  await transaction((db) => {
    const record = db.users.find((u) => u.id === user.id);
    if (record) record.passwordHash = passwordHash;
  });

  // Changing a password should log out anything holding the old session.
  await endAllSessions(user.id);
  await startSession(user.id);
  return ok;
}

export async function updatePref(input: { key: keyof Prefs; value: boolean }): Promise<Result> {
  const user = await currentUser();
  if (!user) return fail("You're signed out. Sign in and try again.");
  if (!(input.key in defaultPrefs)) return fail("Unknown preference.");

  await transaction((db) => {
    const record = db.users.find((u) => u.id === user.id);
    if (record) record.prefs = { ...record.prefs, [input.key]: input.value };
  });
  return ok;
}

export async function deleteAccount(): Promise<Result> {
  const user = await currentUser();
  if (!user) return fail("You're signed out. Sign in and try again.");

  const sponsored = await transaction((db) => {
    const owns = db.clubs.filter((c) => c.sponsorId === user.id);
    if (owns.length > 0) return owns.map((c) => c.name);

    db.users = db.users.filter((u) => u.id !== user.id);
    db.memberships = db.memberships.filter((m) => m.userId !== user.id);
    db.sessions = db.sessions.filter((s) => s.userId !== user.id);
    return [];
  });

  if (sponsored.length > 0)
    return fail(
      `Hand ${sponsored.join(", ")} to another sponsor before deleting your account — a school admin can reassign it.`,
    );

  await endSession();
  return ok;
}

// ----------------------------------------------------------------- membership

export async function joinClub(input: { clubId: string }): Promise<Result> {
  const { user, error } = await requireEnrolled();
  if (!user) return fail(error);

  return transaction((db) => {
    const club = db.clubs.find((c) => c.id === input.clubId && c.schoolId === user.schoolId);
    if (!club) return fail("That club no longer exists.");
    if (club.visibility !== "public") return fail("This club is private — send a request instead.");
    if (db.memberships.some((m) => m.clubId === club.id && m.userId === user.id)) return ok;

    db.memberships.push({
      id: newId("mem"),
      clubId: club.id,
      userId: user.id,
      status: "member",
      note: "",
      createdAt: new Date().toISOString(),
    });
    return ok;
  });
}

export async function requestClub(input: { clubId: string; note: string }): Promise<Result> {
  const { user, error } = await requireEnrolled();
  if (!user) return fail(error);

  return transaction((db) => {
    const club = db.clubs.find((c) => c.id === input.clubId && c.schoolId === user.schoolId);
    if (!club) return fail("That club no longer exists.");
    if (db.memberships.some((m) => m.clubId === club.id && m.userId === user.id)) return ok;

    db.memberships.push({
      id: newId("mem"),
      clubId: club.id,
      userId: user.id,
      status: "pending",
      note: input.note.trim().slice(0, 400),
      createdAt: new Date().toISOString(),
    });
    return ok;
  });
}

export async function leaveClub(input: { clubId: string }): Promise<Result> {
  const { user, error } = await requireEnrolled();
  if (!user) return fail(error);

  await transaction((db) => {
    db.memberships = db.memberships.filter(
      (m) => !(m.clubId === input.clubId && m.userId === user.id),
    );
  });
  return ok;
}

export async function reviewMembership(input: { id: string; approve: boolean }): Promise<Result> {
  const { user, error } = await requireEnrolled();
  if (!user) return fail(error);

  return transaction((db) => {
    const membership = db.memberships.find((m) => m.id === input.id);
    if (!membership) return fail("That request was already handled.");
    const club = db.clubs.find((c) => c.id === membership.clubId);
    if (!club || !canManage(user, club)) return fail("You don't sponsor that club.");

    if (input.approve) membership.status = "member";
    else db.memberships = db.memberships.filter((m) => m.id !== input.id);
    return ok;
  });
}

// ---------------------------------------------------------------------- clubs

export type ClubInput = {
  name: string;
  category: ClubCategory;
  visibility: "public" | "private";
  room: string;
  meets: string;
  blurb: string;
  joinInstructions: string;
  /** Admins may hand a new club straight to a sponsor; teachers always get themselves. */
  sponsorId: string;
};

function validateClubInput(input: ClubInput): string | null {
  if (!input.name.trim()) return "Give the club a name.";
  if (input.name.trim().length > 80) return "Club names have to be under 80 characters.";
  if (!CATEGORIES.includes(input.category)) return "Pick a category.";
  if (input.visibility !== "public" && input.visibility !== "private") return "Pick who can join.";
  if (!input.meets.trim() || !input.room.trim())
    return "Add a meeting time and a room so students know where to show up.";
  return null;
}

export async function createClub(input: ClubInput): Promise<Result> {
  const { user, error } = await requireEnrolled();
  if (!user) return fail(error);
  if (!isActiveStaff(user)) return fail("Only sponsors and admins can create clubs.");

  const problem = validateClubInput(input);
  if (problem) return fail(problem);

  return transaction((db) => {
    if (db.clubs.some((c) => c.schoolId === user.schoolId && norm(c.name) === norm(input.name)))
      return fail("A club with that name already exists on campus.");

    // Only an admin gets to name someone else as sponsor.
    let sponsorId = user.id;
    if (user.role === "admin" && input.sponsorId) {
      const sponsor = db.users.find((u) => u.id === input.sponsorId);
      if (!sponsor || !isActiveStaff(sponsor))
        return fail("Pick an approved sponsor for this club.");
      sponsorId = sponsor.id;
    }

    db.clubs.push({
      id: newId("clb"),
      schoolId: db.school.id,
      name: input.name.trim(),
      category: input.category,
      visibility: input.visibility,
      sponsorId,
      room: input.room.trim(),
      meets: input.meets.trim(),
      blurb: input.blurb.trim(),
      ...(input.joinInstructions.trim() ? { joinInstructions: input.joinInstructions.trim() } : {}),
      createdAt: new Date().toISOString(),
    });
    return ok;
  });
}

export async function updateClub(input: {
  id: string;
  patch: Partial<ClubInput>;
}): Promise<Result> {
  const { user, error } = await requireEnrolled();
  if (!user) return fail(error);

  return transaction((db) => {
    const club = db.clubs.find((c) => c.id === input.id);
    if (!club) return fail("That club no longer exists.");
    if (!canManage(user, club)) return fail("You don't sponsor that club.");

    const { patch } = input;

    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) return fail("Give the club a name.");
      if (
        db.clubs.some(
          (c) => c.id !== club.id && c.schoolId === club.schoolId && norm(c.name) === norm(name),
        )
      )
        return fail("A club with that name already exists on campus.");
      club.name = name;
    }
    if (patch.category !== undefined) {
      if (!CATEGORIES.includes(patch.category)) return fail("Pick a category.");
      club.category = patch.category;
    }
    if (patch.visibility !== undefined) {
      if (patch.visibility !== "public" && patch.visibility !== "private")
        return fail("Pick who can join.");
      club.visibility = patch.visibility;
    }
    if (patch.room !== undefined) club.room = patch.room.trim();
    if (patch.meets !== undefined) club.meets = patch.meets.trim();
    if (patch.blurb !== undefined) club.blurb = patch.blurb.trim();
    if (patch.joinInstructions !== undefined) {
      const text = patch.joinInstructions.trim();
      if (text) club.joinInstructions = text;
      else delete club.joinInstructions;
    }
    if (patch.sponsorId !== undefined && patch.sponsorId !== club.sponsorId) {
      if (user.role !== "admin") return fail("Only a school admin can reassign a sponsor.");
      const sponsor = db.users.find((u) => u.id === patch.sponsorId);
      if (!sponsor || !isActiveStaff(sponsor)) return fail("Pick an approved sponsor.");
      club.sponsorId = sponsor.id;
    }
    return ok;
  });
}

export async function deleteClub(input: { id: string }): Promise<Result> {
  const { user, error } = await requireEnrolled();
  if (!user) return fail(error);

  return transaction((db) => {
    const club = db.clubs.find((c) => c.id === input.id);
    if (!club) return ok;
    if (!canManage(user, club)) return fail("You don't sponsor that club.");

    db.clubs = db.clubs.filter((c) => c.id !== club.id);
    db.memberships = db.memberships.filter((m) => m.clubId !== club.id);
    db.events = db.events.filter((e) => e.clubId !== club.id);
    db.announcements = db.announcements.filter((a) => a.clubId !== club.id);
    return ok;
  });
}

// -------------------------------------------------------- meetings & bulletins

export async function createEvent(input: {
  clubId: string;
  title: string;
  date: string;
  start: string;
  end: string;
  location: string;
}): Promise<Result> {
  const { user, error } = await requireEnrolled();
  if (!user) return fail(error);

  if (!input.title.trim() || !input.location.trim())
    return fail("Pick a club and fill in title, date, and location.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return fail("Pick a valid date.");

  return transaction((db) => {
    const club = db.clubs.find((c) => c.id === input.clubId);
    if (!club) return fail("Pick a club.");
    if (!canManage(user, club)) return fail("You don't sponsor that club.");

    db.events.push({
      id: newId("evt"),
      clubId: club.id,
      title: input.title.trim(),
      date: input.date,
      start: input.start.trim() || "4:00 PM",
      end: input.end.trim() || "5:00 PM",
      location: input.location.trim(),
    });
    return ok;
  });
}

export async function deleteEvent(input: { id: string }): Promise<Result> {
  const { user, error } = await requireEnrolled();
  if (!user) return fail(error);

  return transaction((db) => {
    const event = db.events.find((e) => e.id === input.id);
    if (!event) return ok;
    const club = db.clubs.find((c) => c.id === event.clubId);
    if (!club || !canManage(user, club)) return fail("You don't sponsor that club.");
    db.events = db.events.filter((e) => e.id !== event.id);
    return ok;
  });
}

export async function createAnnouncement(input: {
  clubId: string;
  title: string;
  body: string;
}): Promise<Result> {
  const { user, error } = await requireEnrolled();
  if (!user) return fail(error);
  if (!input.title.trim() || !input.body.trim())
    return fail("Pick a club, then add a headline and a message.");

  return transaction((db) => {
    const club = db.clubs.find((c) => c.id === input.clubId);
    if (!club) return fail("Pick a club.");
    if (!canManage(user, club)) return fail("You don't sponsor that club.");

    db.announcements.push({
      id: newId("ann"),
      clubId: club.id,
      title: input.title.trim().slice(0, 120),
      body: input.body.trim().slice(0, 2000),
      authorId: user.id,
      postedAt: today(),
    });
    return ok;
  });
}

export async function deleteAnnouncement(input: { id: string }): Promise<Result> {
  const { user, error } = await requireEnrolled();
  if (!user) return fail(error);

  return transaction((db) => {
    const post = db.announcements.find((a) => a.id === input.id);
    if (!post) return ok;
    const club = db.clubs.find((c) => c.id === post.clubId);
    if (!club || !canManage(user, club)) return fail("You don't sponsor that club.");
    db.announcements = db.announcements.filter((a) => a.id !== post.id);
    return ok;
  });
}

// ------------------------------------------------------------- administration

export async function reviewStaff(input: { userId: string; approve: boolean }): Promise<Result> {
  const { user, error } = await requireEnrolled();
  if (!user) return fail(error);
  if (!isActiveAdmin(user)) return fail("Only a school admin can review staff accounts.");
  if (input.userId === user.id) return fail("You can't change your own approval.");

  return transaction((db) => {
    const target = db.users.find((u) => u.id === input.userId);
    if (!target) return fail("That account no longer exists.");
    if (target.role === "student") return fail("Students don't need approval.");

    target.status = input.approve ? "active" : "denied";
    if (!input.approve) {
      // A revoked sponsor shouldn't keep a live session.
      db.sessions = db.sessions.filter((s) => s.userId !== target.id);
    }
    return ok;
  });
}

export async function setSchoolCode(input: { code: string }): Promise<Result> {
  const { user, error } = await requireEnrolled();
  if (!user) return fail(error);
  if (!isActiveAdmin(user)) return fail("Only a school admin can change the campus code.");

  const code = input.code.trim().toUpperCase();
  if (code.length < 6) return fail("Codes need at least 6 characters.");
  if (!/^[A-Z0-9-]+$/.test(code)) return fail("Use letters, numbers, and dashes only.");

  await transaction((db) => {
    db.school.joinCode = code;
  });
  return ok;
}
