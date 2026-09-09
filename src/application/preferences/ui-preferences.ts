import {
  sidebarPreferenceStorageKey,
  themeStorageKey,
} from "@/infrastructure/storage/storage-keys";
import {
  readSessionValue,
  writePersistentSessionValue,
  writeSessionValue,
} from "@/infrastructure/storage/web-storage";

export function readSidebarCompactPreference() {
  return readSessionValue(sidebarPreferenceStorageKey) === "true";
}

export function writeSidebarCompactPreference(compact: boolean) {
  writeSessionValue(sidebarPreferenceStorageKey, String(compact));
}

export function writeThemePreference(theme: "dark" | "light") {
  writePersistentSessionValue(themeStorageKey, theme);
}
