# UserCell

A tier-3 presentational block that renders a compact person row (avatar + name + optional handle) with an optional right-aligned trailing slot.

## When to use

- **Use** when you need a consistent single-line person representation: follower lists, comment authors, leaderboard rows, search results, or any feed item that shows a user.
- **Use** when you need to attach a follow button, status chip, or any action control aligned to the right — pass it via `trailing`.
- **Do not use** when you only need an avatar without any text — reach for `UserAvatar` (reuseable) directly.
- **Do not use** when the cell itself must be clickable/pressable — wrap `UserCell` in an `<a>` or `<button>` at the call site; `UserCell` is pure presentational and owns no interaction.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `username` | `string` | — | Account username; drives the avatar seed/fallback and is the default display label. |
| `displayName` | `string` | `username` | Human-friendly name shown as the primary label; falls back to `username` when omitted. |
| `avatar` | `string \| null` | `undefined` | Uploaded avatar URL. Resilient fallback chain is handled internally by `UserAvatar`. |
| `handle` | `string` | `undefined` | Secondary line shown below the name (e.g. `@username`). Hidden when omitted. |
| `size` | `"sm" \| "md"` | `"sm"` | Visual density; controls the avatar preset size. |
| `trailing` | `React.ReactNode` | `undefined` | Optional right-aligned slot — a follow button, chip, timestamp, etc. |
| `className` | `string` | `undefined` | Extra Tailwind classes merged onto the outer flex container via `cn`. |

## Usage

```tsx
import React from "react"
import { UserCell } from "@/components/blocks"
import { Button } from "@heroui/react"

export const FollowerRow = () => (
    <UserCell
        username="starci183"
        displayName="StarCi"
        avatar="https://cdn.starci.vn/avatars/starci183.webp"
        handle="@starci183"
        size="md"
        trailing={
            <Button size="sm" variant="bordered" onPress={() => {}}>
                Follow
            </Button>
        }
    />
)
```

## Composes

- **`UserAvatar`** (`@/components/reuseable`) — supplies the avatar with consistent fallback behavior across the app.
- **`cn`** from `@heroui/react` — merges `className` onto the root element.

## Notes

- The text column uses `min-w-0` + `truncate` so long display names or handles do not overflow in narrow containers (sidebars, mobile viewpoints).
- `trailing` is pinned with `ml-auto shrink-0`, so it never gets squeezed regardless of how long the name column is.
- The block is **pure props-only** — it reads no store and fires no side effects. All data (including whether the viewer follows this user) must be resolved by the caller.
- Gap between name and handle is `gap-0` (semantic spacing scale: tightly coupled content, same block).
- `handle` is rendered as plain text; if you need it to be a clickable link, pass the anchor element inside `trailing` instead.
