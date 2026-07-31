# Tasks — lesson-topbar-challenge-material

## 1. Hook tài liệu dùng chung (chia sẻ cache)
- [x] 1.1 Thêm `src/components/features/learn/hooks/useQueryLessonDocumentsSwr.ts`: `useSWR` key `["lesson-documents", lessonId]`, gọi `getLessonDocuments(lessonId).catch(() => [])`, trả `{ documents: data ?? [], isLoading, error, mutate }`
- [x] 1.2 `LessonDocumentsBlock` chuyển sang hook chung (bỏ `useSWR`/`getLessonDocuments` inline) → cùng key = SWR dedupe, không fetch 2 lần

## 2. Neo cuộn cho khối tài liệu
- [x] 2.1 Gắn `id="lesson-documents"` vào `div` bọc ngoài của `LessonDocumentsBlock` (giữ nguyên render còn lại)

## 3. Hai nút trên thanh hành động ĐẦU trang
- [x] 3.1 `LessonReader`: gọi `useQueryLessonDocumentsSwr(contentId)` → `hasMaterial = documents.length > 0`
- [x] 3.2 Nút "Làm thử thách" cạnh nút Bài sau, render khi `hasChallenge`; onPress: nếu `challengeLocked` → `openGate("challenge")`, ngược lại `router.push(challengeHref(courseId, lesson.moduleId, contentId, lesson.freeChallengeSlug ?? lesson.challengeId))`; icon `PuzzlePieceIcon`; nhãn `reader.trialChallengeCta`
- [x] 3.3 Nút "Tài liệu buổi học" cạnh đó, render khi `hasMaterial`; onPress `revealDocuments` (ép view "content" + double-rAF `scrollIntoView` tới `#lesson-documents`); icon `FileTextIcon`; nhãn `reader.materialButton`
- [x] 3.4 Cả 2 nút: `Button` `size="sm" variant="secondary"`, `aria-label` = nhãn, nhãn `hidden sm:inline` (icon-only dưới `sm`)

## 4. i18n
- [x] 4.1 Thêm `learn.reader.materialButton` — vi "Tài liệu buổi học", en "Lesson materials" (mirror vị trí sau `trialChallengeCta` ở cả 2 file)

## 5. Verify
- [x] 5.1 `node_modules/.bin/tsc --noEmit` → exit 0
- [x] 5.2 `node_modules/.bin/vitest run src/components/features/learn/LessonReader` giữ xanh
