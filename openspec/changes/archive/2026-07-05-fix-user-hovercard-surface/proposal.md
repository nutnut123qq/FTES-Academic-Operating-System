## Why

The `UserHovercard` popup renders without a visible surface because its controlled `<Popover.Content>` is detached from `<Popover.Root>` and no longer receives HeroUI's default popover styling. The result is a transparent card that overlaps the feed text behind it and appears/disappears instantly without motion, making the UI feel broken and jarring.

## What Changes

- Restore the HeroUI popover surface recipe on the controlled `<Popover.Content>` in `src/components/blocks/identity/UserHovercard/index.tsx`.
- Add a consistent semantic border to the popup shell.
- Ensure the popover arrow fills with the same surface color.
- Re-enable the built-in HeroUI popover enter/exit animation (fade + slight zoom/slide) without adding new animation libraries.
- Keep all existing interaction behavior unchanged: open/close delays, grace period, `Esc` close, click/tap navigation, touch suppression, and keyboard focus handling.

## Capabilities

### New Capabilities

- `user-hovercard-surface`: Visual shell and motion behavior for the user hovercard popup.

### Modified Capabilities

- (none)

## Impact

- Affected file: `src/components/blocks/identity/UserHovercard/index.tsx` only.
- No API, dependency, or behavioral changes.
