import { useState } from "react";
import { SelectField, TextArea, TextField } from "@/components/form-fields";
import { ScheduleField } from "@/components/ScheduleField";
import {
  CATEGORIES,
  defaultSchedule,
  type ClubCategory,
  type MeetingSchedule,
  type StaffAccount,
} from "@/lib/campus-data";
import type { ClubInput } from "@/lib/session";

/**
 * One form for both consoles. Admins get a sponsor picker; a teacher is always
 * the sponsor of what they create, so `sponsors` is omitted for them.
 */
export function ClubForm({
  initial,
  sponsors,
  submitLabel,
  onSubmit,
  onCancel,
  rooms,
}: {
  initial?: Partial<ClubInput>;
  sponsors?: StaffAccount[];
  submitLabel: string;
  onSubmit: (input: ClubInput) => Promise<string | null>;
  onCancel?: () => void;
  /** Rooms already in use on campus, offered as autocomplete. */
  rooms?: string[];
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<ClubCategory>(initial?.category ?? "Academic");
  const [visibility, setVisibility] = useState<"public" | "private">(
    initial?.visibility ?? "public",
  );
  const [sponsorId, setSponsorId] = useState(initial?.sponsorId ?? sponsors?.[0]?.id ?? "");
  const [schedule, setSchedule] = useState<MeetingSchedule>(initial?.schedule ?? defaultSchedule);
  const [room, setRoom] = useState(initial?.room ?? "");
  const [blurb, setBlurb] = useState(initial?.blurb ?? "");
  const [instructions, setInstructions] = useState(initial?.joinInstructions ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setSaved(false);
        const problem = await onSubmit({
          name,
          category,
          visibility,
          room,
          schedule,
          blurb,
          joinInstructions: instructions,
          // Teachers never submit this field. Its presence means an admin
          // deliberately used the sponsor picker.
          ...(sponsors ? { sponsorId } : {}),
        });
        setBusy(false);
        setError(problem ?? "");
        if (!problem) setSaved(true);
      }}
    >
      <TextField label="Club name" value={name} onChange={setName} placeholder="Science Olympiad" />
      <SelectField
        label="Category"
        value={category}
        onChange={setCategory}
        options={CATEGORIES.map((c) => ({ value: c, label: c }))}
      />
      {sponsors && (
        <SelectField
          label="Sponsor"
          value={sponsorId}
          onChange={setSponsorId}
          options={sponsors.map((s) => ({ value: s.id, label: `${s.name} · ${s.email}` }))}
        />
      )}
      <SelectField
        label="Who can join"
        value={visibility}
        onChange={setVisibility}
        options={[
          { value: "public" as const, label: "Public — students join instantly" },
          { value: "private" as const, label: "Private — the sponsor approves each member" },
        ]}
      />
      <ScheduleField value={schedule} onChange={setSchedule} />
      <div className="self-start">
        <TextField
          label="Room"
          value={room}
          onChange={setRoom}
          placeholder="C-214"
          {...(rooms?.length ? { suggestions: rooms } : {})}
        />
      </div>
      <div className="md:col-span-2">
        <TextArea
          label="Description"
          value={blurb}
          onChange={setBlurb}
          placeholder="What the club does and who it's for."
        />
      </div>
      {visibility === "private" && (
        <div className="md:col-span-2">
          <TextArea
            label="How to join"
            value={instructions}
            onChange={setInstructions}
            placeholder="Exactly what a student has to do before a sponsor will approve them."
          />
        </div>
      )}
      {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
      <div className="flex flex-wrap items-center gap-2 md:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            Cancel
          </button>
        )}
        {saved && <span className="text-sm text-success">Saved — students see this now.</span>}
      </div>
    </form>
  );
}
