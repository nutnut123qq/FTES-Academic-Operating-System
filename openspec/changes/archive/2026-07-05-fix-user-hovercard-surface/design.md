## Context

`UserHovercard` controls the popup open state manually so it can keep the card open during the pointer grace period and let taps navigate through the trigger. Because the `<Popover.Content>` is rendered outside `<Popover.Root>`, HeroUI does not inject the `popover` slot class that supplies the surface, shadow, radius, and motion CSS. The popup therefore renders transparently and without transition.

## Goals / Non-Goals

**Goals:**
- Give the hovercard popup an opaque, bordered, rounded, shadowed surface that sits above the feed.
- Make the popup appear and disappear smoothly using the existing design-system motion.
- Match the tokens and spacing conventions used by other floating surfaces in the repo.

**Non-Goals:**
- Changing hover/focus/grace-period/keyboard logic.
- Adding new animation libraries or dependencies.
- Modifying any file other than `UserHovercard/index.tsx`.

## Decisions

- **Apply the HeroUI `popover` recipe directly.** The canonical HeroUI popover styles (`@heroui/styles/dist/components/popover.css`) already define the correct surface (`bg-overlay`), shadow (`--shadow-overlay`), radius, and `data-entering`/`data-exiting` animations. Adding the `popover` class to the controlled `<Popover.Content>` restores the missing surface and motion without inventing a one-off style.
- **Add a semantic border with `border-default`.** The HeroUI recipe omits a border; every repo floating surface (e.g., `SearchInput` dropdown, `ContributionCalendarView` tooltip, `CourseHoverPreview`) includes a border for definition. `border-default` is the repo token used by bounded surface cards.
- **Let the arrow inherit `--overlay`.** The `.popover` CSS rule `fill: var(--overlay)` targets `[data-slot="popover-overlay-arrow"]`, so the existing `<Popover.Arrow>` automatically matches the card background once the `popover` class is present.
- **Keep the content slot `p-0`.** Inner content (`UserLink`) already supplies its own `p-4`, so the shell stays padding-free to avoid double padding.

## Risks / Trade-offs

- **[Risk] The `popover` class could change in a future HeroUI upgrade.** → Mitigation: it is a public slot class; any change would also affect every other popover in the app, making it visible and centralized.
- **[Risk] `border-default` may look heavier than HeroUI's default shadow-only popover.** → Mitigation: `border-default` is the same token already used for `SurfaceListCard`, `CheckListCard`, and other bounded surfaces, so it keeps the app consistent.
