export type Role = "student" | "teacher" | "admin";

export type Session = {
  name: string;
  email: string;
  role: Role;
  schoolId: string;
};

export type ClubEvent = {
  id: string;
  clubId: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  start: string;
  end: string;
  location: string;
};

export type Club = {
  id: string;
  name: string;
  category: "Academic" | "Service" | "Arts" | "STEM" | "Culture" | "Athletics";
  visibility: "public" | "private";
  sponsor: string;
  room: string;
  meets: string;
  members: number;
  blurb: string;
  joinInstructions?: string;
};

export const SCHOOL = {
  id: "nhs-falcons",
  name: "Northview High School",
  mascot: "Falcons",
  joinCode: "FALCON26",
  district: "Northview ISD",
};

export const CLUBS: Club[] = [
  {
    id: "tsa",
    name: "Technology Student Association",
    category: "STEM",
    visibility: "public",
    sponsor: "Mr. Alvarez",
    room: "C-214",
    meets: "Tuesdays, 4:15 PM",
    members: 62,
    blurb: "Compete in engineering, coding, and design events at region and state.",
  },
  {
    id: "nhs",
    name: "National Honor Society",
    category: "Service",
    visibility: "private",
    sponsor: "Mrs. Whitfield",
    room: "Library",
    meets: "1st Thursday, 7:30 AM",
    members: 118,
    blurb: "Scholarship, service, leadership, and character.",
    joinInstructions:
      "Requires a 3.6+ unweighted GPA and 20 logged service hours. Submit the interest form in the front office by Sept 15, then a sponsor will approve you here.",
  },
  {
    id: "robotics",
    name: "Robotics Team 4412",
    category: "STEM",
    visibility: "private",
    sponsor: "Mr. Alvarez",
    room: "Shop B",
    meets: "Mon/Wed, 4:00 PM",
    members: 34,
    blurb: "Build season runs January through March. Tools, CAD, and drive team.",
    joinInstructions:
      "Attend one open build night, complete the shop safety quiz, then ask a captain to add you.",
  },
  {
    id: "debate",
    name: "Speech & Debate",
    category: "Academic",
    visibility: "public",
    sponsor: "Ms. Boateng",
    room: "A-108",
    meets: "Wednesdays, 4:00 PM",
    members: 41,
    blurb: "LD, CX, and extemp. Novices welcome every semester.",
  },
  {
    id: "artclub",
    name: "Art Club",
    category: "Arts",
    visibility: "public",
    sponsor: "Mr. Deleon",
    room: "Art 2",
    meets: "Fridays, 3:45 PM",
    members: 27,
    blurb: "Murals, print-making, and the spring student gallery.",
  },
  {
    id: "bsu",
    name: "Black Student Union",
    category: "Culture",
    visibility: "public",
    sponsor: "Coach Reed",
    room: "D-101",
    meets: "2nd Monday, 4:00 PM",
    members: 73,
    blurb: "Community, culture, and campus events all year.",
  },
  {
    id: "keyclub",
    name: "Key Club",
    category: "Service",
    visibility: "public",
    sponsor: "Mrs. Whitfield",
    room: "B-220",
    meets: "Thursdays, 4:00 PM",
    members: 88,
    blurb: "Volunteer projects across Northview ISD. Hours logged in app.",
  },
  {
    id: "hoops",
    name: "Varsity Basketball",
    category: "Athletics",
    visibility: "private",
    sponsor: "Coach Reed",
    room: "Main Gym",
    meets: "Daily, 6:30 AM",
    members: 15,
    blurb: "Team schedule, film sessions, and travel details.",
    joinInstructions: "Roster only. Coach Reed gives rostered players a team access code.",
  },
];

function d(offsetDays: number) {
  const base = new Date();
  base.setDate(base.getDate() + offsetDays);
  return base.toISOString().slice(0, 10);
}

export const EVENTS: ClubEvent[] = [
  { id: "e1", clubId: "tsa", title: "TSA General Meeting", date: d(0), start: "4:15 PM", end: "5:15 PM", location: "C-214" },
  { id: "e2", clubId: "debate", title: "Novice Practice Round", date: d(1), start: "4:00 PM", end: "5:30 PM", location: "A-108" },
  { id: "e3", clubId: "keyclub", title: "Park Cleanup Sign-Up", date: d(2), start: "4:00 PM", end: "4:45 PM", location: "B-220" },
  { id: "e4", clubId: "artclub", title: "Mural Paint Day", date: d(3), start: "3:45 PM", end: "6:00 PM", location: "Art 2" },
  { id: "e5", clubId: "tsa", title: "Regional Prep Workshop", date: d(4), start: "4:15 PM", end: "6:00 PM", location: "C-214" },
  { id: "e6", clubId: "bsu", title: "BSU Community Night", date: d(5), start: "6:00 PM", end: "8:00 PM", location: "Cafeteria" },
  { id: "e7", clubId: "nhs", title: "Induction Rehearsal", date: d(6), start: "7:30 AM", end: "8:15 AM", location: "Auditorium" },
  { id: "e8", clubId: "robotics", title: "Open Build Night", date: d(7), start: "4:00 PM", end: "7:00 PM", location: "Shop B" },
  { id: "e9", clubId: "hoops", title: "Scrimmage vs. Eastside", date: d(8), start: "6:30 PM", end: "8:30 PM", location: "Main Gym" },
  { id: "e10", clubId: "keyclub", title: "District Service Fair", date: d(9), start: "9:00 AM", end: "12:00 PM", location: "Civic Center" },
  { id: "e11", clubId: "debate", title: "Tournament Departure", date: d(11), start: "6:00 AM", end: "9:00 PM", location: "Bus Loop" },
  { id: "e12", clubId: "artclub", title: "Gallery Setup", date: d(13), start: "3:45 PM", end: "5:30 PM", location: "Commons" },
];

export const clubById = (id: string) => CLUBS.find((c) => c.id === id);