# RTTP - Product Requirements Document

> **RTTP** stands for **Return To The Prime**.

| Document status | Product stage |
| --- | --- |
| Current source of truth | Functional product iteration |

## Table of contents

- [Vision](#vision)
- [Product goal](#product-goal)
- [Users and roles](#users-and-roles)
- [Product principles](#product-principles)
- [Current product scope](#current-product-scope)
- [Core business rules](#core-business-rules)
- [Confirmed UX decisions](#confirmed-ux-decisions)
- [Data, persistence, and security](#data-persistence-and-security)
- [Success measures](#success-measures)
- [Deferred roadmap](#deferred-roadmap)
- [Explicitly out of scope](#explicitly-out-of-scope)
- [Supporting product documents](#supporting-product-documents)

## Vision

RTTP transforms static training plans into a focused, interactive workout
experience. It should help athletes understand what to do next, execute with
minimal interruption, and preserve useful training data for themselves and
their coaches.

RTTP does not need to replace every tool a coach uses. Its primary purpose is
to replace the experience of reading and updating a spreadsheet while training.

## Product goal

Create the best mobile experience for executing a structured workout while
providing coaches with an efficient responsive workspace for planning and
reviewing their athletes' training.

The product must:

- minimize interaction and cognitive load during a workout;
- preserve the structure and intent of the routine;
- make scheduled and completed training easy to understand;
- keep athlete history independent from later routine edits or deletion;
- support athletes with or without an assigned coach;
- remain useful when remote persistence is temporarily unavailable.

## Users and roles

RTTP has two exclusive roles.

### Athlete

The athlete has the highest product priority during workout execution. An
athlete can:

- train independently or with an assigned coach;
- use routines created by the coach;
- create, edit, duplicate, schedule, and execute personal routines;
- organize RTTP routines and external sports in one weekly agenda;
- record sets, repetitions, weight, effort, and feedback;
- review and delete historical activities;
- share a personal routine with the assigned coach in read-only mode.

### Coach

The coach uses a first-class responsive workspace optimized for desktop without
losing mobile support. A coach can:

- create and manage assigned athletes;
- create, edit, reorder, assign, and delete routines;
- create reusable routine templates;
- schedule routines and external activities for an athlete;
- review an athlete's activity history;
- open an explicit read-only preview of the athlete experience;
- view personal routines only when the athlete shared them explicitly.

Roles come from the entered email in the current iteration. This selects a local
profile for convenience; it is not authentication.

## Product principles

### Mobile-first execution

The athlete is usually moving, using one hand, and dividing attention between
the screen and the workout. Primary actions must be reachable, readable, and
fast on a phone.

### Clear next action

The workout experience should always answer:

> What should I do now?

Only information that supports the current decision should compete for primary
attention.

### Preserve structure

Warmups, preparation, circuits, main work, and accessories are meaningful
parts of the plan. The interface must preserve this hierarchy without forcing
all routines into one execution pattern.

### Low-friction recording

A completed set should be recordable in less than three seconds under normal
conditions. Defaults may help, but the athlete remains in control of the actual
weight, repetitions, skipped sets, and feedback.

### Historical integrity

Completed activities describe what happened at that time. Later changes to a
routine, agenda entry, coach relationship, or source definition must not rewrite
history.

### Premium, restrained interface

RTTP uses dark mode by default and fully supports light mode. Visual hierarchy,
contrast, spacing, responsive balance, and legible navigation take precedence
over decorative density.

## Current product scope

### Athlete Home

Home provides immediate context without duplicating the full agenda:

- today's scheduled or in-progress training;
- the next scheduled workout;
- quick access to the routine library and agenda;
- a Monday-to-Sunday weekly timeline;
- completed, in-progress, scheduled, skipped, and empty day states;
- a streak of active weeks with comparison against the previous week.

Deleting an activity also removes its associated agenda occurrence. Home must
not continue showing an orphaned workout as completed.

### Routine library and editing

The athlete library combines coach-created and personal routines while keeping
their authorship visible.

- Personal routines can be created from scratch or duplicated from an existing
  routine.
- The athlete can edit and permanently delete a personal routine.
- Coach-created routines are read-only for the athlete.
- A coach-created routine can be archived from the athlete's library without
  deleting the coach's definition.
- A personal routine can be shared explicitly with the currently assigned coach
  and access can be revoked.
- Unsaved editor changes require an RTTP confirmation for internal navigation
  and browser protection for reload or tab close.

Routine composition uses ordered sections and exercises. Creation of sections
and exercises is inline for low-friction editing. Drag and drop is available
where reordering is supported.

### Routine structure

`Routine.structure.sections` is the canonical live routine model.

- A `sequential` section completes all sets of one exercise before advancing.
- A `rounds` section alternates its exercises by iteration.
- Execution strategy, semantic role, and visual presentation are independent.
- Preparation sections support a compact block overview and individual
  swipeable cards.
- Exercise rest is optional. When rest is `null`, it is absent from every UI.

### Workout execution

The workout mode is an immersive step-by-step experience.

- The athlete can start, pause, resume, and explicitly cancel a workout.
- Position, recorded sets, elapsed time, active rest, postponed exercises,
  effort, and pending feedback survive reloads.
- Leaving the workout pauses it; cancelling removes the in-progress occurrence
  and its temporary state without creating a completed activity.
- Weight and repetitions can be recorded per set.
- A configured rest starts a controllable countdown after completing a set.
- An unavailable exercise can be postponed and returned to later.
- The overview remains available without abandoning the active session.
- Finishing creates one immutable historical activity and clears temporary
  execution state.

### Sports agenda

The agenda combines RTTP routines and external sports in a weekly calendar.

- Weeks start on Monday.
- Dates are local calendar dates to avoid timezone day shifts.
- Time is optional.
- Activities may overlap.
- Desktop supports drag-and-drop rescheduling and double-click creation.
- Mobile provides contextual creation for the selected day.
- Date and time use RTTP-styled controls rather than native browser dialogs.
- Recurrence supports weekly, biweekly, ordinal monthly, and custom weekday
  patterns.
- Recurrence can end by date or occurrence count, with a maximum of 52
  occurrences per operation.
- Every generated occurrence has independent progress and status.
- Entries can be edited, skipped, completed when applicable, or deleted with
  confirmation.

The detailed agenda contract lives in
[sports-schedule.md](./sports-schedule.md).

### Progress and activity history

Progress contains RTTP workout activities and completed external activities.

- RTTP activities store an immutable routine snapshot and set-level results.
- Duration is stored in seconds and displayed without forced minute rounding.
- Long routines group results by section and exercise for readable scaling.
- Empty notes or feedback use a minimal inline state rather than an empty card.
- The athlete can delete both RTTP and external activities.
- The coach can review assigned athletes' history but cannot delete it.
- Deleting an RTTP activity preserves the reusable routine definition.

The detailed history contract lives in
[activity-log.md](./activity-log.md).

### Profile and appearance

Profile shows account data, assigned coach when present, appearance preference,
and the installed product version. It does not duplicate the role badge already
present in navigation.

The shell supports:

- dark and light themes;
- persistent theme preference;
- responsive page width consistent across product surfaces;
- a desktop sidebar that can be compacted;
- a mobile bottom dock with persistent icon labels;
- safe-area support for modern mobile devices.

## Core business rules

- Athletes can access only their own experience.
- Coaches can manage only their assigned athletes.
- Athlete preview is explicit, read-only, and cannot mutate athlete data.
- Routine authorship determines edit and delete permissions.
- Sharing a personal routine with a coach never transfers ownership or edit
  permission.
- A block containing one exercise completes its sets sequentially.
- Exercises grouped in a rounds section alternate by round.
- Scheduled workout occurrences never share active progress.
- Historical activity snapshots remain valid if the source routine is edited or
  deleted.
- Internal destructive actions use RTTP confirmation dialogs, never native
  `alert`, `confirm`, or `prompt`.
- `beforeunload` is reserved for browser-level protection of unsaved changes
  because browsers do not allow a custom replacement.

## Confirmed UX decisions

The following questions from the initial concept are resolved.

| Area | Confirmed decision |
| --- | --- |
| Workout overview | Structured section cards with hierarchy, progress, and a compact preparation option. |
| Workout navigation | Step-by-step execution with explicit previous/next actions, overview access, and swipeable preparation cards. |
| Set progress | Per-set controls plus section and routine progress. |
| Feedback | Effort and session feedback are captured at workout completion; exercise notes remain part of routine content. |
| Routine builder | Section-based cards with inline creation, drag-and-drop reordering, and explicit saving. |
| Athlete ownership | Athletes can create personal routines; coach routines remain read-only. |
| Sports planning | Weekly agenda shared by RTTP routines and external sports. |
| Historical detail | Dedicated Progress surface backed by immutable activity snapshots. |
| Mobile navigation | Persistent icon labels in the bottom dock; the user should not need to memorize symbols. |
| Confirmation UI | Product-styled dialogs for internal actions; no native browser modals. |

## Data, persistence, and security

Supabase PostgreSQL is the primary persisted data source. The normalized model
includes profiles, routines, templates, scheduled workouts, workout activities,
and activity sets. Routine structures and historical snapshots use `jsonb`.

`localStorage` supports:

- selected local user and coach athlete selection;
- theme and shell preferences;
- cached domain data;
- offline mutation recovery;
- active workout recovery.

Local storage is not authentication or authorization. Supabase Auth and
restrictive Row Level Security are intentionally deferred. Until they exist,
the product must not be presented as secure for public multi-user use.

The current anonymous database policies must be replaced before a public
release with real users.

## Success measures

### Primary

- Median time to record a completed set: under three seconds.
- Workout completion state remains correct after navigation, reload, pause, or
  device interruption.

### Secondary

- Weekly active athletes.
- Workout completion rate.
- Percentage of completed sessions with useful set data.
- Athlete feedback completion rate.
- Weekly schedule adherence.
- Coach adoption and assigned-athlete activity.
- Frequency of resumed workouts that complete successfully.

### Quality

- No horizontal overflow at supported mobile widths.
- Critical workout state is recoverable after reload.
- Light and dark themes preserve the same information hierarchy.
- Destructive actions are explicit and confirmed.
- Role and ownership rules are enforced consistently in domain, application,
  persistence, and UI layers.

## Deferred roadmap

The next product opportunities are:

1. Exercise-level progress with stable exercise identity, historical load
   trends, best mark, latest mark, and period comparison.
2. Supabase Auth, secure sessions, and restrictive Row Level Security.
3. Public or invite-based routine links distinct from sharing with an assigned
   coach.
4. Grouped recurrence management for editing or deleting one occurrence versus
   an entire series.
5. Adherence, weekly load, and training-volume insights.
6. Coach comments and asynchronous athlete-coach communication.
7. Calendar, Strava, Garmin, and wearable integrations.
8. Push reminders and notifications.
9. Automated coverage for workout recovery, completion, cancellation, agenda
   recurrence, history deletion, and permissions.

Detailed product ideas that are not yet committed belong in
[pending-features.md](./pending-features.md).

## Explicitly out of scope

Unless promoted through a new product decision, the current product excludes:

- payments;
- nutrition planning;
- AI-generated routines;
- a public exercise video library;
- social feeds;
- chat;
- a coach marketplace;
- hybrid coach-athlete accounts.

## Supporting product documents

- [Routine sections](./routine-sections.md): canonical routine structure,
  execution strategies, and migration rules.
- [Self-directed training](./self-directed-training.md): athlete-owned routines,
  authorship, sharing, and coach relationship rules.
- [Sports agenda](./sports-schedule.md): scheduling, recurrence, activities, and
  persistence.
- [Activity history](./activity-log.md): completed workout snapshots, duration,
  deletion, and historical integrity.
- [Architecture](./architecture.md): source boundaries and dependency direction.
- [Pending features](./pending-features.md): uncommitted future product ideas.
