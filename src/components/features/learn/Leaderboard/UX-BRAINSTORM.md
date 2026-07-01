# Leaderboard — UX Brainstorm (2026-06-25)

> Trang `/learn/leaderboard` (`courseLeaderboard`). Thầy: *"có thể nào render đẹp hơn không, nhiều hạng mục hơn. vì có nhiều loại XP mà. render và check backend luôn."*

## Mục tiêu trang
"Tôi đứng thứ mấy trong khoá này, và **XP của tôi đến từ đâu**" — hiểu trong ≤30s + có động lực (thấy loại hoạt động nào đang kéo điểm, làm gì để lên). Hiện tại = bảng 3 dòng phẳng + tooltip → khô, không kể chuyện "thành phần XP".

## Check backend — sự thật về "nhiều loại XP" (grounded)
- `courseLeaderboard` mỗi entry trả: `totalScore` (challenge), `lessonsRead`, `milestoneProgress`, `totalXp` + `myRank` + `computedAt`.
- **`totalXp = challenge×1 + lessonsRead×3 + milestoneProgress×10`** → đúng **3 hạng mục** per-course.
- `XpSource` enum có **5**: Challenge · LessonRead · Milestone · **Coding** · **DailyQuest**. NHƯNG **Coding + DailyQuest là GLOBAL** (`xp_histories.course_id` null) → KHÔNG nằm trong sum per-course (cho vào sẽ méo ranking khoá: người cày coding toàn hệ thống tự nhiên top khoá họ chưa học).
- **Kho data CHƯA dùng (vàng):** `UserXpProjectionEntity` (per-source: challengeXp/lessonXp/milestoneXp/**codingXp**, per-user app-wide) · `UserAchievementProjection` (badge count) · `UserFlashcardStatsProjection` (streak/retention) · `UserCodingProjection` (solvedCount/byLanguage) · `UserContributionProjection` (streak ngày) · league tier.
- **Kết luận:** "render đẹp hơn" làm được NGAY (3 cat sẵn có). "Nhiều hạng mục hơn" cần BE: hoặc (a) course-scope thêm nguồn (AI Lab pass / coding-in-course / flashcard-in-course), hoặc (b) thêm view **"Toàn nền tảng"** rank theo tổng XP mọi nguồn (dùng `UserXpProjection` per-source breakdown).

## IA mới
1. **Header** (giữ): breadcrumb + title + subtitle + Refresh.
2. **Podium top-3** (giữ, đẹp hơn): rank-1 center + crown; mỗi pedestal kèm **mini segmented bar** thành phần XP.
3. **Bảng rank 4+**: mỗi row = avatar + tên (**link profile** — mới) + **thanh segmented XP** (challenge/đọc/milestone) thay vì dòng "X challenges · Y lessons" + total. Hover → highlight; click tên → profile.
4. **"Hạng #N của bạn" (MyRank)** = ngôi sao của redesign: **thanh segmented lớn** + **3 (→4) category tile** (icon · count · ×weight · xp) thay bảng 3 dòng. Footer "Cập nhật {relative time}".

## Hướng (chốt A, đề xuất B làm tiếp)
| | A — XP-composition (ĐỀ XUẤT) | B — Multi-category (+BE) | C — Stats/badge hybrid |
|---|---|---|---|
| Ý | 3 cat sẵn có, render đẹp: segmented bar + category tiles + podium mini-bar + link profile | thêm hạng mục Coding (course-scope BE) + filter tab theo loại / view Toàn nền tảng | rank theo XP nhưng mỗi row gắn badge (achievement/streak/league) |
| BE | **KHÔNG đụng** (đủ field) | **Cần** (course-scope coding/ai-lab XP, hoặc query global per-source + breakdown array) | Cần (join achievement/streak projection vào query) |
| Ref | Duolingo league · Strava segment composition · GitHub contribution colors | Duolingo XP sources · Khan energy points by category | Duolingo league + badges |
| Trade-off | đẹp + đúng data ngay; vẫn 3 cat | đúng ý "nhiều loại XP" nhưng cần BE + quyết course-scope vs global | "nhiều hạng mục" = nhiều CHIỀU, không phải XP thuần (lệch ý thầy) |

**Chốt: A trước (build ngay, không block BE) → B nối tiếp** (thêm cat Coding + breakdown array). C để dành (badge là hướng khác).

## Section → field BE/DB
| Section | Field |
|---|---|
| Podium / row total | `entry.totalXp`, `username`, `avatar`, `userId` (link profile) |
| Segmented bar (A) | `entry.totalScore` (challenge), `entry.lessonsRead×3`, `entry.milestoneProgress×10` — tự tính tỉ lệ ở FE |
| Category tiles MyRank | `myRank.totalScore` · `lessonsRead` · `milestoneProgress` (+ ×weight hằng số) |
| Footer | `computedAt` (đổi sang relative time) |
| **B — Coding tile** | **MỚI**: BE thêm `codingXp`/`codingSolved` per-course vào entry (course-scope) HOẶC `UserXpProjection.value.codingXp` cho view global |

## Cắt / Thêm
- **Cắt:** dòng stat "X challenges · Y lessons read" (thay bằng segmented bar); tooltip-only breakdown (thành panel hiện rõ); field fetch thừa (`totalChallenges`/`maxPossibleScore` không render).
- **Thêm:** segmented XP bar (row + MyRank) · category tiles có icon/weight · link profile từ row · relative time · podium mini-bar.
- **Weight (×1/×3/×10) = hằng số BE** — nên expose từ BE (đừng hardcode FE drift). Tạm hardcode + ghi nợ.

## Empty/loading/error/a11y
- Empty: chưa ai → EmptyContent "Chưa có ai trên BXH…"; MyRank null → invite card (giữ). Tránh đụng 2 empty.
- Loading: skeleton mirror podium + segmented rows (không mirror bảng cũ).
- a11y: segmented bar có `aria-label` "Challenge 40, Đọc 27, Milestone 46"; link profile có tên.

## CHỐT LAYOUT (2026-06-25) — A + category left-rail (master-detail)
Thầy: *"các hạng mục render dạng List ở bên trái như cái sidebar được không?"* → CHỐT.
- **2 cột (master-detail)**: **rail trái** = `ListBox` flat (kiểu sidebar, ref [[submission-result-flat-listbox-rail-and-detail-surface-card]] §4 [[elements/list]]) liệt kê hạng mục (`Tổng XP` · Challenge · Đọc bài · Milestone); mỗi row = icon + tên + **XP của bạn** + caption "n bài · ×weight"; selected `bg-accent/10`. **Bảng phải** = ranking re-sort theo hạng mục đang chọn.
- **Re-sort client-side, KHÔNG đụng BE**: entry đã có `totalScore`/`lessonsRead`/`milestoneProgress` → chọn "Đọc bài" = sort theo `lessonsRead` desc, v.v. "Tổng XP" = default (rank canonical theo `totalXp`).
- Rail = dual-purpose: **thành phần XP của bạn** + **bộ lọc** board. Mỗi row segmented bar mini (challenge/đọc/milestone) giữ ở bảng.
- **Coding** = row disabled "cần BE" (`WarningCircleIcon`/mờ, KHÔNG `LockIcon` — disable vì chưa khả dụng, không phải khoá-gói; ref [[disable-vs-lock-and-perrow-autosave]]). Hạng mục thứ 4 bật khi BE course-scope coding XP (hướng B).
- **Mobile**: rail trái → thu thành hàng chip/`SegmentedControl` cuộn ngang TRÊN đầu bảng (master-detail → top-tabs khi hẹp). Đồng bộ [[fe responsive breadcrumb]] tư duy.
- **MyRank** vẫn highlight row trong board (không bỏ). Empty/loading/skeleton mirror 2-cột.

## Board redesign v2 (2026-06-25) — bớt hồng + podium (thầy: "hồng nguyên khối nhìn ghê", "podium cũng được", "xóa coding")
- **Bỏ Coding** khỏi rail/chips (chưa có BE → đừng để placeholder).
- **Bỏ `MyRankCard` + `XpBreakdown`** (breakdown đã ở sidebar trái → card hồng bên phải = lặp + nặng). Hết 1 khối hồng.
- **Highlight viewer NHẸ, không nền khối:** bỏ `bg-accent/10` ở row → ring accent avatar + chip "Bạn" outline + số XP accent. Pink = điểm nhấn, không phải mảng nền.
- **Podium top-3** khi `entries ≥ 3`: rank-1 giữa + crown, bệ `bg-background-secondary` (surface trung tính, KHÔNG hồng). `< 3` → bỏ podium.
- **1 học viên (sparse, hiện tại):** 1 **champion card** (surface + crown + "Hạng #1 · dẫn đầu"), thay row+card hồng. 2 người → 2 row sạch.
- Mockup: `leaderboard_board_redesign_less_pink_podium` (A viền info = đề xuất).

### ĐÃ ÁP DỤNG 2026-06-25 (hướng A)
- `LeaderboardPodium` (top-3) + `LeaderboardChampion` (1 người) mới; index adaptive (1→champion · ≥3→podium+list · 2→list). Softening: bỏ `bg-accent/10` row viewer (chỉ ring+chip+XP accent), XP accent chỉ viewer. Bỏ Coding. Xoá `MyRankCard`+`XpBreakdown`. Refresh → toolbar board (no icon, ghost), KHÔNG ở PageHeader. i18n `champion`.
- **Seed demo** (`scratch/seed-leaderboard.cjs`): FS=5 (minh 42·huyen 27·viewer 9 #3·thanh 6·linh 3), SD=1. Local no-CDC → direct-upsert projection persist.
- Rules: [[highlight-accent-as-detail-not-block-fill]] (concept) + [[leaderboard-board-states-podium-champion]] (draft).

## ĐÃ DỰNG (2026-06-25) — rail = sidebar THẬT của shell (thầy: "làm sidebar y chang trang content")
- Rail KHÔNG nằm trong cột page (2-col grid) → đưa vào **`LearnShell` `leftRail` slot** (đúng chỗ ContentMap của trang content), qua `learn/layout.tsx` (`isLeaderboard` → `ResizableRail` + `LeaderboardCategoryRail variant="rail"`).
- **Sync state qua URL `?category=`** (rail layout ↔ board page ở 2 slot khác cây) + **shared SWR** `useLeaderboardSwr` (dedupe 1 fetch). Board đọc `useSearchParams`.
- **Mobile**: leftRail `hidden lg:flex` (ẩn) → board render `LeaderboardCategoryRail variant="chips"` (lg:hidden). `LearnShell` thêm prop **`simpleMobileBar`** (leaderboard+flashcards) để giữ `LearnMobileBar` thường thay vì `LearnMobileTabBar` (content-reader).
- Files: `useLeaderboardSwr.ts`, `LeaderboardCategoryRail` (variant rail|chips, self-contained URL+SWR), `categories.ts` (`parseCategoryParam`), `index.tsx` (board), `LearnShell` (`simpleMobileBar`), `layout.tsx`. tsc/eslint sạch.
