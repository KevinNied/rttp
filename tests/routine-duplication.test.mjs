import assert from "node:assert/strict";
import test from "node:test";

import {
  duplicateRoutineForAthlete,
  duplicateRoutineForCoach,
} from "../src/domain/routine/routine-factory.ts";
import {
  canCoachEditRoutine,
  canCoachViewRoutine,
} from "../src/domain/routine/routine-access.ts";

const coach = {
  id: 4,
  name: "Coach",
  email: "coach@test.com",
  role: "coach",
  athleteIds: [5],
};
const source = {
  id: "source",
  athleteId: 5,
  createdById: 4,
  sharedWithCoachId: null,
  archivedAt: null,
  title: "Training",
  objective: "Strength",
  durationMinutes: 45,
  structure: {
    sections: [
      {
        id: "section-a",
        name: null,
        kind: "sequential",
        role: "warmup",
        presentation: "compact",
        exercises: [{
          id: "exercise-a",
          name: "First",
          instructions: "Keep controlled",
          sets: 3,
          minReps: 8,
          maxReps: 12,
          weight: 12.5,
          restSeconds: null,
        }],
      },
      {
        id: "section-b",
        name: "Main",
        kind: "rounds",
        role: "main",
        presentation: "standard",
        exercises: [{
          id: "exercise-b",
          name: "Second",
          instructions: "",
          sets: 4,
          minReps: 10,
          maxReps: 10,
          weight: 0,
          restSeconds: 0,
        }],
      },
    ],
  },
};

function entityIds(routine) {
  return [
    routine.id,
    ...routine.structure.sections.flatMap((section) => [
      section.id,
      ...section.exercises.map((exercise) => exercise.id),
    ]),
  ];
}

test("coach copies retain the athlete and coach authorship but start active and unshared", () => {
  const copy = duplicateRoutineForCoach({
    ...source,
    archivedAt: "2026-10-20",
    sharedWithCoachId: 4,
  }, coach.id);
  assert.equal(copy.athleteId, source.athleteId);
  assert.equal(copy.createdById, coach.id);
  assert.equal(copy.title, "Training (copia)");
  assert.equal(copy.sharedWithCoachId, null);
  assert.equal(copy.archivedAt, null);
  assert.equal(copy.objective, source.objective);
  assert.equal(copy.durationMinutes, source.durationMinutes);
});

test("copies preserve all section strategies, prescriptions and optional rest values", () => {
  const copy = duplicateRoutineForCoach(source, coach.id);
  const withoutIds = (routine) => JSON.parse(
    JSON.stringify(routine.structure, (key, value) => key === "id" ? undefined : value),
  );
  assert.deepEqual(withoutIds(copy), withoutIds(source));
  assert.equal(copy.structure.sections[0].exercises[0].restSeconds, null);
  assert.equal(copy.structure.sections[1].exercises[0].restSeconds, 0);
});

test("every copied entity receives a new identifier, also across successive copies", () => {
  const first = duplicateRoutineForCoach(source, coach.id);
  const second = duplicateRoutineForCoach(source, coach.id);
  const ids = [...entityIds(source), ...entityIds(first), ...entityIds(second)];
  assert.equal(new Set(ids).size, ids.length);
});

test("editing a copy does not mutate the original or another copy", () => {
  const before = structuredClone(source);
  const first = duplicateRoutineForCoach(source, coach.id);
  const second = duplicateRoutineForCoach(source, coach.id);
  first.title = "Edited copy";
  first.structure.sections[0].name = "Changed";
  first.structure.sections[0].exercises[0].weight = 50;
  first.structure.sections[1].exercises.pop();
  assert.deepEqual(source, before);
  assert.equal(second.structure.sections[0].exercises[0].weight, 12.5);
  assert.equal(second.structure.sections[1].exercises.length, 1);
});

test("athlete duplication keeps its existing personal-copy ownership", () => {
  const copy = duplicateRoutineForAthlete(source, source.athleteId);
  assert.equal(copy.createdById, source.athleteId);
  assert.equal(copy.athleteId, source.athleteId);
  assert.equal(copy.sharedWithCoachId, null);
  assert.equal(copy.archivedAt, null);
  assert.equal(copy.title, "Training (copia)");
  assert.equal(entityIds(copy).some((id) => entityIds(source).includes(id)), false);
});

test("the coach permission gate excludes shared athlete routines, other authors and unassigned athletes", () => {
  assert.equal(canCoachEditRoutine(source, coach), true);
  const shared = { ...source, createdById: 5, sharedWithCoachId: coach.id };
  assert.equal(canCoachViewRoutine(shared, coach), true);
  assert.equal(canCoachEditRoutine(shared, coach), false);
  assert.equal(canCoachEditRoutine({ ...source, createdById: 9 }, coach), false);
  assert.equal(canCoachEditRoutine({ ...source, athleteId: 6 }, coach), false);
  assert.equal(canCoachEditRoutine(source, { ...coach, athleteIds: [] }), false);
  assert.equal(canCoachEditRoutine(source, { ...coach, role: "athlete" }), false);
});
