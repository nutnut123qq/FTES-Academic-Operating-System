# Tasks

## 1. Hydration của viewer
- [x] 1.1 Export `queryUserSwrKey(authenticated)` từ `useQueryUserSwr.ts`
- [x] 1.2 Thêm `useRevalidateViewerSwr()` (mutate key signed-in) + docblock giải thích vì sao đổi key không đủ
- [x] 1.3 `usePostKeycloakLoginSwr` await revalidate sau khi lưu token
- [x] 1.4 `usePostLoginWithGoogleSwr` await revalidate
- [x] 1.5 `usePostVerifyMfaChallengeSwr` await revalidate
- [x] 1.6 `usePostVerifyRegistrationSwr` await revalidate
- [x] 1.7 `useExchangeCodeForToken` (OAuth redirect) await revalidate + thêm dep vào `useLayoutEffect`

## 2. Gate dữ liệu signed-in bằng nguồn reactive
- [x] 2.1 `useQueryMyCoursesSwr`: gate + `isLoading` theo `state.keycloak.authenticated`
- [x] 2.2 `useQueryMyEnrolledSlugsSwr`: cùng gate
- [x] 2.3 `useQueryTeachingCoursesSwr`: cùng gate
- [x] 2.4 `useQueryCourseDetailSwr`: gate key `["my-enrollments", courseId]` + `needAccessFallback`

## 3. Test
- [x] 3.1 `signed-in-without-reload.test.tsx`: chưa đăng nhập → không gọi API
- [x] 3.2 `signed-in-without-reload.test.tsx`: đăng nhập tại chỗ (ghi token + dispatch) → fetch mà không remount
- [x] 3.3 Cập nhật 5 ca của `useQueryCourseDetailSwr.test.tsx` cho gate mới
- [x] 3.4 `npx vitest run` các file trên — xanh
- [ ] 3.5 E2E trình duyệt (đăng nhập tại chỗ, quan sát navbar + băng "học tiếp") — CHƯA chạy
