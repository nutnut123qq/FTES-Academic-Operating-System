# Profile skill-EXP bar chart (thay "Bản đồ kỹ năng" trên hồ sơ)

## Why

The profile Progress tab embeds `SkillGraph` — a React Flow spider-web of individual skills
(`GET /api/v1/career/skills` + `/career/me/skills`). It answers "which skill nodes am I near?",
not the question the learner actually asks on their own profile: **"where is my study time
accumulating?"**

The backend change `course-skill-exp` (FTES-AOS-Backend) introduces exactly that data: a managed
catalogue of ten skill CATEGORIES (Programming, CS Fundamentals, Software Design, Database, App
Development, Software Engineering, Testing, DevOps, Security, Professional) and an uncapped running
EXP total per learner per category, credited as they cross 30 / 50 / 80 / 100% of a course. It
serves them at `GET /api/v1/career/skill-categories` and `GET /api/v1/career/me/skill-exp` — the
latter returns EVERY category with its accumulated total (categories at zero included), so a chart
always has a full set of bars.

The product owner's decision: the profile shows a **horizontal bar chart of raw EXP** per category.

## What Changes

- **REST layer** (`modules/api/rest/career`): types `CareerSkillCategory` + `CareerUserSkillExp`
  mirroring the shipped backend records `SkillExpDtos.CategoryView` (`{slug, label, sortOrder}`) and
  `SkillExpDtos.CategoryExpView` (`{slug, label, sortOrder, totalExp}`) — the row ids stay
  server-side, the slug is the public key — plus readers `getCareerSkillCategories()` and
  `getMyCareerSkillExp()`.
- **New block** `blocks/stats/RankedBarChart`: the house's "ranked bar-per-row" chart (decision log
  `stat.md` names it as the alternative to a stacked bar for a ranked breakdown) — label + printed
  value + a track/fill bar per row, one accent colour (colour would encode nothing here), plus a
  `0 … max` axis footer so an auto-scaled axis stays readable.
- **New feature** `features/skill-exp`: pure mapping in `hooks/skillExpModel.ts` (unit tested,
  mirroring the `skillGraphModel.ts` / `skillGraphModel.test.ts` convention), SWR reader
  `useQuerySkillExpSwr`, and `SkillExpChart` (+ its skeleton) wrapping the block in `AsyncContent`.
- **Bars are RAW EXP with an auto-scaling axis.** EXP is uncapped by design (studying more courses
  keeps adding), so the chart never normalises to 0–100 and never invents a maximum: the axis top is
  derived from the learner's own highest category (rounded up to a readable step × 10ⁿ, dense enough
  that the strongest bar still fills most of its track) and is printed under the bars.
- **Empty state instead of ten flat bars**: when every category is still at zero, the section renders
  the explanatory empty state, not a row of zero-width bars against a broken axis.
- **Profile Progress** renders `SkillExpChart` where it rendered `SkillGraph`.
- **i18n**: new `skillExp.*` namespace (vi canonical + en parity), including per-category labels keyed
  by slug with a fallback to the backend-supplied label for admin-added categories.

## Non-goals

- **`SkillGraph` is NOT deleted or changed.** Its backend (`/career/skills`, `/career/me/skills`) is
  real and the subject workspace Career tab (`features/subject/SubjectCareer`) still renders it
  subject-scoped. Only what the PROFILE renders changes.
- No admin UI for course → category EXP allocation (that is the backend/Admin change's scope).

## Impact

- Affected specs: `profile-gamification-dashboard` (skill-graph section → skill-EXP chart section),
  `skill-graph-view` (its profile surface drops; the subject Career tab surface stays).
- Affected code: `src/modules/api/rest/career/{types,career}.ts`,
  `src/components/blocks/stats/RankedBarChart/index.tsx`,
  `src/components/features/skill-exp/**` (new),
  `src/components/features/profile/ProfileProgress/index.tsx`, `src/messages/{vi,en}.json`.
- Backend dependency: the two read endpoints ship with `course-skill-exp`. Failure handling mirrors
  the sibling skill-graph reader — a learner's missing totals (no career permission) degrade to zeros
  and the empty state, while an unreadable catalogue shows the section's retryable error state. Until
  the backend is deployed the section therefore reads as that error state; the rest of the Progress
  tab is unaffected.
