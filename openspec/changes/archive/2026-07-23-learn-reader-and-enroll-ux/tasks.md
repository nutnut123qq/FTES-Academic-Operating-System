# Tasks — learn-reader-and-enroll-ux

## 1. Backend gate (challenge signal)
- [x] 1.1 Expose a per-lesson `hasChallenge: boolean` on the lesson-content contract
      `GET /api/v1/lessons/{lessonId}/content` (`LessonContentView`), true when a
      PUBLISHED challenge is linked to the lesson (challenge module). Additive, defaults
      false. (Lesson content-type is already served on `LessonView.type` — no BE change.)

## 2. Lesson view contract (FE hook)
- [x] 2.1 `src/modules/api/rest/course/types.ts`: add `hasChallenge?: boolean` to
      `LessonContentView`.
- [x] 2.2 `src/components/features/learn/hooks/useQueryLearnLessonSwr.ts`: map real
      `content.hasChallenge` (default false) into `LearnLessonView.hasChallenge` — REMOVE
      the hardcoded `hasChallenge: false`. Add `contentType` (from `LessonView.type`) and a
      derived `isVideoLesson` to `LearnLessonView`.

## 3. Reader content-type + challenge gates (Tasks 1 & 2)
- [x] 3.1 `src/components/features/learn/LessonReader/index.tsx`: gate the
      `<LessonAiStudy />` mount on `isVideoLesson` (still requiring `!isLocked`), replacing
      the `!isReadingEmpty` condition. Keep `contentId`/`className` props.
- [x] 3.2 `LessonReader/index.tsx`: ensure the challenges tab (`leftTabs`) and the
      `ChallengesView` "Open challenges" CTA render only when `lesson.hasChallenge` (now the
      real BE flag). Confirm `challengeHref` unchanged.
- [x] 3.3 `LessonReader/LessonAiStudy/{index,LessonAiNote,LessonAiFlashcards}.tsx`: update
      the doc comment / mount contract to state VIDEO-lesson-only; no behavior change inside
      the tools.

## 4. Inline next-lesson + sidebar toggle (Task 3)
- [x] 4.1 `src/hooks/zustand/learnSidebar/store.ts` (new): `useLearnSidebarStore`
      `{ collapsed: boolean; toggle(); setCollapsed(v) }`, default `collapsed=false`
      (mirror `hooks/zustand/dashboardTab`).
- [x] 4.2 `LessonReader/index.tsx`: on the lesson-title header row (the `PageHeader` title
      area for "Buổi 4"), add a right-aligned cluster: a SMALL next-lesson button
      (`size="sm"`, icon + label) → `router.push(readerHref(courseId, lesson.nextId))`,
      self-hidden when `!lesson.nextId`; and a sidebar toggle button →
      `useLearnSidebarStore().toggle()`. Keep the bottom `LessonPager`.
- [x] 4.3 `src/app/[locale]/courses/[courseId]/learn/layout.tsx`: read
      `useLearnSidebarStore().collapsed`; when collapsed on the lesson-reader route, omit
      (or `hidden`) the `leftRail` (`ContentMap`) so the reading column widens.
- [x] 4.4 Verify `LearnShell` handles an absent `leftRail` gracefully (already optional).

## 5. Inline "See all questions" (Task 4)
- [x] 5.1 `src/components/features/learn/CourseQa/index.tsx`: add an `embedded?: boolean`
      prop — when true, suppress `PageHeader` and the outer `max-w-3xl mx-auto` chrome so it
      composes inside the reader column.
- [x] 5.2 `CourseQa/index.tsx`: replace the `Prev`/`Next` pager with a progressive
      "See more" — accumulate rows across pages (`setPage(p+1)` appending), show "See more"
      while `page < totalPages`, and scroll the newly appended block into view. No route nav.
- [x] 5.3 `src/components/features/learn/LessonReader/LessonComments/index.tsx`: replace the
      "See all questions" `router.push('/courses/{courseId}/learn/qa')` with a state toggle
      that mounts `<CourseQa embedded />` below the discussion and smooth-scrolls to it.

## 6. Enroll → PaymentModal (Task 5, extends commerce-checkout-flows)
- [x] 6.1 `src/components/features/course/hooks/useCourseEnrollment.ts`: confirm/keep
      `onEnroll` resolving `useGetCourseProductSwr(buy.rawId)` → `usePostAddCartItemSwr` →
      `usePaymentOverlayState().open({ itemIds:[item.id], title, amountVnd, amountCoin? })`,
      with the sales-page fallback when no product resolves. (Already wired — formalize +
      keep contract stable.)
- [x] 6.2 `src/components/features/course/CourseDetail/index.tsx`: ensure the sticky enroll
      card CTA (`onPress={onEnroll}`, `isPending={isEnrolling}`) drives the above.
- [x] 6.3 `LessonReader/index.tsx`: the locked-paywall enroll button (currently
      `router.push('/courses/{courseId}')`) SHALL open the same PaymentModal via
      `useCourseEnrollment` seeded with `lesson.courseRawId` + `lesson.title`, falling back to
      the sales page when the product is unresolvable.

## 7. i18n
- [x] 7.1 Extend `learn.*` (`reader.nextLesson`, `reader.toggleSidebar`,
      `courseQa.seeMore` / reuse existing keys) and any `contentAi.*` label needed, in
      `src/messages/vi.json` + `src/messages/en.json` (same paths, JSON clean).

## 8. Verify
- [x] 8.1 `npx tsc --noEmit` clean.
- [x] 8.2 `npm run build` (webpack) green.
- [x] 8.3 Runtime smoke (dev): video lesson shows AI study, document lesson hides it;
      challenge tab/CTA follow the BE flag; inline next button advances; sidebar toggle
      hides/shows the rail; "See all questions" reveals inline + scrolls (no nav); enroll
      opens the PaymentModal QR.

## Nghiệm thu E2E 2026-07-23 (spec e2e/learn-reader-and-enroll-ux.spec.ts)
- PASS: reader đúng loại bài; "Bài sau"; toggle sidebar; Q&A inline; Enroll WED201c → PaymentModal 399k (cart 200).
- FAIL: tab challenge trên lesson VIDEO — cùng bug content-404 ghi ở learn-exercises-wire.
- Task 6.3 NOT-IMPLEMENTED as-written: nút enroll ở paywall mở PackageGateModal (supersede hướng useCourseEnrollment/PaymentModal). Tasks 2–7 thực tế ĐÃ implement (tasks.md stale).
- Bug phụ: readerHref build moduleId bằng lessonId.split("-")[0] → segment "seed" sai (vẫn chạy vì data theo contentId).

## Nghiệm thu E2E 2026-07-24 RẠNG SÁNG — PASS, đóng change (tasks.md từng stale, nay tick theo E2E thật)
- e2e/learn-reader-and-enroll-ux.spec.ts XANH: reader đúng loại bài (VIDEO mount AI-study block),
  nút "Bài sau" advance, toggle sidebar collapse/restore (desktop — rail resize là aside desktop),
  inline Q&A "Xem tất cả" không navigate, enroll WED201c → PaymentModal VietQR (desktop —
  cart 200 → modal Thanh toán). Mobile: sidebar-resize + enroll-CTA scope desktop (chrome khác).
- Bug hasChallenge content-404 (task 1.1) ĐÃ HẾT (map từ course tree, 270a013).
- Hướng 6.3 (paywall enroll): PackageGateModal cho khoá PACKAGE / PaymentModal cho LEGACY —
  đã ship + verify enroll LEGACY WED201c ra PaymentModal 399k.
