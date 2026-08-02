import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Lock, Globe, Users } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/lib/session";
import { staffClubs } from "@/lib/staff";
import type { Club } from "@/lib/campus-data";

export const Route = createFileRoute("/manage/")({
  head: () => ({
    meta: [
      { title: "Sponsor Console — ClubHub Staff" },
      {
        name: "description",
        content:
          "The ClubHub console for club sponsors and school administrators: manage clubs, join requests, and meetings.",
      },
      { property: "og:title", content: "Sponsor Console — ClubHub Staff" },
      {
        property: "og:description",
        content: "Manage your clubs, approve members, and post meetings.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { session, clubs, events, requests } = useSession();
  if (!session) return null;
  const mine = staffClubs(clubs, session.role, session.name);
  const ids = mine.map((c) => c.id);
  const myRequests = requests.filter((r) => ids.includes(r.clubId));
  const myEvents = events.filter((e) => ids.includes(e.clubId));

  return (
    <div>
      <h1 className="text-4xl">
        {session.role === "admin" ? "Campus console" : "Sponsor console"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {session.role === "admin"
          ? "Every club at your school, and the requests waiting on a sponsor."
          : "The clubs you sponsor, their rosters, and their meetings."}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat icon={Users} label="Clubs managed" value={mine.length} />
        <Stat icon={Users} label="Pending requests" value={myRequests.length} />
        <Stat icon={CalendarDays} label="Scheduled meetings" value={myEvents.length} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/manage/requests"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Review requests
        </Link>
        <Link
          to="/manage/events"
          className="rounded-md border border-input bg-card px-4 py-2 text-sm font-semibold hover:bg-accent"
        >
          Post a meeting
        </Link>
      </div>

      <h2 className="mt-8 text-2xl">Your clubs</h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        {mine.map((c) => (
          <ClubEditor key={c.id} club={c} pending={requests.filter((r) => r.clubId === c.id).length} />
        ))}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
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

function ClubEditor({ club, pending }: { club: Club; pending: number }) {
  const { updateClub } = useSession();
  const [open, setOpen] = useState(false);
  const [meets, setMeets] = useState(club.meets);
  const [room, setRoom] = useState(club.room);
  const [blurb, setBlurb] = useState(club.blurb);
  const [instructions, setInstructions] = useState(club.joinInstructions ?? "");
  const [saved, setSaved] = useState(false);

  return (
    <article className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl leading-tight">{club.name}</h3>
          <p className="text-xs text-muted-foreground">
            {club.members} members · {pending} pending
          </p>
        </div>
        <button
          onClick={() =>
            updateClub(club.id, {
              visibility: club.visibility === "public" ? "private" : "public",
            })
          }
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            club.visibility === "public"
              ? "bg-accent text-accent-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {club.visibility === "public" ? <Globe className="size-3" /> : <Lock className="size-3" />}
          {club.visibility}
        </button>
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-3 w-full rounded-md border border-input py-2 text-sm font-semibold hover:bg-secondary"
      >
        {open ? "Close settings" : "Edit club settings"}
      </button>

      {open && (
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            updateClub(club.id, {
              meets,
              room,
              blurb,
              joinInstructions: instructions.trim() || undefined,
            });
            setSaved(true);
          }}
        >
          <Input label="Meeting time" value={meets} onChange={setMeets} />
          <Input label="Room" value={room} onChange={setRoom} />
          <Area label="Description" value={blurb} onChange={setBlurb} />
          <Area
            label="How to join (private clubs)"
            value={instructions}
            onChange={setInstructions}
          />
          {saved && <p className="text-sm text-success">Saved — students see this now.</p>}
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Save changes
          </button>
        </form>
      )}
    </article>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
      />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <textarea
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
      />
    </label>
  );
}