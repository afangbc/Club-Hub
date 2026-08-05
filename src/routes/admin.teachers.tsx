import { createFileRoute } from "@tanstack/react-router";
import { Check, RotateCcw, Trophy, Users, X } from "lucide-react";
import { useState } from "react";
import { SCHOOL, roleLabel, type StaffAccount } from "@/lib/campus-data";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/admin/teachers")({
  head: () => ({
    meta: [
      { title: "Staff Accounts — ClubHub Admin" },
      {
        name: "description",
        content:
          "Approve or decline the teachers and admins requesting a staff account on your campus ClubHub.",
      },
      { property: "og:title", content: "Staff Accounts — ClubHub Admin" },
      { property: "og:description", content: "Decide who gets to sponsor a club." },
    ],
  }),
  component: AdminStaff,
});

function AdminStaff() {
  const { session, staff, clubs, teams, reviewStaff } = useSession();
  const [error, setError] = useState("");

  const waiting = staff.filter((s) => s.status === "pending");
  const active = staff.filter((s) => s.status === "active");
  const declined = staff.filter((s) => s.status === "denied");

  const review = async (userId: string, approve: boolean) => {
    setError((await reviewStaff(userId, approve)) ?? "");
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl">Staff accounts</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Anyone with an @{SCHOOL.staffDomain} address can request a teacher or admin account. They
        stay locked out of the staff consoles until you approve them here.
      </p>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <h2 className="mt-8 text-2xl">
        Waiting on you{" "}
        {waiting.length > 0 && <span className="text-brand">({waiting.length})</span>}
      </h2>
      {waiting.length === 0 ? (
        <p className="card-surface mt-3 p-6 text-center text-sm text-muted-foreground">
          No staff accounts are pending. You're all caught up.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {waiting.map((s) => (
            <li key={s.id} className="card-surface flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-52 flex-1">
                <p className="text-lg font-semibold leading-tight">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.email} · {roleLabel[s.role]}
                  {s.department ? ` · ${s.department}` : ""}
                </p>
                {s.note && <p className="mt-2 text-sm">{s.note}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => void review(s.id, true)}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Check className="size-4" /> Approve
                </button>
                <button
                  onClick={() => void review(s.id, false)}
                  className="flex items-center gap-1.5 rounded-md border border-input px-3 py-2 text-sm font-semibold hover:bg-secondary"
                >
                  <X className="size-4" /> Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 text-2xl">Approved staff</h2>
      <ul className="mt-3 space-y-2">
        {active.map((s) => (
          <Row
            key={s.id}
            staff={s}
            clubs={clubs.filter((club) => club.sponsorId === s.id).map((club) => club.name)}
            teams={teams.filter((team) => team.sponsorId === s.id).map((team) => team.name)}
            action={
              s.id === session?.id ? null : (
                <button
                  onClick={() => void review(s.id, false)}
                  className="rounded-md border border-input px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                >
                  Revoke
                </button>
              )
            }
          />
        ))}
      </ul>

      {declined.length > 0 && (
        <>
          <h2 className="mt-10 text-2xl">Declined</h2>
          <ul className="mt-3 space-y-2">
            {declined.map((s) => (
              <Row
                key={s.id}
                staff={s}
                clubs={[]}
                teams={[]}
                action={
                  <button
                    onClick={() => void review(s.id, true)}
                    className="flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                  >
                    <RotateCcw className="size-3.5" /> Reinstate
                  </button>
                }
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Row({
  staff,
  clubs,
  teams,
  action,
}: {
  staff: StaffAccount;
  clubs: string[];
  teams: string[];
  action: React.ReactNode;
}) {
  return (
    <li className="card-surface grid gap-4 px-4 py-4 sm:grid-cols-[minmax(190px,1fr)_minmax(260px,1.5fr)_auto] sm:items-center">
      <div>
        <p className="text-sm font-semibold">{staff.name}</p>
        <p className="text-xs text-muted-foreground">
          {staff.email} · {roleLabel[staff.role]}
        </p>
      </div>
      <div className="space-y-2">
        <Sponsorship icon={Users} label="Clubs" names={clubs} />
        <Sponsorship icon={Trophy} label="Teams" names={teams} />
      </div>
      {action}
    </li>
  );
}

function Sponsorship({ icon: Icon, label, names }: { icon: typeof Users; label: string; names: string[] }) {
  return <div className="flex items-start gap-2"><Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><div className="mt-1 flex flex-wrap gap-1.5">{names.length ? names.map((name) => <span key={name} className="rounded-full bg-secondary px-2 py-1 text-xs font-medium">{name}</span>) : <span className="text-xs text-muted-foreground">None</span>}</div></div></div>;
}
