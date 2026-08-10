# Tasks — challenge-attempt-count-excludes-failed (FE)

## 1. Đếm lượt khớp BE
- [x] 1.1 `ChallengeSubmission`: `usedCount` lọc `status !== "FAILED"`
- [x] 1.2 `ChallengeMethodSolver`: `projectGradesUsed` lọc thêm `status !== "FAILED"`

## 2. Cap project chỉ cảnh báo
- [x] 2.1 Bỏ `projectLimitReached` khỏi `canSubmitUrl` / `canSubmitFile` / `canSubmitProject`
- [x] 2.2 Bỏ khỏi guard đầu 3 handler submit
- [x] 2.3 Giữ hint/cảnh báo + `mapSubmitError` dịch `PROJECT_GRADE_LIMIT_REACHED`

## 3. Verify
- [x] 3.1 `tsc --noEmit` sạch
- [ ] 3.2 `npm run build` — KHÔNG chạy được trên box server: `@parcel/watcher-linux-x64-glibc`
  chưa cài nên `next.config.ts` không load (lỗi môi trường, không phải lỗi code). Phải build ở máy dev.
