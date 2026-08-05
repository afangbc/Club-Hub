import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Clock, ShieldCheck, ShieldX } from "lucide-react";
import { useEffect, useState } from "react";
import { SelectField, TextArea } from "@/components/form-fields";
import { homeFor } from "@/lib/campus-data";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/request-admin")({
  head: () => ({
    meta: [
      { title: "Request admin access — ClubHub" },
      {
        name: "description",
        content:
          "Ask ClubHub for admin access to your school. Every campus admin is approved by hand.",
      },
      { property: "og:title", content: "Request admin access — ClubHub" },
      { property: "og:description", content: "Every campus admin is approved by hand." },
    ],
  }),
  component: RequestAdmin,
});

function RequestAdmin() {
  const { ready, session, schoolOptions, myAdminRequest, requestAdmin, signOut } = useSession();
  const navigate = useNavigate();
  const [schoolId, setSchoolId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Anyone who already has a campus, or was never an admin, belongs elsewhere.
  const waiting =
    session?.role === "admin" && session.emailVerified && !session.schoolId && !session.owner;

  useEffect(() => {
    if (!ready) return;
    if (!session) navigate({ to: "/", replace: true });
    else if (!waiting) navigate({ to: homeFor(session), replace: true });
  }, [ready, session, waiting, navigate]);

  if (!ready || !session || !waiting) return null;

  const picked = schoolOptions.some((s) => s.id === schoolId)
    ? schoolId
    : (schoolOptions[0]?.id ?? "");

  // Approval moves the account onto its campus, so a pending request is the only
  // state that keeps somebody on this screen.
  if (myAdminRequest?.status === "pending") {
    return (
      <Frame>
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-secondary text-muted-foreground">
          <Clock className="size-7" />
        </span>
        <h1 className="mt-4 text-3xl">Waiting on ClubHub</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We've got your request to run {myAdminRequest.schoolName}. A ClubHub owner reviews every
          one by hand — you'll get in as soon as it's approved.
        </p>
        <dl className="mt-6 grid gap-2 text-left text-sm">
          <Row term="Account" value={session.email} />
          <Row term="School" value={myAdminRequest.schoolName} />
          <Row
            term="Requested"
            value={new Date(myAdminRequest.createdAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          />
        </dl>
        <Footer onSignOut={signOut} />
      </Frame>
    );
  }

  return (
    <Frame>
      {myAdminRequest?.status === "denied" ? (
        <>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ShieldX className="size-7" />
          </span>
          <h1 className="mt-4 text-3xl">That request was declined</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A ClubHub owner turned down your request for {myAdminRequest.schoolName}. You can send
            another one with more detail about your role at the school.
          </p>
        </>
      ) : (
        <>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
            <ShieldCheck className="size-7" />
          </span>
          <h1 className="mt-4 text-3xl">Request admin access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Running a campus means approving every teacher on it and holding the access code, so
            nobody gets it by signing up. Tell us who you are and a ClubHub owner will review it.
          </p>
        </>
      )}

      {schoolOptions.length === 0 ? (
        <p className="mt-6 rounded-md bg-secondary px-3 py-4 text-sm text-muted-foreground">
          No schools are set up on ClubHub yet. A ClubHub owner has to add one before it can have an
          admin.
        </p>
      ) : (
        <form
          className="mt-6 space-y-4 text-left"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            const problem = await requestAdmin({ schoolId: picked, message });
            setBusy(false);
            setError(problem ?? "");
          }}
        >
          <SelectField
            label="School"
            value={picked}
            onChange={setSchoolId}
            options={schoolOptions.map((s) => ({
              value: s.id,
              label: `${s.name} · ${s.district}`,
            }))}
          />
          <TextArea
            label="Why you should run this campus"
            value={message}
            onChange={setMessage}
            rows={5}
            placeholder="Your role at the school, who can vouch for you, and what you'd use ClubHub for."
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send request"}
          </button>
        </form>
      )}
      <Footer onSignOut={signOut} />
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-secondary px-6 py-12">
      <div className="card-surface w-full max-w-lg p-8 text-center">{children}</div>
    </div>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2 last:border-0">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function Footer({ onSignOut }: { onSignOut: () => Promise<string | null> }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={async () => {
        await onSignOut();
        navigate({ to: "/", replace: true });
      }}
      className="mt-6 text-sm text-muted-foreground underline underline-offset-2"
    >
      Sign out
    </button>
  );
}
