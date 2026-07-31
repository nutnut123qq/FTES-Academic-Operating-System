# Tasks — lesson-practice-rail-cleanup

## 1. Rail phải — panel tài liệu (OnThisPage)
- [x] 1.1 `OnThisPage/index.tsx`: import + gọi `useQueryLessonDocumentsSwr(contentId)`; `const hasDocuments = documents.length > 0`
- [x] 1.2 Cập nhật guard early-return: `if (headings.length === 0 && !hasChallenge && !hasDocuments) return null`
- [x] 1.3 Thêm panel "Tài liệu cho lesson này" NGAY DƯỚI panel challenge: `<Label>{t("lessonRail.documents.title")}</Label>` + cột link, mỗi doc là `<Link href={doc.url} target="_blank" rel="noopener noreferrer">{doc.title}</Link>` (chỉ render khi `hasDocuments`)
- [x] 1.4 i18n `learn.lessonRail.documents.title` (vi "Tài liệu cho lesson này" / en "Lesson materials"), mirror cạnh `lessonRail.challenges` ở cả `vi.json` + `en.json`

## 2. Khu nội dung — gỡ tab + nút + docs inline (LessonReader)
- [x] 2.1 Gỡ 3 nút top-bar (`trialChallengeCta`/`assignmentButton`/`materialButton`); giữ Bài trước/Bài sau + hamburger sidebar
- [x] 2.2 Gỡ tab: render `TabsCard`, `leftTabs` useMemo, nhánh + component `ChallengesView`/`ChallengeRow`; khu nội dung luôn hiển thị phần đọc (gỡ `view`/`setView`/`ContentView`)
- [x] 2.3 Gỡ `<LessonDocumentsBlock lessonId={contentId} />` inline; xoá file `LessonDocumentsBlock.tsx` (không còn importer)
- [x] 2.4 Dọn dangling: `revealDocuments`/`revealAssignments`, `hasChallenge`/`hasAssignment`/`hasMaterial`/`hasFullAccess`/`challengeLocked`, call `useQueryLessonDocumentsSwr`/`useGetLessonAssignmentsSwr`/`useQueryLearnCourseSwr`, import `ClipboardTextIcon`/`FileTextIcon`/`TabsCard`/`type Key`, anchor `#lesson-documents`/`#lesson-assignments`. GIỮ `PuzzlePieceIcon` (còn dùng ở `TrialChallengeCta`)
- [x] 2.5 Cập nhật JSDoc `useQueryLessonDocumentsSwr` (giờ phục vụ panel rail, không phải LessonDocumentsBlock/top-bar)

## 3. Test
- [x] 3.1 `LessonReader/index.test.tsx`: gỡ test nút top-bar (trialChallengeCta/assignmentButton/materialButton) + assertion tab "Thử thách"; gỡ mock TabsCard/LessonDocumentsBlock/course/documents/assignments không còn dùng; giữ test reaction footer + TrialChallengeCta xanh

## 4. Verify
- [x] 4.1 `node_modules/.bin/tsc --noEmit` → exit 0
- [x] 4.2 `node_modules/.bin/vitest run src/components/features/learn/LessonReader src/components/features/learn/OnThisPage` → xanh (7 file / 43 test)
