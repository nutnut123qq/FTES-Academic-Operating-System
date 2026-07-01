# ErrorState

A centered, danger-toned error placeholder block — tier-3 presentational; it owns no store or data-fetching logic.

## When to use

- A query/fetch has failed and you need to tell the user something went wrong.
- You want to offer a one-click retry action without building custom error UI per feature.
- Inside cards, panels, or full-page areas where content could not load.
- **Do NOT** use it for empty-data scenarios (no error occurred) — reach for an `EmptyState` block instead.
- **Do NOT** use it for inline field validation — use form-level error messages there.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `React.ReactNode` | `undefined` | Primary error headline rendered below the warning icon. Omit to show icon only. |
| `description` | `React.ReactNode` | `undefined` | Secondary muted explanatory line beneath the title. |
| `retryLabel` | `React.ReactNode` | `undefined` | Label for the retry button. Button is hidden unless **both** `retryLabel` and `onRetry` are provided. |
| `onRetry` | `() => void` | `undefined` | Handler invoked when the retry button is pressed. When omitted, no button renders. |
| `className` | `string` | `undefined` | Extra Tailwind classes merged onto the root `div` via `cn()`. |

## Usage

```tsx
import React from "react"
import { ErrorState } from "@/components/blocks"

export const CourseListSection = () => {
    const { data, error, mutate } = useCourses()

    if (error) {
        return (
            <ErrorState
                title="Failed to load courses"
                description="Check your connection and try again."
                retryLabel="Retry"
                onRetry={() => mutate()}
            />
        )
    }

    return <CourseGrid courses={data} />
}
```

## Composes

- **`@gravity-ui/icons` — `TriangleExclamation`**: danger-colored warning icon (`size-8 text-danger`).
- **HeroUI `Button`**: retry button rendered with `variant="secondary"` and `size="sm"`.
- **HeroUI `cn`**: class merging for the `className` override.

## Notes

- The retry button is gated on **both** `retryLabel` and `onRetry` being truthy — supplying one alone renders nothing.
- Root layout is `flex flex-col items-center gap-3 py-6 text-center`; pass `className` to adjust padding or alignment for its container (e.g. `className="py-12"` for full-page errors).
- Text nodes are typed `React.ReactNode` so callers can pass translated strings directly (e.g. `t("error.title")`).
- The icon color (`text-danger`) is intentional and should not be overridden — it signals an error state to the user at a glance.
- No ARIA `role="alert"` is set; if the error appears dynamically after the page loads, wrap with a live region or add `role="alert"` via `className` in the call site.
