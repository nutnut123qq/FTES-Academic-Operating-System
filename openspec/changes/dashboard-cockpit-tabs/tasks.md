# Tasks

## 1. P0 — khung `/dashboard`

- [x] 1.1 `features/dashboard/types.ts`: `DASHBOARD_TABS` + re-export `DashboardTab` từ store
- [x] 1.2 `features/dashboard/hooks/useDashboardTabUrlSync.ts`: store ↔ `?tab=` 2 chiều, `router.replace` (không đẻ history entry), `fromUrlRef` chống echo
- [x] 1.3 `features/dashboard/DashboardTabsBar/index.tsx`: `ExtendedTabs` + icon phosphor (House/Compass/GraduationCap/Trophy), mobile icon-only + `textValue` cho screen reader, không `Tabs.Indicator`, không border/sticky riêng
- [x] 1.4 `features/dashboard/index.tsx`: `useDashboardTabUrlSync()` + `useRegisterNavbarBottomLayer(useMemo(...))`, khung 2 cột `max-w-6xl`, trái `DashboardIdentity` (import chéo từ analytics), phải chỉ mount panel đang mở với `role="tabpanel"`
- [x] 1.5 4 stub `OverviewTab / ExploreTab / CoursesTab / CommunityTab` render `null`
- [x] 1.6 `src/app/[locale]/dashboard/page.tsx` render `<Dashboard />`
- [x] 1.7 Rà `src/proxy.ts`: `/dashboard` KHÔNG cần thêm vào `PROTECTED_PATTERNS` (chỉ `/admin` bị gate; `/analytics` cũng không) — không sửa file

## 2. P1..P4 — nội dung từng tab

- [x] 2.1 OverviewTab: continue-learning + streak + daily quest (tái dùng widget analytics) + `WeeklyGoals` có tử số XP thật + `OverviewContributions` heatmap 12 tuần trên `GET /gamification/me/activity-days`. BỎ: weekly-challenge (adapter mock), changelog, job-readiness (không có endpoint); goal `LESSONS`/`MINUTES` render target-only vì BE không trả `current`
- [x] 2.2 ExploreTab: `ExploreTrending` (REST `GET /community/trending`, không score/rank vì BE không serialize) + `ExploreFeed` bọc `CommunityFeed` dùng lại (scope forYou/following). BỎ: who-to-follow (không có endpoint), tab CAMPUS/TRENDING trong strip
- [x] 2.3 CoursesTab: `MyCoursesProgress` (dùng lại `useQueryMyCoursesSwr` → chung cache với `/courses/me`, 1 thanh `completionPercent`, không tách 3 slice) + `FeaturedCourses` (`recommendedCourses`, đặt tên trung thực vì resolver không cá nhân hoá) + `UpcomingEvents` (`GET /events` join `GET /event/registrations/me` vì list trả `myRegistrationStatus` = null)
- [x] 2.4 CommunityTab: `TopLearners` từ `leaderboard(scope: GLOBAL)` (top 5 + hàng "Vị thế toàn cục" khi người xem có mặt). BỎ: league tuần, level, avatar ảnh, mũi tên thăng/giáng hạng, self-row ghim khi ngoài top 20 — BE không có dữ liệu

## 3. Ghép (phase tập trung, chỉ 1 agent đụng file dùng chung)

- [x] 3.1 i18n: thêm 21 key mới vào `src/messages/{vi,en}.json` (14 dưới `dashboard.*`, 7 dưới `analytics.overview.*`); sửa `dashboard.community.topLearners.title` vi "Top học viên tuần" → "Top học viên" (bảng là `scope: GLOBAL`, không phải tuần)
- [x] 3.2 Rà mọi `t()` trong `features/dashboard/**` resolve được ở CẢ vi lẫn en (gồm 5 key template-literal: `dashboard.tabs.*`, `eventSystem.dayLabels.*`, `eventSystem.locationTypes.*`, `analytics.overview.goals.metrics.*`)
- [x] 3.3 `src/app/[locale]/analytics/page.tsx` → `redirect(/${locale}/dashboard)`; giữ nguyên `AnalyticsDashboard` + widget con (OverviewTab của `/dashboard` import chéo `DashboardIdentity`/`ContinueLearning`/`DailyQuest`/`StreakStrip`)
- [x] 3.4 Rà toàn repo link `/analytics`: KHÔNG có link điều hướng nào (navbar, account menu, `EXPLORE_SHORTCUTS`, sitemap, e2e đều không trỏ tới) — `pathConfig().locale().analytics()` khai báo nhưng chưa ai gọi. Không phải sửa link nào
- [x] 3.5 Dọn docblock sai ở `AnalyticsDashboard/index.tsx` (tab-store + navbar bottom layer ĐÃ có) và `AnalyticsDashboard/OverviewTab/index.tsx` (`GET /gamification/me/activity-days` CÓ thật)

## 4. Verify

- [x] 4.1 `node -e JSON.parse(...)` sạch trên vi.json + en.json
- [x] 4.2 `npx vitest run src/messages/messages.icu.test.ts` xanh (6/6 — ICU parse + parity vi/en)
- [~] 4.3 `npx tsc --noEmit`: KHÔNG còn lỗi nào ở `features/dashboard/**`, `features/analytics/**` hay `app/[locale]/analytics`. Còn 15 lỗi CÓ SẴN của worktree chung (session khác đang sửa dở), ngoài phạm vi change này: 4 × `.next/types` stale (route `learn/interview` đã xoá khỏi cây nguồn), 11 × `ModerationReport.reportId` (`features/community/**`)
- [ ] 4.4 `npm run build` (webpack) xanh — phase Verify chạy tập trung
- [ ] 4.5 Xác minh bằng mắt: tab strip dưới navbar, 4 tab render, `/analytics` bật sang `/dashboard`
- [x] 4.6 `openspec validate dashboard-cockpit-tabs --strict`
