# Tasks — subject-workspace-ia

## 1. Rail v2 (SubjectWorkspaceShell)

- [x] 1.1 Edit `NAV_GROUPS` in `src/components/features/subject/SubjectWorkspaceShell/index.tsx`: delete the `learning` item (+ `BookOpenIcon` import), move the discussion item (key `discussion`, `ChatCircleIcon`, segment `discussion`) into cluster 1 after Overview, leave Members alone in cluster 2, keep Insight cluster
- [x] 1.2 i18n `subjects.nav.*` in `src/messages/vi.json` + `en.json`: remove `learning`; add `discussion` ("Thảo luận"/"Discussion"); set `resources` = "Tài liệu"/"Resources", `practice` = "Luyện tập"/"Practice"; update cluster-1 group label (vi "Không gian môn" / en "Subject space")
- [x] 1.3 Verify collapsed rail keeps accessible names for all 8 tabs (icon-only state carries the label via aria)

## 2. Routes: redirects + discussion segment

- [x] 2.1 Create `src/app/[locale]/subjects/[subjectId]/discussion/page.tsx` rendering the existing subject feed feature (moved from the `community` page)
- [x] 2.2 Replace `src/app/[locale]/subjects/[subjectId]/community/page.tsx` with a locale-aware redirect to `/subjects/[subjectId]/discussion`
- [x] 2.3 Replace `src/app/[locale]/subjects/[subjectId]/learning/page.tsx` with a locale-aware redirect to `/subjects/[subjectId]` (Overview)
- [x] 2.4 Sweep internal links/hrefs pointing at the old `community`/`learning` workspace segments and update them to `discussion`/overview

## 3. Course link-out card on Overview

- [x] 3.1 Add `courseIds: Array<string>` to `Subject` in `src/components/features/subject/hooks/useQuerySubjectSwr.ts` (JSDoc mock note); mock data covers both a subject with ≥1 course id and one with `[]`
- [x] 3.2 Build the "Khóa học của môn này" card in the overview feature: list linked course identity + CTA link to `/courses/[courseId]`; hidden when `courseIds` is empty; no course content embedded
- [x] 3.3 Extend the overview skeleton with the card placeholder; i18n `subjects.overview.*` keys for card title/CTA (vi "Xem khóa học" / en "View course") in vi+en; CTA accessible name includes course identity

## 4. Domain-separation cleanup (supersede subject-workspace-learning)

- [x] 4.1 Remove the now-unreachable `SubjectLearning` feature component and `subjects.learning.*` i18n keys if they landed (per design D5); otherwise mark `openspec/changes/subject-workspace-learning` superseded by this change
- [x] 4.2 Verify no workspace tab renders lesson/section/quiz/progress UI (grep the subject feature tree for lesson-player imports); verify course pages do not import `SubjectWorkspaceShell`
- [x] 4.3 Verify community groups surfaces offer no subject-bound group type (mock data + create flow)

## 5. Verify

- [x] 5.1 `npm run build` (webpack) green
- [x] 5.2 `tsc --noEmit` clean
- [x] 5.3 Manual smoke in `npm run dev`: rail shows 8 tabs vi/en; `/learning` and `/community` redirect; Overview card renders with and without linked courses
