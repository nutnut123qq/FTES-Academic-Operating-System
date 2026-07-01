# PageHeader

A tier-3 presentational block that renders a page or section header with an optional breadcrumb row, a title, an optional description, and optional right-aligned action controls.

## When to use

- Use at the top of any page or major section that needs a title, subtitle, and/or CTA buttons in a standard layout.
- Use when you need a breadcrumb trail above the title (e.g. Settings > Notifications).
- **Do not use** when you need a full hero banner with background images or gradients — reach for a bespoke hero section instead.
- **Do not use** when you only need a label with no description or actions — a plain `<h1>` or the `StatPair` block is simpler.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `React.ReactNode` | — | **Required.** Primary heading rendered `text-xl font-medium text-foreground`. |
| `description` | `React.ReactNode` | `undefined` | Supporting copy below the title, rendered `text-sm text-muted`. |
| `breadcrumb` | `React.ReactNode` | `undefined` | Small row rendered above the title row; pass a HeroUI `<Breadcrumbs>` or plain anchor chain. |
| `actions` | `React.ReactNode` | `undefined` | Right-aligned slot for `<Button>` elements or any control group. |
| `className` | `string` | `undefined` | Extra Tailwind classes forwarded to the outer wrapper `<div>`. |

## Usage

```tsx
import React from "react"
import { Button } from "@heroui/react"
import { PageHeader } from "@/components/blocks"

export const UsersPage = () => (
    <div className="flex flex-col gap-6 p-6">
        <PageHeader
            breadcrumb={
                <span>
                    <a href="/dashboard">Dashboard</a>
                    {" / "}
                    <span>Users</span>
                </span>
            }
            title="Manage Users"
            description="View, invite, and remove learners from the platform."
            actions={<Button size="sm">Invite user</Button>}
        />
        {/* page body ... */}
    </div>
)
```

## Composes

None — leaf block. Uses only HeroUI `cn` utility for class merging and standard Tailwind tokens.

## Notes

- **No card wrapper.** `PageHeader` is deliberately frameless. Wrap it in a `SectionCard` (from `@/components/reuseable`) only if you need a bordered surface.
- **`title` is rendered as `<h1>`.** If the header sits inside a subsection (not the top of the page), consider passing a `<span>` as `title` and styling the outer `<h1>` at the page level to keep the document outline correct.
- **Spacing tokens.** Gap between breadcrumb row and the title row is `gap-1.5` (coupled); gap between title column and actions is `gap-3` (same-function). Override via `className` only if a specific layout demands it.
- **`actions` is `shrink-0`.** Long titles will wrap before the action slot is ever compressed.
- **Accessibility.** The block renders no ARIA roles beyond the semantic `<h1>`. If used purely as a section sub-header, pass `role="heading" aria-level={2}` wrapped around the `title` node, or use a custom element as `title`.
