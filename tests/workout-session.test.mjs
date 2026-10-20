import assert from "node:assert/strict";
import test from "node:test";

import {
  completedSetsForSession,
  recordsForSession,
  updateTrainingSetRecord,
} from "../src/domain/workout/workout-session.ts";

const completed = Object.freeze({
  weight: 20,
  reps: 10,
  completed: true,
  skipped: false,
  deferred: false,
  weightEdited: false,
});

test("changing reps reopens only the edited result and preserves its load", () => {
  assert.deepEqual(updateTrainingSetRecord(completed, { reps: 12 }), {
    ...completed,
    reps: 12,
    completed: false,
  });
  assert.equal(completed.completed, true);
});

test("changing weight preserves the explicit weight edit and repetitions", () => {
  assert.deepEqual(
    updateTrainingSetRecord(completed, { weight: 22.5, weightEdited: true }),
    { ...completed, weight: 22.5, weightEdited: true, completed: false },
  );
});

test("unchanged values and metadata do not reopen a completed set", () => {
  for (const patch of [
    {},
    { reps: 10 },
    { weight: 20 },
    { weight: 20, weightEdited: true },
    { reps: 10, weight: 20 },
  ]) {
    assert.equal(updateTrainingSetRecord(completed, patch).completed, true);
  }
});

test("zero values are changes, but unchanged zero stays completed", () => {
  assert.equal(updateTrainingSetRecord(completed, { weight: 0 }).completed, false);
  assert.equal(updateTrainingSetRecord(completed, { reps: 0 }).completed, false);
  const zeroLoad = { ...completed, weight: 0 };
  assert.equal(updateTrainingSetRecord(zeroLoad, { weight: 0 }).completed, true);
});

test("pending, skipped and deferred states are not implicitly completed", () => {
  for (const state of [
    { completed: false },
    { completed: false, skipped: true },
    { completed: false, deferred: true },
  ]) {
    const record = { ...completed, ...state };
    assert.deepEqual(updateTrainingSetRecord(record, { reps: 8 }), {
      ...record,
      reps: 8,
    });
  }
});

test("an edited set needs explicit completion even if the original value returns", () => {
  const edited = updateTrainingSetRecord(completed, { reps: 12 });
  const reverted = updateTrainingSetRecord(edited, { reps: 10 });
  assert.equal(reverted.completed, false);
  assert.equal(
    updateTrainingSetRecord(reverted, { completed: true, skipped: false })
      .completed,
    true,
  );
  assert.equal(
    updateTrainingSetRecord(completed, { completed: false }).completed,
    false,
  );
});

test("a numeric change takes precedence over a completion flag in the same patch", () => {
  assert.equal(
    updateTrainingSetRecord(completed, { weight: 30, completed: true }).completed,
    false,
  );
});

test("progress and recovered records reflect the edit without changing other sets", () => {
  const original = {
    "session-a-exercise-0": completed,
    "session-a-exercise-1": completed,
    "session-b-exercise-0": completed,
  };
  const edited = {
    ...original,
    "session-a-exercise-0": updateTrainingSetRecord(completed, { reps: 11 }),
  };
  assert.equal(completedSetsForSession(original, "session-a"), 2);
  assert.equal(completedSetsForSession(edited, "session-a"), 1);
  assert.equal(completedSetsForSession(edited, "session-b"), 1);
  assert.equal(edited["session-a-exercise-1"], completed);
  const restored = JSON.parse(JSON.stringify(recordsForSession(edited, "session-a")));
  assert.equal(restored["session-a-exercise-0"].completed, false);
  assert.equal(restored["session-a-exercise-0"].reps, 11);
  assert.equal(completedSetsForSession(restored, "session-a"), 1);
});
