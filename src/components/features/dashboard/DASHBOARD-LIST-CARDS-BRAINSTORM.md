# Dashboard list-cards — UX brainstorm (2026-06-25)

> Render the dashboard "Nổi bật tuần này" (tab=explore) and "Khóa học của tôi" (tab=courses)
> blocks as a proper **LabeledCard + list**. Rule-application, not a from-scratch rethink.
> NO code here. After thầy picks the row-skin → `/starci-fe-ux-apply`.

## 0. Targets & files
- **Trending** — `features/dashboard/TrendingContents/index.tsx` (mounted by `FeedTabs` on tab=explore).
- **My courses** — `features/dashboard/CoursesTab/MyCoursesProgress/index.tsx` (wrapped by `CoursesTab` LabeledCard).

## 1. What's actually wrong today (grounded)
Both blocks **already use `LabeledCard`** (label + icon outside the card). The gap is the **body**: rows are
ad-hoc `<div>`s, not a list.
- **Trending**: row = `<div flex justify-between>` → `EntityToken` (title, only the title is clickable) + a
  muted "N lượt đọc" span. No separators, no per-row hover, only the title is a tap target.
- **My courses**: row = `<div flex>` → `IconTile` + `EntityToken` title + percent + `SegmentBar`. Again only
  the title navigates; the rest of the row is dead space. Two rows stacked with `gap-3`, no list affordance.

→ Neither reads as a "list of tappable items"; they read as text stacked inside a box.

## 2. The rule that decides the structure
- A `SurfaceListCard` is its **own** bordered surface (`rounded-3xl border bg-surface`). Nesting it inside
  `LabeledCard`'s default `<Card>` = **card-in-card** → forbidden ([[concepts/card]] / [[surface-in-surface-inner-has-border]]).
- → To get the "list card" look, use **`LabeledCard frameless`** (label outside, no inner Card) + **one
  `SurfaceListCard`** as the body. The list IS the bounded surface.
- Each item is a **bounded object in one surface, not N separate cards** ([[item-card-meta-inside-bounded-object]]):
  rows separated by **inset separators**, the whole row clickable + hover ([[interactive-needs-hover]]).
- Refs: [[elements/card]] §2 (LabeledCard), §3c (SurfaceListCard interactive) · [[elements/list]] §1 (ListRow) ·
  [[dashboard-labeledcard-and-tabscard]] (section heading → LabeledCard).

## 3. Two row-skins (see widget)
| Skin | Structure | Reads as | Verdict |
|------|-----------|----------|---------|
| **A** | `LabeledCard frameless` + `SurfaceListCard` (rows = `SurfaceListCardRow`/`Item`, inset separators, hover `bg-default`, whole row → navigate) | a tappable list of items | ✅ **recommend** |
| **B** | `LabeledCard` framed + `ListRow` (rows `py-2`, hover `bg-surface-secondary`, thin dividers) | a softer list inside a card | lighter, but row affordance subtler |

Both are rules-valid. **A** is the clearer "list card" the screenshots are asking for, and makes the **whole
row** a tap target (today only the title navigates) — a real affordance win.

## 4. Per-block IA (Skin A)

### Trending — `LabeledCard frameless` ("Nổi bật tuần này", FlameIcon) + `SurfaceListCard`
- Row = `SurfaceListCardRow`: `title` = lesson title (truncate), `meta` = "N lượt đọc", `onPress` → resolve
  `globalId` → navigate. Optional `leading` = **rank number** (1,2,3…) since the list is ranked by `readCount`
  — cheap, derived, adds "trending" meaning.
- Empty/error: **self-hiding** stays OK (passive nudge, shows on both feed tabs — [[dashboard-labeledcard-and-tabscard]]).

### My courses — `LabeledCard frameless` ("Khóa học của tôi", GraduationCapIcon) + `SurfaceListCard`
- Row = `SurfaceListCardRow` (or `SurfaceListCardItem` for the custom progress body) + `onPress` → navigate:
  - `leading` = `IconTile` (course `thumbnailUrl`, fallback icon).
  - `title` = course `label` + `meta` = percent (`Σcompleted/Σtotal` across the 3 dims).
  - `subtitle` = `SegmentBar` (content/challenge/milestone) + the 3 stat dots line.
  - `trailing` = caret (whole row navigates).
- Empty: **render an empty-state** (not self-hide) — this is the main content of tab=courses; show "Chưa ghi
  danh khóa nào" + CTA "Khám phá khóa học" ([[labeled-section-render-empty-not-self-hide]]). (Trending differs:
  it's a side nudge → self-hide.)

## 5. Section → data map
| Section | Source (hook → fields) |
|---------|------------------------|
| Trending rows | `useQueryTrendingContentsSwr` → `globalId`, `title`, `readCount` (+ derived rank index) |
| My-course rows | `useQueryMyCoursesSwr` → `globalId`, `label`, `thumbnailUrl`, `{content,challenge,milestone}{Completed,Total}` |
| Percent | derived `Σcompleted / Σtotal` (already computed in `MyCoursesProgress`) |
| Navigation | `EntityToken`/`queryResolveRoute(globalId)` → `router.push` (whole-row onPress) |

## 6. Cut / add
- **Cut:** ad-hoc `<div>` rows; the title-only tap target.
- **Add:** one `SurfaceListCard` surface per block, inset separators, **whole-row click + hover**, optional
  trending rank number, a real empty-state for my-courses.
- **Keep:** existing `LabeledCard` label+icon, `IconTile`, `SegmentBar`, percent calc, SWR hooks (no BE change).

## 7. CHỐT (thầy duyệt 2026-06-25) + ĐÃ APPLY
- **Row skin = A** — `LabeledCard frameless` + `SurfaceListCard`, whole-row clickable + hover `bg-default`, inset separators. Áp cho **cả 2 khối**.
- **Trending: rank number (1·2·3…, top-3 `text-accent`) + title; BỎ "N lượt đọc"** (mọi readCount hiện = "1" → low-signal; rank đã hàm ý most-read). ← reconcile với brainstorm cũ `TrendingContents/UX-BRAINSTORM.md` (Hướng B): giữ rank + drop count của B, nhưng dùng **SurfaceListCard skin** (A) cho đồng bộ với courses. Bật lại count làm `meta` khi reads phân hoá.
- **My-courses**: row = IconTile + title + `completionPercent`% + SegmentBar + caret, cả dòng → resolve route. Empty → EmptyContent (centered); error → retry.
- **Gốc `.card` = `overflow-visible`** → KHÔNG dùng `LabeledCard flushContent` + bare rows (hover bleed góc bo); phải frameless + `SurfaceListCard` (bake `overflow-hidden rounded-3xl border`).
- **Block changes:** `SurfaceListCardItem` thêm `onPress`/`href`/`isDisabled` (free-form row click được, cho course row có SegmentBar mà `SurfaceListCardRow` slot cố định không chứa được). Tách `useResolveRouteNavigation` từ `EntityToken` (whole-row navigate dùng chung).
- tsc + eslint sạch. **Chưa verify mắt** (cần FE dev server + full stack).
