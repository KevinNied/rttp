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
import { SyncState } from "@/application/sync/sync-state";

export type AppDataStore = {
  hydrated: boolean;
  syncState: SyncState;
  syncError: string | null;
  setSyncError: (message: string | null) => void;
  retrySync: () => void;
  persist: (mutation: NewSupabaseMutation) => void;
  executeRemoteMutation: <T>(operation: () => Promise<T>) => Promise<T>;
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
  const [syncState, setSyncState] = useState<SyncState>("loading");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hydrateRequest, setHydrateRequest] = useState(0);
  const persistenceQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingOperationsRef = useRef(0);
  const mutationRevisionRef = useRef(0);
  const remoteDataAppliedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const retryPending = () => {
      setHydrateRequest((current) => current + 1);
    };
    window.addEventListener("online", retryPending);

    async function hydrate() {
      const mutationRevisionAtStart = mutationRevisionRef.current;
      const hadPendingOperationsAtStart = pendingOperationsRef.current > 0;
      setSyncState(remoteDataAppliedRef.current ? "saving" : "loading");
      const {
        data: finalData,
        remoteDataApplied,
        syncError: nextSyncError,
      } = await loadAppData();
      if (cancelled) return;
      if (!remoteDataApplied && remoteDataAppliedRef.current) {
        setSyncError(nextSyncError);
        setSyncState("pending");
        setHydrated(true);
        return;
      }
      if (
        remoteDataApplied &&
        remoteDataAppliedRef.current &&
        (hadPendingOperationsAtStart ||
          mutationRevisionRef.current !== mutationRevisionAtStart)
      ) {
        remoteDataAppliedRef.current = true;
        setHydrated(true);
        return;
      }
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
      setSyncError(nextSyncError);
      setSyncState(remoteDataApplied ? "idle" : "unavailable");

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
  }, [athleteRouteId, hydrateRequest]);

  const persist = useCallback((newMutation: NewSupabaseMutation) => {
    if (!remoteDataAppliedRef.current) {
      setSyncState("unavailable");
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
    mutationRevisionRef.current += 1;
    pendingOperationsRef.current += 1;
    setSyncState("saving");
    const operation = persistenceQueueRef.current.then(async () => {
      await enqueueMutation(mutation, false);
      await executePendingMutations();
    });
    persistenceQueueRef.current = operation.catch(() => undefined);
    void operation
      .then(() => {
        setSyncError(null);
        if (pendingOperationsRef.current === 1) setSyncState("idle");
      })
      .catch((error: unknown) => {
        setSyncState("pending");
        setSyncError(syncErrorMessage(error));
      })
      .finally(() => {
        pendingOperationsRef.current = Math.max(
          0,
          pendingOperationsRef.current - 1,
        );
      });
  }, []);

  const executeRemoteMutation = useCallback(
      async <T,>(operation: () => Promise<T>) => {
        if (!remoteDataAppliedRef.current) {
          throw new Error(
            "La persistencia remota no está disponible. Reintentá antes de guardar cambios.",
          );
        }
        mutationRevisionRef.current += 1;
        pendingOperationsRef.current += 1;
        setSyncState("saving");
        try {
          const result = await operation();
          setSyncError(null);
          if (pendingOperationsRef.current === 1) setSyncState("idle");
          return result;
        } catch (error) {
          setSyncState("error");
          setSyncError(syncErrorMessage(error));
          throw error;
        } finally {
          pendingOperationsRef.current = Math.max(
            0,
            pendingOperationsRef.current - 1,
          );
        }
      },
      [],
  );

  return {
    hydrated,
    syncState,
    syncError,
    setSyncError,
    retrySync: () => setHydrateRequest((current) => current + 1),
    persist,
    executeRemoteMutation,
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
