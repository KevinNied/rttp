import type { ActivitySet } from "@/lib/rttp-activity";

export type ActivitySetRow = {
  activity_id: string;
  step_id: string;
  exercise_id: string;
  exercise_name: string;
  section_id: string;
  section_name: string;
  iteration_number: number;
  weight: number;
  repetitions: number;
  skipped: boolean;
};

export function groupActivitySetsByActivityId(rows: ActivitySetRow[]) {
  const grouped = new Map<string, ActivitySet[]>();
  for (const row of rows) {
    let sets = grouped.get(row.activity_id);
    if (!sets) {
      sets = [];
      grouped.set(row.activity_id, sets);
    }
    sets.push({
      stepId: row.step_id,
      exerciseId: row.exercise_id,
      exerciseName: row.exercise_name,
      sectionId: row.section_id,
      sectionName: row.section_name,
      iteration: row.iteration_number,
      weight: Number(row.weight),
      reps: row.repetitions,
      skipped: row.skipped,
    });
  }
  return grouped;
}
