export type CoachView = "resumen" | "atletas" | "routines" | "profile";
export type CoachAthleteSection = "routines" | "schedule" | "history";
export type AthleteView =
  | "inicio"
  | "agenda"
  | "routines"
  | "activities"
  | "profile";

export function athleteIdForPath(pathname: string) {
  const match = pathname.match(/^\/coach\/athletes\/(\d+)(?:\/|$)/);
  return match ? Number(match[1]) : Number.NaN;
}

export function isAthleteDetailPath(pathname: string) {
  return Number.isInteger(athleteIdForPath(pathname));
}

export function coachAthleteSectionForPath(
  pathname: string,
): CoachAthleteSection {
  if (pathname.endsWith("/schedule")) return "schedule";
  if (pathname.endsWith("/history")) return "history";
  return "routines";
}

export function coachAthletePath(
  athleteId: number,
  section: CoachAthleteSection = "routines",
) {
  return `/coach/athletes/${athleteId}/${section}`;
}

export function coachViewForPath(pathname: string): CoachView {
  return pathname.startsWith("/coach/athletes")
    ? "atletas"
    : pathname === "/coach/routines" || pathname === "/coach/templates"
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
