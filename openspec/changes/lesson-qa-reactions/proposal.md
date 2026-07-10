## Why

Two remaining engagement surfaces from the audit need a (mocked) backend, so they ship as a
separate change from the pure-FE polish. Today a finished reader has no lowest-friction
reaction affordance on the lesson itself (only per-comment likes), and questions asked on one
lesson are invisible across the course — there is no roll-up, so learners can't discover or
browse what's been asked. Both reuse shipped FE parts (`InteractionBar`, `TabsCard`,
`AsyncContent`, `SearchInput`, `CommentComposer`); each is backed by a FE-only mock per the
house convention (no real BE contract exists yet).

## What Changes

- **Lesson reaction + view footer**: a one-tap reaction bar + view count in the reading Card
  foot (reusing `InteractionBar`), backed by a localStorage mock so a reaction persists locally.
- **Course-wide Q&A route**: a new `/courses/[courseId]/learn/qa` route rendering a Q&A roll-up
  (filter tabs unanswered/answered/mine/all synced to the URL, debounced search, a course-general
  composer, an invitation empty-state), backed by a mock course-questions store. The lesson
  discussion header links "see all questions" into it.

## Capabilities

### New Capabilities
- `course-qa`: a course-wide questions roll-up — browse/filter/search every question asked
  across the course's lessons and ask a course-general question.

### Modified Capabilities
- `course-lesson`: adds a lesson-level reaction + view footer to the reader.

## Impact

- FE-only. **Mock backends** (no real contract): a localStorage-backed lesson-reaction store and
  an in-module course-questions store — both documented as mocks, SWR-shaped for a BE swap.
- Affected / new code:
  - `src/components/features/learn/LessonReader/index.tsx` + `useLessonReactionMock.ts` (footer)
  - `src/components/features/learn/CourseQa/*` (component, mock store + SWR hook, QuestionRow, skeleton)
  - `src/app/[locale]/courses/[courseId]/learn/qa/page.tsx` (new route)
  - `src/components/features/learn/LessonReader/LessonComments/index.tsx` ("see all questions" link)
  - `src/messages/{vi,en}.json` (`courseQa.*` + reaction copy)
