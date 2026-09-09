export type CoachView = "resumen" | "atletas" | "routines" | "profile";
export type AthleteView =
  | "inicio"
  | "agenda"
  | "routines"
  | "activities"
  | "profile";

export function athleteIdForPath(pathname: string) {
  return Number(pathname.split("/").at(-1));
}

export function isAthleteDetailPath(pathname: string) {
  return (
    pathname.startsWith("/coach/athletes/") &&
    Number.isInteger(athleteIdForPath(pathname))
  );
}

export function coachViewForPath(pathname: string): CoachView {
  return pathname.startsWith("/coach/athletes")
    ? "atletas"
    : pathname === "/coach/routines"
      ? "routines"
      : pathname === "/coach/profile"
        ? "profile"
        : "resumen";
}

export function athleteViewForPath(pathname: string): AthleteView {
  return pathname === "/schedule"
    ? "agenda"
    : pathname === "/activities"
      ? "activities"
      : pathname === "/routines"
        ? "routines"
        : pathname === "/profile"
          ? "profile"
          : "inicio";
}

export function redirectForRole(
  pathname: string,
  role: "coach" | "athlete" | null,
) {
  if (role === null) return pathname !== "/" ? "/" : null;
  if (role === "coach" && !pathname.startsWith("/coach")) return "/coach";
  if (role === "athlete" && pathname.startsWith("/coach")) return "/";
  return null;
}
