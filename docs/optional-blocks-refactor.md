# RTTP Refactor Plan: Optional Blocks in Routines

## 1) Why this change

Today, routine authoring is block-first. This is great for supersets, warm-up circuits, and alternating rounds, but it adds friction for classic gym plans where the athlete should:

1. Complete all sets of one exercise
2. Move to the next exercise

Goal: support both models with first-class UX and stable persistence.

---

## 2) Scope and objectives

### Product objective
- Make blocks optional for coaches.
- Keep current grouped execution behavior for routines that need it.

### Technical objective
- Introduce a dual routine mode with backward compatibility.
- Avoid risky mass rewrites of historical activity data.

### Non-goals (for this phase)
- Supabase Auth redesign.
- New permission model.
- Redesign of activity analytics logic beyond compatibility.

---

## 3) Current state (baseline)

## App domain
- `Routine` uses `blocks: Block[]` as required structure.
- Exercise execution steps are derived by flattening block rounds.
- Runtime and UI assume block metadata (`blockId`, `blockName`, `block type`) exists.

## Persistence
- `routines.blocks` and `routine_templates.blocks` are JSONB and required.
- `workout_activity_sets` requires `block_id`, `block_name`, `round_number`.
- `routine_snapshot` stores routine shape with blocks.

## UX
- Coach editor is block-centric.
- Athlete workout flow uses block progress and block-level skip behaviors.

---

## 4) Target architecture (recommended)

Use a dual routine mode:

- `routineMode: "legacy" | "blocks"`
  - `legacy`: sequential gym-style routine (exercise-first).
  - `blocks`: grouped/alternating/circuit routine (current behavior).

Recommended canonical shape:

- Keep one unified `Routine` object with mode + mode-specific payload.
- Keep `blocks` shape for `blocks` mode.
- Add `exercises` ordered list for `legacy` mode.

Important: at runtime, normalize both modes to a single execution-step model so athlete flow remains consistent.

---

## 5) UX design changes

## Coach routine editor
- Add mode selector at routine level:
  - "Rutina clasica (secuencial)"
  - "Rutina por bloques"
- Render mode-specific editor:
  - Legacy editor: direct ordered exercise list.
  - Blocks editor: existing block editor with placeholders.
- Confirm before mode switch if unsaved changes exist.

## Athlete workout
- No conceptual split in workout screen.
- Internally use normalized step stream from either mode.
- Keep skip/complete actions stable.

## Schedule + history
- Continue showing routine name and details regardless of mode.
- Preserve link rendering in free text fields.

---

## 6) Database and API contract strategy

## Schema evolution

Option A (recommended for safety):
- Keep existing `blocks` columns.
- Add nullable JSONB `legacy_exercises`.
- Add `routine_mode` check constraint (`legacy`, `blocks`) with default `blocks`.

Option B (larger rewrite):
- Replace `blocks` with a generic `items` JSONB union model.
- Higher migration risk and larger client rewrite.

This plan assumes Option A.

## Activity sets compatibility
- Keep `workout_activity_sets` columns non-null.
- For legacy routines, emit synthetic block metadata per exercise:
  - `block_id = exercise_id`
  - `block_name = exercise_name`
  - `round_number` from set progression

This preserves history grouping and avoids null-related regressions.

## RPC updates
- Update `create_athlete_with_routine`, `save_workout_activity`, and migration RPCs to accept mode-aware routine payloads.
- Keep old payload compatibility during transition window.

---

## 7) Migration plan

## Phase 0 - Preparation
- Add mode-aware TypeScript types.
- Add read normalizer that accepts:
  - old routines (blocks-only)
  - new legacy mode routines
  - new blocks mode routines

## Phase 1 - DB migration
- Add columns + constraints for mode and legacy payload.
- Backfill existing rows to `routine_mode = 'blocks'`.
- Do not rewrite historical `routine_snapshot` rows.

## Phase 2 - Write path update
- Save mode-specific fields from app to Supabase.
- Keep backward-compatible read adapters in `rttp-supabase.ts`.

## Phase 3 - UI rollout
- Enable mode selector in coach editor.
- Introduce legacy exercise editor and keep blocks editor untouched.

## Phase 4 - Execution and history
- Normalize routine mode to common step model.
- Ensure activity logs remain valid for both modes.

## Phase 5 - Cleanup (optional, later)
- Remove legacy compatibility branches only after stable telemetry and data verification.

---

## 8) Data quality and validation rules

- `legacy` mode:
  - must have at least one exercise in ordered list
  - no blocks required
- `blocks` mode:
  - must have at least one block
  - each block must preserve existing validation
- Prevent ambiguous mixed payloads in writes.
- Validate and sanitize link/text fields as already implemented.

---

## 9) Backward compatibility requirements

- Existing routines must continue to work without conversion.
- Existing templates must continue to work without conversion.
- Existing completed activities and snapshots must remain readable.
- Existing localStorage backups and migration source payloads must parse safely.

---

## 10) Test plan

## Unit/integration
- Normalizer outputs equivalent step sequence for old block routines.
- Legacy routine execution order is strictly sequential.
- Block routine execution behavior remains unchanged.
- Snapshot serialization/deserialization supports both modes.

## UI regression
- Coach can create/edit/delete both routine modes.
- Athlete can complete/skip/restore flows in both modes.
- Schedule assignment and drag-drop flow still work.

## Persistence regression
- CRUD routines/templates in both modes.
- Activity recording writes valid non-null set metadata.
- Migration from localStorage remains idempotent.

---

## 11) Rollout and risk control

- Feature flag recommended: `routine_mode_optional_blocks`.
- Start with internal/staging data.
- Verify:
  - no sync errors
  - no snapshot parse failures
  - no history grouping regressions

Rollback strategy:
- Disable feature flag.
- Continue reading both shapes.
- Keep DB columns additive (no destructive migration in first rollout).

---

## 12) Work breakdown (suggested)

1. Domain types + normalizer layer
2. DB migration + Supabase adapter updates
3. Coach editor dual-mode UX
4. Athlete execution compatibility
5. Activity/history validation
6. Full regression pass (mobile + desktop)

---

## 13) Acceptance criteria

- Coach can author a routine without blocks.
- Coach can still author grouped block routines.
- Athlete execution semantics are correct in both modes.
- No data loss across old routines, templates, or activity history.
- Supabase sync remains stable with no schema mismatch errors.

