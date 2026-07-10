## Why

The P0 change fixed the lesson reader's broken *states*. This change fixes its *shell,
mobile, and rendering quality*. Today both the content-map (left) and on-this-page (right)
rails are `hidden lg:flex` — below `lg` they vanish with **no** bar, drawer or tab to replace
them, so a phone learner is stranded on a linear prev/next pager with no way to jump modules
or see the outline. Migrated HTML lessons render with hand-rolled typography that styles only
links and lists (no heading ladder, code, blockquote, or images), and code blocks force-wrap
(`whitespace-pre-wrap break-words`), shattering long identifiers/URLs mid-token. The reader
header also uses an off-scale `gap-10`, and the content-map rail lacks a one-tap "continue"
action even though the resume pointer is already in hand.

## What Changes

- **Mobile rail access**: a fixed bottom bar (`lg:hidden`) exposes the content-map and the
  on-this-page outline as slide-in drawers on the lesson reader; the reading column reserves
  `max-lg:pb-16` so the bar never covers content.
- **On-this-page mobile mode**: `OnThisPage` gains a `mobile` prop that drops the sticky
  `w-64` desktop chrome and renders a full-width panel for the drawer.
- **Lesson-body typography**: the sanitized-HTML lesson container gets a full descendant
  typography ladder (headings, code, pre, blockquote, img, table) so migrated HTML lessons
  match the markdown reading experience.
- **Code-block horizontal scroll**: code blocks scroll horizontally (`whitespace-pre` +
  `overflow-x-auto`) instead of wrapping and shattering tokens.
- **Continue action**: the content-map rail header gets a "continue learning" button that
  jumps to the resume target (`header.continueLessonId`, already in hand).
- **Dynamic challenges tab**: the reader's Content/Challenges tab list omits the Challenges
  tab when the lesson has no challenge, so it stops showing a permanent dead-end.
- **Header rhythm**: the reader header→outcomes wrapper snaps from `gap-10` to `gap-6`.

## Capabilities

### Modified Capabilities
- `course-lesson`: adds mobile rail access, lesson-body rendering quality, a content-map
  continue action, and a dynamic challenges tab to the learn player (new requirements; the
  existing "Course learn player" requirement is unchanged by this delta).

## Impact

- FE-only. No new backend contract. `hasChallenge`/per-lesson duration remain BE-stubbed;
  the dynamic tab keys off the existing (stubbed) flag and lights up when the BE lands.
- Affected code:
  - `src/components/features/learn/LearnShell/index.tsx` + new `LearnShell/LearnMobileBar/index.tsx`
  - `src/components/features/learn/OnThisPage/index.tsx` (`mobile` prop)
  - `src/components/features/learn/ContentMap/index.tsx` (continue action)
  - `src/components/features/learn/LessonReader/index.tsx` (gap rhythm + dynamic tab list)
  - `src/components/features/learn/hooks/useQueryLearnLessonSwr.ts` (only if the tab needs a flag it lacks)
  - `src/components/features/learn/LessonReader/LessonDocumentHtml.tsx` (typography ladder)
  - `src/components/reuseable/MarkdownContent/CodeToHtml/index.tsx` (code scroll — shared block)
  - `src/messages/{vi,en}.json` (mobile bar labels; reuse existing where possible)
- Deferred to a follow-up (noted, not silently dropped): filling the right rail with a
  ported starci `ContentActions` toolkit, and video playback-rate / resume-position controls
  (both lower-value, higher-effort than the mobile gap this change closes).
