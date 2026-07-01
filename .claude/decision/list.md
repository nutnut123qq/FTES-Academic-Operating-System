# Decision — list

When & WHY we choose/shape the **list** block. A decision log: for a given scenario, which component we
picked and the reasoning — so next time we design a list, we reuse the house's logic instead of guessing.
Rows + paginated lists.

**StarCi blocks in this family:** `ListRow`, `PaginatedList`

> Grows automatically: at the END of each `/starci-fe-ux-apply`, the decision for this block (scenario →
> choice → why) is appended below. No manual command.

## Decisions (newest first)

### 2026-06-21 — Foundations landing: pressable cards → link + caret list
- **Scenario:** the course-learn Foundations landing (`/learn/foundations`) rendered its ~10 tech topics
  (Docker, Kubernetes, Node.js…) as a 3-col grid of big `PressableCard`s — each a 16:9 brand banner +
  H4 title + 3-line description. Thầy: "bỏ pressable card, làm cái link và caret".
- **Chose (direction A):** one **joined `SectionCard`** holding a `ListRow` per topic — small square brand
  thumbnail (leading) + title + **one-line** description (subtitle) + trailing **`CaretRightIcon`**, dividers
  between rows. Feature (`FoundationCategoryCard`) keeps ONLY the select-dispatch + navigation; the row owns
  all styling.
- **WHY (the reusable rule):** a list whose only job is **navigate-to-detail** wants the lightest affordance —
  link + caret — not a heavy card. Big pressable cards are for **marketing / hero / pick-one-of-few** surfaces
  where the art *is* the value; a 10-item topic index is a nav list, so the banner-card weight was vanity and
  hurt scan speed. The caret is the house "drills in" signal.
- **On-canon win:** the swap also killed the old card's cannon violations — feature-level `card card--default
  !p-0 hover:bg-accent/5` painting + the `!important` smell + `Typography h4` oversized title — all gone now
  that the block (`ListRow`) owns the look.
- **Mechanics:** reused the existing `FoundationCategoryThumbnail` at `size-10 aspect-square rounded-md` for the
  leading (className override, `object-cover` crops the 16:9 art); muted caret = `text-muted`; skeleton uses the
  compound **`Skeleton.ListRow`** (NOT a standalone `SkeletonListRow` export) with a divider className. Joined
  list = `SectionCard contentClassName="gap-0"` so rows sit flush with `divider` borders.
- **Files:** `Foundations/FoundationCategoryCard/index.tsx` (→ `ListRow`), `…/FoundationCategoryCardSkeleton`
  (→ `Skeleton.ListRow`), `Foundations/FoundationsCategoryGrid/FoundationsCategoryGridBody` (grid → joined
  list). tsc + eslint clean. See [[card]] for the inverse "when a pressable card IS right".
- **Refinement (same task, thầy feedback):**
  - **Square brand logo for the leading, NOT the 16:9 banner.** The synced `thumbnailUrl` is wide artwork that
    crops to a dark blob in a small square. Ship a **local square SVG** per known topic in `/public/foundations/`
    and render it `object-contain p-2` (a centred mark — `object-cover` is for full-bleed banners only). Resolver
    `shared/foundation-logo.ts` keys by the **normalised title** (strip "Nền tảng"/"Foundation"/".js"/spaces) so
    it's locale-robust; unmapped topics fall back to the banner. (Shipped 7: docker, k8s, node, react, go, spring,
    playwright; nestjs / next / .net still fall back until their SVGs land.)
  - **Joined list = card `!p-0` "accordion-surface", not a real accordion.** Thầy: "accordion thì card phải
    p-0… cái này không phải accordion, chỉ dùng className." → container = `card card--default !p-0
    overflow-hidden` (the HeroUI `Accordion variant="surface"` look) so rows go **edge-to-edge with full-width
    dividers**; rows get `rounded-none px-3` (flush square hover, own horizontal padding since the card no longer
    pads). The `!p-0` is OK here — it overrides the HeroUI `.card--default` recipe, NOT our own code (see [[card]]
    golden-rule nuance). Don't reach for the real `Accordion` component when you only want its surface skin.
- **Extended to the detail page (same pattern, "tương tự"):** the per-category resource list (`FoundationsList`
  → `FoundationCard`) got the identical treatment — grid of pressable cards → joined `!p-0` link+caret list.
  Items are richer than categories, so: leading = the resource's own square thumbnail (`object-cover`, real
  video/article art — not a brand logo); the resource **KIND chip** (+ "recommended" badge) goes in the row
  `meta` slot; **tags + author were dropped** for the compact row (thầy approved). `FoundationCardSkeleton` →
  `Skeleton.ListRow`. Files: `FoundationCard`, `FoundationCardSkeleton`, `FoundationsList`.
- **Width cap (thầy: "nhớ max-w cho nội dung bên trong"):** both foundations pages cap content at
  **`mx-auto max-w-3xl`** on the page wrapper (`Foundations/index.tsx` detail + `FoundationsCategoryGrid/index.tsx`
  landing) so breadcrumb + header + list share ONE reading-column width and the list never stretches edge-to-edge
  on wide monitors. Single-column joined lists read best capped at the 3xl reading column (same cap as the lesson
  reader). See [[page-header]] for the shared-cap layout rule.

## Gotchas
_(empty)_
