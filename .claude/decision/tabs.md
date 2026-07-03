# Decision — tabs

When & WHY we choose/shape the **tabs** block. A decision log: for a given scenario, which component we
picked and the reasoning — so next time we design a tabs, we reuse the house's logic instead of guessing.
Tab bars / segmented switchers.

**StarCi blocks in this family:** `TabsCard`, `ExtendedTabs`

> Grows automatically: at the END of each `/starci-fe-ux-apply`, the decision for this block (scenario →
> choice → why) is appended below. No manual command.

## Design baseline (from rules + design — 2026-06-21)

Distilled from `starci-navigation.md` (shell shaping) + the `TabsCard` / `ExtendedTabs` block rules already recorded in the drafts (`tabscard-two-secondary-groups`).

**Two tab groups on one toolbar = block `TabsCard` (`blocks/navigation/TabsCard`)** — do NOT hand-assemble loose Tabs/pills inside a feature.
- API: `<TabsCard leftTabs={group} rightTabs={group?} />`, each `group` = data JSON `{ items: [{ key, label, icon?, isDisabled?, muted? }], selectedKey, ariaLabel, onSelectionChange }`.
- Feature passes data + `onSelectionChange` only (reads store / dispatches at the feature); the block owns ALL style.

**Both groups secondary (underline), neither primary.**
- Both sides share the same "skin" → reads as one nav tier, neither louder. The block bakes `data-[selected]:border-b-2 border-accent text-accent` itself — because the global `.extended-tabs` class only removes the baseline, it does NOT draw the underline.

**Spacing / semantics**
- Gap between the two groups = `justify-between` + `gap-3` (rhythm-3 standard; gap-1.5 is BANNED). Icon+label inside one tab = `gap-2`.
- Split roles by semantics (tabs-vs-segmented): LEFT group changes the content; RIGHT group (e.g. language TS/Java/C#/Go) keeps the same content but changes how it's presented. Both are "tab groups" in data, but presented merged into one toolbar instead of two tiers (avoid "multiple tab levels").

## Decisions (newest first)
- **Route-scope switcher trong sticky header (community: 4 scope là route segments)** · chose
  **`ExtendedTabs`** underline, `selectedKey` derive từ pathname, `onSelectionChange` →
  `router.push` · **WHY:** thay hàng pill `Button` cũ (vi phạm "1-of-few = Tabs, NEVER pill
  buttons"); Threads web dùng dropdown tên feed nhưng 4 scope FTES cần discoverability →
  underline tabs là giao điểm Threads-calm × luật nhà. · community shell · 2026-07-03
  **(cập nhật `community-flat-header` 2026-07-03):** feed xã hội CHUNG → bỏ identity row;
  header giờ là **dải tab PHẲNG CHÌM vào trang** (`sticky top-16 bg-background/70
  backdrop-blur`, **KHÔNG viền dưới, KHÔNG nền card**) = tabs bên trái + ⋯ bên phải
  `xl:hidden`. **Nguyên tắc: một dải sticky "chìm vào trang" = bỏ `border-b` (cạnh card) +
  nền cùng màu trang mờ nhẹ (`bg-background/70`) đủ giữ legible khi cuộn** — đừng để nền đặc
  + viền (đọc thành thanh/card nổi).
- **Single in-flow tab strip switching content panels** (learn player: Bài giảng / Tài
  liệu / Ghi chú) · chose **`ExtendedTabs`** directly (not `TabsCard`) with the HeroUI
  compound inside (`Tabs.ListContainer > Tabs.List > Tabs.Tab id=…`), panels rendered by
  the feature's local `selectedKey` · **WHY:** `TabsCard` is for a toolbar of one-or-two
  tab GROUPS; a lone content-switcher is just the underline strip — `ExtendedTabs` bakes
  the secondary/underline skin, the feature owns the panel switch. · course-learn-player ·
  2026-07-02

**Page chrome lives on the feature wrapper, not in the block.**
- The page's own chrome (full-width `border-b` + `max-w-3xl` cap) goes on the feature wrapper (e.g. `ContentTabBar`), NOT inside `TabsCard` → the block stays reusable elsewhere. `.extended-tabs` deliberately has no baseline so the wrapper owns the edge-to-edge divider.
- Reference layout: GitHub file header / shadcn preview (tabs left + control right on one bar); language switcher: Stripe / Mintlify (global + persistent).

## Decisions (newest first)
_(empty — each entry: **scenario** · **chose what** · **WHY** · which page · date)_

## Gotchas
_(empty)_
