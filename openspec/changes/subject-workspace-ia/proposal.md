# Subject Workspace IA — domain separation (Workplace · Course · Community)

## Why

The subject workspace currently mixes domains: its rail has a "Learning/Lessons" tab that
embeds structured learning content, and its "Community" tab name collides with the global
Community module. The product owner has approved a strict three-domain separation —
**Subject Workplace** (participation space of one subject), **Course** (structured learning,
standalone), **Community** (groups outside subjects) — and the workspace IA must be
restructured to enforce it.

## What Changes

- **Rail v2** in `SubjectWorkspaceShell` (left rail is KEPT; only its items change):
  Overview · Thảo luận (Discussion) · Tài liệu (Resources) · Luyện tập (Practice) · AI ·
  Members · Statistics · Career — 8 tabs, 3 clusters.
- **BREAKING** — the **Learning/Lessons tab is REMOVED** from the rail. The route
  `/subjects/[subjectId]/learning` becomes a redirect to the workspace Overview. Structured
  learning lives only in the Course module (`/courses/[courseId]`).
- **Tab rename/repurpose**: the subject "Community" tab becomes **Thảo luận (Discussion)** —
  a subject-scoped post feed — served at `/subjects/[subjectId]/discussion`; the old
  `/subjects/[subjectId]/community` route redirects there. i18n vi labels: "Thảo luận",
  "Tài liệu" (Resources), "Luyện tập" (Practice).
- **Overview gains a "Khóa học của môn này" (course link-out) card**: the mock `Subject`
  type gains `courseIds`; the card lists linked course(s) with CTAs to `/courses/[courseId]`.
  No course content is embedded in the workspace.
- **Domain-separation invariants** become spec'd requirements: the workspace MUST NOT render
  lesson content; the Community/groups module MUST NOT list subject-bound groups; course
  pages MUST NOT render the workspace rail.
- Supersedes the in-flight `subject-workspace-learning` change (its Lessons tab is removed
  by this IA; see design.md migration notes).

## Capabilities

### New Capabilities

- `subject-workspace-ia`: information architecture of the subject workspace — rail v2
  composition and clusters, tab renames (Thảo luận/Tài liệu/Luyện tập), Lessons removal +
  redirects, and the cross-module domain-separation invariants
  (Workplace ↔ Course ↔ Community).

### Modified Capabilities

- `subject-workspace-overview`: the overview gains a "Khóa học của môn này" course
  link-out card (linked-course mapping via mock `Subject.courseIds`, CTA to
  `/courses/[courseId]`, with/without/loading states).

## Impact

- FE only (mock BE, no API changes):
  - `src/components/features/subject/SubjectWorkspaceShell/index.tsx` — `NAV_GROUPS` rework.
  - `src/components/features/subject/hooks/useQuerySubjectSwr.ts` — `Subject.courseIds` mock field.
  - Routes under `src/app/[locale]/subjects/[subjectId]/`: `learning/` → redirect,
    `community/` → redirect, new `discussion/` page (reusing the existing subject feed feature).
  - Overview feature: new course link-out card.
  - i18n `src/messages/{vi,en}.json` — `subjects.nav.*`, `subjects.overview.*` additions.
- Existing changes: `subject-workspace-learning` is superseded (noted, not deleted);
  `subject-workspace-community` keeps its feed feature, re-homed under the Discussion tab.
- Verify: `npm run build` (webpack) green + `tsc --noEmit` clean.
