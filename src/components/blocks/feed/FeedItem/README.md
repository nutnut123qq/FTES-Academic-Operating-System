# FeedItem

A generic activity / timeline row that pairs an optional leading visual with a two-line text column (action text + muted timestamp); a tier-3 presentational block.

## When to use

- Rendering a single entry in an activity feed, notification list, or audit log where each row has an action description and a time.
- When the owning feature needs to map an activity type to a visual (avatar, icon) and a localized phrase without coupling layout to data concerns.
- **Not** for rich card-style entries that need images, multiple CTAs, or complex nested layouts — reach for a dedicated feature card block instead.
- **Not** when you need interactive row behavior (clickable rows, hover states, selection) — wrap `FeedItem` in a `<button>` or `<a>` at the call site.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — (required) | Action / activity text describing what happened. Caller is responsible for localization (pass a `t()` result). |
| `timestamp` | `ReactNode` | — (required) | Relative or absolute time, shown muted beneath the action text. Caller-formatted (e.g. `"2 hours ago"`). |
| `leading` | `ReactNode` | `undefined` | Optional leading visual (avatar, icon) rendered at the row's start. Shrinks to content width; omit for a text-only row. |
| `className` | `string` | `undefined` | Extra Tailwind classes merged onto the root `<div>` via `cn()`. |

## Usage

```tsx
import React from "react"
import { FeedItem } from "@/components/blocks"
import { UserAvatar } from "@/components/blocks"

export const RecentActivity = () => (
    <div className="flex flex-col gap-3">
        <FeedItem
            leading={<UserAvatar username="starci183" size="sm" />}
            timestamp="2 hours ago"
        >
            starci183 completed <strong>Lesson 3 — React Server Components</strong>
        </FeedItem>
        <FeedItem
            timestamp="Yesterday"
        >
            You earned the <strong>First Steps</strong> badge
        </FeedItem>
    </div>
)
```

## Composes

- `cn` from `@heroui/react` — class merging utility.
- `WithClassNames<undefined>` from `@/modules/types/base/class-name` — base prop extension (exposes `className`).
- No HeroUI components or other blocks are rendered internally — leaf block.

## Notes

- **Purely presentational.** `FeedItem` holds no state and performs no data fetching. The parent feature is responsible for deriving `leading`, `children`, and `timestamp` from the raw activity record.
- **Text truncation.** The text column has `min-w-0` so long action strings wrap correctly inside flex containers. If you need a single-line truncated variant, add `truncate` via `className` on the children wrapper — or apply it to the children themselves.
- **Timestamp is caller-formatted.** Pass a pre-formatted string or a `<time>` element; `FeedItem` does not call any date library internally.
- **Leading visual sizing.** The `leading` slot is wrapped in `shrink-0` so it never compresses the text column. Keep leading visuals small (icon size or avatar `size="sm"`) to maintain row proportion.
- **Spacing.** Root gap is `gap-2` (coupled-element spacing per the project spacing-scale convention). Vertical gap between action text and timestamp is `gap-0` (tightly coupled pair).
- **No accessibility role.** `FeedItem` renders a plain `<div>`. If the list of items conveys a meaningful sequence, wrap the collection in a `<ul>` / `<li>` or an element with `role="feed"` at the call site.
