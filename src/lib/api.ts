import { createServerFn } from "@tanstack/react-start";
import type { ClubCategory, Prefs, Role } from "./campus-data";
import type { AppState, ClubInput, Result } from "@/server/service";

/**
 * The RPC surface. Every handler defers to `src/server/service` through a
 * dynamic import so nothing server-side — the database driver, the password
 * hashing, the session table — can be pulled into the browser bundle.
 *
 * Validators here only shape and bound the payload. Authorization is never
 * decided on this side; the service re-checks the signed-in user for every call.
 */

const str = (value: unknown, max = 500): string =>
  typeof value === "string" ? value.slice(0, max) : "";

const flag = (value: unknown): boolean => value === true;

export type { AppState, Result };

export const getState = createServerFn({ method: "GET" }).handler(async (): Promise<AppState> => {
  const { loadState } = await import("@/server/service");
  return loadState();
});

export const signUpFn = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { name: string; email: string; role: Role; grade: string; password: string }) => {
      const raw = (d ?? {}) as Partial<typeof d>;
      return {
        name: str(raw.name, 120),
        email: str(raw.email, 200),
        role: (raw.role ?? "student") as Role,
        grade: str(raw.grade, 10),
        password: str(raw.password, 200),
      };
    },
  )
  .handler(async ({ data }): Promise<Result> => {
    const { signUp } = await import("@/server/service");
    return signUp(data);
  });

export const signInFn = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) => {
    const raw = (d ?? {}) as Partial<typeof d>;
    return { email: str(raw.email, 200), password: str(raw.password, 200) };
  })
  .handler(async ({ data }): Promise<Result> => {
    const { signIn } = await import("@/server/service");
    return signIn(data);
  });

export const signOutFn = createServerFn({ method: "POST" }).handler(async (): Promise<Result> => {
  const { signOut } = await import("@/server/service");
  return signOut();
});

export const joinSchoolFn = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => ({ code: str((d ?? {}).code, 40) }))
  .handler(async ({ data }): Promise<Result> => {
    const { joinSchool } = await import("@/server/service");
    return joinSchool(data);
  });

export const updateProfileFn = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; email: string }) => {
    const raw = (d ?? {}) as Partial<typeof d>;
    return { name: str(raw.name, 120), email: str(raw.email, 200) };
  })
  .handler(async ({ data }): Promise<Result> => {
    const { updateProfile } = await import("@/server/service");
    return updateProfile(data);
  });

export const changePasswordFn = createServerFn({ method: "POST" })
  .inputValidator((d: { current: string; next: string; confirm: string }) => {
    const raw = (d ?? {}) as Partial<typeof d>;
    return {
      current: str(raw.current, 200),
      next: str(raw.next, 200),
      confirm: str(raw.confirm, 200),
    };
  })
  .handler(async ({ data }): Promise<Result> => {
    const { changePassword } = await import("@/server/service");
    return changePassword(data);
  });

export const updatePrefFn = createServerFn({ method: "POST" })
  .inputValidator((d: { key: keyof Prefs; value: boolean }) => {
    const raw = (d ?? {}) as Partial<typeof d>;
    return { key: str(raw.key, 40) as keyof Prefs, value: flag(raw.value) };
  })
  .handler(async ({ data }): Promise<Result> => {
    const { updatePref } = await import("@/server/service");
    return updatePref(data);
  });

export const deleteAccountFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<Result> => {
    const { deleteAccount } = await import("@/server/service");
    return deleteAccount();
  },
);

export const joinClubFn = createServerFn({ method: "POST" })
  .inputValidator((d: { clubId: string }) => ({ clubId: str((d ?? {}).clubId, 60) }))
  .handler(async ({ data }): Promise<Result> => {
    const { joinClub } = await import("@/server/service");
    return joinClub(data);
  });

export const leaveClubFn = createServerFn({ method: "POST" })
  .inputValidator((d: { clubId: string }) => ({ clubId: str((d ?? {}).clubId, 60) }))
  .handler(async ({ data }): Promise<Result> => {
    const { leaveClub } = await import("@/server/service");
    return leaveClub(data);
  });

export const requestClubFn = createServerFn({ method: "POST" })
  .inputValidator((d: { clubId: string; note: string }) => {
    const raw = (d ?? {}) as Partial<typeof d>;
    return { clubId: str(raw.clubId, 60), note: str(raw.note, 400) };
  })
  .handler(async ({ data }): Promise<Result> => {
    const { requestClub } = await import("@/server/service");
    return requestClub(data);
  });

export const reviewMembershipFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; approve: boolean }) => {
    const raw = (d ?? {}) as Partial<typeof d>;
    return { id: str(raw.id, 60), approve: flag(raw.approve) };
  })
  .handler(async ({ data }): Promise<Result> => {
    const { reviewMembership } = await import("@/server/service");
    return reviewMembership(data);
  });

function clubInput(raw: Partial<ClubInput>): ClubInput {
  return {
    name: str(raw.name, 80),
    category: str(raw.category, 20) as ClubCategory,
    visibility: raw.visibility === "private" ? "private" : "public",
    room: str(raw.room, 60),
    meets: str(raw.meets, 80),
    blurb: str(raw.blurb, 600),
    joinInstructions: str(raw.joinInstructions, 600),
    sponsorId: str(raw.sponsorId, 60),
  };
}

export const createClubFn = createServerFn({ method: "POST" })
  .inputValidator((d: ClubInput) => clubInput((d ?? {}) as Partial<ClubInput>))
  .handler(async ({ data }): Promise<Result> => {
    const { createClub } = await import("@/server/service");
    return createClub(data);
  });

export const updateClubFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; patch: Partial<ClubInput> }) => {
    const raw = (d ?? {}) as Partial<typeof d>;
    const patch = (raw.patch ?? {}) as Partial<ClubInput>;
    const shaped = clubInput(patch);
    // Only forward the keys the caller actually set, so a partial edit stays partial.
    const out: Partial<ClubInput> = {};
    for (const key of Object.keys(patch) as (keyof ClubInput)[]) {
      if (key === "visibility") out.visibility = shaped.visibility;
      else if (key === "category") out.category = shaped.category;
      else out[key] = shaped[key];
    }
    return { id: str(raw.id, 60), patch: out };
  })
  .handler(async ({ data }): Promise<Result> => {
    const { updateClub } = await import("@/server/service");
    return updateClub(data);
  });

export const deleteClubFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => ({ id: str((d ?? {}).id, 60) }))
  .handler(async ({ data }): Promise<Result> => {
    const { deleteClub } = await import("@/server/service");
    return deleteClub(data);
  });

export const createEventFn = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      clubId: string;
      title: string;
      date: string;
      start: string;
      end: string;
      location: string;
    }) => {
      const raw = (d ?? {}) as Partial<typeof d>;
      return {
        clubId: str(raw.clubId, 60),
        title: str(raw.title, 120),
        date: str(raw.date, 10),
        start: str(raw.start, 20),
        end: str(raw.end, 20),
        location: str(raw.location, 80),
      };
    },
  )
  .handler(async ({ data }): Promise<Result> => {
    const { createEvent } = await import("@/server/service");
    return createEvent(data);
  });

export const deleteEventFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => ({ id: str((d ?? {}).id, 60) }))
  .handler(async ({ data }): Promise<Result> => {
    const { deleteEvent } = await import("@/server/service");
    return deleteEvent(data);
  });

export const createAnnouncementFn = createServerFn({ method: "POST" })
  .inputValidator((d: { clubId: string; title: string; body: string }) => {
    const raw = (d ?? {}) as Partial<typeof d>;
    return { clubId: str(raw.clubId, 60), title: str(raw.title, 120), body: str(raw.body, 2000) };
  })
  .handler(async ({ data }): Promise<Result> => {
    const { createAnnouncement } = await import("@/server/service");
    return createAnnouncement(data);
  });

export const deleteAnnouncementFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => ({ id: str((d ?? {}).id, 60) }))
  .handler(async ({ data }): Promise<Result> => {
    const { deleteAnnouncement } = await import("@/server/service");
    return deleteAnnouncement(data);
  });

export const reviewStaffFn = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string; approve: boolean }) => {
    const raw = (d ?? {}) as Partial<typeof d>;
    return { userId: str(raw.userId, 60), approve: flag(raw.approve) };
  })
  .handler(async ({ data }): Promise<Result> => {
    const { reviewStaff } = await import("@/server/service");
    return reviewStaff(data);
  });

export const setSchoolCodeFn = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => ({ code: str((d ?? {}).code, 40) }))
  .handler(async ({ data }): Promise<Result> => {
    const { setSchoolCode } = await import("@/server/service");
    return setSchoolCode(data);
  });
