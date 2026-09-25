export function syncErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error ?? "");

  if (/duplicate key|unique constraint|already exists/i.test(message)) {
    return "Ya existe un perfil con ese email.";
  }
  if (/failed to fetch|networkerror|network request|fetch failed/i.test(message)) {
    return "Revisá tu conexión y volvé a intentarlo.";
  }
  if (/supabase no está configurado/i.test(message)) {
    return "La base de datos no está disponible en este entorno.";
  }
  if (/migración inicial está pendiente/i.test(message)) {
    return "La sincronización inicial está pendiente. Reintentá cuando recuperes la conexión.";
  }
  if (/permission|row-level security|not authorized|unauthorized/i.test(message)) {
    return "No tenés permisos para completar esta acción.";
  }
  if (/^No (se pudo|pudimos)|^La cola temporal|^El mapeo temporal/.test(message)) {
    return message.split(":")[0];
  }
  return "No pudimos sincronizar los datos. Reintentá en unos segundos.";
}
