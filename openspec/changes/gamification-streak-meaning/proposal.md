## Why

§11 gamification hiện chỉ là số trang trí: `/leaderboard` render 4 stat card (XP/Level/Streak/Rank) + bảng xếp hạng + 5 badge từ mock tĩnh (`xp:4820, level:12, streak:7, rank:3`) — không có LUẬT nào phía sau (không bảng XP, không công thức level, không định nghĩa streak). Người học không biết điểm từ đâu ra và streak để làm gì. Change này ĐỊNH NGHĨA hệ luật gamification (rules-clarification) và cho streak ý nghĩa thật: ngày hợp lệ, nhân XP, mốc thưởng, freeze/repair.

## What Changes

- **Định nghĩa kinh tế XP**: bảng XP-per-action (hoàn thành bài học, quiz theo bậc điểm, challenge, upvote cộng đồng, đăng nhập ngày, hoàn thành goal), công thức level curve, 5 hạng (Đồng → Kim Cương) theo tổng XP.
- **Streak có nghĩa**: ngày streak = ≥1 hành động HỌC có ý nghĩa (bài học/quiz/challenge — KHÔNG tính chỉ đăng nhập); thang nhân XP +5%/ngày (trần +50%); mốc 7/30/100 ngày (badge + FTES coin); item Streak Freeze + Streak Repair; nhắc "streak sắp mất" 20:00.
- **Engine mock client-side** (deterministic): file hằng số duy nhất + pure functions (`levelFromXp`, `streakMultiplier`, `tierFromXp`); trạng thái mock persist localStorage; award XP khi hoàn thành bài học/quiz mock.
- **Surfaces mới**: trang giải thích luật "Cách tính điểm" (`/leaderboard/guide`); popover chi tiết streak với calendar heatmap 12 tuần; card Daily/Weekly goal; toast +XP; moment level-up; streak hiện ở avatar menu/profile/leaderboard/workspace.
- i18n vi/en + a11y cho mọi surface mới.
- **Không làm** (defer, ghi ở design): League/Season, Mystery Box/Lucky Spin, Monthly goal, BE thật.

## Capabilities

### New Capabilities
- `gamification-rules`: kinh tế XP — bảng điểm per-action, level curve, hạng (tier), toast +XP, moment level-up, trang giải thích "Cách tính điểm".
- `gamification-streak`: luật streak — ngày hợp lệ, tăng/reset, freeze/repair, thang nhân XP, mốc thưởng, nhắc nguy cơ, popover heatmap, các surface hiển thị.
- `gamification-goals`: mục tiêu Daily/Weekly — định nghĩa, tiến độ, thưởng XP, card hiển thị.

### Modified Capabilities
- (none — chưa có spec gamification nào trong `openspec/specs/`)

## Impact

- FE only, mock BE (per CLAUDE.md). Code đích: `src/components/features/gamification/**` (constants/engine mới + LeaderboardShell mở rộng), route `/leaderboard/guide`, popover streak ở app shell, i18n `gamification.*` (vi/en).
- Không đổi API thật; engine thuần client (localStorage), dễ thay bằng BE sau.
- Build phải xanh: `npm run build` (webpack) + `tsc --noEmit`.
