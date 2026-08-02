import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { clubById } from "@/lib/campus-data";
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
  const { myClubs, events: allEvents } = useSession();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const events = useMemo(
    () => allEvents.filter((e) => myClubs.includes(e.clubId)),
    [myClubs, allEvents],
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

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Meetings from your clubs only — nothing you didn't join.
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

      {myClubs.length === 0 && (
        <div className="card-surface mt-6 p-8 text-center text-sm text-muted-foreground">
          Your calendar fills in as you join clubs.{" "}
          <Link to="/clubs" className="font-semibold text-foreground underline">
            Browse the directory
          </Link>
          .
        </div>
      )}

      <div className="card-surface mt-6 overflow-hidden">
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
                    <div
                      key={e.id}
                      title={`${e.title} · ${e.start}–${e.end} · ${e.location}`}
                      className="rounded bg-accent px-1.5 py-1 text-[11px] leading-tight text-accent-foreground"
                    >
                      <p className="truncate font-semibold">{e.title}</p>
                      <p className="truncate opacity-75">{e.start}</p>
                    </div>
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
                <div
                  key={e.id}
                  className="card-surface flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm"
                >
                  <span className="w-20 shrink-0 text-xs font-semibold uppercase text-muted-foreground">
                    {new Date(`${e.date}T12:00:00`).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="font-semibold">{e.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {clubById(e.clubId)?.name} · {e.location}
                  </span>
                  <span className="ml-auto text-xs">
                    {e.start} – {e.end}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}