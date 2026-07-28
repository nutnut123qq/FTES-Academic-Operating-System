# Tasks — content-list-type-icons

## 1. Helper icon theo loại
- [x] 1.1 Tạo `src/components/features/learn/lessonType.ts` cạnh `exerciseType.ts`: `normalizeLessonType(raw)` (case/separator-insensitive → `video`|`document`|`material`|`unknown`) + `lessonTypeIcon(raw)` trả icon phosphor
- [x] 1.2 Map: VIDEO → `PlayCircleIcon`; DOCUMENT → `FileTextIcon`; material/resource/tài liệu → `PaperclipIcon`; unknown/rỗng → `PlayCircleIcon` (mặc định lịch sử)

## 2. Đưa loại nội dung vào dữ liệu bài học
- [x] 2.1 `LearnLesson` (`useQueryLearnCourseSwr.ts`): thêm `contentType: string`, map `lesson.type ?? ""` trong `toLearnLesson`
- [x] 2.2 `CourseLesson` (`useQueryCourseDetailSwr.ts`): thêm `contentType?: string`, map `lesson.type ?? undefined` trong `toCourseDetail`

## 3. Áp icon vào list nội dung
- [x] 3.1 `ContentMap` hàng bài học: trạng thái MẶC ĐỊNH dùng `lessonTypeIcon(lesson.contentType)`; GIỮ `CheckCircleIcon` (hoàn thành) + `LockSimpleIcon` (khoá) là chỉ báo trạng thái; gỡ import `PlayCircleIcon` không còn dùng trực tiếp
- [x] 3.2 `ContentMap` hàng bài tập: assignment key icon theo `kind` (→ `ClipboardTextIcon`), challenge giữ `normalizeExerciseType(type)`
- [x] 3.3 `CourseDetail` syllabus: hàng bài MỞ KHOÁ dùng `lessonTypeIcon(lesson.contentType)`; hàng KHOÁ giữ `LockIcon`; `PlayCircleIcon` vẫn dùng ở `CardCover` nên giữ import

## 4. Test
- [x] 4.1 Vá 2 mock `LearnLesson` thêm `contentType` (`MindMap/index.test.tsx`, `MindMap/progress.test.ts`)
- [x] 4.2 `ContentMap` không có unit test; test `MindMap`/`CourseDetail`/learn-hooks chạy xanh (36 test)

## 5. Verify
- [x] 5.1 `npx tsc --noEmit` sạch (0 lỗi)
- [x] 5.2 `npm run build` (webpack) xanh
