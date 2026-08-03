import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  changePasswordFn,
  createAnnouncementFn,
  createClubFn,
  createEventFn,
  deleteAccountFn,
  deleteAnnouncementFn,
  deleteClubFn,
  deleteEventFn,
  getState,
  joinClubFn,
  joinSchoolFn,
  leaveClubFn,
  requestClubFn,
  reviewMembershipFn,
  reviewStaffFn,
  setSchoolCodeFn,
  signInFn,
  signOutFn,
  signUpFn,
  updateClubFn,
  updatePrefFn,
  updateProfileFn,
  type AppState,
  type Result,
} from "./api";
import {
  defaultPrefs,
  type Announcement,
  type Club,
  type ClubEvent,
  type JoinRequest,
  type Prefs,
  type Role,
  type SchoolAccount,
  type Session,
  type StaffAccount,
} from "./campus-data";
import type { ClubInput } from "@/server/service";

export type { ClubInput };

/** Every action resolves to an error message, or null when it worked. */
type Action<T extends unknown[]> = (...args: T) => Promise<string | null>;

type State = {
  ready: boolean;
  session: Session | null;
  /** True once the account has entered the campus access code. */
  joined: boolean;
  prefs: Prefs;
  school: AppState["school"];
  clubs: Club[];
  events: ClubEvent[];
  announcements: Announcement[];
  myClubs: string[];
  pending: string[];
  requests: JoinRequest[];
  staff: StaffAccount[];
  users: SchoolAccount[];
  pendingStaff: StaffAccount[];
  sponsors: StaffAccount[];
  schoolCode: string;
  refresh: () => Promise<void>;
  signIn: Action<[string, string]>;
  signUp: Action<[{ name: string; email: string; role: Role; grade: string; password: string }]>;
  signOut: Action<[]>;
  joinSchool: Action<[string]>;
  updateProfile: Action<[{ name: string; email: string }]>;
  changePassword: Action<[string, string, string]>;
  setPref: Action<[keyof Prefs, boolean]>;
  deleteAccount: Action<[]>;
  joinClub: Action<[string]>;
  leaveClub: Action<[string]>;
  requestClub: Action<[string, string]>;
  createClub: Action<[ClubInput]>;
  updateClub: Action<[string, Partial<ClubInput>]>;
  deleteClub: Action<[string]>;
  addEvent: Action<[Omit<ClubEvent, "id">]>;
  removeEvent: Action<[string]>;
  addAnnouncement: Action<[{ clubId: string; title: string; body: string }]>;
  removeAnnouncement: Action<[string]>;
  resolveRequest: Action<[string, boolean]>;
  reviewStaff: Action<[string, boolean]>;
  updateSchoolCode: Action<[string]>;
};

const emptyState: AppState = {
  user: null,
  prefs: defaultPrefs,
  school: null,
  clubs: [],
  events: [],
  announcements: [],
  myClubs: [],
  pending: [],
  requests: [],
  staff: [],
  users: [],
  schoolCode: "",
};

export const stateQueryKey = ["clubhub", "state"] as const;

const Ctx = createContext<State | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: stateQueryKey,
    queryFn: () => getState(),
    // The server is the only source of truth; never serve a stale view of it.
    staleTime: 0,
    retry: false,
  });

  const state = data ?? emptyState;

  const value = useMemo<State>(() => {
    const refresh = async () => {
      await queryClient.invalidateQueries({ queryKey: stateQueryKey });
    };

    /** Runs a server call, then re-reads state so the UI matches the database. */
    const run = async (call: () => Promise<Result>): Promise<string | null> => {
      let result: Result;
      try {
        result = await call();
      } catch (error) {
        console.error(error);
        return "Couldn't reach the server. Check your connection and try again.";
      }
      await refresh();
      return result.error;
    };

    const staff = state.staff;

    return {
      ready: !isPending,
      session: state.user,
      joined: !!state.user?.schoolId,
      prefs: state.prefs,
      school: state.school,
      clubs: state.clubs,
      events: state.events,
      announcements: state.announcements,
      myClubs: state.myClubs,
      pending: state.pending,
      requests: state.requests,
      staff,
      users: state.users,
      pendingStaff: staff.filter((s) => s.status === "pending"),
      sponsors: staff.filter((s) => s.status === "active"),
      schoolCode: state.schoolCode,
      refresh,

      signIn: (email, password) => run(() => signInFn({ data: { email, password } })),
      signUp: (input) => run(() => signUpFn({ data: input })),
      signOut: () => run(() => signOutFn()),
      joinSchool: (code) => run(() => joinSchoolFn({ data: { code } })),
      updateProfile: (input) => run(() => updateProfileFn({ data: input })),
      changePassword: (current, next, confirm) =>
        run(() => changePasswordFn({ data: { current, next, confirm } })),
      setPref: (key, value) => run(() => updatePrefFn({ data: { key, value } })),
      deleteAccount: () => run(() => deleteAccountFn()),

      joinClub: (clubId) => run(() => joinClubFn({ data: { clubId } })),
      leaveClub: (clubId) => run(() => leaveClubFn({ data: { clubId } })),
      requestClub: (clubId, note) => run(() => requestClubFn({ data: { clubId, note } })),

      createClub: (input) => run(() => createClubFn({ data: input })),
      updateClub: (id, patch) => run(() => updateClubFn({ data: { id, patch } })),
      deleteClub: (id) => run(() => deleteClubFn({ data: { id } })),

      addEvent: (event) => run(() => createEventFn({ data: event })),
      removeEvent: (id) => run(() => deleteEventFn({ data: { id } })),
      addAnnouncement: (post) => run(() => createAnnouncementFn({ data: post })),
      removeAnnouncement: (id) => run(() => deleteAnnouncementFn({ data: { id } })),

      resolveRequest: (id, approve) => run(() => reviewMembershipFn({ data: { id, approve } })),
      reviewStaff: (userId, approve) => run(() => reviewStaffFn({ data: { userId, approve } })),
      updateSchoolCode: (code) => run(() => setSchoolCodeFn({ data: { code } })),
    };
  }, [state, isPending, queryClient]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
