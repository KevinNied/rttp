import {
  loadSupabaseData,
  migrateMissingData,
  PersistedData,
  remapSupabaseMutation,
  SupabaseMutation,
} from "@/lib/rttp-supabase";

import {
  selectedAthleteStorageKey,
  sessionStorageKey,
  supabaseMigrationLock,
  supabaseMigrationSourceStorageKey,
  supabaseMigrationStorageKey,
  supabaseOutboxLock,
  supabaseUserMappingStorageKey,
} from "@/infrastructure/storage/storage-keys";
import {
  readPersistentSessionValue,
  readSessionValue,
  removeSessionValue,
  writePersistentSessionValue,
  writeSessionValue,
} from "@/infrastructure/storage/web-storage";
import {
  readPendingMutations,
  savePendingMutations,
} from "@/infrastructure/sync/outbox-repository";

export type MigrationSource = {
  persistedData: PersistedData;
  dataWithSeeds: PersistedData;
  useSeeds: boolean | null;
  mutations: SupabaseMutation[];
  userId: string | null;
  athleteId: string | null;
  remappingStarted: boolean;
};

function readMigrationSource() {
  const guardado = readSessionValue(supabaseMigrationSourceStorageKey);
  if (!guardado) return null;
  try {
    return JSON.parse(guardado) as MigrationSource;
  } catch {
    throw new Error("El respaldo temporal para migrar a Supabase está dañado.");
  }
}

function saveMigrationSource(origin: MigrationSource) {
  writeSessionValue(supabaseMigrationSourceStorageKey, JSON.stringify(origin));
}

export async function migrateLocalDataToSupabase({
  persistedData,
  dataWithSeeds,
}: {
  persistedData: PersistedData;
  dataWithSeeds: PersistedData;
}) {
  await navigator.locks.request(supabaseMigrationLock, async () => {
    const migrationStatus = readSessionValue(supabaseMigrationStorageKey);
    if (migrationStatus === "true") {
      removeSessionValue(supabaseMigrationSourceStorageKey);
      return;
    }

    let origin = readMigrationSource();
    if (!origin) {
      origin = {
        persistedData,
        dataWithSeeds,
        useSeeds:
          migrationStatus === "seeds"
            ? true
            : migrationStatus === "local"
              ? false
              : null,
        mutations: [],
        userId: null,
        athleteId: null,
        remappingStarted: false,
      };
      saveMigrationSource(origin);
    }

    const currentRemoteData = await loadSupabaseData();
    if (origin.useSeeds === null) {
      origin = {
        ...origin,
        useSeeds: Object.values(currentRemoteData).every(
          (items) => items.length === 0,
        ),
      };
      saveMigrationSource(origin);
      writeSessionValue(
        supabaseMigrationStorageKey,
        origin.useSeeds ? "seeds" : "local",
      );
    }

    const userMapping = await migrateMissingData(
      origin.useSeeds ? origin.dataWithSeeds : origin.persistedData,
    );
    writeSessionValue(
      supabaseUserMappingStorageKey,
      JSON.stringify(userMapping),
    );
    if (!origin.remappingStarted) {
      origin = {
        ...origin,
        mutations: readPendingMutations(),
        userId: readPersistentSessionValue(sessionStorageKey),
        athleteId: readPersistentSessionValue(selectedAthleteStorageKey),
        remappingStarted: true,
      };
      saveMigrationSource(origin);
    }
    await navigator.locks.request(supabaseOutboxLock, () => {
      savePendingMutations(
        origin.mutations.map((mutation) =>
          remapSupabaseMutation(mutation, userMapping),
        ),
      );
    });

    for (const [key, storedId] of [
      [sessionStorageKey, origin.userId],
      [selectedAthleteStorageKey, origin.athleteId],
    ] as const) {
      const remappedId = storedId ? userMapping[storedId] : undefined;
      if (remappedId !== undefined) {
        writePersistentSessionValue(key, String(remappedId));
      }
    }
    writeSessionValue(supabaseMigrationStorageKey, "true");
    removeSessionValue(supabaseMigrationSourceStorageKey);
  });
}
