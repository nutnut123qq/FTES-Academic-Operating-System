# Proposal — honor-board-theme-accent

## Why

Bảng vàng vừa redesign (change `honor-board-redesign`) dùng tông GOLD (`warning` token)
theo motif "bảng vàng" cổ điển — nhưng lên trang thật thì lệch tông: màu chủ đạo của
theme là accent xanh, gold thành một khối màu lạc lõng giữa landing. User chốt 2026-07-03:
bỏ gold, màu vinh danh phải theo accent của theme.

## What Changes

- **`HonorBoardSection`:** đổi toàn bộ điểm nhấn từ `warning` → `accent` (gradient tên,
  hero metric, ring ảnh + initials fallback, chip highlight, hover border/glow, ambient
  orbs, trophy icon). Layout podium+grid, glass, count-up, crop mặt giữ nguyên.
- Đồng bộ radius card hand-rolled `rounded-3xl` → `rounded-2xl` theo quyết định repo-wide
  2026-07-03 (decision/card.md).
- Không đổi data/i18n/route.

## Capabilities

### Modified Capabilities

- `home-landing`: requirement "Bảng vàng FTES honor section" — màu nhấn của section là
  token `accent` của theme (không phải gold/warning).

## Impact

- FE-only, 1 file (`HonorBoardSection.tsx`) + journal. Không đổi BE/deps.
