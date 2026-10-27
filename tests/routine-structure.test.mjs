import assert from "node:assert/strict";
import test from "node:test";

import {
  isSequentialRoutine,
  moveSequentialExercise,
  routineExerciseEntries,
} from "../src/domain/routine/routine-structure.ts";

const exercise = (id) => ({
  id,
  name: id,
  instructions: `Instructions for ${id}`,
  sets: 3,
  minReps: 8,
  maxReps: 12,
  weight: 12.5,
  restSeconds: null,
});
const source = {
  id: "routine",
  athleteId: 5,
  createdById: 4,
  sharedWithCoachId: null,
  archivedAt: null,
  title: "Sequential",
  objective: "Strength",
  durationMinutes: null,
  structure: {
    sections: [
      {
        id: "warmup",
        name: "Preparation",
        kind: "sequential",
        role: "warmup",
        presentation: "compact",
        exercises: [exercise("a"), exercise("b")],
      },
      {
        id: "main",
        name: "Strength",
        kind: "sequential",
        role: "main",
        presentation: "standard",
        exercises: [exercise("c"), exercise("d")],
      },
    ],
  },
};

const order = (routine) => routineExerciseEntries(routine).map(({ exercise }) => exercise.id);

test("all-sequential routines are flat even with multiple named sections and compact presentation", () => {
  assert.equal(isSequentialRoutine(source), true);
  assert.equal(isSequentialRoutine({ structure: { sections: [] } }), true);
  assert.equal(isSequentialRoutine({
    structure: { sections: [{ ...source.structure.sections[0], exercises: [] }] },
  }), true);
});

test("rounds and mixed routines retain grouped presentation", () => {
  const rounds = { ...source.structure.sections[0], kind: "rounds" };
  assert.equal(isSequentialRoutine({ structure: { sections: [rounds] } }), false);
  assert.equal(isSequentialRoutine({
    structure: { sections: [source.structure.sections[0], rounds] },
  }), false);
});

test("the projection retains canonical exercise references, owners, order and prescriptions", () => {
  assert.deepEqual(order(source), ["a", "b", "c", "d"]);
  const entries = routineExerciseEntries(source);
  assert.deepEqual(entries.map(({ sectionId }) => sectionId), ["warmup", "warmup", "main", "main"]);
  assert.equal(entries[0].exercise, source.structure.sections[0].exercises[0]);
  assert.equal(entries[3].exercise.restSeconds, null);
});

test("moving within either section matches the flat list order", () => {
  assert.deepEqual(order(moveSequentialExercise(source, "a", "b")), ["b", "a", "c", "d"]);
  assert.deepEqual(order(moveSequentialExercise(source, "d", "c")), ["a", "b", "d", "c"]);
});

test("moving downward across an internal boundary inserts after the target, not before it", () => {
  const result = moveSequentialExercise(source, "b", "c");
  assert.deepEqual(order(result), ["a", "c", "b", "d"]);
  assert.deepEqual(result.structure.sections.map(({ exercises }) => exercises.map(({ id }) => id)), [
    ["a"], ["c", "b", "d"],
  ]);
});

test("moving upward across an internal boundary inserts before the target", () => {
  const result = moveSequentialExercise(source, "c", "b");
  assert.deepEqual(order(result), ["a", "c", "b", "d"]);
  assert.deepEqual(result.structure.sections.map(({ exercises }) => exercises.map(({ id }) => id)), [
    ["a", "c", "b"], ["d"],
  ]);
});

test("moving to either end retains IDs, all prescriptions, ownership and section metadata", () => {
  const before = structuredClone(source);
  for (const [from, to, expected] of [
    ["a", "d", ["b", "c", "d", "a"]],
    ["d", "a", ["d", "a", "b", "c"]],
  ]) {
    const result = moveSequentialExercise(source, from, to);
    assert.deepEqual(order(result), expected);
    assert.equal(result.athleteId, source.athleteId);
    assert.equal(result.createdById, source.createdById);
    for (let index = 0; index < result.structure.sections.length; index += 1) {
      const { exercises, ...metadata } = result.structure.sections[index];
      const originalMetadata = Object.fromEntries(
        Object.entries(source.structure.sections[index]).filter(([key]) => key !== "exercises"),
      );
      assert.deepEqual(metadata, originalMetadata);
      for (const item of exercises) {
        assert.deepEqual(item, routineExerciseEntries(source).find(({ exercise }) => exercise.id === item.id).exercise);
      }
    }
  }
  assert.deepEqual(source, before);
});

test("moving the last exercise out of a section preserves that empty section", () => {
  const first = moveSequentialExercise(source, "a", "d");
  const result = moveSequentialExercise(first, "b", "d");
  assert.equal(result.structure.sections[0].id, "warmup");
  assert.deepEqual(result.structure.sections[0].exercises, []);
  assert.deepEqual(order(result), ["c", "d", "b", "a"]);
});

test("no-op drops and grouped routines preserve the original object", () => {
  assert.equal(moveSequentialExercise(source, "a", "a"), source);
  assert.equal(moveSequentialExercise(source, "missing", "a"), source);
  assert.equal(moveSequentialExercise(source, "a", "missing"), source);
  const mixed = structuredClone(source);
  mixed.structure.sections[1].kind = "rounds";
  assert.equal(moveSequentialExercise(mixed, "a", "c"), mixed);
});
