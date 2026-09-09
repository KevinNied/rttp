import {
  selectedAthleteStorageKey,
  sessionStorageKey,
} from "@/infrastructure/storage/storage-keys";
import {
  removePersistentSessionValue,
  writePersistentSessionValue,
} from "@/infrastructure/storage/web-storage";

export function persistCurrentUser(userId: number) {
  writePersistentSessionValue(sessionStorageKey, String(userId));
}

export function persistSelectedAthlete(athleteId: number) {
  writePersistentSessionValue(selectedAthleteStorageKey, String(athleteId));
}

export function clearUserSession() {
  removePersistentSessionValue(sessionStorageKey);
  removePersistentSessionValue(selectedAthleteStorageKey);
}
