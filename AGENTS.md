<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## RTTP product principles

- RTTP means **Return To The Prime**. Keep the product in Spanish and focused on
  low-friction workout execution.
- Use concise product copy with consistent Rioplatense voseo: `Sumá`, `Armá`,
  `Gestioná`, `Entrá`.
- Prioritize mobile for the athlete workout experience. Treat the coach workspace
  as a first-class responsive desktop experience that uses wide screens
  efficiently.
- Athletes only see their own experience. Coaches manage their assigned athletes
  and may enter an explicit read-only athlete preview.
- Dark mode is the default visual direction. Light mode is fully supported and
  must preserve readable contrast and the same information hierarchy.
- Prefer coherent end-to-end flows over isolated screens or disconnected UI
  improvements.

## Product decision style

- Before implementation, identify and surface unresolved assumptions across
  product behavior, business rules, permissions, data ownership, migrations,
  technical design, UX, and edge cases.
- Ask one focused clarification at a time when more than one reasonable behavior
  exists. Provide concrete options, explain their consequences, and place the
  recommended option first.
- Prefer clarifying too much over silently implementing an interpretation that
  may not match the user's intent. A broad product goal is not approval for
  adjacent role, permission, ownership, or workflow changes.
- Record consequential decisions in the relevant canonical document before
  implementing a structural feature.
- Once behavior and scope are clear, execute decisively through implementation,
  validation, release, and production verification.
- Routine technical details with no observable product, data, or maintenance
  tradeoff may be decided autonomously using repository conventions.
- When the user requests only an audit, review, or recommendations, do not
  implement changes until they are explicitly approved.

## UX and visual principles

- Favor direct manipulation and low-friction interactions. Prefer inline creation
  and editing for simple entities; reserve dialogs for multi-step, consequential,
  or destructive actions.
- Never use native browser `alert`, `confirm`, or `prompt` dialogs. Use RTTP-styled
  inline states or application dialogs so appearance and behavior stay consistent.
- Preserve primary content before decorative elements. Names, status, progress,
  and next actions must never disappear because an avatar, badge, icon, or control
  consumes the available width.
- Responsive layouts should reflow controls before truncating essential
  information and must never introduce horizontal page overflow.
- Avoid duplicated information and actions across the page, top navigation,
  sidebar, profile, and mobile dock unless the duplication has clear contextual
  value.
- Use progressive disclosure: show the minimum necessary to execute the current
  task, with overview and detail available on demand.
- Interpret requests to remove UI semantically: retain supporting context that
  belongs to the requested datum unless the user explicitly asks to remove that
  context too.
- When removing cards or controls from a grid or stack, rebalance the remaining
  layout. Remaining components should fill or intentionally redistribute the
  freed space instead of leaving dead gaps; verify this at the affected mobile
  and desktop breakpoints.
- Filling available space does not mean pushing related content to opposite
  edges. Keep an icon, its value, label, and supporting copy as one visual group,
  then place that group intentionally with alignment and padding.
- Keep the visual language premium and restrained: deep neutral and indigo
  surfaces, cyan and violet accents, controlled gradients, generous rounding,
  subtle borders, and decoration only when it improves hierarchy.
- Keep touch targets comfortable on mobile. Icon-only controls still require
  accessible names and must remain understandable through context, onboarding,
  or tooltips where appropriate.
- Preserve the athlete's execution context. During a workout, progress,
  hierarchy, timers, postponed exercises, and the path back to the overview must
  remain clear.

## Routine and workout invariants

- `Routine.structure.sections` is the only live routine model. Do not reintroduce
  `blocks` or maintain parallel legacy models.
- A `sequential` section completes every set of one exercise before moving to the
  next exercise.
- A `rounds` section alternates exercises by iteration.
- Execution strategy (`kind`), semantic purpose (`role`), and visual treatment
  (`presentation`) are independent concerns.
- New workout formats should extend section strategies instead of adding a new
  global routine mode.
- Exercise rest is optional. Represent absence as `null` and omit rest from the UI
  when absent; zero is a configured value, not an absence marker.
- Workout progress, timers, postponed exercises, completed sets, and rest state
  must survive reloads and remain isolated per workout session.
- Historical activities render from their saved routine snapshot, not from the
  athlete's current routine.
- Coach workflows include creating athletes, routines, sections, and exercises,
  drag-and-drop reordering, explicit routine saving, and confirmed routine
  deletion.

## Data and persistence

- Supabase PostgreSQL is the primary persisted data source.
- `localStorage` may support caching, offline mutation recovery, convenience user
  selection, theme preferences, and active workout recovery. It is not
  authentication or authorization.
- Supabase Auth and restrictive RLS are still pending. Never present the current
  local session as secure authentication.
- The selected local user persists until explicit logout. A coach's selected
  athlete may also persist for navigation continuity.
- Before destructive or structural database changes, create and verify a backup.
- Schema changes must include forward migrations, data backfills, RPC updates,
  snapshot compatibility, and validation against existing row counts.
- Prefer a complete migration to one canonical model over indefinitely
  maintaining legacy and new contracts in parallel.

## Code organization and quality

- `src/app/page.tsx` is the composition root. Keep it limited to session wiring,
  application commands, and surface selection. Put self-contained features in
  `src/features`, orchestration in `src/application`, browser persistence in
  `src/infrastructure`, and pure rules in `src/domain`.
- Keep small fixes surgical. Do not use a narrow request as justification for an
  unrelated large refactor.
- Use English for every file and directory name. Keep user-facing product copy in
  Spanish.
- Keep domain transformations pure and centralized. UI components should consume
  the canonical model instead of reconstructing workout semantics independently.
- Reuse existing formatters, ID helpers, snapshot logic, and persistence paths
  before adding new implementations.
- Use explicit invalid, loading, empty, and error states. Never silently save
  incomplete entities or turn failures into success-shaped fallbacks.
- Preserve type safety and prefer `crypto.randomUUID()` for new
  client-generated persistent identifiers.
- Add comments only when the intent cannot be made clear through naming and
  structure.

## Architecture boundaries

- Dependencies point toward stable business rules:
  - `src/domain` contains pure entities, value objects, calculations, factories,
    and invariants. It must not import React, browser APIs, Supabase,
    `src/application`, `src/infrastructure`, `src/features`, or `src/app`.
  - `src/infrastructure` implements browser and remote-data adapters. It may
    depend on domain contracts, but it must not contain React components or
    product presentation.
  - `src/application` coordinates use cases, navigation, hydration, and stateful
    workflows. It may use domain rules and infrastructure adapters, but it must
    not contain JSX or visual styling.
  - `src/features` owns presentation and feature-local UI state. It consumes
    domain and application APIs and must not call Supabase or raw browser
    persistence directly.
  - `src/app` is limited to Next.js routes and composition. It wires dependencies
    and selects feature surfaces instead of implementing them.
- Apply the Dependency Inversion Principle when an external concern becomes
  volatile or has multiple implementations: define a narrow port in the domain
  or application layer, implement it in infrastructure, and wire it at the
  composition root.
- Apply the Single Responsibility Principle at module and component level. Split
  code by cohesive reason to change, not by arbitrary line count.
- Apply the Open/Closed Principle to workout strategies: extend the discriminated
  section model, validation, compiler, and editor instead of scattering new
  conditionals across unrelated screens.
- Apply Interface Segregation to component props, hooks, and repositories. Expose
  only the commands and data each consumer needs; avoid passing whole stores or
  large mutable objects for convenience.
- Preserve substitutability for adapters and strategies: implementations must
  honor the same success, failure, idempotency, and persistence semantics as
  their contracts.
- Keep state close to its owner. Promote state to an application hook only when
  multiple feature surfaces coordinate the same workflow; keep transient visual
  state inside the feature.
- Prefer pure domain functions and explicit application commands over hidden
  mutations. Infrastructure errors cross the boundary as typed or normalized
  failures and remain visible to the user.
- Avoid circular dependencies, cross-feature deep imports that bypass public
  APIs, and generic `manager`, `service`, or `utils` modules without one cohesive
  responsibility.
- Refactor incrementally by boundary. Preserve behavior first, validate the
  affected end-to-end flow, and only then remove the previous implementation.

## Interaction safety

- Routine editing uses explicit save. Preserve unsaved-change guards when
  navigating away.
- Incomplete inline drafts must remain visibly incomplete and must not be
  persisted as valid entities.
- Confirm destructive actions such as routine deletion. Avoid confirmation
  dialogs for reversible, low-risk actions.
- Surface persistence and synchronization failures clearly. Do not silently
  discard edits.
- Athlete preview is read-only and must not mutate athlete data or workout state.

## Required validation

- Validate athlete flows with `athlete@test.com` and coach flows with
  `coach@test.com`.
- For responsive UI changes, verify approximately `390px` mobile, `958px`
  constrained or intermediate, and `1440px` desktop widths.
- Test the complete affected flow, not only the changed component: create or edit,
  save, reload, resume, history, and role-specific visibility when applicable.
- Check for horizontal overflow, hidden primary labels, unusable controls, stale
  loading states, duplicate navigation, and regressions in both themes when the
  change affects shared visual tokens.
- Remove QA data and restore the original local user, selected athlete, and
  persisted workout state after testing.
- Run the smallest relevant existing checks, followed by `npm run lint`,
  `npm run build`, and `git diff --check` before a production release.
- After pushing, verify the expected version and changed behavior in production.

## Release versioning

- `package.json` is the single source of truth for the app version.
- Before every production push, bump the version with
  `npm version patch|minor|major --no-git-tag-version` and include both package
  files in the commit.
- While the product remains below `1.0.0`, use patch releases for fixes and small
  compatible UX improvements, and minor releases for substantial capabilities,
  domain changes, or migrations.
- Commit titles use Conventional Commit format in English:
  `<type>: <concise imperative description>`.

## Delivery workflow

- After fully implementing and validating requested work, commit and push it
  immediately using the configured personal Git identity.
- Do not commit or push when requested work is incomplete, validation is failing,
  or a blocker remains unresolved.
- Verify the deployed version and the affected production flow instead of
  treating a successful push as completion.

## Canonical documentation

- Keep layered architecture and dependency rules in
  [`docs/architecture.md`](docs/architecture.md).
- Keep routine architecture decisions in
  [`docs/routine-sections.md`](docs/routine-sections.md).
- Keep future product ideas in
  [`docs/pending-features.md`](docs/pending-features.md); they are not committed
  scope until explicitly approved.
- Keep optional coaching, routine ownership, and self-directed training decisions
  in
  [`docs/self-directed-training.md`](docs/self-directed-training.md).
- Keep activity persistence and history decisions in
  [`docs/activity-log.md`](docs/activity-log.md).
- Keep sports scheduling decisions in
  [`docs/sports-schedule.md`](docs/sports-schedule.md).
- Keep this file focused on stable principles and invariants. Do not add temporary
  versions, migration IDs, database counts, or session-specific implementation
  notes.
