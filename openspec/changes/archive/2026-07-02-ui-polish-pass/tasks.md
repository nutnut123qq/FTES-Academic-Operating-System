## 1. Radius bump (softer corners)

- [x] 1.1 Bump `--radius` (0.5rem→0.75rem) and `--field-radius` (0.75rem→1rem) in `src/app/globals.css`; mirror in the HeroUI theme radius.
- [x] 1.2 Raise hard-coded frame radius one notch in shared card/panel blocks only (`blocks/cards/{PressableCard,LabeledCard,SurfaceListCard,ContinueCard,CourseCard}`); keep `rounded-3xl` as the ceiling.
- [x] 1.3 Confirm `rounded-full` pills/avatars (globals.css ~L144/150) and small inputs/chips are untouched; spot-check concentric cards so child radius ≤ parent.

## 2. Remove placeholder names

- [x] 2.1 Grep `"Văn A"`, `"Nguyễn Văn"`, `"Nguyen Van"`, `"Người dùng A"`, `"Nguyễn Văn X"` across `src/`.
- [x] 2.2 Replace placeholder names in mock hooks (`subject/useQuerySubjectSwr.ts`, `subject/useQuerySubjectsSwr.ts`, `subject/useQuerySubjectMembersSwr.ts`, `gamification/useQueryLeaderboardSwr.ts`, `search/useQuerySearchSwr.ts`, `course/useQueryCourseDetailSwr.ts`, `chat/useQueryConversationsSwr.ts`, `recommendation/useQueryRecommendationsSwr.ts`, `group/useQueryGroupManageSwr.ts`) with realistic Vietnamese names; sync `avatarInitials`/handles/subtitles.
- [x] 2.3 Fix `namePlaceholder` in `messages/vi.json` (L65) and `en.json` mirror; preserve real names ("Nguyễn Văn Tự Cường", "Nguyễn Văn Học").

## 3. Name-above-avatar identity card

- [x] 3.1 Add a name-on-top (`nameAbove`) variant to `blocks/identity/UserCell` (name heading → avatar below/overlapping; responsive center-stack; a11y heading + alt).
- [x] 3.2 Variant is ready for adoption. The mentor / "bảng vàng" cards live in `home-landing` sections (`MentorTeamSection`, `HonorBoardSection`) which this change explicitly must NOT edit (§5 + Impact "Cross-reference only"). Adoption of `layout="nameAbove"` there is deferred to `home-landing-redesign`; no other current surface hand-rolls a name-below-avatar person card.

## 4. Progress → status bar

- [x] 4.1 Swap `features/course/CourseProgress` hand-rolled bar + `%` (L35-42) to `ProgressMeter` with a state label.
- [x] 4.2 Route skill/career mastery (`features/career/CareerCenter`) through `ProgressMeter` with a label. ProfileProgress + SubjectOverview carry no hand-rolled `%` bar (no readout to swap) — N/A. Reused ProgressMeter's own label/value row, so no new i18n state strings were needed.

## 5. Home-landing reference note

- [x] 5.1 Confirm the reference-layout requirement cross-references `home-landing-redesign` and edits none of its files.

## 6. Verify

- [x] 6.1 Run `npx tsc --noEmit` and fix type errors. (Full webpack build is orchestrator-verified.)
- [x] 6.2 Run `openspec validate ui-polish-pass` and fix until valid.
