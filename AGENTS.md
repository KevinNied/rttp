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

- Prefer decisive execution over prolonged specification. When a request is clear
  enough, make reasonable product and UX assumptions and carry the work through
  implementation, validation, release, and production verification.
- Ask before decisions that materially change business behavior, destroy or
  migrate data, alter workout semantics, or introduce competing product concepts.
- Do not block implementation on minor visual or technical choices. Choose the
  option that best preserves simplicity, coherence, and future extensibility.
- When the user requests only an audit, review, or recommendations, do not
  implement changes until they are explicitly approved.

## UX and visual principles

- Favor direct manipulation and low-friction interactions. Prefer inline creation
  and editing for simple entities; reserve dialogs for multi-step, consequential,
  or destructive actions.
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

- `src/app/page.tsx` is currently a large integration surface. Do not add
  substantial self-contained features there when they can be extracted into
  focused components, hooks, or domain helpers.
- Keep small fixes surgical. Do not use a narrow request as justification for an
  unrelated large refactor.
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

- Keep routine architecture decisions in
  [`docs/routine-sections.md`](docs/routine-sections.md).
- Keep future product ideas in
  [`docs/pending-features.md`](docs/pending-features.md); they are not committed
  scope until explicitly approved.
- Keep activity persistence and history decisions in
  [`docs/registro-actividades.md`](docs/registro-actividades.md).
- Keep sports scheduling decisions in
  [`docs/agenda-deportiva.md`](docs/agenda-deportiva.md).
- Keep this file focused on stable principles and invariants. Do not add temporary
  versions, migration IDs, database counts, or session-specific implementation
  notes.
