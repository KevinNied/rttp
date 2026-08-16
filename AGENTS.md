<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## RTTP product context

- RTTP means **Return To The Prime**. Keep the product in Spanish, mobile-first, dark, and focused on low-friction workout execution.
- Prioritize mobile for the athlete workout experience, but treat the coach workspace as a first-class responsive desktop experience with efficient use of wide screens.
- Roles come from the entered email. Athletes only see their experience; coaches manage their assigned athletes and may open an explicit athlete preview.
- The current iteration uses structured local data and `localStorage`; Supabase and real authentication are intentionally deferred.
- Exercises grouped in one block alternate by round. A block containing one exercise completes all its sets before moving forward.
- Exercise rest is optional and must be hidden everywhere when `null`.
- Preparation blocks support both a compact whole-block view and individual swipeable cards.
- Coach workflows include creating athletes, routines, blocks and exercises, plus drag-and-drop reordering and confirmed routine deletion.
