## 1. Hover-preview đọc trạng thái ghi danh

- [x] 1.1 `CourseHoverPreview`: import `useQueryMyEnrolledSlugsSwr` (cùng thư mục hooks của feature
      course) và tính `isEnrolled = enrolledSlugs.has(course.id)`. Không tự fetch per-card: hook dùng
      SWR key chung `course-my-enrolled-slugs` (deduped toàn trang) + token-gated (khách → set rỗng).

## 2. CTA phân nhánh theo ghi danh

- [x] 2.1 Đổi handler `onEnroll` → `onCta`: `router.push(isEnrolled ? `/courses/${course.id}/learn`
      : `/courses/${course.id}`)`. Nhánh chưa-ghi-danh giữ nguyên route cũ (trang chi tiết).
- [x] 2.2 Nhãn nút: đã tham gia → `courses.continueLearning` ("Tiếp tục học"); chưa tham gia → GIỮ
      `courseSystem.browse.preview.enroll` ("Đăng ký khóa học"). Tái dùng key đã có (vi + en) — không
      chế nhãn mới.
- [x] 2.3 Cập nhật JSDoc component: nêu rõ CTA mirror card (đã tham gia = tiếp tục học vào learn
      shell; còn lại = đăng ký về trang chi tiết).

## 3. CourseDetail — xác nhận không cần sửa

- [x] 3.1 Đối chiếu `CourseDetail` / `EnrollCard` / `PackageEnrollCard`: khi `isEnrolled` (từ
      `useCourseEnrollment` ← `course.enrollment` do `useQueryCourseDetailSwr` resolve qua
      `getMyEnrollments` + `useGetMyCourseAccessSwr` fallback) đã thu về đúng một nút
      `detail.continueLearning` → `onContinueLearning` (`/courses/{slug}/learn`). KHÔNG có bug ở đây,
      không sửa.

## 4. Verify

- [x] 4.1 `npx tsc --noEmit`: sạch (exit 0, không dòng nào).
- [ ] 4.2 `npm run build` (webpack): xem báo cáo — env build chậm/có thể timeout cục bộ; nếu không
      xong thì dựa vào tsc sạch + CI/Vercel verify.
- [x] 4.3 Không có unit test cho `CourseHoverPreview` (thư mục chỉ có `index.tsx`) → không có test
      để giữ/sửa.
