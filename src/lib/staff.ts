import type { Club, Session } from "./campus-data";

/**
 * Clubs a staff member controls. Admins run the whole campus from the admin
 * console, so this is really "the clubs this sponsor owns". The server enforces
 * the same rule on every write — this is only what the UI shows.
 */
export function staffClubs(clubs: Club[], session: Session) {
  if (session.role === "admin") return clubs;
  return clubs.filter((c) => c.sponsorId === session.id);
}

/** Rooms already in use on campus, for autocomplete on room and location fields. */
export function campusRooms(clubs: Club[], extra: string[] = []): string[] {
  const rooms = new Set([...clubs.map((c) => c.room), ...extra].filter(Boolean));
  return [...rooms].sort((a, b) => a.localeCompare(b));
}
