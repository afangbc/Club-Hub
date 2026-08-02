import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarPlus, LayoutDashboard, LogOut, Settings, UserCheck } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { SCHOOL } from "@/lib/campus-data";
import { roleLabel, useSession } from "@/lib/session";

const nav = [
  { to: "/manage", label: "Dashboard", icon: LayoutDashboard },
  { to: "/manage/requests", label: "Requests", icon: UserCheck },
  { to: "/manage/events", label: "Meetings", icon: CalendarPlus },
] as const;

export function StaffShell({ children }: { children: ReactNode }) {
  const { session, joined, ready, signOut } = useSession();
  const navigate = useNavigate();
  const isStaff = session?.role === "teacher" || session?.role === "admin";

  useEffect(() => {
    if (!ready) return;
    if (!session || !joined) navigate({ to: "/", replace: true });
    else if (!isStaff) navigate({ to: "/clubs", replace: true });
  }, [ready, session, joined, isStaff, navigate]);

  if (!ready || !session || !joined || !isStaff) return null;

  return (
    <div className="min-h-screen bg-secondary">
      <header className="sticky top-0 z-30 border-b border-border bg-foreground text-background">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/manage" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-brand font-display text-lg text-brand-foreground">
              N
            </span>
            <span className="font-display text-2xl leading-none">
              ClubHub <span className="text-brand">Staff</span>
            </span>
          </Link>
          <span className="hidden text-xs uppercase tracking-widest opacity-60 sm:inline">
            {SCHOOL.name} console
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{session.name}</p>
              <p className="text-xs opacity-60">{roleLabel[session.role]}</p>
            </div>
            <Link
              to="/clubs"
              className="rounded-md border border-background/25 px-3 py-1.5 text-xs font-semibold hover:bg-background/10"
            >
              Student view
            </Link>
            <Link to="/account" aria-label="Account settings" className="rounded-md p-2 hover:bg-background/10">
              <Settings className="size-4" />
            </Link>
            <button
              onClick={() => {
                signOut();
                navigate({ to: "/", replace: true });
              }}
              aria-label="Sign out"
              className="rounded-md p-2 hover:bg-background/10"
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
              activeOptions={{ exact: n.to === "/manage" }}
              activeProps={{ className: "border-brand text-brand" }}
              inactiveProps={{ className: "border-transparent opacity-70 hover:opacity-100" }}
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