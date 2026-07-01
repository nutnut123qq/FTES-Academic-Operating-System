# Timeline

Vertical timeline wrapper that stacks row blocks beside a left connector line — a tier-3 presentational block.

## When to use

- Wrapping a list of `FeedItem` rows to give them a GitHub-style activity timeline appearance.
- Displaying ordered attempt or submission history where vertical flow and a connector line add clarity.
- Any vertical sequence where the connector line communicates "these items belong to one thread."
- **Not** for tabular data (use `ListRow` / a table instead) or for unordered grids.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Row blocks to render. Each child sits beside the connector line; Timeline supplies only spacing and the line. |
| `className` | `string` | `undefined` | Extra Tailwind classes merged onto the root container. |
| `classNames` | `undefined` | `undefined` | Reserved by `WithClassNames` contract; no sub-slots on this block. |

## Usage

```tsx
import React from "react"
import { Timeline, FeedItem } from "@/components/blocks"
import { UserAvatar } from "@/components/reuseable"

const activities = [
    { id: "1", text: "Completed lesson: Intro to REST", time: "2 hours ago", username: "alice" },
    { id: "2", text: "Submitted challenge: Build a CRUD API", time: "Yesterday", username: "alice" },
    { id: "3", text: "Enrolled in System Design Mastery", time: "3 days ago", username: "alice" },
]

export const ActivityFeed = () => (
    <Timeline>
        {activities.map(({ id, text, time, username }) => (
            <FeedItem
                key={id}
                leading={<UserAvatar username={username} size="sm" />}
                timestamp={time}
            >
                {text}
            </FeedItem>
        ))}
    </Timeline>
)
```

## Composes

None — leaf block. Callers compose it with `FeedItem` (and optionally `UserAvatar`) from `@/components/blocks` and `@/components/reuseable`.

## Notes

- The connector line is `border-l border-separator` on the container itself; children are indented `pl-4` so the line runs cleanly beside them. Adjust indentation by passing a `className` override if rows have a different leading visual size.
- No dot/node marker is rendered at each row. If you need bullet dots, add them inside the row block (e.g. via an absolutely-positioned element in `FeedItem`).
- `classNames` is present in the interface (required by `WithClassNames`) but has no sub-slots; only `className` is functional.
- Accessibility: add `role="list"` on the `Timeline` and `role="listitem"` on each row when the sequence is semantically a list.
