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
