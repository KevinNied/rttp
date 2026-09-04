export function countLabel(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return hours > 0
    ? [hours, minutes, seconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":")
    : [minutes, seconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":");
}
