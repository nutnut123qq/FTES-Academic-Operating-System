# Decision — avatar

When & WHY we choose/shape the **avatar** block. A decision log: for a given scenario, which component we
picked and the reasoning — so next time we design a avatar, we reuse the house's logic instead of guessing.
Avatars, user cells, icon tiles, uploads.

**StarCi blocks in this family:** `AvatarGroup`, `UserCell`, `IconTile`, `AvatarUploadButton`, `ImageDropzone`, `BrandLogo`

> Grows automatically: at the END of each `/starci-fe-ux-apply`, the decision for this block (scenario →
> choice → why) is appended below. No manual command.

## Decisions (newest first)

### 2026-06-21 — `IconTile` is the standard list-row leading (cover thumbnail + icon fallback)
- **Scenario:** the foundations resource rows used a bespoke `FoundationItemThumbnail` (`size-10` box) whose
  fallback `StackIcon` was hard-coded `size-14` → the icon overflowed the small tile and looked "bụ" (chunky).
  Thầy: "cái icon thumb hơi bụ, trò có dùng IconTile không?"
- **Chose:** swap the leading to the block **`IconTile size="sm"`** (`src={thumbnailUrl}` cover for real
  video/article thumbnails, `icon={<StackIcon />}` fallback). `IconTile` **auto-sizes the icon** (`[&_svg]:size-6`
  in the `sm` tile) so the fallback never overflows — the "bụ" problem is structural to bespoke boxes that don't
  size their own icon.
- **WHY / when to use which:** `IconTile` is the default leading for any list row whose art is a **photo / 16:9
  thumbnail (cover)** or a plain icon. Reserve the bespoke `object-contain` box ONLY for brand **LOGOS** that must
  keep their silhouette + padding (the category page — see Gotcha). Don't hand-roll a thumbnail box when `IconTile`
  fits; you'll re-introduce the icon-sizing bug.
- **Files:** `Foundations/FoundationCard` (→ `IconTile`). Categories keep `FoundationCategoryThumbnail` (contain).

## Gotchas
- **`IconTile` is cover-only by design — don't add a `fit`/`contain` prop to it (thầy, 2026-06-21).** It frames an
  icon OR a photo/16:9 thumbnail (`object-cover`). For a **brand LOGO** that needs `object-contain` + padding
  (Docker/K8s/Node marks on the foundations list), keep the small bespoke thumbnail box (e.g.
  `FoundationCategoryThumbnail` with `object-contain p-2`) — or reach for the `BrandLogo` block — rather than
  bending `IconTile`. Keep the shared block lean.
