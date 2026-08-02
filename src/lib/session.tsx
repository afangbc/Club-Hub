import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SCHOOL, type Role, type Session } from "./campus-data";

type State = {
  session: Session | null;
  joined: boolean;
  myClubs: string[];
  pending: string[];
  ready: boolean;
  signIn: (s: Omit<Session, "schoolId">) => void;
  signOut: () => void;
  joinSchool: (code: string) => boolean;
  joinClub: (id: string) => void;
  leaveClub: (id: string) => void;
  requestClub: (id: string) => void;
};

const KEY = "clubhive.state.v1";
const Ctx = createContext<State | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
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
    localStorage.setItem(KEY, JSON.stringify({ session, joined, myClubs, pending }));
  }, [ready, session, joined, myClubs, pending]);

  const value = useMemo<State>(
    () => ({
      session,
      joined,
      myClubs,
      pending,
      ready,
      signIn: (s) => setSession({ ...s, schoolId: SCHOOL.id }),
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
    [session, joined, myClubs, pending, ready],
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