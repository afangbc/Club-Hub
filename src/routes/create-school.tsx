import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, Check, Copy, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSchoolFn, requestSchoolVerificationFn } from "@/lib/api";
import { homeFor } from "@/lib/campus-data";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/create-school")({ component: CreateSchool });

function CreateSchool() {
  const { ready, session, refresh, signOut } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [mascot, setMascot] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!session || session.role !== "admin" || session.schoolId)
      navigate({ to: homeFor(session), replace: true });
  }, [ready, session, navigate]);

  async function sendCode() {
    setBusy(true); setError("");
    try {
      const result = await requestSchoolVerificationFn({ data: { name, district, mascot } });
      if (result.error) setError(result.error); else setSent(true);
    } catch { setError("Couldn't reach the server. Check your connection and try again."); }
    setBusy(false);
  }

  async function verify() {
    setBusy(true); setError("");
    try {
      const result = await createSchoolFn({ data: { code } });
      if (result.error) setError(result.error);
      else { setJoinCode(result.joinCode ?? ""); await refresh(); }
    } catch { setError("Couldn't reach the server. Check your connection and try again."); }
    setBusy(false);
  }

  if (!ready || !session) return null;
  return <main className="min-h-screen bg-muted/30 px-4 py-16">
    <div className="mx-auto max-w-xl rounded-2xl border bg-card p-7 shadow-xl sm:p-10">
      <div className="mb-7 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Building2 /></div>
      {joinCode ? <>
        <div className="mb-3 flex items-center gap-2 text-emerald-600"><Check /> School created</div>
        <h1 className="text-3xl font-bold">Invite your students</h1>
        <p className="mt-2 text-muted-foreground">Share this campus code with students and staff. You can change it later in the admin dashboard.</p>
        <div className="my-7 flex items-center justify-between rounded-xl border bg-muted p-5">
          <code className="text-2xl font-bold tracking-widest">{joinCode}</code>
          <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(joinCode)} aria-label="Copy campus code"><Copy /></Button>
        </div>
        <Button className="w-full" size="lg" onClick={() => navigate({ to: "/admin" })}>Open admin dashboard</Button>
      </> : <>
        <h1 className="text-3xl font-bold">Create your school</h1>
        <p className="mt-2 text-muted-foreground">We’ll verify <strong>{session.email}</strong> before creating your campus.</p>
        {!sent ? <div className="mt-7 space-y-4">
          <label className="block text-sm font-medium">School name<Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="Lincoln High School" /></label>
          <label className="block text-sm font-medium">District or organization<Input className="mt-1.5" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Lincoln Public Schools" /></label>
          <label className="block text-sm font-medium">Mascot<Input className="mt-1.5" value={mascot} onChange={(e) => setMascot(e.target.value)} placeholder="Lions" /></label>
          <Button className="w-full" size="lg" disabled={busy} onClick={sendCode}><Mail />{busy ? "Sending…" : "Email verification code"}</Button>
        </div> : <div className="mt-7 space-y-4">
          <label className="block text-sm font-medium">6-digit verification code<Input className="mt-1.5 text-center text-xl tracking-[.4em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" /></label>
          <Button className="w-full" size="lg" disabled={busy || code.length !== 6} onClick={verify}>{busy ? "Verifying…" : "Verify and create school"}</Button>
          <Button className="w-full" variant="ghost" onClick={() => { setSent(false); setCode(""); }}>Change school details or resend</Button>
        </div>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <button className="mt-6 text-sm text-muted-foreground underline" onClick={() => signOut()}>Sign out</button>
      </>}
    </div>
  </main>;
}
