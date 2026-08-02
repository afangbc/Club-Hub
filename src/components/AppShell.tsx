import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Compass, LogOut, Users } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { SCHOOL } from "@/lib/campus-data";
import { roleLabel, useSession } from "@/lib/session";

const nav = [
  { to: "/clubs", label: "Club Directory", icon: Compass },
  { to: "/my-clubs", label: "My Clubs", icon: Users },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { session, joined, ready, signOut } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && (!session || !joined)) navigate({ to: "/", replace: true });
  }, [ready, session, joined, navigate]);

  if (!ready || !session || !joined) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/clubs" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-brand font-display text-lg text-brand-foreground">
              N
            </span>
            <span className="font-display text-2xl leading-none">ClubHub</span>
          </Link>
          <span className="hidden text-xs uppercase tracking-widest opacity-70 sm:inline">
            {SCHOOL.name} · {SCHOOL.mascot}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{session.name}</p>
              <p className="text-xs opacity-70">{roleLabel[session.role]}</p>
            </div>
            <button
              onClick={() => {
                signOut();
                navigate({ to: "/", replace: true });
              }}
              aria-label="Sign out"
              className="rounded-md p-2 transition-colors hover:bg-primary-foreground/10"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-2">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeProps={{ className: "border-brand text-brand" }}
              inactiveProps={{ className: "border-transparent opacity-75 hover:opacity-100" }}
              className="flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-semibold"
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}