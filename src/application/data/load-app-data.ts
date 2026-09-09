import { CompletedActivity } from "@/lib/rttp-activity";
import { ScheduledWorkout } from "@/lib/rttp-agenda";
import { initialRoutines, initialUsers, Routine, User } from "@/lib/rttp-data";
import { loadSupabaseData, PersistedData } from "@/lib/rttp-supabase";
import { supabaseConfigured } from "@/lib/supabase";

import { RoutineTemplate } from "@/domain/routine/routine-factory";
import { normalizeUser } from "@/domain/user/user-normalization";
import { clearDeprecatedLocalStorage } from "@/infrastructure/storage/legacy-storage";
import { executePendingMutations } from "@/infrastructure/sync/outbox-repository";
import { migrateLocalDataToSupabase } from "@/infrastructure/sync/supabase-migration";
import { syncErrorMessage } from "@/application/sync/sync-error";

export type AppDataLoadResult = {
  data: PersistedData;
  remoteDataApplied: boolean;
  syncError: string | null;
};

export async function loadAppData(): Promise<AppDataLoadResult> {
  clearDeprecatedLocalStorage();
  let remoteDataApplied = false;
  let syncError: string | null = null;
  const availableUsers = initialUsers.map(normalizeUser);
  const availableRoutines = initialRoutines;
  const availableTemplates: RoutineTemplate[] = [];
  const availableWorkouts: ScheduledWorkout[] = [];
  const availableActivities: CompletedActivity[] = [];
  const persistedUsers: User[] = [];
  const persistedRoutines: Routine[] = [];
  const persistedTemplates: RoutineTemplate[] = [];
  const persistedWorkouts: ScheduledWorkout[] = [];
  const persistedActivities: CompletedActivity[] = [];
  const localData = {
    users: availableUsers,
    routines: availableRoutines,
    templates: availableTemplates,
    workouts: availableWorkouts,
    activities: availableActivities,
  };
  const persistedLocalData = {
    users: persistedUsers,
    routines: persistedRoutines,
    templates: persistedTemplates,
    workouts: persistedWorkouts,
    activities: persistedActivities,
  };

  let finalData: PersistedData = localData;
  try {
    if (!supabaseConfigured) {
      throw new Error(
        "Supabase no está configurado. Los cambios solo vivirán mientras esta pestaña siga abierta.",
      );
    }
    await migrateLocalDataToSupabase({
      persistedData: persistedLocalData,
      dataWithSeeds: localData,
    });
    await executePendingMutations();
    const remoteData = await loadSupabaseData();
    finalData = {
      ...remoteData,
      users: remoteData.users.map(normalizeUser),
    };
    remoteDataApplied = true;
  } catch (error) {
    syncError = syncErrorMessage(error);
  }

  return { data: finalData, remoteDataApplied, syncError };
}
