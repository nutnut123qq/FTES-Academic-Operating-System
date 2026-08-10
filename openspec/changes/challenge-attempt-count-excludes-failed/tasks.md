# Tasks — challenge-attempt-count-excludes-failed (FE)

## 1. Đếm lượt khớp BE
- [x] 1.1 `ChallengeSubmission`: `usedCount` lọc `status !== "FAILED"`
- [x] 1.2 `ChallengeMethodSolver`: `projectGradesUsed` lọc thêm `status !== "FAILED"`

## 2. Cap project (đã hợp nhất với master)
- [x] 2.1 Giữ bản purchased-aware của master: `projectGradeLimit = purchased ? maxSubmissions : 2`
- [x] 2.2 Giữ khoá nút theo cap (không còn khoá nhầm vì FE đã biết `purchased`)
- [x] 2.3 `mapSubmitError` vẫn dịch `PROJECT_GRADE_LIMIT_REACHED`

## 2b. Cap đọc đúng cờ quyền (báo lại sau khi user vẫn thấy khoá 2 lượt)
- [x] 2b.1 `ChallengeSubmission`: cap đọc `courseAccess.fullAccess`, KHÔNG `purchased` — `purchased`
  chỉ true khi có `package_purchases` ACTIVE (PurchaseFlagService), nên người học khoá LEGACY
  (chỉ có enrollment) bị FE khoá ở 2 lượt dù BE `hasEntitledLessonAccess` cho qua
- [x] 2b.2 Đổi tên biến `purchased` → `hasFullAccess` cho khỏi hiểu nhầm

## 3. Verify
- [x] 3.1 `tsc --noEmit` sạch
- [ ] 3.2 `npm run build` — KHÔNG chạy được trên box server: `@parcel/watcher-linux-x64-glibc`
  chưa cài nên `next.config.ts` không load (lỗi môi trường, không phải lỗi code). Phải build ở máy dev.
