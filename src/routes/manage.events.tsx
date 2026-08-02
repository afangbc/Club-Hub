import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/lib/session";
import { staffClubs } from "@/lib/staff";

export const Route = createFileRoute("/manage/events")({
  head: () => ({
    meta: [
      { title: "Meetings — ClubHub Staff" },
      {
        name: "description",
        content:
          "Post, edit, and cancel meetings for the clubs you sponsor. Members see them on their calendar instantly.",
      },
      { property: "og:title", content: "Meetings — ClubHub Staff" },
      { property: "og:description", content: "Schedule club meetings straight to student calendars." },
    ],
  }),
  component: Meetings,
});

function Meetings() {
  const { session, clubs, events, addEvent, removeEvent } = useSession();
  const mine = session ? staffClubs(clubs, session.role, session.name) : [];
  const ids = mine.map((c) => c.id);
  const [clubId, setClubId] = useState(mine[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("4:00 PM");
  const [end, setEnd] = useState("5:00 PM");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  if (!session) return null;
  const list = events
    .filter((e) => ids.includes(e.clubId))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="card-surface h-fit p-5">
        <h1 className="text-3xl leading-tight">Post a meeting</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          It lands on every member's calendar right away.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!clubId || !title.trim() || !date || !location.trim()) {
              setOk("");
              return setError("Pick a club and fill in title, date, and location.");
            }
            addEvent({ clubId, title: title.trim(), date, start, end, location: location.trim() });
            setError("");
            setOk(`"${title.trim()}" posted.`);
            setTitle("");
            setLocation("");
          }}
        >
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Club
            </span>
            <select
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
            >
              {mine.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <Input label="Title" value={title} onChange={setTitle} placeholder="General Meeting" />
          <Input label="Date" value={date} onChange={setDate} type="date" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start" value={start} onChange={setStart} />
            <Input label="End" value={end} onChange={setEnd} />
          </div>
          <Input label="Location" value={location} onChange={setLocation} placeholder="C-214" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {ok && <p className="text-sm text-success">{ok}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Post meeting
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-2xl">Scheduled meetings</h2>
        <ul className="mt-3 space-y-2">
          {list.map((e) => (
            <li key={e.id} className="card-surface flex items-center gap-4 p-3">
              <div className="w-24 shrink-0 text-xs font-semibold text-muted-foreground">
                {e.date}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {clubs.find((c) => c.id === e.clubId)?.name} · {e.start}–{e.end} · {e.location}
                </p>
              </div>
              <button
                onClick={() => removeEvent(e.id)}
                aria-label={`Cancel ${e.title}`}
                className="rounded-md p-2 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
          {list.length === 0 && (
            <li className="card-surface p-6 text-center text-sm text-muted-foreground">
              Nothing scheduled yet.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
      />
    </label>
  );
}