# Tasks — learn-subject-tools-purchase-gating

## 1. Learn-course hook
- [x] 1.1 `useQueryLearnCourseSwr`: add `coverUrl` / `priceVnd` / `originalVnd` to the header (from the loaded course detail — no extra call)
- [x] 1.2 Compose `useGetMyCourseAccessSwr(rawId)` → expose `access {enrolled,purchased,fullAccess}`; fold its mutate into the combined mutate

## 2. LearnToolsRail
- [x] 2.1 Retarget subject group: materials → /resources, practice → /practice, workspace (overview) → /subjects/{code}, keep qa → /discussion
- [x] 2.2 Add LOCKED rows (Playground, Dự án cá nhân) with a `LockSimpleIcon` marker; press → open the whole-course `PackageGateModal` (packageSlugs=[]) instead of navigating
- [x] 2.3 Keep the whole subject group hidden when `subjectCode` is null

## 3. LearnContentPage trial card
- [x] 3.1 Show "Bạn đang học thử / Mở khóa học" card only when `access.purchased !== true`; hidden for purchasers
- [x] 3.2 Reuse `PriceTag` (course sale/original) + `useCourseEnrollment` (unlock CTA) + a "Tiếp tục học thử" secondary; keep continue/progress/about

## 4. CONTRACT B — SubjectResources lock
- [x] 4.1 `ResourceSummary.lockedForViewer` type + map `visibility` / `lockedForViewer` into `SubjectResource`
- [x] 4.2 Badge locked rows with a lock chip; withhold download / ask-AI / save (no body/URL leak); click → `/courses/{courseLinks[0].id}` (inert + hint when none)

## 5. CONTRACT A — Subject cover
- [x] 5.1 Add `imageUrl?: string|null` to `SubjectDetail` + `SubjectSummary`; map `imageUrl ?? thumbnailUrl` in `toSubjectFromDetail` / `toSubjectFromSummary`
- [x] 5.2 Render the cover on the workspace header via a plain `<img>` (no Next optimizer); keep the initials fallback

## 6. i18n & verify
- [x] 6.1 i18n vi + en: `learn.toolsRail.{materials,practice,workspace,playground,personalProject,lockedAria}`, `learn.content.trialCard.*`, `subjects.resources.{lockedBadge,lockedAria,unlockHint}`
- [x] 6.2 Unit tests: SubjectResources locked cases (badge, no ask-AI leak, click → course) green
- [x] 6.3 `npx tsc --noEmit` clean + `npm run build` (webpack) green
