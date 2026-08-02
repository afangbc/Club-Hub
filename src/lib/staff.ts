import type { Club } from "./campus-data";
import type { Role } from "./campus-data";

/**
 * Clubs a staff member controls. Admins get the whole campus. Sponsors get the
 * clubs listed under their name — in the proof of concept a demo sponsor with no
 * name match is given the full list so the console is explorable.
 */
export function staffClubs(clubs: Club[], role: Role, name: string) {
  if (role === "admin") return clubs;
  const mine = clubs.filter((c) => c.sponsor.toLowerCase() === name.trim().toLowerCase());
  return mine.length ? mine : clubs;
}