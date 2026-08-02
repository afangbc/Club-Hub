import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SCHOOL, type Role, type Session } from "./campus-data";

type Account = {
  name: string;
  email: string;
  role: Role;
  password: string;
};

type State = {
  session: Session | null;
  joined: boolean;
  myClubs: string[];
  pending: string[];
  ready: boolean;
  signIn: (email: string, password: string) => string | null;
  signUp: (s: Omit<Session, "schoolId"> & { password: string }) => string | null;
  signOut: () => void;
  joinSchool: (code: string) => boolean;
  joinClub: (id: string) => void;
  leaveClub: (id: string) => void;
  requestClub: (id: string) => void;
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
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify({ session, accounts, joined, myClubs, pending }));
  }, [ready, session, accounts, joined, myClubs, pending]);

  const value = useMemo<State>(
    () => ({
      session,
      joined,
      myClubs,
      pending,
      ready,
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
    }),
    [session, accounts, joined, myClubs, pending, ready],
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