"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CompletedActivity } from "@/lib/rttp-activity";
import { ScheduledWorkout } from "@/lib/rttp-agenda";
import { initialRoutines, initialUsers, Routine, User } from "@/lib/rttp-data";
import { NewSupabaseMutation, SupabaseMutation } from "@/lib/rttp-supabase";

import { RoutineTemplate } from "@/domain/routine/routine-factory";
import { normalizeUser } from "@/domain/user/user-normalization";
import { TrainingSetRecords } from "@/domain/workout/workout-session";
import {
  selectedAthleteStorageKey,
  sessionStorageKey,
} from "@/infrastructure/storage/storage-keys";
import { readPersistentSessionValue } from "@/infrastructure/storage/web-storage";
import {
  enqueueMutation,
  executePendingMutations,
} from "@/infrastructure/sync/outbox-repository";
import {
  pruneWorkoutSessions,
  readWorkoutRecords,
} from "@/infrastructure/workout/workout-session-repository";
import { pruneWorkoutTimers } from "@/infrastructure/workout/workout-timer-repository";
import { loadAppData } from "@/application/data/load-app-data";
import { syncErrorMessage } from "@/application/sync/sync-error";

export type AppDataStore = {
  hydrated: boolean;
  syncError: string | null;
  setSyncError: (message: string | null) => void;
  persist: (mutation: NewSupabaseMutation) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  routines: Routine[];
  setRoutines: React.Dispatch<React.SetStateAction<Routine[]>>;
  templates: RoutineTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<RoutineTemplate[]>>;
  workouts: ScheduledWorkout[];
  setWorkouts: React.Dispatch<React.SetStateAction<ScheduledWorkout[]>>;
  activities: CompletedActivity[];
  setActivities: React.Dispatch<React.SetStateAction<CompletedActivity[]>>;
  records: TrainingSetRecords;
  setRecords: React.Dispatch<React.SetStateAction<TrainingSetRecords>>;
  userId: number | null;
  setUserId: React.Dispatch<React.SetStateAction<number | null>>;
  selectedAthleteId: number;
  setSelectedAthleteId: React.Dispatch<React.SetStateAction<number>>;
};

export function useAppData(athleteRouteId: number): AppDataStore {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [routines, setRoutines] = useState<Routine[]>(initialRoutines);
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [workouts, setWorkouts] = useState<ScheduledWorkout[]>([]);
  const [activities, setActivities] = useState<CompletedActivity[]>([]);
  const [records, setRecords] = useState<TrainingSetRecords>({});
  const [userId, setUserId] = useState<number | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const persistenceQueueRef = useRef<Promise<void>>(Promise.resolve());
  const remoteDataAppliedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const retryPending = () => {
      void hydrate();
    };
    window.addEventListener("online", retryPending);

    async function hydrate() {
      const {
        data: finalData,
        remoteDataApplied,
        syncError: nextSyncError,
      } = await loadAppData();
      if (!cancelled) setSyncError(nextSyncError);

      if (cancelled) return;
      if (!remoteDataApplied && remoteDataAppliedRef.current) return;
      setUsers(finalData.users.map(normalizeUser));
      setRoutines(finalData.routines);
      setTemplates(finalData.templates);
      setWorkouts(finalData.workouts);
      setActivities(finalData.activities);
      if (remoteDataApplied) {
        pruneWorkoutTimers(finalData.workouts);
        pruneWorkoutSessions(finalData.workouts);
        setRecords(readWorkoutRecords(finalData.workouts));
      }
      remoteDataAppliedRef.current = remoteDataApplied;

      const storedUserId = Number(
        readPersistentSessionValue(sessionStorageKey),
      );
      if (finalData.users.some((item) => item.id === storedUserId)) {
        setUserId(storedUserId);
        const initialUser = finalData.users.find(
          (item) => item.id === storedUserId,
        );
        const storedAthleteId = Number(
          readPersistentSessionValue(selectedAthleteStorageKey),
        );
        setSelectedAthleteId(
          initialUser?.role === "athlete"
            ? initialUser.id
            : initialUser?.athleteIds?.includes(athleteRouteId)
              ? athleteRouteId
              : initialUser?.athleteIds?.includes(storedAthleteId)
                ? storedAthleteId
                : (initialUser?.athleteIds?.[0] ?? 1),
        );
      }
      setHydrated(true);
    }

    void hydrate();

    return () => {
      cancelled = true;
      window.removeEventListener("online", retryPending);
    };
  }, [athleteRouteId]);

  const persist = useCallback((newMutation: NewSupabaseMutation) => {
    if (!remoteDataAppliedRef.current) {
      setSyncError((current) =>
        current ??
        "La persistencia remota no está disponible. Recargá antes de guardar cambios.",
      );
      return;
    }

    const mutation: SupabaseMutation = {
      ...newMutation,
      id: crypto.randomUUID(),
    };
    const requiresRemapping = !remoteDataAppliedRef.current;
    const operation = persistenceQueueRef.current.then(async () => {
      await enqueueMutation(mutation, requiresRemapping);
      await executePendingMutations();
    });
    persistenceQueueRef.current = operation.catch(() => undefined);
    void operation
      .then(() => setSyncError(null))
      .catch((error: unknown) => setSyncError(syncErrorMessage(error)));
  }, []);

  return {
    hydrated,
    syncError,
    setSyncError,
    persist,
    users,
    setUsers,
    routines,
    setRoutines,
    templates,
    setTemplates,
    workouts,
    setWorkouts,
    activities,
    setActivities,
    records,
    setRecords,
    userId,
    setUserId,
    selectedAthleteId,
    setSelectedAthleteId,
  };
}
