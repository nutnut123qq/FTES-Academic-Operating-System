## Why

The community feed tab strip is currently fully transparent (`rgba(0,0,0,0)` with only `backdrop-blur`). When the user scrolls, feed posts slide up *under* the strip and show through, making it look like the header/tab is overlapping/clipping body content. Additionally, the strip is not actually sticky because `relative` overrides `sticky`, so it drifts up instead of pinning under the site header.

## What Changes

In `src/components/features/community/CommunityShell/index.tsx`:

- Add an opaque background to the tab strip using the same token as the site header (`bg-background`) so scrolled content is hidden behind it.
- Remove the `relative` class so `sticky` is effective and the strip pins at `top-16` directly under the `h-16` site header.
- Keep the existing tabs, dropdown, rails, grid layout, and backdrop-blur unchanged.

Trade-off accepted: the ambient meteor effect will no longer show through the tab strip.

## Capabilities

### New Capabilities
- `community-tab-strip-opaque`: Community tab strip renders with an opaque background and correct sticky positioning.

### Modified Capabilities
- None (pure visual/positional fix, no behavioral spec change).

## Impact

- `src/components/features/community/CommunityShell/index.tsx` only.
