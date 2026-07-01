# Decision — button

When & WHY we choose/shape the **button** block. A decision log: for a given scenario, which component we
picked and the reasoning — so next time we design a button, we reuse the house's logic instead of guessing.
FAB / rating / input-like buttons.

**StarCi blocks in this family:** `FloatingActionButton`, `RatingBar`, `InputButtonLike`

> Grows automatically: at the END of each `/starci-fe-ux-apply`, the decision for this block (scenario →
> choice → why) is appended below. No manual command.

## Design baseline (from rules + design — 2026-06-21)

- **Variant = SEMANTICS, never hand-colored.** Color comes from the variant (which maps tokens per theme). Forbidden: color `className` (`bg-*`, `text-accent`…) to "recolor" a button.
  - `primary` — the ONE main forward action per context (Liên hệ tuyển dụng · Lưu · Nộp bài · Ghim).
  - `secondary` — equal-rank alternative (Follow · Chỉnh sửa · Xem tất cả).
  - `tertiary` — low-emphasis / icon-only in a bar (gear · bell · avatar trigger).
  - `ghost` — lightest, transparent bg (accordion toggle · button in list/popover/drawer · "Xem thêm").
  - `outline` — bordered, field/select style (filters · segmented).
  - `danger` — destructive (Xóa · Gỡ · Đăng xuất · Hủy đăng ký).
- **One `primary` per context / action cluster.** Everything else secondary/tertiary/ghost. Never two primaries side by side.
- **Order & placement:** dialog/form horizontal → secondary LEFT, primary RIGHT (`[Hủy (tertiary/ghost)] … [Xác nhận (primary)]`). Narrow column/sidebar/drawer vertical → primary on top, then secondary, then share/aux; use `fullWidth`. **Destructive separated from primary** (`danger` never adjacent to primary — push to other group or overflow menu; delete-account/logout always isolated).
- **Size & touch:** default `size="md"` (≥44px touch); `size="sm"` for aux in popover/row/header-action. Icon-only → `isIconOnly` + **mandatory `aria-label`**, hit-area ≥44px. Full-bleed → `fullWidth` prop (not ad-hoc `w-full`). **Save/submit in a WIDE settings form = SHORT** (`className="self-start"`, NOT `fullWidth`); fullWidth only for the main CTA in a narrow column/modal/card.
- **State:** button that calls a mutation/fetch → **`isPending`** (auto spinner + blocks double-submit); never a stateless button. Disable via `isDisabled`. Use **`onPress` (NOT `onClick`)**.
- **Icon:** phosphor `*Icon`, `aria-hidden focusable="false"`, BEFORE the label, `size-4`. Brand icons (GitHub…) = `@icons-pack/react-simple-icons`.
- **Anti-patterns (forbidden):** multiple primaries · danger next to primary · icon-only without `aria-label` · color via className · `<button>` from scratch (use HeroUI `Button`) · **a row of pill `Button`s as a SELECTOR** (use `Select`/`Tabs primary`) · `fullWidth` save in a wide settings form.

## Decisions (newest first)

### 2026-06-21 — Content-AI FAB (lesson reader)
- **Scenario:** the "ask StarCi AI" mascot FAB on a lesson content page. Was a fixed bottom-right button
  opening a right-side `Drawer` — it sat over the reading column and the drawer covered the lesson.
- **Chose (direction C):** a right-edge FAB the user **drags VERTICALLY only** (pinned to the edge, can't
  block the middle of the content), position persisted in `localStorage`. **Click → anchored `Popover`**
  (HeroUI, `placement="left bottom"`, `w-[380px]`) hosting `ContentAiChat` beside the bubble, so you read +
  chat side by side. **Mobile keeps the bottom-sheet `Drawer`** (a popover is too cramped on a phone).
- **WHY:** thầy chốt C — luôn gọn, không che giữa nội dung; popover nhẹ cho đọc-song-song. Ref: Intercom/Crisp
  messenger popover + edge-docked launcher.
- **Files:** `src/components/features/learn/ContentAiFab/index.tsx` (drag + popover, desktop / FAB+drawer,
  mobile via `useSmViewpoint`), `src/components/drawers/ContentAiChatDrawer/index.tsx` (now mobile-only).
- **Gotchas hit:** (1) FAB must be a HeroUI `Popover` trigger → used `<Button variant="primary">` (accent via
  variant, NOT className — stays on-canon) instead of the `FloatingActionButton` block. (2) Drag-vs-click:
  `DRAG_THRESHOLD` 6px + a `draggingRef` guard in `onOpenChange` swallows the toggle that fires at drag-release.
  (3) Drawer gated to `isMobile` so desktop popover + mobile drawer never both open on the shared overlay key.

## Gotchas
- Draggable FAB + HeroUI `Popover`: the press that ends a drag will try to toggle the popover — guard it
  (`if (draggingRef.current) return` in `onOpenChange`). Pointer drag handlers go on the HeroUI `Button`
  (verify it forwards `onPointerDown/Move/Up`); use `touch-none` so mobile drag doesn't scroll the page.
