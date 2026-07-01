# UX Brainstorm — "Hoạt động học" (dashboard overview activity)

Trang: `/dashboard?tab=overview` → `OverviewTab` → `OverviewContributions` → `ContributionCalendarView` (reuseable, dùng chung với public profile).
Phàn nàn của thầy: *"sao cái hoạt động hồng trắng trơn thế này"* (heatmap render nhạt nhoà, trống trơn).

## Chẩn đoán — 2 vấn đề TÁCH BẠCH

### A. BUG token (gốc của "hồng-trắng trơn") — phải fix bất kể chọn hướng nào
- `ContributionCalendarView` tô ô bằng `bg-[var(--heat-0)]` … `bg-[var(--heat-4)]` nhưng **`--heat-*` KHÔNG được định nghĩa trong `globals.css`** → CSS var invalid → ô không có nền → nền hồng của theme mới lòi qua = "hồng trắng trơn".
- FIX: định nghĩa thang `--heat-0..4` trong `globals.css` (ramp hồng có tương phản thật, light+dark): `--heat-0` = track rỗng (vd `--color-default`/`bg-default`), `--heat-1..4` = pink 100→600. Đây là việc `/ui-apply` token, nhưng là điều kiện cần.

### B. Vấn đề UX (cái brainstorm này chốt)
- Heatmap **cả năm** (53×7 ≈ 371 ô) cho learner mới (0 hoạt động) = bức tường ô rỗng, vanity, tốn chiều ngang (phải drag), **không có empty-state** (lưới rỗng = empty state).
- **Trùng surface:** overview ĐÃ có dải "Đã học" (7 ngày T3..T2) + "Mục tiêu tuần" + "Thử thách tuần" → heatmap năm lặp lại khái niệm "hoạt động" (vi phạm restraint / [[course-home-no-duplicate-surfaces]] / [[one-progress-bar-at-a-time]]).
- **Đếm thiếu:** `total` chỉ gồm `contents + challenges + milestones` (3/8 loại). Bỏ qua `CodingSolved`, `AiLabPassed`, `DiscussionCommented` dù `activities` table có.

## Dữ liệu THẬT có sẵn (grounded)
| Nguồn | Query / entity | Hạt | Field |
|---|---|---|---|
| Heatmap năm | `myContributionCalendar(year)` | per-day | `date, contents, challenges, milestones, total` (sparse — chỉ ngày có data) |
| Streak / nhịp | `myWeeklyStats` | aggregate + 7 ngày | `streak, longestStreak, xp, lessons, days[]{date,active}, streakFreezes, weeklyGoalLessons` |
| Activities ledger | `activities` table | per-event | `type` (LessonRead/ChallengePassed/CodingSolved/MilestonePassed/AiLabPassed/CourseEnrolled/DiscussionCommented/UserFollowed), `created_at` |
| XP per ngày | `xp_histories` | per-event | `source, amount, points, created_at` |
| KPI tuần | `myKpis` | rolling 7d | `Lessons/StudyDays/Challenges/Coding/Flashcards + composite` |

→ **streak/longestStreak/last7Days/streakFreezes đã có sẵn nhưng overview chưa khai thác đúng** = cơ hội.

## 3 hướng (xem widget)
- **A · Sửa tại chỗ** — giữ heatmap năm, chỉ fix token màu + thêm empty-state ("Bắt đầu chuỗi hôm nay" + CTA). Rẻ nhất. Trade-off: vẫn lưới rỗng to cho người mới; vẫn trùng dải 7 ngày.
- **B · Streak-first** — thay heatmap năm trên overview bằng module nhịp học: flame + streak hiện tại, dài nhất, dải 14 ngày, băng (freeze), nudge. Từ `myWeeklyStats` (data có sẵn). Trade-off: mất "bản đồ năm" khỏi overview.
- **C · Hybrid (ĐỀ XUẤT)** — headline streak (flame + current/longest + freeze) + heatmap **12 tuần gần đây** gọn (fix token, đếm ĐỦ loại activity, bỏ drag, có empty-state thật). **Full-year + year-switcher chuyển sang trang Hồ sơ** (nơi nó là portfolio artifact đúng chỗ).

## CHỐT: Hướng C
Lý do: overview = "đang giữ nhịp không / làm gì tiếp" → streak là tín hiệu chính (ref Duolingo: goals/feedback/progress + flame + freeze). Heatmap 12 tuần đủ "texture" mà không thành tường rỗng. Full-year là vanity/portfolio → đúng nhà của nó là Hồ sơ, không phải overview (ref dashboard restraint: 5–6 card, ưu tiên cái cần nhất). Vẫn phải fix bug token (A) như phần con của C.

## Section → dữ liệu (hướng C)
| Khối | Dữ liệu |
|---|---|
| Headline streak | `myWeeklyStats.streak / longestStreak / streakFreezes` |
| Heatmap 12 tuần | `myContributionCalendar` (cắt 12 tuần cuối) — **mở rộng `total`** để cộng coding + aiLab (sửa projection BE) |
| Empty-state | khi tổng = 0 → message + CTA "Học 1 bài để bắt đầu chuỗi" (không vẽ lưới rỗng câm) |

## Cắt / Thêm
- CẮT khỏi overview: year-switcher + full-year grid + drag-x → sang trang Hồ sơ/Stats.
- THÊM: streak headline (data có sẵn) · empty-state có CTA · đếm đủ loại activity.
- FIX (bắt buộc): định nghĩa `--heat-*` trong globals.css.

## Refs
- GitHub contribution graph (pattern gốc — nhưng hợp với data dày, không hợp learner mới).
- Duolingo streak / [How to design a great streak — Zac Fitz-Walter](https://www.zacfitzwalter.com/articles/how-to-design-a-great-streak) (goals/feedback/progress, flame, freeze).
- [How to Implement a Streak System — CPI](https://www.cloudproinc.com.au/index.php/2025/07/22/how-to-implement-a-streak-system-in-your-app/).
- [Dashboard design principles — UXPin](https://www.uxpin.com/studio/blog/dashboard-design-principles/) (5–6 card, single screen, ưu tiên thông tin cần nhất).

## Next
Thầy chọn hướng → `/starci-fe-ux-apply` dựng. Bug token `--heat-*` nên fix ngay dù chọn hướng nào.
