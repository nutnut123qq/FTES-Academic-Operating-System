# Decision — overlay (modal · drawer · popover)

When & WHY we shape the overlay shell (Modal / Drawer / anchored Popover). A decision log so the next
overlay reuses the house's logic instead of guessing.

**StarCi shells:** HeroUI `Modal` (mounted in `ModalContainer`), `Drawer` (in `DrawerContainer`), `Popover`
(anchored). The shell rules live in `../cannon/CONTENT.md` SLICE 5.8.

## Decisions (newest first)

### 2026-06-21 — Read-heavy detail = dedicated PAGE, not a modal
- **Scenario:** clicking a foundation resource opened the markdown/video in a full-screen `FoundationModal`.
  Thầy: "bỏ bấm vô bài đọc mở modal, render trang mới được không."
- **Chose:** **dedicated page** at `/foundations/[categoryId]/[foundationId]` (`FoundationResourceLayout`):
  breadcrumb → `PageHeader` (H3) + full `FoundationMeta` → `FoundationResourceBody` (markdown/video), capped
  `max-w-3xl`. The list's row click now NAVIGATES (document/video) or `window.open`s (external link) — no overlay.
  Considered a right-side master-detail split but rejected: the learn shell already has a left rail → 3 columns,
  cramped, needs a mobile fallback.
- **WHY (modal vs page rule):** a **modal is for a short, focused task you return FROM** (confirm, quick form,
  pick one thing) — it traps focus and has no URL. **Substantial, readable, shareable content** (an article, a
  video, a guide) wants a **real page**: its own URL (deep-link + back/forward), breadcrumb escape, full reading
  width, scrolls naturally, works on mobile. Don't trap a document in a modal. A route already existed for the
  item, so the page was the natural fit.
- **Files:** NEW `Foundations/FoundationResourceLayout` + `Foundations/FoundationResourceBody`; route
  `[foundationId]/page.tsx` → the new layout; `FoundationCard` onPress navigates/opens-external; removed the
  list-layout deep-link auto-open effect + deleted the dead `useOpenFoundationResource` hook. The old
  `FoundationModal` + `useFoundationOverlayState` are orphaned → flagged for cleanup (separate task).

### 2026-06-21 — unified shell, NO header divider
- **Scenario:** Drawer and Modal looked different — the Drawer had a `border-b` line between header and body
  (cannon 5.8 mandated it), the Modal didn't. The same line showed up in the new content-AI chat popover.
- **Chose (direction A):** **one shell for both, NO divider.** Header (`CloseTrigger` + title via
  `Modal.Heading` / `Drawer.Heading`) ↔ body separated by **whitespace only** (header-wrapper padding + body
  padding). Removed `<div className="border-b" />` from all 6 drawers + the chat popover header.
- **WHY:** thầy chốt A — khớp gu nhà "content-first, whitespace > divider, design restraint"; modal + drawer
  giờ đồng bộ. Ref: modern modals (Linear / Vercel / Stripe) tách bằng khoảng trắng, không kẻ đường header.
- **Files:** `drawers/{ContentAiChatDrawer, E2eResultDrawer, MindMapContentDetailsDrawer,
  PersonalProjectTaskAttemptsDrawer, SubmissionAttemptsDrawer, UserCvSubmissionAttemptsDrawer}/index.tsx`,
  `features/learn/ContentAiFab/index.tsx` (popover header); `cannon/CONTENT.md` SLICE 5.8 updated.
- **Scope kept:** the 3 modal `border-b` left in place (`FeedbackCardSkeleton`, `GlobalSearchModal`
  input↔results, `MilestoneFeedbackCard`) — those are CONTENT dividers inside the body, not the header→body
  shell line.

## Gotchas
- An "overlay header divider" = a `border-b` line between header and body. Don't add one (cannon 5.8). For a
  scrollable body that needs a "stuck header" cue, use HeroUI `ScrollShadow` on the body (shadow appears only
  on scroll) — never a static line.
