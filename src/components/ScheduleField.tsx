import {
  FREQUENCIES,
  WEEKDAYS,
  WEEK_ORDINALS,
  formatSchedule,
  type Frequency,
  type MeetingSchedule,
} from "@/lib/campus-data";

const control =
  "w-full rounded-md border border-input bg-card px-2 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/25";

/** Minute options — nobody schedules a club meeting at 4:37. */
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

/**
 * Picks when a club meets: how often, which day, and what time. Every part is a
 * dropdown or a bounded number, so "Thursdays, 9:00 PM, every other week" is
 * chosen rather than typed — and the app can render it the same way everywhere.
 */
export function ScheduleField({
  value,
  onChange,
}: {
  value: MeetingSchedule;
  onChange: (next: MeetingSchedule) => void;
}) {
  const set = (patch: Partial<MeetingSchedule>) => onChange({ ...value, ...patch });

  // A club carried over from the old free-text field may sit on an odd minute;
  // keep it selectable rather than silently snapping it to :00.
  const minuteOptions = MINUTES.includes(value.minute)
    ? MINUTES
    : [...MINUTES, value.minute].sort((a, b) => a - b);

  // The 12-hour clock the form shows, mapped onto the 24-hour value we store.
  const twelve = value.hour % 12 === 0 ? 12 : value.hour % 12;
  const meridiem = value.hour < 12 ? "AM" : "PM";
  const setHour = (hour12: number, suffix: "AM" | "PM") => {
    const clamped = Math.min(12, Math.max(1, hour12));
    const base = clamped % 12;
    set({ hour: suffix === "PM" ? base + 12 : base });
  };

  return (
    <fieldset className="rounded-md border border-input p-3">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Meeting time
      </legend>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] text-muted-foreground">How often</span>
          <select
            aria-label="How often the club meets"
            value={value.frequency}
            onChange={(e) => set({ frequency: e.target.value as Frequency })}
            className={control}
          >
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        {value.frequency !== "daily" && (
          <label className="block">
            <span className="text-[11px] text-muted-foreground">Day</span>
            <select
              aria-label="Day of the week"
              value={value.weekday}
              onChange={(e) => set({ weekday: Number(e.target.value) })}
              className={control}
            >
              {WEEKDAYS.map((day, i) => (
                <option key={day} value={i}>
                  {day}
                </option>
              ))}
            </select>
          </label>
        )}

        {value.frequency === "monthly" && (
          <label className="block">
            <span className="text-[11px] text-muted-foreground">Which week</span>
            <select
              aria-label="Which week of the month"
              value={value.week}
              onChange={(e) => set({ week: Number(e.target.value) })}
              className={control}
            >
              {WEEK_ORDINALS.map((ordinal, i) => (
                <option key={ordinal} value={i + 1}>
                  {ordinal} of the month
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="mt-2">
        <span className="text-[11px] text-muted-foreground">Starts at</span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            max={12}
            aria-label="Hour"
            value={twelve}
            onChange={(e) => setHour(Number(e.target.value), meridiem)}
            className={`${control} w-16 text-center`}
          />
          <span className="text-sm font-semibold text-muted-foreground">:</span>
          <select
            aria-label="Minute"
            value={value.minute}
            onChange={(e) => set({ minute: Number(e.target.value) })}
            className={`${control} w-20`}
          >
            {minuteOptions.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>
          <select
            aria-label="AM or PM"
            value={meridiem}
            onChange={(e) => setHour(twelve, e.target.value as "AM" | "PM")}
            className={`${control} w-20`}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Students will see: <span className="font-semibold">{formatSchedule(value)}</span>
      </p>
    </fieldset>
  );
}
