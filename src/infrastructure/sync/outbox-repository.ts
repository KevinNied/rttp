import {
  executeSupabaseMutation,
  remapSupabaseMutation,
  SupabaseMutation,
  UserIdMapping,
} from "@/lib/rttp-supabase";
import { supabaseConfigured } from "@/lib/supabase";

import {
  readSessionValue,
  removeSessionValue,
  writeSessionValue,
} from "@/infrastructure/storage/web-storage";
import {
  supabaseMigrationLock,
  supabaseMigrationStorageKey,
  supabaseOutboxLock,
  supabaseOutboxStorageKey,
  supabaseUserMappingStorageKey,
} from "@/infrastructure/storage/storage-keys";

export function readPendingMutations() {
  const guardadas = readSessionValue(supabaseOutboxStorageKey);
  if (!guardadas) return [];
  try {
    return JSON.parse(guardadas) as SupabaseMutation[];
  } catch {
    removeSessionValue(supabaseOutboxStorageKey);
    throw new Error(
      "La cola temporal de sincronización estaba dañada y debió reiniciarse.",
    );
  }
}

export function savePendingMutations(mutations: SupabaseMutation[]) {
  if (mutations.length === 0) {
    removeSessionValue(supabaseOutboxStorageKey);
    return;
  }
  writeSessionValue(supabaseOutboxStorageKey, JSON.stringify(mutations));
}

export function readUserMapping() {
  const guardado = readSessionValue(supabaseUserMappingStorageKey);
  if (!guardado) return {};
  try {
    return JSON.parse(guardado) as UserIdMapping;
  } catch {
    throw new Error("El mapeo temporal de perfiles está dañado.");
  }
}

export async function enqueueMutation(
  mutation: SupabaseMutation,
  requiresRemapping: boolean,
) {
  await navigator.locks.request(supabaseMigrationLock, async () => {
    await navigator.locks.request(supabaseOutboxLock, () => {
      const finalMutation =
        requiresRemapping &&
        readSessionValue(supabaseMigrationStorageKey) === "true"
          ? remapSupabaseMutation(mutation, readUserMapping())
          : mutation;
      savePendingMutations([...readPendingMutations(), finalMutation]);
    });
  });
}

export async function executePendingMutations() {
  await navigator.locks.request(supabaseMigrationLock, async () => {
    await navigator.locks.request(supabaseOutboxLock, async () => {
      if (!supabaseConfigured) {
        throw new Error(
          "Supabase no está configurado. Los cambios solo vivirán mientras esta pestaña siga abierta.",
        );
      }
      if (readSessionValue(supabaseMigrationStorageKey) !== "true") {
        throw new Error(
          "La migración inicial está pendiente. Los cambios se sincronizarán al recuperar la conexión.",
        );
      }
      while (true) {
        const mutation = readPendingMutations()[0];
        if (!mutation) return;
        await executeSupabaseMutation(mutation);
        savePendingMutations(
          readPendingMutations().filter(
            (pending) => pending.id !== mutation.id,
          ),
        );
      }
    });
  });
}
