import assert from "node:assert/strict";
import test from "node:test";

import {
  carryForwardSetResults,
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
    { reps: 10, repsEdited: true },
    { reps: 10, weight: 20 },
  ]) {
    assert.equal(updateTrainingSetRecord(completed, patch).completed, true);
  }
});

const pending = Object.freeze({
  weight: 0,
  reps: 8,
  completed: false,
  skipped: false,
  weightEdited: false,
  repsEdited: false,
});

test("advancing carries both results without completing the next set", () => {
  assert.deepEqual(carryForwardSetResults(completed, pending), {
    ...pending,
    weight: 20,
    reps: 10,
  });
  assert.equal(pending.weight, 0);
  assert.equal(pending.reps, 8);
});

test("manual weight and reps are protected independently", () => {
  assert.deepEqual(
    carryForwardSetResults(completed, { ...pending, weight: 30, weightEdited: true }),
    { ...pending, weight: 30, weightEdited: true, reps: 10 },
  );
  assert.deepEqual(
    carryForwardSetResults(completed, { ...pending, reps: 12, repsEdited: true }),
    { ...pending, weight: 20, reps: 12, repsEdited: true },
  );
  const edited = { ...pending, weight: 30, reps: 12, weightEdited: true, repsEdited: true };
  assert.deepEqual(carryForwardSetResults(completed, edited), edited);
});

test("zero results propagate and explicitly entered zeros are preserved", () => {
  assert.deepEqual(
    carryForwardSetResults({ ...completed, weight: 0, reps: 0 }, pending),
    { ...pending, weight: 0, reps: 0 },
  );
  assert.equal(
    carryForwardSetResults(completed, { ...pending, reps: 0, repsEdited: true }).reps,
    0,
  );
});

test("completed and skipped target sets are never overwritten", () => {
  for (const target of [completed, { ...pending, skipped: true }]) {
    assert.equal(carryForwardSetResults(completed, target), target);
  }
});

test("pending or skipped source sets do not propagate values", () => {
  for (const source of [pending, { ...completed, skipped: true }]) {
    assert.equal(carryForwardSetResults(source, pending), pending);
  }
});

test("deferred sets receive results without losing their deferred state", () => {
  assert.deepEqual(
    carryForwardSetResults(completed, { ...pending, deferred: true }),
    { ...pending, weight: 20, reps: 10, deferred: true },
  );
});

test("inherited values can be refreshed until the athlete edits them", () => {
  const inherited = carryForwardSetResults(completed, pending);
  const changed = { ...completed, weight: 25, reps: 15 };
  assert.deepEqual(carryForwardSetResults(changed, inherited), {
    ...pending,
    weight: 25,
    reps: 15,
  });
  const edited = updateTrainingSetRecord(inherited, { reps: 9, repsEdited: true });
  const restored = JSON.parse(JSON.stringify(edited));
  assert.deepEqual(carryForwardSetResults(changed, restored), {
    ...pending,
    weight: 25,
    reps: 9,
    repsEdited: true,
  });
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
