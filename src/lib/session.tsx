import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CLUBS,
  EVENTS,
  ROSTER_REQUESTS,
  SCHOOL,
  type Club,
  type ClubEvent,
  type JoinRequest,
  type Role,
  type Session,
} from "./campus-data";

type Account = {
  name: string;
  email: string;
  role: Role;
  password: string;
};

export type Prefs = {
  eventReminders: boolean;
  announcements: boolean;
  weeklyDigest: boolean;
  calendarSync: boolean;
  directoryVisible: boolean;
};

const defaultPrefs: Prefs = {
  eventReminders: true,
  announcements: true,
  weeklyDigest: false,
  calendarSync: false,
  directoryVisible: true,
};

type State = {
  session: Session | null;
  joined: boolean;
  myClubs: string[];
  pending: string[];
  ready: boolean;
  prefs: Prefs;
  clubs: Club[];
  events: ClubEvent[];
  requests: JoinRequest[];
  signIn: (email: string, password: string) => string | null;
  signUp: (s: Omit<Session, "schoolId"> & { password: string }) => string | null;
  signOut: () => void;
  updateProfile: (p: { name: string; email: string }) => string | null;
  changePassword: (current: string, next: string, confirm: string) => string | null;
  setPref: (k: keyof Prefs, v: boolean) => void;
  deleteAccount: () => void;
  joinSchool: (code: string) => boolean;
  joinClub: (id: string) => void;
  leaveClub: (id: string) => void;
  requestClub: (id: string) => void;
  updateClub: (id: string, patch: Partial<Club>) => void;
  addEvent: (e: Omit<ClubEvent, "id">) => void;
  removeEvent: (id: string) => void;
  resolveRequest: (id: string, approve: boolean) => void;
};

const KEY = "clubhub.state.v1";
const Ctx = createContext<State | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [joined, setJoined] = useState(false);
  const [myClubs, setMyClubs] = useState<string[]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [overrides, setOverrides] = useState<Record<string, Partial<Club>>>({});
  const [extraEvents, setExtraEvents] = useState<ClubEvent[]>([]);
  const [removedEvents, setRemovedEvents] = useState<string[]>([]);
  const [resolved, setResolved] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        setSession(p.session ?? null);
        setAccounts(p.accounts ?? []);
        setJoined(!!p.joined);
        setMyClubs(p.myClubs ?? []);
        setPending(p.pending ?? []);
        setPrefs({ ...defaultPrefs, ...(p.prefs ?? {}) });
        setOverrides(p.overrides ?? {});
        setExtraEvents(p.extraEvents ?? []);
        setRemovedEvents(p.removedEvents ?? []);
        setResolved(p.resolved ?? []);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(
      KEY,
      JSON.stringify({
        session,
        accounts,
        joined,
        myClubs,
        pending,
        prefs,
        overrides,
        extraEvents,
        removedEvents,
        resolved,
      }),
    );
  }, [ready, session, accounts, joined, myClubs, pending, prefs, overrides, extraEvents, removedEvents, resolved]);

  const clubs = useMemo(() => CLUBS.map((c) => ({ ...c, ...(overrides[c.id] ?? {}) })), [overrides]);
  const events = useMemo(
    () => [...EVENTS, ...extraEvents].filter((e) => !removedEvents.includes(e.id)),
    [extraEvents, removedEvents],
  );
  const requests = useMemo(() => ROSTER_REQUESTS.filter((r) => !resolved.includes(r.id)), [resolved]);

  const value = useMemo<State>(
    () => ({
      session,
      joined,
      myClubs,
      pending,
      ready,
      prefs,
      clubs,
      events,
      requests,
      signIn: (email, password) => {
        const key = email.trim().toLowerCase();
        const acct = accounts.find((a) => a.email.toLowerCase() === key);
        if (!acct) return "No account found with that email. Sign up first.";
        if (acct.password !== password) return "Incorrect password.";
        setSession({ name: acct.name, email: acct.email, role: acct.role, schoolId: SCHOOL.id });
        return null;
      },
      signUp: ({ name, email, role, password }) => {
        const key = email.trim().toLowerCase();
        if (accounts.some((a) => a.email.toLowerCase() === key))
          return "An account with that email already exists. Sign in instead.";
        if (password.length < 6) return "Password must be at least 6 characters.";
        const acct: Account = { name: name.trim(), email: email.trim(), role, password };
        setAccounts((p) => [...p, acct]);
        setSession({ name: acct.name, email: acct.email, role, schoolId: SCHOOL.id });
        return null;
      },
      signOut: () => {
        setSession(null);
        setJoined(false);
        setMyClubs([]);
        setPending([]);
      },
      updateProfile: ({ name, email }) => {
        if (!session) return "Not signed in.";
        if (!name.trim() || !email.trim()) return "Name and email can't be empty.";
        const key = email.trim().toLowerCase();
        if (accounts.some((a) => a.email.toLowerCase() === key && a.email !== session.email))
          return "Another account already uses that email.";
        setAccounts((p) =>
          p.map((a) =>
            a.email === session.email ? { ...a, name: name.trim(), email: email.trim() } : a,
          ),
        );
        setSession({ ...session, name: name.trim(), email: email.trim() });
        return null;
      },
      changePassword: (current, next, confirm) => {
        if (!session) return "Not signed in.";
        const acct = accounts.find((a) => a.email === session.email);
        if (!acct) return "No stored account for this session.";
        if (acct.password !== current) return "Current password is incorrect.";
        if (next.length < 6) return "New password must be at least 6 characters.";
        if (next !== confirm) return "New passwords don't match.";
        setAccounts((p) => p.map((a) => (a.email === session.email ? { ...a, password: next } : a)));
        return null;
      },
      setPref: (k, v) => setPrefs((p) => ({ ...p, [k]: v })),
      deleteAccount: () => {
        if (session) setAccounts((p) => p.filter((a) => a.email !== session.email));
        setSession(null);
        setJoined(false);
        setMyClubs([]);
        setPending([]);
        setPrefs(defaultPrefs);
      },
      joinSchool: (code) => {
        const ok = code.trim().toUpperCase() === SCHOOL.joinCode;
        if (ok) setJoined(true);
        return ok;
      },
      joinClub: (id) => setMyClubs((p) => (p.includes(id) ? p : [...p, id])),
      leaveClub: (id) => {
        setMyClubs((p) => p.filter((c) => c !== id));
        setPending((p) => p.filter((c) => c !== id));
      },
      requestClub: (id) => setPending((p) => (p.includes(id) ? p : [...p, id])),
      updateClub: (id, patch) => setOverrides((p) => ({ ...p, [id]: { ...(p[id] ?? {}), ...patch } })),
      addEvent: (e) => setExtraEvents((p) => [...p, { ...e, id: `x${Date.now()}` }]),
      removeEvent: (id) => {
        setExtraEvents((p) => p.filter((e) => e.id !== id));
        setRemovedEvents((p) => (p.includes(id) ? p : [...p, id]));
      },
      resolveRequest: (id, approve) => {
        const req = ROSTER_REQUESTS.find((r) => r.id === id);
        if (approve && req)
          setOverrides((p) => {
            const base = CLUBS.find((c) => c.id === req.clubId);
            const current = p[req.clubId]?.members ?? base?.members ?? 0;
            return { ...p, [req.clubId]: { ...(p[req.clubId] ?? {}), members: current + 1 } };
          });
        setResolved((p) => (p.includes(id) ? p : [...p, id]));
      },
    }),
    [session, accounts, joined, myClubs, pending, ready, prefs, clubs, events, requests],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

export const roleLabel: Record<Role, string> = {
  student: "Student",
  teacher: "Teacher / Sponsor",
  admin: "School Admin",
};