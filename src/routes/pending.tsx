import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Clock, RefreshCw, ShieldX } from "lucide-react";
import { useEffect } from "react";
import { SCHOOL, homeFor, roleLabel } from "@/lib/campus-data";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/pending")({
  head: () => ({
    meta: [
      { title: "Waiting on approval — ClubHub" },
      {
        name: "description",
        content: "Your staff account is waiting for a school admin to approve it.",
      },
      { property: "og:title", content: "Waiting on approval — ClubHub" },
      { property: "og:description", content: "A school admin reviews every staff account." },
    ],
  }),
  component: Pending,
});

function Pending() {
  const { session, ready, signOut, refresh } = useSession();
  const navigate = useNavigate();
  const waiting = session ? session.role !== "student" && session.status !== "active" : false;

  useEffect(() => {
    if (!ready) return;
    if (!session) navigate({ to: "/", replace: true });
    else if (!waiting) navigate({ to: homeFor(session), replace: true });
  }, [ready, session, waiting, navigate]);

  if (!ready || !session || !waiting) return null;
  const denied = session.status === "denied";

  return (
    <div className="grid min-h-screen place-items-center bg-secondary px-6">
      <div className="card-surface w-full max-w-lg p-8 text-center">
        <span
          className={`mx-auto grid size-14 place-items-center rounded-full ${
            denied ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground"
          }`}
        >
          {denied ? <ShieldX className="size-7" /> : <Clock className="size-7" />}
        </span>
        <h1 className="mt-4 text-3xl">
          {denied ? "This account was declined" : "Waiting on a school admin"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {denied ? (
            <>
              A {SCHOOL.name} admin declined this staff account. Stop by the front office if you
              think that's a mistake — an admin can reinstate you in ClubHub.
            </>
          ) : (
            <>
              Hi {session.name} — your staff account for {SCHOOL.name} is in the admin queue. Once
              it's approved you can create clubs, post meetings, and send announcements.
            </>
          )}
        </p>
        <dl className="mt-6 grid gap-2 text-left text-sm">
          <div className="flex justify-between gap-4 border-b border-border pb-2">
            <dt className="text-muted-foreground">Account</dt>
            <dd className="font-semibold">{session.email}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border pb-2">
            <dt className="text-muted-foreground">Requested role</dt>
            <dd className="font-semibold">{roleLabel[session.role]}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className={`font-semibold ${denied ? "text-destructive" : ""}`}>
              {denied ? "Declined" : "Pending review"}
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {!denied && (
            <button
              onClick={() => void refresh()}
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="size-4" /> Check again
            </button>
          )}
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/", replace: true });
            }}
            className="rounded-md border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
