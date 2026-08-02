import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SCHOOL, type Role } from "@/lib/campus-data";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClubHub — One club app for your whole campus" },
      {
        name: "description",
        content:
          "ClubHub puts every club, team, and meeting at your school in one place: directory, joining, and a shared calendar.",
      },
      { property: "og:title", content: "ClubHub — One club app for your whole campus" },
      {
        property: "og:description",
        content: "Find clubs, join them, and see every meeting on one calendar.",
      },
    ],
  }),
  component: Index,
});

const roles: { value: Role; label: string; hint: string }[] = [
  { value: "student", label: "Student", hint: "Join clubs & see your calendar" },
  { value: "teacher", label: "Teacher", hint: "Sponsor clubs & post meetings" },
  { value: "admin", label: "School Admin", hint: "Manage the school's ClubHub" },
];

function Index() {
  const { session, joined, ready, signIn, joinSchool } = useSession();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && session && joined) navigate({ to: "/clubs", replace: true });
  }, [ready, session, joined, navigate]);

  const step: 1 | 2 = session ? 2 : 1;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative flex flex-col justify-between bg-primary px-8 py-12 text-primary-foreground lg:px-14">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-brand font-display text-2xl text-brand-foreground">
            N
          </span>
          <span className="font-display text-3xl">ClubHub</span>
        </div>
        <div className="max-w-md py-14">
          <h1 className="text-5xl leading-[1.05] lg:text-6xl">
            One club app to
            <span className="text-brand"> rule them all.</span>
          </h1>
          <p className="mt-5 text-base opacity-80">
            No more juggling a different app for every club just to find out where a meeting is.
            Every club, team, and tutorial at your school — one directory, one calendar.
          </p>
          <ul className="mt-8 space-y-3 text-sm opacity-90">
            {[
              "Only clubs at your school — verified with a school code",
              "Public clubs join instantly, private clubs show you exactly how to get in",
              "Every meeting you belong to lands on one calendar",
            ].map((f) => (
              <li key={f} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs uppercase tracking-[0.2em] opacity-60">
          Proof of concept · {SCHOOL.district}
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Step {step} of 2
          </p>
          {step === 1 ? (
            <form
              className="mt-3 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim() || !email.trim()) return setError("Fill in your name and email.");
                setError("");
                signIn({ name: name.trim(), email: email.trim(), role });
              }}
            >
              <h2 className="text-3xl">Sign in</h2>
              <div className="grid gap-2">
                {roles.map((r) => (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`flex items-center justify-between rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${
                      role === r.value
                        ? "border-primary bg-accent font-semibold text-accent-foreground"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <span>{r.label}</span>
                    <span className="text-xs text-muted-foreground">{r.hint}</span>
                  </button>
                ))}
              </div>
              <Field label="Full name" value={name} onChange={setName} placeholder="Jordan Rivera" />
              <Field
                label="School email"
                value={email}
                onChange={setEmail}
                type="email"
                placeholder="jrivera@northviewisd.org"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Submit>Continue</Submit>
              <p className="text-xs text-muted-foreground">
                Demo sign-in for the proof of concept — no password yet.
              </p>
            </form>
          ) : (
            <form
              className="mt-3 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (joinSchool(code)) {
                  setError("");
                  navigate({ to: "/clubs" });
                } else {
                  setError("That code doesn't match a school. Try again.");
                }
              }}
            >
              <h2 className="text-3xl">Join your school</h2>
              <p className="text-sm text-muted-foreground">
                Enter the access code your school gave you. It locks ClubHub to{" "}
                {SCHOOL.name} only — you'll never see clubs from other campuses.
              </p>
              <Field
                label="School access code"
                value={code}
                onChange={(v) => setCode(v.toUpperCase())}
                placeholder="FALCON26"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Submit>Enter ClubHub</Submit>
              <p className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
                Demo code: <span className="font-semibold">{SCHOOL.joinCode}</span>
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
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

function Submit({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {children}
    </button>
  );
}
