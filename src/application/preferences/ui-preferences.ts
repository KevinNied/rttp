import {
  mobileDockOnboardingStorageKey,
  sidebarPreferenceStorageKey,
  themeStorageKey,
} from "@/infrastructure/storage/storage-keys";
import {
  readPersistentSessionValue,
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

export function shouldShowMobileDockOnboarding() {
  return readPersistentSessionValue(mobileDockOnboardingStorageKey) !== "true";
}

export function dismissMobileDockOnboarding() {
  writePersistentSessionValue(mobileDockOnboardingStorageKey, "true");
}

export function writeThemePreference(theme: "dark" | "light") {
  writePersistentSessionValue(themeStorageKey, theme);
}
