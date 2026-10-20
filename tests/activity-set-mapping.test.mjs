import assert from "node:assert/strict";
import test from "node:test";

import { groupActivitySetsByActivityId } from "../src/infrastructure/activity/activity-set-mapping.ts";

const row = {
  activity_id: "activity-a",
  step_id: "step-1",
  exercise_id: "exercise-1",
  exercise_name: "Example",
  section_id: "section-1",
  section_name: "Main",
  iteration_number: 1,
  weight: "35.5",
  repetitions: 10,
  skipped: false,
};

test("maps all persisted set fields and normalizes numeric weights", () => {
  assert.deepEqual(groupActivitySetsByActivityId([row]).get("activity-a"), [{
    stepId: "step-1",
    exerciseId: "exercise-1",
    exerciseName: "Example",
    sectionId: "section-1",
    sectionName: "Main",
    iteration: 1,
    weight: 35.5,
    reps: 10,
    skipped: false,
  }]);
});

test("groups interleaved rows without changing order or mutating the input", () => {
  const rows = [
    row,
    { ...row, activity_id: "activity-b", step_id: "step-b" },
    { ...row, step_id: "step-2", iteration_number: 2, skipped: true },
  ];
  const before = structuredClone(rows);
  const grouped = groupActivitySetsByActivityId(rows);
  assert.deepEqual(grouped.get("activity-a").map((set) => set.stepId), ["step-1", "step-2"]);
  assert.deepEqual(grouped.get("activity-b").map((set) => set.stepId), ["step-b"]);
  assert.equal(grouped.get("activity-a")[1].skipped, true);
  assert.deepEqual(rows, before);
});

test("preserves zero values and keeps activities without sets empty", () => {
  const grouped = groupActivitySetsByActivityId([{ ...row, weight: 0, repetitions: 0 }]);
  assert.equal(grouped.get("activity-a")[0].weight, 0);
  assert.equal(grouped.get("activity-a")[0].reps, 0);
  assert.deepEqual(grouped.get("missing") ?? [], []);
  assert.equal(groupActivitySetsByActivityId([]).size, 0);
});
