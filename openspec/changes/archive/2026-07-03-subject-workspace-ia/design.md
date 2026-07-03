# Design — subject-workspace-ia

## Context

`SubjectWorkspaceShell` (src/components/features/subject/SubjectWorkspaceShell/index.tsx)
renders a left `CollapsibleSidebar` with a hardcoded `NAV_GROUPS` array: 9 tabs in 3
clusters — Learn (Overview `""`, Learning `learning`, Resources `resources`, Practice
`practice`, AI `ai`), Community (Community `community`, Members `members`), Insight
(Statistics `statistics`, Career `career`). Routes live under
`src/app/[locale]/subjects/[subjectId]/<segment>/page.tsx`; labels come from
`subjects.nav.*` / `subjects.groups.*` in `src/messages/{vi,en}.json`.

The product owner approved strict domain separation:

1. **Subject Workplace** = participation space of ONE subject (discussion, read/comment
   resources, challenges, members, statistics, AI, career). No lessons/learning content.
2. **Course** = structured learning (sections/lessons/video/quiz/progress/certificate,
   enroll/purchase). Standalone module; the workspace only links out.
3. **Community** = groups OUTSIDE subjects (clubs, teams, interests). No subject-bound groups.

The left rail is KEPT — this change only restructures its items. FE-only, mock BE.

## Goals / Non-Goals

**Goals:**

- Rail v2: Overview · Thảo luận · Tài liệu · Luyện tập · AI · Members · Statistics · Career.
- Remove the Lessons tab; redirect its route; link out to the course instead (Overview card).
- Rename/repurpose the subject Community tab into Discussion (subject-scoped feed) with a
  distinct route segment so it cannot be confused with the global Community module.
- Encode the three domain-separation invariants as testable requirements.

**Non-Goals:**

- No changes to the Course module pages themselves (they already have no workspace rail —
  the invariant just pins that).
- No new BE contract; `courseIds` is a mock field on the existing mock hook.
- No redesign of the Discussion feed content (the existing subject feed feature is reused
  as-is under the new tab).
- No removal of the global Community module or its groups features.

## Decisions

### D1 — Nav config: edit `NAV_GROUPS` in place, keep 3 clusters

Rail v2 is a data-only edit to the `NAV_GROUPS` constant (no block/API changes):

- Cluster 1 `space` (relabel of `learn` — vi "Không gian môn", en "Subject space"):
  Overview `""` · Discussion `discussion` (icon `ChatCircleIcon`, moved up from cluster 2) ·
  Resources `resources` · Practice `practice` · AI `ai`. `BookOpenIcon`/`learning` item deleted.
- Cluster 2 `community` (vi "Cộng đồng"): Members `members` only.
- Cluster 3 `insight`: Statistics `statistics` · Career `career`.

Alternative considered: collapse to 2 clusters once Members is alone. Rejected — keeping 3
clusters minimizes diff and preserves the separator rhythm chosen in
`subject-workspace-shell`; the group label change is i18n-only.

i18n: rename group key `learn` → `space` (or keep the key and change only the label —
implementer's choice; spec pins labels, not keys), `nav.learning` removed, `nav.discussion`
added ("Thảo luận" / "Discussion"), `nav.resources` → "Tài liệu" / "Resources",
`nav.practice` stays "Luyện tập" / "Practice".

### D2 — Lessons removal: route redirects to Overview (chosen over link-out card page)

`/subjects/[subjectId]/learning/page.tsx` is replaced by a server-side `redirect()`
(next-intl `redirect` from `@/i18n/navigation`) to `/subjects/[subjectId]` (Overview).
Rationale: the Overview now carries the "Khóa học của môn này" card, so redirected users
land one click from the course — a dedicated interstitial "this moved" page would be a
dead-end surface that itself violates "no learning content in the workspace". The route
directory is kept (not deleted) so old links/bookmarks never 404.

Same strategy for the tab rename: `/subjects/[subjectId]/community/page.tsx` becomes a
redirect to `/subjects/[subjectId]/discussion`, and the existing subject feed page moves to
`discussion/page.tsx`.

### D3 — Subject → Course mapping: mock `courseIds: string[]` on `Subject`

`Subject` (src/components/features/subject/hooks/useQuerySubjectSwr.ts) gains
`courseIds: Array<string>` with a JSDoc "ponytail: mock BE" note, populated
deterministically by `fetchSubjectMock` (e.g. `["<id>-course"]`; at least one mock subject
should map to an empty array so the card's absent state is reachable). The Overview card
consumes `subject.courseIds` and, for display names, a small mock lookup (course code/name
per id) local to the card feature — no course API is invented. When the BE contract lands,
`courseIds` rides the real subject query; the hook API does not change.

Alternative: a separate `useQuerySubjectCoursesSwr` hook. Rejected for now — one mock hook,
one waterfall; split only when the real contract splits.

### D4 — Domain-separation invariants live in the new `subject-workspace-ia` capability

The three MUST NOTs (workspace renders no lesson content; Community lists no subject-bound
groups; course pages render no workspace rail) are spec'd once in `subject-workspace-ia`
rather than scattered as deltas across course/community specs. They are cross-module
invariants owned by the IA; course/community specs stay untouched until their own behavior
changes.

### D5 — Supersede `subject-workspace-learning` (migration note)

The in-flight change `openspec/changes/subject-workspace-learning/` built the Lessons tab
(`SubjectLearning` feature + `subjects.learning.*` i18n + the `learning` page). This IA
removes its entry point:

- If `subject-workspace-learning` is **not yet implemented**: do not implement it; mark it
  superseded by `subject-workspace-ia` (note in its proposal or archive it unimplemented).
- If parts **already landed** (feature component/i18n): the `learning` page is replaced by
  the D2 redirect; the `SubjectLearning` component and `subjects.learning.*` keys become
  unreachable — delete them in this change's cleanup task (mock-only, no data loss). Its
  sectioned-lesson UI is conceptually re-homed to the Course module (`course-lesson` /
  `course-detail` capabilities), not ported here.

`subject-workspace-community` is NOT superseded: its feed feature is reused verbatim as the
Discussion tab; only route segment + label change.

## Risks / Trade-offs

- [Users hunting for "Bài học" inside the workspace] → Overview card "Khóa học của môn này"
  is placed prominently; the `learning` URL keeps working via redirect.
- [Renamed `community` segment breaks deep links] → permanent redirect kept at the old
  segment; internal links updated in the same change.
- [Group-key rename (`learn`→`space`) could orphan i18n keys] → task includes a vi/en key
  sweep + `tsc`/build gate; next-intl throws on missing keys in dev.
- [Empty `courseIds` makes the card invisible and the mapping untested] → spec has an
  explicit absent-state scenario; mock data covers both branches.

## Open Questions

- None blocking. (Course-side "back to subject workplace" link is out of scope here; can be
  a follow-up change on `course-detail`.)
