## Context

`CourseDetail` (`src/components/features/course/CourseDetail/index.tsx`) renders the course detail/sales page. The "What you'll learn" section currently uses a plain `CheckIcon`-led grid under a `Typography h6` header. The Starci reference keeps the same header style as neighbouring sections and renders the value props as a concise check-list grid, so we adopt that layout while preserving FTES's existing section header convention.

## Goals / Non-Goals

**Goals:**
- Match the Starci reference: consistent section header + 2-column check-list grid.
- Keep the existing two-column sales layout and section ordering intact.
- Reuse existing primitives (`Typography`, Phosphor icons).
- Preserve the `whatYouLearn: Array<string>` contract.
- Hide the section entirely when the list is empty.

**Non-Goals:**
- No API contract changes.
- No new dependencies or icon libraries.
- No color-system changes; keep FTES `accent`/`muted`/`separator` tokens.
- No changes to the hero, syllabus, reviews, instructor card, pricing rail, or page-level `AsyncContent`.

## Decisions

1. **Section header — keep `Typography type="h6" weight="bold"`**
   - Rationale: The syllabus, reviews, and instructor sections all use the same plain `Typography h6` header. Keeping the header identical preserves visual rhythm and avoids introducing a one-off `LabeledCard` style for this section alone.

2. **Body layout — inline 2-column grid, not `CheckListCard`**
   - Rationale: `CheckListCard`/`CheckListItem` are built for a single-column surface list with inset row separators. The requested layout is a grid, so a small inline `<ul>` grid is the simplest, correct structure. We still reuse the same `CheckCircleIcon` and `Typography` primitives used by `CheckListItem`.

3. **Check icon — `CheckCircleIcon` outline, `text-accent`**
   - Rationale: The reference shows a circular outline tick. `CheckCircleIcon` (default Phosphor weight) provides that shape. `text-accent` is the current FTES accent token, already used for the previous `CheckIcon` and star ratings, so no new color is introduced.

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
