# PaginatedList

A tier-3 presentational block that orchestrates exactly one of four render branches (error / loading / empty / data) based on boolean flags, with no data fetching or internal state.

## When to use

- Use when a page or panel shows a list fetched from an API and needs consistent handling of all four lifecycle states.
- Use when the caller already owns the data, loading, and error state (e.g. from SWR) and just needs a container that picks the right slot.
- **Do not use** when there is only one possible state (e.g. a static list) — render `children` directly instead.
- **Do not use** when the pagination control is part of the data-fetching logic itself; manage that in the parent and pass the rendered control as the `pagination` slot.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | The actual list content. Rendered in the data branch only (no error, not loading, not empty). |
| `isLoading` | `boolean` | `undefined` | When true, renders the `skeleton` slot. Priority: error > loading. |
| `error` | `boolean` | `undefined` | When true, renders the `errorState` slot. Highest priority — overrides loading, empty, and data. |
| `isEmpty` | `boolean` | `undefined` | When true (and not loading or error), renders the `emptyState` slot. |
| `skeleton` | `ReactNode` | `undefined` | Slot shown while `isLoading` is true. Typically a skeleton placeholder matching the list layout. |
| `emptyState` | `ReactNode` | `undefined` | Slot shown when `isEmpty` is true. Typically an illustration with a hint or CTA. |
| `errorState` | `ReactNode` | `undefined` | Slot shown when `error` is true. Typically an error illustration with a retry affordance. |
| `pagination` | `ReactNode` | `undefined` | Pagination control appended after `children` in the data branch. Omit when there is only one page. |
| `className` | `string` | `undefined` | Extra Tailwind classes merged onto the root `<div>` via `cn`. Inherited from `WithClassNames<undefined>`. |

## Usage

```tsx
import { PaginatedList } from "@/components/blocks"
import useSWR from "swr"

const CourseList = () => {
    const { data, isLoading, error } = useSWR("/api/courses", fetcher)

    return (
        <PaginatedList
            isLoading={isLoading}
            error={!!error}
            isEmpty={!isLoading && !error && data?.items.length === 0}
            skeleton={<CourseListSkeleton />}
            emptyState={<EmptyState message="No courses found." />}
            errorState={<ErrorState onRetry={() => mutate()} />}
            pagination={<CoursePagination total={data?.total} />}
        >
            {data?.items.map((course) => (
                <CourseCard key={course.id} course={course} />
            ))}
        </PaginatedList>
    )
}
```

## Composes

- `cn` from `@heroui/react` — for className merging on the root div.
- No other HeroUI components, blocks, or reuseable components — leaf orchestrator.

## Notes

- **Render priority is fixed:** `error` beats `isLoading` beats `isEmpty` beats data. If `error` and `isLoading` are both true, `errorState` renders.
- **All slots are optional.** If a flag is true but its corresponding slot prop is omitted, nothing renders for that branch (the div is still present).
- **Root layout:** the wrapper is always `flex flex-col gap-6`. Pass `className` to override spacing or add a max-width.
- **Pagination is data-branch only.** The `pagination` slot is never rendered in the loading, error, or empty branches.
- **No state, no effects.** This block is a pure function of its props. Stale-while-revalidate patterns (e.g. SWR `isValidating` vs `isLoading`) should be resolved by the caller before passing flags in.
