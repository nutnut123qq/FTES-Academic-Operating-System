## Context

`/leaderboard` (`src/components/features/gamification/LeaderboardShell/`) là dashboard display-only: mock `useQueryLeaderboardSwr` trả `me { xp:4820, level:12, streak:7, rank:3 }`, board phẳng, 5 badge. Không có luật nào: không gì tăng XP/streak, không level curve, không league. ftes.txt §11 liệt kê XP/Level/Reputation, Daily/Weekly/Monthly goals + Streak, Badge/Title/Trophy, League/Season, Rewards, Subject Mastery. Đây là change LÀM RÕ LUẬT (rules-clarification) + dựng surface giải thích; FE-only, BE mock.

## Goals / Non-Goals

**Goals:** một bộ luật số học duy nhất, deterministic, đọc được ở 1 chỗ; streak có nghĩa (định nghĩa + thưởng + bảo hiểm); surface giải thích cho người học; build xanh.

**Non-Goals (defer):** League/Season (chỉ outline ở guide, đánh dấu "sắp ra mắt"), Mystery Box/Lucky Spin, Monthly goal, Reputation riêng (đã có `community-reputation`), Subject Mastery, BE/persistence thật, anti-cheat.

## Decisions

- **Single source of truth cho luật = 1 file hằng số** `src/components/features/gamification/rules.ts`: `XP_TABLE`, `QUIZ_XP_TIERS`, `LEVEL_CURVE`, `RANK_TIERS`, `STREAK_MULTIPLIER_STEP/CAP`, `STREAK_MILESTONES`, `FREEZE/REPAIR` config + pure functions `levelFromXp(xp)`, `xpToNextLevel(xp)`, `tierFromXp(xp)`, `streakMultiplier(days)`, `isQualifyingAction(type)`. UI + guide page + toast đều import từ đây — số trong spec là hợp đồng, số trong code chỉ sống ở file này. *Alternative:* rải hằng vào từng component — loại, đã gây drift ở các dự án trước.
- **Level curve = căn bậc hai** — tổng XP cần cho level L: `35 × (L−1)²` ⇔ `level = 1 + floor(sqrt(xp/35))`. Khớp mock hiện tại (4 820 XP → level 12, cần 5 040 cho 13). *Alternative:* tuyến tính 100 XP/level — loại, level phình vô nghĩa ở XP cao.
- **Tier theo TỔNG XP, không theo rank tuần** (chưa có league): Đồng/Bạc/Vàng/Bạch Kim/Kim Cương với ngưỡng cố định trong spec. Khi league (defer) vào thì tier tuần là khái niệm riêng.
- **Streak đo bằng HÀNH ĐỘNG HỌC, không phải login** — đây là "ý nghĩa" của streak: nó đo thói quen học (§11 Learning Habit), login-only cho +5 XP nhưng KHÔNG giữ streak. Ranh giới ngày = ngày local của thiết bị (mock; ghi chú BE sau dùng Asia/Ho_Chi_Minh).
- **Engine mock client-side, deterministic**: state (`xp`, `streak`, `activeDays[]`, `freezes`, goals) persist `localStorage` key `ftes.gamification.v1`; seed lần đầu từ mock hiện có (giữ 4820/7 để UI ổn định). Award phát khi flow học mock bắn event hoàn thành (lesson/quiz) → toast +XP. *Alternative:* nâng cấp SWR mock thuần đọc — loại, không demo được increment/reset/toast.
- **Explainer = TRANG route `/leaderboard/guide`** ("Cách tính điểm"), không modal: nội dung dài (3 bảng + luật streak), cần deeplink/i18n/a11y heading. Link từ header LeaderboardShell. League/Season xuất hiện ở guide dưới mục "Sắp ra mắt".
- **Streak popover** (mở từ stat card Streak + chip lửa avatar menu): số ngày, multiplier hiện tại, heatmap 12 tuần (grid ngày hoạt động), inventory freeze, mốc kế tiếp. Heatmap là grid `<div>` thuần + `aria-label` per-cell, không lib chart.
- **Component code theo skill nhà** (`starci-fe-cannon-apply`) khi implement — artifacts này không quy định class cụ thể.

## Risks / Trade-offs

- [Số liệu XP là giả định FE, BE sau có thể khác] → mọi số chỉ ở `rules.ts` + spec; đổi 1 chỗ.
- [localStorage state lệch giữa thiết bị / xoá cache mất streak] → chấp nhận (mock); ghi giả định trong code.
- [Reminder 20:00 không có push thật] → render qua notification bell mock hiện có khi app mở; ghi rõ là best-effort.
- [Nhân XP + cap có edge (freeze ngày có multiplier?)] → luật chốt trong spec: ngày freeze GIỮ streak nhưng không tăng multiplier bậc.

## Open Questions

- (none blocking) — League/Season và Monthly goal chờ change riêng khi §11 Competition được ưu tiên.
