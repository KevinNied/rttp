export function readSessionValue(key: string) {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(key);
}

export function writeSessionValue(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key, value);
}

export function removeSessionValue(key: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key);
}

export function readPersistentSessionValue(key: string) {
  if (typeof window === "undefined") return null;
  const storedValue = window.localStorage.getItem(key);
  if (storedValue !== null) return storedValue;

  const temporaryValue = window.sessionStorage.getItem(key);
  if (temporaryValue !== null) {
    window.localStorage.setItem(key, temporaryValue);
    window.sessionStorage.removeItem(key);
  }
  return temporaryValue;
}

export function writePersistentSessionValue(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
  window.sessionStorage.removeItem(key);
}

export function removePersistentSessionValue(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
  window.sessionStorage.removeItem(key);
}
