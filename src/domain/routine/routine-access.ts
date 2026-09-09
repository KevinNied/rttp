import { Routine, User } from "@/lib/rttp-data";

export function isAthleteOwnedRoutine(routine: Routine) {
  return routine.createdById === routine.athleteId;
}

export function canAthleteEditRoutine(routine: Routine, athleteId: number) {
  return (
    routine.athleteId === athleteId &&
    routine.createdById === athleteId &&
    routine.archivedAt === null
  );
}

export function canCoachEditRoutine(routine: Routine, coach: User) {
  return (
    coach.role === "coach" &&
    coach.athleteIds?.includes(routine.athleteId) === true &&
    routine.createdById === coach.id
  );
}

export function canCoachViewRoutine(routine: Routine, coach: User) {
  if (
    coach.role !== "coach" ||
    coach.athleteIds?.includes(routine.athleteId) !== true
  ) {
    return false;
  }

  return (
    routine.createdById === coach.id ||
    routine.sharedWithCoachId === coach.id
  );
}

export function visibleRoutinesForCoach(
  routines: Routine[],
  coach: User,
  athleteId?: number,
) {
  return routines.filter(
    (routine) =>
      (athleteId === undefined || routine.athleteId === athleteId) &&
      canCoachViewRoutine(routine, coach),
  );
}

export function routineCreator(routine: Routine, users: User[]) {
  return users.find((user) => user.id === routine.createdById);
}

export function routineCreatorLabel(
  routine: Routine,
  users: User[],
  viewer: User,
) {
  if (routine.createdById === viewer.id) return "Creada por vos";
  const creator = routineCreator(routine, users);
  return creator ? `Creada por ${creator.name}` : "Autor no disponible";
}
