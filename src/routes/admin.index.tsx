import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, CalendarDays, Copy, RefreshCw, UserCog, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { TextField } from "@/components/form-fields";
import { SCHOOL } from "@/lib/campus-data";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Campus Console — ClubHub Admin" },
      {
        name: "description",
        content:
          "Issue the campus access code, review every club, and approve staff accounts for Frisco High School.",
      },
      { property: "og:title", content: "Campus Console — ClubHub Admin" },
      { property: "og:description", content: "Run ClubHub for your whole campus." },
    ],
  }),
  component: AdminHome,
});

const WORDS = ["RACCOONS", "FRISCO", "FIGHTING", "BLUEGOLD", "COONS"];

function randomCode() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  return `${word}${Math.floor(10 + Math.random() * 90)}`;
}

function AdminHome() {
  const {
    session,
    school,
    clubs,
    teams,
    events,
    announcements,
    staff,
    pendingStaff,
    schoolCode,
    updateSchoolCode,
  } = useSession();
  const [draft, setDraft] = useState(schoolCode);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  // The code is loaded asynchronously, so seed the input once it arrives.
  useEffect(() => {
    setDraft((d) => (d ? d : schoolCode));
  }, [schoolCode]);

  if (!session) return null;

  const save = async (code: string) => {
    if (busy) return;
    setBusy(true);
    setDraft(code);
    const error = await updateSchoolCode(code);
    setBusy(false);
    setCopied(false);
    setMsg(
      error
        ? { ok: false, text: error }
        : {
            ok: true,
            text: `Code is now ${code.toUpperCase()}. The old code stops working for new sign-ins.`,
          },
    );
  };

  return (
    <div>
      <h1 className="text-4xl">Campus console</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {school?.name ?? SCHOOL.name} · {school?.district ?? SCHOOL.district} — you control the access code, the club list, and who gets
        a sponsor account.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Building2} label="Clubs on campus" value={clubs.length} />
        <Stat
          icon={UserCog}
          label="Sponsors approved"
          value={staff.filter((s) => s.status === "active").length}
        />
        <Stat icon={Users} label="Staff awaiting review" value={pendingStaff.length} />
        <Stat icon={CalendarDays} label="Meetings / events" value={events.length} />
      </div>

      <section className="card-surface mt-6 p-5">
        <h2 className="text-2xl leading-tight">School access code</h2>
        <p className="mb-4 mt-1 text-xs text-muted-foreground">
          Students and teachers can't reach a single club until they enter this code. Rotate it at
          the start of a semester and nobody new can get in with the old one.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-primary px-4 py-2 font-display text-3xl tracking-[0.2em] text-primary-foreground">
            {schoolCode || "—"}
          </span>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(schoolCode);
              setCopied(true);
            }}
            className="flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-2 text-sm font-semibold hover:bg-accent"
          >
            <Copy className="size-4" /> {copied ? "Copied" : "Copy"}
          </button>
          <button
            disabled={busy}
            onClick={() => void save(randomCode())}
            className="flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-60"
          >
            <RefreshCw className="size-4" /> Generate new
          </button>
        </div>

        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save(draft);
          }}
        >
          <div className="min-w-52 flex-1">
            <TextField
              label="Set a custom code"
              value={draft}
              onChange={(v) => setDraft(v.toUpperCase())}
              placeholder={SCHOOL.defaultJoinCode}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            Save code
          </button>
        </form>
        {msg && (
          <p className={`mt-2 text-sm ${msg.ok ? "text-success" : "text-destructive"}`}>
            {msg.text}
          </p>
        )}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel
          to="/admin/teachers"
          title="Staff accounts"
          body={
            pendingStaff.length
              ? `${pendingStaff.length} staff ${pendingStaff.length === 1 ? "account is" : "accounts are"} waiting on you. Until you approve them they can't create a club.`
              : "Every staff account on campus is reviewed. New sign-ups land here."
          }
          cta="Review staff"
        />
        <Panel
          to="/admin/clubs"
          title="Club directory"
          body={`Create a club and hand it to a sponsor, rename one, fix meeting times, or pull a club that folded. ${clubs.length} clubs live right now.`}
          cta="Manage clubs"
        />
      </div>

      <section className="mt-8">
        <h2 className="text-2xl">Latest campus activity</h2>
        <ul className="mt-3 space-y-2">
          {announcements.slice(0, 5).map((a) => (
            <li
              key={a.id}
              className="card-surface flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm"
            >
              <span className="w-20 shrink-0 text-xs font-semibold uppercase text-muted-foreground">
                {new Date(`${a.postedAt}T12:00:00`).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="font-semibold">{a.title}</span>
              <span className="text-xs text-muted-foreground">
                {(a.clubId ? clubs.find((club) => club.id === a.clubId)?.name : teams.find((team) => team.id === a.teamId)?.name)} · {a.author}
              </span>
            </li>
          ))}
          {announcements.length === 0 && (
            <li className="card-surface p-6 text-center text-sm text-muted-foreground">
              No announcements posted yet.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="card-surface flex items-center gap-3 p-4">
      <span className="grid size-10 place-items-center rounded-md bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-display text-3xl leading-none">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Panel({
  to,
  title,
  body,
  cta,
}: {
  to: "/admin/teachers" | "/admin/clubs";
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <section className="card-surface flex flex-col p-5">
      <h2 className="text-2xl leading-tight">{title}</h2>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{body}</p>
      <Link
        to={to}
        className="mt-4 self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {cta}
      </Link>
    </section>
  );
}
