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
_(empty — each entry: **scenario** · **chose what** · **WHY** · which page · date)_

## Gotchas
_(empty)_
