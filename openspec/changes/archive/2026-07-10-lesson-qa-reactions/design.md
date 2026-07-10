## Context

Two engagement surfaces backed by FE-only mocks (no real BE contract). The starci `CourseQa`
is graphql + course-slice heavy; FTES has neither, so it is ported lean (useParams `courseId`,
an in-module mock store). The `InteractionBar` is graphql-typed (`ReactionSummary`/`ReactionType`)
but presentational — it is fed by a small localStorage mock, no graphql needed.

## Goals / Non-Goals

**Goals:** a discoverable course-wide Q&A roll-up; a lesson-level reaction + view footer.
**Non-Goals:** real persistence / real BE (both are mocks, clearly documented); founder-answer
moderation; cross-device sync.

## Decisions

- **Mock stores, SWR-shaped.** A module-level `courseQuestions` array (seeded, mutable via
  `addQuestion`/`addAnswer`) behind `useQueryCourseQuestionsSwr({ filter, search, page })`, and a
  `localStorage`-backed lesson-reaction store behind `useLessonReactionMock(contentId)` returning
  a `ReactionSummary` + `react(type)`. Both are labeled mocks and swap cleanly for a real endpoint.
  Rationale: the house convention is FE-only mock + documented assumption when the contract is
  absent; keeping the SWR shape means the swap is a one-file change.
- **Lean CourseQa port.** Keep the starci structure (PageHeader → composer → filter tabs + search
  → list → pager) but drop the graphql/course-slice/pathConfig deps: `courseId` from `useParams`,
  filter synced to `?filter=`, search debounced into the SWR key, `CommentComposer` (collapsible)
  for the composer, `TabsCard` for filters, `AsyncContent` for states, a compact `QuestionRow`
  (question + author + answer count + expand-to-answer). Invitation empty-state funnels to content.
- **Reaction footer.** Render `InteractionBar` in the reading card foot (`border-t` divider), only
  for a readable (`!isLocked`, non-empty) lesson, fed by `useLessonReactionMock`. View count is a
  deterministic seed per `contentId` (stable across reloads) plus the local reaction total.
- **Discoverability link.** The `LessonComments` header gets a "see all questions" link to
  `/courses/[courseId]/learn/qa`.

## Risks / Trade-offs

- **Mocks don't persist server-side** → documented; localStorage (reactions) / in-module
  (questions) give believable local behavior for review without inventing a real API.
- **`InteractionBar` imports graphql enums** → only the type/enum is reused (no network); the mock
  builds the `ReactionSummary` shape locally.
- **New route under the learn layout** → `qa` is not a content route, so the shell gives it no
  rail and the mobile bar self-hides — it renders as a centered reading column, which is correct.

## Migration Plan

Pure FE, no data migration, no flag. Verify: `tsc --noEmit` clean + `npm run build` green.
When the real endpoints land, replace the two mock stores with REST/GraphQL calls behind the
same hook signatures.
