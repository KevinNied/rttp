const deprecatedKeys = [
  "rttp-routines-v5",
  "rttp-routines-v4",
  "rttp-rutinas-v4",
  "rttp-templates-v2",
  "rttp-templates-v1",
  "rttp-plantillas-v1",
  "rttp-usuario-v1",
  "rttp-users-v2",
  "rttp-users-v1",
  "rttp-usuarios-v1",
  "rttp-atleta-seleccionado-v1",
  "rttp-schedule-v2",
  "rttp-agenda-v1",
  "rttp-activities-v2",
  "rttp-activities-v1",
  "rttp-actividades-v1",
  "rttp-supabase-migrated-v2",
  "rttp-supabase-migrado-v1",
  "rttp-supabase-migration-source-v2",
  "rttp-supabase-origin-migracion-v1",
  "rttp-supabase-origen-migracion-v1",
  "rttp-supabase-user-mapping-v2",
  "rttp-supabase-mapeo-users-v1",
  "rttp-supabase-mapeo-usuarios-v1",
  "rttp-supabase-outbox-v2",
  "rttp-supabase-pendientes-v1",
] as const;

export function clearDeprecatedLocalStorage() {
  if (typeof window === "undefined") return;
  for (const key of deprecatedKeys) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
}
