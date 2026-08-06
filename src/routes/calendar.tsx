import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarClock, Check, ChevronLeft, ChevronRight, Clock3, HelpCircle, MapPin, Users, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatTime, type ClubEvent, type EventRsvpStatus } from "@/lib/campus-data";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — ClubHub" },
      {
        name: "description",
        content: "One calendar with every meeting from the clubs and teams you belong to.",
      },
      { property: "og:title", content: "Calendar — ClubHub" },
      { property: "og:description", content: "Every club meeting you belong to, on one calendar." },
    ],
  }),
  component: () => (
    <AppShell>
      <CalendarPage />
    </AppShell>
  ),
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarPage() {
  const { session, myClubs, clubs, teams, events: allEvents, eventRsvps, setEventRsvp } = useSession();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const events = useMemo(
    () => allEvents.filter((event) => event.clubId ? myClubs.includes(event.clubId) : !!event.teamId && teams.some((team) => team.id === event.teamId)),
    [myClubs, teams, allEvents],
  );

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const lead = first.getDay();
    const out: (Date | null)[] = Array.from({ length: lead }, () => null);
    for (let i = 1; i <= daysInMonth; i++)
      out.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [cursor]);

  const key = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const shift = (n: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));
  const selected = events.find((event) => event.id === selectedId) ?? null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Meetings and events from your clubs and teams — nothing you didn't join.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="rounded-md border border-input p-2 hover:bg-secondary"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-40 text-center font-display text-2xl">
            {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </span>
          <button
            onClick={() => shift(1)}
            aria-label="Next month"
            className="rounded-md border border-input p-2 hover:bg-secondary"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {myClubs.length === 0 && teams.length === 0 && (
        <div className="card-surface mt-6 p-8 text-center text-sm text-muted-foreground">
          Your calendar fills in as you join clubs and teams.{" "}
          <Link to="/clubs" className="font-semibold text-foreground underline">
            Browse the directory
          </Link>
          .
        </div>
      )}

      <div className="card-surface mt-6 overflow-visible">
        <div className="grid grid-cols-7 border-b border-border bg-secondary">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayEvents = day ? events.filter((e) => e.date === key(day)) : [];
            const isToday = day && key(day) === key(today);
            return (
              <div
                key={i}
                className={`min-h-24 border-b border-r border-border p-1.5 last:border-r-0 ${
                  day ? "" : "bg-secondary/40"
                }`}
              >
                {day && (
                  <span
                    className={`inline-grid size-6 place-items-center rounded-full text-xs font-semibold ${
                      isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                )}
                <div className="mt-1 space-y-1">
                  {dayEvents.map((e) => (
                    <button
                      type="button"
                      key={e.id}
                      onClick={() => setSelectedId(e.id)}
                      aria-label={`Open details for ${e.title}`}
                      className="w-full rounded bg-accent px-1.5 py-1 text-left text-[11px] leading-tight text-accent-foreground transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <p className="truncate font-semibold">{e.title}</p>
                      <p className="truncate opacity-75">{formatTime(e.start)}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {events.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl">Agenda</h2>
          <div className="mt-3 space-y-2">
            {[...events]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((e) => (
                <button
                  type="button"
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className="card-surface flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left text-sm transition hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="w-20 shrink-0 text-xs font-semibold uppercase text-muted-foreground">
                    {new Date(`${e.date}T12:00:00`).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="font-semibold">{e.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {(e.clubId ? clubs.find((club) => club.id === e.clubId)?.name : teams.find((team) => team.id === e.teamId)?.name)} · {e.location}
                  </span>
                  <span className="ml-auto text-xs">
                    {formatTime(e.start)} – {formatTime(e.end)}
                  </span>
                </button>
              ))}
          </div>
        </section>
      )}
      <MeetingPanel
        event={selected}
        events={events}
        club={selected?.clubId ? clubs.find((club) => club.id === selected.clubId) : undefined}
        teamName={selected?.teamId ? teams.find((team) => team.id === selected.teamId)?.name : undefined}
        responses={selected ? eventRsvps.filter((rsvp) => rsvp.eventId === selected.id) : []}
        currentUserId={session?.id ?? ""}
        canRespond={session?.role === "student"}
        onRespond={(status) => selected ? setEventRsvp(selected.id, status) : Promise.resolve(null)}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

function MeetingPanel({
  event,
  events,
  club,
  teamName,
  responses,
  currentUserId,
  canRespond,
  onRespond,
  onClose,
}: {
  event: ClubEvent | null;
  events: ClubEvent[];
  club: ReturnType<typeof useSession>["clubs"][number] | undefined;
  teamName: string | undefined;
  responses: ReturnType<typeof useSession>["eventRsvps"];
  currentUserId: string;
  canRespond: boolean;
  onRespond: (status: EventRsvpStatus) => Promise<string | null>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState<EventRsvpStatus | null>(null);
  const [error, setError] = useState("");
  const conflicts = event
    ? events.filter(
        (candidate) =>
          candidate.id !== event.id &&
          candidate.date === event.date &&
          candidate.start < event.end &&
          candidate.end > event.start,
      )
    : [];
  const current = responses.find((response) => response.userId === currentUserId)?.status;
  const groups: { status: EventRsvpStatus; label: string; icon: typeof Check; active: string }[] = [
    { status: "going", label: "Going", icon: Check, active: "border-success bg-success/10 text-success" },
    { status: "maybe", label: "Maybe", icon: HelpCircle, active: "border-brand bg-brand/10 text-foreground" },
    { status: "not-going", label: "Can't go", icon: X, active: "border-destructive bg-destructive/10 text-destructive" },
  ];

  return (
    <Sheet open={!!event} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="top" className="max-h-[92vh] overflow-y-auto border-b-4 border-primary bg-background p-0">
        {event && (
          <div className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-8">
            <SheetHeader className="sr-only">
              <SheetTitle>{event.title}</SheetTitle>
              <SheetDescription>Meeting details and attendance responses</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/8 shadow-sm">
                {club?.logo ? (
                  <img src={club.logo} alt={`${club.name} logo`} className="size-full object-contain p-2" />
                ) : (
                  <span className="font-display text-4xl text-primary">{(club?.name ?? teamName ?? "E").charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{club?.name ?? teamName ?? "School event"}</p>
                <h2 className="mt-1 font-display text-4xl leading-tight sm:text-5xl">{event.title}</h2>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><CalendarClock className="size-4 text-primary" />{new Date(`${event.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
                  <span className="flex items-center gap-1.5"><Clock3 className="size-4 text-primary" />{formatTime(event.start)}–{formatTime(event.end)}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="size-4 text-primary" />{event.location}</span>
                </div>
              </div>
            </div>

            {event.description && (
              <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-xl font-semibold">Description</h3>
                <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              </section>
            )}

            <div className="mt-7 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
              <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2"><Users className="size-5 text-primary" /><h3 className="text-xl font-semibold">Can you make it?</h3></div>
                {canRespond ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {groups.map(({ status, label, icon: Icon, active }) => (
                      <button
                        key={status}
                        type="button"
                        disabled={!!busy}
                        onClick={async () => {
                          setBusy(status);
                          setError((await onRespond(status)) ?? "");
                          setBusy(null);
                        }}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:opacity-60 ${current === status ? active : "border-input bg-background hover:border-primary/50"}`}
                      >
                        <Icon className="size-4" /> {busy === status ? "Saving…" : label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Attendance responses are available to student accounts.</p>
                )}
                {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {groups.map(({ status, label, icon: Icon }) => {
                    const people = responses.filter((response) => response.status === status);
                    return (
                      <div key={status} className="rounded-lg bg-secondary/60 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"><Icon className="size-3.5 text-primary" />{label} · {people.length}</p>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{people.length ? people.map((person) => person.name).join(", ") : "No responses yet"}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className={`rounded-xl border p-5 shadow-sm ${conflicts.length ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}>
                <div className="flex items-center gap-2"><CalendarClock className={`size-5 ${conflicts.length ? "text-destructive" : "text-success"}`} /><h3 className="text-xl font-semibold">Schedule conflicts</h3></div>
                {conflicts.length ? (
                  <ul className="mt-3 space-y-2">
                    {conflicts.map((conflict) => (
                      <li key={conflict.id} className="rounded-lg border border-destructive/20 bg-card p-3">
                        <p className="text-sm font-semibold">{conflict.title}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(conflict.start)}–{formatTime(conflict.end)} · {conflict.location}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No other joined meetings overlap with this time.</p>
                )}
              </section>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
