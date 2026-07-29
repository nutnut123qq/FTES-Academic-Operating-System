# Tasks — leaderboard-display-name-fe

## 1. Đọc field mới từ BE
- [x] 1.1 `query-course-leaderboard.ts`: thêm `displayName` vào selection `entries`
- [x] 1.2 `types/course-leaderboard.ts`: `CourseLeaderboardEntry.displayName: string | null` (+ doc BE không trả `legacy_*`)

## 2. Mapper ưu tiên displayName
- [x] 2.1 `useQueryLearnLeaderboardSwr.toEntry`: fallback `entry.displayName ?? entry.username ?? #<id>` (+ cập nhật docblock)

## 3. Verify
- [x] 3.1 `tsc --noEmit` sạch (EXIT 0)
- [x] 3.2 Không có test trực tiếp cho hook/mapper (grep xác nhận) → dựa Vercel CI build
