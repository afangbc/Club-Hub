import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { ClockField, SelectField, TextField } from "@/components/form-fields";
import { formatTime } from "@/lib/campus-data";
import { useSession } from "@/lib/session";
import { campusRooms, staffClubs } from "@/lib/staff";

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
      {
        property: "og:description",
        content: "Schedule club meetings straight to student calendars.",
      },
    ],
  }),
  component: Meetings,
});

function Meetings() {
  const { session, clubs, events, addEvent, removeEvent } = useSession();
  const mine = session ? staffClubs(clubs, session) : [];
  const ids = mine.map((c) => c.id);
  const [picked, setPicked] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("16:00");
  const [end, setEnd] = useState("17:00");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  if (!session) return null;
  const clubId = ids.includes(picked) ? picked : (mine[0]?.id ?? "");
  const list = events
    .filter((e) => ids.includes(e.clubId))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (mine.length === 0) return <NoClubs />;

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="card-surface h-fit p-5">
        <h1 className="text-3xl leading-tight">Post a meeting</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          It lands on every member's calendar right away.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            if (!clubId || !title.trim() || !date || !location.trim()) {
              setOk("");
              setError("Pick a club and fill in title, date, and location.");
              return;
            }
            setBusy(true);
            const posted = title.trim();
            const problem = await addEvent({
              clubId,
              title: posted,
              date,
              start,
              end,
              location: location.trim(),
            });
            setBusy(false);
            setError(problem ?? "");
            setOk(problem ? "" : `"${posted}" posted.`);
            if (!problem) {
              setTitle("");
              setLocation("");
            }
          }}
        >
          <SelectField
            label="Club"
            value={clubId}
            onChange={setPicked}
            options={mine.map((c) => ({ value: c.id, label: c.name }))}
          />
          <TextField
            label="Title"
            value={title}
            onChange={setTitle}
            placeholder="General Meeting"
          />
          <TextField label="Date" value={date} onChange={setDate} type="date" />
          <div className="grid grid-cols-2 gap-3">
            <ClockField label="Start" value={start} onChange={setStart} />
            <ClockField label="End" value={end} onChange={setEnd} />
          </div>
          <TextField
            label="Location"
            value={location}
            onChange={setLocation}
            placeholder="C-214"
            suggestions={campusRooms(
              clubs,
              events.map((e) => e.location),
            )}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {ok && <p className="text-sm text-success">{ok}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Posting…" : "Post meeting"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-2xl">Scheduled meetings</h2>
        <ul className="mt-3 space-y-2">
          {list.map((e) => (
            <li key={e.id} className="card-surface flex items-center gap-4 p-3">
              <div className="w-24 shrink-0 text-xs font-semibold text-muted-foreground">
                {new Date(`${e.date}T12:00:00`).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {clubs.find((c) => c.id === e.clubId)?.name} · {formatTime(e.start)}–
                  {formatTime(e.end)} · {e.location}
                </p>
              </div>
              <button
                onClick={() => void removeEvent(e.id)}
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

function NoClubs() {
  return (
    <div className="card-surface mx-auto max-w-lg p-10 text-center">
      <h1 className="text-3xl">No clubs to schedule</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Meetings belong to a club, and you don't sponsor one yet.
      </p>
      <Link
        to="/manage"
        className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Create a club
      </Link>
    </div>
  );
}
