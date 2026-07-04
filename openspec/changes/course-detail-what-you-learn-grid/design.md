## Context

`CourseDetail` (`src/components/features/course/CourseDetail/index.tsx`) renders the course detail/sales page. The "What you'll learn" section is currently an inline `<div>` with a `Typography h6` heading and a `CheckIcon`-led grid. Starci's `CourseValueProps` implements the desired section pattern using the shared `LabeledCard` and `CheckCircleIcon` blocks, so we will port that structural pattern rather than invent a new component.

## Goals / Non-Goals

**Goals:**
- Match the Starci reference: icon-led section label + check-list grid.
- Keep the existing two-column sales layout and section ordering intact.
- Reuse existing primitives (`LabeledCard`, `Typography`, Phosphor icons).
- Preserve the `whatYouLearn: Array<string>` contract.
- Hide the section entirely when the list is empty.

**Non-Goals:**
- No API contract changes.
- No new dependencies or icon libraries.
- No color-system changes; keep FTES `accent`/`muted`/`separator` tokens.
- No changes to the hero, syllabus, reviews, instructor card, pricing rail, or page-level `AsyncContent`.

## Decisions

1. **Section wrapper — reuse `LabeledCard` with `frameless`**
   - Rationale: `LabeledCard` is the canonical FTES section header block. `frameless` avoids card-in-card because the body is itself a layout (a grid), not content that needs an inner card.
   - The block renders the label as a `Label` and accepts an `icon` slot; we pass `SealCheckIcon` to match the Starci header pattern.

2. **Body layout — inline 2-column grid, not `CheckListCard`**
   - Rationale: `CheckListCard`/`CheckListItem` are built for a single-column surface list with inset row separators. The requested layout is a grid, so a small inline `<ul>` grid is the simplest, correct structure. We still reuse the same `CheckCircleIcon` and `Typography` primitives used by `CheckListItem`.

3. **Check icon — `CheckCircleIcon` outline, `text-accent`**
   - Rationale: The reference shows a circular outline tick. `CheckCircleIcon` (default Phosphor weight) provides that shape. `text-accent` is the current FTES accent token, already used for the existing `CheckIcon` and star ratings, so no new color is introduced.

4. **Empty state — return `null` for the whole section**
   - Rationale: The Starci pattern hides the entire block when the value-prop list is empty. Guarding with `course.whatYouLearn.length > 0` avoids an orphan heading or empty card.

5. **Skeleton — mirror the new section structure**
   - Rationale: The existing skeleton uses one tall `h-40` placeholder for this region. Replace it with a section heading bar plus a 2-column grid of icon + text placeholders so the loading layout matches the resolved layout and prevents CLS.

## Risks / Trade-offs

- **[Risk]** `LabeledCard` uses a HeroUI `Label` for the title, which looks slightly different from the previous `Typography type="h6" weight="bold"`.
  - **Mitigation:** `LabeledCard` is the canon section header block across FTES AOS; the change aligns the section with the rest of the page.
- **[Risk]** A 2-column grid can make uneven line counts more visible.
  - **Mitigation:** Items are single-line `body-sm` text with `min-w-0` truncation; the grid gap keeps rows readable.

## Migration Plan

Not applicable — this is a client-side UI change with no deployment steps beyond a normal build.

## Open Questions

_None._
