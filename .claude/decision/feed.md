# Decision — feed

When & WHY we choose/shape the **feed** block. A decision log: for a given scenario, which component we
picked and the reasoning — so next time we design a feed, we reuse the house's logic instead of guessing.
Activity feed, chat, timeline, reactions.

**StarCi blocks in this family:** `ActivityFeed`, `FeedItem`, `ChatBubble`, `Timeline`, `ReactionBar`

> Grows automatically: at the END of each `/starci-fe-ux-apply`, the decision for this block (scenario →
> choice → why) is appended below. No manual command.

## Design baseline (from rules + design — 2026-06-21)

- **Feed = Facebook/LinkedIn style.** Each row = avatar + small icon-type badge (avatar bottom-right corner) + sentence (**actor** bold-`Link` · verb · **target** bold-`Link`) + **relative time** ("2 giờ trước", via existing `getTimeAgoMessage`/`getTimeAgoLabel`) with a `title=` absolute datetime. Separate with thin spacing/divider + light hover bg — NOT thick borders.
- **Build on block `FeedItem`** (`blocks/feed`; leading/children/timestamp). Long feeds → group by day header ("Hôm nay/Hôm qua/Tháng…"). Drop legacy `layouts/shell/Dashboard/Feed` + `EntityToken` → block-based (`FeedItem` + `Link`).
- **Forbidden:** long absolute datetime in feed ("01:56 13 tháng 6, 2026") → always relative.
- **Never-blank target (STRICT):** never render an empty token/target. When `targetLabel == null`, fall back to a generic-noun sentence (key `<type>NoTarget`: "đã đọc một bài học"…), never an empty `<target></target>`.
- **`ActivityAvatar` (avatar + corner badge):** icon-type corner badge = soft-accent but OPAQUE. `bg-accent/10` alone over an avatar is translucent (shows the avatar through — ugly). Correct = **opaque `bg-surface` layer + inner `bg-accent/10` + `text-accent`**, keep `ring-2 ring-surface` to cut it from the avatar. (Tint `/10` only reads solid over a solid bg, so on an avatar you build a solid bg first.)
- **Main avatar by action type:** default = **actor**; for "followed someone" (`userFollowed`) the main avatar = the **followed person** (the interesting entity), corner badge = `UserPlus`. Badge is always icon-type.
- **BE gap:** feed items currently only carry `actorAvatar`, no `targetAvatar` → the followed-person avatar is GENERATED (seed username), not the real uploaded image. Real image needs BE to add `targetAvatar` (at least for `userFollowed`).
- **Activity tab:** drop the "Khóa học" section (already on Overview) — no repeat.

## Decisions (newest first)
- **Social post feed (community)** · chose **Threads anatomy qua block mới `ThreadsPostRow`**
  (`blocks/feed/ThreadsPostRow`, props-only): grid `[48px_minmax(0,1fr)]`, avatar 36px cột trái,
  header line = name semibold + relative time muted CÙNG hàng, rows trong cột
  `divide-y divide-separator` — KHÔNG hộp border per-post, KHÔNG Card · **WHY:** feed xã hội cần
  nhịp đọc liền mạch (Threads: hairline thay card, đơn sắc, count ẩn khi 0, đỏ danger chỉ khi
  liked); hộp border rời từng post đọc như danh sách admin, không phải feed. Baseline
  "Facebook/LinkedIn style" ở trên vẫn đúng cho ACTIVITY feed (câu actor-verb-target); feed
  bài viết xã hội dùng ThreadsPostRow. · community feed + post detail · 2026-07-03
- **Threadline (đường nối avatar ↓ replies)** · chose `div w-0.5 bg-separator rounded-full`
  absolute-flow trong cột avatar của `ThreadsPostRow` (prop `threadline`), bật khi thread mở
  (feed) / khi có comment (detail) · **WHY:** signature của Threads, cho người đọc thấy quan hệ
  post↔replies mà không cần khung; màu = token separator để tự đúng light/dark. · community ·
  2026-07-03

## Gotchas
- **Preview headless KHÔNG bắn được press React Aria** (mọi HeroUI Button/Tab im lặng với
  preview_click, kể cả nút navbar có sẵn; screenshot timeout; viewport có lúc 0×0 → phải
  preview_resize trước khi đo rect). Verify tương tác HeroUI = tay/browser thật; preview chỉ
  tin được snapshot/inspect + plain `<button>`. (2026-07-03, community redesign)
