import { WEEKDAYS, defaultSchedule, type MeetingSchedule } from "@/lib/campus-data";

/**
 * Readers for the free-text meeting times version 2 stored — "Tuesdays, 4:15
 * PM", "1st Thursday, 7:30 AM", "Daily, 6:30 AM". Kept apart from the store so
 * they stay pure and testable: an upgrade shouldn't quietly move every club on
 * campus to the default slot.
 */

/**
 * "4:15 PM", "16:15", "9pm" → 24-hour parts. Null when there's no time in it.
 * A bare number is ignored on purpose: the "1" in "1st Thursday" is an ordinal,
 * not one o'clock.
 */
function parseClock(text: string): { hour: number; minute: number } | null {
  const withMinutes = /(\d{1,2})\s*:\s*(\d{2})\s*(am|pm)?/i.exec(text);
  const match = withMinutes ?? /(\d{1,2})\s*(am|pm)/i.exec(text);
  if (!match) return null;

  // The bare-hour pattern has no minutes group, so the suffix shifts left.
  let hour = Number(match[1]);
  const minute = withMinutes ? Number(match[2]) : 0;
  const suffix = (withMinutes ? match[3] : match[2])?.toLowerCase();

  if (hour > 23 || minute > 59) return null;
  if (suffix === "pm" && hour < 12) hour += 12;
  if (suffix === "am" && hour === 12) hour = 0;
  return { hour, minute };
}

export function scheduleFromText(text: string): MeetingSchedule {
  const lower = text.toLowerCase();
  const clock = parseClock(text);

  // Whole words only — otherwise the "mon" inside "month" reads as Monday.
  const weekday = WEEKDAYS.findIndex((day) =>
    new RegExp(`\\b${day.slice(0, 3)}(${day.slice(3)})?s?\\b`, "i").test(text),
  );
  const ordinal = /\b(1st|2nd|3rd|4th|last)\b/.exec(lower)?.[1];

  let frequency: MeetingSchedule["frequency"] = "weekly";
  if (lower.includes("daily") || lower.includes("every day")) frequency = "daily";
  else if (ordinal || lower.includes("month")) frequency = "monthly";
  else if (lower.includes("biweek") || lower.includes("every other")) frequency = "biweekly";

  const week = ordinal === "last" ? 5 : ordinal ? Number(ordinal[0]) : defaultSchedule.week;

  return {
    frequency,
    weekday: weekday >= 0 ? weekday : defaultSchedule.weekday,
    week,
    hour: clock?.hour ?? defaultSchedule.hour,
    minute: clock?.minute ?? defaultSchedule.minute,
  };
}

/** "4:15 PM" → "16:15", the 24-hour form events use from version 3 on. */
export function timeFromText(text: string, fallback: string): string {
  const clock = parseClock(text);
  if (!clock) return fallback;
  return `${String(clock.hour).padStart(2, "0")}:${String(clock.minute).padStart(2, "0")}`;
}
