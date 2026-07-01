# UX Brainstorm — Overview tab polish (standing · LabeledCard · KPI)  — 2026-06-18

> `/ux-brainstorm` focus theo feedback thầy: (1) chip standing trái chật/khó hiểu · (2) phải chưa dùng LabeledCard
> nhất quán · (3) KPI chắp vá (có thể sửa DB). KHÔNG code → `/ux-apply`.

## 0. Audit (Overview hiện tại)

- **Trái** (`DashboardIdentity`): `ProfileMenuCard` + **`StandingChips`** (3 chip: "Chuỗi 1 ngày" · "Credit AI Còn 363/500"
  · "357 điểm") + `QuickActions`.
- **Phải** (`OverviewTab`): `ContinueLearning` (hero "Chào mừng trở lại…") · `MomentumBand` (strip 7 ngày + nudge + 5
  KPI bar + "Sửa") · `WeeklyChallengeCard` · Heatmap (LabeledCard).

## 1. Pain (đúng feedback)

1. **StandingChips chật + mơ hồ:** 3 chip wrap trong cột 288px; "357 điểm" KHÔNG nhãn (điểm gì? = điểm quà/reward,
   nhưng đọc tưởng XP); "Credit AI Còn 363/500" dài, tràn chip. Chip soft = khối nhỏ, không đọc rõ value↔label.
2. **Phải KHÔNG nhất quán LabeledCard:** chỉ Heatmap bọc `LabeledCard`; ContinueLearning/MomentumBand/WeeklyChallenge
   là block tự-title rời → lệch chuẩn profile (mỗi section = label NGOÀI + card). Greeting "Chào mừng" lại trùng
   identity trái (đã có avatar+tên).
3. **KPI chắp vá — có GỐC Ở DB:** MomentumBand nhồi *streak strip + daily-goal + 5 KPI bar + Sửa* vào 1 khối phẳng.
   Tệ hơn: **2 khái niệm goal trùng** — `weeklyGoalLessons` (scalar, `setWeeklyGoal`, vòng mục tiêu) vs
   `weeklyKpiTargets['lessons']` (map 5-KPI, `setKpiTarget`). Cùng "lessons/tuần", set độc lập, KHÔNG cross-validate,
   `weeklyGoalLessons` giờ nửa-vời (component `WeeklyGoal` orphan). → mô hình goal "nửa xây".

## 2. Hướng (chốt A)

- **A — CHỐT: tách sạch + LabeledCard hết + clean standing + UNIFY goal model (DB).**
- B — chỉ đánh bóng MomentumBand gộp: không hết "chắp vá". Loại.
- C — KPI thành ring Duolingo riêng: là 1 phần của A.

## 3. Sửa cụ thể

### 3a. Standing trái — bỏ chip chật → **stat rows rõ nghĩa** (kiểu meta profile)
Thay `StandingChips` (3 chip wrap) bằng **danh sách dòng `icon + label + value`** (bare, dọc, full-width cột trái):
- 🔥 **Chuỗi:** 1 ngày · *dài nhất 2*
- ⚡ **Credit AI:** 363/500 (tuần)
- 🎁 **Điểm quà:** 357
Mỗi dòng = `IconTile`/icon + Typography label muted + value đậm. Rõ value↔nghĩa, không tràn. (Mirror "meta rows" của
ProfileHero: 1 leading icon + text/dòng, `py-0.5`, gap-2.) Null-guard từng dòng. Đặt tên block `IdentityStats`.

### 3b. Phải — **mọi section = `LabeledCard`** (chuẩn profile)
- **Bỏ greeting "Chào mừng trở lại"** (identity trái đã trả lời "ai") — hoặc rút thành 1 dòng header mảnh trên cùng phải.
- `ContinueLearning` → `LabeledCard label="Tiếp tục học" icon=BookOpen` (resume cards bên trong, bỏ greeting nội bộ).
- **Tách `MomentumBand` → 2 LabeledCard:**
  - **"Đà học"** (`PulseIcon`/`FlameIcon`): strip 7 ngày + chuỗi hiện tại/dài nhất + daily-goal nudge ("Học 1 nội dung…").
  - **"Mục tiêu tuần"** (`TargetIcon`): composite ring/% + 5 KPI (Nội dung/Ngày học/Challenge/Coding/Flashcard) bar + "Sửa".
- `WeeklyChallengeCard` → `LabeledCard label="Thử thách tuần"` (hoặc giữ self-title nếu card đã chuẩn — ưu tiên LabeledCard cho đồng bộ).
- Heatmap → giữ `LabeledCard "Hoạt động học"`.
- Component con = **content-only** (bỏ title nội bộ), để LabeledCard cấp label NGOÀI (đúng pattern profile).

### 3c. KPI/goal — **UNIFY DB** (sửa db, "sửa db nếu cần")
Gốc chắp vá = 2 nguồn goal. **Chốt Option C — `weeklyKpiTargets` là DUY NHẤT:**
- **Bỏ/deprecate `weeklyGoalLessons`** (column + field `myWeeklyStats.weeklyGoalLessons` + mutation `setWeeklyGoal`).
- `setWeeklyGoal(lessons)` → alias/thay bằng `setKpiTarget('lessons', n)`. "Mục tiêu tuần" (5-KPI) là surface goal DUY NHẤT.
- Xoá component orphan `WeeklyGoal` (FE) nếu còn.
- Migration: drop column `weekly_goal_lessons` (hoặc giữ cột, ngừng dùng — chốt khi /ux-apply). **Breaking GraphQL** → nêu rõ, làm ở BE.
→ Sau đó "Mục tiêu tuần" card = 1 mô hình goal sạch (5 key), composite % rõ ràng, hết 2-đường.

## 4. Section → data

| Vùng | Hook/field | Ghi chú |
|---|---|---|
| IdentityStats (trái) | `myWeeklyStats.{streak,longestStreak}` · `myAiQuota.credit.{remainingWeek,limitWeek}` · `myRewardWallet.balance` | dòng icon+label+value |
| Tiếp tục học | `myInProgressChallenges`+`myLearnedLessons`+`myCourses` | LabeledCard |
| Đà học | `myWeeklyStats.{days,streak,longestStreak}` | LabeledCard, daily nudge |
| Mục tiêu tuần | `myKpis.{composite,items}` (target từ `weeklyKpiTargets` DUY NHẤT) | LabeledCard, "Sửa"→/kpi |
| Thử thách tuần | `weeklyChallenge` | LabeledCard |
| Hoạt động học | `myContributionCalendar` | LabeledCard |

## 5. Cắt / Sửa / DB
- **Cắt:** `StandingChips` (→ `IdentityStats` rows); greeting hero; title nội bộ các block (→ LabeledCard label).
- **Tách:** `MomentumBand` → "Đà học" + "Mục tiêu tuần".
- **DB (BE):** unify goal → bỏ `weeklyGoalLessons`/`setWeeklyGoal`, dùng `weeklyKpiTargets`/`setKpiTarget` cho lessons.
  Migration + breaking GraphQL — nêu rõ, KHÔNG fake. Xoá FE `WeeklyGoal` orphan.
- **a11y/state:** mỗi section AsyncContent (sẵn); stat rows null-guard; reduced-motion.

## 6. Mở (chờ thầy chốt khi /ux-apply)
- Bỏ hẳn cột `weekly_goal_lessons` (migration) hay chỉ ngừng-đọc (giữ cột)? → mặc định **bỏ** cho sạch.
- Greeting: bỏ hẳn hay giữ 1 dòng mảnh trên phải? → mặc định **bỏ** (identity trái đủ).
