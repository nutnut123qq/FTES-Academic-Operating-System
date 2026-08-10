# gopy-leaderboard-badge-names — huy hiệu hiện tên thật, không phơi key i18n

## Why
Ảnh chụp `/vi/leaderboard` (2026-07-28) cho thấy ô huy hiệu in nguyên đường key:
`gamification.milestones.FIRST_LESSON.name`.

Gốc: FE **tự đặt vựng badge riêng**, không khớp BE. i18n chỉ có 3 key camelCase
(`weekOfFire`, `monthOfGrit`, `hundredDays`) — chép theo danh sách hardcode ở
`LeaderboardGuideShell`, trong khi BE seed 6 badge với `code` SCREAMING_SNAKE
(`FIRST_LESSON`, `LESSON_100`, `STREAK_7`, `STREAK_30`, `STREAK_100`, `CHALLENGER`,
migration V66). Không key nào trùng → mọi badge trao thật đều mất bản dịch. Cùng lỗi
này đang dính ở 3 surface: LeaderboardShell, ProfileProgress, ProfileShell.

## What Changes
- i18n `gamification.milestones.*` khoá theo ĐÚNG `code` của BE, đủ 6 badge (vi + en).
- `LeaderboardGuideShell.STREAK_MILESTONES` trỏ `STREAK_7/30/100` thay tên tự đặt — trang
  hướng dẫn và badge trao ra gọi cùng một tên.
- `MyGamificationBadge` mang thêm `fallbackName` (tên BE trả, đã có tiếng Việt trong seed);
  LeaderboardShell dùng khi thiếu bản dịch → BE seed badge mới cũng không lộ key thô.
