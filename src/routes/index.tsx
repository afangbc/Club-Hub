import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DEMO_PASSWORD, GRADES, SCHOOL, homeFor, type Role } from "@/lib/campus-data";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClubHub — One club app for your whole campus" },
      {
        name: "description",
        content:
          "ClubHub puts every club, team, and meeting at Frisco High School in one place: directory, joining, and a shared calendar.",
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
  { value: "admin", label: "School Admin", hint: "Request the campus from ClubHub" },
];

const demoLogins = [
  { role: "Student", email: `jordan.rivera.123@${SCHOOL.studentDomain}` },
  { role: "Teacher", email: `marcus.alvarez@${SCHOOL.staffDomain}` },
  { role: "Admin", email: `alicia.nguyen@${SCHOOL.staffDomain}` },
];

function Index() {
  const { session, joined, ready, signIn, signUp, joinSchool } = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("student");
  const [grade, setGrade] = useState<string>(GRADES[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const destination = homeFor(session);

  useEffect(() => {
    // An unconfirmed address goes to the code screen before anything else.
    // Admins and owners never enter a campus code, so they skip step 2 entirely.
    if (
      ready &&
      session &&
      (!session.emailVerified || joined || session.owner || session.role === "admin")
    )
      navigate({ to: destination, replace: true });
  }, [ready, session, joined, destination, navigate]);

  const step: 1 | 2 = session ? 2 : 1;
  const placeholder =
    role === "student"
      ? `jordan.rivera.123@${SCHOOL.studentDomain}`
      : `first.last@${SCHOOL.staffDomain}`;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative flex flex-col justify-between bg-primary px-8 py-12 text-primary-foreground lg:px-14">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-brand font-display text-2xl text-brand-foreground">
            F
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
            Every club, team, and tutorial at {SCHOOL.name} — one directory, one calendar.
          </p>
          <ul className="mt-8 space-y-3 text-sm opacity-90">
            {[
              "Students join clubs and get every meeting on one calendar",
              "Teachers create clubs, post meetings, and send announcements",
              "Admins issue the campus code, build clubs, and approve staff",
            ].map((f) => (
              <li key={f} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs uppercase tracking-[0.2em] opacity-60">
          {SCHOOL.mascot} · {SCHOOL.district}
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
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                setBusy(true);
                try {
                  if (mode === "signin") {
                    if (!email.trim() || !password) {
                      setError("Enter your email and password.");
                      return;
                    }
                    setError((await signIn(email.trim(), password)) ?? "");
                    return;
                  }
                  if (!name.trim() || !email.trim()) {
                    setError("Fill in your name and email.");
                    return;
                  }
                  if (password !== confirm) {
                    setError("Passwords don't match.");
                    return;
                  }
                  setError(
                    (await signUp({
                      name: name.trim(),
                      email: email.trim(),
                      role,
                      grade,
                      password,
                      schoolCode: code,
                    })) ?? "",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <h2 className="text-3xl">{mode === "signup" ? "Create your account" : "Sign in"}</h2>
              {mode === "signup" && (
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
              )}
              {mode === "signup" && (
                <Field
                  label="Full name"
                  value={name}
                  onChange={setName}
                  placeholder="Jordan Rivera"
                />
              )}
              {mode === "signup" && role === "student" && (
                <><label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Grade
                  </span>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="School code"
                  value={code}
                  onChange={(value) => setCode(value.toUpperCase())}
                  placeholder="ABCD-1234"
                /></>
              )}
              <Field
                label="School email"
                value={email}
                onChange={setEmail}
                type="email"
                placeholder={placeholder}
              />
              <Field
                label="Password"
                value={password}
                onChange={setPassword}
                type="password"
                placeholder="8+ characters, with a number"
              />
              {mode === "signup" && (
                <Field
                  label="Confirm password"
                  value={confirm}
                  onChange={setConfirm}
                  type="password"
                  placeholder="Re-enter password"
                />
              )}
              {mode === "signup" && role === "teacher" && (
                <p className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  Teacher accounts stay locked until a school admin approves them.
                </p>
              )}
              {mode === "signup" && role === "admin" && (
                <p className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  Nobody gets an admin account by signing up. You'll ask ClubHub for a campus on the
                  next screen, and we approve every one by hand.
                </p>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Submit busy={busy}>{mode === "signup" ? "Create account" : "Continue"}</Submit>
              <p className="text-xs text-muted-foreground">
                {mode === "signup" ? "Already have an account?" : "New to ClubHub?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signup" ? "signin" : "signup");
                    setError("");
                    setPassword("");
                    setConfirm("");
                  }}
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  {mode === "signup" ? "Sign in" : "Create an account"}
                </button>
              </p>
              {mode === "signin" && (
                <div className="rounded-md bg-secondary p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Demo accounts · password {DEMO_PASSWORD}
                  </p>
                  <div className="mt-2 grid gap-1.5">
                    {demoLogins.map((demo) => (
                      <button
                        key={demo.email}
                        type="button"
                        onClick={() => {
                          setEmail(demo.email);
                          setPassword(DEMO_PASSWORD);
                          setError("");
                        }}
                        className="rounded-md px-2 py-1.5 text-left text-xs text-secondary-foreground hover:bg-background"
                      >
                        <span className="font-semibold">{demo.role}</span> — {demo.email}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          ) : (
            <form
              className="mt-3 space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                setBusy(true);
                try {
                  const err = await joinSchool(code);
                  setError(err ?? "");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <h2 className="text-3xl">Join your school</h2>
              <p className="text-sm text-muted-foreground">
                Enter the access code {SCHOOL.name} gave you. It locks ClubHub to this campus only —
                you'll never see clubs from another {SCHOOL.district} school.
              </p>
              <Field
                label="School access code"
                value={code}
                onChange={(v) => setCode(v.toUpperCase())}
                placeholder="ABCD-1234"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Submit busy={busy}>Enter ClubHub</Submit>
              <p className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
                Your sponsor, coach, or front office has the current code. It changes when the
                school rotates it.
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

function Submit({ children, busy }: { children: React.ReactNode; busy: boolean }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
    >
      {busy ? "Working…" : children}
    </button>
  );
}
